import { SICK_IN_BED, ROOM_MARU_SICK } from '../data/questions';
/**
 * EVERYTHING GOES WRONG
 * Zikomo searches the hideout at sunset. In parallel, on one clock:
 *  - Sam (plan A) waits out Lalaji's coin counting to rent a wedding dhol, or
 *  - Goti (plan B) scavenges a biscuit tin, rope and a tabla skin (noisy) and builds a fake.
 *  - Someone carries the real dhol home, past Dongre Mama, who is about to inspect the room.
 *  - Pakya keeps Dongre Mama talking: his answers must match every lie told before.
 *  - Maru watches the lane for Spanner, who peeks into the hideout; if Maru panics he runs past
 *    Dongre Mama, which wrecks any "Maru is sick in bed" story Pakya told.
 * Outcome at sunset: Zikomo takes the real dhol (failure), a fake (best), or nothing (he comes back angrier).
 */
import type { CharId } from '../types';
import { CHAR_IDS } from '../types';
import { completeObjective, failMission, setFlag, emote, addStat } from '../store';
import { startDialogue } from '../effects';
import { moveActive } from '../party';
import { ent, playOneShot } from '../runtime';
import { agentTravel, agents, investigate } from '../sim/agents';
import { cancelTask, startTask, taskOf } from '../sim/tasks';
import { noise } from '../sim/noise';
import { tell } from '../lies';
import { sfx } from '../audio';
import { type Director, get, set, setM, getM, clearAgents, spawnAgent, toast, bark, placeFriend, carrier, GOON_VISION } from './common';

export const TIWARI_CHAIR = { x: -10.6, z: -7.1 };
/** beside Maru's charpai, inside the rented room */
const ROOM_CHECK = { x: -3.5, z: -1.6 };
const SHUTTER = { x: -20, z: 17.4 };
const SPANNER_ROUTE: Array<[number, number, number?]> = [
  [4.6, 6.9, 4],
  [-12, 6.9, 1],
  [-19.4, 8.8, 2],
  [-20, 13.5, 0],
  [SHUTTER.x, SHUTTER.z, 4],
  [-19.4, 8.8, 0],
  [-12, 6.9, 0],
];

let peekCd = 0;
let inspectAt = 0;
let tiwariBack = 0;

function spawn() {
  clearAgents();
  spawnAgent('tiwari', 'street', TIWARI_CHAIR.x, TIWARI_CHAIR.z, { anim: 'read', face: 0.3 });
  spawnAgent('spanner', 'street', 4.6, 6.9, { route: SPANNER_ROUTE, speed: 1.7, vision: GOON_VISION, hostile: true });
}

function tiwariSus(delta: number) {
  const s = get();
  set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, tiwari: Math.min(100, Math.max(0, (s.lies.suspicion.tiwari ?? 0) + delta)) } } });
}

export const chaos: Director = {
  start() {
    spawn();
    for (const [i, c] of CHAR_IDS.entries()) placeFriend(c, 'hideout', -1 + i * 1.2, 2.4, Math.PI, c !== 'sam');
    set({ active: 'sam', dhol: 'hideout', items: get().items.filter((i) => !['tin', 'rope', 'skin', 'fakedhol'].includes(i)) });
    setM('fake', '');
    setM('timerEnd', 0);
    setM('sunset', false);
    moveActive('hideout', -1, 2.4, Math.PI);
    peekCd = 20;
    inspectAt = 0;
    tiwariBack = 0;
    window.setTimeout(() => startDialogue('chaos_intro'), 1200);
  },
  event(name, data) {
    const s = get();
    const now = s.worldTime;
    if (name === 'planChosen') {
      const h = s.stats['gang.harmony'] ?? 60;
      let t = 200;
      if (s.flags['chaos.planB']) t += 20;
      if (h >= 60) t += 25;
      if (h < 35) t -= 20;
      setM('timerEnd', now + t);
      setM('timerLen', t);
      inspectAt = now + 35;
      toast(`Suraj dhalne mein ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}${h >= 60 ? ' (ekjut gang ko extra waqt mila)' : h < 35 ? ' (jhagde mein waqt gaya)' : ''}`, 'alert', 'Ghadi chal rahi hai');
    }
    if (name === 'lalajiWait') {
      startTask('sam', { kind: 'wait', duration: 20, label: 'Lalaji ginti kar rahe hain', onDone: [{ flag: 'chaos.waited' }, { toast: 'Lalaji ki ginti poori. Unse phir baat karo.' }] }, 'lalaji_wait');
    }
    if (name === 'lalajiRefused') toast('Lalaji ne mana kar diya. Goti ko nakli banaana padega: dabba, rassi aur tabla ki khaal.', 'fail');
    if (name === 'task:cancel') {
      const t = (data as { task: { source: string } }).task;
      if (t.source === 'lalaji_wait' && !get().flags['chaos.waited']) {
        setFlag('chaos.lalajiWait', false);
        bark('lalaji', 'Tum chale gaye! Ginti bhool gaya! Phir se shuru!', 2.4);
      }
      if (t.source.startsWith('npc:tiwari')) {
        const a = agents.get('tiwari');
        if (a?.mode === 'stalled') a.mode = 'idle';
      }
    }
    if (name === 'built') {
      setM('fake', 'hideout');
      completeObjective('chaos.fake');
      toast('Ab adde mein nakli dhol rakha hai. Kam roshni mein, ekdum perfect.', 'objective');
    }
    if (name === 'placeFake') {
      set({ items: get().items.filter((i) => i !== 'fakedhol') });
      setM('fake', 'hideout');
      completeObjective('chaos.fake');
    }
    if (name === 'hideReal') {
      set({ dhol: 'house' });
      completeObjective('chaos.hide');
      toast('Asli dhol Maru ki charpai ke neeche hai. Maru ab kabhi nahi soyega.', 'objective');
    }
    if (name === 'arrive:tiwariDoor') {
      if (s.dhol === 'house') {
        set({ dhol: 'tiwari' });
        bark('tiwari', 'Charpai ke neeche kya hai? DHOL? Zabt! Pehle karza!', 3.2);
        playOneShot('tiwari', 'panic', 0.8);
        toast('Dongre Mama ko kamre mein asli dhol mila aur woh le gaye', 'fail', 'Gadbad');
      } else bark('tiwari', 'Hmm. Saaf. Shak paida karne jitna saaf.', 2.4);
      tiwariBack = now + 12;
      inspectAt = now + 75;
    }
    if (name === 'arrive:tiwariChair') {
      const a = agents.get('tiwari');
      if (a) a.anim = 'read';
    }
    if (name === 'maruPanic') {
      // Maru bolts for home, straight past Dongre Mama
      const m = ent('maru');
      noise('maru', m.x, m.z);
      if (get().where.maru === 'street') {
        const t = ent('tiwari');
        m.x = t.x + 1.5;
        m.z = t.z + 1.2;
        const st = get();
        const sick = st.lies.beliefs.tiwari?.['maru.health']?.value === SICK_IN_BED || st.lies.beliefs.tiwari?.['room.state']?.value === ROOM_MARU_SICK;
        if (sick) {
          const { state } = tell(st.lies, { topic: 'maru.health', value: 'cheekhte hue bhaag raha tha', by: 'maru', to: 'tiwari', t: now });
          set({ lies: state });
          tiwariSus(20);
          emote('tiwari', '💢', 2.4);
          bark('tiwari', 'BISTAR PE BEEMAR? Abhi mere saamne se pressure cooker ki tarah cheekhta hua bhaaga!', 3.2);
          toast('Maru ki ghabraahat ne Pakya ki “bistar pe beemar” waali kahaani ki pol khol di', 'lie', 'Takraav');
          window.setTimeout(() => bark('pakya', 'MARU! Tera EK kaam tha. Beemar rehna!', 2.6), 900);
          addStat('gang.harmony', -8);
        } else bark('tiwari', 'Aaj sab bhaag kyun rahe hain?', 2.2);
      }
    }
  },
  tick(dt, now) {
    const s = get();
    if (s.missions.chaos.status !== 'active') return;
    const end = getM<number>('timerEnd', 0);
    const t = agents.get('tiwari');
    const sp = agents.get('spanner');
    const stalling = taskOf('pakya')?.kind === 'stall' && taskOf('pakya')?.spec.target === 'tiwari';
    if (t) t.mode = stalling ? 'stalled' : t.mode === 'stalled' ? 'idle' : t.mode;

    // Pakya's story collapses if Dongre Mama gets too suspicious
    if (stalling && (s.lies.suspicion.tiwari ?? 0) >= 90) {
      cancelTask('pakya', true);
      bark('tiwari', 'Bas kahaaniyaan! Main kamre ki talaashi le raha hoon. ABHI.', 2.8);
      inspectAt = now;
    }

    // Dongre Mama's room inspection
    if (end && t && !stalling && t.mode === 'idle' && inspectAt && now >= inspectAt) {
      inspectAt = 0;
      bark('tiwari', 'Talaashi ka waqt! Kisi ne karza nahi chukaaya, toh sabki talaashi!', 2.6);
      // he really walks in: through the front door and over to Maru's charpai
      agentTravel('tiwari', 'house', ROOM_CHECK.x, ROOM_CHECK.z, 'tiwariDoor');
      t.anim = 'idle';
    }
    if (tiwariBack && now > tiwariBack && t && t.mode === 'idle') {
      tiwariBack = 0;
      agentTravel('tiwari', 'street', TIWARI_CHAIR.x, TIWARI_CHAIR.z, 'tiwariChair');
    }

    // Dongre Mama spots a drum being carried past him
    const c = carrier();
    if (c && t && s.where[c] === 'street' && t.scene === 'street') {
      const e = ent(c);
      const te = ent('tiwari');
      const d = Math.hypot(e.x - te.x, e.z - te.z);
      if (d < (stalling ? 1.4 : 4.5)) {
        set({ dhol: 'tiwari' });
        sfx('fail');
        emote('tiwari', '!', 2);
        bark('tiwari', 'Ye kya hai? DHOL? MERE ilaake mein? Pehle karza, phir dhol!', 3);
        toast('Dongre Mama ne asli dhol zabt kar liya! Sam ya Pakya wapas la sakte hain.', 'fail', 'Gadbad');
      }
    }

    // Spanner peeks into the hideout
    peekCd -= dt;
    if (sp && sp.mode === 'route' && peekCd <= 0) {
      const e = ent('spanner');
      if (Math.hypot(e.x - SHUTTER.x, e.z - SHUTTER.z) < 1.6) {
        peekCd = 30;
        if (s.dhol === 'hideout' && getM<string>('fake', '') !== 'hideout' && end) {
          setM('timerEnd', end - 40);
          sfx('honk');
          bark('spanner', 'Oho! Garage mein dhol! BOSS! Jaldi aao!', 3);
          toast('Spanner ne shutter se asli dhol dekh liya. Zikomo 40 second pehle aa raha hai!', 'fail', 'Gadbad');
        } else bark('spanner', 'Hmm. Garage. Bekaar garage.', 2);
      }
    }

    // keep Spanner busy longer when Maru distracts him
    if (sp && sp.mode === 'distracted') peekCd = Math.max(peekCd, 8);

    // sunset
    if (end && now >= end && !getM('sunset', false)) {
      setM('sunset', true);
      sunset();
    }
  },
  caught(who: CharId) {
    if (carrier() === who) {
      set({ dhol: 'zikomo' });
      failMission('Spanner ne asli dhol uthaane waale ko pakad liya. Zikomo ko suraj dhalne ka intezaar bhi nahi karna pada.');
      return;
    }
    bark('spanner', 'Suraj dhalne de, gadhe. Boss tab aayega. Usse pehle mujhe mat daudaa.', 2.6);
    investigate('spanner', ent(who).x, ent(who).z, 3, get().worldTime);
  },
};


function sunset() {
  const s = get();
  const c = carrier();
  const realExposed = s.dhol === 'hideout' || (c !== null && s.where[c] !== 'house');
  if (realExposed) {
    set({ dhol: 'zikomo' });
    failMission('Suraj dhal gaya. Zikomo adde mein aaya aur Rahul ka asli dhol bagal mein dabaake chala gaya.');
    return;
  }
  setFlag('end.fake', getM<string>('fake', '') === 'hideout');
  setFlag('end.tiwari', s.dhol === 'tiwari');
  // Zikomo arrives at the lane; bring the active friend to meet him
  spawnAgent('zikomo', 'street', -19.6, 15.8, { face: 0 });
  moveActive('street', -19.8, 14.2, Math.PI);
  toast('Sunset', 'mission', 'Zikomo aa gaya');
  window.setTimeout(() => {
    set({ talkingTo: 'zikomo' });
    startDialogue('chaos_end');
  }, 1300);
}
