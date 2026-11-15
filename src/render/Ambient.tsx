import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Look } from '../game/data/characters';
import { CHAR_IDS } from '../game/types';
import { ent, runtime } from '../game/runtime';
import { bark, emote, useGame } from '../game/store';
import { sfx } from '../game/audio';
import { rng } from './textures';
import { Person } from './Person';
import { Auto, Car, Scooter } from './props';
import { GEO, mat } from './materials';

/* ───────────── pedestrians ───────────── */

const PATHS: Array<Array<[number, number]>> = [
  [[-38, -5.4], [38, -5.4]],
  [[36, 6.6], [-36, 6.6]],
  [[-6.5, -20], [-6.5, -5], [-6.5, 5], [-6.5, 28]],
  [[6.6, -20], [6.6, 7.2], [20, 7.4], [20, 20], [9, 20]],
  [[-20, 9], [-20, 21.5]],
  [[30, -5.2], [30, 5.5], [36, 5.5], [36, -5.2]],
];

const SHIRTS = ['#e76f51', '#2a9d8f', '#f4a261', '#8ecae6', '#ffafcc', '#cdb4db', '#90be6d', '#f9c74f', '#577590', '#ffffff'];
const PANTS = ['#264653', '#3d405b', '#6d6875', '#1d3557', '#5e503f', '#e9edc9'];
const HAIRS: Look['hairStyle'][] = ['side', 'flat', 'bald', 'bun', 'braid', 'curly', 'puff'];

function pedLook(i: number): Look {
  const r = rng(i * 97 + 11);
  const style = HAIRS[Math.floor(r() * HAIRS.length)];
  const female = style === 'bun' || style === 'braid';
  return {
    skin: ['#c68a5e', '#a86d46', '#b57b52', '#d4a27a'][Math.floor(r() * 4)],
    hair: r() < 0.2 ? '#bdb6ad' : '#1a120e',
    hairStyle: style,
    shirt: SHIRTS[Math.floor(r() * SHIRTS.length)],
    shirtPattern: female ? (r() < 0.5 ? 'saree' : 'kurta') : r() < 0.3 ? 'check' : r() < 0.5 ? 'kurta' : 'plain',
    pants: PANTS[Math.floor(r() * PANTS.length)],
    shoes: '#3a2a20',
    height: 0.88 + r() * 0.2,
    girth: 0.85 + r() * 0.35,
    extras: r() < 0.3 ? ['moustache'] : r() < 0.2 ? ['glasses'] : [],
  };
}

export const PED_IDS = PATHS.map((_, i) => `ped${i}`);

const BUMP_LINES = ['Oye! Watch it!', 'Arre, look where you walk!', 'Tch. Youngsters.', 'Side please, side!'];

function Pedestrians() {
  const looks = useMemo(() => PATHS.map((_, i) => pedLook(i)), []);
  const st = useRef(
    PATHS.map((p, i) => ({ seg: 0, t: (i * 0.37) % 1, dir: 1, wait: 0, bumpCd: 0, path: p })),
  );

  useMemo(() => {
    st.current.forEach((s, i) => {
      const e = ent(PED_IDS[i]);
      const [a] = s.path;
      e.x = a[0];
      e.z = a[1];
    });
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const gs = useGame.getState();
    const lead = ent(gs.active);
    const playing = gs.mode === 'play';
    st.current.forEach((s, i) => {
      const id = PED_IDS[i];
      const e = ent(id);
      const path = s.path;
      const a = path[s.seg];
      const b = path[s.seg + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // pause if a gang member blocks the way
      const blockers = playing ? CHAR_IDS.map((c) => ent(c)).filter((g) => Math.hypot(g.x - e.x, g.z - e.z) < 1.1) : [];
      s.bumpCd -= dt;
      if (blockers.length) {
        e.speed = 0;
        e.face = Math.atan2(lead.x - e.x, lead.z - e.z);
        if (s.bumpCd < 0 && lead.speed > 0.5 && Math.hypot(lead.x - e.x, lead.z - e.z) < 1.1) {
          s.bumpCd = 6;
          bark(id, BUMP_LINES[Math.floor(Math.random() * BUMP_LINES.length)], 2);
          emote(id, '💢', 1.2);
        }
        return;
      }
      if (s.wait > 0) {
        s.wait -= dt;
        e.speed = 0;
        return;
      }
      const sp = 1.6 + (i % 3) * 0.25;
      s.t += ((sp * dt) / len) * s.dir;
      if (s.t >= 1 || s.t <= 0) {
        s.t = Math.max(0, Math.min(1, s.t));
        if (s.dir > 0 && s.seg < path.length - 2) {
          s.seg++;
          s.t = 0;
        } else if (s.dir < 0 && s.seg > 0) {
          s.seg--;
          s.t = 1;
        } else {
          s.dir *= -1;
          s.wait = 1 + Math.random() * 3;
        }
      }
      const A = path[s.seg];
      const B = path[s.seg + 1];
      const nx = A[0] + (B[0] - A[0]) * s.t;
      const nz = A[1] + (B[1] - A[1]) * s.t;
      const mv = Math.hypot(nx - e.x, nz - e.z);
      if (mv > 0.0001) e.face = Math.atan2(nx - e.x, nz - e.z);
      e.stride += mv;
      e.speed = mv / dt;
      e.x = nx;
      e.z = nz;
    });
  });

  return (
    <>
      {PED_IDS.map((id, i) => (
        <Person key={id} id={id} look={looks[i]} />
      ))}
    </>
  );
}

/* ───────────── traffic ───────────── */

interface Vehicle {
  kind: 'auto' | 'car' | 'scooter';
  z: number;
  dir: 1 | -1;
  speed: number;
  x: number;
  cur: number;
  honkCd: number;
  color: string;
}

function Traffic() {
  const vs = useRef<Vehicle[]>([
    { kind: 'auto', z: 2, dir: 1, speed: 6, x: -30, cur: 6, honkCd: 0, color: '' },
    { kind: 'scooter', z: 1.4, dir: 1, speed: 7.5, x: 10, cur: 7.5, honkCd: 0, color: '#ef476f' },
    { kind: 'car', z: -2, dir: -1, speed: 6.5, x: 20, cur: 6.5, honkCd: 0, color: '#118ab2' },
    { kind: 'auto', z: -2.2, dir: -1, speed: 5.5, x: -40, cur: 5.5, honkCd: 0, color: '' },
  ]);
  const refs = useRef<Array<THREE.Group | null>>([]);
  const wheelSpin = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const gang = useGame.getState().mode === 'play' ? CHAR_IDS.map((c) => ent(c)) : [];
    const dyn: typeof runtime.dynamic = [];
    vs.current.forEach((v, i) => {
      let target = v.speed;
      // stop for people in front
      for (const g of gang) {
        const ahead = (g.x - v.x) * v.dir;
        if (ahead > 0 && ahead < 4.2 && Math.abs(g.z - v.z) < 1.6) {
          target = 0;
          v.honkCd -= dt;
          if (v.honkCd < 0) {
            v.honkCd = 2.5;
            sfx('honk');
            if (Math.random() < 0.5) bark(useGame.getState().active, ['Okay okay, going!', 'Sorry, uncle!', 'The road is for walking also!'][Math.floor(Math.random() * 3)], 1.8);
          }
        }
      }
      // keep distance from vehicles ahead in the same lane
      for (const o of vs.current) {
        if (o === v || o.dir !== v.dir || Math.abs(o.z - v.z) > 1.2) continue;
        const ahead = (o.x - v.x) * v.dir;
        if (ahead > 0 && ahead < 5) target = Math.min(target, o.cur * 0.9);
      }
      v.cur += (target - v.cur) * Math.min(1, dt * (target < v.cur ? 6 : 1.5));
      v.x += v.dir * v.cur * dt;
      if (v.x > 62) v.x = -62;
      if (v.x < -62) v.x = 62;
      const g = refs.current[i];
      if (g) {
        g.position.set(v.x, 0, v.z);
        g.rotation.y = v.dir > 0 ? 0 : Math.PI;
        g.position.y = v.cur > 0.5 ? Math.abs(Math.sin(v.x * 3)) * 0.03 : 0;
      }
      if (Math.abs(v.x) < 45) {
        const r = v.kind === 'scooter' ? 0.6 : 1.0;
        dyn.push({ x: v.x - 0.8, z: v.z, r }, { x: v.x + 0.8, z: v.z, r });
      }
    });
    wheelSpin.current += dt;
    runtime.dynamic = [
      ...dyn,
      ...PED_IDS.map((id) => {
        const e = ent(id);
        return { x: e.x, z: e.z, r: 0.35 };
      }),
    ];
  });

  return (
    <>
      {vs.current.map((v, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          {v.kind === 'auto' && (
            <>
              <Auto />
              <Driver x={0.5} y={0.9} />
            </>
          )}
          {v.kind === 'car' && <Car color={v.color} />}
          {v.kind === 'scooter' && (
            <>
              <Scooter x={0} z={0} color={v.color} />
              <Driver x={-0.25} y={0.85} helmet />
            </>
          )}
        </group>
      ))}
    </>
  );
}

function Driver({ x, y, helmet }: { x: number; y: number; helmet?: boolean }) {
  return (
    <group position={[x, y, 0]}>
      <mesh geometry={GEO.box} material={mat('#f1faee')} position={[0, 0.4, 0]} scale={[0.35, 0.6, 0.45]} />
      <mesh geometry={GEO.sphereLo} material={mat('#b57b52')} position={[0, 0.9, 0]} scale={0.38} />
      {helmet && <mesh geometry={GEO.sphereLo} material={mat('#e63946')} position={[0, 0.98, 0]} scale={0.44} />}
    </group>
  );
}

/* ───────────── kites and birds overhead ───────────── */

function Kites() {
  const g = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.position.set(-20 + i * 22 + Math.sin(t * 0.3 + i) * 3, 16 + Math.sin(t * 0.7 + i * 2) * 1.2, -18 + Math.cos(t * 0.25 + i) * 2);
      c.rotation.z = Math.sin(t * 1.2 + i) * 0.3;
    });
  });
  const cols = ['#ff006e', '#ffbe0b', '#3a86ff'];
  return (
    <group ref={g}>
      {cols.map((c) => (
        <mesh key={c} geometry={GEO.plane} material={mat(c)} rotation={[0, 0, Math.PI / 4]} scale={[1.1, 1.1, 1]} />
      ))}
    </group>
  );
}

export function Ambient() {
  return (
    <>
      <Pedestrians />
      <Traffic />
      <Kites />
    </>
  );
}
