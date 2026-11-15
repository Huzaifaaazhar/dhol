import type { Box, SceneDef } from '../../types';
import { door, has, not, talk, searchSpot, hideSpot, watchSpot, smooth, stall } from './helpers';
import type { StateView } from '../../types';

const act = (m: string) => (s: StateView) => s.missionStatus(m) === 'active';

export type BuildingStyle = 'chawl' | 'bungalow' | 'shop' | 'apartment' | 'cinema' | 'house' | 'garage' | 'filler';

export interface BuildingDef {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  style: BuildingStyle;
  color: string;
  trim: string;
  sign?: { text: string; sub?: string; bg: string; fg: string };
  /** which face is the front: 's' = +z (towards the road for north-side buildings) */
  front: 'n' | 's';
  solid?: boolean;
  signX?: number;
  signW?: number;
}

/** North side of the road has fronts facing +z ('s'); south side faces -z ('n'). */
export const BUILDINGS: BuildingDef[] = [
  { id: 'friends', x: -14, z: -13, w: 10, d: 10, floors: 2, style: 'chawl', color: '#e98aa6', trim: '#fbe7a1', front: 's', sign: { text: 'TIWARI NIWAS', sub: 'Rooms for rent · Bachelors allowed (sadly)', bg: '#f7f1df', fg: '#7a1d3a' } },
  { id: 'bungalow', x: -28, z: -16.25, w: 12, d: 7.5, floors: 2, style: 'bungalow', color: '#f4c430', trim: '#ffffff', front: 's' },
  { id: 'lalaji', x: 13.5, z: -12.5, w: 9, d: 9, floors: 2, style: 'shop', color: '#4fb3a9', trim: '#f2e8cf', front: 's', sign: { text: 'LALAJI GENERAL STORE', sub: 'Everything · Since 1979 · No credit', bg: '#c1121f', fg: '#fff3b0' } },
  { id: 'apartments', x: 27.5, z: -14, w: 13, d: 12, floors: 4, style: 'apartment', color: '#7fa7d8', trim: '#f1e3c8', front: 's', signX: -3.5, signW: 4.6, sign: { text: 'HERO CUT SALON', sub: 'Pappu · Gents only · Gossip free', bg: '#1d3557', fg: '#ffd166' } },
  { id: 'blockA', x: -27.5, z: 16, w: 13, d: 12, floors: 3, style: 'house', color: '#f08a4b', trim: '#fff1d0', front: 'n' },
  { id: 'blockB', x: -14, z: 15.5, w: 10, d: 11, floors: 2, style: 'house', color: '#9bc53d', trim: '#fdf0d5', front: 'n', sign: { text: 'SHARMA NIWAS', bg: '#fdf0d5', fg: '#335c67' } },
  { id: 'cinema', x: 29, z: 15, w: 12, d: 12, floors: 3, style: 'cinema', color: '#e5989b', trim: '#ffcdb2', front: 'n', sign: { text: 'SHREE TALKIES', sub: 'Closed for renovation since 1999', bg: '#3d405b', fg: '#f2cc8f' } },
  { id: 'f12', x: -20, z: 26.5, w: 10, d: 7, floors: 2, style: 'filler', color: '#8d99ae', trim: '#edf2f4', front: 'n' },
  // fillers that close off the map edges
  { id: 'f1', x: -38, z: -14, w: 4, d: 12, floors: 3, style: 'filler', color: '#c9ada7', trim: '#f2e9e4', front: 's' },
  { id: 'f2', x: 37, z: -14, w: 6, d: 12, floors: 3, style: 'filler', color: '#b5838d', trim: '#ffe5d9', front: 's' },
  { id: 'f3', x: -37.5, z: 16, w: 5, d: 12, floors: 2, style: 'filler', color: '#a3b18a', trim: '#fefae0', front: 'n' },
  { id: 'f4', x: 38, z: 15, w: 6, d: 12, floors: 2, style: 'filler', color: '#cdb4db', trim: '#fff', front: 'n' },
  { id: 'f5', x: -31, z: 27, w: 10, d: 8, floors: 2, style: 'filler', color: '#e9c46a', trim: '#fff', front: 'n' },
  { id: 'f6', x: -11.5, z: 27.5, w: 7, d: 7, floors: 2, style: 'filler', color: '#90be6d', trim: '#fff', front: 'n' },
  { id: 'f7', x: 15, z: 27, w: 14, d: 8, floors: 3, style: 'filler', color: '#f4a261', trim: '#fff', front: 'n' },
  { id: 'f8', x: 31, z: 27, w: 14, d: 8, floors: 2, style: 'filler', color: '#83c5be', trim: '#fff', front: 'n' },
  { id: 'f9', x: -1, z: -26, w: 70, d: 6, floors: 4, style: 'filler', color: '#d8a48f', trim: '#fff', front: 's', solid: false },
];

export const POLES = [
  [-33, -4.6], [-20, -4.6], [-7, -4.6], [7, -4.6], [20, -4.6], [33, -4.6],
  [-33, 4.6], [-20, 4.6], [-7, 4.6], [7, 4.6], [20, 4.6], [33, 4.6],
] as const;

export const TREES = [
  [-23.2, -10.2, 1.1],
  [17, 18, 1.5],
  [-37, 6.2, 1.2],
  [37, 6.4, 1.1],
  [7, 21, 1.0],
] as const;

/** The yellow bungalow's garden wall, with a gate gap at x[-30,-26]. */
const gardenWalls: Box[] = [
  { x: -33, z: -8.2, w: 6, d: 0.4 },
  { x: -23.5, z: -8.2, w: 5, d: 0.4 },
  { x: -34.1, z: -10.3, w: 0.4, d: 4.4 },
  { x: -21.9, z: -10.3, w: 0.4, d: 4.4 },
];

const props: Box[] = [
  { x: 12, z: 10.6, w: 3.4, d: 1.4 }, // tea stall cart
  { x: 9.2, z: 14.2, w: 2.2, d: 0.6 }, // bench
  { x: 14.6, z: 14.2, w: 2.2, d: 0.6 },
  { x: 18.2, z: 15.4, w: 1.1, d: 1.1 }, // carrom board
  { x: -5.6, z: 13, w: 1.6, d: 2.8 }, // sabzi cart
  { x: -30, z: 6.4, w: 3, d: 1.5 }, // parked auto
  { x: -17.5, z: -6.6, w: 1.8, d: 0.7 }, // scooter
  { x: 19.5, z: -12.5, w: 1, d: 1 }, // blue drum
  { x: 23.6, z: -7.2, w: 0.9, d: 0.9 }, // barber chair
  { x: 0, z: 20.6, w: 0.5, d: 0.3 }, // stumps
  { x: -31.6, z: -10.4, w: 2.2, d: 1.2 }, // garden swing
  ...TREES.map(([x, z]) => ({ x, z, w: 0.8, d: 0.8 })),
  ...POLES.map(([x, z]) => ({ x, z, w: 0.35, d: 0.35 })),
];

export const street: SceneDef = {
  id: 'street',
  name: 'Shanti Nagar, Lane 4',
  interior: false,
  zoom: 44,
  bounds: { minX: -40, maxX: 40, minZ: -23, maxZ: 31 },
  colliders: [
    ...BUILDINGS.filter((b) => b.solid !== false).map((b) => ({ x: b.x, z: b.z, w: b.w, d: b.d })),
    ...gardenWalls,
    ...props,
  ],
  spawns: {
    houseDoor: { x: -14, z: -6.4, face: 0 },
    shopDoor: { x: 13.5, z: -6.6, face: 0 },
    rituGate: { x: -28, z: -10.9, face: 0 },
    hideoutDoor: { x: -20, z: 17.6, face: Math.PI },
    cinemaDoor: { x: 27.8, z: 22.2, face: 0 },
  },
  npcs: [
    {
      id: 'tiwari',
      x: -14,
      z: -4.6,
      face: Math.PI,
      anim: 'idle',
      alt: { when: has('landlord.cleared'), x: -10.6, z: -7.1, face: 0.3 },
    },
    { id: 'bablu', x: 12, z: 9.3, face: 0, anim: 'chai' },
    { id: 'pappu', x: 25, z: -6.9, face: -0.4, anim: 'idle' },
    { id: 'sharma', x: 17.1, z: 15.4, face: Math.PI / 2, anim: 'carrom' },
    { id: 'verma', x: 19.3, z: 15.4, face: -Math.PI / 2, anim: 'carrom' },
    { id: 'chintu', x: 0, z: 13.5, face: 0, anim: 'cricket' },
    { id: 'pinky', x: 0, z: 19.6, face: Math.PI, anim: 'cricket' },
    { id: 'sabziwali', x: -7.2, z: 13, face: Math.PI / 2, anim: 'idle' },
    { id: 'gauri', x: -6.2, z: 6.3, face: 0.6, anim: 'sit' },
    { id: 'moti', x: 8.6, z: 12, face: 1, wander: 3 },
    { id: 'daadi', x: -26.4, z: -11.6, face: 0.2, anim: 'idle', showIf: not('ritu.in') },
  ],
  interactables: [
    {
      ...door('houseDoor', 'Home', -14, -7.9, [{ goto: 'house', spawn: 'door' }, { sfx: 'door' }]),
    },
    door('shopDoor', 'Lalaji General Store', 13.5, -7.9, [{ goto: 'shop', spawn: 'door' }, { sfx: 'door' }]),
    door('hideoutDoor', 'The hideout', -20.3, 19.2, [{ goto: 'hideout', spawn: 'door' }, { sfx: 'door' }]),
    {
      id: 'rituDoor',
      label: 'Yellow bungalow',
      x: -28,
      z: -12,
      y: 2.6,
      radius: 1.8,
      actions: [
        { id: 'knock', verb: 'Knock', dialogue: 'ritu_gate', showIf: not('ritu.in') },
        { id: 'enter', verb: 'Enter', effects: [{ goto: 'ritu', spawn: 'door' }, { sfx: 'door' }], showIf: has('ritu.in') },
      ],
    },
    talk('tiwari', 'Tiwari-ji', 'tiwari', [stall('tiwari'), smooth('tiwari')]),
    talk('bablu', 'Bablu’s chai', 'bablu', [smooth('bablu')], 3.2),
    talk('pappu', 'Pappu the barber', 'pappu', [{ id: 'herocut', verb: 'Talk him into a free haircut', who: 'pakya', dialogue: 'pappu_pakya', once: true }, smooth('pappu')]),
    {
      id: 'cinemaDoor',
      label: 'Cinema back door',
      x: 27.8,
      z: 21.6,
      y: 2.6,
      radius: 1.7,
      actions: [
        { id: 'enter', verb: 'Go in', showIf: has('cinema.open'), effects: [{ goto: 'cinema', spawn: 'door' }, { sfx: 'door' }] },
        { id: 'try', verb: 'Try the door', showIf: not('cinema.open'), say: 'Chained shut. The chain has rusted into a kind of sculpture.' },
        {
          id: 'vent',
          verb: 'Squeeze through the broken vent',
          who: 'goti',
          showIf: (s) => !s.flags['cinema.open'] && s.missionStatus('reveal') === 'active',
          say: 'Breathe in… breathe in more… I’M IN. Opening the door from inside!',
          effects: [{ flag: 'cinema.open' }, { flag: 'cinema.vent' }, { complete: 'reveal.cinema' }, { goto: 'cinema', spawn: 'door' }, { sfx: 'whoosh' }],
        },
      ],
    },
    /* ── Part 2 people ── */
    talk('ritu', 'Ritu', 'ritu2', [smooth('ritu')], 2.4),
    talk('jai', 'Jai', 'jai', [], 2.4),
    talk('zikomo', 'Zikomo', 'zikomo', [stall('zikomo')], 2.6),
    talk('spanner', 'Spanner', 'goon', [], 1.8),
    talk('bhaloo', 'Bhaloo', 'goon', [], 1.8),
    talk('shambhu', 'Shambhu the kabadiwala', 'shambhu', [
      {
        id: 'cart',
        verb: 'Search his cart for the dhol',
        who: 'goti',
        showIf: (s) => s.dhol === 'cart',
        task: { kind: 'search', duration: 6, hidden: true, noise: 0.3, target: 'shambhu', label: 'Searching Shambhu’s cart', empty: 'Bottles, newspapers, a tyre. Goti would find it: he can smell heavy things.' },
      },
    ], 2.6),
    {
      id: 'zcar',
      label: 'Zikomo’s white car',
      x: 17.2,
      z: 6.2,
      y: 2.2,
      radius: 2.2,
      showIf: (s) => s.missionStatus('finale') === 'active' && !!s.flags['chicken.zikomo'] && !s.has('ticket'),
      actions: [
        { id: 'look', verb: 'Look inside', say: 'White seats. A white steering wheel. And on the back seat: a rubber chicken, wearing a seatbelt.' },
        {
          id: 'grab',
          verb: 'Rescue the rubber chicken',
          who: 'goti',
          task: { kind: 'search', duration: 5, noise: 0.4, target: 'zikomo', label: 'Rescuing the chicken', onDone: [{ give: 'ticket' }, { toast: 'Chicken rescued. Ticket 4444 is safe in its beak.' }, { complete: 'finale.chicken' }, { sfx: 'pop' }] },
        },
      ],
    },
    /* ── Part 2 searching ── */
    searchSpot('srch_swing', 'Under the swing', -32.7, -10.6, {
      duration: 6,
      hidden: true,
      noise: 0.15,
      target: 'daadi',
      onDone: [{ toast: 'A page from Ritu’s notebook: “I like: rain, hot jalebi, Bhaiya’s dhol songs. I don’t like: liars.”' }, { flag: 'likes.jalebi' }, { flag: 'likes.songs' }, { flag: 'likes.liars' }, { event: 'like' }],
      empty: 'Grass. Some more grass. Goti would find something here, he has a nose for nonsense.',
    }, (s) => act('rich')(s) && !(s.flags['likes.jalebi'] && s.flags['likes.songs'])),
    searchSpot('srch_shrine', 'Corner shrine', -35.4, 7.0, {
      duration: 4,
      onDone: [{ give: 'marigolds' }],
    }, (s) => act('rich')(s) && !s.has('marigolds') && !s.flags['move.goti']),
    searchSpot('jai_bag', 'Jai’s bag', -22.3, -6.3, {
      duration: 5,
      hidden: true,
      noise: 0.2,
      target: 'jai',
      onDone: [{ give: 'photo' }, { toast: 'A photo: Jai and a laughing young man with a dhol. On the back: “Rahul & me, Dubai.”' }, { event: 'proof' }],
      empty: 'Clothes, a phone charger, three combs. Goti would find a secret pocket in a sock.',
    }, (s) => act('jai')(s) && !s.objectiveDone('jai.proof')),
    searchSpot('junk', 'Junk pile behind the cinema', 22.2, 19.4, {
      duration: 6,
      hidden: true,
      noise: 0.3,
      onDone: [{ event: 'found' }],
      empty: 'Broken chairs, a bicycle wheel, a smell. Goti would know how to dig through this.',
    }, (s) => act('dhol')(s) && !!s.flags.paws && s.dhol === 'junk'),
    {
      id: 'dhol_lane',
      label: 'Rahul’s dhol',
      x: 22.2,
      z: 19.4,
      y: 1.8,
      radius: 1.8,
      showIf: (s) => s.dhol === 'lane',
      actions: [{ id: 'lift', verb: 'Lift the dhol', effects: [{ dholTo: 'carry' }, { event: 'pickup' }] }],
    },
    searchSpot('srch_tin', 'Bablu’s biscuit tins', 14.0, 11.2, { duration: 5, noise: 0.5, target: 'bablu', onDone: [{ give: 'tin' }] }, (s) => act('chaos')(s) && !s.has('tin') && s.m('fake') !== 'hideout'),
    searchSpot('srch_rope', 'Laundry line', -20.1, 13.4, { duration: 4, noise: 0.2, target: 'sabziwali', onDone: [{ give: 'rope' }] }, (s) => act('chaos')(s) && !s.has('rope') && s.m('fake') !== 'hideout'),
    searchSpot('srch_skin', 'Pappu’s junk box', 28.2, -7.5, { duration: 5, noise: 0.35, target: 'pappu', onDone: [{ give: 'skin' }] }, (s) => act('chaos')(s) && !s.has('skin') && s.m('fake') !== 'hideout'),
    /* ── Part 2 hiding and watching ── */
    hideSpot('hide_cart', 'Behind the vegetable cart', -4.1, 13.4),
    hideSpot('hide_auto', 'Inside the parked auto', -30, 7.9),
    hideSpot('hide_cow', 'Behind Gauri the cow', -7.8, 7.4),
    hideSpot('hide_scooter', 'Behind the scooter', -17.5, -5.4),
    hideSpot('hide_drum', 'Behind the blue drum', 19.5, -11.0),
    hideSpot('hide_sign', 'Behind the lane sign', -18.2, 9.9),
    hideSpot('hide_bench', 'Behind the plaza bench', 14.6, 15.2),
    hideSpot('hide_barber', 'Under a hot towel in the barber chair', 23.6, -6.4),
    watchSpot('watch_lane', 'Mouth of the lane', -20.0, 10.6),
    watchSpot('watch_cross', 'Up the north road', -6.2, -10.5),
    watchSpot('watch_plaza', 'Behind the plaza benches', 9.4, 15.6),
    talk('sharma', 'Carrom uncles', 'carrom', [], 2.4),
    talk('chintu', 'Street cricket', 'kids'),
    talk('sabziwali', 'Kamla’s vegetables', 'sabzi'),
    talk('gauri', 'Gauri the cow', 'cow', [{ id: 'heart', verb: 'Have a heart-to-heart', who: 'goti', dialogue: 'cow_goti', once: true }]),
    talk('moti', 'Moti', 'dog'),
    {
      id: 'posters',
      label: 'Poster wall',
      x: -7.8,
      z: -13.5,
      y: 3.4,
      radius: 2.6,
      actions: [{ id: 'read', verb: 'Read the posters', dialogue: 'posters' }],
    },
    {
      id: 'scooter',
      label: 'Pakya’s “vintage” scooter',
      x: -17.5,
      z: -6.6,
      y: 1.6,
      actions: [
        { id: 'look', verb: 'Inspect', say: 'It has not started since 2004. Pakya calls it “resting”.' },
        { id: 'kick', verb: 'Kick-start it. Repeatedly.', who: 'goti', say: '*kick* *kick* *KICK* …it plays half a wedding song and dies!', effects: [{ sfx: 'honk' }, { secret: 'scooter' }] },
      ],
    },
    {
      id: 'pigeons',
      label: 'Pigeons',
      x: 6.4,
      z: -6.3,
      y: 1.2,
      actions: [
        { id: 'look', verb: 'Inspect', say: 'Forty pigeons. All of them staring. Judging.' },
        { id: 'shoo', verb: 'Shoo them away', who: 'maru', say: 'SHOO! SHOO! …why are they coming TOWARDS me?!', effects: [{ sfx: 'scream' }, { secret: 'pigeons' }, { flag: 'pigeons.flew' }] },
      ],
    },
    {
      id: 'drum',
      label: 'Blue water drum',
      x: 19.5,
      z: -11.4,
      y: 1.6,
      actions: [{ id: 'peek', verb: 'Peek inside', dialogue: 'drum', once: true }],
    },
    {
      id: 'auto',
      label: 'Parked auto-rickshaw',
      x: -30,
      z: 6.4,
      y: 2,
      radius: 2.2,
      actions: [
        { id: 'look', verb: 'Inspect', say: 'The driver has been asleep in the back since 1998. Nobody wakes him.' },
        { id: 'honk', verb: 'Honk the horn', who: 'goti', say: 'Peep peep! …he did not even move. Respect.', effects: [{ sfx: 'honk' }] },
      ],
    },
    {
      id: 'lanesign',
      label: 'Lane sign',
      x: -18.7,
      z: 8.4,
      y: 2.8,
      actions: [{ id: 'read', verb: 'Read', dialogue: 'lane_sign' }],
    },
    {
      id: 'swing',
      label: 'Garden swing',
      x: -31.6,
      z: -9.3,
      y: 1.8,
      actions: [
        { id: 'look', verb: 'Inspect', say: 'A swing. In a garden. Rich people have outdoor furniture for fun.' },
        { id: 'sit', verb: 'Hide behind the swing', who: 'maru', say: 'If Daadi can’t see me, Daadi can’t hit me.' },
      ],
    },
  ],
  triggers: [
    { id: 'landlord', x: -14, z: -6.2, r: 2.2, when: not('landlord.cleared'), dialogue: 'tiwari' },
  ],
};
