import type { Action, Effect, Interactable, StateView, TaskSpec } from '../../types';
import { NPCS } from '../npcs';

export const door = (
  id: string,
  label: string,
  x: number,
  z: number,
  to: Effect[],
  extra: Partial<Interactable> = {},
): Interactable => ({
  id,
  label,
  x,
  z,
  y: 2.4,
  radius: 1.6,
  actions: [{ id: 'enter', verb: 'Enter', effects: to }],
  ...extra,
});

export const talk = (npc: string, label: string, dialogue: string, specials: Action[] = [], radius = 2.0): Interactable => ({
  id: `npc:${npc}`,
  label,
  npc,
  x: 0,
  z: 0,
  y: 2.6,
  radius,
  actions: [{ id: 'talk', verb: 'Talk', dialogue }, ...specials],
});

export const has = (k: string) => (s: StateView) => !!s.flags[k];
export const not = (k: string) => (s: StateView) => !s.flags[k];

/* ───────── Part 2 helpers ───────── */

const PART2_LIVE = ['zikomo', 'dhol', 'chaos', 'finale'];
export const live = (s: StateView) => PART2_LIVE.some((m) => s.missionStatus(m) === 'active');
export const part2 = (s: StateView) => ['rich', 'jai', ...PART2_LIVE, 'after'].some((m) => s.missionStatus(m) === 'active');

/** Anyone can search (slowly); Goti searches fast and is the only one who finds hidden things. */
export const searchSpot = (
  id: string,
  label: string,
  x: number,
  z: number,
  spec: Omit<TaskSpec, 'kind'>,
  showIf?: (s: StateView) => boolean,
): Interactable => {
  const task: TaskSpec = { kind: 'search', label: `Searching: ${label}`, ...spec };
  return {
    id,
    label,
    x,
    z,
    y: 2,
    radius: 1.7,
    showIf,
    actions: [
      { id: 'search', verb: 'Search', task },
      { id: 'gsearch', verb: 'Search properly', who: 'goti', task },
    ],
  };
};

export const hideSpot = (id: string, label: string, x: number, z: number): Interactable => ({
  id,
  label,
  x,
  z,
  y: 1.8,
  radius: 1.4,
  hide: true,
  showIf: live,
  actions: [{ id: 'hide', verb: 'Hide here' }],
});

export const watchSpot = (id: string, label: string, x: number, z: number): Interactable => ({
  id,
  label,
  x,
  z,
  y: 2.2,
  radius: 1.6,
  watch: true,
  showIf: live,
  actions: [
    { id: 'look', verb: 'Look around', say: 'Good view from here. Maru could keep watch.' },
    { id: 'watch', verb: 'Keep watch here', who: 'maru', task: { kind: 'watch', label: 'Keeping watch' } },
  ],
});

/** Sam patches things up with someone who has stopped believing the gang. */
export const smooth = (npc: string): Action => ({
  id: 'smooth',
  verb: 'Smooth things over',
  who: 'sam',
  showIf: (s) => s.suspicion(npc) >= 30 && !s.m(`smooth.${npc}`),
  say: 'A misunderstanding! Entirely my fault. Let me explain, calmly, from the beginning.',
  effects: [{ suspicion: npc, delta: -30 }, { event: `smooth:${npc}` }],
});

/** Pakya parks himself next to someone and keeps them talking. They will ask questions. */
export const stall = (npc: string): Action => ({
  id: 'stall',
  verb: `Keep ${NPCS[npc]?.name ?? npc} talking`,
  who: 'pakya',
  showIf: live,
  task: { kind: 'stall', target: npc, label: `Keeping ${NPCS[npc]?.name ?? npc} busy` },
});
