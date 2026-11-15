import type { Action, Effect, Interactable } from './types';
import { FRIENDS } from './data/characters';
import { SECRETS } from './data/missions';
import { DIALOGUES } from './data/dialogue';
import { sfx } from './audio';
import {
  addMoney,
  bark,
  beginTransition,
  completeObjective,
  emote,
  markOnce,
  setFlag,
  switchTo,
  toast,
  useGame,
  view,
} from './store';
import { playOneShot } from './runtime';

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
      const end = () => set({ partEnded: true });
      if (get().dialogue) set((s) => ({ afterDialogue: [...s.afterDialogue, end] }));
      else end();
    }
  }
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
    // the right friend steps forward; pick the line again to commit
    switchTo(c.who);
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
  if (a.once) markOnce(`${it.id}:${a.id}`);
  if (a.who) playOneShot(s.active, 'signature', 1.2);
  if (a.say) bark(s.active, a.say);
  if (it.npc) emote(it.npc, '!', 1.2);
  if (a.dialogue) {
    set({ talkingTo: it.npc ?? null });
    startDialogue(a.dialogue);
  }
  applyEffects(a.effects);
}
