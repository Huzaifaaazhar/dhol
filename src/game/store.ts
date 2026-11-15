import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CharId, EmoteKind, SceneId, StateView } from './types';
import { CHAR_IDS } from './types';
import { MISSIONS, MISSION_MAP } from './data/missions';

export type Mode = 'boot' | 'intro' | 'title' | 'play';

export interface MissionState {
  status: 'locked' | 'active' | 'done';
  done: string[];
}

export interface Bubble {
  id: number;
  target: string;
  text: string;
  until: number;
}

export interface Toast {
  id: number;
  text: string;
  kind: 'mission' | 'objective' | 'secret' | 'money' | 'info' | 'fail';
  sub?: string;
}

export interface DialogueState {
  script: string;
  node: string;
}

export interface SavedPos {
  scene: SceneId;
  x: number;
  z: number;
  face: number;
}

export interface Transition {
  to: SceneId;
  spawn: string;
  phase: 'out' | 'in';
}

interface Persisted {
  scene: SceneId;
  active: CharId;
  visited: CharId[];
  flags: Record<string, boolean>;
  money: number;
  secrets: string[];
  missions: Record<string, MissionState>;
  savedPos: SavedPos | null;
  introSeen: boolean;
  hasSave: boolean;
  usedOnce: string[];
  muted: boolean;
  hints: Record<string, boolean>;
  impressed: CharId[];
}

interface Volatile {
  mode: Mode;
  dialogue: DialogueState | null;
  dialogueQueue: string[];
  afterDialogue: Array<() => void>;
  focus: string | null;
  bubbles: Bubble[];
  emotes: Record<string, { kind: EmoteKind; until: number }>;
  toasts: Toast[];
  transition: Transition | null;
  paused: boolean;
  partEnded: boolean;
  switchFlash: number;
  /** where the gang appears when the next scene mounts */
  entry: { x: number; z: number; face: number } | null;
  talkingTo: string | null;
  sceneCard: number;
}

export type GameState = Persisted & Volatile;

let uid = 1;

export const freshProgress = (): Persisted => ({
  scene: 'house',
  active: 'sam',
  visited: ['sam'],
  flags: {},
  money: 0,
  secrets: [],
  missions: Object.fromEntries(
    MISSIONS.map((m, i) => [m.id, { status: i === 0 ? 'active' : 'locked', done: [] } as MissionState]),
  ),
  savedPos: null,
  introSeen: false,
  hasSave: false,
  usedOnce: [],
  muted: false,
  hints: {},
  impressed: [],
});

export const useGame = create<GameState>()(
  persist(
    (): GameState => ({
      ...freshProgress(),
      mode: 'boot' as Mode,
      dialogue: null,
      dialogueQueue: [],
      afterDialogue: [],
      focus: null,
      bubbles: [],
      emotes: {},
      toasts: [],
      transition: null,
      paused: false,
      partEnded: false,
      switchFlash: 0,
      entry: null,
      talkingTo: null,
      sceneCard: 0,
    }),
    {
      name: 'dhol-save-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): Persisted => ({
        scene: s.scene,
        active: s.active,
        visited: s.visited,
        flags: s.flags,
        money: s.money,
        secrets: s.secrets,
        missions: s.missions,
        savedPos: s.savedPos,
        introSeen: s.introSeen,
        hasSave: s.hasSave,
        usedOnce: s.usedOnce,
        muted: s.muted,
        hints: s.hints,
        impressed: s.impressed,
      }),
    },
  ),
);

const set = useGame.setState;
const get = useGame.getState;

export function view(): StateView {
  const s = get();
  return {
    flags: s.flags,
    money: s.money,
    active: s.active,
    scene: s.scene,
    missionStatus: (id) => s.missions[id]?.status ?? 'locked',
    objectiveDone: (id) => {
      const m = s.missions[id.split('.')[0]];
      return !!m && m.done.includes(id);
    },
  };
}

export function toast(text: string, kind: Toast['kind'] = 'info', sub?: string) {
  const t: Toast = { id: uid++, text, kind, sub };
  set((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
  window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) })), kind === 'mission' ? 4200 : 3200);
}

export function bark(target: string, text: string, seconds = 2.6) {
  const b: Bubble = { id: uid++, target, text, until: performance.now() + seconds * 1000 };
  set((s) => ({ bubbles: [...s.bubbles.filter((x) => x.target !== target), b] }));
  window.setTimeout(() => set((s) => ({ bubbles: s.bubbles.filter((x) => x.id !== b.id) })), seconds * 1000);
}

export function emote(target: string, kind: EmoteKind, seconds = 1.8) {
  const until = performance.now() + seconds * 1000;
  set((s) => ({ emotes: { ...s.emotes, [target]: { kind, until } } }));
  window.setTimeout(() => {
    const cur = get().emotes[target];
    if (cur && cur.until === until) {
      const next = { ...get().emotes };
      delete next[target];
      set({ emotes: next });
    }
  }, seconds * 1000);
}

export function setFlag(flag: string, value = true) {
  set((s) => ({ flags: { ...s.flags, [flag]: value } }));
}

export function addMoney(n: number) {
  set((s) => ({ money: Math.max(0, s.money + n) }));
}

export function activeMission() {
  const s = get();
  return MISSIONS.find((m) => s.missions[m.id]?.status === 'active') ?? null;
}

export function completeObjective(objId: string) {
  const missionId = objId.split('.')[0];
  const def = MISSION_MAP[missionId];
  const s = get();
  const ms = s.missions[missionId];
  if (!def || !ms || ms.status !== 'active' || ms.done.includes(objId)) return;
  const done = [...ms.done, objId];
  const allDone = def.objectives.every((o) => done.includes(o.id));
  const missions = { ...s.missions, [missionId]: { status: allDone ? 'done' : 'active', done } as MissionState };
  const obj = def.objectives.find((o) => o.id === objId);
  if (allDone && def.next && missions[def.next]) {
    missions[def.next] = { status: 'active', done: [] };
  }
  set({ missions });
  if (allDone) {
    toast(def.title, 'mission', 'Mission complete');
    if (def.next) {
      const n = MISSION_MAP[def.next];
      window.setTimeout(() => toast(n.title, 'mission', 'New mission'), 1800);
    }
  } else if (obj) {
    toast(obj.text, 'objective', 'Done');
  }
}

export function switchTo(id: CharId) {
  const s = get();
  if (s.active === id || s.transition) return;
  const visited = s.visited.includes(id) ? s.visited : [...s.visited, id];
  set({ active: id, visited, switchFlash: performance.now() });
  if (CHAR_IDS.every((c) => visited.includes(c))) completeObjective('rent.meet');
}

export function cycleChar(dir = 1) {
  const s = get();
  const i = CHAR_IDS.indexOf(s.active);
  switchTo(CHAR_IDS[(i + dir + CHAR_IDS.length) % CHAR_IDS.length]);
}

export function beginTransition(to: SceneId, spawn: string) {
  if (get().transition) return;
  set({ transition: { to, spawn, phase: 'out' } });
}

export function markOnce(id: string) {
  set((s) => ({ usedOnce: s.usedOnce.includes(id) ? s.usedOnce : [...s.usedOnce, id] }));
}

export function startNewGame() {
  set({
    ...freshProgress(),
    introSeen: true,
    hasSave: true,
    muted: get().muted,
    mode: 'play',
    dialogue: null,
    dialogueQueue: [],
    afterDialogue: [],
    focus: null,
    bubbles: [],
    emotes: {},
    toasts: [],
    transition: null,
    paused: false,
    partEnded: false,
    entry: { x: -1.6, z: 0.6, face: 0.7 },
    talkingTo: null,
    sceneCard: performance.now(),
  });
  window.setTimeout(() => toast(MISSION_MAP.rent.title, 'mission', 'Mission'), 900);
}

export function continueGame() {
  const s = get();
  const pos = s.savedPos;
  set({
    mode: 'play',
    scene: pos?.scene ?? s.scene,
    entry: pos ? { x: pos.x, z: pos.z, face: pos.face } : null,
    dialogue: null,
    dialogueQueue: [],
    afterDialogue: [],
    transition: null,
    paused: false,
    partEnded: false,
    sceneCard: performance.now(),
  });
}
