import type { Box, SceneDef, SceneId } from '../../types';
import { has, talk, searchSpot, smooth, stall, hideSpot } from './helpers';
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
  | 'window'
  | 'lockers'
  | 'seats'
  | 'booth'
  | 'cobweb'
  | 'reels';

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
        label: 'Bahar jao',
        x: room.doorX,
        z: hd - 0.2,
        y: 2.6,
        radius: 1.3,
        actions: [{ id: 'exit', verb: 'Niklo', effects: [{ goto: 'street', spawn: rest.exitTo }, { sfx: 'door' }] }],
      },
      // the postman delivers indoors too
      talk('postman', 'Ramesh daakiya', 'postman', [], 1.6),
      // goons may follow you in here: the corner beside the door is out of their sight
      ...(['house', 'shop', 'cinema'].includes(id) ? [hideSpot(`hide_${id}`, 'Darwaaze ke peeche', room.doorX + (room.doorX > 0 ? -1.9 : 1.9), hd - 0.8)] : []),
      ...rest.interactables,
    ],
  };
}

/* ───────────────── The friends’ rented room ───────────────── */
export const house = interior(
  'house',
  'Kiraaye ka kamra',
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
        label: 'Sam ka plan board',
        x: -1.8,
        z: -3.6,
        y: 2.8,
        actions: [
          { id: 'read', verb: 'Padho', say: '“Step 1: Ameer bano. Step 2: Ameer raho.” Step 1 pe gola bana hai. Do baar.' },
          { id: 'plan', verb: 'Naya plan jodo', who: 'sam', say: 'Step 1b: Pata karo ki step 1 kaise hota hai.' },
        ],
      },
      {
        id: 'h_fridge',
        label: 'Fridge',
        x: 1.2,
        z: -3.1,
        y: 2.4,
        actions: [
          { id: 'open', verb: 'Kholo', say: 'Ek nimbu, aadhi botal paani, aur ek parchi: “Mera nimbu mat khaana. — Goti”.' },
          { id: 'lemon', verb: 'Nimbu khaao', who: 'goti', say: 'Khatta. BAHUT khatta. Paisa wasool. Waise bhi mera hi nimbu tha.' },
        ],
      },
      {
        id: 'h_cal',
        label: 'Calendar',
        x: 2.7,
        z: -3.7,
        y: 2.8,
        actions: [{ id: 'read', verb: 'Padho', say: 'Ek taareekh pe laal gola. Teen baar. Dongre Mama ne khud lagaaya, khidki ke bahar se.' }],
      },
      {
        id: 'h_mirror',
        label: 'Toota aaina',
        x: -5.3,
        z: 0,
        y: 2.6,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Ek kone se toota hua. Hamare bhavishya ki tarah.' },
          { id: 'admire', verb: 'Khud ko niharo', who: 'pakya', say: 'Hello, hero. Haan, tum. Kabhi mat badalna.', effects: [{ secret: 'mirror' }] },
        ],
      },
      {
        id: 'h_charpai',
        label: 'Maru ki charpai',
        x: -4.0,
        z: 1.6,
        y: 1.4,
        actions: [
          {
            id: 'hidedhol',
            verb: 'Asli dhol iske neeche chhupaao',
            showIf: (st) => act('chaos')(st) && st.dhol === `carried:${st.active}`,
            effects: [{ dholTo: 'house' }, { event: 'hideReal' }],
          },
          {
            id: 'knock',
            verb: 'Dhol pe thok ke dekho',
            who: 'goti',
            showIf: (st) => st.dhol === 'house' && act('reveal')(st) && !st.flags['drum.open'],
            dialogue: 'knock',
          },
          {
            id: 'knockany',
            verb: 'Dhol pe thoko',
            showIf: (st) => st.dhol === 'house' && act('reveal')(st) && !st.flags['drum.open'] && st.active !== 'goti',
            dialogue: 'knock',
          },
          { id: 'pull', verb: 'Dhol bahar nikaalo', showIf: (st) => st.dhol === 'house' && !act('chaos')(st), effects: [{ dholTo: 'carry' }] },
          { id: 'search', verb: 'Neeche dekho', once: true, say: '₹50 ka note! Maru ne “emergency ke liye” chhupaaya tha. Ye emergency hai.', effects: [{ money: 50 }, { secret: 'charpai' }] },
          { id: 'hide', verb: 'Iske neeche chhupo', who: 'maru', say: 'Main nahi hiloonga, toh karza mujhe dekh nahi paayega.' },
        ],
      },
      {
        id: 'h_tv',
        label: 'TV',
        x: 3.9,
        z: -0.6,
        y: 2.0,
        actions: [
          { id: 'watch', verb: 'Dekho', say: 'Ek channel. Cooking show. Hamare paas pakaane ko kuch nahi.' },
          { id: 'smack', verb: 'Thappad maaro', who: 'goti', say: '*DHAPP* Ab do channel aate hain. Dono cooking show.', effects: [{ sfx: 'thud' }] },
        ],
      },
      {
        id: 'h_stove',
        label: 'Chulha',
        x: 5.1,
        z: -2.8,
        y: 1.8,
        actions: [{ id: 'look', verb: 'Dekho', say: 'Chulhe ne Diwali ke baad khaana nahi dekha. Bhoolne laga hai ki khaana kya hota hai.' }],
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
      searchSpot('s_shelf2', 'Peeche ki shelf', 2.6, -2.9, { duration: 4, noise: 0.4, target: 'lalaji', onDone: [{ give: 'crackers' }, { toast: 'Pataakhe! Goti ek jala ke Zikomo ke aadmiyon ko galat taraf bhej sakta hai (bahar F).' }] }, (st) => act('zikomo')(st) && !st.has('crackers')),
      searchSpot('s_ledger', 'Lalaji ka bahi-khaata', -2.8, -0.2, {
        duration: 5,
        target: 'lalaji',
        onDone: [{ toast: 'Bahi-khaata: “Dhol, Shambhu se, ₹60. Cricket waale bachchon ko udhaar. Wapas aaya: ek ball (tooti).”' }, { flag: 'clue.lalaji' }, { event: 'clue' }],
      }, (st) => act('dhol')(st) && !!st.flags['clue.shambhu'] && !st.flags['clue.lalaji']),
      {
        id: 's_fridge',
        label: 'Bhootiya soda fridge',
        x: 4.6,
        z: -2.3,
        y: 2.6,
        actions: [
          { id: 'look', verb: 'Dekho', dialogue: 'fridge_look' },
          {
            id: 'smack',
            verb: 'Ek ruhaani thappad do',
            who: 'goti',
            dialogue: 'fridge_goti',
            showIf: (s) => s.objectiveDone('job.ask') && !s.flags['fridge.fixed'],
          },
          {
            id: 'smack_early',
            verb: 'Thappad maaro',
            who: 'goti',
            say: 'Free mein fridge ko thappad maara toh Lalaji chillaayenge. Pehle kaam ke baare mein poochh lete hain.',
            showIf: (s) => !s.objectiveDone('job.ask') && !s.flags['fridge.fixed'],
          },
        ],
      },
      {
        id: 's_oil',
        label: 'Ajoobon ki shelf',
        x: -4.3,
        z: -0.6,
        y: 2.4,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Saabun, biscuit, maachis, chooha-maar dawa, baalon ka tel, aur ek dhool bhara cricket bat.' },
          { id: 'read', verb: 'Chhote akshar padho', who: 'sam', dialogue: 'hairoil', once: true },
        ],
      },
      {
        id: 's_phone',
        label: 'Sikke wala phone (PCO)',
        x: -4.4,
        z: 2.4,
        y: 2.2,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Takhti pe likha hai: “Local call ₹1. Lambi call ₹2. Rona ₹5.”' },
          { id: 'call', verb: 'Crorepati ban ke bank ko phone karo', who: 'pakya', say: 'Hello? Mr. Pakya bol raha hoon. Mere account ke baare mein, bada wala… phone kaat diya. Badtameez.' },
        ],
      },
      {
        id: 's_sacks',
        label: 'Chaawal ki boriyaan',
        x: 4.4,
        z: 1.9,
        y: 1.6,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Pachaas kilo chaawal. Lalaji ne har bori pe likha hai “GINA HUA”.' },
          { id: 'flop', verb: 'Un pe dhadaam se gir jao', who: 'maru', say: 'Naram. Kitna naram. Ab main yahin rehta hoon. Lalaji, ab main yahin rehta hoon.' },
        ],
      },
    ],
  },
);

/* ───────────────── Ritu’s bungalow ───────────────── */
export const ritu = interior(
  'ritu',
  'Peela bungalow',
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
      // Dr. Satyadev Tripathi reads his textile journals on the sofa
      { id: 'dadaji', x: -4.7, z: 1.4, face: Math.PI / 2, anim: 'read' },
    ],
    interactables: [
      talk('ritu', 'Ritu', 'ritu', [smooth('ritu')], 2.2),
      talk('daadi', 'Elizabeth Daadi', 'daadi', [smooth('daadi')], 2.4),
      talk('dadaji', 'Dadaji (Dr. Tripathi)', 'dadaji', [], 2.0),
      {
        id: 'r_vase',
        label: 'Peetal ka guldaan',
        x: 3.4,
        z: -3.1,
        y: 2.2,
        actions: [{ id: 'look', verb: 'Dekho', say: 'Lamba peetal ka guldaan. Mehenga lagta hai, aur thoda ghabraaya hua.' }],
      },
      {
        id: 'r_tv',
        label: 'Bada rangeen TV',
        x: 0.5,
        z: -3.3,
        y: 2.4,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Bahut bada TV. Saare channel aate hain. Woh bhi jinki bhaasha yahaan koi nahi bolta.' },
          { id: 'fix', verb: 'Cable ki “jaanch” karo', who: 'pakya', showIf: has('ritu.cable'), say: '*plug zor se lagaata hai* Theek. Professional kaam. Koi charge nahi.' },
        ],
      },
      {
        id: 'r_frames',
        label: 'Parivaar ki tasveerein',
        x: -2.6,
        z: -3.8,
        y: 2.8,
        actions: [{ id: 'look', verb: 'Dekho', say: 'Dadaji ki shaadi ki tasveer. Bahut gambhir moonchh. Shaadi mein bhi aise lag rahe hain jaise kisi ka kapda check karne waale hain.' }],
      },
      {
        id: 'r_jhula',
        label: 'Ghar ka jhoola',
        x: 4.5,
        z: 2.0,
        y: 2.2,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Ghar ke andar jhoola. Pakya sahi tha. Ameer log andar jhoolte hain.' },
          { id: 'swing', verb: 'Jhoolo', who: 'goti', say: 'Wheeeee! Daadi, ye meri zindagi ka sabse achha din hai!' },
        ],
      },
    ],
  },
);

/* ───────────────── The hideout (an old garage) ───────────────── */
export const hideout = interior(
  'hideout',
  'Adda',
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
        effects: [{ complete: 'plan.go' }, { bark: 'sam', text: 'Meeting chal rahi hai. Sab plan board pe.' }],
      },
    ],
    interactables: [
      {
        id: 'k_board',
        label: 'Plan board',
        x: 2.4,
        z: -3.5,
        y: 3,
        radius: 1.8,
        showIf: (st) => !act('chaos')(st),
        actions: [{ id: 'plan', verb: 'Meeting karo', dialogue: 'plan_board' }],
      },
      {
        id: 'k_board2',
        label: 'Plan board',
        x: 2.4,
        z: -3.5,
        y: 3,
        radius: 1.8,
        showIf: act('chaos'),
        actions: [
          { id: 'plan', verb: 'Plan padho', dialogue: 'chaos_board', showIf: (st) => st.objectiveDone('chaos.plan') },
          { id: 'plan2', verb: 'Plan banao', who: 'sam', dialogue: 'chaos_board', showIf: (st) => !st.objectiveDone('chaos.plan') },
        ],
      },
      {
        id: 'k_dhol',
        label: 'Rahul ka dhol',
        x: 0.2,
        z: 2.2,
        y: 1.9,
        radius: 1.5,
        showIf: (st) => st.dhol === 'hideout',
        actions: [
          {
            id: 'examine',
            verb: 'Dhol ki jaanch karo',
            showIf: act('dhol'),
            task: { kind: 'search', duration: 5, hidden: true, label: 'Dhol ki jaanch', onDone: [{ event: 'opened' }], empty: 'Dhol hai. Bilkul dhol jaisa. Goti chhupi silaai dhoondh leta.' },
          },
          { id: 'gexamine', verb: 'Silaai tatolo', who: 'goti', showIf: act('dhol'), task: { kind: 'search', duration: 5, hidden: true, label: 'Dhol ki jaanch', onDone: [{ event: 'opened' }] } },
          { id: 'take', verb: 'Asli dhol uthaao', showIf: (st) => (act('chaos')(st) && st.objectiveDone('chaos.plan')) || act('reveal')(st), effects: [{ dholTo: 'carry' }] },
          { id: 'knock', verb: 'Dhol pe thok ke dekho', who: 'goti', showIf: (st) => act('reveal')(st) && !st.flags['drum.open'], dialogue: 'knock' },
        ],
      },
      {
        id: 'k_packet',
        label: 'Rahul ka band packet',
        x: 1.4,
        z: 1.6,
        y: 1.9,
        radius: 1.6,
        showIf: (st) => act('reveal')(st) && st.has('packet'),
        actions: [{ id: 'open', verb: 'Rahul ka packet kholo', dialogue: 'packet' }],
      },
      {
        id: 'k_build',
        label: 'Peti (kaam ki mez)',
        x: 1.9,
        z: 1.7,
        y: 1.8,
        radius: 1.5,
        showIf: (st) => act('chaos')(st) && st.m('fake') !== 'hideout' && st.has('tin') && st.has('rope') && st.has('skin'),
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Dabba, rassi, tabla ki khaal. Goti isse dhol bana sakta hai. Shayad.' },
          { id: 'build', verb: 'Nakli dhol banao', who: 'goti', task: { kind: 'wait', duration: 7, label: 'Nakli dhol ban raha hai', onDone: [{ take: 'tin' }, { take: 'rope' }, { take: 'skin' }, { event: 'built' }] } },
        ],
      },
      {
        id: 'k_decoy',
        label: 'Nakli dhol ki jagah',
        x: -0.8,
        z: 0.6,
        y: 1.8,
        radius: 1.6,
        showIf: (st) => act('chaos')(st) && st.has('fakedhol'),
        actions: [{ id: 'place', verb: 'Nakli dhol rakho', effects: [{ event: 'placeFake' }] }],
      },
      {
        id: 'k_dart',
        label: 'Dartboard',
        x: -5.3,
        z: 2.2,
        y: 2.6,
        actions: [{ id: 'look', verb: 'Dekho', say: 'Isme Dongre Mama ki photo lagi hai. Har dart chook gaya. Dart bhi police se darte hain.', effects: [{ secret: 'dartboard' }] }],
      },
      {
        id: 'k_car',
        label: 'Company ki gaadi',
        x: -2.6,
        z: -0.3,
        y: 2.2,
        radius: 2,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Engine nahi. Pahiye nahi. Peechhe ki seat bahut aaramdaayak. Hamari sabse keemti sampatti.' },
          { id: 'vroom', verb: 'Chalaao', who: 'goti', say: 'VROOOOM. Kitni tez ja rahe hain. Doston, logon ko haath hilaao.' },
          { id: 'hide', verb: 'Dikki mein chhupo', who: 'maru', say: 'Mujhe koi mat dhoondhna. Ab main stepney hoon.' },
        ],
      },
      {
        id: 'k_trunk',
        label: 'Goti ka bakas',
        x: 5.0,
        z: -2.6,
        y: 1.8,
        actions: [
          { id: 'open', verb: 'Kholo', say: 'Goti ki zaroori cheezein: ek cricket ball, teen chaabiyaan jo kuch nahi kholti, aur ek rubber ki murgi.' },
          {
            id: 'chicken',
            verb: 'Rubber ki murgi dabaao',
            showIf: (st) => !!st.flags['locker.open'] && !st.flags['chicken.zikomo'] && !st.has('ticket'),
            say: '*pyaank* …*pyaank* …uski chonch se ek muda hua lottery ticket nikalta hai. Number 4444.',
            effects: [{ give: 'ticket' }, { sfx: 'pop' }],
          },
          { id: 'radio', verb: 'Radio chalaao', who: 'goti', say: '♪ Radio pe sirf ek hi cheez aati hai: dhol ki thaap. Sab sar hilaate hain. ♪', effects: [{ emote: 'sam', kind: '♪' }, { emote: 'pakya', kind: '♪' }, { emote: 'maru', kind: '♪' }] },
        ],
      },
    ],
  },
);

// Nobody leaves the room until the whole gang is awake (teaches switching first).
house.interactables[0].actions = [
  {
    id: 'exit',
    verb: 'Niklo',
    effects: [{ goto: 'street', spawn: 'houseDoor' }, { sfx: 'door' }],
    showIf: (s) => s.objectiveDone('rent.meet') || s.missionStatus('rent') !== 'active',
  },
  {
    id: 'wait',
    verb: 'Niklo',
    say: 'Ruko. Baaki sab aadhe so rahe hain. Pehle sabko uthaao: 1–4 dabake har dost ko baari baari chuno.',
    showIf: (s) => !s.objectiveDone('rent.meet') && s.missionStatus('rent') === 'active',
  },
];

/* ───────────────── Shree Talkies, closed since 1999 ───────────────── */
export const cinema = interior(
  'cinema',
  'Shree Talkies (band)',
  {
    w: 14,
    d: 10,
    wall: '#6b2d3f',
    wallLow: '#2d1b2e',
    floor: 'tiles',
    floorA: '#7a2e3a',
    floorB: '#3a1c24',
    doorX: 4.5,
    light: '#ffc87a',
    furniture: [
      { type: 'lockers', x: -3.2, z: -4.55, w: 6.4, d: 0.8, collide: true },
      { type: 'counter', x: 3.4, z: -3.2, w: 3.2, d: 0.9, collide: true },
      { type: 'seats', x: -2.4, z: 2.0, w: 6.4, d: 2.8, collide: true },
      { type: 'booth', x: -6.6, z: -1.4, rot: Math.PI / 2 },
      { type: 'reels', x: 6.0, z: -4.0, w: 0.9, d: 0.9, collide: true },
      { type: 'cobweb', x: -6.9, z: -4.9 },
      { type: 'cobweb', x: 6.9, z: -4.9, rot: Math.PI / 2 },
      { type: 'poster', x: 1.0, z: -4.94, text: 'HERO', color: '#e63946' },
      { type: 'poster', x: -6.94, z: 2.6, rot: Math.PI / 2, text: 'GYM', color: '#ffb400' },
      { type: 'tubelight', x: 3, z: -4.94 },
      { type: 'fan', x: 0, z: 0.5, y: 3.6 },
    ],
  },
  {
    exitTo: 'cinemaDoor',
    triggers: [],
    // Rahul is gone; his cassette recorder in the projection booth still has his voice on it
    npcs: [],
    interactables: [
      {
        id: 'c_locker47',
        label: 'Locker 47',
        x: -1.6,
        z: -3.7,
        y: 2.6,
        radius: 1.5,
        actions: [
          { id: 'open', verb: 'Locker 47 kholo', showIf: (st) => st.has('lockerkey') && !st.flags['locker.open'], dialogue: 'locker' },
          { id: 'locked', verb: 'Kholne ki koshish karo', showIf: (st) => !st.has('lockerkey') && !st.flags['locker.open'], say: 'Locker 47. Band. Zang laga, par ziddi.' },
          { id: 'empty', verb: 'Andar jhaanko', showIf: (st) => !!st.flags['locker.open'], say: 'Ab khaali. Bas dhool aur purane popcorn ki khushboo.' },
        ],
      },
      {
        id: 'c_lockers',
        label: 'Staff ke locker',
        x: -5.0,
        z: -3.7,
        y: 2.6,
        radius: 1.3,
        actions: [
          { id: 'look', verb: 'Baaki ko hilaao', say: 'Locker 12: ek moza. Locker 30: kisi film star ko prem patra. Locker 46: aur dhool.' },
          { id: 'pick', verb: 'Hairpin se taala kholo', who: 'goti', say: 'Locker 33 mein… ek aur hairpin. Chakra chalta rehta hai.' },
        ],
      },
      {
        id: 'c_booth',
        label: 'Projection booth',
        x: -5.6,
        z: -1.4,
        y: 2.8,
        radius: 1.8,
        actions: [
          { id: 'knock', verb: 'Darwaaze pe kaan lagaao', showIf: (st) => !st.flags['rahul.out'], dialogue: 'booth' },
          { id: 'tape', verb: 'Rahul ki tape phir chalaao', showIf: (st) => !!st.flags['rahul.out'], dialogue: 'booth' },
        ],
      },
      {
        id: 'c_reels',
        label: 'Film ki reelein',
        x: 5.4,
        z: -3.3,
        y: 2.0,
        actions: [{ id: 'read', verb: 'Label padho', say: 'Yahaan dikhaayi gayi aakhri film: “Chaar Gadhe aur Ek Dhol”. Shayad ittefaaq hai.', effects: [{ secret: 'reels' }] }],
      },
      {
        id: 'c_seats',
        label: 'Phati makhmali seatein',
        x: -2.4,
        z: 3.8,
        y: 1.6,
        radius: 1.8,
        actions: [
          { id: 'sit', verb: 'Ek pal baitho', say: 'Row C, seat 7. Kisi ne haththe pe khod rakha hai: “R + J = dost”.' },
          { id: 'hide', verb: 'Kataaron ke beech chhupo', who: 'maru', say: 'Cinema ki seaton ke beech koi nahi dekhta. Sirf gire sikke dhoondhne. Please sikke mat giraana.' },
        ],
      },
      {
        id: 'c_counter',
        label: 'Ticket khidki',
        x: 3.4,
        z: -2.3,
        y: 2.2,
        actions: [
          { id: 'look', verb: 'Dekho', say: 'Aakhri show ka ticket: balcony, ₹3. Pakya kehta hai woh sunehra daur tha.' },
          { id: 'sell', verb: 'Ticket bechne ka naatak karo', who: 'pakya', say: 'Balcony? Front stall? Sir, aapke liye special VIP rate. Sirf ₹500.' },
        ],
      },
    ],
  },
);
