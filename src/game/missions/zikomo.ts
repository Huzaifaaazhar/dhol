/**
 * ZIKOMO IS LOOKING FOR YOU
 * The gang is split across the colony: Sam at the tea plaza, Pakya under a towel at the barber,
 * Goti in Lalaji's store, Maru at home. Two of Zikomo's men patrol the sidewalks.
 * Switch between all four and get each of them into the hideout. Anyone you leave in the open
 * can be found while you are busy with someone else. Caught three times: failure.
 * Alternative: walk up to Zikomo and (as Sam) make a deal.
 */
import type { CharId } from '../types';
import { CHAR_IDS } from '../types';
import { completeObjective, failMission, setFlag, beginTransition } from '../store';
import { startDialogue } from '../effects';
import { focusFriend, moveActive } from '../party';
import { emote } from '../store';
import {
  type Director,
  get,
  set,
  setM,
  getM,
  clearAgents,
  spawnAgent,
  toast,
  bark,
  placeFriend,
  setHome,
  sendHome,
  GOON_VISION,
} from './common';

export const ZIKOMO_SPOT = { x: 14.2, z: 7.6 };
export const ZIKOMO_CAR = { x: 17.2, z: 6.2 };

export function spawnGoons(withBoss: boolean) {
  if (withBoss) spawnAgent('zikomo', 'street', ZIKOMO_SPOT.x, ZIKOMO_SPOT.z, { face: -2.4 });
  spawnAgent('bhaloo', 'street', -30, 6.9, { route: [[-31, 6.9, 1.5], [4.5, 6.9, 1.5]], speed: 1.9, vision: GOON_VISION, hostile: true });
  spawnAgent('spanner', 'street', 26, -5.5, { route: [[-27, -5.5, 1.5], [27, -5.5, 1.5]], speed: 2.1, vision: GOON_VISION, hostile: true });
}

const STARTS: Record<CharId, ['street' | 'shop' | 'house', number, number, number]> = {
  sam: ['street', 14.6, 15.2, 0.6],
  pakya: ['street', 23.6, -7.0, 0],
  goti: ['shop', 2.6, 1.4, 2.5],
  maru: ['house', 0.4, 0.2, 0.8],
};

function setup(fresh: boolean) {
  clearAgents();
  spawnGoons(true);
  setM('zcar', true);
  if (!fresh) return;
  setM('caught', 0);
  for (const c of CHAR_IDS) {
    const [scene, x, z, face] = STARTS[c];
    placeFriend(c, scene, x, z, face, true);
    setHome(c, scene, x, z);
    setM(`in.${c}`, false);
  }
  set({ active: 'sam', posted: { ...get().posted, sam: false } });
  moveActive('street', STARTS.sam[1], STARTS.sam[2], STARTS.sam[3]);
  // everyone starts out of sight: Pakya under a hot towel, Sam crouched behind a bench
  set((s) => ({ hidden: { ...s.hidden, pakya: 'barber', sam: 'hide_bench' } }));
}

export const zikomo: Director = {
  start() {
    setup(true);
    toast('Gang bikhri hui hai. 1–4 se dost badlo aur sabko adde pe pahunchaao.', 'alert', 'Zikomo aa gaya');
  },
  tick() {
    const s = get();
    if (s.missions.zikomo.status !== 'active') return;
    let n = 0;
    for (const c of CHAR_IDS) {
      if (s.where[c] !== 'hideout') continue;
      n++;
      if (!getM(`in.${c}`, false)) {
        setM(`in.${c}`, true);
        set((st) => ({ posted: { ...st.posted, [c]: c !== st.active } }));
        toast(`${c[0].toUpperCase() + c.slice(1)} adde pe pahunch gaya`, 'objective', `${CHAR_IDS.filter((f) => get().where[f] === 'hideout').length} / 4 mehfooz`);
      }
    }
    if (n === 4 && !getM('allIn', false) && !s.dialogue && s.scene === 'hideout') {
      setM('allIn', true);
      startDialogue('zik_safe');
    }
  },
  caught(who) {
    const c = getM<number>('caught', 0) + 1;
    setM('caught', c);
    if (c >= 3) {
      failMission('Zikomo ke aadmiyon ne tumhe teen baar pakda. Zikomo ab khush nahi hai, aur uske joote ab safed nahi.');
      return;
    }
    toast(`${who[0].toUpperCase() + who.slice(1)} pakda gaya aur Zikomo ke paas ghaseeta gaya`, 'fail', `Pakde gaye: ${c} / 3`);
    placeFriend(who, 'street', ZIKOMO_SPOT.x - 1.2, ZIKOMO_SPOT.z + 0.8, 1.6, false);
    setM('caughtWho', who);
    focusFriend(who);
    window.setTimeout(() => {
      setFlag('zik.caught', true);
      set({ talkingTo: 'zikomo' });
      startDialogue('zikomo');
    }, 900);
  },
  event(name) {
    if (name === 'release') {
      const who = getM<string>('caughtWho', '') as CharId;
      setFlag('zik.caught', false);
      const s = get();
      const target = who || s.active;
      bark('bhaloo', 'Jao. Aur door hi rehna.', 2);
      window.setTimeout(() => {
        sendHome(target);
        const st = get();
        if (st.active === target && st.where[target] !== st.scene) beginTransition(st.where[target], '', st.friendPos[target]);
      }, 300);
      setM('caughtWho', '');
    }
    if (name === 'deal') {
      emote('zikomo', '$', 2);
      toast('Zikomo ne dhol dhoondhne ke liye ek din diya hai. Uske aadmi nazar rakhenge.', 'alert', 'Sauda');
      setM('caughtWho', '');
      setFlag('zik.caught', false);
      // the deal ends the hunt: everyone may go home
      completeObjective('zikomo.gather');
    }
  },
};
