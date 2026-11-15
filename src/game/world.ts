import type { Interactable, NpcPlacement, SceneDef } from './types';
import { SCENES } from './data/scenes';
import { NPCS } from './data/npcs';
import { useGame, view } from './store';
import { ent } from './runtime';
import { actionsFor } from './effects';

export interface ResolvedNpc extends NpcPlacement {
  baseX: number;
  baseZ: number;
  baseFace: number;
}

/** NPCs present in a scene right now, at their condition-dependent positions. */
export function resolveNpcs(scene: SceneDef): ResolvedNpc[] {
  const v = view();
  return scene.npcs
    .filter((n) => !n.showIf || n.showIf(v))
    .map((n) => {
      const useAlt = n.alt && n.alt.when(v);
      return {
        ...n,
        baseX: useAlt ? n.alt!.x : n.x,
        baseZ: useAlt ? n.alt!.z : n.z,
        baseFace: useAlt ? n.alt!.face : n.face,
        anim: useAlt && n.id === 'tiwari' ? 'read' : n.anim,
      };
    });
}

export function currentScene() {
  return SCENES[useGame.getState().scene];
}

export function interactablePos(it: Interactable) {
  if (it.npc) {
    const e = ent(it.npc);
    return { x: e.x, z: e.z };
  }
  return { x: it.x, z: it.z };
}

/** Find the closest usable interactable to (x,z). */
export function findFocus(scene: SceneDef, x: number, z: number, present: Set<string>): Interactable | null {
  const v = view();
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const it of scene.interactables) {
    if (it.npc && !present.has(it.npc)) continue;
    if (it.showIf && !it.showIf(v)) continue;
    const p = interactablePos(it);
    const d = Math.hypot(p.x - x, p.z - z);
    const r = it.radius ?? 1.5;
    if (d > r || d >= bestD) continue;
    if (!actionsFor(it).length) continue;
    best = it;
    bestD = d;
  }
  return best;
}

export function npcName(id: string) {
  return NPCS[id]?.name ?? id;
}
