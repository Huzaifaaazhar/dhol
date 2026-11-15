import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { SceneDef } from '../game/types';
import { NPCS } from '../game/data/npcs';
import { useGame } from '../game/store';
import { ent, runtime } from '../game/runtime';
import { resolveNpcs } from '../game/world';
import { insideAnyBox } from '../game/collision';
import { currentNode } from '../game/effects';
import { Cow, Dog, Person } from './Person';
import { agents, agentsIn } from '../game/sim/agents';
import { CartProp } from './part2props';

const SEATED = new Set(['sit', 'read', 'carrom']);

export function NPCs({ scene }: { scene: SceneDef }) {
  const flags = useGame((s) => s.flags);
  const agentsV = useGame((s) => s.agentsV);
  // anyone the simulation is moving around is drawn by <Agents> instead
  const npcs = useMemo(() => resolveNpcs(scene).filter((n) => !agents.has(n.id)), [scene, flags, agentsV]);
  const placed = useRef(new Set<string>());
  const wander = useRef(new Map<string, { x: number; z: number; t: number }>());
  const routine = useRef(new Map<string, { i: number; t: number }>());

  useLayoutEffect(() => {
    placed.current = new Set();
  }, [scene]);

  useLayoutEffect(() => {
    for (const n of npcs) {
      if (placed.current.has(n.id)) continue;
      const e = ent(n.id);
      e.x = n.baseX;
      e.z = n.baseZ;
      e.face = n.baseFace;
      e.speed = 0;
      e.anim = n.anim ?? 'idle';
      placed.current.add(n.id);
    }
  }, [npcs]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useGame.getState();
    const p = ent(st.active);
    const node = st.dialogue ? currentNode() : null;
    const att = runtime.attention && runtime.attention.until > performance.now() ? runtime.attention : null;

    for (const n of npcs) {
      const e = ent(n.id);
      const def = NPCS[n.id];
      const seated = SEATED.has(n.anim ?? '');
      let tx = n.baseX;
      let tz = n.baseZ;
      let rAnim: string | undefined;
      let rFace: number | undefined;
      if (n.routine?.length) {
        let r = routine.current.get(n.id);
        if (!r) routine.current.set(n.id, (r = { i: 0, t: n.routine[0].stay }));
        const stop = n.routine[r.i];
        tx = stop.x;
        tz = stop.z;
        if (Math.hypot(stop.x - e.x, stop.z - e.z) < 0.2 && !(st.talkingTo === n.id && st.dialogue)) {
          rAnim = stop.anim;
          rFace = stop.face;
          r.t -= dt;
          if (r.t <= 0) {
            r.i = (r.i + 1) % n.routine.length;
            r.t = n.routine[r.i].stay;
          }
        }
      }
      if (n.wander) {
        let w = wander.current.get(n.id);
        if (!w || w.t < 0) {
          let x = n.baseX,
            z = n.baseZ;
          for (let k = 0; k < 6; k++) {
            const cx = n.baseX + (Math.random() - 0.5) * 2 * n.wander;
            const cz = n.baseZ + (Math.random() - 0.5) * 2 * n.wander;
            if (!insideAnyBox(cx, cz, scene, 0.5)) {
              x = cx;
              z = cz;
              break;
            }
          }
          w = { x, z, t: 3 + Math.random() * 4 };
          wander.current.set(n.id, w);
        }
        w.t -= dt;
        tx = w.x;
        tz = w.z;
      }
      const dx = tx - e.x;
      const dz = tz - e.z;
      const d = Math.hypot(dx, dz);
      const talking = st.talkingTo === n.id && !!st.dialogue;
      if (d > 0.15 && !talking) {
        const sp = n.wander ? 1.6 : 2.0;
        const step = Math.min(d, sp * dt);
        e.x += (dx / d) * step;
        e.z += (dz / d) * step;
        e.stride += step;
        e.speed = sp;
        e.face = Math.atan2(dx, dz);
      } else {
        e.speed = 0;
        const dp = Math.hypot(p.x - e.x, p.z - e.z);
        if (talking || (dp < 3.4 && def?.kind !== 'cow' && !seated)) e.face = Math.atan2(p.x - e.x, p.z - e.z);
        else if (att && Math.hypot(att.x - e.x, att.z - e.z) < 9 && !seated) e.face = Math.atan2(att.x - e.x, att.z - e.z);
        else if (rFace !== undefined) e.face = rFace;
        else if (!n.wander) e.face = n.baseFace;
      }
      if (e.oneShot <= 0) {
        const speaking = node?.speaker === n.id;
        const base = n.routine ? (d > 0.15 ? 'idle' : rAnim ?? 'idle') : n.anim ?? 'idle';
        e.anim = speaking && !seated ? 'talk' : (base as typeof e.anim);
      }
    }
  });

  return (
    <>
      {npcs.map((n) => {
        const def = NPCS[n.id];
        if (!def) return null;
        if (def.kind === 'cow') return <Cow key={n.id} id={n.id} />;
        if (def.kind === 'dog') return <Dog key={n.id} id={n.id} />;
        return <Person key={n.id} id={n.id} look={def.look} />;
      })}
    </>
  );
}

/** NPCs driven by the simulation (patrols, schedules), drawn when their scene is on screen. */
export function Agents({ scene }: { scene: SceneDef }) {
  useGame((s) => s.agentsV);
  const list = agentsIn(scene.id);
  useFrame(() => {
    const st = useGame.getState();
    const node = st.dialogue ? currentNode() : null;
    for (const a of agentsIn(scene.id)) {
      const e = ent(a.id);
      if (e.oneShot > 0) continue;
      const talking = node?.speaker === a.id;
      e.anim = e.speed > 0.1 ? 'idle' : talking ? 'talk' : a.anim;
      if (st.talkingTo === a.id && st.dialogue) {
        const p = ent(st.active);
        e.face = Math.atan2(p.x - e.x, p.z - e.z);
      }
    }
  });
  return (
    <>
      {list.map((a) => {
        const def = NPCS[a.id];
        if (!def) return null;
        return (
          <group key={a.id}>
            <Person id={a.id} look={def.look} />
            {a.id === 'shambhu' && <CartProp follow="shambhu" />}
          </group>
        );
      })}
    </>
  );
}
