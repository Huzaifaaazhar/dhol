/**
 * The gang as four independent people. A friend either follows whoever you control,
 * or stays where he is (left on purpose with Q, busy with a task, hiding, or simply far away).
 * Switching to a friend in another scene takes you there; nothing pauses while you do.
 */
import type { CharId, SceneId } from './types';
import { CHAR_IDS } from './types';
import { FRIENDS } from './data/characters';
import { useGame, bark, beginTransition, switchTo, toast, activeMission } from './store';
import { ent, runtime } from './runtime';
import { taskOf, cancelTask } from './sim/tasks';
import { sfx } from './audio';

const get = useGame.getState;
const set = useGame.setState;

export function savePositions() {
  const s = get();
  const friendPos = { ...s.friendPos };
  for (const c of CHAR_IDS) {
    if (s.where[c] !== s.scene && c !== s.active) continue;
    const e = ent(c);
    friendPos[c] = { x: e.x, z: e.z, face: e.face };
  }
  set({ friendPos });
}

/** Switch control to another friend, wherever he is. */
export function switchFriend(c: CharId) {
  const s = get();
  if (c === s.active || s.transition) return;
  savePositions();
  const old = s.active;
  const sameScene = s.where[c] === s.scene;
  const a = ent(old);
  const b = ent(c);
  const far = !sameScene || Math.hypot(a.x - b.x, a.z - b.z) > 10;
  const posted = { ...s.posted };
  // in split-up missions everyone stays where you left them; otherwise the gang sticks together
  const splitUp = !!activeMission()?.live;
  posted[old] = posted[old] || splitUp || far || !!taskOf(old) || !!s.hidden[old];
  posted[c] = false;
  if (!sameScene) {
    // everyone who was tagging along with the old leader stays put with him
    for (const f of CHAR_IDS) if (f !== c && s.where[f] === s.scene) posted[f] = true;
  }
  set({ posted });
  switchTo(c);
  if (!sameScene) {
    const p = s.friendPos[c];
    beginTransition(s.where[c], '', p);
  }
}

/** Place a friend somewhere (missions use this to split the gang up). */
export function placeFriend(c: CharId, scene: SceneId, x: number, z: number, face = 0, posted = true) {
  const s = get();
  const e = ent(c);
  e.x = x;
  e.z = z;
  e.face = face;
  e.speed = 0;
  set({
    where: { ...s.where, [c]: scene },
    posted: { ...s.posted, [c]: posted },
    friendPos: { ...s.friendPos, [c]: { x, z, face } },
    hidden: { ...s.hidden, [c]: undefined },
  });
}

/** Bring the camera (and control) to a friend, moving scenes if needed. */
export function focusFriend(c: CharId) {
  const s = get();
  if (s.active !== c) switchFriend(c);
  else if (s.where[c] !== s.scene) beginTransition(s.where[c], '', s.friendPos[c]);
}

/** Move the active friend somewhere, across scenes if needed. */
export function moveActive(scene: SceneId, x: number, z: number, face = 0) {
  const s = get();
  placeFriend(s.active, scene, x, z, face, false);
  // if the scene (re)mounts after this, the leader must appear here, not at an old spawn
  set({ entry: { x, z, face } });
  if (s.scene === scene) {
    runtime.cam.x = x;
    runtime.cam.z = z;
  } else beginTransition(scene, '', { x, z, face });
}

/** Q: tell the nearest friend to wait here, or to come along again. */
export function toggleWait() {
  const s = get();
  const me = ent(s.active);
  let best: CharId | null = null;
  let bd = 5;
  for (const c of CHAR_IDS) {
    if (c === s.active || s.where[c] !== s.scene) continue;
    const e = ent(c);
    const d = Math.hypot(e.x - me.x, e.z - me.z);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  if (!best) {
    toast('Hukum dene ke liye koi paas nahi', 'info');
    return;
  }
  const waiting = s.posted[best];
  if (waiting && taskOf(best)) cancelTask(best);
  set({ posted: { ...s.posted, [best]: !waiting }, hidden: { ...s.hidden, [best]: waiting ? undefined : s.hidden[best] } });
  sfx('select');
  bark(best, waiting ? ['Aa raha hoon!', 'Mera intezaar karo!', 'Aakhir.', 'Achha achha.'][CHAR_IDS.indexOf(best)] : ['Main yahin rukta hoon. Strategy ke saath.', 'Main yahin hoon, achha dikhte hue.', 'Main is jagah ki raksha karunga. Kisse?', 'Akela? Yahaan? …Theek hai.'][CHAR_IDS.indexOf(best)], 2.2);
}

/** Sam’s rally: every friend in this scene who isn’t busy falls in behind him. */
export function rally() {
  const s = get();
  const posted = { ...s.posted };
  let n = 0;
  for (const c of CHAR_IDS) {
    if (c === s.active || s.where[c] !== s.scene || !posted[c] || taskOf(c)) continue;
    posted[c] = false;
    n++;
  }
  set({ posted });
  return n;
}

/** Hide behind something. Moving gives you away again. */
export function hideAt(spot: string, x: number, z: number) {
  const s = get();
  const e = ent(s.active);
  e.x = x;
  e.z = z;
  e.speed = 0;
  set({ hidden: { ...s.hidden, [s.active]: spot } });
  sfx('whoosh');
  bark(s.active, ['Gaayab. Plan ki tarah.', 'Pakya ko koi nahi dekhta, jab tak Pakya na chaahe.', 'Ab main thela hoon.', 'Saans mat le, Maru. Saans mat le.'][CHAR_IDS.indexOf(s.active)], 2);
}

export function friendName(c: CharId) {
  return FRIENDS[c].name;
}
