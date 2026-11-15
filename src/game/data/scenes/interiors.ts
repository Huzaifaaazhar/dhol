import type { Box, SceneDef, SceneId } from '../../types';
import { has, talk, searchSpot, smooth, stall } from './helpers';
import type { StateView } from '../../types';

const act = (m: string) => (s: StateView) => s.missionStatus(m) === 'active';

export type FurnitureType =
  | 'charpai'
  | 'mattress'
  | 'fridge'
  | 'whiteboard'
  | 'calendar'
  | 'mirror'
  | 'tv'
  | 'stove'
  | 'cylinder'
  | 'bucket'
  | 'fan'
  | 'poster'
  | 'clothesline'
  | 'shelf'
  | 'counter'
  | 'sodafridge'
  | 'phone'
  | 'jars'
  | 'sacks'
  | 'sofa'
  | 'armchair'
  | 'vase'
  | 'frames'
  | 'jhula'
  | 'rug'
  | 'car'
  | 'tyres'
  | 'dartboard'
  | 'trunk'
  | 'radio'
  | 'planboard'
  | 'crate'
  | 'plant'
  | 'tubelight'
  | 'table'
  | 'window';

export interface Furniture {
  type: FurnitureType;
  x: number;
  z: number;
  y?: number;
  rot?: number;
  w?: number;
  d?: number;
  color?: string;
  text?: string;
  collide?: boolean;
}

export interface RoomDef {
  w: number;
  d: number;
  wall: string;
  wallLow: string;
  floor: 'tiles' | 'cement' | 'marble' | 'oil';
  floorA: string;
  floorB: string;
  doorX: number;
  furniture: Furniture[];
  light: string;
}

function colliders(room: RoomDef): Box[] {
  return room.furniture
    .filter((f) => f.collide)
    .map((f) => {
      const rotated = Math.abs(Math.sin(f.rot ?? 0)) > 0.7;
      const w = f.w ?? 1;
      const d = f.d ?? 1;
      return { x: f.x, z: f.z, w: rotated ? d : w, d: rotated ? w : d };
    });
}

function interior(
  id: SceneId,
  name: string,
  room: RoomDef,
  rest: Pick<SceneDef, 'interactables' | 'npcs' | 'triggers'> & { exitTo: string },
): SceneDef & { room: RoomDef } {
  const hw = room.w / 2;
  const hd = room.d / 2;
  return {
    id,
    name,
    interior: true,
    zoom: 68,
    bounds: { minX: -hw, maxX: hw, minZ: -hd, maxZ: hd + 0.2 },
    colliders: [
      ...colliders(room),
      // front low wall, with a gap for the door
      { x: (-hw + room.doorX - 0.8) / 2, z: hd + 0.1, w: room.doorX - 0.8 + hw, d: 0.3 },
      { x: (hw + room.doorX + 0.8) / 2, z: hd + 0.1, w: hw - room.doorX - 0.8, d: 0.3 },
    ],
    spawns: { door: { x: room.doorX, z: hd - 1.0, face: Math.PI } },
    room,
    ...rest,
    interactables: [
      {
        id: 'exit',
        label: 'Go outside',
        x: room.doorX,
        z: hd - 0.2,
        y: 2.6,
        radius: 1.3,
        actions: [{ id: 'exit', verb: 'Leave', effects: [{ goto: 'street', spawn: rest.exitTo }, { sfx: 'door' }] }],
      },
      ...rest.interactables,
    ],
  };
}

/* ───────────────── The friends’ rented room ───────────────── */
export const house = interior(
  'house',
  'The rented room',
  {
    w: 12,
    d: 9,
    wall: '#7cc6c0',
    wallLow: '#3f8f89',
    floor: 'tiles',
    floorA: '#c9b79c',
    floorB: '#a8927a',
    doorX: 3.5,
    light: '#ffe2b0',
    furniture: [
      { type: 'charpai', x: -4.9, z: -2.2, rot: 0, w: 1.4, d: 2.6, collide: true },
      { type: 'charpai', x: -4.9, z: 1.6, rot: 0, w: 1.4, d: 2.6, collide: true, color: '#9c6644' },
      { type: 'mattress', x: 1.0, z: 2.6, rot: Math.PI / 2, w: 1.2, d: 2.2, color: '#e76f51' },
      { type: 'mattress', x: -1.6, z: 2.8, rot: Math.PI / 2, w: 1.2, d: 2.2, color: '#2a9d8f' },
      { type: 'whiteboard', x: -1.8, z: -4.35, text: 'PLAN' },
      { type: 'fridge', x: 1.2, z: -3.9, w: 1.0, d: 0.9, collide: true },
      { type: 'calendar', x: 2.7, z: -4.4 },
      { type: 'mirror', x: -5.94, z: 0, rot: Math.PI / 2 },
      { type: 'tv', x: 4.6, z: -0.6, rot: -Math.PI / 2, w: 1.1, d: 0.8, collide: true },
      { type: 'stove', x: 5.1, z: -3.6, w: 1.4, d: 0.9, collide: true },
      { type: 'cylinder', x: 4.0, z: -3.8, w: 0.6, d: 0.6, collide: true },
      { type: 'bucket', x: -3.2, z: -3.8 },
      { type: 'fan', x: 0, z: 0, y: 3.4 },
      { type: 'poster', x: -5.94, z: -3, rot: Math.PI / 2, text: 'HERO', color: '#e63946' },
      { type: 'poster', x: 4.2, z: -4.44, text: 'GYM', color: '#ffb400' },
      { type: 'clothesline', x: 0, z: -1.5, y: 2.9 },
      { type: 'window', x: -0.2, z: -4.44 },
      { type: 'crate', x: -2.8, z: 0.2, w: 0.9, d: 0.9, collide: true, color: '#b08968' },
      { type: 'tubelight', x: -5.94, z: 1.8, rot: Math.PI / 2 },
    ],
  },
  {
    exitTo: 'houseDoor',
    npcs: [],
    triggers: [],
    interactables: [
      {
        id: 'h_board',
        label: 'Sam’s plan board',
        x: -1.8,
        z: -3.6,
        y: 2.8,
        actions: [
          { id: 'read', verb: 'Read', say: '“Step 1: Become rich. Step 2: Stay rich.” Step 1 is circled. Twice.' },
          { id: 'plan', verb: 'Add a new plan', who: 'sam', say: 'Step 1b: Find out how step 1 works.' },
        ],
      },
      {
        id: 'h_fridge',
        label: 'Fridge',
        x: 1.2,
        z: -3.1,
        y: 2.4,
        actions: [
          { id: 'open', verb: 'Open', say: 'One lemon, half a bottle of water, and a note: “Don’t eat my lemon. — Goti”.' },
          { id: 'lemon', verb: 'Eat the lemon', who: 'goti', say: 'Sour. SO sour. Worth it. It was my lemon anyway.' },
        ],
      },
      {
        id: 'h_cal',
        label: 'Calendar',
        x: 2.7,
        z: -3.7,
        y: 2.8,
        actions: [{ id: 'read', verb: 'Read', say: 'The 1st is circled in red. Three times. Tiwari-ji did that himself, from outside the window.' }],
      },
      {
        id: 'h_mirror',
        label: 'Cracked mirror',
        x: -5.3,
        z: 0,
        y: 2.6,
        actions: [
          { id: 'look', verb: 'Look', say: 'Cracked in one corner. Like our future.' },
          { id: 'admire', verb: 'Admire yourself', who: 'pakya', say: 'Hello, handsome. Yes, you. Don’t ever change.', effects: [{ secret: 'mirror' }] },
        ],
      },
      {
        id: 'h_charpai',
        label: 'Maru’s charpai',
        x: -4.0,
        z: 1.6,
        y: 1.4,
        actions: [
          {
            id: 'hidedhol',
            verb: 'Hide the real dhol under it',
            showIf: (st) => act('chaos')(st) && st.dhol === `carried:${st.active}`,
            effects: [{ dholTo: 'house' }, { event: 'hideReal' }],
          },
          { id: 'search', verb: 'Look underneath', once: true, say: 'A ₹50 note! Maru was hiding it “for emergencies”. This is an emergency.', effects: [{ money: 50 }, { secret: 'charpai' }] },
          { id: 'hide', verb: 'Hide under it', who: 'maru', say: 'If I don’t move, the rent can’t see me.' },
        ],
      },
      {
        id: 'h_tv',
        label: 'Television',
        x: 3.9,
        z: -0.6,
        y: 2.0,
        actions: [
          { id: 'watch', verb: 'Watch', say: 'One channel. A cooking show. We have nothing to cook.' },
          { id: 'smack', verb: 'Smack it', who: 'goti', say: '*THWACK* Now it gets two channels. Both cooking shows.', effects: [{ sfx: 'thud' }] },
        ],
      },
      {
        id: 'h_stove',
        label: 'Stove',
        x: 5.1,
        z: -2.8,
        y: 1.8,
        actions: [{ id: 'look', verb: 'Inspect', say: 'The stove has not seen food since Diwali. It is starting to forget what food is.' }],
      },
    ],
  },
);

/* ───────────────── Lalaji General Store ───────────────── */
export const shop = interior(
  'shop',
  'Lalaji General Store',
  {
    w: 11,
    d: 8,
    wall: '#f6bd60',
    wallLow: '#c1121f',
    floor: 'cement',
    floorA: '#b7b0a2',
    floorB: '#a59d8f',
    doorX: 3,
    light: '#fff1c1',
    furniture: [
      { type: 'shelf', x: -2.5, z: -3.65, w: 5, d: 0.7, collide: true },
      { type: 'shelf', x: 2.6, z: -3.65, w: 3, d: 0.7, collide: true },
      { type: 'shelf', x: -5.15, z: -0.6, rot: Math.PI / 2, w: 4, d: 0.7, collide: true },
      { type: 'counter', x: -0.8, z: -1.2, w: 4.4, d: 0.9, collide: true },
      { type: 'jars', x: -0.8, z: -1.2, y: 1.05 },
      { type: 'sodafridge', x: 4.6, z: -3.2, w: 1.1, d: 1.0, collide: true },
      { type: 'phone', x: -5.1, z: 2.4, rot: Math.PI / 2 },
      { type: 'sacks', x: 4.4, z: 0.8, w: 1.6, d: 1.2, collide: true },
      { type: 'tubelight', x: 0, z: -3.98 },
      { type: 'fan', x: 0.5, z: 0.5, y: 3.3 },
      { type: 'poster', x: -4, z: -3.98, text: 'COLA', color: '#d62828', y: 2.7 },
    ],
  },
  {
    exitTo: 'shopDoor',
    triggers: [],
    npcs: [{ id: 'lalaji', x: -0.8, z: -2.4, face: 0, anim: 'idle' }],
    interactables: [
      talk('lalaji', 'Lalaji', 'lalaji', [stall('lalaji'), smooth('lalaji')], 2.4),
      searchSpot('s_shelf2', 'Back shelf', 2.6, -2.9, { duration: 4, noise: 0.4, target: 'lalaji', onDone: [{ give: 'crackers' }, { toast: 'Crackers! Goti can light one to send Zikomo’s men the wrong way (F outdoors).' }] }, (st) => act('zikomo')(st) && !st.has('crackers')),
      searchSpot('s_ledger', 'Lalaji’s ledger', -2.8, -0.2, {
        duration: 5,
        target: 'lalaji',
        onDone: [{ toast: 'Ledger: “Drum, from Shambhu, ₹60. Lent to cricket children. Returned: one ball (cracked).”' }, { flag: 'clue.lalaji' }, { event: 'clue' }],
      }, (st) => act('dhol')(st) && !!st.flags['clue.shambhu'] && !st.flags['clue.lalaji']),
      {
        id: 's_fridge',
        label: 'Cursed soda fridge',
        x: 4.6,
        z: -2.3,
        y: 2.6,
        actions: [
          { id: 'look', verb: 'Inspect', dialogue: 'fridge_look' },
          {
            id: 'smack',
            verb: 'Give it a spiritual smack',
            who: 'goti',
            dialogue: 'fridge_goti',
            showIf: (s) => s.objectiveDone('job.ask') && !s.flags['fridge.fixed'],
          },
          {
            id: 'smack_early',
            verb: 'Smack it',
            who: 'goti',
            say: 'Lalaji will yell if I smack his fridge for free. Let’s ask about the job first.',
            showIf: (s) => !s.objectiveDone('job.ask') && !s.flags['fridge.fixed'],
          },
        ],
      },
      {
        id: 's_oil',
        label: 'Shelf of wonders',
        x: -4.3,
        z: -0.6,
        y: 2.4,
        actions: [
          { id: 'look', verb: 'Browse', say: 'Soap, biscuits, matchboxes, rat poison, hair oil, and one dusty cricket bat.' },
          { id: 'read', verb: 'Read the fine print', who: 'sam', dialogue: 'hairoil', once: true },
        ],
      },
      {
        id: 's_phone',
        label: 'Coin phone (PCO)',
        x: -4.4,
        z: 2.4,
        y: 2.2,
        actions: [
          { id: 'look', verb: 'Inspect', say: 'A sign says: “Local calls ₹1. Long calls ₹2. Crying ₹5.”' },
          { id: 'call', verb: 'Call the bank as a millionaire', who: 'pakya', say: 'Hello? Mr. Pakya here. About my account, the big one… they hung up. Rude.' },
        ],
      },
      {
        id: 's_sacks',
        label: 'Rice sacks',
        x: 4.4,
        z: 1.9,
        y: 1.6,
        actions: [
          { id: 'look', verb: 'Inspect', say: 'Fifty kilos of rice. Lalaji has written “COUNTED” on every sack.' },
          { id: 'flop', verb: 'Flop onto them', who: 'maru', say: 'Soft. So soft. I live here now. Lalaji, I live here now.' },
        ],
      },
    ],
  },
);

/* ───────────────── Ritu’s bungalow ───────────────── */
export const ritu = interior(
  'ritu',
  'The yellow bungalow',
  {
    w: 13,
    d: 9,
    wall: '#fff0b3',
    wallLow: '#e9b949',
    floor: 'marble',
    floorA: '#efe7da',
    floorB: '#e0d4c2',
    doorX: 4,
    light: '#fff6dd',
    furniture: [
      { type: 'rug', x: -1.5, z: 0.3, w: 5, d: 3.6, color: '#9d0208' },
      { type: 'sofa', x: -5.6, z: 0.2, rot: Math.PI / 2, w: 3.2, d: 1.1, collide: true, color: '#6a4c93' },
      { type: 'armchair', x: -3.8, z: -3.2, rot: 0.4, w: 1.2, d: 1.1, collide: true, color: '#6a4c93' },
      { type: 'tv', x: 0.5, z: -4.0, rot: 0, w: 1.6, d: 0.7, collide: true },
      { type: 'table', x: -1.7, z: 0.4, w: 1.6, d: 0.9, collide: true },
      { type: 'vase', x: 3.4, z: -3.8, w: 0.6, d: 0.6, collide: true },
      { type: 'frames', x: -2.6, z: -4.45 },
      { type: 'jhula', x: 4.5, z: 1.0, w: 2.4, d: 1.2, collide: true },
      { type: 'plant', x: 5.8, z: -3.7, w: 0.7, d: 0.7, collide: true },
      { type: 'plant', x: -6, z: -3.8, w: 0.7, d: 0.7, collide: true },
      { type: 'fan', x: -1, z: 0, y: 3.5 },
      { type: 'window', x: 2.6, z: -4.44 },
      { type: 'window', x: -6.44, z: -1.5, rot: Math.PI / 2 },
    ],
  },
  {
    exitTo: 'rituGate',
    triggers: [],
    npcs: [
      { id: 'ritu', x: 1.2, z: -1.6, face: 0.3, anim: 'idle', showIf: (st) => !act('rich')(st) },
      { id: 'daadi', x: -3.8, z: -3.0, face: 0.4, anim: 'sit' },
    ],
    interactables: [
      talk('ritu', 'Ritu', 'ritu', [smooth('ritu')], 2.2),
      talk('daadi', 'Daadi', 'daadi', [smooth('daadi')], 2.4),
      {
        id: 'r_vase',
        label: 'Brass vase',
        x: 3.4,
        z: -3.1,
        y: 2.2,
        actions: [{ id: 'look', verb: 'Inspect', say: 'A tall brass vase. It looks expensive, and slightly nervous.' }],
      },
      {
        id: 'r_tv',
        label: 'Big colour TV',
        x: 0.5,
        z: -3.3,
        y: 2.4,
        actions: [
          { id: 'look', verb: 'Inspect', say: 'A huge TV. It gets every channel. Even the ones in languages nobody here speaks.' },
          { id: 'fix', verb: '“Inspect” the cable', who: 'pakya', showIf: has('ritu.cable'), say: '*pushes plug in firmly* Fixed. Professional work. No charge.' },
        ],
      },
      {
        id: 'r_frames',
        label: 'Family photos',
        x: -2.6,
        z: -3.8,
        y: 2.8,
        actions: [{ id: 'look', verb: 'Look', say: 'A grandfather with a very serious moustache. Even in the wedding photo he looks like he is about to fine someone.' }],
      },
      {
        id: 'r_jhula',
        label: 'Indoor swing',
        x: 4.5,
        z: 2.0,
        y: 2.2,
        actions: [
          { id: 'look', verb: 'Inspect', say: 'An indoor swing. Pakya was right. Rich people swing indoors.' },
          { id: 'swing', verb: 'Swing on it', who: 'goti', say: 'Wheeeee! Daadi, this is the best day of my life!' },
        ],
      },
    ],
  },
);

/* ───────────────── The hideout (an old garage) ───────────────── */
export const hideout = interior(
  'hideout',
  'The hideout',
  {
    w: 12,
    d: 9,
    wall: '#8d99ae',
    wallLow: '#4a4e69',
    floor: 'oil',
    floorA: '#6b6560',
    floorB: '#5a5450',
    doorX: 3.5,
    light: '#ffd29d',
    furniture: [
      { type: 'car', x: -2.6, z: -1.6, w: 4.2, d: 2.0, collide: true, color: '#e9c46a' },
      { type: 'planboard', x: 2.4, z: -4.3, text: 'PLAN' },
      { type: 'dartboard', x: -5.94, z: 2.2, rot: Math.PI / 2 },
      { type: 'trunk', x: 5.0, z: -3.4, w: 1.4, d: 0.9, collide: true },
      { type: 'radio', x: 5.0, z: -3.4, y: 0.95 },
      { type: 'tyres', x: -5.0, z: 3.4, w: 1.3, d: 1.3, collide: true },
      { type: 'tyres', x: -5.2, z: -3.7, w: 1.3, d: 1.3, collide: true },
      { type: 'crate', x: 1.4, z: 0.8, w: 0.9, d: 0.9, collide: true, color: '#c97c5d' },
      { type: 'crate', x: 2.4, z: 0.8, w: 0.9, d: 0.9, collide: true, color: '#b56576' },
      { type: 'mattress', x: 4.4, z: 1.2, rot: Math.PI / 2, w: 1.2, d: 2.2, color: '#6d597a' },
      { type: 'tubelight', x: 0, z: -4.44 },
      { type: 'poster', x: -3.6, z: -4.44, text: 'RICH', color: '#2a9d8f' },
    ],
  },
  {
    exitTo: 'hideoutDoor',
    npcs: [],
    triggers: [
      {
        id: 'plan_arrive',
        x: 3.5,
        z: 3.5,
        r: 3,
        when: (s) => s.missionStatus('plan') === 'active' && !s.objectiveDone('plan.go'),
        effects: [{ complete: 'plan.go' }, { bark: 'sam', text: 'Meeting in session. Everyone to the plan board.' }],
      },
    ],
    interactables: [
      {
        id: 'k_board',
        label: 'The plan board',
        x: 2.4,
        z: -3.5,
        y: 3,
        radius: 1.8,
        showIf: (st) => !act('chaos')(st),
        actions: [{ id: 'plan', verb: 'Hold a meeting', dialogue: 'plan_board' }],
      },
      {
        id: 'k_board2',
        label: 'The plan board',
        x: 2.4,
        z: -3.5,
        y: 3,
        radius: 1.8,
        showIf: act('chaos'),
        actions: [
          { id: 'plan', verb: 'Read the plan', dialogue: 'chaos_board', showIf: (st) => st.objectiveDone('chaos.plan') },
          { id: 'plan2', verb: 'Make the plan', who: 'sam', dialogue: 'chaos_board', showIf: (st) => !st.objectiveDone('chaos.plan') },
        ],
      },
      {
        id: 'k_dhol',
        label: 'Rahul’s dhol',
        x: 0.2,
        z: 2.2,
        y: 1.9,
        radius: 1.5,
        showIf: (st) => st.dhol === 'hideout',
        actions: [
          {
            id: 'examine',
            verb: 'Examine the dhol',
            showIf: act('dhol'),
            task: { kind: 'search', duration: 5, hidden: true, label: 'Examining the dhol', onDone: [{ event: 'opened' }], empty: 'It’s a drum. It’s very drum-like. Goti would find a hidden seam.' },
          },
          { id: 'gexamine', verb: 'Feel along the seams', who: 'goti', showIf: act('dhol'), task: { kind: 'search', duration: 5, hidden: true, label: 'Examining the dhol', onDone: [{ event: 'opened' }] } },
          { id: 'take', verb: 'Pick up the real dhol', showIf: (st) => act('chaos')(st) && st.objectiveDone('chaos.plan'), effects: [{ dholTo: 'carry' }] },
        ],
      },
      {
        id: 'k_build',
        label: 'Crates (workbench)',
        x: 1.9,
        z: 1.7,
        y: 1.8,
        radius: 1.5,
        showIf: (st) => act('chaos')(st) && st.m('fake') !== 'hideout' && st.has('tin') && st.has('rope') && st.has('skin'),
        actions: [
          { id: 'look', verb: 'Inspect', say: 'Tin, rope, tabla skin. Goti could turn this into a dhol. Probably.' },
          { id: 'build', verb: 'Build a fake dhol', who: 'goti', task: { kind: 'wait', duration: 7, label: 'Building a fake dhol', onDone: [{ take: 'tin' }, { take: 'rope' }, { take: 'skin' }, { event: 'built' }] } },
        ],
      },
      {
        id: 'k_decoy',
        label: 'Spot for the decoy',
        x: -0.8,
        z: 0.6,
        y: 1.8,
        radius: 1.6,
        showIf: (st) => act('chaos')(st) && st.has('fakedhol'),
        actions: [{ id: 'place', verb: 'Set up the decoy dhol', effects: [{ event: 'placeFake' }] }],
      },
      {
        id: 'k_dart',
        label: 'Dartboard',
        x: -5.3,
        z: 2.2,
        y: 2.6,
        actions: [{ id: 'look', verb: 'Inspect', say: 'Tiwari-ji’s photo is pinned to it. Every dart missed. Even the darts respect him.', effects: [{ secret: 'dartboard' }] }],
      },
      {
        id: 'k_car',
        label: 'The company car',
        x: -2.6,
        z: -0.3,
        y: 2.2,
        radius: 2,
        actions: [
          { id: 'look', verb: 'Inspect', say: 'No engine. No wheels. Very comfortable back seat. Our finest asset.' },
          { id: 'vroom', verb: 'Drive it', who: 'goti', say: 'VROOOOM. We are going so fast. Guys, wave at the people.' },
          { id: 'hide', verb: 'Hide in the boot', who: 'maru', say: 'Nobody look for me. I am a spare tyre now.' },
        ],
      },
      {
        id: 'k_trunk',
        label: 'Goti’s trunk',
        x: 5.0,
        z: -2.6,
        y: 1.8,
        actions: [
          { id: 'open', verb: 'Open', say: 'Goti’s important things: a cricket ball, three keys to nothing, and one rubber chicken.' },
          { id: 'radio', verb: 'Play the radio', who: 'goti', say: '♪ The radio only plays one thing: a dhol beat. Everyone nods. ♪', effects: [{ emote: 'sam', kind: '♪' }, { emote: 'pakya', kind: '♪' }, { emote: 'maru', kind: '♪' }] },
        ],
      },
    ],
  },
);

// Nobody leaves the room until the whole gang is awake (teaches switching first).
house.interactables[0].actions = [
  {
    id: 'exit',
    verb: 'Leave',
    effects: [{ goto: 'street', spawn: 'houseDoor' }, { sfx: 'door' }],
    showIf: (s) => s.objectiveDone('rent.meet') || s.missionStatus('rent') !== 'active',
  },
  {
    id: 'wait',
    verb: 'Leave',
    say: 'Wait. The others are still half asleep. Wake everyone up first: switch to each friend with 1–4.',
    showIf: (s) => !s.objectiveDone('rent.meet') && s.missionStatus('rent') === 'active',
  },
];
