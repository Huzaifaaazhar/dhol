/**
 * The world clock. Everything that should keep happening while you switch friends lives here:
 * NPC patrols, friend tasks, gossip, suspicion fading, lookout alarms and mission directors.
 * It runs from one useFrame in play mode and does not depend on what is rendered.
 */
import { CHAR_IDS } from '../types';
import { FRIENDS } from '../data/characters';
import { NPCS } from '../data/npcs';
import { useGame, bark, emote, toast, onMissionStart, activeMission } from '../store';
import { ent, runtime } from '../runtime';
import { decay, gossip, GOSSIP_NET, ZIKOMO_NET } from '../lies';
import { sfx } from '../audio';
import { agents, spotted, tickAgents } from './agents';
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
      bark(name.slice(7), 'Hmm. Fine. I will believe you. Once.', 2.2);
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
  }

  tickTasks(dt, now, applyEffects);
  for (const ev of drainTaskEvents()) {
    if (ev.kind === 'noise') noise(ev.task.who, ev.task.x, ev.task.z, ev.task.spec.target);
    director()?.event?.(`task:${ev.kind}`, ev);
  }

  lookout(dt, now);
  stealth(now);

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
      toast(`${NPCS[c.npc]?.name ?? c.npc} heard from ${NPCS[c.via!]?.name ?? c.via} that it was “${c.heard}”. That is not what they were told.`, 'lie', 'Gossip');
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
        bark('maru', `${NPCS[a.id]?.name ?? 'Someone'} is coming! ${['Hide! HIDE!', 'Everybody act normal!', 'I see him! He sees nothing! Yet!'][Math.floor(Math.random() * 3)]}`, 3);
        toast(`Maru spotted ${NPCS[a.id]?.name ?? a.id}`, 'alert', 'Lookout');
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
    bark('maru', 'AAAAAAAAAAH! I CAN’T DO THIS!', 3);
    toast('Maru panicked and ran', 'fail', 'He abandoned his post');
    director()?.event?.('maruPanic');
  }
  if (Math.abs(panic - s.panic) > 0.5) set({ panic });
}

/* ───────── Zikomo’s men: spotting, chasing, catching ───────── */
function stealth(now: number) {
  const s = get();
  for (const { agent, who } of spotted()) {
    const key = `${agent.id}:${who}`;
    const last = chased.get(key) ?? -99;
    if (agent.mode !== 'chase' && now - last > 4) {
      chased.set(key, now);
      agent.mode = 'chase';
      agent.chase = who;
      agent.until = now + 6;
      sfx('honk');
      emote(agent.id, '!', 1.6);
      bark(agent.id, ['OYE! You! Stop!', 'Found one! Boss!', 'Hey, idiot number ' + (CHAR_IDS.indexOf(who) + 1) + '!'][Math.floor(Math.random() * 3)], 2.2);
      const lastToast = spottedToast.get(who) ?? -99;
      const following = who !== s.active && !s.posted[who] && s.where[who] === s.scene;
      if (now - lastToast > 6 && !following) {
        spottedToast.set(who, now);
        if (s.active === who) toast('You have been spotted. Run, or hide!', 'alert');
        else toast(`${FRIENDS[who].name} has been spotted!`, 'alert', `Press ${CHAR_IDS.indexOf(who) + 1} to help him`);
      }
    }
  }
  for (const a of agents.values()) {
    if (a.mode !== 'chase' || !a.chase) continue;
    const e = ent(a.id);
    const f = ent(a.chase);
    if (s.where[a.chase] !== a.scene || get().hidden[a.chase]) {
      // lost him
      if (now > a.until - 4) {
        a.mode = a.route.length ? 'route' : 'idle';
        a.chase = null;
        bark(a.id, 'Where did he go?', 1.8);
      }
      continue;
    }
    if (Math.hypot(e.x - f.x, e.z - f.z) < 0.95) {
      const who = a.chase;
      a.mode = a.route.length ? 'route' : 'idle';
      a.chase = null;
      a.until = 0;
      director()?.caught?.(who, a.id);
    }
  }
}

export { director as currentDirector };
