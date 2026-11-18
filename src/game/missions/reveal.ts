/**
 * SACH (the truth)
 * Ritu knows Pakya is not Jai and will not speak to the gang. A chain of discoveries in different
 * places: Rahul's packet (hideout), the cinema (a key from Pappu, or Goti through the vent),
 * locker 47 (Zikomo's lottery book), knocking the real drum (Goti hears the hollow side; Daadi's
 * memory narrows it down), and finally the projection booth: Rahul's last tape, naming Zikomo.
 * Where the real dhol starts depends on Part 2: under Maru's charpai, or held by Dongre Mama.
 */
import { completeObjective } from '../store';
import { type Director, get, clearAgents, toast } from './common';

function setup() {
  clearAgents();
}

export const reveal: Director = {
  start() {
    setup();
    const s = get();
    toast(
      s.flags['end.fake'] ? 'Gali ki khabar: Zikomo ne dhol khola toh biscuit ka dabba nikla. Woh has nahi raha.' : 'Gali ki khabar: Zikomo ne adda ulta kar diya aur sirf ek rubber ki murgi mili.',
      'alert',
      'Subah',
    );
    if (s.dhol === 'tiwari') window.setTimeout(() => toast('Asli dhol abhi bhi Dongre Mama ki kursi ke paas hai. Wapas laana padega.', 'info'), 4500);
  },
  resume() {
    setup();
  },
  tick() {
    const s = get();
    if (s.scene === 'cinema' && !s.missions.reveal.done.includes('reveal.cinema')) completeObjective('reveal.cinema');
  },
  event(name) {
    if (name === 'drumOpen') toast('₹4,44,444, dhol ki nakli deewaar mein chhupe', 'objective', 'Sangeet dhol mein hai');
    if (name === 'kidnap') toast('Pinky bhaagti aati hai: ek safed gaadi Ritu aur uske Dada-Dadi ko le gayi. Zikomo ko aaj raat dhol chahiye.', 'fail', 'Agwa');
  },
};
