/**
 * THE MISSING DRUM MYSTERY
 * A chain of discoveries in different places: Rahul's packet (hideout), the cinema (a key from Pappu,
 * or Goti through the vent), locker 47 (Zikomo's lottery book), knocking the real drum (Goti hears
 * the hollow side; Daadi's memory narrows it down), and finally the projection booth (Rahul).
 * Where the real dhol starts depends on Part 2: under Maru's charpai, or held by Tiwari-ji.
 */
import { completeObjective } from '../store';
import { type Director, get, clearAgents, spawnAgent, toast } from './common';

function setup() {
  clearAgents();
  // Jai keeps a quieter watch now, by the shrine
  spawnAgent('jai', 'street', -33.5, 7.6, { face: 0.6 });
}

export const reveal: Director = {
  start() {
    setup();
    const s = get();
    toast(
      s.flags['end.fake'] ? 'Word on the street: Zikomo opened his dhol and found a biscuit tin. He is not laughing.' : 'Word on the street: Zikomo turned the hideout upside down and found only a rubber chicken.',
      'alert',
      'Morning',
    );
    if (s.dhol === 'tiwari') window.setTimeout(() => toast('The real dhol is still beside Tiwari-ji’s chair. You will need it back.', 'info'), 4500);
  },
  resume() {
    setup();
  },
  tick() {
    const s = get();
    if (s.scene === 'cinema' && !s.missions.reveal.done.includes('reveal.cinema')) completeObjective('reveal.cinema');
  },
  event(name) {
    if (name === 'drumOpen') toast('₹4,44,444, hidden in the drum’s false wall', 'objective', 'The music is in the drum');
  },
};
