/**
 * FIND THE DHOL
 * A chain of people who each blame the next: Daadi → Shambhu (who wanders the main road with his
 * cart) → Lalaji (who won't talk to liars) → the cricket kids → Moti's muddy paw prints → a junk pile
 * behind the old cinema. Goti finds it; then someone has to carry a heavy drum across the colony
 * while Zikomo's men patrol. Caught while carrying it: failure.
 */
import type { CharId } from '../types';
import { completeObjective, failMission, setFlag, emote } from '../store';
import { startDialogue } from '../effects';
import { noise } from '../sim/noise';
import { dhol as drum } from '../audio';
import { ent } from '../runtime';
import { type Director, get, set, setM, getM, clearAgents, spawnAgent, toast, bark, agents, carrier, distracted } from './common';
import { spawnGoons } from './zikomo';
import { cancelTask } from '../sim/tasks';

export const JUNK = { x: 22.2, z: 19.4 };
export const PAWS: Array<[number, number]> = [
  [0.6, 17.6],
  [2.6, 18.2],
  [4.8, 18.6],
  [7.0, 18.2],
  [9.2, 17.4],
  [11.4, 16.8],
  [13.6, 16.6],
  [15.6, 16.0],
  [18.0, 16.2],
  [19.8, 17.0],
  [21.2, 18.0],
  [21.9, 18.8],
];

const SHAMBHU_ROUTE: Array<[number, number, number?]> = [
  [-34, 6.6, 6],
  [-8, 6.6, 4],
  [4.6, -5.4, 4],
  [30, -5.6, 6],
  [4.6, -5.4],
  [-8, 6.6],
];

let drumT = 12;

function setup() {
  clearAgents();
  spawnAgent('shambhu', 'street', -8, 6.6, { route: SHAMBHU_ROUTE, speed: 1.2 });
  if (get().flags.deal || getM('picked', false)) spawnGoons(false);
  setM('zcar', false);
}

export const dhol: Director = {
  start() {
    setup();
    if (get().dhol === 'unknown') set({ dhol: 'junk' });
    setM('caught', 0);
    setM('picked', false);
    if (get().flags.deal) toast('Waade ke mutaabik Zikomo ke aadmi nazar rakhe hain. Unki nazar se bacho.', 'alert');
  },
  resume() {
    setup();
  },
  event(name) {
    const s = get();
    if (name === 'clue') {
      const chain = ['clue.daadi', 'clue.shambhu', 'clue.lalaji', 'clue.kids'];
      const n = chain.filter((c) => s.flags[c]).length;
      const next = ['Daadi se poochho dhol kahaan gaya', 'Badi sadak pe Shambhu kabaadiwaale ko dhoondho', 'Lalaji se unki dukaan pe poochho', 'Cricket waale bachchon se poochho', 'Panje ke nishaan ka peechha karo'][n];
      toast(next, 'objective', `Suraag ${n} / 4`);
      if (n >= 4) completeObjective('dhol.trail');
    }
    if (name === 'found') {
      set({ dhol: 'lane' });
      completeObjective('dhol.find');
      toast('Rahul ka dhol! Uthaao (E). Bhaari hai.', 'objective');
    }
    if (name === 'pickup') {
      if (!getM('picked', false)) {
        setM('picked', true);
        if (!agents.has('spanner')) {
          spawnAgent('spanner', 'street', 2, 7, { route: [[2, 7, 1], [20.4, 7.2, 1], [20.4, 15, 2], [2, 7, 1], [-24, 7, 2]], speed: 2.0, vision: { range: 7, fov: 1.9 }, hostile: true });
          spawnAgent('bhaloo', 'street', -26, 7.2, { route: [[-26, 7.2, 2], [-8, 7.2, 2]], speed: 1.7, vision: { range: 6.5, fov: 1.8 }, hostile: true });
        }
        toast('Spanner isi taraf aa raha hai. Bina dikhe dhol adde tak pahunchaao.', 'alert');
      }
    }
    if (name === 'opened') startDialogue('dhol_open');
    if (name === 'task:done') {
      /* handled by search effects */
    }
  },
  tick(dt, now) {
    const s = get();
    // deliver: whoever carries it walks into the hideout
    const c = carrier();
    if (c && s.where[c] === 'hideout' && !s.missions.dhol.done.includes('dhol.bring')) {
      set({ dhol: 'hideout' });
      completeObjective('dhol.bring');
      toast('Dhol adde mein safe hai. Iski jaanch karo.', 'objective');
    }
    // Goti can’t help himself
    if (c === 'goti') {
      drumT -= dt;
      if (drumT <= 0) {
        drumT = 14 + Math.random() * 10;
        if (Math.random() < 0.45) {
          drum('both', 0, 1);
          drum('treble', 0.18, 0.8);
          bark('goti', ['DHUM-chik! Sorry. Haathon ne kiya.', 'Dhinak dhin! …Maine nahi kiya.', 'Ye bajna chahta tha!'][Math.floor(Math.random() * 3)], 2.4);
          const e = ent('goti');
          noise('goti', e.x, e.z);
        }
      }
    }
    // reading Lalaji’s ledger behind his back
    const ledger = s.tasks.find((t) => t.source.startsWith('s_ledger'));
    if (ledger && !distracted('lalaji', now)) {
      cancelTask(ledger.who, true);
      set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, lalaji: Math.min(100, (s.lies.suspicion.lalaji ?? 0) + 15) } } });
      emote('lalaji', '💢', 2);
      bark('lalaji', 'OYE! Woh mera bahi-khaata hai! Haath hatao!', 2.4);
      toast('Lalaji ne dekh liya. Pehle Maru se unka dhyaan bhatkaao (unke paas Maru ban ke F).', 'fail');
    }
  },
  caught(who: CharId) {
    if (carrier() === who) {
      set({ dhol: 'zikomo' });
      failMission('Spanner ne dhol uthaane waale dost ko pakad liya. Ab Zikomo ke paas Rahul ka dhol hai, aur Rahul ka raaz bhi.');
      return;
    }
    const n = getM<number>('caught', 0) + 1;
    setM('caught', n);
    setFlag('warned', true);
    bark('spanner', 'Dhol kahaan hai, gadhe? …Chh. Nikal. Agli baar, boss.', 2.6);
    toast(`Pakda gaya, talaashi hui. Kuch nahi mila, toh chhod diya.`, 'fail', `Pakde gaye: ${n} / 3`);
    if (n >= 3) failMission('Zikomo ke aadmiyon ne tumhe teen baar pakda. Ab woh chhodte nahi.');
  },
};
