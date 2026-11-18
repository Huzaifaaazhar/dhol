import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { runtime } from '../game/runtime';
import { CHASE, chaseCarX } from '../game/chase';
import { Car } from './props';

/** Ritu's car, only during the closing chase. */
export function RituCar() {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!g.current) return;
    g.current.visible = !!runtime.chase;
    g.current.position.set(chaseCarX(), 0, CHASE.z);
  });
  return (
    <group ref={g} visible={false}>
      <Car x={0} z={0} rot={0} color="#c1121f" />
    </group>
  );
}
