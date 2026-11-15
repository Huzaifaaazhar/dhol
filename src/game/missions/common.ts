import type { CharId, SceneId } from '../types';
import { CHAR_IDS } from '../types';
import { useGame, getM, setM, toast, bark } from '../store';
import { ent } from '../runtime';
import { agents, clearAgents, spawnAgent } from '../sim/agents';
import { placeFriend } from '../party';

export interface Director {
  /** fresh start or retry from checkpoint */
  start(): void;
  /** continuing from a save (non-live missions) */
  resume?(): void;
  tick?(dt: number, now: number): void;
  event?(name: string, data?: unknown): void;
  /** one of Zikomo's men caught a friend */
  caught?(who: CharId, by: string): void;
}

export const get = useGame.getState;
export const set = useGame.setState;

export { getM, setM, toast, bark, agents, clearAgents, spawnAgent, placeFriend };

/** Remember where a friend started a mission, so being caught sends him back there. */
export function setHome(c: CharId, scene: SceneId, x: number, z: number) {
  setM(`home.${c}`, `${scene}|${x}|${z}`);
}

export function sendHome(c: CharId) {
  const h = getM<string>(`home.${c}`, '');
  if (!h) return;
  const [scene, x, z] = h.split('|');
  placeFriend(c, scene as SceneId, Number(x), Number(z), 0, true);
}

export function dist(a: string, b: string) {
  const A = ent(a);
  const B = ent(b);
  return Math.hypot(A.x - B.x, A.z - B.z);
}

export function sameScene(a: CharId, agentId: string) {
  return agents.get(agentId)?.scene === get().where[a];
}

export const carrier = (): CharId | null => {
  const d = get().dhol;
  return d.startsWith('carried:') ? (d.slice(8) as CharId) : null;
};

export function inScene(c: CharId, scene: SceneId) {
  return get().where[c] === scene;
}

export function everyone(fn: (c: CharId) => boolean) {
  return CHAR_IDS.every(fn);
}

/** Zikomo's men, with sightlines that Maru's lookout reveals. */
export const GOON_VISION = { range: 7, fov: 1.9 };

export function distracted(npc: string, now: number) {
  return getM<number>(`distracted.${npc}`, -1) > now;
}
