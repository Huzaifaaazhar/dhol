import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS, POLES, TREES } from '../../game/data/scenes/street';
import { Building } from '../Building';
import { GEO, mat, texMat } from '../materials';
import { posterTexture, posterWallTexture, roadTexture, sidewalkTexture, signTexture, textTexture } from '../textures';
import {
  Auto,
  BarberChair,
  Bench,
  Box,
  CarromBoard,
  Drum,
  Laundry,
  Pigeons,
  Pole,
  PosterBoard,
  SabziCart,
  Scooter,
  Stumps,
  Swing,
  TeaStall,
  Tree,
  Wires,
  Car,
  Cyl,
} from '../props';
import { Ambient } from '../Ambient';

type V3 = [number, number, number];

function Ground() {
  const road = useMemo(() => {
    const t = roadTexture().clone();
    t.repeat.set(20, 2);
    t.needsUpdate = true;
    return texMat(t);
  }, []);
  const roadV = useMemo(() => {
    const t = roadTexture().clone();
    t.repeat.set(2, 14);
    t.needsUpdate = true;
    return texMat(t);
  }, []);
  const walk = useMemo(() => {
    const t = sidewalkTexture().clone();
    t.repeat.set(60, 2);
    t.needsUpdate = true;
    return texMat(t);
  }, []);
  const walkV = useMemo(() => {
    const t = sidewalkTexture().clone();
    t.repeat.set(2, 10);
    t.needsUpdate = true;
    return texMat(t);
  }, []);

  const strips: Array<{ p: V3; s: V3; m: THREE.Material }> = [
    // main road and cross road
    { p: [0, 0.01, 0], s: [140, 8, 1], m: road },
    { p: [0, 0.011, -16], s: [8, 24, 1], m: roadV },
    { p: [0, 0.011, 22], s: [8, 36, 1], m: roadV },
    // sidewalks
    { p: [0, 0.12, -6], s: [140, 4, 1], m: walk },
    { p: [0, 0.12, 6], s: [140, 4, 1], m: walk },
    { p: [-6, 0.12, -16], s: [4, 20, 1], m: walkV },
    { p: [6, 0.12, -16], s: [4, 20, 1], m: walkV },
    { p: [-6, 0.12, 22], s: [4, 28, 1], m: walkV },
  ];

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={mat('#c8a57a')}>
        <planeGeometry args={[220, 220]} />
      </mesh>
      {strips.map((s, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={s.p} scale={s.s} geometry={GEO.plane} material={s.m} />
      ))}
      {/* curbs */}
      {[-4, 4].map((z) => (
        <mesh key={z} receiveShadow geometry={GEO.box} material={mat('#8f877c')} position={[0, 0.07, z]} scale={[140, 0.14, 0.18]} />
      ))}
      {/* centre line dashes */}
      {[...Array(30)].map((_, i) => {
        const x = -58 + i * 4;
        if (Math.abs(x) < 6) return null;
        return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]} scale={[1.8, 0.16, 1]} geometry={GEO.plane} material={mat('#f1e9d2')} />;
      })}
      {/* zebra crossings either side of the junction */}
      {[-6.2, 6.2].map((x) =>
        [...Array(6)].map((_, i) => (
          <mesh key={`${x}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -3.3 + i * 1.3]} scale={[1.6, 0.6, 1]} geometry={GEO.plane} material={mat('#efe6cf')} />
        )),
      )}
      {/* speed breaker, painted */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[-24, 0.05, -3.5 + i + 0.5]} scale={[0.6, 0.1, 1]} geometry={GEO.box} material={mat(i % 2 ? '#1d1d1d' : '#ffd60a')} />
      ))}
      {/* tea plaza packed earth with a tiled patch */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[14.5, 0.02, 15]} scale={[13, 14, 1]} geometry={GEO.plane} material={mat('#d9b98c')} />
      {/* bungalow lawn */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-28, 0.03, -10.4]} scale={[11.6, 4.2, 1]} geometry={GEO.plane} material={mat('#7cb518')} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-28, 0.04, -10.3]} scale={[2.4, 4.2, 1]} geometry={GEO.plane} material={mat('#d6ccc2')} />
      {/* hideout lane: uneven paving */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.03, 15.5]} scale={[2, 15, 1]} geometry={GEO.plane} material={mat('#a39171')} />
      {/* drain along the north sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, -7.75]} scale={[140, 0.35, 1]} geometry={GEO.plane} material={mat('#5c534a')} />
    </group>
  );
}

function GardenWall() {
  const wall = '#fff3d6';
  const cap = '#d1495b';
  const seg: Array<[number, number, number, number]> = [
    [-33, -8.2, 6, 0.4],
    [-23.5, -8.2, 5, 0.4],
    [-34.1, -10.3, 0.4, 4.4],
    [-21.9, -10.3, 0.4, 4.4],
  ];
  return (
    <group>
      {seg.map(([x, z, w, d], i) => (
        <group key={i}>
          <Box p={[x, 0.55, z]} s={[w, 1.1, d]} c={wall} />
          <Box p={[x, 1.14, z]} s={[w + 0.1, 0.1, d + 0.1]} c={cap} />
        </group>
      ))}
      {/* gate pillars and an open iron gate */}
      <Box p={[-30.1, 0.8, -8.2]} s={[0.5, 1.6, 0.5]} c={wall} />
      <Box p={[-25.9, 0.8, -8.2]} s={[0.5, 1.6, 0.5]} c={wall} />
      <mesh geometry={GEO.sphereLo} material={mat('#ffb400')} position={[-30.1, 1.75, -8.2]} scale={0.35} />
      <mesh geometry={GEO.sphereLo} material={mat('#ffb400')} position={[-25.9, 1.75, -8.2]} scale={0.35} />
      <group position={[-29.8, 0, -8.2]} rotation={[0, -1.2, 0]}>
        {[...Array(7)].map((_, i) => (
          <Box key={i} p={[0.25 + i * 0.27, 0.65, 0]} s={[0.04, 1.2, 0.04]} c="#2b2d42" shadow={false} />
        ))}
        <Box p={[0.95, 1.22, 0]} s={[1.9, 0.06, 0.06]} c="#2b2d42" />
        <Box p={[0.95, 0.12, 0]} s={[1.9, 0.06, 0.06]} c="#2b2d42" />
      </group>
      {/* flower pots along the garden wall */}
      {[-33, -31.5, -24, -22.8].map((x, i) => (
        <group key={x} position={[x, 0, -8.9]}>
          <Cyl p={[0, 0.3, 0]} s={[0.5, 0.6, 0.5]} c="#c1440e" lo />
          <mesh geometry={GEO.ico} material={mat(i % 2 ? '#ff006e' : '#ffbe0b')} position={[0, 0.8, 0]} scale={0.5} />
        </group>
      ))}
    </group>
  );
}

function WiresAndBunting() {
  const pairs = useMemo(() => {
    const out: Array<[V3, V3]> = [];
    const north = POLES.filter(([, z]) => z < 0);
    const south = POLES.filter(([, z]) => z > 0);
    for (const row of [north, south]) {
      for (let i = 0; i < row.length - 1; i++) {
        for (const o of [-0.7, -0.25, 0.25, 0.7]) {
          out.push([
            [row[i][0], 6.12, row[i][1] + o * 0.05],
            [row[i + 1][0], 6.12, row[i + 1][1] + o * 0.05],
          ]);
        }
        out.push([
          [row[i][0], 5.42, row[i][1]],
          [row[i + 1][0], 5.42, row[i + 1][1]],
        ]);
      }
    }
    // a few lines across the road and into houses
    out.push([[-7, 6.1, -4.6], [-7, 6.1, 4.6]]);
    out.push([[20, 6.1, -4.6], [20, 6.1, 4.6]]);
    out.push([[-20, 5.4, -4.6], [-14, 5.0, -8]]);
    out.push([[7, 5.4, -4.6], [13.5, 5.2, -8]]);
    out.push([[33, 5.4, -4.6], [27.5, 6.0, -8]]);
    out.push([[-20, 5.4, 4.6], [-14, 5.6, 10]]);
    out.push([[20, 5.4, 4.6], [27, 5.6, 9]]);
    out.push([[-33, 5.4, 4.6], [-28, 6.0, 10]]);
    return out;
  }, []);

  // festive triangle flags strung across the road
  const bunting = useMemo(() => {
    const flags: Array<{ p: V3; c: string; r: number }> = [];
    const lines: Array<[V3, V3]> = [
      [
        [-7, 5.0, -4.6],
        [7, 5.0, 4.6],
      ],
      [
        [7, 5.0, -4.6],
        [-7, 5.0, 4.6],
      ],
      [
        [-20, 5.0, -4.6],
        [-20, 5.0, 4.6],
      ],
    ];
    const cols = ['#ff006e', '#ffbe0b', '#3a86ff', '#06d6a0', '#fb5607', '#8338ec'];
    lines.forEach(([a, b], li) => {
      const n = 16;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const sag = Math.sin(t * Math.PI) * 0.8;
        flags.push({
          p: [a[0] + (b[0] - a[0]) * t, a[1] - sag, a[2] + (b[2] - a[2]) * t],
          c: cols[(i + li) % cols.length],
          r: Math.atan2(b[0] - a[0], b[2] - a[2]),
        });
      }
    });
    return { flags, lines };
  }, []);

  return (
    <group>
      <Wires pairs={pairs} />
      <Wires pairs={bunting.lines} sag={6} />
      {bunting.flags.map((f, i) => (
        <mesh key={i} geometry={GEO.cone} material={mat(f.c)} position={[f.p[0], f.p[1] - 0.22, f.p[2]]} rotation={[Math.PI, f.r, 0]} scale={[0.38, 0.45, 0.04]} />
      ))}
    </group>
  );
}

/** Layered film posters on the friends’ building, facing the north road. */
function PosterWall() {
  const m = useMemo(() => texMat(posterWallTexture()), []);
  return <mesh geometry={GEO.plane} material={m} position={[-8.94, 1.7, -13.5]} rotation={[0, Math.PI / 2, 0]} scale={[8.4, 2.8, 1]} />;
}

/** The gang’s hideout: an old shutter in the side of a building, halfway down the lane. */
function HideoutShutter() {
  const sign = useMemo(() => texMat(textTexture('HQ', '#2b2d42', '#ffb400', 256, 128)), []);
  const note = useMemo(() => texMat(textTexture('PRIVATE', '#fff1d6', '#c1121f', 256, 80, '"Baloo 2", sans-serif')), []);
  return (
    <group position={[-20.95, 0, 19.2]} rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={GEO.plane} material={mat('#141414')} position={[0, 0.85, 0.01]} scale={[2.4, 1.7, 1]} />
      {[...Array(6)].map((_, i) => (
        <Box key={i} p={[0, 1.8 + i * 0.2, 0.04]} s={[2.6, 0.18, 0.06]} c={i % 2 ? '#9aa5b1' : '#7d8794'} />
      ))}
      <Box p={[-1.35, 1.5, 0.05]} s={[0.12, 3.0, 0.1]} c="#4a4e69" />
      <Box p={[1.35, 1.5, 0.05]} s={[0.12, 3.0, 0.1]} c="#4a4e69" />
      <mesh geometry={GEO.plane} material={sign} position={[0, 3.35, 0.06]} scale={[1.4, 0.7, 1]} />
      <mesh geometry={GEO.plane} material={note} position={[0.7, 1.35, 0.08]} rotation={[0, 0, 0.12]} scale={[0.7, 0.22, 1]} />
      {/* spray-painted doodles */}
      <Box p={[-1.9, 1.2, 0.02]} s={[0.8, 0.6, 0.02]} c="#ffb400" shadow={false} />
      <Box p={[1.9, 2.2, 0.02]} s={[0.6, 0.4, 0.02]} c="#e4007c" shadow={false} />
      <mesh geometry={GEO.torus} material={mat('#222')} position={[1.8, 0.2, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1.1, 3]} />
      <mesh geometry={GEO.torus} material={mat('#222')} position={[1.8, 0.45, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1.1, 3]} />
    </group>
  );
}

/** Rooftop hoarding on the old cinema, angled at the street so it can be read. */
function CinemaHoarding() {
  const sign = useMemo(() => texMat(signTexture('SHREE TALKIES', '1999 se marammat ke liye band', '#3d405b', '#f2cc8f')), []);
  const poster = useMemo(() => texMat(posterTexture(3)), []);
  return (
    <group position={[29, 9.6, 15]} rotation={[0, Math.PI / 4, 0]}>
      <Box p={[-2, 1.5, -0.3]} s={[0.15, 3, 0.15]} c="#555" />
      <Box p={[2, 1.5, -0.3]} s={[0.15, 3, 0.15]} c="#555" />
      <mesh geometry={GEO.plane} material={sign} position={[0, 3.6, 0]} scale={[7.2, 1.8, 1]} />
      <mesh geometry={GEO.plane} material={poster} position={[0, 1.6, 0]} scale={[2.2, 2.2, 1]} />
    </group>
  );
}

function Clutter() {
  return (
    <group>
      {/* tea plaza */}
      <TeaStall x={12} z={10.6} />
      <Bench x={9.2} z={14.2} />
      <Bench x={14.6} z={14.2} />
      <CarromBoard x={18.2} z={15.4} />
      {/* plastic chairs */}
      {[
        [10.2, 12.6, '#e63946'],
        [14.4, 12.4, '#3a86ff'],
      ].map(([x, z, c], i) => (
        <group key={i} position={[x as number, 0, z as number]} rotation={[0, 0.5 * i, 0]}>
          <Box p={[0, 0.45, 0]} s={[0.6, 0.08, 0.6]} c={c as string} />
          <Box p={[0, 0.8, -0.28]} s={[0.6, 0.6, 0.06]} c={c as string} />
          <Box p={[0, 0.22, 0]} s={[0.55, 0.45, 0.55]} c={c as string} />
        </group>
      ))}
      {/* scooters, cars, autos */}
      <Scooter x={-17.5} z={-6.6} rot={0} color="#e9c46a" />
      <Scooter x={4.8} z={-6.8} rot={0.3} color="#d62828" />
      <Scooter x={22} z={6.6} rot={Math.PI} color="#2a9d8f" />
      <Auto x={-30} z={6.4} rot={0} />
      <Car x={-36} z={-6.3} rot={0} color="#f1faee" />
      <SabziCart x={-5.6} z={13} />
      <Drum x={19.5} z={-12.5} />
      <BarberChair x={23.6} z={-7.2} rot={0} />
      <Stumps x={0} z={20.6} />
      <Swing x={-31.6} z={-10.4} />
      <Pigeons x={6.4} z={-6.3} />
      {/* shrine on the corner: small temple niche with marigolds */}
      <group position={[-35.5, 0, 5.8]}>
        <Box p={[0, 0.6, 0]} s={[1.4, 1.2, 1.0]} c="#f77f00" />
        <mesh material={mat('#d00000')} position={[0, 1.7, 0]} scale={[1.2, 1.0, 1.0]}>
          <coneGeometry args={[0.6, 1, 4]} />
        </mesh>
        <Box p={[0, 0.7, 0.51]} s={[0.6, 0.6, 0.02]} c="#3d1f1f" />
        <mesh geometry={GEO.sphereLo} material={mat('#ffd166', { emissive: '#7a5200' })} position={[0, 0.65, 0.55]} scale={0.18} />
      </group>
      {/* bicycles leaning on walls */}
      <group position={[-9.6, 0, -8.6]} rotation={[0, 0.1, 0]}>
        <mesh geometry={GEO.torus} material={mat('#222')} position={[-0.5, 0.45, 0]} scale={[0.9, 0.9, 1]} />
        <mesh geometry={GEO.torus} material={mat('#222')} position={[0.5, 0.45, 0]} scale={[0.9, 0.9, 1]} />
        <Box p={[0, 0.7, 0]} s={[1.0, 0.06, 0.06]} c="#c1121f" />
      </group>
      {/* gas cylinders outside Lalaji's */}
      {[17.2, 17.7].map((x) => (
        <Cyl key={x} p={[x, 0.45, -7.4]} s={[0.4, 0.9, 0.4]} c="#d62828" />
      ))}
      {/* posters on walls */}
      <PosterBoard x={-18.5} y={2.0} z={-7.97} i={7} />
      <PosterBoard x={-10} y={2.2} z={-7.97} i={4} />
      <PosterBoard x={9.6} y={2.0} z={-7.97} i={6} />
      <PosterBoard x={-12} y={2.0} z={9.97} rot={Math.PI} i={2} />
      <PosterBoard x={-26} y={2.0} z={9.97} rot={Math.PI} i={3} />
      <PosterBoard x={-20.96} y={2.0} z={16.6} rot={Math.PI / 2} i={5} w={0.8} />
      {/* laundry across the hideout lane */}
      <Laundry a={[-21, 13]} b={[-19, 13.3]} y={4.2} seed={2} />
      <Laundry a={[-21, 17]} b={[-19, 17.2]} y={4.8} seed={7} />
      <Laundry a={[-21, 20]} b={[-19, 20.2]} y={4.0} seed={4} />
      {/* lane sign */}
      <group position={[-18.7, 0, 8.5]}>
        <Box p={[0, 1.2, 0]} s={[0.1, 2.4, 0.1]} c="#555" />
        <Box p={[0, 2.5, 0]} s={[1.4, 0.45, 0.05]} c="#1d3557" />
        <Box p={[0, 2.5, 0.03]} s={[1.3, 0.36, 0.01]} c="#f1faee" shadow={false} />
      </group>
    </group>
  );
}

export function StreetScene() {
  return (
    <group>
      <Ground />
      {BUILDINGS.map((b, i) => (
        <Building key={b.id} b={b} seed={i * 17 + 3} />
      ))}
      <GardenWall />
      {POLES.map(([x, z], i) => (
        <Pole key={i} x={x} z={z} />
      ))}
      <WiresAndBunting />
      {TREES.map(([x, z, s], i) => (
        <Tree key={i} x={x} z={z} s={s} />
      ))}
      <PosterWall />
      <HideoutShutter />
      <CinemaHoarding />
      <Clutter />
      <Ambient />
    </group>
  );
}
