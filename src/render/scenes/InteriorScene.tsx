import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Furniture, RoomDef } from '../../game/data/scenes/interiors';
import { GEO, mat, texMat } from '../materials';
import { floorTexture, posterTexture, textTexture } from '../textures';
import { Box, Cyl } from '../props';
import { useGame } from '../../game/store';

const WALL_H = 4.2;

export function InteriorScene({ room }: { room: RoomDef }) {
  const hw = room.w / 2;
  const hd = room.d / 2;
  const floorM = useMemo(() => {
    const t = floorTexture(room.floor, room.floorA, room.floorB).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(room.w / 4, room.d / 4);
    t.needsUpdate = true;
    return texMat(t);
  }, [room]);
  return (
    <group>
      {/* outside void: dark warm floor so the room reads as a cutaway diorama */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} material={mat('#2a1238')}>
        <planeGeometry args={[120, 120]} />
      </mesh>
      {/* floor slab */}
      <mesh receiveShadow geometry={GEO.box} material={mat('#3b2a35')} position={[0, -0.16, 0]} scale={[room.w + 0.6, 0.3, room.d + 0.6]} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[room.w, room.d, 1]} geometry={GEO.plane} material={floorM} />
      {/* back walls (north + west) */}
      <mesh receiveShadow geometry={GEO.box} material={mat(room.wall)} position={[0, WALL_H / 2, -hd - 0.15]} scale={[room.w + 0.6, WALL_H, 0.3]} />
      <mesh receiveShadow geometry={GEO.box} material={mat(room.wall)} position={[-hw - 0.15, WALL_H / 2, 0]} scale={[0.3, WALL_H, room.d]} />
      {/* painted dado band at the bottom of walls, typical of old houses */}
      <mesh geometry={GEO.box} material={mat(room.wallLow)} position={[0, 0.6, -hd + 0.01]} scale={[room.w, 1.2, 0.02]} />
      <mesh geometry={GEO.box} material={mat(room.wallLow)} position={[-hw + 0.01, 0.6, 0]} scale={[0.02, 1.2, room.d]} />
      <mesh geometry={GEO.box} material={mat('#ffffff')} position={[0, 1.22, -hd + 0.02]} scale={[room.w, 0.06, 0.02]} />
      <mesh geometry={GEO.box} material={mat('#ffffff')} position={[-hw + 0.02, 1.22, 0]} scale={[0.02, 0.06, room.d]} />
      {/* low front + east walls so you can see inside */}
      <FrontWall room={room} />
      <mesh geometry={GEO.box} material={mat(room.wall)} position={[hw + 0.15, 0.3, 0]} scale={[0.3, 0.6, room.d + 0.6]} />
      {room.furniture.map((f, i) => (
        <Piece key={i} f={f} />
      ))}
      <pointLight position={[0, 3.4, 0]} intensity={18} distance={14} color={room.light} decay={1.6} />
    </group>
  );
}

function FrontWall({ room }: { room: RoomDef }) {
  const hw = room.w / 2;
  const hd = room.d / 2;
  const leftW = room.doorX - 0.8 + hw;
  const rightW = hw - room.doorX - 0.8;
  return (
    <group>
      <mesh geometry={GEO.box} material={mat(room.wall)} position={[(-hw + room.doorX - 0.8) / 2, 0.3, hd + 0.15]} scale={[leftW, 0.6, 0.3]} />
      <mesh geometry={GEO.box} material={mat(room.wall)} position={[(hw + room.doorX + 0.8) / 2, 0.3, hd + 0.15]} scale={[rightW, 0.6, 0.3]} />
      {/* door frame */}
      <Box p={[room.doorX - 0.85, 1.25, hd + 0.15]} s={[0.15, 2.5, 0.3]} c="#7f4f24" />
      <Box p={[room.doorX + 0.85, 1.25, hd + 0.15]} s={[0.15, 2.5, 0.3]} c="#7f4f24" />
      <Box p={[room.doorX, 2.55, hd + 0.15]} s={[1.85, 0.15, 0.3]} c="#7f4f24" />
      {/* doormat with a glowing threshold so the exit is easy to read */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.doorX, 0.02, hd - 0.4]} scale={[1.4, 0.8, 1]} geometry={GEO.plane} material={mat('#c1121f')} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.doorX, 0.03, hd + 0.15]} scale={[1.5, 0.3, 1]} geometry={GEO.plane} material={mat('#ffe8a3', { emissive: '#ffb400' })} />
    </group>
  );
}

function Piece({ f }: { f: Furniture }) {
  const rot: [number, number, number] = [0, f.rot ?? 0, 0];
  const w = f.w ?? 1;
  const d = f.d ?? 1;
  const y = f.y ?? 0;
  switch (f.type) {
    case 'charpai':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          {[
            [-w / 2 + 0.08, -d / 2 + 0.08],
            [w / 2 - 0.08, -d / 2 + 0.08],
            [-w / 2 + 0.08, d / 2 - 0.08],
            [w / 2 - 0.08, d / 2 - 0.08],
          ].map(([a, b], i) => (
            <Cyl key={i} p={[a, 0.25, b]} s={[0.14, 0.5, 0.14]} c="#6b4226" lo />
          ))}
          <Box p={[0, 0.5, 0]} s={[w, 0.1, d]} c={f.color ?? '#8c5e3c'} />
          <Box p={[0, 0.56, 0]} s={[w * 0.9, 0.04, d * 0.92]} c="#e9d8a6" />
          {/* woven rope lines */}
          {[...Array(6)].map((_, i) => (
            <Box key={i} p={[0, 0.585, -d * 0.4 + (i * d * 0.8) / 5]} s={[w * 0.88, 0.01, 0.04]} c="#c9a227" shadow={false} />
          ))}
          <Box p={[0, 0.65, -d / 2 + 0.35]} s={[w * 0.6, 0.15, 0.4]} c="#f1faee" />
        </group>
      );
    case 'mattress':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 0.12, 0]} s={[w, 0.24, d]} c={f.color ?? '#e76f51'} />
          <Box p={[0, 0.3, -d / 2 + 0.3]} s={[w * 0.7, 0.14, 0.35]} c="#ffffff" />
          <Box p={[0.1, 0.27, 0.3]} s={[w * 0.9, 0.06, d * 0.5]} c="#ffd166" r={[0, 0.2, 0]} />
        </group>
      );
    case 'fridge':
      return (
        <group position={[f.x, 0, f.z]}>
          <Box p={[0, 0.9, 0]} s={[w, 1.8, d]} c="#e8eff1" />
          <Box p={[w * 0.4, 1.1, d / 2 + 0.03]} s={[0.06, 0.4, 0.06]} c="#999" />
          <Box p={[0, 1.4, d / 2 + 0.01]} s={[w, 0.02, 0.02]} c="#bbb" />
          {/* fridge magnets */}
          <Box p={[-0.2, 1.6, d / 2 + 0.02]} s={[0.12, 0.12, 0.02]} c="#e63946" shadow={false} />
          <Box p={[0.1, 0.9, d / 2 + 0.02]} s={[0.14, 0.1, 0.02]} c="#ffb703" shadow={false} />
        </group>
      );
    case 'whiteboard':
    case 'planboard':
      return <PlanBoard f={f} />;
    case 'calendar':
      return (
        <group position={[f.x, 2.4, f.z + 0.02]}>
          <Box p={[0, 0, 0]} s={[0.6, 0.8, 0.02]} c="#ffffff" />
          <Box p={[0, 0.32, 0.01]} s={[0.6, 0.16, 0.02]} c="#d62828" shadow={false} />
          <mesh geometry={GEO.torus} material={mat('#d62828')} position={[-0.18, 0.1, 0.02]} scale={0.22} />
        </group>
      );
    case 'mirror':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 2.0, 0.02]} s={[0.9, 1.2, 0.05]} c="#8c5e3c" />
          <Box p={[0, 2.0, 0.05]} s={[0.75, 1.05, 0.02]} c="#cfe8ef" />
          <Box p={[0.2, 2.3, 0.07]} s={[0.3, 0.02, 0.01]} r={[0, 0, 0.7]} c="#555" shadow={false} />
        </group>
      );
    case 'tv':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 0.35, 0]} s={[w, 0.7, d]} c="#6b4226" />
          <Box p={[0, 1.05, 0]} s={[w * 0.85, 0.7, d * 0.7]} c="#2b2d42" />
          <TvScreen w={w * 0.7} y={1.07} z={d * 0.36} />
          <Box p={[0.15, 1.6, 0]} s={[0.02, 0.5, 0.02]} r={[0, 0, 0.4]} c="#999" shadow={false} />
          <Box p={[-0.15, 1.6, 0]} s={[0.02, 0.5, 0.02]} r={[0, 0, -0.4]} c="#999" shadow={false} />
        </group>
      );
    case 'stove':
      return (
        <group position={[f.x, 0, f.z]}>
          <Box p={[0, 0.45, 0]} s={[w, 0.9, d]} c="#ced4da" />
          <Box p={[0, 0.95, 0]} s={[w * 0.8, 0.1, d * 0.6]} c="#343a40" />
          <Cyl p={[-0.3, 1.1, 0]} s={[0.45, 0.25, 0.45]} c="#adb5bd" />
          <Cyl p={[0.3, 1.05, 0]} s={[0.5, 0.15, 0.5]} c="#495057" lo />
        </group>
      );
    case 'cylinder':
      return <Cyl p={[f.x, 0.5, f.z]} s={[0.5, 1.0, 0.5]} c="#d62828" />;
    case 'bucket':
      return (
        <group position={[f.x, 0, f.z]}>
          <Cyl p={[0, 0.3, 0]} s={[0.55, 0.6, 0.55]} c="#3a86ff" />
          <Cyl p={[0.6, 0.15, 0.1]} s={[0.35, 0.3, 0.35]} c="#ffbe0b" lo />
        </group>
      );
    case 'fan':
      return <Fan x={f.x} y={f.y ?? 3.4} z={f.z} />;
    case 'poster': {
      const idx = f.text === 'HERO' ? 3 : f.text === 'GYM' ? 4 : f.text === 'COLA' ? 6 : 0;
      return <PosterOnWall f={f} idx={idx} />;
    }
    case 'clothesline':
      return (
        <group position={[f.x, f.y ?? 2.9, f.z]}>
          <Box p={[0, 0, 0]} s={[8, 0.02, 0.02]} c="#ddd" shadow={false} />
          {[
            [-2.6, '#e63946', 0.8],
            [-1.6, '#ffffff', 0.6],
            [-0.4, '#2a9d8f', 0.9],
            [1.2, '#ffb703', 0.7],
            [2.4, '#8338ec', 0.6],
          ].map(([x, c, h], i) => (
            <Box key={i} p={[x as number, -(h as number) / 2, 0]} s={[0.6, h as number, 0.03]} c={c as string} />
          ))}
        </group>
      );
    case 'window':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 2.4, 0.01]} s={[1.6, 1.3, 0.04]} c="#7f4f24" />
          <mesh geometry={GEO.plane} material={mat('#ffe8a8', { emissive: '#ffb347' })} position={[0, 2.4, 0.04]} scale={[1.4, 1.1, 1]} />
          {[-0.35, 0, 0.35].map((x) => (
            <Box key={x} p={[x, 2.4, 0.06]} s={[0.04, 1.1, 0.04]} c="#2b2d42" shadow={false} />
          ))}
        </group>
      );
    case 'crate':
      return <Box p={[f.x, 0.42, f.z]} s={[w, 0.84, d]} c={f.color ?? '#b08968'} />;
    case 'tubelight':
      return (
        <group position={[f.x, 3.4, f.z + 0.04]} rotation={rot}>
          <Box p={[0, 0, 0]} s={[1.4, 0.1, 0.08]} c="#ffffff" shadow={false} />
          <mesh geometry={GEO.box} material={mat('#f7fff7', { emissive: '#e0ffe8' })} position={[0, -0.05, 0.03]} scale={[1.3, 0.07, 0.07]} />
        </group>
      );
    case 'shelf':
      return <Shelf f={f} />;
    case 'counter':
      return (
        <group position={[f.x, 0, f.z]}>
          <Box p={[0, 0.5, 0]} s={[w, 1.0, d]} c="#8c5e3c" />
          <Box p={[0, 1.02, 0]} s={[w + 0.1, 0.06, d + 0.1]} c="#5a3d28" />
          <Box p={[0, 0.5, d / 2 + 0.01]} s={[w * 0.9, 0.6, 0.02]} c="#e9c46a" shadow={false} />
        </group>
      );
    case 'jars':
      return (
        <group position={[f.x, y, f.z]}>
          {[...Array(6)].map((_, i) => (
            <group key={i} position={[-1.6 + i * 0.6, 0, 0.1]}>
              <Cyl p={[0, 0.22, 0]} s={[0.36, 0.44, 0.36]} c="#d7f0f5" />
              <Cyl p={[0, 0.12, 0]} s={[0.3, 0.2, 0.3]} c={['#f77f00', '#d62828', '#ffd166', '#6a994e', '#9d4edd', '#ef476f'][i]} lo />
              <Cyl p={[0, 0.47, 0]} s={[0.38, 0.06, 0.38]} c="#e63946" lo />
            </group>
          ))}
        </group>
      );
    case 'sodafridge':
      return <SodaFridge f={f} />;
    case 'phone':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 1.0, 0]} s={[0.7, 0.15, 0.5]} c="#8c5e3c" />
          <Box p={[0, 0.5, 0]} s={[0.1, 1.0, 0.1]} c="#5a3d28" />
          <Box p={[0, 1.25, 0]} s={[0.4, 0.35, 0.35]} c="#d62828" />
          <Box p={[0, 1.48, 0.05]} s={[0.45, 0.08, 0.12]} c="#1d1d1d" />
        </group>
      );
    case 'sacks':
      return (
        <group position={[f.x, 0, f.z]}>
          {[
            [-0.4, 0.35, 0],
            [0.4, 0.35, 0],
            [0, 0.95, 0],
          ].map(([a, b, c], i) => (
            <mesh key={i} castShadow geometry={GEO.sphere} material={mat('#e9dcc0')} position={[a, b, c]} scale={[0.9, 0.7, 1.1]} />
          ))}
        </group>
      );
    case 'sofa':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 0.3, 0]} s={[w, 0.6, d]} c={f.color ?? '#6a4c93'} />
          <Box p={[0, 0.85, -d / 2 + 0.15]} s={[w, 0.9, 0.3]} c={f.color ?? '#6a4c93'} />
          <Box p={[w / 2 - 0.15, 0.65, 0]} s={[0.3, 0.5, d]} c={f.color ?? '#6a4c93'} />
          <Box p={[-w / 2 + 0.15, 0.65, 0]} s={[0.3, 0.5, d]} c={f.color ?? '#6a4c93'} />
          {[-0.8, 0, 0.8].map((x, i) => (
            <Box key={x} p={[x, 0.85, -d / 2 + 0.4]} s={[0.6, 0.5, 0.2]} c={['#ffb703', '#e63946', '#2a9d8f'][i]} r={[-0.2, 0, 0]} />
          ))}
          {/* lace covers on the back, classic */}
          <Box p={[0, 1.32, -d / 2 + 0.15]} s={[w * 0.9, 0.05, 0.32]} c="#ffffff" shadow={false} />
        </group>
      );
    case 'armchair':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          <Box p={[0, 0.3, 0]} s={[w, 0.6, d]} c={f.color ?? '#6a4c93'} />
          <Box p={[0, 0.9, -d / 2 + 0.12]} s={[w, 1.0, 0.25]} c={f.color ?? '#6a4c93'} />
          <Box p={[w / 2 - 0.1, 0.7, 0]} s={[0.2, 0.4, d]} c={f.color ?? '#6a4c93'} />
          <Box p={[-w / 2 + 0.1, 0.7, 0]} s={[0.2, 0.4, d]} c={f.color ?? '#6a4c93'} />
        </group>
      );
    case 'table':
      return (
        <group position={[f.x, 0, f.z]}>
          <Box p={[0, 0.5, 0]} s={[w, 0.08, d]} c="#7f5539" />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([a, b], i) => (
            <Box key={i} p={[(a * w) / 2.3, 0.25, (b * d) / 2.4]} s={[0.08, 0.5, 0.08]} c="#5a3d28" />
          ))}
          <Cyl p={[-0.3, 0.6, 0]} s={[0.25, 0.12, 0.25]} c="#ffffff" lo />
          <Cyl p={[0.3, 0.62, 0.1]} s={[0.4, 0.06, 0.4]} c="#c0c0c0" lo />
        </group>
      );
    case 'vase':
      return <Vase f={f} />;
    case 'frames':
      return (
        <group position={[f.x, 2.5, f.z + 0.02]}>
          {[
            [-0.6, 0.1, 0.6, 0.8],
            [0.3, 0.2, 0.7, 0.5],
            [0.25, -0.35, 0.5, 0.4],
            [1.0, -0.1, 0.4, 0.6],
          ].map(([x, yy, ww, hh], i) => (
            <group key={i} position={[x, yy, 0]}>
              <Box p={[0, 0, 0]} s={[ww, hh, 0.04]} c="#b08968" />
              <Box p={[0, 0, 0.02]} s={[ww * 0.8, hh * 0.8, 0.02]} c={['#8d99ae', '#adb5bd', '#ced4da', '#6c757d'][i]} shadow={false} />
            </group>
          ))}
          {/* a marigold garland over grandfather's photo */}
          <mesh geometry={GEO.torus} material={mat('#ff9f1c')} position={[-0.6, 0.15, 0.05]} scale={[0.7, 0.85, 1]} />
        </group>
      );
    case 'jhula':
      return <Jhula f={f} />;
    case 'rug':
      return (
        <group position={[f.x, 0.012, f.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[w, d, 1]} geometry={GEO.plane} material={mat(f.color ?? '#9d0208')} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={[w * 0.8, d * 0.75, 1]} geometry={GEO.plane} material={mat('#e9c46a')} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} scale={[w * 0.7, d * 0.62, 1]} geometry={GEO.plane} material={mat(f.color ?? '#9d0208')} />
          <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.006, 0]} scale={[d * 0.4, d * 0.4, 1]} geometry={GEO.plane} material={mat('#e9c46a')} />
        </group>
      );
    case 'plant':
      return (
        <group position={[f.x, 0, f.z]}>
          <Cyl p={[0, 0.35, 0]} s={[0.6, 0.7, 0.6]} c="#c1440e" lo />
          <mesh castShadow geometry={GEO.ico} material={mat('#386641')} position={[0, 1.1, 0]} scale={0.9} />
          <mesh castShadow geometry={GEO.ico} material={mat('#6a994e')} position={[0.15, 1.5, 0.1]} scale={0.55} />
        </group>
      );
    case 'car':
      return (
        <group position={[f.x, 0, f.z]} rotation={rot}>
          {/* old car on bricks */}
          {[
            [-1.4, -0.75],
            [1.4, -0.75],
            [-1.4, 0.75],
            [1.4, 0.75],
          ].map(([a, b], i) => (
            <Box key={i} p={[a, 0.2, b]} s={[0.5, 0.4, 0.3]} c="#b5523b" />
          ))}
          <Box p={[0, 0.85, 0]} s={[w, 0.75, d]} c={f.color ?? '#e9c46a'} />
          <Box p={[-0.3, 1.5, 0]} s={[w * 0.55, 0.6, d * 0.92]} c={f.color ?? '#e9c46a'} />
          <Box p={[-0.3, 1.5, d * 0.47]} s={[w * 0.5, 0.45, 0.02]} c="#a8dadc" />
          <Box p={[0.62, 1.5, 0]} s={[0.04, 0.45, d * 0.85]} c="#a8dadc" r={[0, 0, -0.3]} />
          <Box p={[1.0, 0.9, d * 0.3]} s={[0.6, 0.3, 0.02]} c="#c1121f" />
          {/* rust patches */}
          <Box p={[1.2, 0.8, d / 2 + 0.01]} s={[0.6, 0.4, 0.01]} c="#9c6644" shadow={false} />
          <Box p={[-1.5, 0.7, d / 2 + 0.01]} s={[0.4, 0.3, 0.01]} c="#9c6644" shadow={false} />
        </group>
      );
    case 'tyres':
      return (
        <group position={[f.x, 0, f.z]}>
          {[0.18, 0.5, 0.82].map((yy, i) => (
            <mesh key={i} castShadow geometry={GEO.torus} material={mat('#1f1f1f')} position={[i === 2 ? 0.1 : 0, yy, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1.1, 3.6]} />
          ))}
        </group>
      );
    case 'dartboard':
      return (
        <group position={[f.x, 2.3, f.z]} rotation={rot}>
          <Cyl p={[0, 0, 0.03]} s={[0.8, 0.06, 0.8]} r={[Math.PI / 2, 0, 0]} c="#1d1d1d" />
          <Cyl p={[0, 0, 0.06]} s={[0.6, 0.03, 0.6]} r={[Math.PI / 2, 0, 0]} c="#d62828" />
          <Cyl p={[0, 0, 0.08]} s={[0.36, 0.03, 0.36]} r={[Math.PI / 2, 0, 0]} c="#f1faee" />
          {/* Tiwari-ji's photo pinned in the middle */}
          <Box p={[0, 0, 0.11]} s={[0.22, 0.28, 0.01]} c="#e9d8a6" shadow={false} />
          <mesh geometry={GEO.sphereLo} material={mat('#b07650')} position={[0, 0.03, 0.12]} scale={[0.12, 0.13, 0.02]} />
          {/* darts that all missed */}
          {[
            [0.55, 0.4],
            [-0.6, -0.3],
            [0.7, -0.5],
          ].map(([a, b], i) => (
            <Box key={i} p={[a, b, 0.15]} s={[0.03, 0.03, 0.25]} c="#ffb703" shadow={false} />
          ))}
        </group>
      );
    case 'trunk':
      return (
        <group position={[f.x, 0, f.z]}>
          <Box p={[0, 0.4, 0]} s={[w, 0.8, d]} c="#2a6f97" />
          <Box p={[0, 0.82, 0]} s={[w + 0.05, 0.08, d + 0.05]} c="#ffb703" />
          <Box p={[0, 0.55, d / 2 + 0.02]} s={[0.2, 0.2, 0.03]} c="#ffb703" />
        </group>
      );
    case 'radio':
      return (
        <group position={[f.x - 0.3, y, f.z]}>
          <Box p={[0, 0.2, 0]} s={[0.6, 0.38, 0.25]} c="#6d4c41" />
          <Cyl p={[-0.12, 0.2, 0.13]} s={[0.22, 0.02, 0.22]} r={[Math.PI / 2, 0, 0]} c="#cfcfcf" lo />
          <Box p={[0.22, 0.5, 0]} s={[0.02, 0.5, 0.02]} r={[0, 0, -0.4]} c="#999" shadow={false} />
        </group>
      );
    case 'lockers':
      return <Lockers f={f} />;
    case 'seats':
      return (
        <group position={[f.x, 0, f.z]}>
          {[0, 1].map((row) => (
            <group key={row} position={[0, row * 0.25, (row - 0.5) * 1.4]}>
              {[...Array(Math.floor(w / 0.75))].map((_, i) => (
                <group key={i} position={[-w / 2 + 0.4 + i * 0.75, 0, 0]} rotation={[0, 0, 0]}>
                  <Box p={[0, 0.35, 0]} s={[0.62, 0.18, 0.6]} c={(i + row) % 5 === 2 ? '#5a1a26' : '#9d0208'} />
                  <Box p={[0, 0.8, -0.28]} s={[0.62, 0.8, 0.12]} c="#9d0208" />
                  <Box p={[0.34, 0.5, 0]} s={[0.06, 0.4, 0.6]} c="#3d1f1f" />
                </group>
              ))}
            </group>
          ))}
        </group>
      );
    case 'booth':
      return <Booth f={f} />;
    case 'cobweb':
      return (
        <group position={[f.x, 3.6, f.z]} rotation={[0, (f.rot ?? 0) + Math.PI / 4, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} geometry={GEO.box} material={mat('#e8e2d6', { opacity: 0.55 })} rotation={[0, 0, (i - 1.5) * 0.4]} scale={[1.4, 0.015, 0.015]} />
          ))}
          <mesh geometry={GEO.torus} material={mat('#e8e2d6', { opacity: 0.45 })} rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 0.5, 0.2]} />
        </group>
      );
    case 'reels':
      return (
        <group position={[f.x, 0, f.z]}>
          {[0, 1, 2].map((i) => (
            <Cyl key={i} p={[0, 0.08 + i * 0.16, 0]} s={[0.8 - i * 0.1, 0.12, 0.8 - i * 0.1]} c={i % 2 ? '#6c757d' : '#adb5bd'} />
          ))}
          <mesh geometry={GEO.box} material={mat('#3a2a1c')} position={[0, 0.5, 0.42]} scale={[0.4, 0.02, 0.3]} rotation={[0.4, 0, 0]} />
        </group>
      );
    default:
      return null;
  }
}

function Lockers({ f }: { f: Furniture }) {
  const open = useGame((s) => !!s.flags['locker.open']);
  const w = f.w ?? 6;
  const n = Math.floor(w / 0.8);
  return (
    <group position={[f.x, 0, f.z]}>
      {[...Array(n)].map((_, i) => {
        const x = -w / 2 + 0.4 + i * 0.8;
        const is47 = i === n - 3;
        return (
          <group key={i} position={[x, 0, 0]}>
            <Box p={[0, 1.25, 0]} s={[0.76, 2.5, 0.7]} c={i % 2 ? '#5c677d' : '#4f5d75'} />
            <Box p={[0, 2.2, 0.36]} s={[0.4, 0.05, 0.02]} c="#2b2d42" shadow={false} />
            <Box p={[0, 2.05, 0.36]} s={[0.4, 0.05, 0.02]} c="#2b2d42" shadow={false} />
            {is47 && (
              <>
                <mesh geometry={GEO.plane} material={mat('#ffd166')} position={[0, 1.65, 0.37]} scale={[0.3, 0.16, 1]} />
                <group position={[0.36, 0, 0.36]} rotation={[0, open ? -1.9 : 0, 0]}>
                  <Box p={[-0.36, 1.25, 0.02]} s={[0.72, 2.4, 0.04]} c="#8d99ae" />
                </group>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** The projection booth: a few steps up to a door with light leaking from under it. */
function Booth({ f }: { f: Furniture }) {
  const out = useGame((s) => !!s.flags['rahul.out']);
  const glow = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const k = 0.55 + Math.sin(t * 9) * 0.15 + (Math.sin(t * 2.7) > 0.85 ? 0.3 : 0);
    glow.current.color.setRGB(1 * k, 0.8 * k, 0.45 * k);
  });
  return (
    <group position={[f.x, 0, f.z]} rotation={[0, f.rot ?? 0, 0]}>
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[0, 0.12 + i * 0.24, 0.9 - i * 0.35]} s={[1.6, 0.24 + i * 0.48, 0.35]} c="#3d2b1f" />
      ))}
      <Box p={[0, 2.0, -0.1]} s={[1.4, 2.6, 0.12]} c={out ? '#1b1b1b' : '#6b4226'} />
      <mesh position={[0, 0.78, 0.0]} scale={[1.2, 0.06, 1]} geometry={GEO.plane}>
        <meshBasicMaterial ref={glow} color="#ffcc77" />
      </mesh>
      <mesh geometry={GEO.plane} material={mat('#f1e3c8')} position={[0, 3.1, -0.03]} scale={[1.1, 0.3, 1]} />
      <pointLight position={[0, 1.6, 0.8]} intensity={out ? 6 : 3} distance={5} color="#ffb347" />
    </group>
  );
}

function PlanBoard({ f }: { f: Furniture }) {
  const board = f.type === 'planboard';
  const m = useMemo(() => texMat(planTexture(board)), [board]);
  return (
    <group position={[f.x, 0, f.z]}>
      <Box p={[0, 2.2, 0]} s={[board ? 2.6 : 1.8, board ? 1.6 : 1.2, 0.08]} c={board ? '#5a3d28' : '#aaaaaa'} />
      <mesh geometry={GEO.plane} material={m} position={[0, 2.2, 0.05]} scale={[board ? 2.4 : 1.65, board ? 1.42 : 1.05, 1]} />
      {board && (
        <>
          <Box p={[-1.1, 0.7, 0.2]} s={[0.08, 1.4, 0.08]} c="#5a3d28" />
          <Box p={[1.1, 0.7, 0.2]} s={[0.08, 1.4, 0.08]} c="#5a3d28" />
        </>
      )}
    </group>
  );
}

let planCanvasKey = 0;
function planTexture(board: boolean) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 300;
  const g = c.getContext('2d')!;
  g.fillStyle = board ? '#1f3d2b' : '#f7f7f2';
  g.fillRect(0, 0, 512, 300);
  g.fillStyle = board ? '#f1faee' : '#1d3557';
  g.font = 'bold 44px "Yatra One", serif';
  g.fillText(board ? 'MASTER PLAN' : 'GET RICH', 24, 58);
  g.font = '600 30px "Baloo 2", sans-serif';
  const lines = board ? ['1. Money?', '2. ??????', '3. Rent paid', '4. Respect'] : ['Step 1: Become rich', 'Step 2: Stay rich', '(step 1 how??)'];
  lines.forEach((l, i) => g.fillText(l, 30, 110 + i * 46));
  g.strokeStyle = '#e63946';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(board ? 120 : 190, board ? 150 : 98, board ? 110 : 170, 28, 0, 0, Math.PI * 2);
  g.stroke();
  // arrows and doodles
  g.strokeStyle = board ? '#ffb703' : '#2a9d8f';
  g.beginPath();
  g.moveTo(330, 120);
  g.lineTo(450, 200);
  g.lineTo(430, 170);
  g.moveTo(450, 200);
  g.lineTo(415, 205);
  g.stroke();
  g.font = 'bold 60px serif';
  g.fillStyle = '#ffb703';
  g.fillText('₹₹₹', 330, 270);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.name = `plan${planCanvasKey++}`;
  return t;
}

function PosterOnWall({ f, idx }: { f: Furniture; idx: number }) {
  const m = useMemo(() => texMat(posterTexture(idx)), [idx]);
  return <mesh geometry={GEO.plane} material={m} position={[f.x, f.y ?? 2.6, f.z + 0.02]} rotation={[0, f.rot ?? 0, 0]} scale={[0.8, 1.12, 1]} />;
}

function Fan({ x, y, z }: { x: number; y: number; z: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    g.current.rotation.y += dt * 7;
  });
  return (
    <group position={[x, y, z]}>
      <Box p={[0, 0.5, 0]} s={[0.05, 0.9, 0.05]} c="#777" shadow={false} />
      <group ref={g}>
        <Cyl p={[0, 0, 0]} s={[0.35, 0.15, 0.35]} c="#a8a8a8" lo />
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow geometry={GEO.box} material={mat('#8d6e63')} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[Math.cos((i * Math.PI * 2) / 3) * 0.65, 0, -Math.sin((i * Math.PI * 2) / 3) * 0.65]} scale={[1.2, 0.03, 0.22]} />
        ))}
      </group>
    </group>
  );
}

function TvScreen({ w, y, z }: { w: number; y: number; z: number }) {
  const ref = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const k = 0.6 + Math.sin(t * 7) * 0.1 + (Math.sin(t * 2.3) > 0.9 ? 0.25 : 0);
    ref.current.color.setRGB(0.5 * k, 0.8 * k, 1.0 * k);
  });
  return (
    <mesh position={[0, y, z]} scale={[w, w * 0.7, 1]} geometry={GEO.plane}>
      <meshBasicMaterial ref={ref} color="#9be" />
    </mesh>
  );
}

function Shelf({ f }: { f: Furniture }) {
  const w = f.w ?? 3;
  const d = f.d ?? 0.6;
  const items = useMemo(() => {
    const cols = ['#e63946', '#ffb703', '#2a9d8f', '#3a86ff', '#8338ec', '#fb5607', '#ffffff', '#06d6a0'];
    const out: Array<{ x: number; y: number; h: number; c: string; jar: boolean }> = [];
    for (let row = 0; row < 4; row++)
      for (let i = 0; i < Math.floor(w / 0.35); i++) {
        const k = row * 13 + i * 7;
        out.push({ x: -w / 2 + 0.2 + i * 0.35, y: 0.5 + row * 0.7, h: 0.25 + (k % 3) * 0.1, c: cols[k % cols.length], jar: k % 4 === 0 });
      }
    return out;
  }, [w]);
  return (
    <group position={[f.x, 0, f.z]} rotation={[0, f.rot ?? 0, 0]}>
      <Box p={[0, 1.5, -d / 2 + 0.03]} s={[w, 3.0, 0.06]} c="#7f5539" />
      {[0, 1, 2, 3].map((r) => (
        <Box key={r} p={[0, 0.45 + r * 0.7, 0]} s={[w, 0.06, d]} c="#9c6644" />
      ))}
      {items.map((it, i) =>
        it.jar ? (
          <Cyl key={i} p={[it.x, it.y + it.h / 2, 0]} s={[0.22, it.h, 0.22]} c={it.c} lo />
        ) : (
          <Box key={i} p={[it.x, it.y + it.h / 2, 0]} s={[0.24, it.h, 0.22]} c={it.c} shadow={false} />
        ),
      )}
    </group>
  );
}

function SodaFridge({ f }: { f: Furniture }) {
  const fixed = useGame((s) => !!s.flags['fridge.fixed']);
  const glow = useRef<THREE.MeshBasicMaterial>(null!);
  const body = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (fixed) {
      glow.current.color.set('#bdefff');
      body.current.position.x = 0;
    } else {
      // cursed: flickers and sulks
      const on = Math.sin(t * 13) > 0.6 || Math.sin(t * 2.1) > 0.95;
      glow.current.color.set(on ? '#7a8ea0' : '#2b3440');
      body.current.position.x = Math.sin(t * 40) * 0.006;
    }
  });
  const w = f.w ?? 1;
  const d = f.d ?? 1;
  const label = useMemo(() => texMat(textTexture('COLA', '#d62828', '#ffffff', 256, 96)), []);
  return (
    <group position={[f.x, 0, f.z]}>
      <group ref={body}>
        <Box p={[0, 1.0, 0]} s={[w, 2.0, d]} c="#d62828" />
        <mesh position={[0, 1.05, d / 2 + 0.01]} scale={[w * 0.75, 1.3, 1]} geometry={GEO.plane}>
          <meshBasicMaterial ref={glow} color="#7a8ea0" />
        </mesh>
        <mesh geometry={GEO.plane} material={label} position={[0, 1.85, d / 2 + 0.01]} scale={[w * 0.8, 0.28, 1]} />
        {[0.55, 0.95, 1.35].map((yy) => (
          <group key={yy}>
            {[-0.25, 0, 0.25].map((x) => (
              <Cyl key={x} p={[x, yy, d / 2 - 0.05]} s={[0.12, 0.3, 0.12]} c={fixed ? '#5b2a1a' : '#3a2018'} lo />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function Vase({ f }: { f: Furniture }) {
  const broken = useGame((s) => !!s.flags['vase.broken']);
  return (
    <group position={[f.x, 0, f.z]} rotation={[broken ? Math.PI / 2 : 0, 0, broken ? 0.3 : 0]}>
      <group position={[0, broken ? 0.3 : 0, broken ? -0.3 : 0]}>
        <mesh castShadow geometry={GEO.sphere} material={mat('#d4a017')} position={[0, 0.5, 0]} scale={[0.6, 0.8, 0.6]} />
        <Cyl p={[0, 1.05, 0]} s={[0.25, 0.4, 0.25]} c="#d4a017" />
        <Cyl p={[0, 1.27, 0]} s={[0.38, 0.06, 0.38]} c="#d4a017" />
      </group>
    </group>
  );
}

function Jhula({ f }: { f: Furniture }) {
  const seat = useRef<THREE.Group>(null!);
  useFrame((s) => {
    seat.current.rotation.x = Math.sin(s.clock.elapsedTime * 1.2) * 0.1;
  });
  const w = f.w ?? 2.4;
  return (
    <group position={[f.x, 0, f.z]}>
      <Box p={[-w / 2, 1.6, 0]} s={[0.15, 3.2, 0.15]} c="#7f4f24" />
      <Box p={[w / 2, 1.6, 0]} s={[0.15, 3.2, 0.15]} c="#7f4f24" />
      <Box p={[0, 3.2, 0]} s={[w + 0.3, 0.18, 0.18]} c="#7f4f24" />
      <group ref={seat} position={[0, 3.1, 0]}>
        <Box p={[0, -2.5, 0]} s={[w * 0.8, 0.12, 0.8]} c="#9c2c2c" />
        <Box p={[0, -2.2, -0.35]} s={[w * 0.8, 0.5, 0.08]} c="#9c2c2c" />
        <Box p={[-w * 0.38, -1.25, 0]} s={[0.04, 2.5, 0.04]} c="#d4a017" shadow={false} />
        <Box p={[w * 0.38, -1.25, 0]} s={[0.04, 2.5, 0.04]} c="#d4a017" shadow={false} />
      </group>
    </group>
  );
}
