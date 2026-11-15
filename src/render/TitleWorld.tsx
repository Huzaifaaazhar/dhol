import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FRIENDS } from '../game/data/characters';
import { CHAR_IDS } from '../game/types';
import { ent, playOneShot, runtime } from '../game/runtime';
import { StreetScene } from './scenes/StreetScene';
import { Sun } from './CameraRig';
import { Person } from './Person';
import { NPCs } from './NPCs';
import { street } from '../game/data/scenes';

/** Title backdrop: the gang loiters outside their building while the street goes about its day. */
const SPOTS: Array<[number, number, number]> = [
  [-16.2, -5.9, 0.9],
  [-15.0, -5.1, 0.5],
  [-13.5, -5.5, 0.1],
  [-12.3, -4.9, -0.3],
];

export function TitleWorld() {
  const lastSlot = useRef(-1);
  useLayoutEffect(() => {
    CHAR_IDS.forEach((id, i) => {
      const e = ent(`title_${id}`);
      e.x = SPOTS[i][0];
      e.z = SPOTS[i][1];
      e.face = SPOTS[i][2];
      e.speed = 0;
    });
  }, []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const g = runtime.camGoal;
    g.x = -18.6 + Math.sin(t * 0.08) * 1.2;
    g.z = -1.6 + Math.cos(t * 0.07) * 0.8;
    g.zoom = 52;
    g.k = 1.5;
    g.height = 1;
    // someone does something silly every few seconds
    const slot = Math.floor(t / 4.5);
    if (slot !== lastSlot.current) {
      lastSlot.current = slot;
      playOneShot(`title_${CHAR_IDS[slot % 4]}`, 'signature', 1.3);
    }
  });

  return (
    <>
      <color attach="background" args={['#efcf9f']} />
      <fog attach="fog" args={['#f1d2a2', 90, 150]} />
      <Sun interior={false} />
      <StreetScene />
      <NPCs scene={street} />
      {CHAR_IDS.map((id) => (
        <Person key={id} id={`title_${id}`} look={FRIENDS[id].look} move={FRIENDS[id].move} personality={id} />
      ))}
    </>
  );
}
