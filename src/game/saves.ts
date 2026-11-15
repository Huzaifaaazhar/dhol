/**
 * Manual save slots, on top of the automatic save (which zustand keeps in localStorage).
 * A slot stores the persisted game state plus a short description for the menu.
 */
import { useGame, persistedOf, fillDefaults, continueGame, activeMission, type Persisted } from './store';
import { SCENES } from './data/scenes';

export const SLOT_COUNT = 3;
const key = (n: number) => `dhol-slot-${n}`;

export interface SlotMeta {
  mission: string;
  scene: string;
  part: number;
  savedAt: number;
}

export function readSlot(n: number): { meta: SlotMeta; data: Persisted } | null {
  try {
    const raw = localStorage.getItem(key(n));
    return raw ? (JSON.parse(raw) as { meta: SlotMeta; data: Persisted }) : null;
  } catch {
    return null;
  }
}

export function listSlots() {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({ n: i + 1, slot: readSlot(i + 1) }));
}

export function saveToSlot(n: number) {
  const s = useGame.getState();
  const m = activeMission();
  const meta: SlotMeta = { mission: m?.title ?? 'Free roam', scene: SCENES[s.scene].name, part: m?.part ?? 3, savedAt: Date.now() };
  try {
    localStorage.setItem(key(n), JSON.stringify({ meta, data: persistedOf(s) }));
    return true;
  } catch {
    return false;
  }
}

export function loadSlot(n: number) {
  const slot = readSlot(n);
  if (!slot) return false;
  const data = fillDefaults(slot.data);
  useGame.setState({ ...data, hasSave: true, introSeen: true, paused: false, endingShown: false, failure: null, partEnded: false });
  continueGame();
  return true;
}

export function deleteSlot(n: number) {
  try {
    localStorage.removeItem(key(n));
  } catch {
    /* storage unavailable */
  }
}

export function timeAgo(t: number) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}
