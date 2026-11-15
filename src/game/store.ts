import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CharId, EmoteKind, SceneId, StateView, TaskSpec } from './types';
import { CHAR_IDS } from './types';
import { MISSIONS, MISSION_MAP } from './data/missions';
import { emptyLies, type LieState } from './lies';

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
  kind: 'mission' | 'objective' | 'secret' | 'money' | 'info' | 'fail' | 'alert' | 'lie';
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
  /** explicit arrival point (used when switching to a friend in another scene) */
  at?: { x: number; z: number; face: number };
}

export interface FriendPos {
  x: number;
  z: number;
  face: number;
}

/** A friend busy doing something; keeps running while you control someone else. */
export interface Task {
  id: number;
  who: CharId;
  kind: TaskSpec['kind'];
  label: string;
  scene: SceneId;
  x: number;
  z: number;
  /** seconds done / seconds needed */
  elapsed: number;
  duration: number;
  spec: TaskSpec;
  source: string;
}

/** A question an NPC puts to Pakya while he is keeping them busy. */
export interface Question {
  id: number;
  npc: string;
  topic: string;
  prompt: string;
  options: string[];
  deadline: number;
}

export interface Persisted {
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
  /* Part 2 */
  lies: LieState;
  stats: Record<string, number>;
  items: string[];
  /** which scene each friend is in */
  where: Record<CharId, SceneId>;
  /** friends left somewhere on their own (not following the active friend) */
  posted: Record<CharId, boolean>;
  friendPos: Record<CharId, FriendPos>;
  dhol: string;
  /** mission director state (timers, counters) */
  mstate: Record<string, number | string | boolean>;
  checkpoint: { mission: string; data: string } | null;
  worldTime: number;
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
  partEnded: false | 'part1' | 'part2';
  switchFlash: number;
  /** where the gang appears when the next scene mounts */
  entry: { x: number; z: number; face: number } | null;
  talkingTo: string | null;
  sceneCard: number;
  /* Part 2 */
  failure: { mission: string; reason: string } | null;
  tasks: Task[];
  question: Question | null;
  hidden: Partial<Record<CharId, string>>;
  panic: number;
  crowd: CharId[];
  lieBook: boolean;
  /** bumped whenever simulated agents spawn or leave, so renderers refresh */
  agentsV: number;
}

export type GameState = Persisted & Volatile;

let uid = 1;
export const nextId = () => uid++;

const allIn = <T,>(v: T) => Object.fromEntries(CHAR_IDS.map((c) => [c, v])) as Record<CharId, T>;

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
  lies: emptyLies(),
  stats: { 'ritu.trust': 30, 'gang.harmony': 60 },
  items: [],
  where: allIn<SceneId>('house'),
  posted: allIn(false),
  friendPos: allIn({ x: 0, z: 0, face: 0 }),
  dhol: 'unknown',
  mstate: {},
  checkpoint: null,
  worldTime: 0,
});

const volatileDefaults = (): Volatile => ({
  mode: 'boot',
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
  failure: null,
  tasks: [],
  question: null,
  hidden: {},
  panic: 0,
  crowd: [],
  lieBook: false,
  agentsV: 0,
});

const PERSIST_KEYS = Object.keys(freshProgress()) as Array<keyof Persisted>;

export function persistedOf(s: GameState): Persisted {
  return Object.fromEntries(PERSIST_KEYS.map((k) => [k, s[k]])) as unknown as Persisted;
}

export const useGame = create<GameState>()(
  persist(
    (): GameState => ({ ...freshProgress(), ...volatileDefaults() }),
    {
      name: 'dhol-save-v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => persistedOf(s),
      migrate: (old, version) => migrateSave(old as Partial<Persisted>, version),
      merge: (persistedState, current) => ({ ...current, ...fillDefaults(persistedState as Partial<Persisted>) }),
    },
  ),
);

/** Fill fields that older saves do not have. */
export function fillDefaults(p: Partial<Persisted>): Persisted {
  const base = freshProgress();
  const out = { ...base, ...p } as Persisted;
  // missions added after the save was made start locked
  out.missions = { ...Object.fromEntries(MISSIONS.map((m) => [m.id, { status: 'locked', done: [] } as MissionState])), ...(p.missions ?? {}) };
  out.lies = { ...emptyLies(), ...(p.lies ?? {}) };
  out.stats = { ...base.stats, ...(p.stats ?? {}) };
  return out;
}

/** v1 (Part 1) saves ended on a placeholder mission; Part 2 continues from there. */
export function migrateSave(old: Partial<Persisted>, version: number): Persisted {
  const p = fillDefaults(old);
  if (version < 2) {
    const missions = { ...p.missions } as Record<string, MissionState>;
    const placeholder = missions['part2'];
    delete missions['part2'];
    if (placeholder?.status === 'active' || missions['ritu']?.status === 'done') missions['rich'] = { status: 'active', done: [] };
    p.missions = missions;
    const where = p.savedPos?.scene ?? p.scene;
    p.where = allIn(where);
    // Part 1 bluffs that the old save can still prove
    if (p.flags['ritu.cable']) p.lies.beliefs = { ...p.lies.beliefs, daadi: { 'pakya.job': { value: 'cable TV inspector', by: 'pakya', t: 0 } } };
  }
  return p;
}

const set = useGame.setState;
const get = useGame.getState;

export function view(): StateView {
  const s = get();
  const carried = s.dhol.startsWith('carried:');
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
    stat: (k) => s.stats[k] ?? 0,
    has: (item) => s.items.includes(item) || (item === 'dhol' && carried),
    suspicion: (npc) => s.lies.suspicion[npc] ?? 0,
    believes: (npc, topic) => s.lies.beliefs[npc]?.[topic]?.value,
    crowd: s.crowd,
    dhol: s.dhol,
    time: s.worldTime,
    m: (k) => s.mstate[k],
  };
}

export function toast(text: string, kind: Toast['kind'] = 'info', sub?: string) {
  const t: Toast = { id: uid++, text, kind, sub };
  set((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
  window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) })), kind === 'mission' ? 4200 : kind === 'lie' || kind === 'alert' ? 4600 : 3200);
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

export function addStat(key: string, delta: number, min = 0, max = 100) {
  set((s) => ({ stats: { ...s.stats, [key]: Math.max(min, Math.min(max, (s.stats[key] ?? 0) + delta)) } }));
}

export function setStat(key: string, value: number) {
  set((s) => ({ stats: { ...s.stats, [key]: value } }));
}

export function setM(key: string, value: number | string | boolean) {
  set((s) => ({ mstate: { ...s.mstate, [key]: value } }));
}

export function getM<T extends number | string | boolean>(key: string, fallback: T): T {
  const v = get().mstate[key];
  return (v === undefined ? fallback : v) as T;
}

export function giveItem(item: string) {
  set((s) => ({ items: s.items.includes(item) ? s.items : [...s.items, item] }));
}

export function takeItem(item: string) {
  set((s) => ({ items: s.items.filter((i) => i !== item) }));
}

export function activeMission() {
  const s = get();
  // if two are ever active at once, the further one in the story wins
  return [...MISSIONS].reverse().find((m) => s.missions[m.id]?.status === 'active') ?? null;
}

/* ───────── mission lifecycle (directors register here to avoid import cycles) ───────── */

type MissionHook = (id: string) => void;
const startHooks: MissionHook[] = [];
export function onMissionStart(fn: MissionHook) {
  startHooks.push(fn);
}

/** Start a mission: snapshot a checkpoint first so failure can roll back to exactly here. */
export function activateMission(id: string) {
  const s = get();
  const missions = { ...s.missions, [id]: { status: 'active', done: [] } as MissionState };
  const mstate = Object.fromEntries(Object.entries(s.mstate).filter(([k]) => !/^(smooth|distracted|home|in|asked)\./.test(k)));
  set({ missions, mstate });
  const snap = persistedOf(get());
  snap.checkpoint = null;
  set({ checkpoint: { mission: id, data: JSON.stringify(snap) } });
  startHooks.forEach((f) => f(id));
}

export function completeObjective(objId: string) {
  const missionId = objId.split('.')[0];
  const def = MISSION_MAP[missionId];
  const s = get();
  const ms = s.missions[missionId];
  if (!def || !ms || ms.status !== 'active' || ms.done.includes(objId)) return;
  const done = [...ms.done, objId];
  const allDone = def.objectives.filter((o) => !o.optional).every((o) => done.includes(o.id));
  const missions = { ...s.missions, [missionId]: { status: allDone ? 'done' : 'active', done } as MissionState };
  const obj = def.objectives.find((o) => o.id === objId);
  set({ missions });
  if (allDone) {
    toast(def.title, 'mission', 'Mission complete');
    if (def.next && MISSION_MAP[def.next]) {
      const n = MISSION_MAP[def.next];
      // the interval card at the end of Part 1 starts Part 2 when it closes
      if (def.holdNext) setM(`pending.${def.next}`, true);
      else
        window.setTimeout(() => {
          const go = () => {
            activateMission(def.next!);
            toast(n.title, 'mission', 'New mission');
          };
          // never yank the gang around in the middle of a conversation
          if (get().dialogue) set((st) => ({ afterDialogue: [...st.afterDialogue, () => window.setTimeout(go, 600)] }));
          else go();
        }, 1800);
    }
  } else if (obj) {
    toast(obj.text, 'objective', 'Done');
  }
}

export function failMission(reason: string) {
  const s = get();
  const m = activeMission();
  if (!m || s.failure) return;
  set({ failure: { mission: m.id, reason }, tasks: [], question: null });
}

/** Roll back to the moment the active mission started. */
export function retryMission() {
  const s = get();
  const cp = s.checkpoint;
  if (!cp) return set({ failure: null });
  const data = fillDefaults(JSON.parse(cp.data) as Partial<Persisted>);
  const pos = data.friendPos[data.active];
  set({
    ...data,
    checkpoint: cp,
    failure: null,
    dialogue: null,
    dialogueQueue: [],
    afterDialogue: [],
    tasks: [],
    question: null,
    hidden: {},
    panic: 0,
    transition: null,
    entry: pos ? { x: pos.x, z: pos.z, face: pos.face } : null,
    sceneCard: performance.now(),
  });
  startHooks.forEach((f) => f(cp.mission));
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

export function beginTransition(to: SceneId, spawn: string, at?: { x: number; z: number; face: number }) {
  if (get().transition) return;
  set({ transition: { to, spawn, phase: 'out', at } });
}

export function markOnce(id: string) {
  set((s) => ({ usedOnce: s.usedOnce.includes(id) ? s.usedOnce : [...s.usedOnce, id] }));
}

export function startNewGame() {
  set({
    ...freshProgress(),
    ...volatileDefaults(),
    introSeen: true,
    hasSave: true,
    muted: get().muted,
    mode: 'play',
    entry: { x: -1.6, z: 0.6, face: 0.7 },
    sceneCard: performance.now(),
  });
  const snap = persistedOf(get());
  set({ checkpoint: { mission: 'rent', data: JSON.stringify(snap) } });
  window.setTimeout(() => toast(MISSION_MAP.rent.title, 'mission', 'Mission'), 900);
}

export function continueGame() {
  const s = get();
  const m = activeMission();
  // missions that run on live timers restart cleanly from their checkpoint
  if (m?.live && s.checkpoint?.mission === m.id) {
    set({ mode: 'play' });
    retryMission();
    return;
  }
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
    failure: null,
    tasks: [],
    question: null,
    sceneCard: performance.now(),
  });
  if (m) startHooks.forEach((f) => f(`resume:${m.id}`));
}
