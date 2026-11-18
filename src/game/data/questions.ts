/** What NPCs ask Pakya while he keeps them busy. Every answer is recorded in the lie ledger. */
export interface QuestionDef {
  topic: string;
  prompt: string;
  options: string[];
}

/** Answers that other code checks by value (keep in step with chaos.ts). */
export const SICK_IN_BED = 'Bistar pe beemar hai';
export const ROOM_MARU_SICK = 'Maru beemar hai. Chhoot ki bimaari.';

export const QUESTIONS: Record<string, QuestionDef[]> = {
  // 'tiwari' is Dongre Mama
  tiwari: [
    { topic: 'room.state', prompt: 'Din mein darwaaza band kyun hai? Us kamre mein chal kya raha hai?', options: ['Pest control. Bahut zehreela.', 'Painting ho rahi hai. Aapke liye!', ROOM_MARU_SICK] },
    { topic: 'pakya.job', prompt: 'Yaad dilao, Pakya. Tu kaam kya karta hai?', options: ['bank mein afsar', 'income tax ka afsar', 'filmon ka producer'] },
    { topic: 'rent.when', prompt: 'Aur mera paisa? Byaaj ke saath. Exact taareekh batao.', options: ['Somvaar, pakka', 'Film release hone ke baad', 'Kal, nakad'] },
    { topic: 'gang.lastnight', prompt: 'Aadhi raat ko koi dhol baja raha tha. Kal raat tum chaaron kahaan the?', options: ['Mandir mein', 'Ek shaadi mein', 'Padhaai kar rahe the, Mama'] },
    { topic: 'maru.health', prompt: 'Mera bhaanja kahaan hai? Patla wala? Subah se dikha nahi.', options: [SICK_IN_BED, 'Apni maa se milne gaya', 'Yoga kar raha hai'] },
  ],
  zikomo: [
    { topic: 'gang.dhol', prompt: 'Rahul ka dhol. Kahaan hai?', options: ['Kaunsa dhol? Kabhi suna nahi', 'Dubai mein kisi ko bech diya', 'Shayad Goti ke paas hai'] },
    { topic: 'pakya.job', prompt: 'Aur tu kya karta hai, baatooni?', options: ['bank mein afsar', 'income tax ka afsar', 'filmon ka producer'] },
    { topic: 'gang.who', prompt: 'Asal mein kaun ho tum log?', options: ['Gali Chaar Swagat Samiti', 'bahut khatarnak log', 'koi nahi, ji. Koi bhi nahi.'] },
    { topic: 'gang.money', prompt: 'Kisi ne mera paisa liya hai. Chaar lakh. Tumhe toh kuch pata nahi hoga, haina?', options: ['Kaunsa paisa?', 'Paisa? Is mehngaai mein?', 'Dhol se poochho'] },
    { topic: 'dhol.fake', prompt: 'Mujhe taar lagaaya hua biscuit ka dabba kisne becha?', options: ['Shambhu ne hoga', 'Woh asli dhol tha, ji', 'Goti ne, shayad'] },
  ],
  lalaji: [
    { topic: 'pakya.job', prompt: 'Bablu kehta hai tu ab kahin kaam karta hai. Kahaan?', options: ['bank mein afsar', 'income tax ka afsar', 'filmon ka producer'] },
    { topic: 'rent.when', prompt: 'Dongre sahab kehte hain tum pe unka karza hai. Kab doge?', options: ['Somvaar, pakka', 'Film release hone ke baad', 'Kal, nakad'] },
    { topic: 'gang.lastnight', prompt: 'Kal raat meri dukaan ke saamne se bhaag kyun rahe the?', options: ['Mandir mein', 'Ek shaadi mein', 'Padhaai kar rahe the, Mama'] },
  ],
};

/** How each NPC introduces a question to Pakya, so the card reads naturally. */
export const ASKER: Record<string, string> = {
  tiwari: 'Dongre Mama aankhein sikodte hain',
  zikomo: 'Zikomo apni sone ki ghadi theek karta hai',
  lalaji: 'Lalaji sikke ginna rok dete hain',
};
