import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Look, MoveStyle } from '../game/data/characters';
import { ent } from '../game/runtime';
import { GEO, mat, texMat } from './materials';
import { shirtTexture } from './textures';

const DEFAULT_MOVE: MoveStyle = { speed: 3, runMul: 1.6, bounce: 0.04, stride: 0.5, armSwing: 0.4, sway: 0.03, lean: 0.03, jitter: 0, cadence: 1.6 };

const shirtMats = new Map<string, THREE.Material>();
function shirtMat(pattern: string | undefined, color: string) {
  if (!pattern || pattern === 'plain' || pattern === 'vest') return mat(color);
  const k = `${pattern}|${color}`;
  let m = shirtMats.get(k);
  if (!m) {
    m = texMat(shirtTexture(pattern, color));
    shirtMats.set(k, m);
  }
  return m;
}

export type Personality = 'sam' | 'pakya' | 'goti' | 'maru' | 'npc';

interface Props {
  id: string;
  look: Look;
  move?: MoveStyle;
  personality?: Personality;
  /** highlight ring colour for the active friend */
  ring?: string | null;
}

function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function Person({ id, look, move = DEFAULT_MOVE, personality = 'npc', ring }: Props) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const prop = useRef<THREE.Group>(null!);

  const H = look.height;
  const G = look.girth;
  const extras = look.extras ?? [];
  const longGarment = look.shirtPattern === 'saree' || look.shirtPattern === 'kurta';
  const legLen = 0.78 * H;
  const hipY = legLen + 0.08;
  const torsoH = 0.72 * H;
  const torsoW = 0.56 * G;
  const torsoD = 0.34 * G;
  const headR = 0.3 * (0.92 + H * 0.08);
  const shoulderY = torsoH * 0.9;
  const armLen = 0.62 * H;

  const m = useMemo(
    () => ({
      skin: mat(look.skin),
      skinDark: mat(new THREE.Color(look.skin).multiplyScalar(0.8).getStyle()),
      hair: mat(look.hair),
      shirt: shirtMat(look.shirtPattern, look.shirt),
      shirtPlain: mat(look.shirt),
      pants: mat(look.pants),
      shoes: mat(look.shoes),
      white: mat('#ffffff'),
      black: mat('#1a1410'),
      gold: mat('#ffc94a', { emissive: '#4a3300' }),
      glass: mat('#222831'),
      towel: mat('#d62828'),
      stick: mat('#6b4226'),
      paper: mat('#f1ead8'),
      ring: new THREE.MeshBasicMaterial({ color: ring ?? '#ffffff', transparent: true, opacity: 0.85, depthWrite: false }),
      blob: new THREE.MeshBasicMaterial({ color: '#2a1238', transparent: true, opacity: 0.22, depthWrite: false }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [look],
  );

  useEffect(() => {
    if (ring) m.ring.color.set(ring);
  }, [ring, m]);

  useFrame((state, dt) => {
    const e = ent(id);
    const t = state.clock.elapsedTime + (id.length * 1.37) % 5;
    const g = root.current;
    if (!g) return;
    g.position.set(e.x, e.y, e.z);
    const d = wrapAngle(e.face - g.rotation.y);
    g.rotation.y += d * Math.min(1, dt * 12);

    if (e.oneShot > 0) {
      e.oneShot -= dt;
      e.animT += dt;
      if (e.oneShot <= 0) {
        e.anim = 'idle';
        e.animT = 0;
      }
    } else {
      e.animT += dt;
    }

    const moving = e.speed > 0.15;
    const run = e.speed > move.speed * 1.2;
    const phase = e.stride * move.cadence * Math.PI;
    const sp = Math.min(1, e.speed / move.speed);

    // defaults
    let legLx = 0,
      legRx = 0,
      armLx = 0,
      armRx = 0,
      armLz = 0.08,
      armRz = -0.08,
      bodyY = 0,
      bodyRz = 0,
      bodyRx = 0,
      bodyRy = 0,
      torsoRx = 0,
      torsoRz = 0,
      headRy = 0,
      headRx = 0,
      headRz = 0,
      jx = 0,
      jz = 0,
      propVis = false;

    const one = e.oneShot > 0 ? e.anim : null;

    if (moving && !one) {
      const s = move.stride * (run ? 1.25 : 1) * (0.5 + sp * 0.5);
      legLx = Math.sin(phase) * s;
      legRx = -Math.sin(phase) * s;
      armLx = -Math.sin(phase) * move.armSwing * (run ? 1.6 : 1);
      armRx = Math.sin(phase) * move.armSwing * (run ? 1.6 : 1);
      bodyY = Math.abs(Math.sin(phase)) * move.bounce * (run ? 1.6 : 1);
      bodyRz = Math.sin(phase) * move.sway;
      torsoRx = move.lean * (run ? 2 : 1);
      if (personality === 'pakya') {
        // swagger: shoulders roll, head stays cool
        torsoRz = Math.sin(phase) * 0.09;
        headRz = -Math.sin(phase) * 0.06;
        armLz = 0.25;
        armRz = -0.25;
      } else if (personality === 'goti') {
        armLz = 0.3 + Math.abs(Math.sin(phase)) * 0.3;
        armRz = -0.3 - Math.abs(Math.sin(phase)) * 0.3;
      } else if (personality === 'maru') {
        headRy = Math.sin(t * 3.1) * 0.35; // keeps looking around nervously
        armLz = 0.05;
        armRz = -0.05;
      } else if (personality === 'sam') {
        headRx = -0.05; // chin up
      }
    } else if (!one) {
      const a = e.anim;
      const breathe = Math.sin(t * 2) * 0.012;
      bodyY = breathe;
      if (a === 'sit') {
        legLx = -1.45;
        legRx = -1.45;
        bodyY = -legLen * 0.6;
        armLx = -0.5;
        armRx = -0.5;
        headRy = Math.sin(t * 0.4) * 0.3;
      } else if (a === 'read') {
        legLx = -1.45;
        legRx = -1.45;
        bodyY = -legLen * 0.6;
        armLx = -1.2;
        armRx = -1.2;
        armLz = 0.35;
        armRz = -0.35;
        headRx = 0.25;
        propVis = true;
      } else if (a === 'carrom') {
        legLx = -1.45;
        legRx = -1.45;
        bodyY = -legLen * 0.6;
        torsoRx = 0.35;
        headRx = 0.3;
        const flick = (t % 4) < 0.25;
        armRx = flick ? -1.6 : -1.2;
        armLx = -0.6;
      } else if (a === 'chai') {
        // pouring tea from a height, rhythmically
        const p = Math.sin(t * 2.2);
        armRx = -1.2 - p * 0.9;
        armLx = -1.0 + p * 0.4;
        headRx = 0.15;
      } else if (a === 'cricket') {
        const c = t % 3.2;
        if (id === 'chintu') {
          armRx = c < 0.7 ? -c * 9 : 0; // windmill bowl
          bodyY = c < 0.7 ? Math.sin(c * 4.5) * 0.1 : 0;
        } else {
          torsoRx = 0.3;
          armLx = c > 0.5 && c < 0.9 ? -1.6 + (c - 0.5) * 6 : -0.8;
          armRx = armLx;
          armLz = 0.5;
          armRz = -0.1;
        }
      } else if (a === 'talk') {
        headRx = Math.sin(t * 9) * 0.06;
        armRx = -0.6 + Math.sin(t * 4) * 0.4;
        armRz = -0.3;
        armLx = -0.3 + Math.sin(t * 3 + 1) * 0.2;
      } else {
        // personality idles
        if (personality === 'sam') {
          // hands on hips, occasionally checks his watch
          const w = t % 7;
          if (w < 1.4) {
            armLx = -1.4;
            armLz = -0.4;
            headRx = 0.35;
            headRy = 0.3;
          } else {
            armLz = 0.75;
            armLx = -0.2;
          }
          armRz = -0.75;
          armRx = -0.2;
        } else if (personality === 'pakya') {
          // weight on one leg, combs hair now and then
          bodyRz = 0.05;
          legLx = 0.1;
          const c = t % 6;
          if (c < 1.2) {
            armRx = -2.8;
            armRz = -0.2 + Math.sin(c * 12) * 0.15;
            headRx = -0.15;
          } else {
            armRz = -0.25;
          }
          armLz = 0.3;
          armLx = 0.25;
        } else if (personality === 'goti') {
          // can't stand still: bounce + look around
          bodyY = Math.abs(Math.sin(t * 3)) * 0.06;
          headRy = Math.sin(t * 1.3) * 0.7;
          armLz = 0.3 + Math.sin(t * 3) * 0.2;
          armRz = -0.3 - Math.sin(t * 3) * 0.2;
        } else if (personality === 'maru') {
          // nervous trembling, hands clasped
          jx = (Math.random() - 0.5) * move.jitter;
          jz = (Math.random() - 0.5) * move.jitter;
          armLx = -0.7;
          armRx = -0.7;
          armLz = -0.45;
          armRz = 0.45;
          headRy = Math.sin(t * 0.9) > 0.8 ? 1.2 : Math.sin(t * 2) * 0.12; // glance over shoulder
          torsoRx = 0.12;
        } else {
          headRy = Math.sin(t * 0.5) * 0.25;
        }
      }
    } else {
      // one-shot animations
      const k = e.animT;
      if (one === 'signature') {
        if (personality === 'sam') {
          armRx = -2.0;
          armRz = 0.5;
          headRx = 0.1;
          headRz = 0.12;
          armLz = 0.75;
        } else if (personality === 'pakya') {
          armRx = -2.9;
          armRz = Math.sin(k * 16) * 0.2;
          bodyRx = -0.12;
          armLz = 0.9;
          armLx = -0.4;
        } else if (personality === 'goti') {
          bodyRz = Math.min(1, k / 0.9) * Math.PI * 2;
          bodyY = Math.sin(Math.min(1, k / 0.9) * Math.PI) * 0.9;
          armLz = 2.6;
          armRz = -2.6;
        } else if (personality === 'maru') {
          armLx = -2.8 + Math.sin(k * 30) * 0.4;
          armRx = -2.8 - Math.sin(k * 30) * 0.4;
          bodyY = Math.abs(Math.sin(k * 14)) * 0.2;
          headRx = -0.3;
        } else {
          armRx = -1.5;
        }
      } else if (one === 'panic') {
        armLx = -2.9 + Math.sin(k * 30) * 0.5;
        armRx = -2.9 - Math.sin(k * 30) * 0.5;
        bodyY = Math.abs(Math.sin(k * 12)) * 0.25;
        legLx = Math.sin(k * 24) * 0.8;
        legRx = -legLx;
      } else if (one === 'trip') {
        const p = Math.min(1, k / 0.35);
        const back = Math.max(0, (k - 0.6) / 0.5);
        bodyRx = (p - Math.min(1, back)) * 1.3;
        armLx = -2.5;
        armRx = -2.5;
        bodyY = -p * 0.3 * (1 - Math.min(1, back));
      } else if (one === 'celebrate') {
        armLx = -2.9;
        armRx = -2.9;
        armLz = 0.3;
        armRz = -0.3;
        bodyY = Math.abs(Math.sin(k * 8)) * 0.4;
      } else if (one === 'talk') {
        headRx = Math.sin(k * 9) * 0.06;
        armRx = -0.8 + Math.sin(k * 4) * 0.4;
      }
    }

    const L = Math.min(1, dt * 14);
    body.current.position.set(jx, bodyY, jz);
    body.current.rotation.x += (bodyRx - body.current.rotation.x) * (one === 'signature' && personality === 'goti' ? 1 : L);
    body.current.rotation.z += (bodyRz - body.current.rotation.z) * (one === 'signature' && personality === 'goti' ? 1 : L);
    body.current.rotation.y += (bodyRy - body.current.rotation.y) * L;
    torso.current.rotation.x += (torsoRx - torso.current.rotation.x) * L;
    torso.current.rotation.z += (torsoRz - torso.current.rotation.z) * L;
    head.current.rotation.y += (headRy - head.current.rotation.y) * L;
    head.current.rotation.x += (headRx - head.current.rotation.x) * L;
    head.current.rotation.z += (headRz - head.current.rotation.z) * L;
    armL.current.rotation.x += (armLx - armL.current.rotation.x) * L;
    armR.current.rotation.x += (armRx - armR.current.rotation.x) * L;
    armL.current.rotation.z += (armLz - armL.current.rotation.z) * L;
    armR.current.rotation.z += (armRz - armR.current.rotation.z) * L;
    legL.current.rotation.x += (legLx - legL.current.rotation.x) * L;
    legR.current.rotation.x += (legRx - legR.current.rotation.x) * L;
    if (prop.current) prop.current.visible = propVis;

    if (ringRef.current) {
      ringRef.current.visible = !!ring;
      const s = 1 + Math.sin(t * 4) * 0.06;
      ringRef.current.scale.set(s, s, s);
    }
  });

  const hairCap = (
    <mesh geometry={GEO.sphere} material={m.hair} position={[0, headR * 0.25, -headR * 0.06]} scale={[headR * 2.08, headR * 1.7, headR * 2.1]} />
  );

  let hair: React.ReactNode = null;
  switch (look.hairStyle) {
    case 'side':
      hair = (
        <>
          {hairCap}
          <mesh geometry={GEO.sphere} material={m.hair} position={[headR * 0.35, headR * 0.75, headR * 0.35]} scale={[headR * 1.1, headR * 0.5, headR * 0.9]} />
        </>
      );
      break;
    case 'puff':
      hair = (
        <>
          {hairCap}
          <mesh geometry={GEO.sphere} material={m.hair} position={[0, headR * 1.0, headR * 0.45]} scale={[headR * 1.6, headR * 1.0, headR * 1.2]} />
        </>
      );
      break;
    case 'curly':
      hair = (
        <>
          {[...Array(9)].map((_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <mesh
                key={i}
                geometry={GEO.sphereLo}
                material={m.hair}
                position={[Math.cos(a) * headR * 0.75, headR * (0.6 + (i % 3) * 0.12), Math.sin(a) * headR * 0.7 - headR * 0.05]}
                scale={headR * 0.85}
              />
            );
          })}
          <mesh geometry={GEO.sphereLo} material={m.hair} position={[0, headR * 0.95, 0]} scale={headR * 1.1} />
        </>
      );
      break;
    case 'flat':
      hair = (
        <>
          {hairCap}
          <mesh geometry={GEO.box} material={m.hair} position={[0, headR * 0.62, headR * 0.72]} scale={[headR * 1.5, headR * 0.35, headR * 0.3]} rotation={[0.3, 0, 0]} />
        </>
      );
      break;
    case 'bun':
      hair = (
        <>
          {hairCap}
          <mesh geometry={GEO.sphere} material={m.hair} position={[0, headR * 0.5, -headR * 1.0]} scale={headR * 0.8} />
        </>
      );
      break;
    case 'braid':
      hair = (
        <>
          {hairCap}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} geometry={GEO.sphereLo} material={m.hair} position={[0, -headR * 0.2 - i * headR * 0.42, -headR * 1.0 - i * 0.02]} scale={headR * (0.55 - i * 0.04)} />
          ))}
        </>
      );
      break;
    case 'bald':
      hair = (
        <>
          <mesh geometry={GEO.sphere} material={m.hair} position={[headR * 0.85, 0, -headR * 0.2]} scale={[headR * 0.4, headR * 0.5, headR * 0.9]} />
          <mesh geometry={GEO.sphere} material={m.hair} position={[-headR * 0.85, 0, -headR * 0.2]} scale={[headR * 0.4, headR * 0.5, headR * 0.9]} />
        </>
      );
      break;
    case 'topi':
      hair = (
        <>
          {hairCap}
          <mesh geometry={GEO.box} material={m.white} position={[0, headR * 0.95, -headR * 0.05]} scale={[headR * 1.2, headR * 0.55, headR * 1.9]} rotation={[0, Math.PI / 2, 0]} />
        </>
      );
      break;
    default:
      hair = hairCap;
  }

  const eyeY = headR * 0.15;
  const eyeZ = headR * 0.86;
  const browTilt = personality === 'maru' ? 0.45 : personality === 'sam' ? -0.1 : 0;

  return (
    <group ref={root}>
      {/* contact shadow + active ring */}
      <mesh geometry={GEO.plane} material={m.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[0.9 * G + 0.2, 0.9 * G + 0.2, 1]} renderOrder={1} />
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={m.ring} renderOrder={2}>
        <ringGeometry args={[0.55, 0.68, 32]} />
      </mesh>

      <group ref={body}>
        {/* legs */}
        <group ref={legL} position={[-0.14 * G, hipY, 0]}>
          <mesh castShadow geometry={GEO.box} material={m.pants} position={[0, -legLen / 2, 0]} scale={[0.19 * G, legLen, 0.2 * G]} />
          <mesh geometry={GEO.box} material={m.shoes} position={[0, -legLen - 0.02, 0.06]} scale={[0.2, 0.12, 0.32]} />
        </group>
        <group ref={legR} position={[0.14 * G, hipY, 0]}>
          <mesh castShadow geometry={GEO.box} material={m.pants} position={[0, -legLen / 2, 0]} scale={[0.19 * G, legLen, 0.2 * G]} />
          <mesh geometry={GEO.box} material={m.shoes} position={[0, -legLen - 0.02, 0.06]} scale={[0.2, 0.12, 0.32]} />
        </group>

        <group ref={torso} position={[0, hipY, 0]}>
          {/* torso */}
          <mesh castShadow geometry={GEO.box} material={m.shirt} position={[0, torsoH / 2, 0]} scale={[torsoW, torsoH, torsoD]} />
          <mesh geometry={GEO.box} material={m.pants} position={[0, 0.06, 0]} scale={[torsoW * 1.01, 0.14, torsoD * 1.01]} />
          {extras.includes('belly') && (
            <mesh geometry={GEO.sphere} material={m.shirtPlain} position={[0, torsoH * 0.38, torsoD * 0.32]} scale={[torsoW * 0.95, torsoH * 0.62, torsoD * 1.1]} />
          )}
          {longGarment && (
            <mesh
              castShadow
              geometry={GEO.cyl}
              material={m.shirt}
              position={[0, look.shirtPattern === 'saree' ? -legLen * 0.48 : -legLen * 0.22, 0]}
              scale={[torsoW * 1.15, look.shirtPattern === 'saree' ? legLen * 1.0 : legLen * 0.5, torsoD * 1.5]}
            />
          )}
          {look.shirtPattern === 'vest' && (
            <>
              <mesh geometry={GEO.box} material={m.skin} position={[-torsoW * 0.32, torsoH * 0.88, torsoD * 0.05]} scale={[torsoW * 0.22, torsoH * 0.25, torsoD * 1.02]} />
              <mesh geometry={GEO.box} material={m.skin} position={[torsoW * 0.32, torsoH * 0.88, torsoD * 0.05]} scale={[torsoW * 0.22, torsoH * 0.25, torsoD * 1.02]} />
            </>
          )}
          {extras.includes('chain') && (
            <mesh geometry={GEO.torus} material={m.gold} position={[0, torsoH * 0.88, torsoD * 0.42]} rotation={[1.2, 0, 0]} scale={[0.22, 0.2, 0.3]} />
          )}
          {extras.includes('towel') && (
            <mesh geometry={GEO.box} material={m.towel} position={[torsoW * 0.34, torsoH * 0.95, 0]} scale={[0.18, 0.08, torsoD * 1.4]} />
          )}
          {extras.includes('dupatta') && (
            <mesh geometry={GEO.box} material={mat('#e63946')} position={[0, torsoH * 0.62, torsoD * 0.52]} rotation={[0, 0, 0.75]} scale={[0.16, torsoH * 1.05, 0.04]} />
          )}

          {/* arms */}
          <group ref={armL} position={[-(torsoW / 2 + 0.07), shoulderY, 0]}>
            <mesh castShadow geometry={GEO.box} material={m.shirtPlain} position={[0, -armLen * 0.25, 0]} scale={[0.15, armLen * 0.5, 0.16]} />
            <mesh geometry={GEO.box} material={look.shirtPattern === 'vest' ? m.skin : m.shirtPlain} position={[0, -armLen * 0.68, 0]} scale={[0.13, armLen * 0.42, 0.14]} />
            <mesh geometry={GEO.sphereLo} material={m.skin} position={[0, -armLen * 0.93, 0]} scale={0.15} />
            {extras.includes('watch') && <mesh geometry={GEO.box} material={m.gold} position={[0, -armLen * 0.82, 0]} scale={[0.15, 0.05, 0.16]} />}
          </group>
          <group ref={armR} position={[torsoW / 2 + 0.07, shoulderY, 0]}>
            <mesh castShadow geometry={GEO.box} material={m.shirtPlain} position={[0, -armLen * 0.25, 0]} scale={[0.15, armLen * 0.5, 0.16]} />
            <mesh geometry={GEO.box} material={look.shirtPattern === 'vest' ? m.skin : m.shirtPlain} position={[0, -armLen * 0.68, 0]} scale={[0.13, armLen * 0.42, 0.14]} />
            <mesh geometry={GEO.sphereLo} material={m.skin} position={[0, -armLen * 0.93, 0]} scale={0.15} />
            {extras.includes('stick') && (
              <mesh geometry={GEO.cylLo} material={m.stick} position={[0, -armLen * 0.95, 0.1]} scale={[0.05, 1.3, 0.05]} rotation={[0.2, 0, 0]} />
            )}
          </group>
          {/* newspaper prop for reading */}
          <group ref={prop} position={[0, torsoH * 0.75, torsoD + 0.25]} visible={false}>
            <mesh geometry={GEO.box} material={m.paper} scale={[0.75, 0.5, 0.02]} rotation={[-0.3, 0, 0]} />
          </group>

          {/* neck + head */}
          <mesh geometry={GEO.cylLo} material={m.skin} position={[0, torsoH + 0.05, 0]} scale={[0.14, 0.14, 0.14]} />
          <group ref={head} position={[0, torsoH + 0.08 + headR, 0]}>
            <mesh castShadow geometry={GEO.sphere} material={m.skin} scale={[headR * 1.95, headR * 2.05, headR * 1.95]} />
            {hair}
            {/* eyes */}
            {[-1, 1].map((s) => (
              <group key={s} position={[s * headR * 0.36, eyeY, eyeZ]}>
                <mesh geometry={GEO.sphereLo} material={m.white} scale={[headR * 0.34, headR * 0.38, headR * 0.2]} />
                <mesh geometry={GEO.sphereLo} material={m.black} position={[0, 0, headR * 0.08]} scale={[headR * 0.18, headR * 0.2, headR * 0.12]} />
                <mesh
                  geometry={GEO.box}
                  material={m.hair}
                  position={[0, headR * 0.3, headR * 0.02]}
                  rotation={[0, 0, s * browTilt]}
                  scale={[headR * 0.4, headR * 0.08, headR * 0.08]}
                />
              </group>
            ))}
            <mesh geometry={GEO.sphereLo} material={m.skinDark} position={[0, -headR * 0.05, headR * 0.98]} scale={[headR * 0.25, headR * 0.3, headR * 0.25]} />
            {/* mouth */}
            <mesh geometry={GEO.box} material={mat('#7a2e2e')} position={[0, -headR * 0.42, headR * 0.86]} scale={[headR * (personality === 'pakya' ? 0.55 : 0.4), headR * 0.07, headR * 0.06]} rotation={[0, 0, personality === 'pakya' ? 0.18 : 0]} />
            {extras.includes('moustache') && (
              <mesh geometry={GEO.box} material={m.hair} position={[0, -headR * 0.26, headR * 0.93]} scale={[headR * 0.75, headR * 0.12, headR * 0.1]} />
            )}
            {extras.includes('beard') && <mesh geometry={GEO.sphere} material={m.hair} position={[0, -headR * 0.6, headR * 0.5]} scale={[headR * 1.2, headR * 0.8, headR * 0.9]} />}
            {extras.includes('glasses') && (
              <group position={[0, eyeY, eyeZ + headR * 0.12]}>
                <mesh geometry={GEO.torus} material={m.glass} position={[-headR * 0.36, 0, 0]} scale={headR * 0.6} />
                <mesh geometry={GEO.torus} material={m.glass} position={[headR * 0.36, 0, 0]} scale={headR * 0.6} />
              </group>
            )}
            {extras.includes('shades') && (
              <mesh geometry={GEO.box} material={m.glass} position={[0, headR * 0.82, headR * 0.55]} rotation={[-0.5, 0, 0]} scale={[headR * 1.4, headR * 0.22, headR * 0.12]} />
            )}
            {extras.includes('ears') ? (
              [-1, 1].map((s) => (
                <mesh key={s} geometry={GEO.sphereLo} material={m.skin} position={[s * headR * 1.02, 0, 0]} scale={[headR * 0.25, headR * 0.6, headR * 0.45]} />
              ))
            ) : (
              [-1, 1].map((s) => (
                <mesh key={s} geometry={GEO.sphereLo} material={m.skin} position={[s * headR * 0.97, 0, 0]} scale={[headR * 0.16, headR * 0.34, headR * 0.26]} />
              ))
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

/* ───────────── animals ───────────── */

export function Cow({ id }: { id: string }) {
  const root = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const e = ent(id);
    root.current.position.set(e.x, 0, e.z);
    root.current.rotation.y = e.face;
    const t = s.clock.elapsedTime;
    headRef.current.rotation.x = 0.1 + Math.sin(t * 1.3) * 0.08; // chewing
    headRef.current.rotation.y = Math.sin(t * 0.3) * 0.4;
    tail.current.rotation.z = Math.sin(t * 2.4) * 0.5;
  });
  const white = mat('#f4f1ea');
  const spot = mat('#5c4033');
  return (
    <group ref={root}>
      <mesh geometry={GEO.plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[1.6, 2.6, 1]} material={basic('#2a1238', 0.2)} />
      {/* lying body */}
      <mesh castShadow geometry={GEO.box} material={white} position={[0, 0.55, 0]} scale={[1.0, 0.8, 2.0]} />
      <mesh geometry={GEO.box} material={spot} position={[0.51, 0.65, 0.2]} scale={[0.02, 0.4, 0.6]} />
      <mesh geometry={GEO.box} material={spot} position={[-0.51, 0.5, -0.4]} scale={[0.02, 0.35, 0.5]} />
      <mesh geometry={GEO.sphere} material={mat('#f6b7c5')} position={[0, 0.2, -0.3]} scale={[0.4, 0.2, 0.4]} />
      {/* folded legs */}
      <mesh geometry={GEO.box} material={white} position={[0.45, 0.15, 0.7]} scale={[0.3, 0.25, 0.7]} />
      <mesh geometry={GEO.box} material={white} position={[-0.45, 0.15, 0.7]} scale={[0.3, 0.25, 0.7]} />
      <group ref={headRef} position={[0, 0.95, 1.05]}>
        <mesh castShadow geometry={GEO.box} material={white} position={[0, 0, 0.25]} scale={[0.55, 0.55, 0.7]} />
        <mesh geometry={GEO.box} material={mat('#f6b7c5')} position={[0, -0.12, 0.62]} scale={[0.5, 0.3, 0.12]} />
        <mesh geometry={GEO.cone} material={mat('#e8d9b0')} position={[0.25, 0.38, 0.1]} rotation={[0, 0, -0.5]} scale={[0.1, 0.3, 0.1]} />
        <mesh geometry={GEO.cone} material={mat('#e8d9b0')} position={[-0.25, 0.38, 0.1]} rotation={[0, 0, 0.5]} scale={[0.1, 0.3, 0.1]} />
        <mesh geometry={GEO.box} material={white} position={[0.38, 0.12, 0.1]} scale={[0.25, 0.1, 0.15]} />
        <mesh geometry={GEO.box} material={white} position={[-0.38, 0.12, 0.1]} scale={[0.25, 0.1, 0.15]} />
        <mesh geometry={GEO.sphereLo} material={mat('#111')} position={[0.2, 0.1, 0.55]} scale={0.09} />
        <mesh geometry={GEO.sphereLo} material={mat('#111')} position={[-0.2, 0.1, 0.55]} scale={0.09} />
        {/* marigold garland */}
        <mesh geometry={GEO.torus} material={mat('#ff9f1c')} position={[0, -0.25, -0.15]} rotation={[1.3, 0, 0]} scale={[0.75, 0.75, 1.5]} />
      </group>
      <mesh ref={tail} geometry={GEO.box} material={white} position={[0, 0.6, -1.05]} scale={[0.06, 0.7, 0.06]} />
    </group>
  );
}

export function Dog({ id }: { id: string }) {
  const root = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Mesh>(null!);
  const legs = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const e = ent(id);
    root.current.position.set(e.x, 0, e.z);
    const d = wrapAngle(e.face - root.current.rotation.y);
    root.current.rotation.y += d * 0.15;
    const t = s.clock.elapsedTime;
    tail.current.rotation.z = Math.sin(t * 14) * 0.6;
    const mv = e.speed > 0.1;
    legs.current.children.forEach((c, i) => {
      c.rotation.x = mv ? Math.sin(t * 14 + (i % 2) * Math.PI) * 0.6 : 0;
    });
  });
  const fur = mat('#c98e55');
  return (
    <group ref={root}>
      <mesh geometry={GEO.plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[0.7, 1.2, 1]} material={basic('#2a1238', 0.2)} />
      <mesh castShadow geometry={GEO.box} material={fur} position={[0, 0.45, 0]} scale={[0.35, 0.32, 0.85]} />
      <mesh geometry={GEO.box} material={fur} position={[0, 0.68, 0.5]} scale={[0.3, 0.3, 0.35]} />
      <mesh geometry={GEO.box} material={mat('#3b2a1e')} position={[0, 0.62, 0.72]} scale={[0.14, 0.1, 0.12]} />
      <mesh geometry={GEO.box} material={mat('#8a5a33')} position={[0.12, 0.85, 0.45]} scale={[0.07, 0.15, 0.1]} />
      <mesh geometry={GEO.box} material={mat('#8a5a33')} position={[-0.12, 0.85, 0.45]} scale={[0.07, 0.15, 0.1]} />
      <mesh ref={tail} geometry={GEO.box} material={fur} position={[0, 0.6, -0.48]} rotation={[0.6, 0, 0]} scale={[0.06, 0.3, 0.06]} />
      <group ref={legs}>
        {[
          [0.12, 0.3],
          [-0.12, 0.3],
          [0.12, -0.3],
          [-0.12, -0.3],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0.3, z]}>
            <mesh geometry={GEO.box} material={fur} position={[0, -0.15, 0]} scale={[0.08, 0.3, 0.08]} />
          </group>
        ))}
      </group>
    </group>
  );
}

function basic(color: string, opacity: number) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}
