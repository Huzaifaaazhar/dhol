import type { CharId, SceneId } from '../types';
import { filmi } from '../filmi';
/**
 * The world clock. Everything that should keep happening while you switch friends lives here:
 * NPC patrols, friend tasks, gossip, suspicion fading, lookout alarms and mission directors.
 * It runs from one useFrame in play mode and does not depend on what is rendered.
 */
import { CHAR_IDS } from '../types';
import { FRIENDS } from '../data/characters';
import { NPCS } from '../data/npcs';
import { useGame, bark, emote, toast, onMissionStart, activeMission, activateMission } from '../store';
import { ent, runtime } from '../runtime';
import { decay, gossip, GOSSIP_NET, ZIKOMO_NET } from '../lies';
import { sfx } from '../audio';
import { agents, spotted, tickAgents, agentTravel, doorOf, spawnAgent, despawnAgent, type Agent } from './agents';
import { POSTMAN_TOUR } from './ambient';
import { simClock, simSpeed } from './clock';
import { drainTaskEvents, taskOf, tickTasks, cancelTask } from './tasks';
import { onGameEvent } from './bus';
import { noise } from './noise';
import { DIRECTORS } from '../missions';
import { applyEffects } from '../effects';

const get = useGame.getState;
const set = useGame.setState;

let secondAcc = 0;
let gossipAcc = 0;
const alerted = new Map<string, number>();
const chased = new Map<string, number>();
/** sim time until which a friend who was just caught and let go is ignored by goons */
const grace = new Map<string, number>();
/** caught friends are safe until their conversation with the boss ends, then a few seconds more */
const pendingGrace = new Map<CharId, number>();
export function grantGrace(who: CharId, seconds = 8) {
  grace.set(who, simClock.t + seconds);
}
const spottedToast = new Map<string, number>();

export function worldNow() {
  return simClock.t;
}

export function resetSim() {
  simClock.t = get().worldTime;
  secondAcc = 0;
  gossipAcc = 0;
  alerted.clear();
  chased.clear();
  grace.clear();
  pendingGrace.clear();
  spottedToast.clear();
}

function director() {
  const m = activeMission();
  return m ? DIRECTORS[m.id] : undefined;
}

let installed = false;
export function installSim() {
  if (installed) return;
  installed = true;
  onMissionStart((id) => {
    resetSim();
    if (id.startsWith('resume:')) {
      const d = DIRECTORS[id.slice(7)];
      (d?.resume ?? d?.start)?.();
    } else DIRECTORS[id]?.start();
  });
  onGameEvent((name, data) => {
    if (name.startsWith('smooth:')) {
      // Sam can only smooth things over with each person once per mission
      set((st) => ({ mstate: { ...st.mstate, [`smooth.${name.slice(7)}`]: true } }));
      bark(name.slice(7), 'Hmm. Theek hai. Maan leta hoon. Ek baar.', 2.2);
    }
    // filmi punctuation for the story's big moments (directors still hear these events)
    if (name === 'blast') filmi('blast');
    if (name === 'reveal' || name === 'drumOpen' || name === 'kidnap') filmi('reveal');
    if (name === 'showEnding') {
      // the finale always ends here, whichever objectives were met: the ending reflects them
      const st = get();
      const missions: typeof st.missions = { ...st.missions, finale: { status: 'done', done: [...(st.missions.finale?.done ?? []), 'finale.deliver'] } };
      set({ missions, endingShown: true });
      if (missions.epilogue?.status !== 'active') activateMission('epilogue');
      return;
    }
    if (name === 'tiwariReturns') {
      set({ dhol: `carried:${get().active}` });
      toast('Asli dhol phir tumhare paas hai', 'objective');
    }
    director()?.event?.(name, data);
  });
}

/** Called every frame while playing. */
export function simTick(rawDt: number) {
  const s = get();
  if (s.mode !== 'play' || s.paused || s.failure || s.partEnded || s.transition) return;
  const dt = Math.min(rawDt, 0.1) * simSpeed.k;
  simClock.t += dt;
  const now = simClock.t;

  for (const ev of tickAgents(dt, now)) {
    if (ev.kind === 'arrive') director()?.event?.(`arrive:${ev.name}`, ev.id);
    if (ev.kind === 'door') {
      // you hear the door when someone comes in or goes out where you are
      if (s.scene === ev.from || s.scene === ev.to) sfx('door');
      if (s.scene === ev.to && ev.to !== 'street' && !ev.id.startsWith('postman')) emote(ev.id, '!', 1.2);
      director()?.event?.(`door:${ev.id}:${ev.to}`, ev.id);
    }
    if (ev.kind === 'stop' && ev.stop.say && agents.get(ev.id)?.scene === s.scene) bark(ev.id, ev.stop.say, 3);
  }
  ambient(dt);

  tickTasks(dt, now, applyEffects);
  for (const ev of drainTaskEvents()) {
    if (ev.kind === 'noise') noise(ev.task.who, ev.task.x, ev.task.z, ev.task.spec.target);
    director()?.event?.(`task:${ev.kind}`, ev);
  }

  lookout(dt, now);
  stealth(now);
  peeks(now);

  // suspicion fades and gossip spreads, once a second / every 25 seconds
  secondAcc += dt;
  if (secondAcc >= 1) {
    secondAcc -= 1;
    const st = get();
    set({ worldTime: now, lies: decay(st.lies, 1) });
  }
  gossipAcc += dt;
  if (gossipAcc >= 25) {
    gossipAcc = 0;
    const st = get();
    const net = agents.has('zikomo') ? [...GOSSIP_NET, ...ZIKOMO_NET] : GOSSIP_NET;
    const r = gossip(st.lies, net, Math.random, now);
    if (r.state !== st.lies) set({ lies: r.state });
    for (const c of r.found) {
      emote(c.npc, '💢', 2.2);
      toast(`${NPCS[c.npc]?.name ?? c.npc} ne ${NPCS[c.via!]?.name ?? c.via} se suna ki “${c.heard}”. Unhe toh kuch aur bataaya gaya tha.`, 'lie', 'Afwaah');
    }
  }

  director()?.tick?.(dt, now);
}

/* ───────── Maru on watch: early warnings, revealed sightlines, and panic ───────── */
function lookout(dt: number, now: number) {
  const s = get();
  const watch = taskOf('maru');
  const watching = watch?.kind === 'watch';
  runtime.reveal = watching ? s.where.maru : null;
  let threat = Infinity;
  if (watching) {
    const m = ent('maru');
    for (const a of agents.values()) {
      if (!a.hostile || a.scene !== s.where.maru) continue;
      const e = ent(a.id);
      const d = Math.hypot(e.x - m.x, e.z - m.z);
      threat = Math.min(threat, d);
      const last = alerted.get(a.id) ?? -99;
      if (d < 15 && now - last > 18) {
        alerted.set(a.id, now);
        sfx('scream');
        bark('maru', `${NPCS[a.id]?.name ?? 'Koi'} aa raha hai! ${['Chhupo! CHHUPO!', 'Sab normal dikho!', 'Mujhe dikh raha hai! Use kuch nahi dikh raha! Abhi tak!'][Math.floor(Math.random() * 3)]}`, 3);
        toast(`Maru ne ${NPCS[a.id]?.name ?? a.id} ko dekh liya`, 'alert', 'Nigraani');
      }
    }
  }
  // panic builds when danger is close to Maru; Sam nearby keeps him calm
  const m = ent('maru');
  for (const a of agents.values()) {
    if (!a.hostile || a.scene !== s.where.maru) continue;
    const e = ent(a.id);
    threat = Math.min(threat, Math.hypot(e.x - m.x, e.z - m.z));
  }
  const sam = ent('sam');
  const calm = s.where.sam === s.where.maru && Math.hypot(sam.x - m.x, sam.z - m.z) < 6;
  let panic = s.panic;
  if (threat < 6) panic += dt * (calm ? 9 : 22);
  else panic -= dt * 10;
  panic = Math.max(0, Math.min(100, panic));
  if (panic >= 100) {
    panic = 0;
    if (watching) cancelTask('maru', true);
    set((st) => ({ posted: { ...st.posted, maru: false }, hidden: { ...st.hidden, maru: undefined } }));
    sfx('scream');
    runtime.shake = 0.5;
    bark('maru', 'AAAAAAAAAAH! MUJHSE NAHI HOGA!', 3);
    toast('Maru ghabra ke bhaag gaya', 'fail', 'Usne apni jagah chhod di');
    director()?.event?.('maruPanic');
  }
  if (Math.abs(panic - s.panic) > 0.5) set({ panic });
}

/* ───────── Zikomo’s men: spotting, chasing, catching ───────── */
function stealth(now: number) {
  const s = get();
  if (!s.dialogue && !s.transition) {
    for (const [c, at] of pendingGrace) {
      if (now - at < 3) continue;
      grantGrace(c);
      pendingGrace.delete(c);
    }
  }
  // nobody gets grabbed mid-sentence: whoever is in a conversation (and anyone tagging along) is left alone
  const talking = (c: CharId) =>
    pendingGrace.has(c) || (grace.get(c) ?? -1) > now || (!!s.dialogue && s.where[c] === s.scene && (c === s.active || !s.posted[c]));
  for (const { agent, who } of spotted()) {
    if (talking(who)) continue;
    const key = `${agent.id}:${who}`;
    const last = chased.get(key) ?? -99;
    if (agent.mode !== 'chase' && now - last > 4) {
      chased.set(key, now);
      agent.mode = 'chase';
      agent.chase = who;
      agent.until = now + 6;
      sfx('honk');
      emote(agent.id, '!', 1.6);
      bark(agent.id, ['OYE! Tu! Ruk!', 'Ek mila! Boss!', 'Oye, gadha number ' + (CHAR_IDS.indexOf(who) + 1) + '!'][Math.floor(Math.random() * 3)], 2.2);
      const lastToast = spottedToast.get(who) ?? -99;
      const following = who !== s.active && !s.posted[who] && s.where[who] === s.scene;
      if (now - lastToast > 6 && !following) {
        spottedToast.set(who, now);
        if (s.active === who) toast('Tumhe dekh liya gaya. Bhaago, ya chhupo!', 'alert');
        else toast(`${FRIENDS[who].name} ko dekh liya gaya!`, 'alert', `Madad ke liye ${CHAR_IDS.indexOf(who) + 1} dabao`);
      }
    }
  }
  for (const a of agents.values()) {
    if (a.mode !== 'chase' || !a.chase) continue;
    const e = ent(a.id);
    const f = ent(a.chase);
    if (s.where[a.chase] !== a.scene && followThroughDoor(a, s.where[a.chase], now)) continue;
    if (s.where[a.chase] !== a.scene || get().hidden[a.chase]) {
      // lost him
      if (now > a.until - 4) {
        a.mode = a.route.length ? 'route' : 'idle';
        a.chase = null;
        bark(a.id, 'Kahaan gaya?', 1.8);
      }
      continue;
    }
    if (talking(a.chase)) continue;
    if (Math.hypot(e.x - f.x, e.z - f.z) < 0.95) {
      const who = a.chase;
      a.mode = a.route.length ? 'route' : 'idle';
      a.chase = null;
      a.until = 0;
      pendingGrace.set(who, now);
      filmi('dhishoom', 'PAKDA GAYA!');
      director()?.caught?.(who, a.id);
    }
  }
}

/** Doors you can no longer slam in a goon's face. The gang's own hideout stays secret. */
const FOLLOW_INTO: SceneId[] = ['house', 'shop', 'cinema'];

/**
 * A chaser who saw his target go through a door, and is close to it, goes in after him:
 * a few steps inside, a long look round, then back out to his patrol. Hiding, or standing
 * beside the door out of his line of sight, still works.
 */
function followThroughDoor(a: Agent, to: SceneId, now: number) {
  if (!a.hostile || a.legs.length || !a.route.length) return false;
  const inside = a.scene === 'street' ? to : a.scene;
  if (!FOLLOW_INTO.includes(inside) || (a.scene !== 'street' && to !== 'street')) return false;
  const d = doorOf(inside);
  if (!d) return false;
  const e = ent(a.id);
  const near = a.scene === 'street' ? d.outside : d.inside;
  if (Math.hypot(e.x - near.x, e.z - near.z) > 7) return false;
  const who = a.chase;
  a.chase = null;
  if (to === 'street') {
    // he ran back outside: give up and go back to the patrol
    a.mode = a.route.length ? 'route' : 'idle';
    return true;
  }
  agentTravel(a.id, to, d.inside.x, d.inside.z - 0.7, `peek:${a.id}`);
  a.until = now + 12;
  bark(a.id, ['Isme ghusa hai! Maine dekha!', 'Andar chhup raha hai? Aa raha hoon!', 'Khat khat. Main hoon. Gunda.'][Math.floor(Math.random() * 3)], 2.2);
  peeking.set(a.id, { who: who!, scene: to });
  return true;
}

/** goons currently peeking into a room, and whom they followed */
const peeking = new Map<string, { who: CharId; scene: SceneId }>();

function peeks(now: number) {
  for (const [id, p] of peeking) {
    const a = agents.get(id);
    if (!a) {
      peeking.delete(id);
      continue;
    }
    // arrived inside: stand and look around the room for a few seconds
    if (a.mode === 'idle' && a.scene === p.scene && !a.legs.length && a.until > now) {
      a.mode = 'investigate';
      const e = ent(id);
      a.target = { x: e.x, z: e.z - 0.4 };
      a.until = now + 4;
      emote(id, '?', 1.5);
    } else if (a.mode !== 'chase' && a.mode !== 'investigate' && a.mode !== 'goto') {
      // done looking (or the trip ended oddly): walk back out to the patrol
      peeking.delete(id);
      if (a.scene === p.scene) {
        if (get().scene === p.scene) bark(id, ['Koi nahi hai. Bas mozon ki boo.', 'Khaali. Boss ko pasand nahi aayega.', 'Hunh. Galat darwaaza.'][Math.floor(Math.random() * 3)], 2.2);
        a.mode = 'route';
      }
    }
  }
}

/* ───────── everyday life: the postman's rounds, outside the timed missions ───────── */
let ambientAcc = 0;
let ambientOn = true;
export function setAmbient(on: boolean) {
  ambientOn = on;
  if (!on) despawnAgent('postman');
}

function ambient(dt: number) {
  ambientAcc += dt;
  if (ambientAcc < 1) return;
  ambientAcc = 0;
  const busy = !!activeMission()?.live;
  const here = agents.has('postman');
  if ((busy || !ambientOn) && here) despawnAgent('postman');
  else if (!busy && ambientOn && !here) spawnAgent('postman', 'street', POSTMAN_TOUR[0].x, POSTMAN_TOUR[0].z, { tour: POSTMAN_TOUR, speed: 1.5, face: 0.6 });
}

export { director as currentDirector };
