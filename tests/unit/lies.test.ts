import { describe, expect, it } from 'vitest';
import { addSuspicion, checkLine, decay, emptyLies, gossip, recordStory, storyVersions, SUSPICION, tell } from '../../src/game/lies';

const claim = (o: Partial<Parameters<typeof tell>[1]> = {}) => ({ topic: 'pakya.job', value: 'bank officer', by: 'pakya' as const, to: 'tiwari', t: 0, ...o });

describe('tell', () => {
  it('records a new belief with who said it', () => {
    const { state, result } = tell(emptyLies(), claim());
    expect(result.kind).toBe('new');
    expect(state.beliefs.tiwari['pakya.job']).toMatchObject({ value: 'bank officer', by: 'pakya' });
    expect(state.claims).toHaveLength(1);
  });

  it('flags a contradiction and raises suspicion when the same friend changes his story', () => {
    const a = tell(emptyLies(), claim()).state;
    const { state, result } = tell(a, claim({ value: 'film producer' }));
    expect(result.kind).toBe('contradiction');
    expect(state.suspicion.tiwari).toBe(SUSPICION.selfContradiction);
    expect(state.contradictions[0]).toMatchObject({ npc: 'tiwari', believed: 'bank officer', heard: 'film producer', by: 'pakya', earlierBy: 'pakya' });
  });

  it('remembers which friend made the earlier claim when another friend contradicts it', () => {
    const a = tell(emptyLies(), claim({ topic: 'gang.lastnight', value: 'At the temple', by: 'sam' })).state;
    const { result, state } = tell(a, claim({ topic: 'gang.lastnight', value: 'At a wedding', by: 'goti' }));
    expect(result.kind).toBe('contradiction');
    if (result.kind === 'contradiction') expect(result.contradiction.earlierBy).toBe('sam');
    expect(state.suspicion.tiwari).toBe(SUSPICION.friendContradiction);
  });

  it('makes a story more convincing when a second friend backs it up', () => {
    const a = addSuspicion(tell(emptyLies(), claim()).state, 'tiwari', 20);
    const { result, state } = tell(a, claim({ by: 'sam' }));
    expect(result).toEqual({ kind: 'consistent', corroboratedBy: 'pakya' });
    expect(state.suspicion.tiwari).toBe(20 + SUSPICION.corroborated);
  });

  it('lets a friend come clean: the truth replaces the lie and calms the listener', () => {
    const a = addSuspicion(tell(emptyLies(), claim({ to: 'ritu' })).state, 'ritu', 30);
    const { state, result } = tell(a, claim({ to: 'ritu', value: 'unemployed', truth: true }));
    expect(result).toEqual({ kind: 'confessed', replaced: 'bank officer' });
    expect(state.suspicion.ritu).toBe(30 + SUSPICION.confession);
    expect(state.contradictions).toHaveLength(0);
    expect(state.beliefs.ritu['pakya.job'].value).toBe('unemployed');
  });

  it('caps suspicion at 100', () => {
    let s = emptyLies();
    for (let i = 0; i < 10; i++) s = addSuspicion(s, 'daadi', 30);
    expect(s.suspicion.daadi).toBe(100);
  });
});

describe('gossip', () => {
  it('spreads a belief to a connected NPC, tagged with who passed it on', () => {
    const s = tell(emptyLies(), claim()).state;
    const r = gossip(s, [['tiwari', 'bablu']], () => 0.1, 5, 1);
    expect(r.spread).toHaveLength(1);
    expect(r.state.beliefs.bablu['pakya.job']).toMatchObject({ value: 'bank officer', via: 'tiwari' });
  });

  it('discovers a contradiction when two NPCs compare notes', () => {
    let s = tell(emptyLies(), claim()).state;
    s = tell(s, claim({ to: 'bablu', value: 'food critic' })).state;
    // rng: pass edge check, pick direction tiwari->bablu, pick first topic
    const seq = [0.1, 0.1, 0];
    let i = 0;
    const r = gossip(s, [['tiwari', 'bablu']], () => seq[i++ % seq.length], 9, 1);
    expect(r.found).toHaveLength(1);
    expect(r.found[0]).toMatchObject({ npc: 'bablu', believed: 'food critic', heard: 'bank officer', via: 'tiwari' });
    expect(r.state.suspicion.bablu).toBe(SUSPICION.gossipContradiction);
    // the listener keeps their own, first-hand version
    expect(r.state.beliefs.bablu['pakya.job'].value).toBe('food critic');
  });

  it('does nothing when the edge roll fails', () => {
    const s = tell(emptyLies(), claim()).state;
    const r = gossip(s, [['tiwari', 'bablu']], () => 0.99, 0, 0.5);
    expect(r.state).toBe(s);
  });
});

describe('checkLine (what Pakya sees in the dialogue)', () => {
  it('matches what this NPC already believes', () => {
    const s = tell(emptyLies(), claim()).state;
    expect(checkLine(s, 'pakya.job', 'bank officer', 'tiwari').kind).toBe('matches');
  });
  it('warns when a new listener would hear a different story than someone else', () => {
    const s = tell(emptyLies(), claim()).state;
    const r = checkLine(s, 'pakya.job', 'film producer', 'ritu');
    expect(r.kind).toBe('contradicts');
    if (r.kind === 'contradicts') expect(r.against).toMatchObject({ value: 'bank officer', to: 'tiwari' });
  });
  it('treats an untouched topic as a new lie', () => {
    expect(checkLine(emptyLies(), 'gang.who', 'census officers', 'pappu').kind).toBe('new');
  });
});

describe('decay and stories', () => {
  it('fades suspicion over time but never below zero', () => {
    const s = addSuspicion(emptyLies(), 'lalaji', 2);
    expect(decay(s, 4, 1).suspicion.lalaji).toBe(0);
    expect(decay(addSuspicion(emptyLies(), 'lalaji', 50), 10, 1).suspicion.lalaji).toBe(40);
  });
  it('counts distinct versions of Jai’s story', () => {
    let s = recordStory(emptyLies(), 'jai', 'bablu', 'from Pune');
    s = recordStory(s, 'jai', 'lalaji', 'Ritu’s cousin');
    s = recordStory(s, 'jai', 'pappu', 'from Pune');
    expect(storyVersions(s, 'jai')).toBe(2);
  });
});
