/** What NPCs ask Pakya while he keeps them busy. Every answer is recorded in the lie ledger. */
export interface QuestionDef {
  topic: string;
  prompt: string;
  options: string[];
}

export const QUESTIONS: Record<string, QuestionDef[]> = {
  tiwari: [
    { topic: 'room.state', prompt: 'Why is your door shut in the daytime? What is going on in that room?', options: ['Pest control. Very toxic.', 'We are painting it. For you!', 'Maru is sick in bed. Very contagious.'] },
    { topic: 'pakya.job', prompt: 'Remind me. What is your job again, Pakya?', options: ['bank officer', 'income tax officer', 'film producer'] },
    { topic: 'rent.when', prompt: 'And my rent? Exact date, please.', options: ['Monday, guaranteed', 'After the film releases', 'Tomorrow, in cash'] },
    { topic: 'gang.lastnight', prompt: 'Somebody was drumming at midnight. Where were you four last night?', options: ['At the temple', 'At a wedding', 'Studying, Tiwari-ji'] },
    { topic: 'maru.health', prompt: 'Where is the thin one? I haven’t seen him all day.', options: ['Sick in bed', 'Visiting his mother', 'Doing yoga'] },
  ],
  zikomo: [
    { topic: 'gang.dhol', prompt: 'Rahul’s dhol. Where is it?', options: ['Never heard of a dhol', 'Sold to someone in Dubai', 'Goti might have it'] },
    { topic: 'pakya.job', prompt: 'And what do you do, talkative one?', options: ['bank officer', 'income tax officer', 'film producer'] },
    { topic: 'gang.who', prompt: 'Who are you people, really?', options: ['the Lane Four Welcome Committee', 'very dangerous people', 'nobody, ji. Nobody.'] },
    { topic: 'gang.money', prompt: 'Somebody took my money. Four lakhs. You wouldn’t know anything about that, would you?', options: ['What money?', 'Money? In this economy?', 'Ask the drum'] },
    { topic: 'dhol.fake', prompt: 'Who sold me a biscuit tin with strings on it?', options: ['Must have been Shambhu', 'That was a real dhol, ji', 'Goti, probably'] },
  ],
  lalaji: [
    { topic: 'pakya.job', prompt: 'Bablu says you work somewhere now. Where?', options: ['bank officer', 'income tax officer', 'film producer'] },
    { topic: 'rent.when', prompt: 'Tiwari-ji says you owe rent. When will you pay?', options: ['Monday, guaranteed', 'After the film releases', 'Tomorrow, in cash'] },
    { topic: 'gang.lastnight', prompt: 'Why were you lot running past my shop last night?', options: ['At the temple', 'At a wedding', 'Studying, Tiwari-ji'] },
  ],
};

/** How each NPC introduces a question to Pakya, so the card reads naturally. */
export const ASKER: Record<string, string> = {
  tiwari: 'Tiwari-ji narrows his eyes',
  zikomo: 'Zikomo adjusts his gold watch',
  lalaji: 'Lalaji stops counting coins',
};
