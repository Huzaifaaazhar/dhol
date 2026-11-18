/**
 * MAIN HOON JAI
 * Ritu is investigating her brother's death. On a fixed rhythm she slips out of the bungalow to
 * phone the police from the lane. Three ways to learn what she knows: follow her and overhear the
 * call without being seen, have Goti search her bag while she is away, or have Sam talk Pappu into
 * opening his lodge register. Every time Ritu catches you following her, she gets more suspicious;
 * at the top she calls the police, and the police is Dongre Mama (failure).
 * Then Pakya walks into the bungalow as Jai (dialogue with Dadaji, see dialogue2.ts).
 */
import { CHAR_IDS } from '../types';
import type { CharId } from '../types';
import { completeObjective, failMission, emote } from '../store';
import { ent } from '../runtime';
import { sees } from '../sim/agents';
import { cancelTask } from '../sim/tasks';
import { storyVersions } from '../lies';
import { sfx } from '../audio';
import { type Director, get, set, clearAgents, spawnAgent, agents, toast, bark, distracted } from './common';

/** Ritu's bench by the bungalow wall, and her bag on it */
export const JAI_POST = { x: -23.5, z: -5.4 };
export const JAI_BAG = { x: -22.3, z: -6.3 };
const CALL_SPOT = { x: -20, z: 12.6 };
const ROUTE: Array<[number, number, number?]> = [
  [JAI_POST.x, JAI_POST.z, 24],
  [-8, 6.6],
  [-19.6, 9.4],
  [CALL_SPOT.x, CALL_SPOT.z, 18],
  [-19.6, 9.4],
  [-8, 6.6],
];
const CALL_LINES = [
  '…haan Inspector sahab, main nahi maanti ki ye accident tha.',
  '…Bhaiya ke saath ek dhol tha. Woh bhi gaayab hai. Kyun?',
  '…Dada-Dadi ne Jai ko kabhi dekha bhi nahi. Bas chitthiyaan padhi hain.',
  '…ek naam baar baar aata hai. Zikomo. Haan. Main pata karungi.',
];

let seenCd = 0;
let overhear = 0;
let lineT = 0;
let lineI = 0;

function spawn() {
  clearAgents();
  const a = spawnAgent('ritu', 'street', JAI_POST.x, JAI_POST.z, { route: ROUTE, speed: 1.6, vision: { range: 4.8, fov: 1.7 }, face: Math.PI });
  a.wait = 10;
  seenCd = 0;
  overhear = 0;
}

/** how much Ritu feels followed (separate from how much she trusts the gang) */
function suspicion(delta: number) {
  const s = get();
  const v = Math.min(100, (s.lies.suspicion.jai ?? 0) + delta);
  set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, jai: v } } });
  return v;
}

export const jai: Director = {
  start() {
    spawn();
    toast('Ritu chupke se phone karne nikalti hai. Bina use pata chale pata karo use kya maaloom hai.', 'info');
  },
  resume() {
    spawn();
  },
  event(name, data) {
    const s = get();
    if (name === 'story') {
      const n = storyVersions(s.lies, 'jai');
      if (n >= 2 && !s.missions.jai.done.includes('jai.stories')) {
        toast(`Sabko Jai alag yaad hai: ab tak ${n} roop. Nakli Jai ke liye perfect.`, 'lie', 'Pakya notes le raha hai');
        completeObjective('jai.stories');
      } else if (n < 2) toast(`Ab tak Jai ki ${n} yaad`, 'info');
    }
    if (name === 'proof') completeObjective('jai.proof');
    if (name === 'task:noise') {
      const t = (data as { task: { source: string } }).task;
      if (t.source.startsWith('jai_bag')) suspicion(15);
    }
  },
  tick(dt, now) {
    const s = get();
    const a = agents.get('ritu');
    if (!a) return;
    const j = ent('ritu');
    const calling = a.ri === 4 && a.wait > 0 && Math.hypot(j.x - CALL_SPOT.x, j.z - CALL_SPOT.z) < 1;

    // Ritu notices people who stare at her or follow her
    seenCd -= dt;
    for (const c of CHAR_IDS) {
      if (s.dialogue) break;
      if (s.where[c] !== 'street' || s.hidden[c] || distracted('ritu', now)) continue;
      if (sees(a, c as CharId) && seenCd <= 0) {
        seenCd = 3.5;
        const v = suspicion(9);
        emote('ritu', '?', 1.6);
        bark('ritu', v > 60 ? 'Phir tum? Ab main police bulaati hoon.' : ['Tum mera peechha kar rahe ho?', 'Kuch chahiye?', 'Hmm.'][Math.floor(Math.random() * 3)], 2.2);
        if (calling) overhear = 0;
      }
    }

    // searching her bag while she can see it
    const bagTask = s.tasks.find((t) => t.source.startsWith('jai_bag'));
    if (bagTask && Math.hypot(j.x - JAI_BAG.x, j.z - JAI_BAG.z) < 7 && !distracted('ritu', now)) {
      cancelTask(bagTask.who, true);
      suspicion(30);
      sfx('fail');
      emote('ritu', '💢', 2);
      bark('ritu', 'Oye! Woh MERA bag hai!', 2.4);
      toast('Ritu ne tumhe uska jhola tatolte pakad liya', 'fail', 'Uske jaane ka intezaar karo, ya Maru se dhyaan bhatkaao');
    }

    // overhearing the call
    if (calling) {
      lineT -= dt;
      if (lineT <= 0) {
        lineT = 4;
        bark('ritu', CALL_LINES[lineI++ % CALL_LINES.length], 3.6);
      }
      const close = CHAR_IDS.some((c) => s.where[c] === 'street' && Math.hypot(ent(c).x - j.x, ent(c).z - j.z) < 5 && !sees(a, c as CharId));
      if (close && !s.missions.jai.done.includes('jai.proof')) {
        overhear += dt;
        if (overhear > 4) {
          overhear = 0;
          set({ flags: { ...s.flags, overheard: true } });
          toast('Tumne Ritu ko sun liya: use lagta hai Zikomo naam ke aadmi ne unhe maara, aur Dada-Dadi ne Jai ko kabhi dekha nahi', 'objective', 'Saboot');
          completeObjective('jai.proof');
        }
      }
    } else overhear = 0;

    if ((get().lies.suspicion.jai ?? 0) >= 100)
      failMission('Ritu ne tumhe ek baar zyaada peechha karte pakda aur police bula li. Police thi Dongre Mama. Chaaron ko kaan pakad ke ghar le gaye.');
  },
};
