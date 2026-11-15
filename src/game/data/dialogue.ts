import type { DialogueScript, StateView } from '../types';
import { DIALOGUES_2, EXTENSIONS } from './dialogue2';

const f = (s: StateView, k: string) => !!s.flags[k];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * All writing is original. Speakers: friend id, npc id, 'me' (whoever is active) or 'narrator'.
 */
export const DIALOGUES: Record<string, DialogueScript> = {
  /* ───────────── Mission 1: Rent Day ───────────── */
  tiwari: {
    start: (s) => (f(s, 'landlord.cleared') ? pick(['after1', 'after2', 'after3']) : 'block'),
    nodes: {
      block: {
        speaker: 'tiwari',
        text: 'Aha! Four tenants. One door. One landlord. Where is my six thousand rupees?',
        effects: [{ emote: 'tiwari', kind: '💢' }],
        next: 'block2',
      },
      block2: {
        speaker: 'tiwari',
        text: 'Nobody leaves this building until I hear something that sounds like money.',
        choices: [
          { who: 'sam', tag: 'Negotiate', text: 'Propose a flexible payment structure.', next: 'sam1' },
          { who: 'pakya', tag: 'Bluff', text: 'Become somebody important. Quickly.', next: 'pakya1' },
          { who: 'maru', tag: 'Make a scene', text: 'Clutch chest. Collapse dramatically.', next: 'maru1' },
          { who: 'goti', tag: 'Something weird', text: 'Offer him a shiny rock as collateral.', next: 'goti1' },
          { text: 'Run for it.', next: 'run1' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Tiwari-ji. Let us discuss a flexible, long-term, mutually beneficial payment structure.', next: 'sam2' },
      sam2: { speaker: 'tiwari', text: 'Flexible? My stomach is flexible. My rent is not. Pay something today. Even one rupee.', next: 'sam3' },
      sam3: { speaker: 'sam', text: '…Would you accept a payment in confidence?', next: 'pushback' },
      pakya1: {
        speaker: 'pakya',
        text: '*adjusts collar* Tiwari-ji, you are speaking to a very busy man. I am actually…',
        choices: [
          { who: 'pakya', tag: 'Bluff', text: '“…a bank officer. Salary credits on Monday.”', effects: [{ claim: 'pakya.job', value: 'bank officer', to: 'tiwari' }], next: 'bank1' },
          { who: 'pakya', tag: 'Bluff', text: '“…from the Income Tax department. Undercover.”', effects: [{ claim: 'pakya.job', value: 'income tax officer', to: 'tiwari' }], next: 'tax1' },
          { who: 'pakya', tag: 'Bluff', text: '“…a film producer. Scouting your terrace.”', effects: [{ claim: 'pakya.job', value: 'film producer', to: 'tiwari' }], next: 'film1' },
        ],
      },
      bank1: { speaker: 'tiwari', text: 'A bank? You? *squints* Which bank?', next: 'bank2' },
      bank2: { speaker: 'pakya', text: 'The big one. With the logo. And the building.', next: 'bank3' },
      bank3: { speaker: 'tiwari', text: 'Monday. MONDAY. If not, I am renting your room to the pigeons.', next: 'cleared' },
      tax1: {
        speaker: 'tiwari',
        text: 'Income tax?! I— I have no extra income! That second flat belongs to my wife’s cousin! Go, go, take your time, sir!',
        effects: [{ emote: 'tiwari', kind: '!' }],
        next: 'cleared',
      },
      film1: { speaker: 'tiwari', text: 'My terrace? In a film? *fixes vest* Fine. Monday. And put my name in the credits. In big letters.', next: 'cleared' },
      maru1: { speaker: 'maru', text: 'Aaah! My heart! The pressure… of… rent… everything is going… beige…', effects: [{ sfx: 'thud' }], next: 'maru2' },
      maru2: {
        speaker: 'tiwari',
        text: 'Arre arre arre! Don’t die on my property, the paperwork is terrible! Water! Somebody get water!',
        effects: [{ emote: 'tiwari', kind: '!' }],
        next: 'maru3',
      },
      maru3: { speaker: 'narrator', text: 'Tiwari-ji waddles off to find water. The gang slips out. Maru recovers suspiciously fast.', next: 'cleared' },
      goti1: { speaker: 'goti', text: 'Tiwari-ji. This rock. Very lucky. Very shiny. You keep it until Monday.', next: 'goti2' },
      goti2: { speaker: 'tiwari', text: '…Is that from my garden?', next: 'goti3' },
      goti3: { speaker: 'goti', text: '…No.', next: 'pushback' },
      run1: { speaker: 'tiwari', text: 'Ah-ah-ah. My knees are old, but my hands are very fast.', next: 'pushback' },
      pushback: {
        speaker: 'tiwari',
        text: 'INSIDE. All of you. Come back when you have money or a better story.',
        effects: [
          { emote: 'tiwari', kind: '💢' },
          { goto: 'house', spawn: 'door' },
          { toast: 'Tiwari-ji wants a story he can’t argue with. Or a medical emergency.' },
        ],
      },
      cleared: {
        speaker: 'narrator',
        text: 'You are free. For now. Tiwari-ji retreats to his chair with the newspaper and a deep sense of betrayal.',
        effects: [{ flag: 'landlord.cleared' }, { complete: 'rent.leave' }, { sfx: 'success' }],
      },
      after1: { speaker: 'tiwari', text: 'Monday! I have written it in my diary. In pen!' },
      after2: { speaker: 'tiwari', text: 'I am watching you four. I have nothing else to do, so I am watching you very closely.' },
      after3: { speaker: 'tiwari', text: 'In my day, young men had jobs. And moustaches. Proper ones.' },
    },
  },

  /* ───────────── Mission 2: Chai on Credit ───────────── */
  bablu: {
    start: (s) => {
      if (s.missionStatus('chai') === 'active') return 'ask';
      if (s.missionStatus('chai') === 'locked') return 'early';
      return pick(['gossip_ritu', 'gossip_tiwari', 'gossip_lalaji']);
    },
    nodes: {
      early: { speaker: 'bablu', text: 'Chai? First go and sort out your landlord. He was here at six, practising his shouting.' },
      ask: {
        speaker: 'bablu',
        text: 'Four chai? Your tab is three hundred and forty rupees. My stall has a wall of shame, and you four ARE the wall.',
        choices: [
          { who: 'sam', tag: 'Negotiate', text: 'Pitch a partnership: free advertising.', next: 'sam1' },
          { who: 'pakya', tag: 'Bluff', text: 'Reveal yourself as a famous food critic.', effects: [{ claim: 'pakya.job', value: 'food critic', to: 'bablu' }], next: 'pakya1' },
          { who: 'maru', tag: 'Make a scene', text: 'Faint from hunger.', next: 'maru1' },
          { who: 'goti', tag: 'Something weird', text: 'Offer to taste-test the biscuits. All of them.', next: 'goti1' },
          { text: 'Never mind.', next: 'bye' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Bablu bhai, picture this. Four handsome young men, drinking your chai, in public. That is advertising.', next: 'sam2' },
      sam2: { speaker: 'bablu', text: 'Handsome?', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'Relatively. Compared to the cow.', next: 'sam4' },
      sam4: {
        speaker: 'bablu',
        text: '…Fine. Four cutting chai. But you slurp LOUD. Like it is the best chai in the city. Because it is.',
        effects: [{ flag: 'chai.got' }, { complete: 'chai.get' }, { emote: 'bablu', kind: '♥' }],
        next: 'tip',
      },
      tip: {
        speaker: 'bablu',
        text: 'And since you need money: Lalaji’s soda fridge has been dead a week. He says it is cursed. He pays for miracles.',
      },
      pakya1: { speaker: 'bablu', text: 'Last month you were a cricket selector. Before that, a film producer. Before that, my long-lost cousin.', next: 'pakya2' },
      pakya2: { speaker: 'pakya', text: 'I have range.', next: 'no' },
      maru1: { speaker: 'maru', text: 'Bablu bhai… so… hungry… I can see… my ancestors…', next: 'maru2' },
      maru2: { speaker: 'bablu', text: 'It is nine in the morning. You fainted here yesterday. And on Tuesday. Same spot.', next: 'no' },
      goti1: { speaker: 'bablu', text: 'Last time you “taste-tested” half a jar and gave the jar a five-star review.', next: 'no' },
      no: { speaker: 'bablu', text: 'No chai. Come back with a real offer.' },
      bye: { speaker: 'bablu', text: 'Garam chai! Cash only!' },
      gossip_ritu: {
        speaker: 'bablu',
        text: 'Big news: a grandmother and her granddaughter moved into the yellow bungalow. Big house, big gate. People say big money.',
        effects: [{ flag: 'gossip.ritu' }],
      },
      gossip_tiwari: { speaker: 'bablu', text: 'Tiwari-ji fears only two things in life: the income tax department, and his wife. In that order.' },
      gossip_lalaji: { speaker: 'bablu', text: 'Lalaji counts his coins twice a day. Once to count them, once to say goodnight.' },
    },
  },

  /* ───────────── Mission 3: The First Honest Rupee ───────────── */
  lalaji: {
    start: (s) => {
      if (f(s, 'fridge.fixed')) return 'after';
      if (s.missionStatus('job') === 'active') return s.objectiveDone('job.ask') ? 'waiting' : 'job1';
      return 'shop';
    },
    nodes: {
      shop: { speaker: 'lalaji', text: 'Ram Ram. No credit. Not today, not tomorrow, not in the next life.' },
      job1: { speaker: 'lalaji', text: 'Ram Ram. You four. Buying, or loitering?', next: 'job2' },
      job2: { speaker: 'me', text: 'Lalaji, we heard there is a cursed fridge that needs fixing.', next: 'job3' },
      job3: {
        speaker: 'lalaji',
        text: 'Cursed! Cola goes in warm, comes out warm. A mechanic, an electrician and my brother-in-law have all failed.',
        next: 'job4',
      },
      job4: {
        speaker: 'lalaji',
        text: 'Two hundred rupees to whoever fixes it. It is in the corner. Don’t make it worse. It is already very sad.',
        effects: [{ complete: 'job.ask' }],
      },
      waiting: { speaker: 'lalaji', text: 'The fridge is in the corner. It is still cursed. I am still paying.' },
      after: { speaker: 'lalaji', text: 'Since your round friend slapped my fridge, it makes ice. ICE. In a cola fridge. Best two hundred I ever spent.' },
    },
  },
  fridge_look: {
    start: (s) => (f(s, 'fridge.fixed') ? 'fixed' : 'look'),
    nodes: {
      look: { speaker: 'me', text: 'It hums. It sulks. It is definitely cursed. A sensible person would never hit it.', next: 'look2' },
      look2: { speaker: 'narrator', text: 'Goti is not a sensible person.' },
      fixed: { speaker: 'narrator', text: 'The fridge purrs happily. A small icicle has formed on the label. Lalaji visits it hourly.' },
    },
  },
  fridge_goti: {
    start: 'a',
    nodes: {
      a: { speaker: 'goti', text: 'Fridges are like uncles. They respond to respect… and a firm smack on the left side.', next: 'b' },
      b: { speaker: 'narrator', text: '*THUNK*', effects: [{ sfx: 'thud' }], next: 'c' },
      c: { speaker: 'narrator', text: 'The fridge shudders, coughs, and roars to life. A single ice cube falls out and slides across the floor.', next: 'd' },
      d: {
        speaker: 'lalaji',
        text: 'MIRACLE! Take your two hundred rupees and go, before you touch something else.',
        effects: [{ flag: 'fridge.fixed' }, { money: 200 }, { complete: 'job.fix' }, { emote: 'lalaji', kind: '!' }],
      },
    },
  },
  hairoil: {
    start: 'a',
    nodes: {
      a: { speaker: 'sam', text: '“Lalaji’s Miracle Hair Oil. Results in seven days or seven years. Results not guaranteed. Smells nice.”', next: 'b' },
      b: { speaker: 'sam', text: 'That is not a product. That is a business plan. I respect it.', effects: [{ secret: 'hairoil' }] },
    },
  },

  /* ───────────── Mission 4: The Grand Plan ───────────── */
  plan_board: {
    start: (s) => (s.missionStatus('plan') === 'active' && s.objectiveDone('plan.go') ? 'm1' : f(s, 'plan.made') ? 'after' : 'idle'),
    nodes: {
      idle: { speaker: 'narrator', text: 'The plan board reads: “1. Get rich. 2. ??? 3. Stay rich.” Step 2 has been erased many times.' },
      after: { speaker: 'narrator', text: 'The board now reads: “OPERATION HELLO NEIGHBOUR. Rule 1: Nobody does anything stupid.” Goti has added: “define stupid”.' },
      m1: { speaker: 'sam', text: 'Gentlemen. Facts. Rent: six thousand. Our total money: two hundred.', next: 'm2' },
      m2: { speaker: 'goti', text: 'And one ice cube. I kept it. It is in my pocket.', next: 'm3' },
      m3: { speaker: 'sam', text: 'Option one: we get jobs.', next: 'm4' },
      m4: { speaker: 'narrator', text: 'A long, respectful silence.', next: 'm5' },
      m5: { speaker: 'sam', text: 'Option two: the lottery.', next: 'm6' },
      m6: { speaker: 'maru', text: 'We bought a ticket last year. Then we lost the ticket. Then I think we won. I don’t want to talk about it.', next: 'm7' },
      m7: { speaker: 'pakya', text: 'Option three. *leans back* We marry rich.', next: 'm8' },
      m8: { speaker: 'sam', text: 'That is… *flips the board* …actually already on my list.', next: 'm9' },
      m9: { speaker: 'pakya', text: 'The new girl in the yellow bungalow. Bablu says the house has two floors and a swing. INDOORS.', next: 'm10' },
      m10: { speaker: 'maru', text: 'Her grandmother carries a stick. I have seen the stick. The stick has seen me.', next: 'm11' },
      m11: {
        speaker: 'sam',
        text: 'Then it is decided. Operation Hello Neighbour. We go together, we make a good impression, and nobody does anything stupid.',
        next: 'm12',
      },
      m12: {
        speaker: 'goti',
        text: 'Define stupid.',
        effects: [{ flag: 'plan.made' }, { complete: 'plan.board' }],
      },
    },
  },

  /* ───────────── Mission 5: Hello, Neighbour ───────────── */
  ritu_gate: {
    start: (s) => {
      if (f(s, 'ritu.in')) return 'open';
      if (s.missionStatus('ritu') === 'active') return 'd1';
      return 'closed';
    },
    nodes: {
      closed: { speaker: 'narrator', text: 'A big yellow bungalow with a very shiny gate. A small sign says: “Salesmen will be chased.”' },
      open: { speaker: 'narrator', text: 'Daadi left the door open. That is either trust, or a trap.' },
      d1: { speaker: 'daadi', text: 'Who is it? If you are selling water purifiers, I already have three. One of them talks.', next: 'd2' },
      d2: {
        speaker: 'daadi',
        text: 'Well? Speak. I am old, not patient.',
        choices: [
          { who: 'sam', tag: 'Negotiate', text: 'Introduce yourselves as the official welcome committee.', effects: [{ claim: 'gang.who', value: 'the Lane Four Welcome Committee', to: 'daadi' }], next: 'sam1' },
          { who: 'pakya', tag: 'Bluff', text: 'Claim to be here on official business.', next: 'pakya1' },
          { who: 'maru', tag: 'Make a scene', text: 'Wilt dramatically on her doorstep.', next: 'maru1' },
          { who: 'goti', tag: 'Something weird', text: 'Ask if she has any spare biscuits.', next: 'goti1' },
          { text: 'Back away slowly.', next: 'leave' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Namaste, Daadi. We are the Lane Four Welcome Committee. Official. We welcome.', next: 'sam2' },
      sam2: { speaker: 'daadi', text: 'There is no welcome committee.', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'There is now. We formed it this morning. You are our first and most important member.', next: 'sam4' },
      sam4: { speaker: 'daadi', text: '…Hmph. At least you are organised. Come in. Wipe your feet. All eight of them.', next: 'in' },
      pakya1: {
        speaker: 'pakya',
        text: 'Madam, we are from the…',
        choices: [
          { who: 'pakya', tag: 'Bluff', text: '“…Cable TV company. Routine inspection.”', effects: [{ claim: 'pakya.job', value: 'cable TV inspector', to: 'daadi' }], next: 'cable1' },
          { who: 'pakya', tag: 'Bluff', text: '“…Census department. Counting people.”', effects: [{ claim: 'gang.who', value: 'census officers', to: 'daadi' }], next: 'census1' },
        ],
      },
      cable1: {
        speaker: 'daadi',
        text: 'FINALLY. My serial has been gone for two days! The mother-in-law was about to reveal everything! Come in, come in, fix it!',
        effects: [{ flag: 'ritu.cable' }],
        next: 'in',
      },
      census1: { speaker: 'daadi', text: 'Census? The last census man had a uniform and a clipboard. Where is your uniform?', next: 'census2' },
      census2: { speaker: 'pakya', text: '…Casual Friday.', next: 'census3' },
      census3: { speaker: 'daadi', text: 'It is Wednesday. Goodbye.', effects: [{ emote: 'daadi', kind: '💢' }] },
      maru1: { speaker: 'maru', text: 'Ohhh… the sun… the heat… my legs are… made of… dal…', effects: [{ sfx: 'thud' }], next: 'maru2' },
      maru2: {
        speaker: 'daadi',
        text: 'Arre, the poor thin one! Bring him inside, give him water! Not you three. …Fine. You three also. Don’t touch anything.',
        next: 'in',
      },
      goti1: { speaker: 'daadi', text: 'I have no spare biscuits. I do have a spare stick. Would you like to meet it?', effects: [{ emote: 'daadi', kind: '💢' }] },
      leave: { speaker: 'daadi', text: 'Hmph. Young men these days. No conversation.' },
      in: {
        speaker: 'narrator',
        text: 'The door creaks open. You are in. Nobody is sure how.',
        effects: [{ flag: 'ritu.in' }, { complete: 'ritu.in' }, { goto: 'ritu', spawn: 'door' }],
      },
    },
  },
  ritu: {
    start: (s) => {
      if (s.missionStatus('ritu') !== 'active') return 'default';
      if (f(s, `impress.${s.active}`)) return 'done_me';
      return `try_${s.active}`;
    },
    nodes: {
      default: { speaker: 'ritu', text: 'Oh. Hello again. Daadi is watching you, by the way. She is always watching.' },
      done_me: { speaker: 'ritu', text: 'You already had your turn. Let your friends embarrass themselves too.' },
      try_sam: {
        speaker: 'sam',
        text: 'Hello. I am Sam. I have a five-year plan, a ten-year plan, and a backup plan for both.',
        next: 'sam2',
      },
      sam2: { speaker: 'ritu', text: 'Impressive. And what is the plan for today?', next: 'sam3' },
      sam3: { speaker: 'sam', text: '…Talking to you was the whole plan. I did not plan past this point.', next: 'sam4' },
      sam4: { speaker: 'ritu', text: 'Bold opening. Weak follow-through.', effects: [{ flag: 'impress.sam' }, { emote: 'ritu', kind: '…' }], branch: check },
      try_pakya: { speaker: 'pakya', text: '*leans on the cupboard* They call me Pakya. Some people call me “The Voice”.', next: 'pakya2' },
      pakya2: { speaker: 'ritu', text: 'Which people?', next: 'pakya3' },
      pakya3: { speaker: 'pakya', text: '…People. Many people. Internationally.', next: 'pakya4' },
      pakya4: {
        speaker: 'narrator',
        text: 'The cupboard door swings open behind him. Pakya does not move. He has decided this is cool.',
        effects: [{ flag: 'impress.pakya' }, { emote: 'ritu', kind: '?' }],
        branch: check,
      },
      try_goti: { speaker: 'goti', text: 'Hi! Do you like tamarind? I have some in my pocket. It has been there since Holi.', next: 'goti2' },
      goti2: { speaker: 'ritu', text: 'Since… Holi?', next: 'goti3' },
      goti3: { speaker: 'goti', text: 'It is aged. Like a fine wine. Or a cheese. Or Daadi.', next: 'goti4' },
      goti4: {
        speaker: 'ritu',
        text: '*laughs despite herself* You are very strange.',
        effects: [{ flag: 'impress.goti' }, { emote: 'ritu', kind: '♥' }],
        next: 'goti5',
      },
      goti5: { speaker: 'goti', text: 'Thank you!', branch: check },
      try_maru: { speaker: 'maru', text: 'H-hello. I am Maru. I am normally very calm and very—', next: 'maru2' },
      maru2: {
        speaker: 'narrator',
        text: 'Maru’s elbow meets Daadi’s prized brass vase. The vase meets the floor. The floor wins, loudly.',
        effects: [{ sfx: 'thud' }, { emote: 'daadi', kind: '💢' }, { flag: 'vase.broken' }],
        next: 'maru3',
      },
      maru3: { speaker: 'daadi', text: 'MY VASE!', next: 'maru4' },
      maru4: { speaker: 'maru', text: 'IT WAS LIKE THAT WHEN I— it was not. I am so sorry. I will marry it. I mean fix it.', next: 'maru5' },
      maru5: {
        speaker: 'ritu',
        text: '*trying very hard not to laugh* It is brass. It bounces. Daadi, it bounced.',
        effects: [{ flag: 'impress.maru' }, { emote: 'ritu', kind: '♥' }],
        branch: check,
      },
      more: {
        speaker: 'ritu',
        text: 'Anyone else? Or is that the whole show?',
        effects: [{ toast: 'Switch friends and talk to Ritu again. Everyone gets one try.' }],
      },
      finale1: {
        speaker: 'ritu',
        text: 'Well. You four are… definitely something. Daadi, I like them. They are funnier than the TV.',
        next: 'finale2',
      },
      finale2: { speaker: 'daadi', text: 'The TV is working now. Out. All of you.', next: 'finale3' },
      finale3: {
        speaker: 'narrator',
        text: 'Four friends walk home in perfect silence. Each one is absolutely certain that she liked HIM.',
        next: 'finale4',
      },
      finale4: {
        speaker: 'narrator',
        text: 'This is going to be a problem.',
        effects: [{ complete: 'ritu.impress' }, { endPart: true }, { goto: 'street', spawn: 'rituGate' }],
      },
    },
  },
  daadi: {
    start: (s) => (f(s, 'vase.broken') ? 'vase' : f(s, 'ritu.cable') ? 'cable' : 'warn'),
    nodes: {
      warn: { speaker: 'daadi', text: 'Sit properly. Don’t touch the vase. Don’t look at the vase. The vase is not for you.' },
      cable: { speaker: 'daadi', text: 'You fixed my TV by pushing the plug back in. Such a clever boy. Your friends are less clever.' },
      vase: { speaker: 'daadi', text: 'That vase came from my wedding. It survived three floods, two earthquakes and one Maru.' },
    },
  },

  /* ───────────── Neighbourhood life ───────────── */
  pappu: {
    start: () => pick(['a', 'b']),
    nodes: {
      a: { speaker: 'pappu', text: 'Cut, shave and today’s gossip: fifty rupees. Gossip alone is free. Tiwari-ji is afraid of the tax office. You didn’t hear it from me.' },
      b: { speaker: 'pappu', text: 'Kamla says Lalaji has been buying her bhindi every day. Nobody eats that much bhindi. Nobody.' },
    },
  },
  pappu_pakya: {
    start: 'a',
    nodes: {
      a: { speaker: 'pakya', text: 'Pappu bhai. Imagine it. My hair. Your scissors. Walking around the colony all day. A moving advertisement.', next: 'b' },
      b: { speaker: 'pappu', text: '…You know what? That is actually smart. Sit.', next: 'c' },
      c: {
        speaker: 'narrator',
        text: 'Twenty minutes later, Pakya’s hair is twelve centimetres taller and legally a landmark.',
        effects: [{ secret: 'barber' }, { emote: 'pappu', kind: '♥' }],
      },
    },
  },
  carrom: {
    start: () => pick(['a', 'b', 'c']),
    nodes: {
      a: { speaker: 'sharma', text: 'In 1984 I pocketed the queen with my eyes closed.', next: 'a2' },
      a2: { speaker: 'verma', text: 'And you have not opened them since. That is why you keep losing.' },
      b: { speaker: 'verma', text: 'You boys should get jobs. In my day we had jobs. Terrible jobs. We loved them.', next: 'b2' },
      b2: { speaker: 'sharma', text: 'He hated his job.', next: 'b3' },
      b3: { speaker: 'verma', text: 'I loved hating it. That is character.' },
      c: { speaker: 'sharma', text: 'Shh. Shh! The striker is choosing its path. Do not breathe on the board.' },
    },
  },
  kids: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'chintu',
        text: 'Bhaiya! Bowl one over. Just one! Pinky says nobody can get her out.',
        choices: [
          { who: 'goti', tag: 'Something weird', text: 'Bowl underarm. Backwards. While spinning.', next: 'goti1' },
          { who: 'sam', tag: 'Negotiate', text: 'Negotiate the rules first.', next: 'sam1' },
          { text: 'Not now, we are busy being broke.', next: 'no' },
        ],
      },
      goti1: { speaker: 'pinky', text: 'That is NOT allowed! …Do it again! Do it again!', effects: [{ emote: 'pinky', kind: '♥' }, { emote: 'chintu', kind: '!' }] },
      sam1: { speaker: 'pinky', text: 'Rules? The rule is: if it hits the scooter, it is a six. If it hits Tiwari-ji, we run.' },
      no: { speaker: 'chintu', text: 'You are always busy being broke.' },
    },
  },
  sabzi: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'sabziwali',
        text: 'Tomatoes forty, onions thirty, advice free: get a job.',
        choices: [
          { who: 'sam', tag: 'Negotiate', text: 'Haggle. Just for practice.', next: 'sam1' },
          { text: 'Just looking.', next: 'bye' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Twenty for the onions. Final offer.', next: 'sam2' },
      sam2: { speaker: 'sabziwali', text: 'You have no money. You are haggling for sport?', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'Practice. For when I am rich.', next: 'sam4' },
      sam4: { speaker: 'sabziwali', text: '…Respect. Twenty-five. When you are rich.', effects: [{ emote: 'sabziwali', kind: '♥' }] },
      bye: { speaker: 'sabziwali', text: 'Looking is also forty rupees. Joking. Mostly.' },
    },
  },
  cow: {
    start: 'a',
    nodes: {
      a: { speaker: 'me', text: 'Gauri the cow. She has lived at this crossing longer than the traffic signal, and she is better at it.' },
    },
  },
  cow_goti: {
    start: 'a',
    nodes: {
      a: { speaker: 'goti', text: 'Gauri. Be honest with me. Are we going to be rich?', next: 'b' },
      b: { speaker: 'narrator', text: 'Gauri chews thoughtfully. Then she slowly nods. Or a fly landed on her head.', effects: [{ sfx: 'moo' }], next: 'c' },
      c: { speaker: 'goti', text: 'She said yes! Guys! The cow said yes!', effects: [{ secret: 'cow' }, { emote: 'gauri', kind: '♥' }] },
    },
  },
  dog: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Moti wags his tail. Moti has never had a single problem in his entire life.', effects: [{ sfx: 'bark' }] },
    },
  },
  posters: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'narrator',
        text: 'Posters, layered ten deep: “KHATARNAK KHILADI 3: Revenge Again”. “Love in Ludhiana”. “Pinto Sir Tuitions: Results Guaranteed*”.',
        next: 'b',
      },
      b: { speaker: 'me', text: 'One day, our faces will be on this wall.', next: 'c' },
      c: {
        speaker: 'narrator',
        text: 'Underneath, a faded notice: “WANTED: four boys, for stealing Tiwari-ji’s mangoes.” It has your faces on it.',
        effects: [{ secret: 'poster' }],
      },
    },
  },
  drum: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Inside the blue drum, wrapped in plastic: a letter. “Dear Kamla, your bhindi is fresh, like my love. — L.”', next: 'b' },
      b: { speaker: 'me', text: 'We never saw this. We never saw this. Put it back.', effects: [{ secret: 'tank' }] },
    },
  },
  lane_sign: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Shanti Nagar, Lane No. 4. “Shanti” means peace. Nobody has checked in years.' },
    },
  },
};

function check(s: StateView) {
  return ['sam', 'pakya', 'goti', 'maru'].every((c) => s.flags[`impress.${c}`]) ? 'finale1' : 'more';
}

/* Part 2: new scripts, and extra branches on Part 1 characters */
Object.assign(DIALOGUES, DIALOGUES_2);
for (const ext of EXTENSIONS) {
  const base = DIALOGUES[ext.id];
  const old = base.start;
  Object.assign(base.nodes, ext.nodes);
  base.start = (s) => ext.start(s) ?? (typeof old === 'function' ? old(s) : old);
}
