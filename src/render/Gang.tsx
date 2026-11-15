import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { CharId, SceneDef } from '../game/types';
import { CHAR_IDS } from '../game/types';
import { FRIENDS } from '../game/data/characters';
import { useGame, bark, emote, view } from '../game/store';
import { ent, playOneShot, runtime } from '../game/runtime';
import { moveAxis, screenToWorld } from '../game/input';
import { resolve, type Circle } from '../game/collision';
import { findFocus, resolveNpcs } from '../game/world';
import { applyEffects, currentNode, startDialogue } from '../game/effects';
import { agents, agentsIn } from '../game/sim/agents';
import { cancelTask, taskOf } from '../game/sim/tasks';
import { savePositions } from '../game/party';
import { sfx } from '../game/audio';
import { Person } from './Person';

const R = 0.38;

export function Gang({ scene }: { scene: SceneDef }) {
  const active = useGame((s) => s.active);
  const flags = useGame((s) => s.flags);
  const where = useGame((s) => s.where);
  const hidden = useGame((s) => s.hidden);
  const agentsV = useGame((s) => s.agentsV);
  const npcs = useMemo(() => resolveNpcs(scene).filter((n) => !agents.has(n.id)), [scene, flags, agentsV]);
  const trail = useRef<Array<{ x: number; z: number }>>([]);
  const inside = useRef(new Set<string>());
  const frame = useRef(0);
  const saveT = useRef(0);
  const idleT = useRef(0);
  const tripCd = useRef(3);

  useLayoutEffect(() => {
    const st = useGame.getState();
    const sp = st.entry ?? Object.values(scene.spawns)[0];
    useGame.setState({ focus: null, where: { ...st.where, [st.active]: scene.id } });
    const back = { x: -Math.sin(sp.face), z: -Math.cos(sp.face) };
    const side = { x: Math.cos(sp.face), z: -Math.sin(sp.face) };
    const offs = [
      [-0.8, 0.9],
      [0.8, 0.9],
      [0, 1.7],
    ];
    const lead = ent(st.active);
    lead.x = sp.x;
    lead.z = sp.z;
    resolve(lead, R, scene);
    lead.face = sp.face;
    lead.speed = 0;
    lead.oneShot = 0;
    let k = 0;
    for (const id of CHAR_IDS) {
      if (id === st.active || st.where[id] !== scene.id) continue;
      const e = ent(id);
      e.speed = 0;
      e.oneShot = 0;
      if (st.posted[id]) {
        const p = st.friendPos[id];
        e.x = p.x;
        e.z = p.z;
        e.face = p.face;
      } else {
        const [s, b] = offs[k++ % offs.length];
        e.x = sp.x + side.x * s + back.x * b;
        e.z = sp.z + side.z * s + back.z * b;
        resolve(e, R, scene);
        e.face = sp.face;
      }
    }
    trail.current = [{ x: lead.x, z: lead.z }];
    inside.current = new Set();
    runtime.cam.x = lead.x;
    runtime.cam.z = lead.z;
  }, [scene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useGame.getState();
    const lead = ent(st.active);
    const blocked = !!st.dialogue || !!st.transition || st.paused || !!st.partEnded || !!st.failure || st.mode !== 'play';
    const sceneAgents = agentsIn(scene.id);
    const npcCircles: Circle[] = npcs.map((n) => {
      const e = ent(n.id);
      return { x: e.x, z: e.z, r: n.id === 'gauri' ? 1.1 : 0.4 };
    });
    for (const a of sceneAgents) {
      const e = ent(a.id);
      npcCircles.push({ x: e.x, z: e.z, r: 0.4 });
    }
    if (!scene.interior) npcCircles.push(...runtime.dynamic);
    const here = CHAR_IDS.filter((c) => st.where[c] === scene.id);

    /* ── leader ── */
    const def = FRIENDS[st.active];
    const inp = moveAxis();
    const carrying = st.dhol === `carried:${st.active}`;
    if (!blocked && lead.oneShot <= 0 && (inp.x || inp.y)) {
      // walking off ends whatever you were doing, and gives away your hiding place
      if (taskOf(st.active)) cancelTask(st.active);
      if (st.hidden[st.active]) useGame.setState({ hidden: { ...st.hidden, [st.active]: undefined } });
      const w = screenToWorld(inp.x, inp.y);
      const run = inp.running;
      const speed = def.move.speed * (run ? def.move.runMul : 1) * (carrying ? 0.72 : 1);
      const p = { x: lead.x + w.x * speed * dt, z: lead.z + w.z * speed * dt };
      const friendsBlock: Circle[] = here
        .filter((c) => c !== st.active && st.posted[c])
        .map((c) => {
          const o = ent(c);
          return { x: o.x, z: o.z, r: R * 0.9 };
        });
      resolve(p, R, scene, [...npcCircles, ...friendsBlock]);
      const moved = Math.hypot(p.x - lead.x, p.z - lead.z);
      // footsteps: one soft scuff per stride
      if (Math.floor((lead.stride + moved) / 1.15) !== Math.floor(lead.stride / 1.15)) sfx('step');
      lead.stride += moved;
      lead.x = p.x;
      lead.z = p.z;
      lead.face = Math.atan2(w.x, w.z);
      lead.speed = moved / dt;
      if (!st.hints.moved) useGame.setState({ hints: { ...st.hints, moved: true } });

      // Maru trips over his own feet when he runs
      tripCd.current -= dt;
      if (st.active === 'maru' && run && tripCd.current < 0 && Math.random() < dt * 0.25) {
        tripCd.current = 6;
        playOneShot('maru', 'trip', 1.1);
        sfx('thud');
        bark('maru', ['I’m okay!', 'Who put the ground there?!', 'Nobody saw that.'][Math.floor(Math.random() * 3)]);
        runtime.attention = { x: lead.x, z: lead.z, until: performance.now() + 1800 };
        npcs.forEach((n) => {
          const e = ent(n.id);
          if (Math.hypot(e.x - lead.x, e.z - lead.z) < 7) emote(n.id, '?', 1.4);
        });
      }
    } else {
      lead.speed *= 0.5;
      if (lead.speed < 0.05) lead.speed = 0;
    }

    const last = trail.current[trail.current.length - 1];
    if (!last || Math.hypot(lead.x - last.x, lead.z - last.z) > 0.3) {
      trail.current.push({ x: lead.x, z: lead.z });
      if (trail.current.length > 80) trail.current.shift();
    }

    /* ── followers (friends here who were not told to wait) ── */
    const followers = here.filter((c) => c !== st.active && !st.posted[c]);
    followers.forEach((id, i) => {
      const e = ent(id);
      const mv = FRIENDS[id].move;
      const idx = trail.current.length - 1 - (i + 1) * 4;
      const tx = idx >= 0 ? trail.current[idx].x : e.x;
      const tz = idx >= 0 ? trail.current[idx].z : e.z;
      const dLead = Math.hypot(e.x - lead.x, e.z - lead.z);
      const dx = tx - e.x;
      const dz = tz - e.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 14) {
        e.x = tx;
        e.z = tz;
      } else if (dist > 0.25 && dLead > 1.2 && e.oneShot <= 0) {
        const carryMul = st.dhol === `carried:${id}` ? 0.72 : 1;
        const want = Math.min(dist * 3.2, mv.speed * mv.runMul * 1.1 * carryMul);
        const step = Math.min(dist, want * dt);
        const p = { x: e.x + (dx / dist) * step, z: e.z + (dz / dist) * step };
        const others: Circle[] = here
          .filter((c) => c !== id)
          .map((c) => {
            const o = ent(c);
            return { x: o.x, z: o.z, r: R * 0.9 };
          });
        resolve(p, R, scene, [...npcCircles, ...others]);
        const moved = Math.hypot(p.x - e.x, p.z - e.z);
        e.stride += moved;
        e.x = p.x;
        e.z = p.z;
        e.speed = moved / dt;
        if (moved > 0.001) e.face = Math.atan2(dx, dz);
      } else {
        e.speed *= 0.6;
        if (e.speed < 0.05) e.speed = 0;
        if (e.speed === 0 && dLead < 4 && !st.dialogue) {
          e.face = Math.atan2(lead.x - e.x, lead.z - e.z) + (id === 'maru' ? Math.sin(runtime.time + i) * 0.8 : 0);
        }
      }
    });
    // friends left waiting just idle where they are
    for (const c of here) {
      if (c === st.active || !st.posted[c]) continue;
      const e = ent(c);
      e.speed = 0;
    }

    /* ── talking animation + facing during dialogue ── */
    const node = st.dialogue ? currentNode() : null;
    here.forEach((id) => {
      const e = ent(id);
      const speaking = node && (node.speaker === id || (node.speaker === 'me' && id === st.active));
      if (e.oneShot <= 0) e.anim = speaking ? 'talk' : 'idle';
      if (st.talkingTo && st.dialogue && e.speed === 0 && (!st.posted[id] || id === st.active)) {
        const o = ent(st.talkingTo);
        e.face = Math.atan2(o.x - e.x, o.z - e.z);
      }
    });

    runtime.time += dt;
    runtime.cam.x = lead.x;
    runtime.cam.z = lead.z;

    /* ── triggers ── */
    if (!st.dialogue && !st.transition && st.mode === 'play') {
      const v = view();
      for (const tr of scene.triggers) {
        const inZone = Math.hypot(lead.x - tr.x, lead.z - tr.z) < tr.r && tr.when(v);
        if (inZone && !inside.current.has(tr.id)) {
          inside.current.add(tr.id);
          if (tr.dialogue) {
            useGame.setState({ talkingTo: tr.id === 'landlord' ? 'tiwari' : null });
            startDialogue(tr.dialogue);
          }
          applyEffects(tr.effects);
          break;
        } else if (!inZone) inside.current.delete(tr.id);
      }
    }

    /* ── interaction focus ── */
    frame.current++;
    if (frame.current % 5 === 0) {
      const present = new Set<string>([...npcs.map((n) => n.id), ...sceneAgents.map((a) => a.id)]);
      const it = blocked ? null : findFocus(scene, lead.x, lead.z, present);
      const id = it?.id ?? null;
      if (id !== st.focus) useGame.setState({ focus: id });
    }

    /* ── idle chatter ── */
    idleT.current += dt;
    if (lead.speed === 0 && !blocked && idleT.current > 16 + Math.random() * 10) {
      idleT.current = 0;
      const pool = here.filter((c) => !taskOf(c));
      const who = pool[Math.floor(Math.random() * pool.length)];
      if (who) {
        const lines = FRIENDS[who].barks;
        bark(who, lines[Math.floor(Math.random() * lines.length)], 3);
      }
    } else if (lead.speed > 0) idleT.current = Math.min(idleT.current, 8);

    /* ── autosave positions ── */
    saveT.current += rawDt;
    if (saveT.current > 1.5 && !st.transition) {
      saveT.current = 0;
      savePositions();
      const sp = st.savedPos;
      if (!sp || sp.scene !== scene.id || Math.abs(sp.x - lead.x) + Math.abs(sp.z - lead.z) > 0.2) {
        useGame.setState({ savedPos: { scene: scene.id, x: lead.x, z: lead.z, face: lead.face } });
      }
    }
  });

  return (
    <>
      {CHAR_IDS.filter((id) => where[id] === scene.id || id === active).map((id) => (
        <Person
          key={id}
          id={id}
          look={FRIENDS[id].look}
          move={FRIENDS[id].move}
          personality={id as CharId}
          ring={id === active ? FRIENDS[id].color : null}
          crouch={!!hidden[id]}
        />
      ))}
    </>
  );
}
