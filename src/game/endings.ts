/**
 * Endings are not random: they are computed from what the player actually did.
 * Pure functions, unit tested in tests/unit/endings.test.ts.
 */
import type { CharId } from './types';
import { CHAR_IDS } from './types';
import type { LieState } from './lies';

export type EndingId = 'triumph' | 'collapse' | 'blame' | 'fortune';

export interface EndingInput {
  /** the drum reached the chai stall */
  delivered: boolean;
  /** Zikomo's men caught whoever carried it */
  caughtCarrying: boolean;
  /** witnesses who came to the stall */
  witnesses: number;
  /** witnesses who only came because Pakya promised them a film star */
  bluffedWitnesses: number;
  /** contradictions caught during the final mission itself */
  finaleContradictions: number;
  zikomoSuspicion: number;
  /** trouble each friend caused across the whole game */
  trouble: Record<CharId, number>;
  /** noisy accidents, panics and captures during the final mission */
  chaos: number;
}

export interface EndingResult {
  id: EndingId;
  culprit?: CharId;
  cause: string;
}

export const TROUBLE_THRESHOLD = 4;

/** The friend who caused clearly more trouble than anyone else, if there is one. */
export function culpritOf(trouble: Record<CharId, number>): CharId | undefined {
  const ranked = [...CHAR_IDS].sort((a, b) => trouble[b] - trouble[a]);
  const [first, second] = ranked;
  if (trouble[first] >= TROUBLE_THRESHOLD && trouble[first] - trouble[second] >= 2) return first;
  return undefined;
}

export function evaluateEnding(i: EndingInput): EndingResult {
  if (!i.delivered) return { id: 'collapse', cause: i.caughtCarrying ? 'caught' : 'time' };
  if (i.finaleContradictions >= 2) return { id: 'collapse', cause: 'lies' };
  if (i.witnesses === 0) return { id: 'collapse', cause: 'alone' };
  if (i.bluffedWitnesses >= 2) return { id: 'collapse', cause: 'bluffs' };
  const culprit = culpritOf(i.trouble);
  if (culprit) return { id: 'blame', culprit, cause: 'culprit' };
  if (i.chaos >= 3 || i.witnesses < 2 || i.zikomoSuspicion >= 100) return { id: 'fortune', cause: i.chaos >= 3 ? 'chaos' : i.witnesses < 2 ? 'few' : 'zikomo' };
  return { id: 'triumph', cause: 'clean' };
}

/** Trouble across the whole game: every lie a friend was caught in, plus final-mission mishaps. */
export function troubleFrom(lies: LieState, finale: Partial<Record<CharId, number>>): Record<CharId, number> {
  const t = Object.fromEntries(CHAR_IDS.map((c) => [c, finale[c] ?? 0])) as Record<CharId, number>;
  for (const c of lies.contradictions) t[c.by] += 1;
  return t;
}

export const ENDING_TITLES: Record<EndingId, { title: string; kicker: string }> = {
  triumph: { title: 'The Rightful Owners', kicker: 'The mess, resolved' },
  collapse: { title: 'House of Cards', kicker: 'The lies collapsed' },
  blame: { title: 'One Idiot Too Many', kicker: 'Somebody ruined it for everyone' },
  fortune: { title: 'Raining Rupees', kicker: 'Chaos, and somehow luck' },
};

const CAUSE_LINE: Record<string, string> = {
  caught: 'Zikomo’s men caught whoever was carrying the drum. Zikomo drove off with the colony’s money.',
  time: 'Night fell before the drum reached the chai stall. Zikomo collected it himself.',
  lies: 'Too many stories clashed in front of the whole colony. Nobody believed a word, not even the true ones.',
  alone: 'Nobody came to the chai stall. Four men and a drum make a sad little crowd.',
  bluffs: 'The witnesses came for a film star who did not exist. When they found out, they stopped listening.',
};

const CULPRIT_LINE: Record<CharId, string> = {
  sam: 'Sam’s plans had plans, and every one of them contradicted the last. The colony now calls him “Plan Z”.',
  pakya: 'Pakya had been a bank officer, a producer, a census man and income tax to different people. The real income tax department would like a word.',
  goti: 'Every crash, bang and accidental drum solo of the week was Goti. The colony has banned him from carts, drums and spoons.',
  maru: 'Maru panicked so loudly, so often, that the whole colony now jumps when he sneezes. He has been made the official neighbourhood alarm.',
};

export interface EpilogueState {
  ending: EndingResult;
  hasTicket: boolean;
  rituTrust: number;
  harmony: number;
  scores: Record<CharId, number>;
  liesCaught: number;
  secrets: string[];
}

/** A few lines about what became of everyone, built from the actual game state. */
export function epilogueLines(e: EpilogueState): string[] {
  const out: string[] = [];
  if (e.ending.id === 'collapse') out.push(CAUSE_LINE[e.ending.cause] ?? CAUSE_LINE.lies);
  if (e.ending.id === 'blame' && e.ending.culprit) out.push(CULPRIT_LINE[e.ending.culprit]);
  if (e.ending.id === 'triumph') out.push('Zikomo was led away in muddy white shoes. Every family got its lottery money back, counted twice by Lalaji.');
  if (e.ending.id === 'fortune') out.push('Every rupee ended up in the right pocket, somehow. Nobody can explain how. Moti ate one note and is not sorry.');

  if (e.ending.id === 'collapse') out.push('The four of them now wash glasses at Bablu’s stall to pay the rent. Bablu says they are his best liars yet.');
  else if (e.hasTicket) out.push('Ticket #4444 finally paid out. Tiwari-ji got his rent in cash, and cried a little.');
  else out.push('The winning ticket stayed in Zikomo’s car. The rent is still due. Tiwari-ji has started a separate diary for it.');

  const ranked = [...(['sam', 'pakya', 'goti', 'maru'] as CharId[])].sort((a, b) => (e.scores[b] ?? 0) - (e.scores[a] ?? 0));
  const winner = ranked[0];
  const name = { sam: 'Sam', pakya: 'Pakya', goti: 'Goti', maru: 'Maru' }[winner];
  if (e.rituTrust >= 60) out.push(`Ritu agreed to have chai with ${name}. The other three are each certain she meant them.`);
  else if (e.rituTrust < 30) out.push('Ritu now takes the long way round the colony, to avoid all four of them.');
  else out.push('Ritu thanked all four of them, very politely, then hugged Moti for much longer.');

  out.push(e.liesCaught === 0 ? 'Not a single lie was caught all week. Pakya will not stop talking about it.' : `The colony compared notes: ${e.liesCaught} lie${e.liesCaught === 1 ? '' : 's'} caught. Tiwari-ji framed the list.`);
  if (e.harmony >= 60) out.push('The four of them still share one room, one lemon, and one terrible plan at a time.');
  else if (e.harmony < 35) out.push('The four of them are not speaking to each other. This lasted until dinner.');
  if (e.secrets.includes('tank')) out.push('Lalaji finally gave Kamla his letter. He delivered it with a free onion.');
  out.push('Rahul came home. Daadi sold his new dhol within the hour.');
  return out;
}
