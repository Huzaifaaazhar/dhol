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
  triumph: { title: 'Insaaf', kicker: 'Ek baar ke liye, insaaf' },
  collapse: { title: 'Taash ka Mahal', kicker: 'Jhooth ka mahal gir gaya' },
  blame: { title: 'Ek Gadha Zyaada', kicker: 'Ek ne sabka khel bigaada' },
  fortune: { title: 'Noton ki Baarish', kicker: 'Hungaama, aur pata nahi kaise kismat' },
};

const CAUSE_LINE: Record<string, string> = {
  caught: 'Zikomo ke aadmiyon ne dhol uthaane waale ko pakad liya. Colony ka paisa ek pal ke liye Zikomo ke paas chala gaya.',
  time: 'Dhol chai ki dukaan tak pahunchne se pehle raat ho gayi. Zikomo khud dhol lene aa gaya.',
  lies: 'Poori colony ke saamne itni kahaaniyaan takraayin ki kisi ne ek shabd nahi maana. Sach waale bhi nahi.',
  alone: 'Chai ki dukaan pe koi nahi aaya. Chaar aadmi aur ek dhol: bahut udaas bheed.',
  bluffs: 'Gawaah ek film star ke liye aaye the jo tha hi nahi. Jab pata chala, sunna band kar diya.',
};

const CULPRIT_LINE: Record<CharId, string> = {
  sam: 'Sam ke plan ke andar plan the, aur har plan pichhle wale ke ulat. Colony ab use “Plan Z” bulaati hai.',
  pakya: 'Pakya alag alag logon ke liye bank officer, producer, census wala, income tax aur Jai tha. Asli income tax department ab usse milna chahta hai.',
  goti: 'Hafte bhar ka har dhamaaka, har thok, har galti se baja dhol: Goti. Colony ne use thelon, dholon aur chammachon se ban kar diya hai.',
  maru: 'Maru itni zor se, itni baar ghabraaya ki ab uski chheenk pe poori colony uchhal padti hai. Use colony ka official alarm bana diya gaya hai.',
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
  if (e.ending.id === 'triumph') out.push('Zikomo kaale chehre aur khade baalon ke saath hathkadi mein le jaaya gaya. Har ghar ko lottery ka paisa wapas mila, Lalaji ne do baar gin ke diya.');
  if (e.ending.id === 'fortune') out.push('Har rupaya kisi tarah sahi jeb mein pahuncha. Kaise, koi nahi jaanta. Moti ne ek note kha liya aur use koi afsos nahi.');

  if (e.ending.id === 'collapse') out.push('Chaaron ab karza chukaane ke liye Bablu ki dukaan pe glass dhote hain. Bablu kehta hai itne achhe jhoothe usne kabhi nahi dekhe.');
  else if (e.hasTicket) out.push('Ticket #4444 aakhir mein jeet gaya. Dongre Mama ko apna karza nakad mila, byaaj ke saath. Woh thoda roye.');
  else out.push('Jeetne waala ticket Zikomo ki gaadi mein reh gaya. Karza abhi baaki hai. Dongre Mama ne uske liye alag diary shuru kar di hai.');

  const ranked = [...(['sam', 'pakya', 'goti', 'maru'] as CharId[])].sort((a, b) => (e.scores[b] ?? 0) - (e.scores[a] ?? 0));
  const winner = ranked[0];
  const name = { sam: 'Sam', pakya: 'Pakya', goti: 'Goti', maru: 'Maru' }[winner];
  if (e.rituTrust >= 60) out.push(`Jaate jaate Ritu ne ${name} ki taraf dekh ke muskuraaya. Baaki teeno ko pakka yakeen hai ki woh unki taraf thi.`);
  else if (e.rituTrust < 30) out.push('Ritu ne chaaron ko ek baar dekha, sar hilaaya, aur gaadi ka sheesha upar kar liya.');
  else out.push('Ritu ne chaaron ka bahut tameez se shukriya kiya, aur Moti ko bahut der tak gale lagaaya.');

  out.push(e.liesCaught === 0 ? 'Poore hafte ek bhi jhooth nahi pakda gaya. Pakya iske baare mein chup nahi ho raha.' : `Colony ne hisaab milaaya: ${e.liesCaught} jhooth pakde gaye. Dongre Mama ne list frame karwa ke chowki mein laga di.`);
  if (e.harmony >= 60) out.push('Chaaron abhi bhi ek kamra, ek nimbu, aur ek waqt pe ek bekaar plan share karte hain.');
  else if (e.harmony < 35) out.push('Chaaron ek doosre se baat nahi kar rahe. Ye raat ke khaane tak chala.');
  if (e.secrets.includes('tank')) out.push('Lalaji ne aakhir Kamla ko apna khat de diya. Saath mein ek pyaaz free.');
  out.push('Agli subah Ritu Dada-Dadi ke saath Pune chhod ke chali gayi. Uski gaadi chali, aur chaaron uske peechhe daud pade. Kyun? Kisi ko nahi pata. Picture abhi baaki hai.');
  return out;
}
