import { onInput } from './input';
import { useGame, bark, emote, toast, setM } from './store';
import { switchFriend, toggleWait, rally, hideAt } from './party';
import { answerQuestion } from './sim/tasks';
import { agentsIn, investigate } from './sim/agents';
import { simClock } from './sim/clock';
import type { CharId } from './types';
import { SCENES } from './data/scenes';
import { FRIENDS } from './data/characters';
import { CHAR_IDS } from './types';
import { actionsFor, runAction, startDialogue } from './effects';
import { ent, playOneShot, runtime } from './runtime';
import { currentFocus, nearbyInteractables, resolveNpcs } from './world';
import { setMuted, sfx } from './audio';

const get = useGame.getState;
const set = useGame.setState;

/** Gameplay keys (dialogue and menus handle their own keys in their components). */
export function installController() {
  return onInput((a) => {
    const s = get();
    if (a === 'mute') {
      const m = !s.muted;
      set({ muted: m });
      setMuted(m);
      toast(m ? 'Awaaz band' : 'Awaaz chalu', 'info');
      return;
    }
    if (s.mode !== 'play' || s.transition || s.partEnded || s.endingShown) return;
    if (s.failure) return;
    if (s.dialogue) {
      if (a === 'cycle') cycle();
      return;
    }
    if (a === 'book') {
      set({ lieBook: !s.lieBook, paused: false, hints: { ...s.hints, ordered: true } });
      sfx('select');
      return;
    }
    if (s.lieBook) {
      if (a === 'pause') set({ lieBook: false });
      return;
    }
    if (a === 'pause') {
      set({ paused: !s.paused });
      sfx('select');
      return;
    }
    if (s.paused) return;

    // Pakya answering a question while keeping someone busy: number keys pick the answer
    if (s.question && s.active === 'pakya' && /^char[1-3]$/.test(a)) {
      const i = Number(a.slice(-1)) - 1;
      if (i < s.question.options.length) {
        answerQuestion(i);
        return;
      }
    }

    switch (a) {
      case 'cycle':
        cycle();
        break;
      case 'order':
        toggleWait();
        if (!s.hints.ordered) set({ hints: { ...s.hints, ordered: true } });
        break;
      case 'char1':
      case 'char2':
      case 'char3':
      case 'char4': {
        const id = CHAR_IDS[Number(a.slice(-1)) - 1];
        if (id !== s.active) {
          switchFriend(id);
          sfx('switch');
        }
        break;
      }
      case 'interact':
        interact(false);
        break;
      case 'ability':
        interact(true);
        break;
    }
  });
}

function cycle() {
  const s = get();
  const i = CHAR_IDS.indexOf(s.active);
  switchFriend(CHAR_IDS[(i + 1) % CHAR_IDS.length]);
  sfx('switch');
}

function interact(special: boolean) {
  const s = get();
  const scene = SCENES[s.scene];
  // prefer whatever in reach this friend can actually do something with
  const reach = nearbyInteractables();
  const usable = reach.find((x) => {
    const acts = actionsFor(x);
    return special ? acts.some((a) => a.who === s.active) : acts.some((a) => !a.who) || !!x.hide;
  });
  const it = usable ?? currentFocus() ?? (s.focus ? scene.interactables.find((i) => i.id === s.focus) : null);
  if (it && it.id !== s.focus) set({ focus: it.id });
  if (it?.hide && !special) {
    hideAt(it.id, it.x, it.z);
    return;
  }
  // E with nothing in front of you while carrying the dhol: hand it to the nearest friend
  if (!it && !special && s.dhol === `carried:${s.active}`) {
    const me = ent(s.active);
    const near = CHAR_IDS.filter((c) => c !== s.active && s.where[c] === s.scene).find((c) => Math.hypot(ent(c).x - me.x, ent(c).z - me.z) < 2);
    if (near) {
      set({ dhol: `carried:${near}` });
      sfx('thud');
      bark(near, ['Main hi kyun?', 'Idhar do. Aaram se.', 'Ooh! Baja sakta hoon?', 'Kitna bhaari hai. Aur gundon ko kitna chahiye.'][CHAR_IDS.indexOf(near)], 2.2);
      return;
    }
  }
  if (it) {
    const acts = actionsFor(it);
    if (special) {
      const mine = acts.find((x) => x.who === s.active);
      if (mine) return runAction(it, mine);
      const other = acts.find((x) => x.who);
      if (other) return runAction(it, other); // explains who could do it
    } else {
      const main = acts.find((x) => !x.who) ?? acts.find((x) => x.who === s.active) ?? acts[0];
      if (main) return runAction(it, main);
    }
  }
  if (special) signature();
  else nothingHere();
}

let shrugAt = 0;
/** E with nothing in reach still answers: a shrug and a muttered line, never silence. */
function nothingHere() {
  const now = performance.now();
  if (now - shrugAt < 1400) return;
  shrugAt = now;
  const id = get().active;
  const lines: Record<string, string[]> = {
    sam: ['Yahaan kaam ka kuch nahi. Note kar liya.', 'Plan ka hissa nahi hai.'],
    pakya: ['Yahaan impress karne laayak kuch nahi.', 'Khaali. Mere batue ki tarah.'],
    goti: ['Maine chheda. Kuch nahi hua.', 'Hello? …Nahi.'],
    maru: ['Kuch hona chahiye tha kya? Please bolo nahi.', 'Kuch nahi. Achha hai. Kuch nahi matlab safe.'],
  };
  const l = lines[id];
  emote(id, '?', 1.2);
  bark(id, l[Math.floor(Math.random() * l.length)], 1.6);
  sfx('pop');
}

/** The free ability with nothing nearby: each friend does their thing, and the street reacts. */
function signature() {
  const s = get();
  const id = s.active;
  const e = ent(id);
  if (e.oneShot > 0) return;
  const def = FRIENDS[id];
  playOneShot(id, 'signature', id === 'goti' ? 1.0 : 1.3);
  if (id === 'sam' && rallyGang()) return;
  if (id === 'goti' && throwCracker()) return;
  // Goti can knock along a drum he is carrying
  if (id === 'goti' && s.dhol === 'carried:goti' && s.missions.reveal?.status === 'active' && !s.flags['drum.open']) {
    startDialogue('knock');
    return;
  }
  bark(id, def.signature[Math.floor(Math.random() * def.signature.length)]);
  if (id === 'maru') distractAround(e.x, e.z);
  if (id === 'maru') {
    sfx('scream');
    runtime.shake = 0.35;
  } else if (id === 'goti') sfx('whoosh');
  else sfx('select');
  // NPCs within range react
  const range = id === 'maru' ? 9 : 4;
  runtime.attention = { x: e.x, z: e.z, until: performance.now() + 2500 };
  const scene = SCENES[s.scene];
  let n = 0;
  for (const npc of resolveNpcs(scene)) {
    const o = ent(npc.id);
    if (Math.hypot(o.x - e.x, o.z - e.z) < range) {
      emote(npc.id, id === 'maru' ? '!' : id === 'pakya' ? '…' : id === 'goti' ? '?' : '…', 1.6);
      n++;
    }
  }
  // friends react to each other
  for (const c of CHAR_IDS) {
    if (c === id) continue;
    const o = ent(c);
    if (Math.hypot(o.x - e.x, o.z - e.z) < 5 && Math.random() < 0.35) {
      window.setTimeout(() => bark(c, reaction(c, id)), 900);
      break;
    }
  }
  if (id === 'maru' && n > 0 && !s.hints.maruScene) {
    set({ hints: { ...s.hints, maruScene: true } });
    toast('Sab Maru ko ghoor rahe hain. Kabhi kabhi kaam aata hai.', 'info');
  }
}

function reaction(by: string, at: string) {
  const lines: Record<string, string[]> = {
    sam: ['Please. Log dekh rahe hain.', 'Ye plan mein nahi tha.'],
    pakya: ['Isko ignore karo, ye mere saath hai. Matlab, saath nahi hai.', 'Smooth. Bahut smooth. Nahi.'],
    goti: ['Phir se karo!', 'Mujhe bhi karna hai!'],
    maru: ['Aisa kyun kiya?!', 'Mera dil, yaar.'],
  };
  const l = lines[by] ?? ['…'];
  void at;
  return l[Math.floor(Math.random() * l.length)];
}

/** Sam: everyone waiting nearby falls in behind him. */
function rallyGang() {
  const n = rally();
  if (!n) return false;
  bark('sam', 'Gang! Mere paas! Formation! …Koi bhi formation!', 2.4);
  sfx('switch');
  toast(`${n} dost Sam ke saath wapas aaye`, 'info');
  return true;
}

/** Maru: whoever is close stops what they are doing to stare at him. */
function distractAround(x: number, z: number) {
  const s = get();
  const now = simClock.t;
  let n = 0;
  for (const a of agentsIn(s.scene)) {
    const o = ent(a.id);
    if (Math.hypot(o.x - x, o.z - z) < 9) {
      investigate(a.id, x, z, 8, now, 'distracted');
      emote(a.id, '!', 1.8);
      setM(`distracted.${a.id}`, now + 8);
      n++;
    }
  }
  for (const npc of resolveNpcs(SCENES[s.scene])) {
    const o = ent(npc.id);
    if (Math.hypot(o.x - x, o.z - z) < 9) {
      setM(`distracted.${npc.id}`, now + 10);
      n++;
    }
  }
  if (n) toast('Aas-paas sab Maru ko ghoor rahe hain', 'info', 'Dhyaan bhatka');
}

/** Goti: lob a cracker. Zikomo’s men run to the bang. */
function throwCracker() {
  const s = get();
  if (!s.items.includes('crackers') || SCENES[s.scene].interior) return false;
  const e = ent('goti' as CharId);
  const x = e.x + Math.sin(e.face) * 8;
  const z = e.z + Math.cos(e.face) * 8;
  set({ items: s.items.filter((i) => i !== 'crackers') });
  sfx('thud');
  sfx('honk');
  runtime.shake = 0.4;
  bark('goti', 'Happy Diwali! Jo bhi mahina ho!', 2.4);
  let n = 0;
  for (const a of agentsIn(s.scene)) {
    if (!a.hostile) continue;
    investigate(a.id, x, z, 9, simClock.t);
    emote(a.id, '?', 2);
    n++;
  }
  toast(n ? 'DHAMM! Zikomo ke aadmi dekhne bhaage' : 'DHAMM! Koi kaam ka aadmi aas-paas nahi tha', 'info', 'Pataakha');
  return true;
}
