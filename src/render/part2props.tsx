import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharId, SceneId } from '../game/types';
import { useGame } from '../game/store';
import { ent, runtime } from '../game/runtime';
import { agentsIn } from '../game/sim/agents';
import { PAWS, JUNK } from '../game/missions/dhol';
import { JAI_BAG } from '../game/missions/jai';
import { ZIKOMO_CAR } from '../game/missions/zikomo';
import { TIWARI_CHAIR } from '../game/missions/chaos';
import { GEO, mat } from './materials';
import { Box, Car, Cyl } from './props';

/* ───────────── the dhol ───────────── */

const barrelGeo = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(0.42 + Math.sin(t * Math.PI) * 0.07, (t - 0.5) * 1.0));
  }
  return new THREE.LatheGeometry(pts, 18);
})();

/** Rahul’s dhol: wooden barrel, two skin heads, rope lacing, a red strap and tassels. */
export function DholModel({ fake = false }: { fake?: boolean }) {
  const lace = useMemo(() => [...Array(10)].map((_, i) => (i / 10) * Math.PI * 2), []);
  if (fake) {
    // biscuit tin + rope + a tabla skin, or Lalaji's tasselled wedding dhol
    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        <Cyl p={[0, 0, 0]} s={[0.8, 0.9, 0.8]} c="#c0c0c0" />
        <Cyl p={[0, 0.46, 0]} s={[0.82, 0.04, 0.82]} c="#f1e3c8" />
        <Cyl p={[0, -0.46, 0]} s={[0.82, 0.04, 0.82]} c="#e9c46a" />
        <mesh geometry={GEO.torus} material={mat('#c9a227')} rotation={[Math.PI / 2, 0, 0]} scale={[0.85, 0.85, 1.4]} />
        <Box p={[0.42, 0, 0]} s={[0.04, 0.6, 0.2]} c="#e63946" shadow={false} />
      </group>
    );
  }
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow geometry={barrelGeo} material={mat('#8b4513')} />
      <Cyl p={[0, 0.5, 0]} s={[0.86, 0.03, 0.86]} c="#f3e5c3" />
      <Cyl p={[0, -0.5, 0]} s={[0.86, 0.03, 0.86]} c="#efdcb1" />
      <mesh geometry={GEO.torus} material={mat('#5c3317')} position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.88, 0.88, 1.2]} />
      <mesh geometry={GEO.torus} material={mat('#5c3317')} position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.88, 0.88, 1.2]} />
      {lace.map((a, i) => (
        <mesh
          key={i}
          geometry={GEO.box}
          material={mat('#f1e3c8')}
          position={[Math.cos(a) * 0.47, 0, Math.sin(a) * 0.47]}
          rotation={[0, -a, i % 2 ? 0.45 : -0.45]}
          scale={[0.025, 1.0, 0.025]}
        />
      ))}
      <mesh geometry={GEO.torus} material={mat('#c1121f')} rotation={[0, 0, Math.PI / 2]} scale={[1.05, 0.8, 1]} />
      {[0.3, -0.3].map((y) => (
        <group key={y} position={[0.5, y, 0]}>
          <Box p={[0, -0.12, 0]} s={[0.05, 0.25, 0.05]} c="#ffb400" shadow={false} />
          <mesh geometry={GEO.sphereLo} material={mat('#ff006e')} position={[0, -0.27, 0]} scale={0.09} />
        </group>
      ))}
    </group>
  );
}

const PLACES: Record<string, { scene: SceneId; x: number; z: number; y?: number; rot?: number }> = {
  lane: { scene: 'street', x: JUNK.x, z: JUNK.z, y: 0.45, rot: 0.6 },
  hideout: { scene: 'hideout', x: 0.2, z: 2.2, y: 0.45, rot: 0.3 },
  house: { scene: 'house', x: -4.9, z: 1.6, y: 0.25, rot: 0 },
  tiwari: { scene: 'street', x: TIWARI_CHAIR.x - 0.9, z: TIWARI_CHAIR.z - 0.2, y: 0.45, rot: 1.2 },
};

/** Draws the real dhol wherever it is in this scene, and the fake one in the hideout. */
export function DholInWorld({ scene }: { scene: SceneId }) {
  const dhol = useGame((s) => s.dhol);
  const fake = useGame((s) => s.mstate.fake === 'hideout');
  const carried = useRef<THREE.Group>(null!);
  const who = dhol.startsWith('carried:') ? (dhol.slice(8) as CharId) : null;
  const whereWho = useGame((s) => (who ? s.where[who] : null));
  useFrame((st) => {
    if (!who || !carried.current) return;
    const e = ent(who);
    const f = e.face;
    // slung at the hip, bobbing with each step
    carried.current.position.set(e.x + Math.cos(f) * 0.42 + Math.sin(f) * 0.15, 1.0 + Math.abs(Math.sin(e.stride * 3)) * 0.05, e.z - Math.sin(f) * 0.42 + Math.cos(f) * 0.15);
    carried.current.rotation.y = f;
    carried.current.scale.setScalar(0.72);
    void st;
  });
  const place = PLACES[dhol];
  return (
    <>
      {place && place.scene === scene && (
        <group position={[place.x, place.y ?? 0.45, place.z]} rotation={[0, place.rot ?? 0, 0]} scale={dhol === 'house' ? 0.6 : 0.85}>
          <DholModel />
        </group>
      )}
      {who && whereWho === scene && (
        <group ref={carried}>
          <DholModel />
        </group>
      )}
      {fake && scene === 'hideout' && (
        <group position={[-0.8, 0.45, 0.6]} rotation={[0, -0.4, 0]} scale={0.85}>
          <DholModel fake />
        </group>
      )}
    </>
  );
}

/* ───────────── environmental clues ───────────── */

/** Moti’s muddy paw prints, from the cricket pitch to the junk behind the cinema. */
export function PawPrints() {
  const show = useGame((s) => !!s.flags.paws && s.missions.dhol?.status === 'active' && s.dhol === 'junk');
  const prints = useMemo(() => {
    const out: Array<{ x: number; z: number; r: number }> = [];
    for (let i = 0; i < PAWS.length - 1; i++) {
      const [ax, az] = PAWS[i];
      const [bx, bz] = PAWS[i + 1];
      const r = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < 3; k++) {
        const t = k / 3;
        const side = k % 2 ? 0.14 : -0.14;
        out.push({ x: ax + (bx - ax) * t + Math.cos(r) * side, z: az + (bz - az) * t - Math.sin(r) * side, r });
      }
    }
    return out;
  }, []);
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#4a2e1c', transparent: true, opacity: 0.75, depthWrite: false }), []);
  if (!show) return null;
  return (
    <group>
      {prints.map((p, i) => (
        <group key={i} position={[p.x, 0.04, p.z]} rotation={[0, p.r, 0]}>
          <mesh geometry={GEO.sphereLo} material={m} scale={[0.14, 0.01, 0.18]} />
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} geometry={GEO.sphereLo} material={m} position={[x, 0, 0.14]} scale={[0.05, 0.01, 0.05]} />
          ))}
        </group>
      ))}
    </group>
  );
}

/** A heap of junk behind the cinema (the dhol is buried in it). */
export function JunkPile() {
  return (
    <group position={[JUNK.x + 0.2, 0, JUNK.z + 0.6]}>
      <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 1.0]} c="#6b705c" />
      <Box p={[0.4, 0.75, 0.1]} s={[0.7, 0.4, 0.6]} c="#a5a58d" r={[0, 0.5, 0.2]} />
      <mesh geometry={GEO.torus} material={mat('#333')} position={[-0.6, 0.6, -0.2]} rotation={[0.3, 0.6, 0]} scale={[0.9, 0.9, 1]} />
      <Cyl p={[0.7, 0.3, -0.5]} s={[0.4, 0.6, 0.4]} c="#3a86ff" lo />
      <Box p={[-0.3, 0.9, 0.3]} s={[0.5, 0.06, 0.8]} c="#9c6644" r={[0.4, 0, 0.3]} />
    </group>
  );
}

export function JaiBag() {
  const show = useGame((s) => s.missions.jai?.status === 'active' && !s.missions.jai.done.includes('jai.proof'));
  if (!show) return null;
  return (
    <group position={[JAI_BAG.x, 0, JAI_BAG.z]} rotation={[0, 0.4, 0]}>
      <Box p={[0, 0.25, 0]} s={[0.6, 0.5, 0.35]} c="#283618" />
      <Box p={[0, 0.52, 0]} s={[0.4, 0.06, 0.1]} c="#111" />
    </group>
  );
}

export function ZikomoCar() {
  const show = useGame((s) => !!s.mstate.zcar && s.missions.zikomo?.status === 'active');
  if (!show) return null;
  return <Car x={ZIKOMO_CAR.x} z={ZIKOMO_CAR.z} rot={0.2} color="#f8f9fa" />;
}

/** Shambhu’s handcart, trundling along behind him. */
export function CartProp({ follow }: { follow: string }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const e = ent(follow);
    g.current.position.set(e.x - Math.sin(e.face) * 1.3, 0, e.z - Math.cos(e.face) * 1.3);
    g.current.rotation.y = e.face;
  });
  return (
    <group ref={g}>
      <Cyl p={[0.6, 0.35, 0]} s={[0.7, 0.08, 0.7]} r={[0, 0, Math.PI / 2]} c="#333" />
      <Cyl p={[-0.6, 0.35, 0]} s={[0.7, 0.08, 0.7]} r={[0, 0, Math.PI / 2]} c="#333" />
      <Box p={[0, 0.75, 0]} s={[1.3, 0.12, 1.8]} c="#8c5e3c" />
      <Box p={[0.1, 1.0, 0.2]} s={[0.9, 0.4, 0.8]} c="#e9d8a6" />
      <Cyl p={[-0.3, 1.0, -0.5]} s={[0.25, 0.5, 0.25]} c="#2a9d8f" lo />
      <Box p={[0, 1.3, 0.2]} s={[0.7, 0.15, 0.5]} c="#bfa98d" />
    </group>
  );
}

/* ───────────── Zikomo's men: sightlines (shown by Maru’s lookout, or when chasing) ───────────── */

export function VisionCones({ scene }: { scene: SceneId }) {
  useGame((s) => s.agentsV);
  const list = agentsIn(scene).filter((a) => a.vision);
  return (
    <>
      {list.map((a) => (
        <Cone key={a.id} id={a.id} />
      ))}
    </>
  );
}

function Cone({ id }: { id: string }) {
  const g = useRef<THREE.Group>(null!);
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff3355', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }), []);
  const fov = agentsIn(useGame.getState().scene).find((a) => a.id === id)?.vision?.fov ?? 1.9;
  useFrame(() => {
    const agent = agentsIn(useGame.getState().scene).find((a) => a.id === id);
    if (!agent?.vision) {
      g.current.visible = false;
      return;
    }
    const chasing = agent.mode === 'chase';
    const show = runtime.reveal === agent.scene || chasing;
    g.current.visible = show;
    if (!show) return;
    const e = ent(id);
    const range = chasing ? agent.vision.range * 1.5 : agent.mode === 'distracted' ? 1.2 : agent.vision.range;
    g.current.position.set(e.x, 0.06, e.z);
    // the sector starts at +x; turn it so its middle points where the goon is looking
    g.current.rotation.set(-Math.PI / 2, 0, e.face - Math.PI / 2 - fov / 2);
    g.current.scale.set(range, range, 1);
    m.opacity = chasing ? 0.38 : 0.2;
  });
  return (
    <group ref={g}>
      <mesh material={m}>
        <circleGeometry args={[1, 24, 0, fov]} />
      </mesh>
    </group>
  );
}

