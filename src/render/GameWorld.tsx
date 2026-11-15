import { useFrame } from '@react-three/fiber';
import { SCENES } from '../game/data/scenes';
import type { RoomDef } from '../game/data/scenes/interiors';
import { useGame } from '../game/store';
import { ent, runtime } from '../game/runtime';
import { Sun } from './CameraRig';
import { StreetScene } from './scenes/StreetScene';
import { InteriorScene } from './scenes/InteriorScene';
import { Gang } from './Gang';
import { NPCs, Agents } from './NPCs';
import { DholInWorld, JaiBag, JunkPile, PawPrints, VisionCones, ZikomoCar } from './part2props';
import { simTick } from '../game/sim/sim';

/** Runs the world clock every frame, independent of which scene is drawn. */
function Simulation() {
  useFrame((_, dt) => simTick(dt));
  return null;
}

export function GameWorld() {
  const sceneId = useGame((s) => s.scene);
  const scene = SCENES[sceneId];

  useFrame(() => {
    const st = useGame.getState();
    const g = runtime.camGoal;
    const lead = ent(st.active);
    // look slightly ahead of where the leader is heading
    const ahead = Math.min(1, lead.speed / 6) * 1.6;
    let x = runtime.cam.x + Math.sin(lead.face) * ahead;
    let z = runtime.cam.z + Math.cos(lead.face) * ahead;
    let zoom = scene.zoom;
    // frame both speakers during conversations
    if (st.dialogue && st.talkingTo) {
      const o = ent(st.talkingTo);
      x = (lead.x + o.x) / 2;
      z = (lead.z + o.z) / 2;
      zoom = scene.zoom * 1.25;
    }
    g.x = x;
    g.z = z;
    g.zoom = zoom;
    g.k = 5;
    g.height = 1;
  });

  return (
    <>
    <Simulation />
    <group key={sceneId}>
      <color attach="background" args={[scene.interior ? '#2a1238' : '#efcf9f']} />
      {!scene.interior && <fog attach="fog" args={['#f1d2a2', 90, 150]} />}
      <Sun interior={scene.interior} />
      {scene.interior ? <InteriorScene room={(scene as unknown as { room: RoomDef }).room} /> : <StreetScene />}
      <Gang scene={scene} />
      <NPCs scene={scene} />
      <Agents scene={scene} />
      <DholInWorld scene={scene.id} />
      <VisionCones scene={scene.id} />
      {!scene.interior && (
        <>
          <PawPrints />
          <JunkPile />
          <JaiBag />
          <ZikomoCar />
        </>
      )}
    </group>
    </>
  );
}
