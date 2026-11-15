import type { Action, CharId, Effect, Interactable } from './types';
import { NPCS } from './data/npcs';
import { checkLine, recordStory, tell, TOPICS } from './lies';
import { emitGameEvent } from './sim/bus';
import { startTask } from './sim/tasks';
import { FRIENDS } from './data/characters';
import { SECRETS } from './data/missions';
import { DIALOGUES } from './data/dialogue';
import { sfx } from './audio';
import {
  addMoney,
  addStat,
  bark,
  beginTransition,
  completeObjective,
  emote,
  failMission,
  giveItem,
  markOnce,
  setFlag,
  setStat,
  switchTo,
  takeItem,
  toast,
  useGame,
  view,
} from './store';
import { ent, playOneShot } from './runtime';

const get = useGame.getState;
const set = useGame.setState;

export function applyEffects(effects: Effect[] | undefined) {
  if (!effects) return;
  for (const e of effects) {
    if ('flag' in e) setFlag(e.flag, e.value ?? true);
    else if ('money' in e) {
      addMoney(e.money);
      if (e.money > 0) {
        sfx('coin');
        toast(`+ ₹${e.money}`, 'money');
      }
    } else if ('complete' in e) completeObjective(e.complete);
    else if ('secret' in e) {
      if (!get().secrets.includes(e.secret)) {
        set((s) => ({ secrets: [...s.secrets, e.secret] }));
        sfx('secret');
        const n = get().secrets.length;
        toast(SECRETS[e.secret] ?? 'Secret found', 'secret', `Secret ${n} of ${Object.keys(SECRETS).length}`);
      }
    } else if ('goto' in e) {
      const go = () => beginTransition(e.goto, e.spawn);
      if (get().dialogue) set((s) => ({ afterDialogue: [...s.afterDialogue, go] }));
      else go();
    } else if ('emote' in e) emote(e.emote, e.kind);
    else if ('bark' in e) bark(e.bark === 'me' ? get().active : e.bark, e.text);
    else if ('toast' in e) toast(e.toast, 'info');
    else if ('dialogue' in e) set((s) => ({ dialogueQueue: [...s.dialogueQueue, e.dialogue] }));
    else if ('sfx' in e) sfx(e.sfx);
    else if ('endPart' in e) {
      const which = e.endPart === true ? 'part1' : (e.endPart as 'part1' | 'part2');
      later(() => set({ partEnded: which }));
    } else if ('claim' in e) {
      const s = get();
      claim(e.by ?? s.active, e.to ?? s.talkingTo ?? '', e.claim, e.value, e.truth);
    } else if ('stat' in e) {
      addStat(e.stat, e.delta);
      if (e.stat === 'ritu.trust') toast(`${e.delta > 0 ? '+' : ''}${e.delta} Ritu’s trust`, e.delta > 0 ? 'objective' : 'fail');
      if (e.stat === 'gang.harmony' && e.delta < 0) toast('The gang is getting on each other’s nerves', 'fail');
    } else if ('setStat' in e) setStat(e.setStat, e.value);
    else if ('give' in e) {
      giveItem(e.give);
      toast(ITEM_NAMES[e.give] ?? e.give, 'objective', 'Got');
      sfx('coin');
    } else if ('take' in e) takeItem(e.take);
    else if ('suspicion' in e) {
      const s = get();
      const cur = s.lies.suspicion[e.suspicion] ?? 0;
      set({ lies: { ...s.lies, suspicion: { ...s.lies.suspicion, [e.suspicion]: Math.max(0, Math.min(100, cur + e.delta)) } } });
      if (e.delta > 0) emote(e.suspicion, '💢', 1.4);
    } else if ('story' in e) {
      const s = get();
      set({ lies: recordStory(s.lies, e.story, e.teller, e.value) });
      emitGameEvent('story', { subject: e.story, teller: e.teller });
    } else if ('fail' in e) later(() => failMission(e.fail));
    else if ('event' in e) emitGameEvent(e.event);
    else if ('dholTo' in e) {
      const to = e.dholTo === 'carry' ? `carried:${get().active}` : e.dholTo;
      set({ dhol: to });
      if (e.dholTo === 'carry') {
        sfx('thud');
        bark(get().active, ['Heavy. Like responsibility.', 'Nobody look at me. I am carrying nothing.', 'It’s heavier than it looks! Like me!', 'If I drop it, I’m moving to another city.'][['sam', 'pakya', 'goti', 'maru'].indexOf(get().active)], 2.4);
      }
      emitGameEvent('dhol', to);
    }
  }
}

function later(fn: () => void) {
  if (get().dialogue) set((s) => ({ afterDialogue: [...s.afterDialogue, fn] }));
  else fn();
}

export const ITEM_NAMES: Record<string, string> = {
  jalebi: 'A paper cone of hot jalebi',
  marigolds: 'A marigold garland (slightly used)',
  photo: 'Photo: Jai and Rahul, holding a dhol',
  lockerkey: 'A rusty key: “Shree Talkies, 47”',
  halfnote: 'Half of a ₹500 note',
  cinemakey: 'The old cinema’s key (from Pappu)',
  ticket: 'Lottery ticket #4444',
  register: 'Zikomo’s lottery book',
  crackers: 'A packet of crackers',
  tin: 'An empty biscuit tin',
  rope: 'A length of laundry rope',
  skin: 'An old tabla skin',
  fakedhol: 'A fake dhol (very fake)',
  packet: 'A sealed packet, sewn inside the dhol',
};

const BLAME: Record<CharId, string[]> = {
  sam: ['I had a PLAN. The plan did not include you talking.', 'Pakya. We discussed this. Consistency.'],
  pakya: ['Who told him THAT? I had a perfectly good story going!', 'Never improvise. Leave the lying to the professional.'],
  goti: ['Ohhh. Were we lying? Nobody tells me anything.', 'Which story is it? Write it on my hand.'],
  maru: ['We’re finished. We are completely finished.', 'Why does nobody check with each other?!'],
};

/** A friend tells an NPC something. Contradictions are remembered, and somebody gets blamed. */
export function claim(by: CharId, to: string, topic: string, value: string, truth = false) {
  if (!to) return;
  const s = get();
  const { state, result } = tell(s.lies, { topic, value, by, to, t: s.worldTime, truth });
  set({ lies: state, flags: { ...s.flags, 'tell.contra': result.kind === 'contradiction' } });
  const name = NPCS[to]?.name ?? to;
  if (result.kind === 'contradiction') {
    const c = result.contradiction;
    sfx('fail');
    emote(to, '💢', 2.4);
    toast(`${name} remembers “${c.believed}”, not “${c.heard}”`, 'lie', 'Contradiction');
    if (c.earlierBy !== by) {
      window.setTimeout(() => bark(c.earlierBy, BLAME[c.earlierBy][Math.floor(Math.random() * 2)], 3), 400);
      addStat('gang.harmony', -6);
    }
  } else if (result.kind === 'confessed') {
    emote(to, '♥', 1.6);
    toast(`${name} now knows the truth: not “${result.replaced}”, just “${value}”`, 'objective', 'Came clean');
  } else if (result.kind === 'consistent' && result.corroboratedBy) {
    emote(to, '♪', 1.4);
  }
  emitGameEvent('claim', { by, to, topic, value, contradiction: result.kind === 'contradiction' });
}

/** Pakya keeps track of every story: he alone sees whether a line fits what was said before. */
export function lineCheck(topic: string, value: string, to: string) {
  const s = get();
  return checkLine(s.lies, topic, value, to);
}

export function topicLabel(topic: string) {
  return TOPICS[topic] ?? topic;
}

/* ---------------- dialogue runner ---------------- */

export function startDialogue(id: string) {
  const script = DIALOGUES[id];
  if (!script) {
    console.warn('missing dialogue', id);
    return;
  }
  const start = typeof script.start === 'function' ? script.start(view()) : script.start;
  set({ dialogue: { script: id, node: start }, focus: null });
  applyEffects(script.nodes[start]?.effects);
}

function goNode(next: string | undefined) {
  const d = get().dialogue;
  if (!d) return;
  if (!next) return endDialogue();
  const script = DIALOGUES[d.script];
  if (!script.nodes[next]) {
    console.warn('missing node', d.script, next);
    return endDialogue();
  }
  set({ dialogue: { script: d.script, node: next } });
  applyEffects(script.nodes[next].effects);
}

export function currentNode() {
  const d = get().dialogue;
  if (!d) return null;
  return DIALOGUES[d.script]?.nodes[d.node] ?? null;
}

export function visibleChoices() {
  const n = currentNode();
  if (!n?.choices) return [];
  const v = view();
  return n.choices.filter((c) => !c.showIf || c.showIf(v));
}

export function advanceDialogue() {
  const n = currentNode();
  if (!n) return;
  if (n.choices && visibleChoices().length) return;
  goNode(n.branch ? n.branch(view()) : n.next);
}

export function chooseDialogue(i: number) {
  const choices = visibleChoices();
  const c = choices[i];
  if (!c) return;
  const active = get().active;
  if (c.who && c.who !== active) {
    const st = get();
    if (st.where[c.who] !== st.scene) {
      // split up: the friend you need is somewhere else
      sfx('fail');
      toast(`${FRIENDS[c.who].name} isn’t here`, 'fail', 'You split the gang up');
      return;
    }
    // the right friend steps forward; pick the line again to commit
    switchTo(c.who);
    st.posted[active] = false;
    sfx('switch');
    bark(c.who, ['Leave this to me.', 'Step aside. Professional at work.', 'My turn.', 'Okay okay, I’ll do it.'][idx(c.who) - 1], 2);
    return;
  }
  sfx('select');
  applyEffects(c.effects);
  goNode(c.next);
}

const idx = (c: string) => ['sam', 'pakya', 'goti', 'maru'].indexOf(c) + 1;

export function endDialogue() {
  const after = get().afterDialogue;
  set({ dialogue: null, afterDialogue: [], talkingTo: null });
  after.forEach((f) => f());
  const q = get().dialogueQueue;
  if (q.length) {
    const [nextId, ...rest] = q;
    set({ dialogueQueue: rest });
    window.setTimeout(() => startDialogue(nextId), 120);
  }
}

/* ---------------- interaction runner ---------------- */

export function actionsFor(it: Interactable) {
  const v = view();
  const used = get().usedOnce;
  return it.actions.filter((a) => (!a.showIf || a.showIf(v)) && !(a.once && used.includes(`${it.id}:${a.id}`)));
}

export function runAction(it: Interactable, a: Action) {
  const s = get();
  if (a.who && a.who !== s.active) {
    sfx('fail');
    bark(s.active, `That is a ${FRIENDS[a.who].name} job. (Press ${idx(a.who)})`);
    return;
  }
  if (!s.hints.interacted) set({ hints: { ...s.hints, interacted: true } });
  if (a.task && a.task.kind === 'stall' && a.task.target) {
    // Pakya parks himself beside whoever he is stalling
    const t = ent(a.task.target);
    const me = ent(s.active);
    const d = Math.hypot(me.x - t.x, me.z - t.z);
    if (d > 2.8) {
      bark(s.active, 'I need to be standing next to him for this.', 2);
      return;
    }
  }
  if (a.once) markOnce(`${it.id}:${a.id}`);
  if (a.who) playOneShot(s.active, 'signature', 1.2);
  if (a.say) bark(s.active, a.say);
  if (it.npc) emote(it.npc, '!', 1.2);
  if (a.task) {
    startTask(s.active, a.task, `${it.id}:${a.id}`);
  }
  if (a.dialogue) {
    set({ talkingTo: it.npc ?? null, crowd: crowdAround(it.npc ? null : { x: it.x, z: it.z }) });
    startDialogue(a.dialogue);
  }
  applyEffects(a.effects);
}

/** Friends (following, nearby) who might butt into a conversation. */
export function crowdAround(at: { x: number; z: number } | null): CharId[] {
  const s = get();
  const me = ent(s.active);
  const p = at ?? { x: me.x, z: me.z };
  return (['sam', 'pakya', 'goti', 'maru'] as CharId[]).filter((c) => {
    if (c === s.active || s.posted[c] || s.where[c] !== s.scene) return false;
    const e = ent(c);
    return Math.hypot(e.x - p.x, e.z - p.z) < 6;
  });
}
