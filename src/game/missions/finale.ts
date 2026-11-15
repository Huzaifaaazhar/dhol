/**
 * FOUR FRIENDS, ONE DISASTER
 * Tonight the money goes back to the colony at Bablu's chai stall, in front of Zikomo. Four jobs, one clock:
 *   Goti finds the dhol (Tiwari-ji sold it to Shambhu, who wanders the main road with his cart),
 *   Pakya keeps Zikomo talking (his questions test every lie the gang ever told him),
 *   Sam brings witnesses (anyone who was lied to refuses until Sam comes clean or smooths it over),
 *   Maru keeps Zikomo's men away from the drum.
 * Earlier decisions shape it: gang harmony sets the time, Ritu's trust brings Ritu and Daadi,
 * a confronted Jai draws off one goon, fooling Zikomo in Part 2 makes him angrier, and the
 * winning ticket is either in Goti's trunk or in Zikomo's car.
 */
import type { CharId } from '../types';
import { CHAR_IDS } from '../types';
import { completeObjective, setFlag, emote, setStat, toast as rawToast } from '../store';
import { startDialogue } from '../effects';
import { moveActive } from '../party';
import { ent } from '../runtime';
import { agentGoto, agents, investigate } from '../sim/agents';
import { cancelTask, taskOf } from '../sim/tasks';
import { evaluateEnding, troubleFrom } from '../endings';
import { sfx } from '../audio';
import { type Director, get, set, setM, getM, clearAgents, spawnAgent, toast, bark, placeFriend, setHome, sendHome, carrier, GOON_VISION } from './common';
import { ZIKOMO_CAR } from './zikomo';

export const STALL = { x: 11.6, z: 12.8 };
const ZIK_PLAZA = { x: 14.6, z: 9.4 };
const WITNESS_SPOTS: Record<string, [number, number]> = {
  tiwari: [9.6, 15.4],
  lalaji: [10.8, 16.0],
  bablu: [12, 9.3],
  pappu: [12.6, 15.8],
  ritu: [14.0, 15.2],
  daadi: [15.2, 15.8],
};
const SHAMBHU_ROUTE: Array<[number, number, number?]> = [
  [-30, 6.6, 5],
  [-8, 6.6, 3],
  [4.6, -5.4, 4],
  [26, -5.6, 5],
  [4.6, -5.4],
  [-8, 6.6],
];

let stallTime = 0;
let watchTime = 0;

function trouble(c: CharId, n = 1) {
  setM(`trouble.${c}`, getM<number>(`trouble.${c}`, 0) + n);
}
function chaos(n = 1) {
  setM('chaos', getM<number>('chaos', 0) + n);
}

function spawnWorld() {
  clearAgents();
  const s = get();
  spawnAgent('shambhu', 'street', -8, 6.6, { route: SHAMBHU_ROUTE, speed: 1.15 });
  spawnAgent('zikomo', 'street', ZIKOMO_CAR.x - 1.4, ZIKOMO_CAR.z + 0.6, { face: -2.2 });
  spawnAgent('rahul', 'street', STALL.x - 1.2, STALL.z + 1.4, { face: 2.6 });
  spawnAgent('spanner', 'street', 24, -5.5, { route: [[-26, -5.5, 1.5], [26, -5.5, 1.5]], speed: 2.0, vision: GOON_VISION, hostile: true });
  if (!s.flags['jai.helps']) spawnAgent('bhaloo', 'street', -30, 6.9, { route: [[-31, 6.9, 1.5], [4.5, 6.9, 1.5]], speed: 1.8, vision: GOON_VISION, hostile: true });
  // witnesses who already agreed walk over again (after a reload)
  for (const w of Object.keys(WITNESS_SPOTS)) if (s.flags[`witness.${w}`]) spawnWitness(w, true);
}

function spawnWitness(id: string, instant = false) {
  const [x, z] = WITNESS_SPOTS[id];
  if (id === 'bablu') return; // already there
  const from: Record<string, [number, number]> = { tiwari: [-10.6, -7.1], lalaji: [13.5, -6.6], pappu: [25, -6.9], ritu: [-28, -7.0], daadi: [-27, -7.2] };
  const [sx, sz] = instant ? [x, z] : from[id];
  spawnAgent(id, 'street', sx, sz, { speed: 2.2, face: 0 });
  if (!instant) agentGoto(id, x, z, `witnessArrived:${id}`);
}

function witnessCount() {
  const f = get().flags;
  return Object.keys(WITNESS_SPOTS).filter((w) => f[`witness.${w}`] && w !== 'daadi').length;
}

export const finale: Director = {
  start() {
    const s = get();
    stallTime = 0;
    watchTime = 0;
    // previous decisions set the stage
    const harmony = s.stats['gang.harmony'] ?? 60;
    const jaiHelps = !!s.flags['jai.met'] && (s.lies.suspicion.jai ?? 0) < 60;
    setFlag('jai.helps', jaiHelps);
    const rituComes = (s.stats['ritu.trust'] ?? 0) >= 45;
    const zSus = (s.lies.suspicion.zikomo ?? 0) + (s.flags['end.fake'] ? 25 : 0) + (s.flags.deal ? 15 : 0);
    set({
      dhol: 'cart',
      lies: { ...s.lies, suspicion: { ...s.lies.suspicion, zikomo: Math.min(95, zSus) } },
      flags: { ...get().flags, 'witness.ritu': rituComes, 'witness.daadi': rituComes },
    });
    const T = 270 + (harmony >= 60 ? 30 : 0) - (harmony < 35 ? 30 : 0);
    setM('timerEnd', get().worldTime + T);
    setM('chaos', 0);
    setM('finaleContra', 0);
    setM('climax', false);
    for (const c of CHAR_IDS) setM(`trouble.${c}`, 0);
    setM('zcar', true);
    spawnWorld();
    const starts: Record<CharId, [number, number]> = { sam: [-19.4, 9.6], pakya: [-18.4, 9.2], goti: [-20.6, 9.3], maru: [-19.8, 10.6] };
    for (const c of CHAR_IDS) {
      placeFriend(c, 'street', starts[c][0], starts[c][1], 0, c !== 'sam');
      setHome(c, 'street', starts[c][0], starts[c][1]);
    }
    set({ active: 'sam' });
    moveActive('street', starts.sam[0], starts.sam[1], 0);
    window.setTimeout(() => agentGoto('zikomo', ZIK_PLAZA.x, ZIK_PLAZA.z, 'zikPlaza'), 6000);
    toast(`Nightfall in ${Math.floor(T / 60)}:${String(T % 60).padStart(2, '0')}${harmony >= 60 ? ' (the gang works well together: extra time)' : harmony < 35 ? ' (the gang is bickering: less time)' : ''}`, 'alert', 'Four jobs, one clock');
    if (jaiHelps) window.setTimeout(() => toast('Jai is leading Bhaloo on a chase round the temple. One goon fewer.', 'info', 'Because you trusted Jai'), 3000);
    if (rituComes) window.setTimeout(() => toast('Ritu is bringing Daadi to the chai stall. Two witnesses, for free.', 'info', 'Because Ritu trusts you'), 6000);
    if (s.flags['end.fake']) window.setTimeout(() => toast('Zikomo has not forgiven the biscuit tin. He starts out suspicious.', 'info'), 9000);
  },
  tick(dt, now) {
    const s = get();
    if (s.missions.finale?.status !== 'active' || getM('climax', false)) return;
    const z = agents.get('zikomo');
    const stalling = taskOf('pakya')?.kind === 'stall' && taskOf('pakya')?.spec.target === 'zikomo';
    if (z) z.mode = stalling ? 'stalled' : z.mode === 'stalled' ? 'idle' : z.mode;

    // Pakya holds Zikomo's attention; without him Zikomo grows impatient
    if (stalling) {
      stallTime += dt;
      if (stallTime >= 40) completeObjective('finale.stall');
    } else if (z && Math.hypot(ent('zikomo').x - ZIK_PLAZA.x, ent('zikomo').z - ZIK_PLAZA.z) < 2) {
      const v = Math.min(100, (s.lies.suspicion.zikomo ?? 0) + dt * 0.9);
      set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, zikomo: v } } });
    }
    if ((get().lies.suspicion.zikomo ?? 0) >= 100 && !getM('raging', false)) {
      setM('raging', true);
      setM('timerEnd', getM<number>('timerEnd', 0) - 30);
      if (stalling) cancelTask('pakya', true);
      sfx('alarm');
      emote('zikomo', '💢', 3);
      bark('zikomo', 'ENOUGH talking! Find that drum! NOW!', 3);
      toast('Zikomo has lost his patience. His men are hunting, and night comes sooner.', 'fail', 'Complication');
      for (const id of ['spanner', 'bhaloo']) {
        const a = agents.get(id);
        if (a) a.speed *= 1.25;
      }
    }

    // Goti rummaging in Shambhu's cart: Shambhu stops to watch (and haggle)
    const sham = agents.get('shambhu');
    const cartSearch = s.tasks.find((t) => t.source.includes('cart'));
    if (sham) sham.mode = cartSearch ? 'stalled' : sham.mode === 'stalled' ? 'route' : sham.mode;

    // stealing the chicken back from Zikomo's car while he isn't looking
    const carSearch = s.tasks.find((t) => t.source.startsWith('zcar'));
    if (carSearch && !stalling && Math.hypot(ent('zikomo').x - ZIKOMO_CAR.x, ent('zikomo').z - ZIKOMO_CAR.z) < 9) {
      cancelTask(carSearch.who, true);
      trouble(carSearch.who);
      set({ lies: { ...get().lies, suspicion: { ...get().lies.suspicion, zikomo: Math.min(100, (get().lies.suspicion.zikomo ?? 0) + 20) } } });
      bark('zikomo', 'OYE! Away from my car!', 2.4);
      toast('Zikomo saw that. Keep him talking (Pakya) before you try his car.', 'fail');
    }

    // Maru on watch
    if (taskOf('maru')?.kind === 'watch') {
      watchTime += dt;
      if (watchTime >= 25) completeObjective('finale.watch');
    }

    if (witnessCount() >= 2) completeObjective('finale.witness');
    if (carrier()) completeObjective('finale.drum');

    // the drum reaches the chai stall
    const c = carrier();
    if (c && s.where[c] === 'street') {
      const e = ent(c);
      if (Math.hypot(e.x - STALL.x, e.z - STALL.z) < 3) climax(true, false);
    }
    // a tick of the clock in the last thirty seconds
    const left = getM<number>('timerEnd', 0) - now;
    if (left < 30 && Math.floor(left) !== Math.floor(left + dt)) sfx('tick');
    if (left <= 0) climax(false, false);
  },
  caught(who: CharId) {
    if (carrier() === who) {
      set({ dhol: 'zikomo' });
      climax(false, true);
      return;
    }
    trouble(who);
    chaos();
    bark('spanner', 'Not you. The DRUM. Get lost.', 2.2);
    toast(`${who[0].toUpperCase() + who.slice(1)} was caught and thrown out of the way`, 'fail', 'Trouble');
    sendHome(who);
  },
  event(name, data) {
    const s = get();
    if (name.startsWith('witness:')) {
      const id = name.slice(8);
      spawnWitness(id);
      rawToast(`${id[0].toUpperCase() + id.slice(1)} is heading to the chai stall`, 'objective', `${witnessCount()} witnesses`);
    }
    if (name === 'cartSearched' || name === 'task:done') {
      const t = (data as { task?: { who: CharId; source: string } } | undefined)?.task;
      if (name === 'task:done' && t?.source.includes('cart') && s.dhol === 'cart') {
        set({ dhol: `carried:${t.who}` });
        bark(t.who, 'Found it under a pile of old newspapers! Heavy. Rich-person heavy.', 2.6);
        bark('shambhu', 'Oye! That is my drum! …Fine, it’s your drum. It was always your drum.', 3);
        completeObjective('finale.drum');
      }
    }
    if (name === 'gotDrum') completeObjective('finale.drum');
    if (name === 'noise') {
      const by = (data as { by: CharId }).by;
      trouble(by);
      chaos();
    }
    if (name === 'maruPanic') {
      trouble('maru', 2);
      chaos();
      const m = ent('maru');
      for (const id of ['spanner', 'bhaloo']) if (agents.get(id)) investigate(id, m.x, m.z, 6, s.worldTime);
    }
    if (name === 'claim' && (data as { contradiction: boolean }).contradiction) setM('finaleContra', getM<number>('finaleContra', 0) + 1);
    if (name === 'task:answered' && (data as { contradiction: boolean }).contradiction) setM('finaleContra', getM<number>('finaleContra', 0) + 1);
  },
};

function climax(delivered: boolean, caughtCarrying: boolean) {
  if (getM('climax', false)) return;
  setM('climax', true);
  const s = get();
  for (const c of CHAR_IDS) if (taskOf(c)) cancelTask(c, true);
  const finaleTrouble = Object.fromEntries(CHAR_IDS.map((c) => [c, getM<number>(`trouble.${c}`, 0)])) as Record<CharId, number>;
  // Pakya's film-star bluffs count against him if the witnesses find out
  const bluffed = ['tiwari', 'lalaji', 'bablu', 'pappu'].filter((w) => s.flags[`bluffed.${w}`] && s.flags[`witness.${w}`]).length;
  finaleTrouble.pakya += bluffed;
  const result = evaluateEnding({
    delivered,
    caughtCarrying,
    witnesses: witnessCount(),
    bluffedWitnesses: bluffed,
    finaleContradictions: getM<number>('finaleContra', 0),
    zikomoSuspicion: s.lies.suspicion.zikomo ?? 0,
    trouble: troubleFrom(s.lies, finaleTrouble),
    chaos: getM<number>('chaos', 0),
  });
  setM('ending', result.id);
  setM('endingCause', result.cause);
  setM('culprit', result.culprit ?? '');
  setStat(`ending.${result.id}`, 1);
  sfx(result.id === 'collapse' ? 'fail' : 'crowd');
  // everyone gathers at the chai stall for the big moment
  if (delivered && carrier()) set({ dhol: 'stall' });
  agentGoto('zikomo', STALL.x + 2.2, STALL.z - 1.2);
  moveActive('street', STALL.x - 0.4, STALL.z + 2.2, Math.PI);
  window.setTimeout(() => {
    set({ talkingTo: 'zikomo' });
    startDialogue('climax');
  }, 1400);
}
