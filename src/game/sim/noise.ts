/** Accidents make noise: owners get annoyed and Zikomo's men come to look. */
import type { CharId } from '../types';
import { FRIENDS } from '../data/characters';
import { useGame, bark, emote, toast } from '../store';
import { ent, runtime } from '../runtime';
import { sfx } from '../audio';
import { agents, investigate } from './agents';
import { emitGameEvent } from './bus';
import { simClock } from './clock';

const get = useGame.getState;
const set = useGame.setState;

/* ───────── Goti's accidents ───────── */
export function noise(by: CharId, x: number, z: number, owner?: string) {
  const s = get();
  sfx('thud');
  runtime.shake = Math.max(runtime.shake, 0.25);
  bark(by, by === 'goti' ? ['Oops.', 'Woh main nahi tha. Gravity thi.', 'Kisi ne suna toh nahi, na?'][Math.floor(Math.random() * 3)] : 'Arre nahi.', 2.2);
  if (owner) {
    set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, [owner]: Math.min(100, (s.lies.suspicion[owner] ?? 0) + 10) } } });
    emote(owner, '💢', 2);
  }
  const scene = s.where[by];
  for (const a of agents.values()) {
    if (!a.hostile || a.scene !== scene) continue;
    const e = ent(a.id);
    if (Math.hypot(e.x - x, e.z - z) < 18) {
      investigate(a.id, x, z, 7, simClock.t);
      emote(a.id, '?', 1.6);
    }
  }
  if (get().active !== by) toast(`${FRIENDS[by].name} ne shor machaaya`, 'alert', 'Aas-paas sabne suna');
  emitGameEvent('noise', { by, x, z });
}

