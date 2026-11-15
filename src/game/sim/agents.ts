/**
 * Simulated NPCs. Agents move on the world clock whether or not their scene is on screen,
 * so a goon keeps walking towards the lane while you are indoors as somebody else.
 */
import type { CharId, SceneId } from '../types';
import { CHAR_IDS } from '../types';
import { SCENES } from '../data/scenes';
import { ent } from '../runtime';
import { resolve } from '../collision';
import { useGame } from '../store';

export type AgentMode = 'route' | 'goto' | 'investigate' | 'distracted' | 'chase' | 'stalled' | 'idle';

export interface Agent {
  id: string;
  scene: SceneId;
  speed: number;
  route: Array<[number, number, number?]>;
  ri: number;
  wait: number;
  mode: AgentMode;
  target: { x: number; z: number } | null;
  /** world time when a temporary mode ends */
  until: number;
  chase: CharId | null;
  vision: { range: number; fov: number } | null;
  hostile: boolean;
  /** goto arrival event for the director */
  arrive: string | null;
  anim: 'idle' | 'read' | 'sit';
  face: number;
}

export const agents = new Map<string, Agent>();

export function spawnAgent(
  id: string,
  scene: SceneId,
  x: number,
  z: number,
  opts: Partial<Pick<Agent, 'speed' | 'route' | 'vision' | 'hostile' | 'anim' | 'face' | 'mode'>> = {},
) {
  const e = ent(id);
  e.x = x;
  e.z = z;
  e.face = opts.face ?? 0;
  e.speed = 0;
  const a: Agent = {
    id,
    scene,
    speed: opts.speed ?? 1.8,
    route: opts.route ?? [],
    ri: 0,
    wait: 0,
    mode: opts.mode ?? (opts.route?.length ? 'route' : 'idle'),
    target: null,
    until: 0,
    chase: null,
    vision: opts.vision ?? null,
    hostile: opts.hostile ?? false,
    arrive: null,
    anim: opts.anim ?? 'idle',
    face: opts.face ?? 0,
  };
  agents.set(id, a);
  bump();
  return a;
}

function bump() {
  useGame.setState((s) => ({ agentsV: s.agentsV + 1 }));
}

export function despawnAgent(id: string) {
  if (agents.delete(id)) bump();
}

export function clearAgents() {
  agents.clear();
  bump();
}

export function agentGoto(id: string, x: number, z: number, arrive: string | null = null, scene?: SceneId) {
  const a = agents.get(id);
  if (!a) return;
  if (scene && scene !== a.scene) {
    a.scene = scene;
    const e = ent(id);
    e.x = x;
    e.z = z;
  }
  a.mode = 'goto';
  a.target = { x, z };
  a.arrive = arrive;
}

/** Walk over to look at something (a noise, a scream) for a while, then resume the route. */
export function investigate(id: string, x: number, z: number, seconds: number, now: number, mode: AgentMode = 'investigate') {
  const a = agents.get(id);
  if (!a || a.mode === 'chase') return;
  a.mode = mode;
  a.target = { x, z };
  a.until = now + seconds;
}

export function agentsIn(scene: SceneId) {
  return [...agents.values()].filter((a) => a.scene === scene);
}

function stepTowards(a: Agent, tx: number, tz: number, speed: number, dt: number, stopAt = 0.15) {
  const e = ent(a.id);
  const dx = tx - e.x;
  const dz = tz - e.z;
  const d = Math.hypot(dx, dz);
  if (d <= stopAt) {
    e.speed = 0;
    return true;
  }
  const step = Math.min(d - stopAt * 0.5, speed * dt);
  const p = { x: e.x + (dx / d) * step, z: e.z + (dz / d) * step };
  resolve(p, 0.35, SCENES[a.scene]);
  const moved = Math.hypot(p.x - e.x, p.z - e.z);
  e.stride += moved;
  e.speed = moved / Math.max(dt, 1e-4);
  e.x = p.x;
  e.z = p.z;
  e.face = Math.atan2(dx, dz);
  // stuck against something: count it as arrived rather than pushing forever
  return moved < speed * dt * 0.1 && d < 2.5;
}

export type AgentEvent = { kind: 'arrive'; id: string; name: string } | { kind: 'resume'; id: string };

/** Advance all agents. Returns arrival events for the mission director. */
export function tickAgents(dt: number, now: number): AgentEvent[] {
  const events: AgentEvent[] = [];
  const st = useGame.getState();
  for (const a of agents.values()) {
    const e = ent(a.id);
    if (a.mode === 'stalled' || a.mode === 'idle' || (st.dialogue && st.talkingTo === a.id)) {
      e.speed = 0;
      continue;
    }
    if (a.mode === 'chase' && a.chase) {
      const f = ent(a.chase);
      stepTowards(a, f.x, f.z, a.speed * 1.9, dt, 0.6);
      if (now > a.until) {
        a.mode = a.route.length ? 'route' : 'idle';
        a.chase = null;
      }
      continue;
    }
    if ((a.mode === 'investigate' || a.mode === 'distracted') && a.target) {
      const there = stepTowards(a, a.target.x, a.target.z, a.speed * 1.3, dt, a.mode === 'distracted' ? 2.2 : 0.8);
      if (there && a.mode === 'distracted') e.face = Math.atan2(a.target.x - e.x, a.target.z - e.z);
      if (now > a.until) {
        a.mode = a.route.length ? 'route' : 'idle';
        a.target = null;
        events.push({ kind: 'resume', id: a.id });
      }
      continue;
    }
    if (a.mode === 'goto' && a.target) {
      if (stepTowards(a, a.target.x, a.target.z, a.speed, dt)) {
        const name = a.arrive;
        a.mode = 'idle';
        a.target = null;
        a.arrive = null;
        if (name) events.push({ kind: 'arrive', id: a.id, name });
      }
      continue;
    }
    if (a.mode === 'route' && a.route.length) {
      if (a.wait > 0) {
        a.wait -= dt;
        e.speed = 0;
        continue;
      }
      const [x, z, w] = a.route[a.ri];
      if (stepTowards(a, x, z, a.speed, dt)) {
        a.wait = w ?? 0;
        a.ri = (a.ri + 1) % a.route.length;
      }
    }
  }
  return events;
}

function blocked(scene: SceneId, x0: number, z0: number, x1: number, z1: number) {
  const sc = SCENES[scene];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (sc.colliders.some((b) => b.w > 1.5 && b.d > 1.5 && Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2)) return true;
  }
  return false;
}

/** Can this agent see the friend right now? */
export function sees(a: Agent, who: CharId): boolean {
  if (!a.vision) return false;
  const s = useGame.getState();
  if (s.where[who] !== a.scene) return false;
  if (s.hidden[who]) return false;
  const e = ent(a.id);
  const f = ent(who);
  const dx = f.x - e.x;
  const dz = f.z - e.z;
  const d = Math.hypot(dx, dz);
  const range = a.mode === 'chase' ? a.vision.range * 1.5 : a.mode === 'distracted' ? 1.2 : a.vision.range;
  if (d > range) return false;
  if (d > 1.4) {
    let ang = Math.atan2(dx, dz) - e.face;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    if (Math.abs(ang) > a.vision.fov / 2) return false;
  }
  return !blocked(a.scene, e.x, e.z, f.x, f.z);
}

/** Which friends each hostile agent can see. */
export function spotted(): Array<{ agent: Agent; who: CharId }> {
  const out: Array<{ agent: Agent; who: CharId }> = [];
  for (const a of agents.values()) {
    if (!a.hostile) continue;
    for (const c of CHAR_IDS) if (sees(a, c)) out.push({ agent: a, who: c });
  }
  return out;
}
