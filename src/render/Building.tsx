import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingDef } from '../game/data/scenes/street';
import { GEO, mat, toonRamp } from './materials';
import { facadeTexture, signTexture } from './textures';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { Box, Dish, Laundry, WaterTank } from './props';

const FLOOR_H = 3.2;
const CAM_DIR = new THREE.Vector3(1, 1.15, 1).normalize();

function rayHitsBox(ox: number, oy: number, oz: number, min: THREE.Vector3, max: THREE.Vector3) {
  let tmin = 0;
  let tmax = 200;
  const o = [ox, oy, oz];
  const d = [CAM_DIR.x, CAM_DIR.y, CAM_DIR.z];
  const mn = [min.x, min.y, min.z];
  const mx = [max.x, max.y, max.z];
  for (let i = 0; i < 3; i++) {
    const inv = 1 / d[i];
    let t1 = (mn[i] - o[i]) * inv;
    let t2 = (mx[i] - o[i]) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmax < tmin) return false;
  }
  return true;
}

export function Building({ b, seed }: { b: BuildingDef; seed: number }) {
  const group = useRef<THREE.Group>(null!);
  const opacity = useRef(1);
  const h = b.floors * FLOOR_H;
  const front = b.front === 's' ? 1 : -1;
  const fz = (b.d / 2) * front; // local z of front face
  const cols = Math.max(2, Math.round(b.w / 2.4));
  const sideCols = Math.max(1, Math.round(b.d / 2.8));
  const hasShopFront = b.style === 'shop' || b.style === 'garage' || b.style === 'cinema' || b.id === 'apartments';

  const mats = useMemo(() => {
    const ramp = toonRamp();
    const mk = (opts: THREE.MeshToonMaterialParameters) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...opts });
    const frontM = mk({ map: facadeTexture(seed, b.color, b.trim, b.floors, cols, hasShopFront) });
    const sideM = mk({ map: facadeTexture(seed + 50, b.color, b.trim, b.floors, sideCols, false) });
    const plain = mk({ color: new THREE.Color(b.color).multiplyScalar(0.92) });
    const roof = mk({ color: '#b8aa98' });
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const faces = [sideM, sideM, roof, plain, b.front === 's' ? frontM : plain, b.front === 'n' ? frontM : plain];
    return { faces };
  }, [b, seed, cols, sideCols, hasShopFront]);

  // make every material in this building fade-able independently
  const fadeMats = useRef<THREE.Material[]>([]);
  useLayoutEffect(() => {
    const list: THREE.Material[] = [];
    group.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const cloned = ms.map((m) => {
        if (m.userData.bld === b.id) return m;
        const c = m.clone();
        c.userData.bld = b.id;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
      list.push(...cloned);
    });
    fadeMats.current = list;
  }, [b.id]);

  const min = useMemo(() => new THREE.Vector3(b.x - b.w / 2, 0, b.z - b.d / 2), [b]);
  const max = useMemo(() => new THREE.Vector3(b.x + b.w / 2, h + 1, b.z + b.d / 2), [b, h]);

  useFrame((_, dt) => {
    const st = useGame.getState();
    let target = 1;
    if (st.mode === 'play') {
      const pts: Array<[number, number]> = [];
      const p = runtime.entities.get(st.active);
      if (p) pts.push([p.x, p.z]);
      if (st.talkingTo) {
        const o = runtime.entities.get(st.talkingTo);
        if (o) pts.push([o.x, o.z]);
      }
      for (const [x, z] of pts) {
        if (rayHitsBox(x, 0.6, z, min, max) || rayHitsBox(x, 1.8, z, min, max)) {
          target = 0.12;
          break;
        }
      }
    }
    if (Math.abs(target - opacity.current) < 0.005) return;
    opacity.current += (target - opacity.current) * Math.min(1, dt * 8);
    const faded = opacity.current < 0.98;
    for (const m of fadeMats.current) {
      m.transparent = faded;
      m.opacity = opacity.current;
      m.depthWrite = !faded;
      m.needsUpdate = true;
    }
  });

  const signM = useMemo(() => (b.sign ? new THREE.MeshToonMaterial({ map: signTexture(b.sign.text, b.sign.sub, b.sign.bg, b.sign.fg), gradientMap: toonRamp() }) : null), [b.sign]);
  const signW = b.signW ?? Math.min(b.w * 0.75, 7.5);

  return (
    <group ref={group} position={[b.x, 0, b.z]}>
      <mesh castShadow receiveShadow geometry={GEO.box} material={mats.faces} position={[0, h / 2, 0]} scale={[b.w, h, b.d]} />
      {/* parapet */}
      <Box p={[0, h + 0.25, b.d / 2 - 0.1]} s={[b.w, 0.5, 0.2]} c={b.trim} />
      <Box p={[0, h + 0.25, -b.d / 2 + 0.1]} s={[b.w, 0.5, 0.2]} c={b.trim} />
      <Box p={[b.w / 2 - 0.1, h + 0.25, 0]} s={[0.2, 0.5, b.d]} c={b.trim} />
      <Box p={[-b.w / 2 + 0.1, h + 0.25, 0]} s={[0.2, 0.5, b.d]} c={b.trim} />
      {/* rooftop clutter */}
      {b.style !== 'bungalow' && b.style !== 'filler' && <WaterTank x={b.w * 0.25} y={h} z={-b.d * 0.2} />}
      {(b.style === 'apartment' || b.style === 'chawl' || b.style === 'house') && <Dish x={-b.w * 0.3} y={h} z={b.d * 0.2} rot={0.8} />}
      {b.style === 'filler' && seed % 2 === 0 && <WaterTank x={-b.w * 0.2} y={h} z={0} c="#2d6a4f" />}

      {signM && (
        <mesh geometry={GEO.plane} material={signM} position={[b.signX ?? 0, FLOOR_H + 0.1, fz + front * 0.12]} rotation={[0, b.front === 's' ? 0 : Math.PI, 0]} scale={[signW, signW / 4, 1]} />
      )}

      <StyleDetails b={b} h={h} fz={fz} front={front} />
    </group>
  );
}

function StyleDetails({ b, h, fz, front }: { b: BuildingDef; h: number; fz: number; front: number }) {
  const out = (dz: number) => fz + front * dz;
  const rotY = b.front === 's' ? 0 : Math.PI;
  switch (b.style) {
    case 'chawl':
      return (
        <>
          <Door x={0} z={out(0.02)} rotY={rotY} color="#7f4f24" />
          {/* first-floor balcony with laundry */}
          <Box p={[0, FLOOR_H + 0.5, out(0.6)]} s={[b.w * 0.8, 0.15, 1.2]} c={b.trim} />
          {[...Array(13)].map((_, i) => (
            <Box key={i} p={[-b.w * 0.4 + (i * b.w * 0.8) / 12, FLOOR_H + 1.0, out(1.15)]} s={[0.05, 0.9, 0.05]} c="#2b2d42" shadow={false} />
          ))}
          <Box p={[0, FLOOR_H + 1.45, out(1.15)]} s={[b.w * 0.8, 0.07, 0.07]} c="#2b2d42" />
          <Laundry a={[-b.w * 0.35, out(0.9)]} b={[b.w * 0.35, out(0.9)]} y={FLOOR_H + 2.5} seed={3} />
          {/* small potted tulsi by the door */}
          <Box p={[1.4, 0.35, out(0.4)]} s={[0.5, 0.7, 0.5]} c="#c1440e" />
          <mesh geometry={GEO.ico} material={mat('#386641')} position={[1.4, 0.95, out(0.4)]} scale={0.6} />
        </>
      );
    case 'bungalow':
      return (
        <>
          <Door x={0} z={out(0.02)} rotY={rotY} color="#9c2c2c" double />
          {/* porch */}
          <Box p={[0, FLOOR_H - 0.2, out(0.9)]} s={[4, 0.2, 1.8]} c="#ffffff" />
          <Box p={[-1.8, (FLOOR_H - 0.3) / 2, out(1.6)]} s={[0.25, FLOOR_H - 0.3, 0.25]} c="#ffffff" />
          <Box p={[1.8, (FLOOR_H - 0.3) / 2, out(1.6)]} s={[0.25, FLOOR_H - 0.3, 0.25]} c="#ffffff" />
          <Box p={[0, 0.08, out(0.9)]} s={[4.4, 0.16, 2.0]} c="#e0d4c2" />
          {/* pyramid tile roof */}
          <mesh castShadow material={mat('#b23a48')} position={[0, h + 1.2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[b.w * 1.45, 2.4, b.d * 1.45]}>
            <coneGeometry args={[0.5, 1, 4]} />
          </mesh>
        </>
      );
    case 'shop':
      return (
        <>
          {/* open shop front with goods */}
          <mesh geometry={GEO.plane} material={mat('#2a2018')} position={[0, 1.35, out(0.01)]} rotation={[0, rotY, 0]} scale={[b.w * 0.8, 2.6, 1]} />
          <Box p={[0, 2.85, out(0.05)]} s={[b.w * 0.82, 0.3, 0.12]} c="#8d99ae" />
          {/* striped awning */}
          {[...Array(8)].map((_, i) => (
            <Box key={i} p={[-b.w * 0.42 + (i + 0.5) * (b.w * 0.84) / 8, 2.95, out(0.75)]} s={[(b.w * 0.84) / 8, 0.06, 1.5]} r={[front * 0.35, 0, 0]} c={i % 2 ? '#ffffff' : '#c1121f'} />
          ))}
          {/* hanging snack packets */}
          {[...Array(10)].map((_, i) => (
            <Box key={i} p={[-b.w * 0.36 + i * 0.75, 2.35, out(0.25)]} s={[0.35, 0.5, 0.06]} c={['#ffb703', '#e63946', '#3a86ff', '#06d6a0'][i % 4]} shadow={false} />
          ))}
          {/* crates outside */}
          <Box p={[-b.w * 0.33, 0.35, out(0.6)]} s={[1.0, 0.7, 0.8]} c="#a0522d" />
          <Box p={[-b.w * 0.33 + 1.1, 0.3, out(0.6)]} s={[0.9, 0.6, 0.8]} c="#8b5a2b" />
          {[...Array(6)].map((_, i) => (
            <mesh key={i} geometry={GEO.sphereLo} material={mat(i % 2 ? '#f77f00' : '#90be6d')} position={[-b.w * 0.33 - 0.3 + (i % 3) * 0.3, 0.8, out(0.45 + Math.floor(i / 3) * 0.3)]} scale={0.22} />
          ))}
          <Box p={[b.w * 0.34, 0.5, out(0.5)]} s={[0.9, 1.0, 0.7]} c="#e63946" />
        </>
      );
    case 'apartment':
      return (
        <>
          {/* barber shop glass front on the ground floor, left */}
          <mesh geometry={GEO.plane} material={mat('#a8dadc')} position={[-3.5, 1.4, out(0.01)]} rotation={[0, rotY, 0]} scale={[4.2, 2.4, 1]} />
          <Box p={[-1.1, 1.4, out(0.05)]} s={[0.25, 2.8, 0.1]} c="#e63946" />
          <Door x={3} z={out(0.02)} rotY={rotY} color="#264653" />
          {[1, 2, 3].map((f) => (
            <group key={f}>
              <Box p={[2.5, f * FLOOR_H + 0.4, out(0.5)]} s={[4.5, 0.15, 1.0]} c={b.trim} />
              <Box p={[2.5, f * FLOOR_H + 0.9, out(0.98)]} s={[4.5, 0.9, 0.06]} c={['#e9c46a', '#2a9d8f', '#e76f51'][f - 1]} />
              <Box p={[-3.4, f * FLOOR_H + 0.9, out(0.25)]} s={[1.0, 0.6, 0.5]} c="#e8e8e8" />
            </group>
          ))}
          <Laundry a={[0.5, out(0.9)]} b={[4.5, out(0.9)]} y={2 * FLOOR_H + 2.4} seed={5} />
          {/* barber pole */}
          <mesh geometry={GEO.cylLo} material={mat('#ffffff')} position={[-5.9, 1.5, out(0.2)]} scale={[0.25, 1.4, 0.25]} />
          <mesh geometry={GEO.cylLo} material={mat('#e63946')} position={[-5.9, 1.5, out(0.2)]} scale={[0.27, 0.3, 0.27]} />
        </>
      );
    case 'cinema':
      return (
        <>
          <mesh castShadow geometry={GEO.box} material={mat('#ffcdb2')} position={[0, h + 1.6, out(-1.5)]} scale={[3, 3.2, 1.2]} />
          <mesh geometry={GEO.box} material={mat('#e5989b')} position={[0, h + 3.4, out(-1.5)]} scale={[2.2, 0.5, 1]} />
          {[...Array(5)].map((_, i) => (
            <Box key={i} p={[-4.6 + i * 2.3, 1.6, out(0.05)]} s={[0.35, 3.2, 0.2]} c="#ffcdb2" />
          ))}
          <Box p={[0, 3.2, out(0.4)]} s={[b.w, 0.2, 0.8]} c="#3d405b" />
        </>
      );
    case 'garage':
      return (
        <>
          {/* corrugated shutter, half open */}
          {[...Array(7)].map((_, i) => (
            <Box key={i} p={[0, 1.6 + i * 0.22, out(0.04)]} s={[4.2, 0.2, 0.06]} c={i % 2 ? '#9aa5b1' : '#7d8794'} />
          ))}
          <mesh geometry={GEO.plane} material={mat('#141414')} position={[0, 0.8, out(0.02)]} rotation={[0, rotY, 0]} scale={[4.0, 1.6, 1]} />
          {/* spray-painted doodles */}
          <Box p={[-3.6, 1.3, out(0.02)]} s={[1.2, 0.9, 0.02]} c="#ffb400" shadow={false} />
          <Box p={[3.4, 2.1, out(0.02)]} s={[1.0, 0.5, 0.02]} c="#e4007c" shadow={false} />
          {/* tyre stack */}
          <mesh geometry={GEO.torus} material={mat('#222')} position={[3.6, 0.2, out(0.8)]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1.2, 3]} />
          <mesh geometry={GEO.torus} material={mat('#222')} position={[3.6, 0.45, out(0.8)]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1.2, 3]} />
        </>
      );
    case 'house':
      return (
        <>
          <Door x={b.id === 'blockB' ? -2 : 3} z={out(0.02)} rotY={rotY} color="#6c584c" />
          {[...Array(b.floors - 1)].map((_, f) => (
            <group key={f}>
              <Box p={[-1.5, (f + 1) * FLOOR_H + 0.4, out(0.5)]} s={[4, 0.15, 1.0]} c={b.trim} />
              <Box p={[-1.5, (f + 1) * FLOOR_H + 0.85, out(0.98)]} s={[4, 0.8, 0.06]} c="#2b2d42" />
            </group>
          ))}
          <Box p={[b.w * 0.3, 1.0, out(0.3)]} s={[1.0, 0.6, 0.5]} c="#e8e8e8" />
        </>
      );
    default:
      return null;
  }
}

function Door({ x, z, rotY, color, double }: { x: number; z: number; rotY: number; color: string; double?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <Box p={[0, 1.25, 0.02]} s={[double ? 2.0 : 1.3, 2.5, 0.08]} c={color} />
      <Box p={[0, 2.6, 0.04]} s={[double ? 2.3 : 1.6, 0.2, 0.12]} c="#f1e3c8" />
      {double && <Box p={[0, 1.25, 0.08]} s={[0.04, 2.4, 0.04]} c="#3d1f1f" />}
      <mesh geometry={GEO.sphereLo} material={mat('#ffc94a')} position={[double ? 0.2 : 0.45, 1.2, 0.1]} scale={0.1} />
      {/* toran (festive door hanging) */}
      {[...Array(7)].map((_, i) => (
        <mesh key={i} geometry={GEO.cone} material={mat(i % 2 ? '#ff9f1c' : '#2d6a4f')} position={[-0.6 + i * 0.2, 2.38, 0.1]} rotation={[Math.PI, 0, 0]} scale={[0.12, 0.2, 0.05]} />
      ))}
    </group>
  );
}
