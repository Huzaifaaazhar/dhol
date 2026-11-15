import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, freshProgress, activateMission, completeObjective, failMission, retryMission, migrateSave, setStat, view } from '../../src/game/store';
import { MISSIONS, MISSION_MAP } from '../../src/game/data/missions';
import { taskRate } from '../../src/game/sim/tasks';

beforeEach(() => {
  useGame.setState({ ...freshProgress(), failure: null, dialogue: null, afterDialogue: [], tasks: [] });
});

describe('mission data', () => {
  it('chains every Part 2 mission to the next', () => {
    const ids = ['rich', 'jai', 'zikomo', 'dhol', 'chaos', 'after'];
    for (let i = 0; i < ids.length - 1; i++) expect(MISSION_MAP[ids[i]].next).toBe(ids[i + 1]);
  });
  it('gives every Part 2 mission at least one required objective', () => {
    for (const m of MISSIONS.filter((x) => x.part === 2)) expect(m.objectives.some((o) => !o.optional)).toBe(true);
  });
});

describe('checkpoints', () => {
  it('rolls back everything that happened after the mission started', () => {
    activateMission('rich');
    setStat('ritu.trust', 5);
    useGame.setState({ money: 999, flags: { 'move.sam': true } });
    failMission('test');
    expect(useGame.getState().failure?.mission).toBe('rich');
    retryMission();
    const s = useGame.getState();
    expect(s.failure).toBeNull();
    expect(s.money).toBe(0);
    expect(s.stats['ritu.trust']).toBe(30);
    expect(s.flags['move.sam']).toBeUndefined();
    expect(s.missions.rich.status).toBe('active');
  });

  it('finishes a mission without its optional objectives', () => {
    activateMission('zikomo');
    completeObjective('zikomo.gather');
    expect(useGame.getState().missions.zikomo.status).toBe('done');
  });
});

describe('save migration', () => {
  it('turns a finished Part 1 save into the first Part 2 mission', () => {
    const old = { ...freshProgress(), missions: { ritu: { status: 'done', done: [] }, part2: { status: 'active', done: [] } } } as never;
    const p = migrateSave(old, 1);
    expect(p.missions.rich.status).toBe('active');
    expect((p.missions as Record<string, unknown>).part2).toBeUndefined();
  });
  it('carries Pakya’s Part 1 cable-TV bluff into Daadi’s memory', () => {
    const old = { ...freshProgress(), flags: { 'ritu.cable': true } } as never;
    expect(migrateSave(old, 1).lies.beliefs.daadi['pakya.job'].value).toBe('cable TV inspector');
  });
});

describe('abilities', () => {
  it('makes Goti the fastest searcher', () => {
    const spec = { kind: 'search' as const, duration: 6 };
    expect(taskRate('goti', spec)).toBe(1);
    expect(taskRate('sam', spec)).toBeCloseTo(1 / 3);
  });
  it('exposes suspicion and beliefs to dialogue conditions', () => {
    useGame.setState({ lies: { ...useGame.getState().lies, suspicion: { tiwari: 42 }, beliefs: { tiwari: { 'pakya.job': { value: 'film producer', by: 'pakya', t: 0 } } } } });
    const v = view();
    expect(v.suspicion('tiwari')).toBe(42);
    expect(v.believes('tiwari', 'pakya.job')).toBe('film producer');
  });
});
