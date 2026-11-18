/**
 * Filmi moments: the Bollywood punctuation. A punch gets a comic word burst and a camera
 * punch-in, a reveal gets a dramatic zoom and a dun-dun-DUN sting, a blast gets a flash.
 * Game code calls filmi(); the camera and the FilmiFX overlay react.
 */
import { runtime } from './runtime';
import { sfx } from './audio';

export type FilmiKind = 'dhishoom' | 'reveal' | 'blast';
export interface FilmiEvent {
  kind: FilmiKind;
  word: string;
  id: number;
}

const PUNCH_WORDS = ['DHISHOOM!', 'DHADAAM!', 'THAPAAK!', 'DHAPP!', 'KHATAAK!'];
const listeners = new Set<(e: FilmiEvent) => void>();
let n = 0;
let lastAt = 0;

export function onFilmi(fn: (e: FilmiEvent) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function filmi(kind: FilmiKind, word?: string) {
  const now = performance.now();
  // two punches in the same instant read as one
  if (kind === 'dhishoom' && now - lastAt < 250) return;
  lastAt = now;
  if (kind === 'dhishoom') {
    sfx('dhishoom');
    runtime.shake = Math.max(runtime.shake, 0.35);
    runtime.zoomPunch = 0.12;
  } else if (kind === 'reveal') {
    sfx('sting');
    runtime.zoomPunch = 0.3;
  } else {
    sfx('boom');
    runtime.shake = 1.4;
    runtime.zoomPunch = 0.4;
  }
  const e: FilmiEvent = {
    kind,
    word: word ?? (kind === 'dhishoom' ? PUNCH_WORDS[Math.floor(Math.random() * PUNCH_WORDS.length)] : kind === 'blast' ? 'DHAMAKA!' : ''),
    id: ++n,
  };
  listeners.forEach((l) => l(e));
}
