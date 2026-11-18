import { filmi } from './filmi';
import { setAmbient } from './sim/sim';
/** Dev-only hooks used by the browser tests (tests/e2e). Not shipped in production builds. */
import { useGame, activateMission, completeObjective, freshProgress, retryMission } from './store';
import { MISSIONS } from './data/missions';
import { runtime, ent } from './runtime';
import { switchFriend } from './party';
import { agents } from './sim/agents';
import { simClock, simSpeed } from './sim/clock';
import { answerQuestion } from './sim/tasks';
import { startDialogue } from './effects';
import type { CharId, SceneId } from './types';
import { SCENES } from './data/scenes';

export const debugApi = {
  /** Start a fresh game positioned at the beginning of a given mission. */
  jumpTo(id: string, extraFlags: Record<string, boolean> = {}, seed: Record<string, unknown> = {}) {
    const order = MISSIONS.map((m) => m.id);
    const idx = order.indexOf(id);
    const missions = Object.fromEntries(MISSIONS.map((m, i) => [m.id, { status: i < idx ? 'done' : 'locked', done: m.objectives.map((o) => o.id).filter(() => i < idx) }]));
    useGame.setState({
      ...freshProgress(),
      introSeen: true,
      hasSave: true,
      mode: 'play',
      scene: 'street',
      entry: { x: -14, z: -6.4, face: 0 },
      where: { sam: 'street', pakya: 'street', goti: 'street', maru: 'street' },
      missions: missions as never,
      flags: { 'landlord.cleared': true, 'chai.got': true, 'fridge.fixed': true, 'plan.made': true, 'ritu.in': true, ...extraFlags },
      money: 250,
      failure: null,
      partEnded: false,
      dialogue: null,
      tasks: [],
      question: null,
      ...seed,
    });
    activateMission(id);
  },
  tp(x: number, z: number, who?: CharId) {
    const s = useGame.getState();
    const e = ent(who ?? s.active);
    e.x = x;
    e.z = z;
  },
  pos(id?: string) {
    const e = ent(id ?? useGame.getState().active);
    return [Math.round(e.x * 100) / 100, Math.round(e.z * 100) / 100];
  },
  agent(id: string) {
    const a = agents.get(id);
    if (!a) return null;
    const e = ent(id);
    return { mode: a.mode, scene: a.scene, ri: a.ri, wait: a.wait, x: e.x, z: e.z };
  },
  agentIds: () => [...agents.keys()],
  now: () => simClock.t,
  speed(k: number) {
    simSpeed.k = k;
  },
  /** where a room's "behind the door" hiding place is */
  hideSpotOf(scene: SceneId) {
    const it = SCENES[scene].interactables.find((i) => i.id === `hide_${scene}`);
    return it ? { x: it.x, z: it.z } : null;
  },
  /** everyday life (the postman's round) on or off; scripted tests switch it off */
  ambient(on: boolean) {
    setAmbient(on);
  },
  /** fast-forward the world clock (as if time passed) */
  skip(seconds: number) {
    simClock.t += seconds;
    useGame.setState({ worldTime: simClock.t });
  },
  switchFriend,
  filmi,
  completeObjective,
  answerQuestion,
  startDialogue,
  retryMission,
  runtime,
};
