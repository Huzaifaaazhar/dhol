import type { CharId } from '../game/types';

/** Single source of truth for the opening sequence, shared by the 3D director and the caption overlay. */
export const INTRO = {
  titleEnd: 3.8,
  friendDur: 3.1,
  order: ['sam', 'pakya', 'goti', 'maru'] as CharId[],
  get friendsEnd() {
    return this.titleEnd + this.friendDur * 4;
  },
  get brokeEnd() {
    return this.friendsEnd + 6.2;
  },
  get hoodEnd() {
    return this.brokeEnd + 7.5;
  },
};

export const BROKE_BEATS: Array<{ at: number; text: string }> = [
  { at: 0.3, text: 'Kangaal.' },
  { at: 1.5, text: 'Berozgaar.' },
  { at: 2.8, text: 'Ameer banne ke liye betaab.' },
];

export const introClock = { start: 0 };

export function introTime() {
  return introClock.start ? (performance.now() - introClock.start) / 1000 : 0;
}
