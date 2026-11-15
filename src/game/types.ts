export type CharId = 'sam' | 'pakya' | 'goti' | 'maru';
export const CHAR_IDS: CharId[] = ['sam', 'pakya', 'goti', 'maru'];

export type SceneId = 'street' | 'house' | 'shop' | 'ritu' | 'hideout';

export type EmoteKind = '!' | '?' | '♥' | '💢' | '…' | '♪' | '$';

/** Read-only view of state that conditions and dialogue resolvers can inspect. */
export interface StateView {
  flags: Record<string, boolean>;
  money: number;
  active: CharId;
  scene: SceneId;
  missionStatus: (id: string) => 'locked' | 'active' | 'done';
  objectiveDone: (id: string) => boolean;
}

export type Condition = (s: StateView) => boolean;

/** Declarative side-effects run by effects.ts. */
export type Effect =
  | { flag: string; value?: boolean }
  | { money: number }
  | { complete: string } // objective id e.g. "rent.leave"
  | { secret: string }
  | { goto: SceneId; spawn: string }
  | { emote: string; kind: EmoteKind } // npc id or char id
  | { bark: string; text: string } // speech bubble above an entity
  | { toast: string }
  | { dialogue: string } // chain into another dialogue after this one closes
  | { sfx: 'coin' | 'fail' | 'success' | 'thud' | 'scream' | 'honk' | 'door' | 'moo' | 'bark' }
  | { endPart: true };

export interface DialogueChoice {
  text: string;
  /** Only this friend can pick it; others see it locked with a switch hint. */
  who?: CharId;
  /** Label for the ability, e.g. "Bluff", "Negotiate". */
  tag?: string;
  next?: string;
  effects?: Effect[];
  showIf?: Condition;
}

export interface DialogueNode {
  /** char id, npc id, 'me' (active friend) or 'narrator' */
  speaker: string;
  text: string;
  next?: string;
  /** computed next node (evaluated after this node's effects) */
  branch?: (s: StateView) => string;
  choices?: DialogueChoice[];
  effects?: Effect[];
}

export interface DialogueScript {
  start: string | ((s: StateView) => string);
  nodes: Record<string, DialogueNode>;
}

export interface Action {
  id: string;
  verb: string;
  /** Character-specific ability action (triggered with F). */
  who?: CharId;
  dialogue?: string;
  effects?: Effect[];
  /** Simple one-line bark from the active friend instead of a dialogue. */
  say?: string;
  showIf?: Condition;
  once?: boolean;
}

export interface Interactable {
  id: string;
  label: string;
  x: number;
  z: number;
  /** height of the prompt marker */
  y?: number;
  radius?: number;
  /** if set, position follows this NPC at runtime */
  npc?: string;
  actions: Action[];
  showIf?: Condition;
}

export interface Box {
  x: number;
  z: number;
  w: number; // size along x
  d: number; // size along z
}

export interface Trigger {
  id: string;
  x: number;
  z: number;
  r: number;
  when: Condition;
  dialogue?: string;
  effects?: Effect[];
}

export interface Spawn {
  x: number;
  z: number;
  /** facing angle in radians (0 = +z / towards camera-ish) */
  face: number;
}

export interface NpcPlacement {
  id: string;
  x: number;
  z: number;
  face: number;
  wander?: number;
  showIf?: Condition;
  /** alternative position when a condition holds */
  alt?: { when: Condition; x: number; z: number; face: number };
  anim?: 'idle' | 'sit' | 'sweep' | 'carrom' | 'cricket' | 'read' | 'chai' | 'swing';
}

export interface SceneDef {
  id: SceneId;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  colliders: Box[];
  interactables: Interactable[];
  triggers: Trigger[];
  npcs: NpcPlacement[];
  spawns: Record<string, Spawn>;
  zoom: number;
  interior: boolean;
}
