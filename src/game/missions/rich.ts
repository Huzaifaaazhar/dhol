/**
 * THE RICH GIRL PLAN
 * Ritu walks a daily round of the colony on the world clock. Learn what she likes from the people
 * who know her, then each friend makes his move. Friends left following you butt in, so the player
 * has to split the gang up. Lies told earlier (cable man, film producer) get back to her via Daadi.
 */
import { CHAR_IDS } from '../types';
import { completeObjective, failMission } from '../store';
import { type Director, get, set, clearAgents, spawnAgent, toast } from './common';

const LIKES = ['jalebi', 'songs', 'dogs'];
const LIKE_TEXT: Record<string, string> = { jalebi: 'hot jalebi', songs: 'old film songs', dogs: 'Moti the dog' };

const RITU_ROUTE: Array<[number, number, number?]> = [
  [-31, -9.6, 14],
  [-28, -7.0],
  [-14, -5.4],
  [12.8, -6.0, 12],
  [7.6, -5.4],
  [6.6, 6.8],
  [9.6, 11.6, 14],
  [5.6, 6.8],
  [-5, -5.4],
  [-28, -7.0],
];

function spawn() {
  clearAgents();
  spawnAgent('ritu', 'street', -31, -9.6, { route: RITU_ROUTE, speed: 1.5 });
}

export const rich: Director = {
  start() {
    spawn();
    // Ritu and Daadi live together: whatever Daadi was told, Ritu has heard about
    const s = get();
    const daadi = s.lies.beliefs.daadi ?? {};
    const ritu = { ...(s.lies.beliefs.ritu ?? {}) };
    for (const [topic, b] of Object.entries(daadi)) if (!ritu[topic]) ritu[topic] = { ...b, via: 'daadi' };
    set({ lies: { ...s.lies, beliefs: { ...s.lies.beliefs, ritu } } });
    toast('Ritu walks around the colony during the day. Find her on the street.', 'info');
  },
  resume() {
    spawn();
  },
  event(name) {
    const s = get();
    if (name === 'like') {
      const known = LIKES.filter((l) => s.flags[`likes.${l}`]);
      const last = known[known.length - 1];
      toast(`Ritu likes ${LIKE_TEXT[last] ?? last}`, 'objective', `${Math.min(known.length, 2)} of 2 found`);
      if (known.length >= 2) completeObjective('rich.learn');
    }
    if (name === 'move') {
      const n = CHAR_IDS.filter((c) => s.flags[`move.${c}`]).length;
      if (n >= 4) {
        completeObjective('rich.moves');
        toast('Everyone has had a go. Talk to Ritu one more time.', 'info');
        // the friends argue about who won
        const ranked = [...CHAR_IDS].sort((a, b) => (s.stats[`score.${b}`] ?? 0) - (s.stats[`score.${a}`] ?? 0));
        toast(`Each of them is sure he won. ${ranked[0][0].toUpperCase() + ranked[0].slice(1)} might actually be right.`, 'info', 'Rivalry');
      } else toast(`${n} of 4 friends have made their move`, 'objective');
    }
  },
  tick() {
    const s = get();
    if ((s.stats['ritu.trust'] ?? 0) < 10) failMission('Ritu has decided the four of you are a cautionary tale. She will not talk to you any more.');
  },
};
