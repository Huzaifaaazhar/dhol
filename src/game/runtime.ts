/**
 * Mutable per-frame state. Never put this in React state: it changes every frame.
 */
export type AnimState = 'idle' | 'walk' | 'run' | 'talk' | 'signature' | 'panic' | 'trip' | 'celebrate' | 'sit' | 'read' | 'carrom' | 'chai' | 'cricket' | 'sweep' | 'swing';

export interface EntityRt {
  x: number;
  z: number;
  y: number;
  face: number;
  speed: number; // current horizontal speed
  anim: AnimState;
  animT: number; // time in current anim
  /** seconds remaining of a one-shot anim; returns to idle/walk when 0 */
  oneShot: number;
  stride: number; // accumulated distance for gait phase
}

export const runtime = {
  entities: new Map<string, EntityRt>(),
  /** camera focus point */
  cam: { x: 0, z: 0 },
  shake: 0,
  /** the closing car chase, while it plays */
  chase: null as null | { t0: number },
  /** a quick dramatic zoom-in that decays (filmi moments) */
  zoomPunch: 0,
  /** current interaction focus world position (for prompt) */
  time: 0,
  /** set when the gang should be placed at a spawn on next frame */
  pendingSpawn: null as null | { x: number; z: number; face: number },
  /** something ridiculous happened here; NPCs nearby turn to stare */
  attention: null as null | { x: number; z: number; until: number },
  /** moving obstacles (traffic, pedestrians) published by the ambient system */
  dynamic: [] as Array<{ x: number; z: number; r: number }>,
  /** where the camera wants to be; the camera rig eases towards it */
  camGoal: { x: 0, z: 0, zoom: 44, k: 5, height: 1 },
  /** scene in which Maru's lookout reveals the goons' sightlines */
  reveal: null as null | string,
  /** facial expressions set by emotes: id -> mood until a time (performance.now ms) */
  expr: new Map<string, { mood: 'shock' | 'angry' | 'happy' | 'confused' | 'sad'; until: number }>(),
  /** the live camera, for projecting in-world labels onto the screen */
  camera: null as null | import('three').Camera,
};

export function ent(id: string): EntityRt {
  let e = runtime.entities.get(id);
  if (!e) {
    e = { x: 0, z: 0, y: 0, face: 0, speed: 0, anim: 'idle', animT: 0, oneShot: 0, stride: 0 };
    runtime.entities.set(id, e);
  }
  return e;
}

export function playOneShot(id: string, anim: AnimState, seconds: number) {
  const e = ent(id);
  e.anim = anim;
  e.animT = 0;
  e.oneShot = seconds;
}
