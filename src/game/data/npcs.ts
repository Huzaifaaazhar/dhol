import type { Look } from './characters';

export interface NpcDef {
  id: string;
  name: string;
  look: Look;
  voice: number;
  color: string;
  /** dialogue script id used when talked to */
  dialogue: string;
  barks: string[];
  kind?: 'person' | 'cow' | 'dog' | 'goat';
}

const p = (look: Partial<Look> & Pick<Look, 'shirt'>): Look => ({
  skin: '#b57b52',
  hair: '#1a120e',
  hairStyle: 'flat',
  pants: '#6d5a48',
  shoes: '#3a2a20',
  height: 1,
  girth: 1,
  shirtPattern: 'plain',
  ...look,
});

export const NPCS: Record<string, NpcDef> = {
  tiwari: {
    id: 'tiwari',
    name: 'Dongre Mama',
    voice: 160,
    color: '#c2a878',
    dialogue: 'tiwari',
    // Maru's miser maternal uncle: Assistant Sub-Inspector, part-time moneylender, full-time kanjoos
    look: p({ shirt: '#b49a62', pants: '#a58b55', shoes: '#3a2a1a', hairStyle: 'cap', hair: '#2b2b2b', girth: 1.35, height: 1.02, skin: '#b07650', extras: ['moustache', 'belly', 'stick'] }),
    barks: ['Byaaj! Byaaj! BYAAJ!', 'Paisa kab dega, Maru?', 'Mujhe bahaane ki khushboo aa rahi hai.'],
  },
  bablu: {
    id: 'bablu',
    name: 'Bablu',
    voice: 280,
    color: '#c96b2c',
    dialogue: 'bablu',
    look: p({ shirt: '#d7743a', pants: '#3d3a52', hairStyle: 'side', extras: ['towel', 'moustache'] }),
    barks: ['Garam chai! Garam chai!', 'Udhaar band hai. BAND!', 'Adrak, elaichi, masala!'],
  },
  lalaji: {
    id: 'lalaji',
    name: 'Lalaji',
    voice: 200,
    color: '#e9d36a',
    dialogue: 'lalaji',
    look: p({ shirt: '#efe7c9', shirtPattern: 'kurta', pants: '#efe7c9', hairStyle: 'topi', girth: 1.2, skin: '#c08a60', extras: ['glasses', 'belly'] }),
    barks: ['Ram Ram! Taaza maal!', 'Haath mat lagao, khareedo.', 'Udhaar maangna mana hai.'],
  },
  ritu: {
    id: 'ritu',
    name: 'Ritu',
    voice: 420,
    color: '#ff8a3d',
    dialogue: 'ritu',
    look: p({ shirt: '#ff9e3d', shirtPattern: 'kurta', pants: '#7b2e8f', hairStyle: 'braid', skin: '#c99268', girth: 0.85, height: 0.96, extras: ['dupatta'] }),
    barks: ['Hmm?', 'Phir se tum chaaron?', 'Interesting…'],
  },
  daadi: {
    id: 'daadi',
    name: 'Elizabeth Daadi',
    voice: 230,
    color: '#f3f0ea',
    dialogue: 'daadi',
    look: p({ shirt: '#f3efe6', shirtPattern: 'saree', pants: '#f3efe6', hairStyle: 'bun', hair: '#d9d4cc', skin: '#b98a66', height: 0.88, girth: 0.95, extras: ['glasses', 'stick'] }),
    barks: ['Kaun hai?', 'Hmph.', 'Aaj kal ke ladke…'],
  },
  dadaji: {
    id: 'dadaji',
    name: 'Dr. Satyadev Tripathi (Dadaji)',
    voice: 175,
    color: '#cdb4db',
    dialogue: 'dadaji',
    // Ritu's grandfather. PhD in Textiles. Judges every man by the fabric of his shirt.
    look: p({ shirt: '#f2e8cf', shirtPattern: 'kurta', pants: '#f2e8cf', hairStyle: 'bald', hair: '#e0ddd5', skin: '#b98a66', height: 0.95, girth: 1.05, extras: ['glasses', 'moustache', 'stick'] }),
    barks: ['Ye kapda… polyester hai?', 'PhD in Textiles, beta. Textiles!', 'Hmm. Dhaaga kamzor hai.'],
  },
  pappu: {
    id: 'pappu',
    name: 'Pappu naai',
    voice: 330,
    color: '#5bc0eb',
    dialogue: 'pappu',
    look: p({ shirt: '#ffffff', pants: '#2c3e50', hairStyle: 'puff', extras: ['moustache'] }),
    barks: ['Baal, daadhi, gossip. Pachaas rupaye.', 'Baitho, baitho!'],
  },
  sharma: {
    id: 'sharma',
    name: 'Sharma uncle',
    voice: 190,
    color: '#a0c4ff',
    dialogue: 'carrom',
    look: p({ shirt: '#9fb7d9', hairStyle: 'bald', extras: ['glasses', 'moustache'], girth: 1.1 }),
    barks: ['Queen! Queen cover karo!', 'Hamare zamaane mein carrom khel tha, khel!'],
  },
  verma: {
    id: 'verma',
    name: 'Verma uncle',
    voice: 210,
    color: '#ffd6a5',
    dialogue: 'carrom',
    look: p({ shirt: '#e9c46a', shirtPattern: 'kurta', hairStyle: 'side', hair: '#cfc8bd', extras: ['beard'] }),
    barks: ['Foul! Ye foul hai!', 'Hmm.'],
  },
  chintu: {
    id: 'chintu',
    name: 'Chintu',
    voice: 520,
    color: '#ffadad',
    dialogue: 'kids',
    look: p({ shirt: '#e63946', pants: '#1d3557', hairStyle: 'side', height: 0.62, girth: 0.8 }),
    barks: ['Howzaaat!', 'Chhakka! Ye chhakka tha!'],
  },
  pinky: {
    id: 'pinky',
    name: 'Pinky',
    voice: 560,
    color: '#ffc6ff',
    dialogue: 'kids',
    look: p({ shirt: '#f15bb5', pants: '#3a0ca3', hairStyle: 'braid', height: 0.6, girth: 0.8 }),
    barks: ['Theek se daalo!', 'Out! Ekdum out!'],
  },
  sabziwali: {
    id: 'sabziwali',
    name: 'Kamla sabziwaali',
    voice: 300,
    color: '#80ed99',
    dialogue: 'sabzi',
    look: p({ shirt: '#2a9d8f', shirtPattern: 'saree', pants: '#2a9d8f', hairStyle: 'bun', girth: 1.1 }),
    barks: ['Tamatar! Bhindi! Taaza taaza!', 'Pyaaz, colony mein sabse sasta!'],
  },
  gauri: {
    id: 'gauri',
    name: 'Gauri gaay',
    kind: 'cow',
    voice: 120,
    color: '#f5f5f5',
    dialogue: 'cow',
    look: p({ shirt: '#f2efe9' }),
    barks: ['Mooo.', '…'],
  },
  jai: {
    id: 'jai',
    // Jaishankar "Jai" Yadav, Rahul's friend. He died with Rahul; Pakya borrows his name.
    name: 'Jai',
    voice: 270,
    color: '#8ecae6',
    dialogue: 'jai',
    look: p({ shirt: '#3d5a80', shirtPattern: 'check', pants: '#22223b', hairStyle: 'cap', skin: '#b5835a', extras: ['shades', 'beard'] }),
    barks: ['…'],
  },
  zikomo: {
    id: 'zikomo',
    name: 'Zikomo',
    voice: 140,
    color: '#f8f9fa',
    dialogue: 'zikomo',
    look: p({ shirt: '#f8f9fa', shirtPattern: 'shiny', pants: '#f8f9fa', shoes: '#f8f9fa', hairStyle: 'puff', hair: '#0b0b0b', skin: '#9c6b49', girth: 1.15, height: 1.08, extras: ['shades', 'chain', 'moustache', 'watch'] }),
    barks: ['Mere joote safed hain. Safed hi rehne chahiye.', 'Kahaan hain mere chaar gadhe?', 'Sabr achhi cheez hai. Mere paas nahi hai.'],
  },
  bhaloo: {
    id: 'bhaloo',
    name: 'Bhaloo',
    voice: 120,
    color: '#ef476f',
    dialogue: 'goon',
    look: p({ shirt: '#1b1b1b', shirtPattern: 'vest', pants: '#3a3a3a', hairStyle: 'bald', skin: '#8d5a3b', girth: 1.5, height: 1.15, extras: ['beard', 'chain'] }),
    barks: ['Hmm.', 'Dhoondh raha hoon. Bahut zor se dhoondh raha hoon.', 'Boss ne chaar bole. Mujhe zero dikh rahe.'],
  },
  spanner: {
    id: 'spanner',
    name: 'Spanner',
    voice: 380,
    color: '#ef476f',
    dialogue: 'goon',
    look: p({ shirt: '#c1121f', pants: '#14213d', hairStyle: 'flat', skin: '#a8714b', girth: 0.78, height: 1.04, extras: ['moustache', 'stick'] }),
    barks: ['Tik tik, gadho.', 'Mujhe darr ki boo aa rahi hai. Aur samose ki.', 'Boss ko dhol chahiye.'],
  },
  postman: {
    id: 'postman',
    name: 'Ramesh daakiya',
    voice: 270,
    color: '#e0b84f',
    dialogue: 'postman',
    look: p({ shirt: '#b8a06a', pants: '#8a7550', hairStyle: 'cap', skin: '#a8714c', extras: ['moustache', 'glasses'] }),
    barks: ['Daak! Daak aayi!', 'Registry hai, yahaan sign karo. Nahi, wahaan.', 'Baarish ho, dhoop ho, kutta ho. Daak chalti rahegi.'],
  },
  shambhu: {
    id: 'shambhu',
    name: 'Shambhu kabaadiwaala',
    voice: 240,
    color: '#bc6c25',
    dialogue: 'shambhu',
    look: p({ shirt: '#a98467', shirtPattern: 'kurta', pants: '#6c584c', hairStyle: 'bald', skin: '#8d5a3b', extras: ['towel', 'beard'] }),
    barks: ['Raddi! Purana saamaan! Purani cheez, naya paisa!', 'Purane akhbaar, purani botal, purane dhol!', 'Kabaadiwaalaaa!'],
  },
  // Rahul Tripathi, Ritu's brother. Dead before the story begins; seen in photos and heard on his tape.
  rahul: {
    id: 'rahul',
    name: 'Rahul',
    voice: 300,
    color: '#ffd166',
    dialogue: 'rahul',
    look: p({ shirt: '#f4a261', shirtPattern: 'kurta', pants: '#3d405b', hairStyle: 'curly', skin: '#c99268', extras: ['beard'] }),
    barks: ['…'],
  },
  moti: {
    id: 'moti',
    name: 'Moti',
    kind: 'dog',
    voice: 600,
    color: '#d4a373',
    dialogue: 'dog',
    look: p({ shirt: '#c98e55' }),
    barks: ['Bhow!', '*poonchh hilaata hai*'],
  },
};
