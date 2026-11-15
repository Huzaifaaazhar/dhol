import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../game/store';
import { CameraRig } from './CameraRig';
import { GameWorld } from './GameWorld';
import { IntroWorld } from './IntroWorld';
import { TitleWorld } from './TitleWorld';

export function Stage() {
  const mode = useGame((s) => s.mode);
  return (
    <Canvas
      className="stage"
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => {
        if (import.meta.env.DEV) Object.assign(window, { __gl: gl });
      }}
    >
      <CameraRig />
      {(mode === 'boot' || mode === 'title') && <TitleWorld />}
      {mode === 'intro' && <IntroWorld />}
      {mode === 'play' && <GameWorld />}
    </Canvas>
  );
}
