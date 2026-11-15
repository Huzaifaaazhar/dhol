/**
 * WHO EXACTLY IS JAI?
 * Jai keeps watch on the bungalow and slips off to make phone calls on a fixed rhythm.
 * Three ways to prove who he is: Goti searches his bag while he is away, someone follows him
 * and overhears his call without being seen, or Sam talks Pappu into opening his register.
 * Every time Jai notices you, he gets more suspicious; at the top he leaves town (failure).
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
  '…yes, I’m still here. The old lady doesn’t know anything.',
  '…the dhol. Rahul’s dhol. If Zikomo gets it first, it’s over.',
  '…four idiots keep following the girl around. Harmless. I think.',
  '…no, Rahul, stay hidden. I’ll find it.',
];

let seenCd = 0;
let overhear = 0;
let lineT = 0;
let lineI = 0;

function spawn() {
  clearAgents();
  const a = spawnAgent('jai', 'street', JAI_POST.x, JAI_POST.z, { route: ROUTE, speed: 1.6, vision: { range: 4.8, fov: 1.7 }, face: Math.PI });
  a.wait = 10;
  seenCd = 0;
  overhear = 0;
}

function suspicion(delta: number) {
  const s = get();
  const v = Math.min(100, (s.lies.suspicion.jai ?? 0) + delta);
  set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, jai: v } } });
  return v;
}

export const jai: Director = {
  start() {
    spawn();
    toast('Jai is the man in the cap by the bungalow wall', 'info');
  },
  resume() {
    spawn();
  },
  event(name, data) {
    const s = get();
    if (name === 'story') {
      const n = storyVersions(s.lies, 'jai');
      if (n >= 2 && !s.missions.jai.done.includes('jai.stories')) {
        toast(`Jai has told ${n} different stories. Nobody tells that many stories by accident.`, 'lie', 'Jai’s story doesn’t add up');
        completeObjective('jai.stories');
      } else if (n < 2) toast(`${n} version of Jai’s story so far`, 'info');
    }
    if (name === 'proof') completeObjective('jai.proof');
    if (name === 'task:noise') {
      const t = (data as { task: { source: string } }).task;
      if (t.source.startsWith('jai_bag')) suspicion(15);
    }
  },
  tick(dt, now) {
    const s = get();
    const a = agents.get('jai');
    if (!a) return;
    const j = ent('jai');
    const calling = a.ri === 4 && a.wait > 0 && Math.hypot(j.x - CALL_SPOT.x, j.z - CALL_SPOT.z) < 1;

    // Jai notices people who stare at him or follow him
    seenCd -= dt;
    for (const c of CHAR_IDS) {
      if (s.dialogue) break;
      if (s.where[c] !== 'street' || s.hidden[c] || distracted('jai', now)) continue;
      if (sees(a, c as CharId) && seenCd <= 0) {
        seenCd = 3.5;
        const v = suspicion(9);
        emote('jai', '?', 1.6);
        bark('jai', v > 60 ? 'You again. I’m warning you.' : ['Are you following me?', 'Can I help you?', 'Hm.'][Math.floor(Math.random() * 3)], 2.2);
        if (calling) overhear = 0;
      }
    }

    // searching his bag while he can see it
    const bagTask = s.tasks.find((t) => t.source.startsWith('jai_bag'));
    if (bagTask && Math.hypot(j.x - JAI_BAG.x, j.z - JAI_BAG.z) < 7 && !distracted('jai', now)) {
      cancelTask(bagTask.who, true);
      suspicion(30);
      sfx('fail');
      emote('jai', '💢', 2);
      bark('jai', 'Hey! That’s MY bag!', 2.4);
      toast('Jai caught you going through his bag', 'fail', 'Wait until he walks off, or have Maru distract him');
    }

    // overhearing the call
    if (calling) {
      lineT -= dt;
      if (lineT <= 0) {
        lineT = 4;
        bark('jai', CALL_LINES[lineI++ % CALL_LINES.length], 3.6);
      }
      const close = CHAR_IDS.some((c) => s.where[c] === 'street' && Math.hypot(ent(c).x - j.x, ent(c).z - j.z) < 5 && !sees(a, c as CharId));
      if (close && !s.missions.jai.done.includes('jai.proof')) {
        overhear += dt;
        if (overhear > 4) {
          overhear = 0;
          set({ flags: { ...s.flags, overheard: true } });
          toast('You overheard Jai: Rahul is hiding, and Jai is looking for his dhol', 'objective', 'Proof');
          completeObjective('jai.proof');
        }
      }
    } else overhear = 0;

    if ((get().lies.suspicion.jai ?? 0) >= 100) failMission('Jai noticed you one time too many. He packed his bag and left the colony. Your only lead is gone.');
  },
};
