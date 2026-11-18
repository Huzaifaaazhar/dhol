/**
 * Simulated NPCs. Agents move on the world clock whether or not their scene is on screen,
 * so a goon keeps walking towards the lane while you are indoors as somebody else.
 */
import type { CharId, SceneId } from '../types';
import { CHAR_IDS } from '../types';
import { SCENES } from '../data/scenes';
import { ent } from '../runtime';
import { resolve } from '../collision';
import { useGame, bark } from '../store';

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
  /** waypoints of a trip that may pass through doors into other scenes */
  legs: Leg[];
  /** the scene the patrol route belongs to; agents who wander off walk back to it */
  routeScene: SceneId;
  /** heading back to the route after leaving its scene */
  backToRoute: boolean;
  /** an everyday round of stops, possibly in several buildings */
  tour: TourStop[] | null;
  ti: number;
  dwell: number;
}

export interface Leg {
  x: number;
  z: number;
  /** reaching this point means stepping through a door into another scene */
  cross?: { scene: SceneId; x: number; z: number; face: number };
}

export interface TourStop {
  scene: SceneId;
  x: number;
  z: number;
  face?: number;
  stay: number;
  anim?: Agent['anim'];
  say?: string;
}

export const agents = new Map<string, Agent>();

export function spawnAgent(
  id: string,
  scene: SceneId,
  x: number,
  z: number,
  opts: Partial<Pick<Agent, 'speed' | 'route' | 'vision' | 'hostile' | 'anim' | 'face' | 'mode' | 'tour'>> = {},
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
    legs: [],
    routeScene: scene,
    backToRoute: false,
    tour: opts.tour ?? null,
    ti: 0,
    dwell: opts.tour?.[0]?.stay ?? 0,
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
  a.legs = [];
}

/* ───────── doors: walking between the street and the buildings ───────── */

/** Where an interior's door is, seen from inside and from the street. */
export function doorOf(scene: SceneId) {
  const sc = SCENES[scene] as (typeof SCENES)[SceneId] & { exitTo?: string };
  const inside = sc.spawns.door;
  const outside = sc.exitTo ? SCENES.street.spawns[sc.exitTo] : null;
  if (!inside || !outside) return null;
  return { inside, outside };
}

/** Waypoints from one place to another, through whichever doors are in the way. */
export function planTrip(from: SceneId, to: SceneId, x: number, z: number): Leg[] {
  const legs: Leg[] = [];
  if (from !== to) {
    if (from !== 'street') {
      const d = doorOf(from);
      if (!d) return [];
      legs.push({ x: d.inside.x, z: d.inside.z + 0.6, cross: { scene: 'street', x: d.outside.x, z: d.outside.z, face: d.outside.face } });
    }
    if (to !== 'street') {
      const d = doorOf(to);
      if (!d) return [];
      legs.push({ x: d.outside.x, z: d.outside.z, cross: { scene: to, x: d.inside.x, z: d.inside.z, face: Math.PI } });
    }
  }
  legs.push({ x, z });
  return legs;
}

/** Walk somewhere, in any scene: out of one door and into another if need be. */
export function agentTravel(id: string, scene: SceneId, x: number, z: number, arrive: string | null = null) {
  const a = agents.get(id);
  if (!a) return;
  const legs = planTrip(a.scene, scene, x, z);
  if (!legs.length) return;
  a.mode = 'goto';
  a.legs = legs;
  a.target = { x: legs[0].x, z: legs[0].z };
  a.arrive = arrive;
}

/** After a distraction or a chase, pick an interrupted trip back up. */
function resume(a: Agent) {
  if (a.legs.length) {
    a.mode = 'goto';
    a.target = { x: a.legs[0].x, z: a.legs[0].z };
  } else a.mode = a.route.length ? 'route' : 'idle';
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

export type AgentEvent =
  | { kind: 'arrive'; id: string; name: string }
  | { kind: 'resume'; id: string }
  | { kind: 'door'; id: string; from: SceneId; to: SceneId }
  | { kind: 'stop'; id: string; stop: TourStop };

/**
 * Friendly people stop walking when you come up to them, so you can actually talk.
 * If you just stand in their way, they wait a few seconds, then excuse themselves past you.
 */
const waited = new Map<string, number>();
function waitsForYou(a: Agent, st: ReturnType<typeof useGame.getState>, dt: number) {
  if (a.hostile || a.scene !== st.scene) return false;
  const me = ent(st.active);
  const e = ent(a.id);
  const d = Math.hypot(me.x - e.x, me.z - e.z);
  const w = waited.get(a.id) ?? 0;
  if (d >= 1.9) {
    if (d > 3) waited.delete(a.id);
    return false;
  }
  if (w > 4) return false;
  waited.set(a.id, w + dt);
  if (w + dt > 4) bark(a.id, a.id === 'postman' ? 'Hatiye! Daak aa rahi hai!' : 'Hato beta. Kuch logon ko kaam bhi hai.', 2);
  e.speed = 0;
  e.face = Math.atan2(me.x - e.x, me.z - e.z);
  return true;
}

/** Advance all agents. Returns arrival events for the mission director. */
export function tickAgents(dt: number, now: number): AgentEvent[] {
  const events: AgentEvent[] = [];
  const st = useGame.getState();
  for (const a of agents.values()) {
    const e = ent(a.id);
    if (st.dialogue && st.talkingTo === a.id) {
      e.speed = 0;
      continue;
    }
    // an everyday round: linger at a stop, then walk to the next one, wherever it is
    if (a.tour && a.mode === 'idle') {
      e.speed = 0;
      // someone came up to him: he lingers a little longer at this stop
      if (waitsForYou(a, st, dt)) continue;
      a.dwell -= dt;
      if (a.dwell <= 0) {
        a.ti = (a.ti + 1) % a.tour.length;
        const stop = a.tour[a.ti];
        a.anim = 'idle';
        agentTravel(a.id, stop.scene, stop.x, stop.z, null);
      }
      continue;
    }
    if (a.mode === 'stalled' || a.mode === 'idle') {
      e.speed = 0;
      continue;
    }
    if (a.mode === 'chase' && a.chase) {
      const f = ent(a.chase);
      stepTowards(a, f.x, f.z, a.speed * 1.9, dt, 0.6);
      if (now > a.until) {
        a.chase = null;
        resume(a);
      }
      continue;
    }
    if ((a.mode === 'investigate' || a.mode === 'distracted') && a.target) {
      const there = stepTowards(a, a.target.x, a.target.z, a.speed * 1.3, dt, a.mode === 'distracted' ? 2.2 : 0.8);
      if (there && a.mode === 'distracted') e.face = Math.atan2(a.target.x - e.x, a.target.z - e.z);
      if (now > a.until) {
        a.target = null;
        resume(a);
        events.push({ kind: 'resume', id: a.id });
      }
      continue;
    }
    if (a.mode === 'goto' && a.target) {
      if (a.tour && waitsForYou(a, st, dt)) continue;
      if (!stepTowards(a, a.target.x, a.target.z, a.speed, dt)) continue;
      // a leg of a longer trip: maybe step through a door, then carry on
      if (a.legs.length) {
        const leg = a.legs.shift()!;
        if (leg.cross) {
          const from = a.scene;
          a.scene = leg.cross.scene;
          e.x = leg.cross.x;
          e.z = leg.cross.z;
          e.face = leg.cross.face;
          e.speed = 0;
          bump();
          events.push({ kind: 'door', id: a.id, from, to: a.scene });
        }
        if (a.legs.length) {
          a.target = { x: a.legs[0].x, z: a.legs[0].z };
          continue;
        }
      }
      const name = a.arrive;
      a.mode = 'idle';
      a.target = null;
      a.arrive = null;
      if (a.backToRoute) {
        a.backToRoute = false;
        a.mode = 'route';
      }
      if (a.tour) {
        const stop = a.tour[a.ti];
        a.dwell = stop.stay;
        a.anim = stop.anim ?? 'idle';
        if (stop.face !== undefined) e.face = stop.face;
        events.push({ kind: 'stop', id: a.id, stop });
      }
      if (name) events.push({ kind: 'arrive', id: a.id, name });
      continue;
    }
    if (a.mode === 'route' && a.route.length) {
      // wandered into a building (following someone): walk back out to the patrol
      if (a.scene !== a.routeScene) {
        const [x, z] = a.route[a.ri];
        agentTravel(a.id, a.routeScene, x, z, null);
        a.backToRoute = true;
        continue;
      }
      if (waitsForYou(a, st, dt)) continue;
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
