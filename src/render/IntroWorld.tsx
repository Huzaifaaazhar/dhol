import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRIENDS } from '../game/data/characters';
import type { CharId } from '../game/types';
import { ent, playOneShot, runtime } from '../game/runtime';
import { INTRO, introTime } from '../intro/timeline';
import { dhol, sfx } from '../game/audio';
import { Person } from './Person';
import { StreetScene } from './scenes/StreetScene';
import { Sun } from './CameraRig';
import { GEO, mat, texMat } from './materials';
import { sunburstTexture, textTexture } from './textures';

const C = new THREE.Vector3(200, 0, 200); // stage centre, far from the street
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const TOWARD_CAM = new THREE.Vector3(1, 0, 1).normalize();
const FACE_CAM = Math.atan2(1, 1);
const LINEUP: Record<CharId, number> = { sam: -1.2, pakya: 0.6, goti: 2.4, maru: 4.2 };

function stagePoint(side: number, depth = 0) {
  return C.clone().addScaledVector(RIGHT, side).addScaledVector(TOWARD_CAM, depth);
}

function StageSet() {
  const back = useRef<THREE.Mesh>(null!);
  const burst = useMemo(() => {
    const m = texMat(sunburstTexture());
    m.emissive = new THREE.Color('#5a1a00');
    return m;
  }, []);
  useLayoutEffect(() => {
    const p = C.clone().addScaledVector(TOWARD_CAM, -9).add(new THREE.Vector3(0, 4, 0));
    back.current.position.copy(p);
    back.current.lookAt(p.clone().add(new THREE.Vector3(1, 1.15, 1)));
  }, []);
  useFrame((_, dt) => {
    back.current.rotateZ(dt * 0.05);
  });
  const lights = [...Array(7)].map((_, i) => stagePoint(-6 + i * 2, 4.2));
  return (
    <group>
      <mesh ref={back} geometry={GEO.plane} material={burst} scale={[70, 70, 1]} />
      {/* stage platform */}
      <mesh receiveShadow position={[C.x, -0.2, C.z]} geometry={GEO.cyl} material={mat('#8c3b2a')} scale={[17, 0.4, 17]} />
      <mesh receiveShadow position={[C.x, 0.01, C.z]} rotation={[-Math.PI / 2, 0, 0]} geometry={GEO.plane} material={mat('#c97b4a')}>
        <circleGeometry args={[8.2, 48]} />
      </mesh>
      {/* footlights */}
      {lights.map((p, i) => (
        <mesh key={i} position={[p.x, 0.15, p.z]} geometry={GEO.sphereLo} material={mat('#fff4c2', { emissive: '#ffb400' })} scale={0.35} />
      ))}
    </group>
  );
}

/** Rejection letters that rain down during the "broke" beat. */
function Letters() {
  const g = useRef<THREE.Group>(null!);
  const m = useMemo(() => texMat(textTexture('REJECTED', '#f7f1e3', '#c1121f', 256, 160, '"Baloo 2", sans-serif')), []);
  const seeds = useMemo(() => [...Array(26)].map((_, i) => ({ s: (i * 2.13) % 13 - 6.5, d: ((i * 1.7) % 5) - 2.5, v: 2 + (i % 5) * 0.4, ph: i })), []);
  const t0 = useRef(0);
  useFrame((s, dt) => {
    const active = introTime() > INTRO.friendsEnd;
    g.current.visible = active;
    if (!active) return;
    t0.current += dt;
    const t = t0.current;
    g.current.children.forEach((c, i) => {
      const k = seeds[i];
      const y = 12 - ((t * k.v + k.ph * 0.6) % 13);
      const p = stagePoint(k.s, k.d);
      c.position.set(p.x + Math.sin(t * 2 + k.ph) * 0.5, Math.max(0.05, y), p.z);
      c.rotation.set(y < 0.1 ? -Math.PI / 2 : Math.sin(t * 3 + k.ph), k.ph, Math.cos(t * 2 + k.ph) * 0.6);
    });
    void s;
  });
  return (
    <group ref={g}>
      {seeds.map((_, i) => (
        <mesh key={i} geometry={GEO.plane} material={m} scale={[0.9, 0.6, 1]} />
      ))}
    </group>
  );
}

/** A giant rupee coin drops at the end of the "broke" beat; everyone dives for it. */
function Coin({ t }: { t: React.MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null!);
  const face = useMemo(() => texMat(textTexture('₹', '#ffc94a', '#8a5a00', 256, 256, 'serif')), []);
  useFrame(() => {
    const k = t.current - (INTRO.brokeEnd - 2.4);
    g.current.visible = k > 0 && t.current < INTRO.brokeEnd;
    if (!g.current.visible) return;
    const p = stagePoint(1.5, 1.4);
    const y = k < 0.8 ? 10 - k * 12.5 : Math.abs(Math.sin((k - 0.8) * 6)) * Math.max(0, 1 - (k - 0.8)) * 1.4 + 1.1;
    g.current.position.set(p.x, y, p.z);
    g.current.rotation.y = FACE_CAM + k * 4;
  });
  return (
    <group ref={g}>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={GEO.cyl} material={mat('#ffc94a', { emissive: '#553300' })} scale={[2.2, 0.25, 2.2]} />
      <mesh position={[0, 0, 0.13]} geometry={GEO.plane} material={face} scale={[1.6, 1.6, 1]} />
    </group>
  );
}

export function IntroWorld() {
  const [phase, setPhase] = useState<'stage' | 'hood'>('stage');
  const fired = useRef(new Set<string>());
  const tRef = useRef(0);

  useLayoutEffect(() => {
    INTRO.order.forEach((id) => {
      const e = ent(`intro_${id}`);
      const p = stagePoint(-14);
      e.x = p.x;
      e.z = p.z;
      e.face = FACE_CAM;
    });
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = introTime();
    tRef.current = t;
    const once = (k: string, fn: () => void) => {
      if (!fired.current.has(k)) {
        fired.current.add(k);
        fn();
      }
    };
    const g = runtime.camGoal;

    if (t < INTRO.brokeEnd) {
      if (phase !== 'stage') setPhase('stage');
      // camera: start wide on the sunburst, settle onto the stage
      g.x = C.x;
      g.z = C.z;
      g.height = 1.6;
      g.k = 3;
      g.zoom = t < INTRO.titleEnd ? 30 : t < INTRO.friendsEnd ? 86 : 70;

      INTRO.order.forEach((id, i) => {
        const e = ent(`intro_${id}`);
        const start = INTRO.titleEnd + i * INTRO.friendDur;
        const mv = FRIENDS[id].move;
        let target: THREE.Vector3;
        if (t < start) target = stagePoint(-14);
        else if (t < start + INTRO.friendDur && t < INTRO.friendsEnd) target = stagePoint(2.6, 1.6);
        else target = stagePoint(LINEUP[id], 0);
        const dx = target.x - e.x;
        const dz = target.z - e.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.05) {
          const sp = Math.min(d * 4, mv.speed * mv.runMul * 1.4);
          const step = Math.min(d, sp * dt);
          e.x += (dx / d) * step;
          e.z += (dz / d) * step;
          e.stride += step;
          e.speed = sp;
          e.face = Math.atan2(dx, dz);
        } else {
          e.speed = 0;
          e.face = FACE_CAM;
        }
        // signature pose after arriving at centre
        if (t > start + 1.0 && t < INTRO.friendsEnd) once(`sig_${id}`, () => {
          playOneShot(`intro_${id}`, 'signature', 1.3);
          dhol('both', 0, 0.9);
        });
        // the coin lands: everyone jumps
        if (t > INTRO.brokeEnd - 1.4) once(`cel_${id}`, () => playOneShot(`intro_${id}`, 'celebrate', 1.4));
      });
      if (t > INTRO.titleEnd - 0.2) once('whoosh', () => sfx('whoosh'));
      if (t > INTRO.brokeEnd - 1.6) once('coin', () => sfx('coin'));
    } else {
      if (phase !== 'hood') setPhase('hood');
      // fly over the neighbourhood, ending on the friends’ front door
      const k = Math.min(1, (t - INTRO.brokeEnd) / (INTRO.hoodEnd - INTRO.brokeEnd - 1));
      const ease = k * k * (3 - 2 * k);
      g.x = THREE.MathUtils.lerp(28, -14, ease);
      g.z = THREE.MathUtils.lerp(14, -6, ease);
      g.zoom = THREE.MathUtils.lerp(20, 46, ease);
      g.height = 1;
      g.k = 2.5;
      INTRO.order.forEach((id, i) => {
        const e = ent(`intro_${id}`);
        e.x = -15.6 + i * 1.05;
        e.z = -6.2 + (i % 2) * 0.3;
        e.speed = 0;
        e.face = FACE_CAM;
      });
      once('hoodBeat', () => dhol('bass', 0, 1));
    }
  });

  return (
    <>
      <color attach="background" args={[phase === 'stage' ? '#2a1238' : '#efcf9f']} />
      <Sun interior={false} />
      {phase === 'stage' ? (
        <>
          <StageSet />
          <Letters />
          <Coin t={tRef} />
        </>
      ) : (
        <StreetScene />
      )}
      {INTRO.order.map((id) => (
        <Person key={id} id={`intro_${id}`} look={FRIENDS[id].look} move={FRIENDS[id].move} personality={id} />
      ))}
    </>
  );
}
