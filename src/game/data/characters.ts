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
  /** full name, as on the title card */
  fullName: string;
  /** one filmi line for the freeze-frame name card */
  tagline: string;
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
    fullName: 'Sameer “Sam” Arya',
    tagline: 'Plan pe plan. Kaam ek bhi nahi.',
    role: 'Tarkeeb-baaz',
    blurb: 'Har cheez ka plan hai. Ab tak ek bhi kaam nahi aaya.',
    ability: 'Sauda',
    abilityVerb: 'Sauda karo',
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
      'Step one: confident dikho.',
      'Mere paas plan hai. Ekdum solid plan.',
      'Gentlemen. Focus karo.',
      'Bharosa rakho, ye sab strategy ka hissa hai.',
    ],
    signature: ['Strategy mein nabbe percent posture hota hai.', 'Ek minute… zor se soch raha hoon.', 'Plan B taiyaar hai. Plan C ban raha hai.'],
  },
  pakya: {
    id: 'pakya',
    name: 'Pakya',
    fullName: 'Pankaj “Pakya” Tiwari',
    tagline: 'Jhooth bolna kala hai. Aur main kalakaar.',
    role: 'Baaton ka Badshah',
    blurb: 'Baaton se kahin bhi ghus jaata hai. Nikalna tumhari samasya hai.',
    ability: 'Jhaansa',
    abilityVerb: 'Jhaansa do',
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
      'Tension mat le. Mera ek banda hai.',
      'Smile karo. Baal baat karenge.',
      'Technically, wo jhooth nahi tha.',
      'Main? Main toh almost famous hoon.',
    ],
    signature: ['*baal sanwaarta hai* Abhi bhi hai jalwa.', 'Aankh maari. Ek aur. Bas ek aur.', 'Hello madam, main film producer hoon.'],
  },
  goti: {
    id: 'goti',
    name: 'Goti',
    fullName: 'Gautam “Goti” Sisodia',
    tagline: 'Dimaag hai. Bas kahaan hai, pata nahi.',
    role: 'Ulta Dimaag',
    blurb: 'Aisi samasyaayein suljhaata hai jinhe koi samasya bhi nahi maanta.',
    ability: 'Ajeeb Harkat',
    abilityVerb: 'Kuch ajeeb karo',
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
      'Agar… hum isko chaat ke dekhein?',
      'Sikka mila! Oh. Button hai.',
      'Woh baadal bilkul Dongre Mama jaisa hai.',
      'Mere paas idea hai. Tumhe pasand nahi aayega.',
    ],
    signature: ['*cartwheel maarta hai, aadha*', '*soonghta hai* Samosa. Do gali door.', 'Oye! Oye! …kuch nahi. Bas check kar raha tha.'],
  },
  maru: {
    id: 'maru',
    name: 'Maru',
    fullName: 'Martand “Maru” Dhamdhere',
    tagline: 'Darr ke aage… aur darr hai.',
    role: 'Ghabraahat ki Dukaan',
    blurb: 'Pesha: ghabraana. Musibat uske peeche aawaara kutte ki tarah chalti hai.',
    ability: 'Tamaasha',
    abilityVerb: 'Tamaasha karo',
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
      'Mujhe bahut bura feeling aa raha hai.',
      'Woh gaay thi? Mujhe ghoor rahi hai kya?',
      'Hum jail jaayenge. Mujhe pata hai.',
      'Meri baayi aankh phadak rahi hai. Ye ishaara hai.',
    ],
    signature: ['AAAAAAH! …sorry. Aadat hai.', '*behosh* …*wapas hosh*', 'BACHAO! BACHAO! …nahi, theek hoon.'],
  },
};
