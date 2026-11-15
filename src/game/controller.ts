import { onInput } from './input';
import { useGame, cycleChar, switchTo, bark, emote, toast } from './store';
import { SCENES } from './data/scenes';
import { FRIENDS } from './data/characters';
import { CHAR_IDS } from './types';
import { actionsFor, runAction } from './effects';
import { ent, playOneShot, runtime } from './runtime';
import { resolveNpcs } from './world';
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
      toast(m ? 'Sound off' : 'Sound on', 'info');
      return;
    }
    if (s.mode !== 'play' || s.transition || s.partEnded) return;
    if (s.dialogue) {
      if (a === 'cycle') {
        cycleChar(1);
        sfx('switch');
      }
      return;
    }
    if (a === 'pause') {
      set({ paused: !s.paused });
      sfx('select');
      return;
    }
    if (s.paused) return;

    switch (a) {
      case 'cycle':
        cycleChar(1);
        sfx('switch');
        break;
      case 'char1':
      case 'char2':
      case 'char3':
      case 'char4': {
        const id = CHAR_IDS[Number(a.slice(-1)) - 1];
        if (id !== s.active) {
          switchTo(id);
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

function interact(special: boolean) {
  const s = get();
  const scene = SCENES[s.scene];
  const it = s.focus ? scene.interactables.find((i) => i.id === s.focus) : null;
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
}

/** The free ability with nothing nearby: each friend does their thing, and the street reacts. */
function signature() {
  const s = get();
  const id = s.active;
  const e = ent(id);
  if (e.oneShot > 0) return;
  const def = FRIENDS[id];
  playOneShot(id, 'signature', id === 'goti' ? 1.0 : 1.3);
  bark(id, def.signature[Math.floor(Math.random() * def.signature.length)]);
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
    toast('Everyone is staring at Maru. Useful, sometimes.', 'info');
  }
}

function reaction(by: string, at: string) {
  const lines: Record<string, string[]> = {
    sam: ['Please. People are watching.', 'That was not in the plan.'],
    pakya: ['Ignore him, he’s with me. I mean, not with me.', 'Smooth. Very smooth. Not.'],
    goti: ['Do it again!', 'I want to try!'],
    maru: ['Why would you do that?!', 'My heart, yaar.'],
  };
  const l = lines[by] ?? ['…'];
  void at;
  return l[Math.floor(Math.random() * l.length)];
}
