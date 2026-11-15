/**
 * EVERYTHING GOES WRONG
 * Zikomo searches the hideout at sunset. In parallel, on one clock:
 *  - Sam (plan A) waits out Lalaji's coin counting to rent a wedding dhol, or
 *  - Goti (plan B) scavenges a biscuit tin, rope and a tabla skin (noisy) and builds a fake.
 *  - Someone carries the real dhol home, past Tiwari-ji, who is about to inspect the room.
 *  - Pakya keeps Tiwari-ji talking: his answers must match every lie told before.
 *  - Maru watches the lane for Spanner, who peeks into the hideout; if Maru panics he runs past
 *    Tiwari-ji, which wrecks any "Maru is sick in bed" story Pakya told.
 * Outcome at sunset: Zikomo takes the real dhol (failure), a fake (best), or nothing (he comes back angrier).
 */
import type { CharId } from '../types';
import { CHAR_IDS } from '../types';
import { completeObjective, failMission, setFlag, emote, addStat } from '../store';
import { startDialogue } from '../effects';
import { moveActive } from '../party';
import { ent } from '../runtime';
import { agentGoto, agents, investigate } from '../sim/agents';
import { cancelTask, startTask, taskOf } from '../sim/tasks';
import { noise } from '../sim/noise';
import { tell } from '../lies';
import { sfx } from '../audio';
import { type Director, get, set, setM, getM, clearAgents, spawnAgent, toast, bark, placeFriend, carrier, GOON_VISION } from './common';

export const TIWARI_CHAIR = { x: -10.6, z: -7.1 };
const HOUSE_DOOR = { x: -14, z: -6.6 };
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
      toast(`Sunset in ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}${h >= 60 ? ' (a united gang buys extra time)' : h < 35 ? ' (all the bickering cost you time)' : ''}`, 'alert', 'The clock is running');
    }
    if (name === 'lalajiWait') {
      startTask('sam', { kind: 'wait', duration: 20, label: 'Waiting for Lalaji to count', onDone: [{ flag: 'chaos.waited' }, { toast: 'Lalaji has finished counting. Talk to him again.' }] }, 'lalaji_wait');
    }
    if (name === 'lalajiRefused') toast('Lalaji refused. Goti will have to build a fake: tin, rope and a tabla skin.', 'fail');
    if (name === 'task:cancel') {
      const t = (data as { task: { source: string } }).task;
      if (t.source === 'lalaji_wait' && !get().flags['chaos.waited']) {
        setFlag('chaos.lalajiWait', false);
        bark('lalaji', 'You left! I lost count! Start again!', 2.4);
      }
      if (t.source.startsWith('npc:tiwari')) {
        const a = agents.get('tiwari');
        if (a?.mode === 'stalled') a.mode = 'idle';
      }
    }
    if (name === 'built') {
      setM('fake', 'hideout');
      completeObjective('chaos.fake');
      toast('A fake dhol now sits in the hideout. In bad light, it is perfect.', 'objective');
    }
    if (name === 'placeFake') {
      set({ items: get().items.filter((i) => i !== 'fakedhol') });
      setM('fake', 'hideout');
      completeObjective('chaos.fake');
    }
    if (name === 'hideReal') {
      set({ dhol: 'house' });
      completeObjective('chaos.hide');
      toast('The real dhol is under Maru’s charpai. Maru will never sleep again.', 'objective');
    }
    if (name === 'arrive:tiwariDoor') {
      if (s.dhol === 'house') {
        set({ dhol: 'tiwari' });
        bark('tiwari', 'What is this under the charpai? A DRUM? Confiscated! Rent first!', 3.2);
        toast('Tiwari-ji found the real dhol in your room and took it', 'fail', 'Complication');
      } else bark('tiwari', 'Hmm. Clean. Suspiciously clean.', 2.4);
      tiwariBack = now + 12;
      inspectAt = now + 75;
    }
    if (name === 'arrive:tiwariChair') {
      const a = agents.get('tiwari');
      if (a) a.anim = 'read';
    }
    if (name === 'maruPanic') {
      // Maru bolts for home, straight past Tiwari-ji
      const m = ent('maru');
      noise('maru', m.x, m.z);
      if (get().where.maru === 'street') {
        const t = ent('tiwari');
        m.x = t.x + 1.5;
        m.z = t.z + 1.2;
        const st = get();
        const sick = st.lies.beliefs.tiwari?.['maru.health']?.value === 'Sick in bed' || (st.lies.beliefs.tiwari?.['room.state']?.value ?? '').includes('Maru is sick');
        if (sick) {
          const { state } = tell(st.lies, { topic: 'maru.health', value: 'running around screaming', by: 'maru', to: 'tiwari', t: now });
          set({ lies: state });
          tiwariSus(20);
          emote('tiwari', '💢', 2.4);
          bark('tiwari', 'SICK IN BED? He just ran past me screaming like a pressure cooker!', 3.2);
          toast('Maru’s panic just blew Pakya’s “sick in bed” story', 'lie', 'Contradiction');
          window.setTimeout(() => bark('pakya', 'MARU! You had ONE job. Being sick!', 2.6), 900);
          addStat('gang.harmony', -8);
        } else bark('tiwari', 'Why is everybody running today?', 2.2);
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

    // Pakya's story collapses if Tiwari-ji gets too suspicious
    if (stalling && (s.lies.suspicion.tiwari ?? 0) >= 90) {
      cancelTask('pakya', true);
      bark('tiwari', 'Enough stories! I am inspecting that room. NOW.', 2.8);
      inspectAt = now;
    }

    // Tiwari-ji's room inspection
    if (end && t && !stalling && t.mode === 'idle' && inspectAt && now >= inspectAt) {
      inspectAt = 0;
      bark('tiwari', 'Inspection time! Nobody has paid rent, so everybody gets inspected!', 2.6);
      agentGoto('tiwari', HOUSE_DOOR.x, HOUSE_DOOR.z, 'tiwariDoor');
      t.anim = 'idle';
    }
    if (tiwariBack && now > tiwariBack && t && t.mode === 'idle') {
      tiwariBack = 0;
      agentGoto('tiwari', TIWARI_CHAIR.x, TIWARI_CHAIR.z, 'tiwariChair');
    }

    // Tiwari-ji spots a drum being carried past him
    const c = carrier();
    if (c && t && s.where[c] === 'street' && t.scene === 'street') {
      const e = ent(c);
      const te = ent('tiwari');
      const d = Math.hypot(e.x - te.x, e.z - te.z);
      if (d < (stalling ? 1.4 : 4.5)) {
        set({ dhol: 'tiwari' });
        sfx('fail');
        emote('tiwari', '!', 2);
        bark('tiwari', 'What is that? A DRUM? In MY building? Rent first, drum later!', 3);
        toast('Tiwari-ji confiscated the real dhol! Sam or Pakya might get it back.', 'fail', 'Complication');
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
          bark('spanner', 'Oho! A drum in the garage! BOSS! Come early!', 3);
          toast('Spanner saw the real dhol through the shutter. Zikomo is coming 40 seconds early!', 'fail', 'Complication');
        } else bark('spanner', 'Hmm. Garage. Boring garage.', 2);
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
      failMission('Spanner caught whoever was carrying the real dhol. Zikomo didn’t even have to wait for sunset.');
      return;
    }
    bark('spanner', 'Sunset, idiot. The boss is coming at sunset. Don’t make me run before then.', 2.6);
    investigate('spanner', ent(who).x, ent(who).z, 3, get().worldTime);
  },
};


function sunset() {
  const s = get();
  const c = carrier();
  const realExposed = s.dhol === 'hideout' || (c !== null && s.where[c] !== 'house');
  if (realExposed) {
    set({ dhol: 'zikomo' });
    failMission('Sunset. Zikomo walked into the hideout and walked out with Rahul’s real dhol under his arm.');
    return;
  }
  setFlag('end.fake', getM<string>('fake', '') === 'hideout');
  setFlag('end.tiwari', s.dhol === 'tiwari');
  // Zikomo arrives at the lane; bring the active friend to meet him
  spawnAgent('zikomo', 'street', -19.6, 15.8, { face: 0 });
  moveActive('street', -19.8, 14.2, Math.PI);
  toast('Sunset', 'mission', 'Zikomo is here');
  window.setTimeout(() => {
    set({ talkingTo: 'zikomo' });
    startDialogue('chaos_end');
  }, 1300);
}
