/**
 * Friend tasks: a friend left searching, keeping watch, keeping an NPC busy or waiting.
 * Tasks advance on the world clock, so they finish (or go wrong) while you play someone else.
 */
import type { CharId, Effect, SceneId, TaskSpec } from '../types';
import { FRIENDS } from '../data/characters';
import { NPCS } from '../data/npcs';
import { QUESTIONS, ASKER } from '../data/questions';
import { useGame, bark, emote, nextId, toast, type Task } from '../store';
import { ent, playOneShot } from '../runtime';
import { sfx } from '../audio';
import { tell } from '../lies';

const get = useGame.getState;
const set = useGame.setState;

/** Goti is the searcher: everyone else is three times slower and misses hidden things. */
export function taskRate(who: CharId, spec: TaskSpec) {
  if (spec.kind === 'search') return who === 'goti' ? 1 : 1 / 3;
  return 1;
}

export function taskOf(who: CharId) {
  return get().tasks.find((t) => t.who === who) ?? null;
}

export function startTask(who: CharId, spec: TaskSpec, source: string, at?: { scene: SceneId; x: number; z: number }) {
  const s = get();
  cancelTask(who, true);
  const e = ent(who);
  const t: Task = {
    id: nextId(),
    who,
    kind: spec.kind,
    label: spec.label ?? spec.kind,
    scene: at?.scene ?? s.where[who],
    x: at?.x ?? e.x,
    z: at?.z ?? e.z,
    elapsed: 0,
    duration: spec.duration ?? 0,
    spec,
    source,
  };
  set((st) => ({ tasks: [...st.tasks, t], posted: { ...st.posted, [who]: true } }));
  // a noisy accident is decided now and happens partway through
  if (spec.kind === 'search' && spec.noise) {
    const chance = spec.noise * (who === 'goti' ? 1.5 : 1);
    if (Math.random() < chance) noiseAt.set(t.id, 0.3 + Math.random() * 0.5);
  }
  if (spec.kind === 'stall') nextQuestion.set(t.id, 7 + Math.random() * 4);
  return t;
}

const noiseAt = new Map<number, number>();
const nextQuestion = new Map<number, number>();

export function cancelTask(who: CharId, silent = false) {
  const t = taskOf(who);
  if (!t) return;
  noiseAt.delete(t.id);
  nextQuestion.delete(t.id);
  set((st) => ({
    tasks: st.tasks.filter((x) => x.id !== t.id),
    question: st.question && t.kind === 'stall' && st.question.npc === t.spec.target ? null : st.question,
  }));
  if (!silent) bark(who, t.kind === 'watch' ? 'Achha achha, nigraani khatam.' : t.kind === 'stall' ? 'Ek minute, maaf kijiye…' : 'Theek hai, ruk gaya.', 1.8);
  emitTask({ kind: 'cancel', task: t });
}

export type TaskEvent =
  | { kind: 'done'; task: Task; found: boolean }
  | { kind: 'noise'; task: Task }
  | { kind: 'cancel'; task: Task }
  | { kind: 'answered'; npc: string; topic: string; value: string; contradiction: boolean };

let pending: TaskEvent[] = [];
function emitTask(e: TaskEvent) {
  pending.push(e);
}
export function drainTaskEvents() {
  const out = pending;
  pending = [];
  return out;
}

const FOUND_LINE: Record<CharId, string> = {
  goti: 'Mil gaya! Mujhe hamesha sab milta hai. Apni chaabi chhod ke.',
  sam: 'Kuch mila. Tareeke se.',
  pakya: 'Mil gaya. Obviously.',
  maru: 'Mil gaya aur isne kaata bhi nahi!',
};

/** Advance tasks. `applyEffects` is injected to avoid an import cycle with effects.ts. */
export function tickTasks(dt: number, now: number, applyEffects: (e: Effect[] | undefined) => void) {
  const s = get();
  if (!s.tasks.length) return;
  let changed = false;
  const tasks = s.tasks.map((t) => ({ ...t }));
  const finished: Task[] = [];
  for (const t of tasks) {
    const rate = taskRate(t.who, t.spec);
    t.elapsed += dt * rate;
    changed = true;
    const e = ent(t.who);
    if (t.kind === 'search' && Math.random() < dt * 0.8) {
      // rummaging
      e.face += (Math.random() - 0.5) * 0.8;
      if (Math.random() < 0.15) playOneShot(t.who, 'signature', 0.6);
    }
    const n = noiseAt.get(t.id);
    if (n !== undefined && t.duration && t.elapsed / t.duration > n) {
      noiseAt.delete(t.id);
      emitTask({ kind: 'noise', task: t });
    }
    if (t.kind === 'stall') {
      const q = nextQuestion.get(t.id) ?? 10;
      if (q - dt <= 0 && !s.question) {
        nextQuestion.set(t.id, 16 + Math.random() * 6);
        ask(t, now);
      } else nextQuestion.set(t.id, q - dt);
    }
    if (t.duration && t.elapsed >= t.duration) finished.push(t);
  }
  if (!changed) return;
  set({ tasks: tasks.filter((t) => !finished.includes(t)) });
  for (const t of finished) {
    nextQuestion.delete(t.id);
    noiseAt.delete(t.id);
    set((st) => ({ posted: { ...st.posted, [t.who]: st.active === t.who ? false : st.posted[t.who] } }));
    const found = t.kind !== 'search' || !t.spec.hidden || t.who === 'goti';
    if (t.kind === 'search') {
      if (found) {
        sfx('secret');
        bark(t.who, FOUND_LINE[t.who], 2.4);
        applyEffects(t.spec.onDone);
      } else {
        sfx('fail');
        bark(t.who, t.spec.empty ?? 'Yahaan kuch nahi. Shayad Goti ko kuch dikhe.', 3);
      }
      if (get().active !== t.who) toast(`${FRIENDS[t.who].name} ne dhoondh liya: ${found ? 'kuch mila!' : 'kuch nahi.'}`, found ? 'objective' : 'info');
    } else applyEffects(t.spec.onDone);
    emitTask({ kind: 'done', task: t, found });
  }
  // unanswered question: Pakya improvises
  const q = get().question;
  if (q && now > q.deadline) {
    const pick = Math.floor(Math.random() * q.options.length);
    bark('pakya', `Uh… ${q.options[pick]}! Haan. Bilkul.`, 2.6);
    answerQuestion(pick, true);
  }
}

function ask(t: Task, now: number) {
  const npc = t.spec.target!;
  const pool = QUESTIONS[npc] ?? [];
  if (!pool.length) return;
  const asked = (get().mstate[`asked.${npc}`] as string) ?? '';
  const fresh = pool.filter((q) => !asked.includes(q.topic));
  const qd = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  set((st) => ({
    question: { id: nextId(), npc, topic: qd.topic, prompt: qd.prompt, options: qd.options, deadline: now + 11 },
    mstate: { ...st.mstate, [`asked.${npc}`]: asked + '|' + qd.topic },
  }));
  emote(npc, '?', 2);
  sfx('select');
  if (get().active !== 'pakya') toast(`${ASKER[npc] ?? NPCS[npc]?.name}: Pakya ke liye sawaal!`, 'alert', 'Jawaab ke liye 2 dabao');
}

/** Pakya answers the pending question (by the player, or improvised when time runs out). */
export function answerQuestion(i: number, improvised = false) {
  const s = get();
  const q = s.question;
  if (!q) return;
  const value = q.options[i];
  const { state, result } = tell(s.lies, { topic: q.topic, value, by: 'pakya', to: q.npc, t: s.worldTime });
  set({ lies: state, question: null });
  const contradiction = result.kind === 'contradiction';
  if (contradiction) {
    sfx('fail');
    emote(q.npc, '💢', 2.4);
    const name = NPCS[q.npc]?.name ?? q.npc;
    bark(q.npc, `“${value}”? Tumne toh “${result.contradiction.believed}” bola tha!`, 3.2);
    toast(`${name} ne jhooth pakad liya`, 'lie', improvised ? 'Pakya improvised badly' : 'Jhooth ki Diary mein darj');
  } else {
    emote(q.npc, result.kind === 'consistent' ? '♪' : '…', 1.4);
    if (!improvised) bark('pakya', 'Bilkul jaisa pehle bola tha. Main jhooth kabhi nahi bhoolta. Na sach.', 2);
  }
  emitTask({ kind: 'answered', npc: q.npc, topic: q.topic, value, contradiction });
}
