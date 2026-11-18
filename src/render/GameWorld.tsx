import { useFrame } from '@react-three/fiber';
import { CHASE, chaseCarX } from '../game/chase';
import { RituCar } from './RituCar';
import { SCENES } from '../game/data/scenes';
import type { RoomDef } from '../game/data/scenes/interiors';
import { useGame } from '../game/store';
import { ent, runtime } from '../game/runtime';
import { Sun } from './CameraRig';
import { StreetScene } from './scenes/StreetScene';
import { InteriorScene } from './scenes/InteriorScene';
import { Gang } from './Gang';
import { NPCs, Agents } from './NPCs';
import { CinemaBackDoor, DeliveryMarker, DholInWorld, JaiBag, JunkPile, PawPrints, VisionCones, ZikomoCar } from './part2props';
import { simTick } from '../game/sim/sim';
import { agents } from '../game/sim/agents';
import { setTension } from '../game/audio';
import { activeMission } from '../game/store';
import { useEffect, useRef } from 'react';

/** Runs the world clock every frame, independent of which scene is drawn. */
function Simulation() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    simTick(dt);
    acc.current += dt;
    if (acc.current < 0.5) return;
    acc.current = 0;
    setTension(tensionNow());
  });
  useEffect(() => () => setTension(0), []);
  return null;
}

/** Music follows danger: quiet pulse in live missions, faster when hunted or out of time. */
function tensionNow(): 0 | 1 | 2 {
  const s = useGame.getState();
  if (s.mode !== 'play' || s.endingShown || s.failure) return 0;
  const m = activeMission();
  if (!m?.live || s.mstate.climax) return 0;
  const end = (s.mstate.timerEnd as number) ?? 0;
  const late = end > 0 && end - s.worldTime < 45;
  const hunted = [...agents.values()].some((a) => a.hostile && a.mode === 'chase');
  return late || hunted || s.panic > 60 ? 2 : 1;
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
    // the closing chase: follow Ritu's car, a little wider
    if (runtime.chase) {
      x = chaseCarX() - 4;
      z = CHASE.z;
      zoom = scene.zoom * 0.85;
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
      {scene.interior && <color attach="background" args={['#2a1238']} />}
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
          <DeliveryMarker />
          <CinemaBackDoor />
          <RituCar />
        </>
      )}
    </group>
    </>
  );
}
