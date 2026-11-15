import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { sky, updateBulbs } from './Sky';

/** a few warm pools of lamplight where the evening action happens */
const LAMP_GLOW: Array<[number, number]> = [
  [11.6, 12.8],
  [-19, 9.5],
  [-4, -9],
  [26, 20],
];

const OFFSET = new THREE.Vector3(1, 1.15, 1).normalize().multiplyScalar(60);

/** Isometric-style orthographic camera that eases towards runtime.camGoal. */
export function CameraRig() {
  const cam = useRef<THREE.OrthographicCamera>(null!);
  const pos = useRef(new THREE.Vector3());
  const { size } = useThree();
  const first = useRef(true);

  useFrame((_, dt) => {
    const c = cam.current;
    if (!c) return;
    const g = runtime.camGoal;
    const k = first.current ? 1 : Math.min(1, dt * g.k);
    first.current = false;
    pos.current.x += (g.x - pos.current.x) * k;
    pos.current.z += (g.z - pos.current.z) * k;
    pos.current.y = g.height;
    const fit = THREE.MathUtils.clamp(Math.min(size.width / 1.6, size.height) / 820, 0.55, 1.5);
    const zoom = g.zoom * fit;
    c.zoom += (zoom - c.zoom) * Math.min(1, dt * 3);
    let sx = 0,
      sy = 0;
    if (runtime.shake > 0) {
      runtime.shake = Math.max(0, runtime.shake - dt);
      sx = (Math.random() - 0.5) * runtime.shake * 0.6;
      sy = (Math.random() - 0.5) * runtime.shake * 0.6;
    }
    c.position.set(pos.current.x + OFFSET.x + sx, pos.current.y + OFFSET.y + sy, pos.current.z + OFFSET.z);
    c.lookAt(pos.current.x + sx, pos.current.y + sy, pos.current.z);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    runtime.camera = c;
  });

  return <OrthographicCamera ref={cam} makeDefault near={0.1} far={400} zoom={44} position={[60, 60, 60]} />;
}

/** Warm late-morning sun that follows the camera so shadows stay crisp. */
export function Sun({ interior }: { interior: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const lamps = useRef<Array<THREE.PointLight | null>>([]);
  const target = useRef<THREE.Object3D>(new THREE.Object3D());
  const { scene } = useThree();
  const first = useRef(true);
  useFrame((_, dt) => {
    const g = runtime.camGoal;
    // a low evening sun throws longer shadows
    const m = interior ? null : first.current ? sky.snap() : sky.step(dt);
    first.current = false;
    const low = m ? m.night : 0;
    light.current.position.set(g.x - 16 - low * 10, 26 - low * 12, g.z + 12 + low * 4);
    target.current.position.set(g.x, 0, g.z);
    target.current.updateMatrixWorld();
    if (!m) return;
    light.current.color.set(m.sun);
    light.current.intensity = m.sunI;
    hemi.current.color.set(m.hemiSky);
    hemi.current.groundColor.set(m.hemiGround);
    hemi.current.intensity = m.hemiI;
    if (scene.background instanceof THREE.Color) scene.background.set(m.bg);
    else scene.background = new THREE.Color(m.bg);
    if (scene.fog) scene.fog.color.set(m.fog);
    updateBulbs(m.night);
    lamps.current.forEach((l) => l && (l.intensity = m.night * 16));
  });
  return (
    <>
      <primitive object={target.current} />
      <directionalLight
        ref={light}
        target={target.current}
        castShadow
        intensity={interior ? 0.9 : 2.6}
        color={interior ? '#ffe6c4' : '#ffd9a0'}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />
      <hemisphereLight ref={hemi} args={[interior ? '#fff1d6' : '#ffe9c4', interior ? '#5a3d4a' : '#9a6b4f', interior ? 1.5 : 1.25]} />
      <ambientLight intensity={interior ? 0.35 : 0.2} color="#ffd6e0" />
      {!interior &&
        LAMP_GLOW.map(([x, z], i) => (
          <pointLight key={i} ref={(el) => (lamps.current[i] = el)} position={[x, 4.6, z]} intensity={0} distance={11} decay={1.4} color="#ffc66e" />
        ))}
    </>
  );
}
