/**
 * The film's last beat: Ritu's car drives off down the main road and the four friends run after it.
 * A short scripted scene after the ending card; the gang, the camera and the car read runtime.chase.
 */
import { runtime, ent } from './runtime';
import { CHAR_IDS } from './types';
import { useGame } from './store';
import { stopRhythm } from './audio';

export const CHASE = { dur: 9, z: 1.4, fromX: -6, toX: 46 };
const listeners = new Set<(on: boolean) => void>();

export function onChase(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function chaseCarX() {
  const c = runtime.chase;
  if (!c) return CHASE.fromX;
  const k = Math.min(1, (performance.now() - c.t0) / 1000 / CHASE.dur);
  // slow pull-away, then off she goes
  return CHASE.fromX + (CHASE.toX - CHASE.fromX) * (k * k * 0.6 + k * 0.4);
}

export function startChase() {
  if (useGame.getState().scene !== 'street') {
    stopRhythm();
    return;
  }
  runtime.chase = { t0: performance.now() };
  // cut: the four are standing right behind Ritu's car as it pulls away
  const st = useGame.getState();
  CHAR_IDS.filter((c) => st.where[c] === 'street').forEach((c, i) => {
    const e = ent(c);
    e.x = CHASE.fromX - 2.6 - i * 1.2;
    e.z = CHASE.z + (i % 2 ? 0.7 : -0.7);
    e.face = Math.PI / 2;
  });
  listeners.forEach((l) => l(true));
  window.setTimeout(() => {
    runtime.chase = null;
    stopRhythm();
    listeners.forEach((l) => l(false));
  }, CHASE.dur * 1000);
}
