import type { Action, Effect, Interactable, StateView } from '../../types';

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
