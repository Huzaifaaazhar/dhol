/**
 * The lie ledger. Pure functions over a plain LieState so it can be unit tested and persisted.
 *
 * - A claim is something a friend tells an NPC about a topic ("pakya.job" = "income tax officer").
 * - Each NPC holds beliefs: one value per topic, with who said it and whether it came via gossip.
 * - Telling an NPC something that clashes with what they believe is a contradiction:
 *   suspicion rises, and if a different friend said the earlier thing, someone gets blamed.
 * - Gossip copies beliefs between connected NPCs over time; clashes discovered that way count too.
 * - A friend repeating a story the NPC already believes makes it more convincing.
 */
import type { CharId } from './types';

export interface Belief {
  value: string;
  by: CharId;
  t: number;
  /** NPC this was heard from, if it arrived by gossip */
  via?: string;
}

export interface Claim {
  topic: string;
  value: string;
  by: CharId;
  to: string;
  t: number;
  /** coming clean: replaces the lie and calms the listener instead of catching you out */
  truth?: boolean;
}

export interface Contradiction {
  npc: string;
  topic: string;
  believed: string;
  heard: string;
  /** friend who said the new thing (or who said it originally, for gossip) */
  by: CharId;
  /** friend responsible for what the NPC already believed */
  earlierBy: CharId;
  via?: string;
  t: number;
}

export interface LieState {
  claims: Claim[];
  beliefs: Record<string, Record<string, Belief>>;
  suspicion: Record<string, number>;
  contradictions: Contradiction[];
  /** other people's stories, e.g. stories.jai.bablu = what Jai told Bablu */
  stories: Record<string, Record<string, string>>;
}

export const emptyLies = (): LieState => ({ claims: [], beliefs: {}, suspicion: {}, contradictions: [], stories: {} });

export const SUSPICION = {
  selfContradiction: 35,
  friendContradiction: 25,
  gossipContradiction: 20,
  corroborated: -6,
  confession: -15,
  max: 100,
} as const;

export type TellResult =
  | { kind: 'new' }
  | { kind: 'confessed'; replaced: string }
  | { kind: 'consistent'; corroboratedBy: CharId | null }
  | { kind: 'contradiction'; contradiction: Contradiction };

const clamp = (n: number) => Math.max(0, Math.min(SUSPICION.max, n));

export function addSuspicion(state: LieState, npc: string, delta: number): LieState {
  return { ...state, suspicion: { ...state.suspicion, [npc]: clamp((state.suspicion[npc] ?? 0) + delta) } };
}

/** A friend tells an NPC something. Returns the new state and what happened. */
export function tell(state: LieState, c: Claim): { state: LieState; result: TellResult } {
  const prior = state.beliefs[c.to]?.[c.topic];
  let next: LieState = {
    ...state,
    claims: [...state.claims, c],
    beliefs: { ...state.beliefs, [c.to]: { ...(state.beliefs[c.to] ?? {}), [c.topic]: { value: c.value, by: c.by, t: c.t } } },
  };
  if (!prior) return { state: next, result: { kind: 'new' } };
  if (c.truth && prior.value !== c.value) {
    next = addSuspicion(next, c.to, SUSPICION.confession);
    return { state: next, result: { kind: 'confessed', replaced: prior.value } };
  }
  if (prior.value === c.value) {
    // a second friend backing the same story makes it more believable
    const corroboratedBy = prior.by !== c.by ? prior.by : null;
    if (corroboratedBy) next = addSuspicion(next, c.to, SUSPICION.corroborated);
    return { state: next, result: { kind: 'consistent', corroboratedBy } };
  }
  const contradiction: Contradiction = {
    npc: c.to,
    topic: c.topic,
    believed: prior.value,
    heard: c.value,
    by: c.by,
    earlierBy: prior.by,
    via: prior.via,
    t: c.t,
  };
  next = addSuspicion(next, c.to, prior.by === c.by ? SUSPICION.selfContradiction : SUSPICION.friendContradiction);
  next = { ...next, contradictions: [...next.contradictions, contradiction] };
  return { state: next, result: { kind: 'contradiction', contradiction } };
}

/**
 * One round of gossip along the given edges. `rng` is injected for testability.
 * Each edge has a chance to pass one belief about the gang from one NPC to the other.
 */
export function gossip(
  state: LieState,
  edges: Array<[string, string]>,
  rng: () => number,
  t: number,
  chance = 0.5,
): { state: LieState; spread: Array<{ from: string; to: string; topic: string }>; found: Contradiction[] } {
  let next = state;
  const spread: Array<{ from: string; to: string; topic: string }> = [];
  const found: Contradiction[] = [];
  for (const [a, b] of edges) {
    if (rng() > chance) continue;
    // pick a direction, then a topic the speaker knows
    const [from, to] = rng() < 0.5 ? [a, b] : [b, a];
    const known = Object.entries(next.beliefs[from] ?? {});
    if (!known.length) continue;
    const [topic, belief] = known[Math.floor(rng() * known.length)];
    const theirs = next.beliefs[to]?.[topic];
    if (theirs && theirs.value === belief.value) continue;
    if (theirs) {
      const c: Contradiction = { npc: to, topic, believed: theirs.value, heard: belief.value, by: belief.by, earlierBy: theirs.by, via: from, t };
      next = addSuspicion(next, to, SUSPICION.gossipContradiction);
      next = { ...next, contradictions: [...next.contradictions, c] };
      found.push(c);
      // the listener keeps their own version: they heard it first-hand
      continue;
    }
    next = {
      ...next,
      beliefs: { ...next.beliefs, [to]: { ...(next.beliefs[to] ?? {}), [topic]: { ...belief, via: from, t } } },
    };
    spread.push({ from, to, topic });
  }
  return { state: next, spread, found };
}

/** Suspicion slowly fades when nobody is caught lying. */
export function decay(state: LieState, dt: number, perSecond = 0.25): LieState {
  const suspicion: Record<string, number> = {};
  let changed = false;
  for (const [k, v] of Object.entries(state.suspicion)) {
    const nv = Math.max(0, v - perSecond * dt);
    suspicion[k] = nv;
    if (nv !== v) changed = true;
  }
  return changed ? { ...state, suspicion } : state;
}

/**
 * How a planned line relates to everything already said on that topic, anywhere.
 * Only Pakya can see this in conversations: he is the one keeping track.
 */
export function checkLine(
  state: LieState,
  topic: string,
  value: string,
  to: string,
): { kind: 'new' } | { kind: 'matches'; with: Claim | Belief } | { kind: 'contradicts'; against: { value: string; by: CharId; to: string } } {
  const theirs = state.beliefs[to]?.[topic];
  if (theirs) {
    return theirs.value === value ? { kind: 'matches', with: theirs } : { kind: 'contradicts', against: { value: theirs.value, by: theirs.by, to } };
  }
  // they have not heard anything yet; does it clash with what someone else was told?
  const others = state.claims.filter((c) => c.topic === topic);
  const clash = [...others].reverse().find((c) => c.value !== value);
  const same = others.find((c) => c.value === value);
  if (same && !clash) return { kind: 'matches', with: same };
  if (clash) return { kind: 'contradicts', against: { value: clash.value, by: clash.by, to: clash.to } };
  return { kind: 'new' };
}

export function recordStory(state: LieState, subject: string, teller: string, value: string): LieState {
  return { ...state, stories: { ...state.stories, [subject]: { ...(state.stories[subject] ?? {}), [teller]: value } } };
}

/** Distinct versions of someone's story heard so far. */
export function storyVersions(state: LieState, subject: string) {
  return new Set(Object.values(state.stories[subject] ?? {})).size;
}

/** Who talks to whom. Bablu talks to everyone; Zikomo's men listen to Bablu. */
export const GOSSIP_NET: Array<[string, string]> = [
  ['tiwari', 'bablu'],
  ['bablu', 'lalaji'],
  ['bablu', 'pappu'],
  ['pappu', 'sharma'],
  ['sharma', 'verma'],
  ['lalaji', 'sabziwali'],
  ['daadi', 'ritu'],
  ['ritu', 'pinky'],
  ['daadi', 'sabziwali'],
  ['tiwari', 'daadi'],
];

export const ZIKOMO_NET: Array<[string, string]> = [
  ['bablu', 'zikomo'],
  ['pappu', 'zikomo'],
];

export const TOPICS: Record<string, string> = {
  'pakya.job': 'Pakya kya kaam karta hai',
  'gang.who': 'Ye chaar asal mein kaun hain',
  'gang.lastnight': 'Kal raat gang kahaan thi',
  'gang.dhol': 'Gang ko dhol ke baare mein kya pata hai',
  'room.state': 'Kiraaye ke kamre mein kya chal raha hai',
  'rent.when': 'Karza kab chukega',
  'maru.health': 'Maru ki tabiyat kaisi hai',
  'gang.money': 'Gang ko Zikomo ke paise ke baare mein kya pata hai',
  'dhol.fake': 'Zikomo ko nakli dhol kisne diya',
  'pakya.who': 'Pakya asal mein kaun hai',
};
