import type { CharId } from '../types';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: 'side' | 'puff' | 'curly' | 'flat' | 'bun' | 'braid' | 'bald' | 'cap' | 'topi';
  shirt: string;
  shirtPattern?: 'check' | 'shiny' | 'print' | 'kurta' | 'plain' | 'vest' | 'saree';
  pants: string;
  shoes: string;
  height: number; // 1 = average
  girth: number; // 1 = average
  extras?: Array<'glasses' | 'shades' | 'chain' | 'watch' | 'moustache' | 'towel' | 'ears' | 'belly' | 'stick' | 'dupatta' | 'beard'>;
}

/** Movement personality: tuned per friend so each one *walks* like themselves. */
export interface MoveStyle {
  speed: number;
  runMul: number;
  bounce: number; // vertical bob amplitude
  stride: number; // leg swing
  armSwing: number;
  sway: number; // hip/shoulder roll
  lean: number; // forward lean when moving
  jitter: number; // nervous shake
  cadence: number; // steps per unit distance
}

export interface FriendDef {
  id: CharId;
  name: string;
  role: string;
  blurb: string;
  ability: string;
  abilityVerb: string;
  color: string;
  voice: number; // blip pitch
  look: Look;
  move: MoveStyle;
  /** Things they mutter when idle or when switched to. */
  barks: string[];
  /** What the free F action looks like with nothing nearby. */
  signature: string[];
}

export const FRIENDS: Record<CharId, FriendDef> = {
  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'The planner',
    blurb: 'Has a plan for everything. None of them have worked yet.',
    ability: 'Negotiate',
    abilityVerb: 'Make a deal',
    color: '#0aa3b5',
    voice: 300,
    look: {
      skin: '#c98d62',
      hair: '#1d1410',
      hairStyle: 'side',
      shirt: '#2f6fb3',
      shirtPattern: 'check',
      pants: '#c8b48a',
      shoes: '#3b2418',
      height: 1.06,
      girth: 0.95,
      extras: ['glasses', 'watch', 'moustache'],
    },
    move: { speed: 4.2, runMul: 1.7, bounce: 0.03, stride: 0.55, armSwing: 0.35, sway: 0.02, lean: 0.03, jitter: 0, cadence: 1.55 },
    barks: [
      'Step one: look confident.',
      'I have a plan. A very good plan.',
      'Gentlemen. Focus.',
      'Trust me, this is all part of the strategy.',
    ],
    signature: ['Strategy is ninety percent posture.', 'Let me just… think aloud.', 'Plan B is ready. Plan C is loading.'],
  },
  pakya: {
    id: 'pakya',
    name: 'Pakya',
    role: 'The smooth talker',
    blurb: 'Can talk his way into anywhere. Getting out is your problem.',
    ability: 'Bluff',
    abilityVerb: 'Bluff',
    color: '#e4007c',
    voice: 360,
    look: {
      skin: '#b97a52',
      hair: '#120c0a',
      hairStyle: 'puff',
      shirt: '#9b1b5a',
      shirtPattern: 'shiny',
      pants: '#2a3a63',
      shoes: '#e8e2d6',
      height: 1.0,
      girth: 1.0,
      extras: ['chain', 'shades'],
    },
    move: { speed: 4.4, runMul: 1.7, bounce: 0.05, stride: 0.6, armSwing: 0.55, sway: 0.12, lean: -0.04, jitter: 0, cadence: 1.35 },
    barks: [
      'Relax. I know a guy.',
      'Smile. Let the hair do the talking.',
      'Technically, that was not a lie.',
      'Who, me? I am practically famous.',
    ],
    signature: ['*combs hair* Still got it.', 'Wink. Wink. Okay one more. Wink.', 'Hello madam, film producer here.'],
  },
  goti: {
    id: 'goti',
    name: 'Goti',
    role: 'The wild card',
    blurb: 'Solves problems no one else would even recognise as problems.',
    ability: 'Do something weird',
    abilityVerb: 'Try something weird',
    color: '#ffb400',
    voice: 430,
    look: {
      skin: '#a86d46',
      hair: '#221510',
      hairStyle: 'curly',
      shirt: '#ffc21a',
      shirtPattern: 'print',
      pants: '#5b6b3a',
      shoes: '#6b3b23',
      height: 0.9,
      girth: 1.18,
      extras: ['belly'],
    },
    move: { speed: 4.0, runMul: 1.8, bounce: 0.14, stride: 0.7, armSwing: 0.8, sway: 0.06, lean: 0.06, jitter: 0, cadence: 1.9 },
    barks: [
      'What if… we just licked it?',
      'I found a coin! Oh. It is a button.',
      'Hmm. That cloud looks like Tiwari-ji.',
      'I have an idea. You will not like it.',
    ],
    signature: ['*does a cartwheel, mostly*', '*sniffs the air* Samosa. Two lanes away.', 'Hey! Hey! …nothing. Just checking.'],
  },
  maru: {
    id: 'maru',
    name: 'Maru',
    role: 'The nervous wreck',
    blurb: 'Panics professionally. Disaster follows him like a stray dog.',
    ability: 'Make a scene',
    abilityVerb: 'Panic dramatically',
    color: '#6cc04a',
    voice: 250,
    look: {
      skin: '#c48a5d',
      hair: '#2b1c14',
      hairStyle: 'flat',
      shirt: '#5aa83c',
      shirtPattern: 'kurta',
      pants: '#e9e1cc',
      shoes: '#4a3326',
      height: 1.1,
      girth: 0.8,
      extras: ['ears'],
    },
    move: { speed: 4.1, runMul: 1.9, bounce: 0.04, stride: 0.45, armSwing: 0.25, sway: 0.03, lean: 0.12, jitter: 0.03, cadence: 2.2 },
    barks: [
      'I have a bad feeling about this.',
      'Was that a cow? Is it looking at me?',
      'We are going to jail. I can feel it.',
      'My left eye is twitching. That is a sign.',
    ],
    signature: ['AAAAAAH! …sorry. Reflex.', '*faints* …*un-faints*', 'HELP! HELP! …no, I am fine.'],
  },
};
