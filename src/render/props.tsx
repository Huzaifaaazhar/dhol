import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GEO, mat, texMat } from './materials';
import { posterTexture, textTexture } from './textures';
import { useGame } from '../game/store';
import { runtime } from '../game/runtime';
import { bulbMat } from './Sky';

type V3 = [number, number, number];

export function Box({ p, s, c, r, shadow = true }: { p: V3; s: V3; c: string; r?: V3; shadow?: boolean }) {
  return <mesh castShadow={shadow} receiveShadow geometry={GEO.box} material={mat(c)} position={p} scale={s} rotation={r} />;
}

export function Cyl({ p, s, c, r, lo }: { p: V3; s: V3; c: string; r?: V3; lo?: boolean }) {
  return <mesh castShadow receiveShadow geometry={lo ? GEO.cylLo : GEO.cyl} material={mat(c)} position={p} scale={s} rotation={r} />;
}

/* ── Electric pole ── */
export function Pole({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 3.2, 0]} s={[0.18, 6.4, 0.18]} c="#8d8a83" lo />
      <Box p={[0, 6.0, 0]} s={[1.6, 0.12, 0.12]} c="#5a5650" />
      <Box p={[0, 5.4, 0]} s={[1.1, 0.1, 0.1]} c="#5a5650" />
      <Box p={[0.25, 4.6, 0.15]} s={[0.4, 0.55, 0.3]} c="#3d5a80" />
      {[-0.7, -0.25, 0.25, 0.7].map((o) => (
        <mesh key={o} geometry={GEO.cylLo} material={mat('#e9e2d0')} position={[o, 6.12, 0]} scale={[0.06, 0.12, 0.06]} />
      ))}
      {/* street lamp: an arm, a tin shade and a bulb that lights up at dusk */}
      <Box p={[0.55, 5.0, 0.55]} s={[0.08, 0.08, 1.4]} c="#5a5650" r={[0, Math.PI / 4, 0]} />
      <mesh geometry={GEO.cylLo} material={mat('#3f4a3f')} position={[1.0, 4.95, 1.0]} scale={[0.32, 0.12, 0.32]} />
      <mesh geometry={GEO.sphereLo} material={bulbMat} position={[1.0, 4.82, 1.0]} scale={[0.16, 0.16, 0.16]} />
    </group>
  );
}

/** Sagging cables between points, built once as thin tubes. */
export function Wires({ pairs, sag = 0.9 }: { pairs: Array<[V3, V3]>; sag?: number }) {
  const geo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (const [a, b] of pairs) {
      const A = new THREE.Vector3(...a);
      const B = new THREE.Vector3(...b);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      mid.y -= sag * (A.distanceTo(B) / 14);
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      geos.push(new THREE.TubeGeometry(curve, 16, 0.025, 3, false));
    }
    return mergeGeos(geos);
  }, [pairs, sag]);
  return <mesh geometry={geo} material={mat('#1d1a1a')} />;
}

function mergeGeos(geos: THREE.BufferGeometry[]) {
  // minimal merge of non-indexed position/normal attributes
  const pos: number[] = [];
  const nor: number[] = [];
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    pos.push(...(ng.getAttribute('position').array as Float32Array));
    nor.push(...(ng.getAttribute('normal').array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

/* ── Neem tree ── */
export function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    g.current.rotation.z = Math.sin(t * 0.8 + x) * 0.02;
  });
  const leaf = ['#4f772d', '#5a8f29', '#3f6d22', '#6a994e'];
  return (
    <group position={[x, 0, z]} scale={s}>
      <Cyl p={[0, 1.4, 0]} s={[0.4, 2.8, 0.4]} c="#6b4f3a" lo />
      <Box p={[0.4, 2.4, 0]} s={[0.9, 0.18, 0.18]} r={[0, 0, 0.6]} c="#6b4f3a" />
      <group ref={g} position={[0, 3.4, 0]}>
        {[
          [0, 0.4, 0, 2.6],
          [1.1, 0, 0.3, 1.8],
          [-1.0, 0.1, -0.2, 1.9],
          [0.2, 0.2, 1.0, 1.7],
          [-0.2, 0.9, -0.8, 1.6],
          [0.6, 1.1, 0.4, 1.4],
        ].map(([a, b, c, r], i) => (
          <mesh key={i} castShadow geometry={GEO.ico} material={mat(leaf[i % 4])} position={[a, b, c]} scale={r} />
        ))}
      </group>
      {/* painted base ring, very common on neighbourhood trees */}
      <Cyl p={[0, 0.15, 0]} s={[1.3, 0.3, 1.3]} c="#e9d8a6" lo />
      <Cyl p={[0, 0.31, 0]} s={[1.32, 0.03, 1.32]} c="#c1121f" lo />
    </group>
  );
}

/* ── Scooter ── */
export function Scooter({ x, z, rot = 0, color = '#3a86ff' }: { x: number; z: number; rot?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Cyl p={[0.65, 0.22, 0]} s={[0.44, 0.12, 0.44]} r={[Math.PI / 2, 0, 0]} c="#222" />
      <Cyl p={[-0.6, 0.22, 0]} s={[0.44, 0.12, 0.44]} r={[Math.PI / 2, 0, 0]} c="#222" />
      <Box p={[-0.35, 0.5, 0]} s={[1.0, 0.45, 0.55]} c={color} />
      <Box p={[-0.3, 0.8, 0]} s={[0.8, 0.12, 0.45]} c="#2b2b2b" />
      <Box p={[0.45, 0.45, 0]} s={[0.35, 0.2, 0.45]} c="#ddd" />
      <Box p={[0.65, 0.75, 0]} s={[0.2, 0.9, 0.5]} c={color} r={[0, 0, -0.2]} />
      <Box p={[0.78, 1.25, 0]} s={[0.1, 0.1, 0.8]} c="#333" />
      <mesh geometry={GEO.sphereLo} material={mat('#fff6c2', { emissive: '#665500' })} position={[0.86, 1.12, 0]} scale={0.16} />
    </group>
  );
}

/* ── Auto-rickshaw ── */
export function Auto({ x = 0, z = 0, rot = 0 }: { x?: number; z?: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Cyl p={[1.0, 0.25, 0]} s={[0.5, 0.15, 0.5]} r={[Math.PI / 2, 0, 0]} c="#1a1a1a" />
      <Cyl p={[-0.8, 0.25, 0.55]} s={[0.5, 0.15, 0.5]} r={[Math.PI / 2, 0, 0]} c="#1a1a1a" />
      <Cyl p={[-0.8, 0.25, -0.55]} s={[0.5, 0.15, 0.5]} r={[Math.PI / 2, 0, 0]} c="#1a1a1a" />
      <Box p={[-0.1, 0.62, 0]} s={[2.2, 0.55, 1.3]} c="#2b9348" />
      <Box p={[0.85, 0.95, 0]} s={[0.5, 0.6, 1.1]} c="#2b9348" />
      {/* yellow canopy */}
      <mesh castShadow geometry={GEO.box} material={mat('#ffd60a')} position={[-0.25, 1.55, 0]} scale={[2.0, 0.9, 1.35]} />
      <mesh geometry={GEO.cyl} material={mat('#ffd60a')} position={[-0.25, 2.0, 0]} scale={[1.35 / 2 + 0.02, 2.0, 1.35 / 2 + 0.02]} rotation={[0, 0, Math.PI / 2]} />
      <Box p={[0.75, 1.5, 0]} s={[0.06, 0.6, 1.1]} c="#a8dadc" />
      <Box p={[-0.6, 1.2, 0.68]} s={[0.9, 0.5, 0.02]} c="#1d1d1d" />
      <Box p={[-0.6, 1.2, -0.68]} s={[0.9, 0.5, 0.02]} c="#1d1d1d" />
      <Box p={[-1.25, 0.8, 0]} s={[0.05, 0.3, 0.9]} c="#e63946" />
    </group>
  );
}

/* ── Small hatchback car ── */
export function Car({ x = 0, z = 0, rot = 0, color = '#e63946' }: { x?: number; z?: number; rot?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {[
        [0.9, 0.6],
        [0.9, -0.6],
        [-0.9, 0.6],
        [-0.9, -0.6],
      ].map(([a, b], i) => (
        <Cyl key={i} p={[a, 0.28, b]} s={[0.55, 0.2, 0.55]} r={[Math.PI / 2, 0, 0]} c="#1a1a1a" />
      ))}
      <Box p={[0, 0.65, 0]} s={[2.8, 0.6, 1.35]} c={color} />
      <Box p={[-0.2, 1.18, 0]} s={[1.6, 0.5, 1.25]} c={color} />
      <Box p={[0.62, 1.15, 0]} s={[0.05, 0.42, 1.15]} c="#a8dadc" r={[0, 0, -0.3]} />
      <Box p={[-0.2, 1.18, 0.63]} s={[1.4, 0.36, 0.02]} c="#a8dadc" />
      <Box p={[-0.2, 1.18, -0.63]} s={[1.4, 0.36, 0.02]} c="#a8dadc" />
      <mesh geometry={GEO.sphereLo} material={mat('#fff6c2', { emissive: '#665500' })} position={[1.41, 0.75, 0.45]} scale={0.18} />
      <mesh geometry={GEO.sphereLo} material={mat('#fff6c2', { emissive: '#665500' })} position={[1.41, 0.75, -0.45]} scale={0.18} />
    </group>
  );
}

/* ── Bablu's tea stall ── */
export function TeaStall({ x, z }: { x: number; z: number }) {
  const steam = useRef<THREE.Group>(null!);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    steam.current.children.forEach((c, i) => {
      const k = (t * 0.6 + i / 5) % 1;
      c.position.set(Math.sin(t * 2 + i) * 0.1, k * 1.4, 0);
      c.scale.setScalar(0.12 + k * 0.35);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k);
    });
  });
  const sign = useMemo(() => texMat(textTexture('BABLU TEA', '#ffb400', '#6a040f', 512, 128)), []);
  const roofM = useMemo(() => new THREE.MeshToonMaterial({ color: '#a5a58d', transparent: true }), []);
  const signM = useMemo(() => {
    const m = sign.clone();
    m.transparent = true;
    return m;
  }, [sign]);
  useFrame((_, dt) => {
    const s = useGame.getState();
    const pl = runtime.entities.get(s.active);
    const near = s.mode === 'play' && pl && Math.hypot(pl.x - x, pl.z - z) < 4.5;
    const target = near ? 0.25 : 1;
    roofM.opacity += (target - roofM.opacity) * Math.min(1, dt * 6);
    roofM.depthWrite = roofM.opacity > 0.95;
    signM.opacity = roofM.opacity;
  });
  const steamMats = useMemo(() => [0, 1, 2, 3, 4].map(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false })), []);
  return (
    <group position={[x, 0, z]}>
      {/* cart body */}
      <Box p={[0, 0.55, 0]} s={[3.2, 1.1, 1.3]} c="#2a9d8f" />
      <Box p={[0, 1.12, 0]} s={[3.4, 0.06, 1.45]} c="#e9c46a" />
      <Box p={[0, 0.55, 0.66]} s={[3.0, 0.2, 0.02]} c="#e76f51" />
      {/* posts and tin roof */}
      {[
        [-1.55, -0.6],
        [1.55, -0.6],
        [-1.55, 0.6],
        [1.55, 0.6],
      ].map(([a, b], i) => (
        <Box key={i} p={[a, 1.9, b]} s={[0.08, 1.6, 0.08]} c="#6b4f3a" />
      ))}
      <mesh castShadow geometry={GEO.box} material={roofM} position={[0, 2.75, 0]} scale={[3.8, 0.08, 2.1]} rotation={[0.12, 0, 0]} />
      <mesh geometry={GEO.plane} material={signM} position={[0, 2.45, 1.0]} scale={[2.4, 0.6, 1]} />
      {/* kettle on stove */}
      <Cyl p={[0.9, 1.25, 0]} s={[0.45, 0.2, 0.45]} c="#333" lo />
      <Cyl p={[0.9, 1.52, 0]} s={[0.38, 0.38, 0.38]} c="#c0c0c0" />
      <Box p={[1.15, 1.6, 0]} s={[0.3, 0.06, 0.06]} c="#c0c0c0" r={[0, 0, 0.6]} />
      <group ref={steam} position={[0.9, 1.75, 0]}>
        {steamMats.map((m, i) => (
          <mesh key={i} geometry={GEO.sphereLo} material={m} />
        ))}
      </group>
      {/* biscuit jars + glasses */}
      {[-1.1, -0.65, -0.2].map((a, i) => (
        <group key={i} position={[a, 1.35, 0.25]}>
          <Cyl p={[0, 0, 0]} s={[0.32, 0.42, 0.32]} c="#cde7f0" />
          <Cyl p={[0, 0.25, 0]} s={[0.34, 0.08, 0.34]} c={['#e63946', '#ffb703', '#2a9d8f'][i]} />
        </group>
      ))}
      {[0, 0.15, 0.3, 0.45].map((a) => (
        <Cyl key={a} p={[0.1 + a, 1.22, 0.4]} s={[0.08, 0.14, 0.08]} c="#ffe8c2" lo />
      ))}
    </group>
  );
}

export function Bench({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.45, 0]} s={[2.2, 0.1, 0.55]} c="#8c5e3c" />
      <Box p={[-0.95, 0.22, 0]} s={[0.1, 0.45, 0.5]} c="#5a3d28" />
      <Box p={[0.95, 0.22, 0]} s={[0.1, 0.45, 0.5]} c="#5a3d28" />
    </group>
  );
}

export function CarromBoard({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.3, 0]} s={[0.3, 0.6, 0.3]} c="#5a3d28" />
      <Box p={[0, 0.65, 0]} s={[1.1, 0.08, 1.1]} c="#3d2817" />
      <Box p={[0, 0.7, 0]} s={[0.95, 0.04, 0.95]} c="#f2d7a1" />
      {[
        [0.1, 0.1, '#111'],
        [-0.15, 0.05, '#fff'],
        [0.05, -0.2, '#111'],
        [0, 0, '#d62828'],
        [-0.1, -0.12, '#fff'],
      ].map(([a, b, c], i) => (
        <Cyl key={i} p={[a as number, 0.74, b as number]} s={[0.07, 0.02, 0.07]} c={c as string} lo />
      ))}
      {/* stools */}
      <Cyl p={[-1.1, 0.25, 0]} s={[0.5, 0.5, 0.5]} c="#e76f51" lo />
      <Cyl p={[1.1, 0.25, 0]} s={[0.5, 0.5, 0.5]} c="#457b9d" lo />
    </group>
  );
}

export function SabziCart({ x, z }: { x: number; z: number }) {
  const veg = ['#d62828', '#2d6a4f', '#f77f00', '#6a994e', '#9d4edd'];
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <Cyl p={[0.8, 0.35, 0.75]} s={[0.7, 0.08, 0.7]} r={[0, 0, Math.PI / 2]} c="#333" />
      <Cyl p={[0.8, 0.35, -0.75]} s={[0.7, 0.08, 0.7]} r={[0, 0, Math.PI / 2]} c="#333" />
      <Box p={[0, 0.8, 0]} s={[2.6, 0.15, 1.4]} c="#8c5e3c" />
      {veg.map((c, i) => (
        <group key={i} position={[-1.0 + i * 0.5, 0.95, 0]}>
          {[...Array(5)].map((_, k) => (
            <mesh key={k} geometry={GEO.sphereLo} material={mat(c)} position={[(k % 2) * 0.15 - 0.07, Math.floor(k / 2) * 0.12, (k - 2) * 0.2]} scale={0.2} />
          ))}
        </group>
      ))}
      <Box p={[0, 2.0, 0]} s={[2.8, 0.05, 1.6]} c="#264653" />
      <Box p={[1.3, 1.4, 0.7]} s={[0.05, 1.2, 0.05]} c="#5a3d28" />
      <Box p={[-1.3, 1.4, 0.7]} s={[0.05, 1.2, 0.05]} c="#5a3d28" />
      <Box p={[1.3, 1.4, -0.7]} s={[0.05, 1.2, 0.05]} c="#5a3d28" />
      <Box p={[-1.3, 1.4, -0.7]} s={[0.05, 1.2, 0.05]} c="#5a3d28" />
    </group>
  );
}

export function Drum({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.55, 0]} s={[0.9, 1.1, 0.9]} c="#1e6fd9" />
      <Cyl p={[0, 1.12, 0]} s={[0.7, 0.05, 0.7]} c="#174ea6" />
      <Cyl p={[0, 0.3, 0]} s={[0.92, 0.05, 0.92]} c="#174ea6" />
    </group>
  );
}

export function BarberChair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Cyl p={[0, 0.25, 0]} s={[0.5, 0.5, 0.5]} c="#999" lo />
      <Box p={[0, 0.6, 0]} s={[0.7, 0.2, 0.7]} c="#c1121f" />
      <Box p={[0, 1.1, -0.3]} s={[0.7, 0.9, 0.15]} c="#c1121f" />
      <Box p={[0.38, 0.8, 0]} s={[0.08, 0.1, 0.6]} c="#ddd" />
      <Box p={[-0.38, 0.8, 0]} s={[0.08, 0.1, 0.6]} c="#ddd" />
      {/* mirror on a stand */}
      <Box p={[0, 1.6, -1.0]} s={[0.9, 1.2, 0.06]} c="#cfe8ef" />
      <Box p={[0, 0.8, -1.0]} s={[0.08, 1.6, 0.08]} c="#555" />
    </group>
  );
}

export function Stumps({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.12, 0, 0.12].map((a) => (
        <Box key={a} p={[a, 0.35, 0]} s={[0.05, 0.7, 0.05]} c="#f1e3c6" />
      ))}
      <Box p={[0, 0.72, 0]} s={[0.3, 0.04, 0.05]} c="#e63946" />
    </group>
  );
}

export function Swing({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const seat = useRef<THREE.Group>(null!);
  useFrame((st) => {
    seat.current.rotation.x = Math.sin(st.clock.elapsedTime * 1.4) * 0.12;
  });
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[-1.0, 1.2, 0]} s={[0.12, 2.4, 0.12]} c="#6b4f3a" />
      <Box p={[1.0, 1.2, 0]} s={[0.12, 2.4, 0.12]} c="#6b4f3a" />
      <Box p={[0, 2.4, 0]} s={[2.2, 0.14, 0.14]} c="#6b4f3a" />
      <group ref={seat} position={[0, 2.35, 0]}>
        <Box p={[0, -1.7, 0]} s={[1.5, 0.1, 0.6]} c="#c1121f" />
        <Box p={[-0.7, -0.85, 0]} s={[0.03, 1.7, 0.03]} c="#ddd" shadow={false} />
        <Box p={[0.7, -0.85, 0]} s={[0.03, 1.7, 0.03]} c="#ddd" shadow={false} />
      </group>
    </group>
  );
}

/** Clothes drying on a line between two points. */
export function Laundry({ a, b, y, seed = 1 }: { a: [number, number]; b: [number, number]; y: number; seed?: number }) {
  const g = useRef<THREE.Group>(null!);
  const items = useMemo(() => {
    const cols = ['#e63946', '#ffb703', '#219ebc', '#ffffff', '#8338ec', '#06d6a0', '#fb5607', '#ff006e'];
    const n = 5;
    return [...Array(n)].map((_, i) => ({ t: (i + 0.5) / n, c: cols[(i * 3 + seed) % cols.length], h: 0.5 + ((i * 7 + seed) % 3) * 0.2, w: 0.45 + ((i + seed) % 2) * 0.2 }));
  }, [seed]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      if (i === 0) return;
      c.rotation.x = Math.sin(t * 2 + i * 1.3 + seed) * 0.15;
    });
  });
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    <group ref={g} position={[a[0], y, a[1]]} rotation={[0, -ang, 0]}>
      <Box p={[len / 2, 0, 0]} s={[len, 0.02, 0.02]} c="#ddd" shadow={false} />
      {items.map((it, i) => (
        <group key={i} position={[it.t * len, 0, 0]}>
          <mesh castShadow geometry={GEO.box} material={mat(it.c)} position={[0, -it.h / 2, 0]} scale={[it.w, it.h, 0.03]} />
        </group>
      ))}
    </group>
  );
}

/** Pigeons peck around; they scatter when someone runs past or Maru shoos them. */
export function Pigeons({ x, z, n = 9 }: { x: number; z: number; n?: number }) {
  const g = useRef<THREE.Group>(null!);
  const state = useRef({ fly: 0 });
  const birds = useMemo(() => [...Array(n)].map((_, i) => ({ ox: Math.cos(i * 2.4) * (0.4 + (i % 3) * 0.5), oz: Math.sin(i * 2.4) * (0.4 + (i % 3) * 0.4), ph: i * 0.7 })), [n]);
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const s = useGame.getState();
    const p = runtime.entities.get(s.active);
    const near = p && Math.hypot(p.x - x, p.z - z) < 2.2 && p.speed > 5;
    if (near || (s.flags['pigeons.flew'] && state.current.fly === 0 && !(g.current.userData.done as boolean))) {
      state.current.fly = 0.01;
      g.current.userData.done = true;
    }
    if (state.current.fly > 0) {
      state.current.fly += dt;
      if (state.current.fly > 7) state.current.fly = 0;
    }
    const f = state.current.fly;
    g.current.children.forEach((c, i) => {
      const b = birds[i];
      if (f > 0) {
        const k = f < 3.5 ? f : 7 - f;
        c.position.set(b.ox * (1 + k), Math.min(6, k * 2.2) + Math.sin(t * 20 + b.ph) * 0.05, b.oz * (1 + k) - k * 0.5);
        c.rotation.z = Math.sin(t * 30 + b.ph) * 0.4;
      } else {
        c.position.set(b.ox, 0, b.oz);
        c.rotation.x = Math.max(0, Math.sin(t * 3 + b.ph)) * 0.6; // pecking
        c.rotation.z = 0;
      }
    });
  });
  return (
    <group ref={g} position={[x, 0, z]}>
      {birds.map((b, i) => (
        <group key={i} rotation={[0, b.ph, 0]}>
          <mesh geometry={GEO.sphereLo} material={mat('#8d99ae')} position={[0, 0.15, 0]} scale={[0.18, 0.16, 0.26]} />
          <mesh geometry={GEO.sphereLo} material={mat('#5c677d')} position={[0, 0.27, 0.11]} scale={0.11} />
          <mesh geometry={GEO.box} material={mat('#e09f3e')} position={[0, 0.26, 0.18]} scale={[0.03, 0.03, 0.05]} />
        </group>
      ))}
    </group>
  );
}

export function PosterBoard({ x, y, z, rot = 0, i, w = 0.9 }: { x: number; y: number; z: number; rot?: number; i: number; w?: number }) {
  const m = useMemo(() => texMat(posterTexture(i)), [i]);
  return <mesh geometry={GEO.plane} material={m} position={[x, y, z]} rotation={[0, rot, 0]} scale={[w, w * 1.4, 1]} />;
}

export function WaterTank({ x, y, z, c = '#1b1b1b' }: { x: number; y: number; z: number; c?: string }) {
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 0.55, 0]} s={[1.2, 1.1, 1.2]} c={c} />
      <Cyl p={[0, 1.15, 0]} s={[0.4, 0.1, 0.4]} c={c} />
      <Box p={[0, 0.0, 0]} s={[1.3, 0.1, 1.3]} c="#777" />
    </group>
  );
}

export function Dish({ x, y, z, rot = 0 }: { x: number; y: number; z: number; rot?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.3, 0]} s={[0.06, 0.6, 0.06]} c="#999" />
      <mesh geometry={GEO.sphere} material={mat('#e5e5e5')} position={[0, 0.7, 0.1]} scale={[0.7, 0.7, 0.2]} rotation={[0.5, 0, 0]} />
    </group>
  );
}
