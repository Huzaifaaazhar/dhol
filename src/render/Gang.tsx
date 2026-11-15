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
import { sfx } from '../game/audio';
import { Person } from './Person';

const R = 0.38;

export function Gang({ scene }: { scene: SceneDef }) {
  const active = useGame((s) => s.active);
  const flags = useGame((s) => s.flags);
  const npcs = useMemo(() => resolveNpcs(scene), [scene, flags]);
  const present = useMemo(() => new Set(npcs.map((n) => n.id)), [npcs]);
  const trail = useRef<Array<{ x: number; z: number }>>([]);
  const inside = useRef(new Set<string>());
  const frame = useRef(0);
  const saveT = useRef(0);
  const idleT = useRef(0);
  const tripCd = useRef(3);

  useLayoutEffect(() => {
    const st = useGame.getState();
    const sp = st.entry ?? Object.values(scene.spawns)[0];
    useGame.setState({ focus: null });
    // gang stands in a small arc behind the spawn point
    const back = { x: -Math.sin(sp.face), z: -Math.cos(sp.face) };
    const side = { x: Math.cos(sp.face), z: -Math.sin(sp.face) };
    const order = [st.active, ...CHAR_IDS.filter((c) => c !== st.active)];
    const offs = [
      [0, 0],
      [-0.8, 0.9],
      [0.8, 0.9],
      [0, 1.7],
    ];
    order.forEach((id, i) => {
      const e = ent(id);
      const [s, b] = offs[i];
      e.x = sp.x + side.x * s + back.x * b;
      e.z = sp.z + side.z * s + back.z * b;
      resolve(e, R, scene);
      e.face = sp.face;
      e.speed = 0;
      e.anim = 'idle';
      e.oneShot = 0;
    });
    const a = ent(st.active);
    trail.current = [{ x: a.x, z: a.z }];
    inside.current = new Set();
    runtime.cam.x = a.x;
    runtime.cam.z = a.z;
  }, [scene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useGame.getState();
    const lead = ent(st.active);
    const blocked = !!st.dialogue || !!st.transition || st.paused || st.partEnded || st.mode !== 'play';
    const npcCircles: Circle[] = npcs.map((n) => {
      const e = ent(n.id);
      return { x: e.x, z: e.z, r: n.id === 'gauri' ? 1.1 : 0.4 };
    });
    if (!scene.interior) npcCircles.push(...runtime.dynamic);

    /* ── leader ── */
    const def = FRIENDS[st.active];
    const inp = moveAxis();
    let speed = 0;
    if (!blocked && lead.oneShot <= 0 && (inp.x || inp.y)) {
      const w = screenToWorld(inp.x, inp.y);
      const run = inp.running;
      speed = def.move.speed * (run ? def.move.runMul : 1);
      const nx = lead.x + w.x * speed * dt;
      const nz = lead.z + w.z * speed * dt;
      const p = { x: nx, z: nz };
      resolve(p, R, scene, npcCircles);
      const moved = Math.hypot(p.x - lead.x, p.z - lead.z);
      lead.stride += moved;
      lead.x = p.x;
      lead.z = p.z;
      lead.face = Math.atan2(w.x, w.z);
      lead.speed = moved / dt;
      if (!st.hints.moved) useGame.setState({ hints: { ...st.hints, moved: true } });
      if (run && !st.hints.ran) useGame.setState({ hints: { ...useGame.getState().hints, ran: true } });

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

    /* ── followers ── */
    const followers = CHAR_IDS.filter((c) => c !== st.active);
    followers.forEach((id, i) => {
      const e = ent(id);
      const mv = FRIENDS[id].move;
      const idx = trail.current.length - 1 - (i + 1) * 4;
      let tx: number, tz: number;
      if (idx >= 0) {
        tx = trail.current[idx].x;
        tz = trail.current[idx].z;
      } else {
        tx = e.x;
        tz = e.z;
      }
      // stand around the leader rather than in a perfect line when he stops
      const dLead = Math.hypot(e.x - lead.x, e.z - lead.z);
      const dx = tx - e.x;
      const dz = tz - e.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 14) {
        e.x = tx;
        e.z = tz;
      } else if (dist > 0.25 && dLead > 1.2 && e.oneShot <= 0) {
        const want = Math.min(dist * 3.2, mv.speed * mv.runMul * 1.1);
        const step = Math.min(dist, want * dt);
        const p = { x: e.x + (dx / dist) * step, z: e.z + (dz / dist) * step };
        // separation from other gang members
        const others: Circle[] = CHAR_IDS.filter((c) => c !== id).map((c) => {
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
          // idly turn towards the leader, Maru keeps glancing away
          e.face = Math.atan2(lead.x - e.x, lead.z - e.z) + (id === 'maru' ? Math.sin(runtime.time + i) * 0.8 : 0);
        }
      }
    });

    /* ── talking animation + facing during dialogue ── */
    const node = st.dialogue ? currentNode() : null;
    CHAR_IDS.forEach((id) => {
      const e = ent(id);
      const speaking = node && (node.speaker === id || (node.speaker === 'me' && id === st.active));
      if (e.oneShot <= 0) e.anim = speaking ? 'talk' : 'idle';
      if (st.talkingTo && st.dialogue && e.speed === 0) {
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
      const it = blocked ? null : findFocus(scene, lead.x, lead.z, present);
      const id = it?.id ?? null;
      if (id !== st.focus) useGame.setState({ focus: id });
    }

    /* ── idle chatter ── */
    idleT.current += dt;
    if (lead.speed === 0 && !blocked && idleT.current > 16 + Math.random() * 10) {
      idleT.current = 0;
      const who = CHAR_IDS[Math.floor(Math.random() * 4)];
      const lines = FRIENDS[who].barks;
      bark(who, lines[Math.floor(Math.random() * lines.length)], 3);
    } else if (lead.speed > 0) idleT.current = Math.min(idleT.current, 8);

    /* ── autosave position ── */
    saveT.current += rawDt;
    if (saveT.current > 1.5 && !st.transition) {
      saveT.current = 0;
      const sp = st.savedPos;
      if (!sp || sp.scene !== scene.id || Math.abs(sp.x - lead.x) + Math.abs(sp.z - lead.z) > 0.2) {
        useGame.setState({ savedPos: { scene: scene.id, x: lead.x, z: lead.z, face: lead.face } });
      }
    }
  });

  return (
    <>
      {CHAR_IDS.map((id) => (
        <Person key={id} id={id} look={FRIENDS[id].look} move={FRIENDS[id].move} personality={id as CharId} ring={id === active ? FRIENDS[id].color : null} />
      ))}
    </>
  );
}
