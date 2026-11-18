import { describe, expect, it } from 'vitest';
import { culpritOf, epilogueLines, evaluateEnding, troubleFrom, type EndingInput } from '../../src/game/endings';
import { emptyLies } from '../../src/game/lies';

const zero = { sam: 0, pakya: 0, goti: 0, maru: 0 };
const base = (o: Partial<EndingInput> = {}): EndingInput => ({
  delivered: true,
  caughtCarrying: false,
  witnesses: 3,
  bluffedWitnesses: 0,
  finaleContradictions: 0,
  zikomoSuspicion: 30,
  trouble: { ...zero },
  chaos: 0,
  ...o,
});

describe('evaluateEnding', () => {
  it('a clean, well-witnessed delivery resolves the mess', () => {
    expect(evaluateEnding(base()).id).toBe('triumph');
  });
  it('losing the drum to Zikomo collapses everything', () => {
    expect(evaluateEnding(base({ delivered: false, caughtCarrying: true }))).toEqual({ id: 'collapse', cause: 'caught' });
    expect(evaluateEnding(base({ delivered: false }))).toEqual({ id: 'collapse', cause: 'time' });
  });
  it('lies caught during the finale make the colony stop believing anyone', () => {
    expect(evaluateEnding(base({ finaleContradictions: 2 }))).toEqual({ id: 'collapse', cause: 'lies' });
  });
  it('witnesses lured with a fake film star turn on the gang', () => {
    expect(evaluateEnding(base({ bluffedWitnesses: 2 })).cause).toBe('bluffs');
  });
  it('blames the friend who caused clearly the most trouble', () => {
    const r = evaluateEnding(base({ trouble: { sam: 1, pakya: 5, goti: 2, maru: 0 } }));
    expect(r).toEqual({ id: 'blame', culprit: 'pakya', cause: 'culprit' });
  });
  it('does not blame anyone when the trouble is shared', () => {
    expect(culpritOf({ sam: 4, pakya: 4, goti: 0, maru: 0 })).toBeUndefined();
  });
  it('lots of chaos but a delivered drum is the lucky ending', () => {
    expect(evaluateEnding(base({ chaos: 3 })).id).toBe('fortune');
    expect(evaluateEnding(base({ witnesses: 1 })).id).toBe('fortune');
  });
  it('is deterministic: the same game state always gives the same ending', () => {
    const i = base({ chaos: 2, trouble: { sam: 2, pakya: 3, goti: 1, maru: 1 } });
    expect(evaluateEnding(i)).toEqual(evaluateEnding({ ...i }));
  });
});

describe('troubleFrom', () => {
  it('counts every lie a friend was caught in across the whole game', () => {
    const lies = emptyLies();
    lies.contradictions.push(
      { npc: 'tiwari', topic: 'pakya.job', believed: 'a', heard: 'b', by: 'pakya', earlierBy: 'pakya', t: 0 },
      { npc: 'ritu', topic: 'pakya.job', believed: 'a', heard: 'c', by: 'pakya', earlierBy: 'pakya', t: 1 },
    );
    expect(troubleFrom(lies, { maru: 2 })).toEqual({ sam: 0, pakya: 2, goti: 0, maru: 2 });
  });
});

describe('epilogue', () => {
  it('reflects the ticket, Ritu and the lies', () => {
    const lines = epilogueLines({ ending: { id: 'triumph', cause: 'clean' }, hasTicket: true, rituTrust: 70, harmony: 70, scores: { sam: 1, pakya: 0, goti: 5, maru: 2 }, liesCaught: 3, secrets: ['tank'] });
    expect(lines.join(' ')).toContain('Ticket #4444');
    expect(lines.join(' ')).toContain('Ritu ne Goti ki taraf');
    expect(lines.join(' ')).toContain('3 jhooth');
    expect(lines.join(' ')).toContain('Kamla');
    // every ending closes the film's way: the four run after Ritu's car
    expect(lines[lines.length - 1]).toContain('peechhe daud pade');
  });
});
