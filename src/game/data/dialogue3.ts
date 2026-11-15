/**
 * Part 3 writing: the reveal, the finale and the endings. All original.
 * Discoveries are spread across places and people; no single scene explains everything.
 */
import type { DialogueNode, DialogueScript, StateView } from '../types';

const f = (s: StateView, k: string) => !!s.flags[k];
const act = (s: StateView, m: string) => s.missionStatus(m) === 'active';
const susp = (s: StateView, n: string) => s.suspicion(n);

type Nodes = Record<string, DialogueNode>;
type Start = (s: StateView) => string | undefined;

export const DIALOGUES_3: Record<string, DialogueScript> = {};
export const EXTENSIONS_3: Array<{ id: string; start: Start; nodes: Nodes }> = [];
const extend = (id: string, start: Start, nodes: Nodes) => EXTENSIONS_3.push({ id, start, nodes });

/* ═════════════ Discovery 1: the packet ═════════════ */
DIALOGUES_3.packet = {
  start: 'a',
  nodes: {
    a: { speaker: 'narrator', text: 'Sam unpicks the wedding thread. Inside: a rusty key on a tag, half of a ₹500 note, and a folded letter.', next: 'b' },
    b: { speaker: 'goti', text: 'Half a note. HALF. Who pays with half a note?', next: 'c' },
    c: { speaker: 'sam', text: '“If you are reading this, you are not Zikomo. Good. The key opens what the cinema keeps. The music is in the drum. —R.”', next: 'd' },
    d: { speaker: 'pakya', text: '“The music is in the drum.” Poetic. Useless, but poetic.', next: 'e' },
    e: { speaker: 'maru', text: 'The key tag says “Shree Talkies, 47”. The old cinema. It has been closed since 1999. It is haunted. Everybody knows it is haunted.', next: 'f' },
    f: {
      speaker: 'sam',
      text: 'Then we go in daylight. And we go in together. Mostly together. Some of us.',
      effects: [{ take: 'packet' }, { give: 'lockerkey' }, { give: 'halfnote' }, { flag: 'packet.open' }, { complete: 'reveal.packet' }],
    },
  },
};

/* ═════════════ Discovery 2: getting into the cinema ═════════════ */
extend(
  'pappu',
  (s) => (act(s, 'reveal') && f(s, 'packet.open') && !f(s, 'cinema.open') ? 'p3_key' : undefined),
  {
    p3_key: {
      speaker: 'pappu',
      text: 'Shree Talkies? My uncle ran the projector there. I still have his key. Nobody has been inside for twenty years. …Except last month I saw a light in the projection booth.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Ask for the key honestly, and tell him why.', next: 'p3_key_sam' },
        { who: 'pakya', tag: 'Bluff', text: '“We are municipal inspectors. The building is being condemned.”', effects: [{ claim: 'gang.who', value: 'municipal inspectors' }], next: 'p3_key_pak' },
        { who: 'goti', tag: 'Something weird', text: 'Ask if the cinema has any holes a round man could fit through.', next: 'p3_key_goti' },
        { text: 'Never mind.', next: 'p3_bye' },
      ],
    },
    p3_key_sam: { speaker: 'sam', text: 'Pappu bhai, someone hid something there that belongs to this whole colony. We want to give it back. That is the truth.', branch: (s) => (susp(s, 'pappu') < 50 ? 'p3_key_yes' : 'p3_key_no') },
    p3_key_yes: { speaker: 'pappu', text: 'The truth? From you four? …Take it. Bring it back. And if there is a ghost, I want a haircut appointment with it.', effects: [{ flag: 'cinema.open' }, { give: 'cinemakey' }, { toast: 'Pappu gave you the cinema key. The back door is behind the cinema.' }] },
    p3_key_no: { speaker: 'pappu', text: 'Your friends have told me five different jobs this month. Today you want truth? No key.', effects: [{ toast: 'Pappu doesn’t trust you. Smooth things over, or find another way in.' }] },
    p3_key_pak: { speaker: 'pappu', text: 'Municipal inspectors.', branch: (s) => (s.flags['tell.contra'] ? 'p3_key_caught' : 'p3_key_yes') },
    p3_key_caught: { speaker: 'pappu', text: 'Last month census officers. Today municipal inspectors. Tomorrow astronauts? Get out of my chair.', effects: [{ suspicion: 'pappu', delta: 15 }] },
    p3_key_goti: { speaker: 'pappu', text: '*looks at Goti for a long time* There is a broken vent at the back. Too small for a grown man. You would fit perfectly.', effects: [{ toast: 'There is a vent at the cinema’s back door. Goti could squeeze through it.' }] },
    p3_bye: { speaker: 'pappu', text: 'Fifty for a haircut.' },
  },
);

/* ═════════════ Discovery 3: locker 47 ═════════════ */
DIALOGUES_3.locker = {
  start: 'a',
  nodes: {
    a: { speaker: 'narrator', text: 'The key turns with a groan. Inside locker 47: a fat cloth-bound book and a stack of printed lottery tickets.', next: 'b' },
    b: { speaker: 'sam', text: '“GOLDEN RUPEE LUCKY DRAW. Zikomo Enterprises.” Collected from Shanti Nagar: ₹4,44,444. Prizes paid: zero.', next: 'c' },
    c: { speaker: 'pakya', text: 'Zikomo ran a lottery? HERE? I bought a ticket! Everybody bought a ticket!', next: 'd' },
    d: { speaker: 'sam', text: 'Every name is in here. Lalaji, two thousand. Tiwari-ji, five thousand. Bablu, eight hundred. Kamla, twelve hundred. And the winning ticket was… number 4444.', next: 'e' },
    e: { speaker: 'maru', text: 'Four four four four. That’s OURS. We bought it last year! We lost it! I SAID we won! Nobody listens to Maru!', next: 'f' },
    f: { speaker: 'goti', text: 'We didn’t lose it. I kept it somewhere very safe. Inside my rubber chicken.', branch: (s) => (f(s, 'end.fake') ? 'g_home' : 'g_hostage') },
    g_home: { speaker: 'goti', text: 'The chicken is in my trunk in the hideout. Squeeze it gently. It squeaks.', next: 'h' },
    g_hostage: { speaker: 'goti', text: '…which Zikomo took as a hostage when he searched the hideout. So. Our ticket is in Zikomo’s car.', effects: [{ flag: 'chicken.zikomo' }], next: 'h' },
    h: { speaker: 'sam', text: 'So Zikomo cheated the whole colony. Rahul found out and took the book that proves it. And the money?', next: 'i' },
    i: {
      speaker: 'pakya',
      text: '“The music is in the drum.”',
      effects: [{ give: 'register' }, { flag: 'locker.open' }, { complete: 'reveal.locker' }],
    },
  },
};

/* ═════════════ Discovery 4: knocking on the drum ═════════════ */
const knockChoices = (prefix: string) => [
  { text: 'Knock near the left skin.', effects: [{ sfx: 'knockDull' as const }], next: `${prefix}left` },
  { text: 'Knock the middle of the barrel.', effects: [{ sfx: 'knockWood' as const }], next: `${prefix}mid` },
  {
    text: 'Knock beside the strap, on the right.',
    showIf: (s: StateView) => !s.flags['daadi.skin'],
    effects: [{ sfx: 'knockHollow' as const }],
    next: 'hollow',
  },
  {
    text: 'Knock where Rahul kept re-gluing it at midnight: the right side.',
    showIf: (s: StateView) => !!s.flags['daadi.skin'],
    effects: [{ sfx: 'knockHollow' as const }],
    next: 'hollow',
  },
];

DIALOGUES_3.knock = {
  start: (s) => (s.active === 'goti' ? 'a' : 'other'),
  nodes: {
    other: { speaker: 'me', text: '*knock knock* …It sounds exactly like a drum. Goti says he can hear things in wood. Goti says a lot of things.' },
    a: { speaker: 'narrator', text: 'Goti presses his ear to the barrel and knocks, very seriously, like a doctor.', choices: knockChoices('') },
    left: { speaker: 'goti', text: 'Dhum. Normal. Healthy skin. Next.', choices: knockChoices('') },
    mid: { speaker: 'goti', text: 'Thok. Solid wood. Very solid. Suspiciously solid? No. Just solid.', choices: knockChoices('') },
    hollow: { speaker: 'narrator', text: 'Tok. Tok. TOK. Hollow. Goti prises a panel loose with a spoon.', effects: [{ sfx: 'cash' }], next: 'cash' },
    cash: { speaker: 'narrator', text: 'Bundles of rupees slide out of the false wall, tied with wedding thread. A lot of bundles. An unreasonable number of bundles.', next: 'c2' },
    c2: { speaker: 'goti', text: '…Guys. The music is in the drum.', next: 'c3' },
    c3: { speaker: 'pakya', text: 'That is the most beautiful sentence anyone has ever said.', next: 'c4' },
    c4: { speaker: 'sam', text: 'Nobody touches it. NOBODY. It is not ours. Maru, stop counting.', next: 'c5' },
    c5: {
      speaker: 'maru',
      text: 'Four lakh, forty-four thousand, four hundred and forty-four. I can’t stop. My hands won’t stop.',
      effects: [{ flag: 'drum.open' }, { complete: 'reveal.drum' }, { event: 'drumOpen' }],
    },
  },
};

extend(
  'daadi',
  (s) => (act(s, 'reveal') && !f(s, 'daadi.skin') ? 'p3_skin' : undefined),
  {
    p3_skin: {
      speaker: 'daadi',
      text: 'Rahul and that drum. Every midnight: bang bang bang, re-gluing the right side. Always the right side. I sold it in self-defence.',
      effects: [{ flag: 'daadi.skin' }, { complete: 'reveal.daadi' }],
    },
  },
);

extend(
  'tiwari',
  (s) => (['reveal', 'finale'].some((m) => act(s, m)) && s.dhol === 'tiwari' ? 'p2_hasdhol' : undefined),
  {},
);

/* ═════════════ Discovery 5: the projection booth ═════════════ */
DIALOGUES_3.booth = {
  start: (s) => (f(s, 'rahul.out') ? 'open' : f(s, 'drum.open') ? 'code' : 'hum'),
  nodes: {
    hum: { speaker: 'narrator', text: 'Behind the door, someone is humming an old film song. You knock. The humming stops. The bolt stays shut.', next: 'hum2' },
    hum2: { speaker: 'maru', text: 'Ghost. GHOST. A ghost who knows old songs. That is the worst kind.' },
    open: { speaker: 'narrator', text: 'The booth is a tiny flat now: a mat, a kettle, and eleven of Bablu’s samosa wrappers.' },
    code: {
      speaker: 'narrator',
      text: 'The humming again. Then a voice, very close to the door: “Who is it?”',
      choices: [
        { text: '“The music is in the drum.”', next: 'code2' },
        { who: 'pakya', tag: 'Bluff', text: '“Cinema inspection. Open up.”', next: 'nope' },
      ],
    },
    nope: { speaker: 'narrator', text: 'Silence. Then, faintly: “There has been no cinema here since 1999. Nice try.”', choices: [{ text: '“…The music is in the drum.”', next: 'code2' }] },
    code2: { speaker: 'narrator', text: 'The bolt slides back. A thin man with a beard, a samosa and a lot of worry peers out.', effects: [{ flag: 'rahul.out' }, { sfx: 'door' }], next: 'r1' },
    r1: { speaker: 'rahul', text: 'You found the money. Then you already know half of it. I was Zikomo’s accountant. His lottery took four lakh rupees from this colony and paid nothing.', next: 'r2' },
    r2: { speaker: 'rahul', text: 'I took the money back and the book that proves it. Hid the money in my dhol, the book here, and myself with the book. Then Daadi sold my dhol for forty rupees.', next: 'r3' },
    r3: { speaker: 'goti', text: 'We found it! Then we lost it. Then we found it again. It has been a big week for the drum.', next: 'r4' },
    r4: { speaker: 'rahul', text: 'Tonight Zikomo comes for it with everything he has. So tonight we give the money back, at Bablu’s stall, in front of everyone. Let him try taking it from the whole colony.', next: 'r5' },
    r5: { speaker: 'sam', text: 'A public plan. Witnesses. Proof. Timing. I love it. I hate it. I love it.', next: 'r6' },
    r6: { speaker: 'maru', text: 'Can we vote? I vote no.', effects: [{ complete: 'reveal.rahul' }] },
  },
};

DIALOGUES_3.rahul = {
  start: (s) => (act(s, 'finale') ? 'finale' : 'idle'),
  nodes: {
    idle: { speaker: 'rahul', text: 'Ritu thinks I’m in Dubai. Don’t tell her yet. Actually, tell her. No, don’t. I’ll tell her. Tonight.' },
    finale: { speaker: 'rahul', text: 'Witnesses, the drum, and Zikomo kept busy. Then we let the colony see the book. Go!' },
  },
};

extend(
  'jai',
  (s) => (act(s, 'reveal') && s.has('halfnote') && !f(s, 'jai.note') ? 'p3_note' : act(s, 'finale') ? 'p3_finale' : undefined),
  {
    p3_note: { speaker: 'jai', text: 'That’s half of Rahul’s note. He kept the other half. Whoever brings it, he’ll trust. So he trusts you now. Heaven help him.', effects: [{ flag: 'jai.note' }] },
    p3_finale: { speaker: 'jai', text: 'I’ve got the big one, Bhaloo, chasing me round the temple. Do your part quickly. I am not a fast runner.' },
  },
);

/* ═════════════ The finale: witnesses ═════════════ */
const WITNESS_REASON: Record<string, string> = {
  tiwari: 'Tonight? At the chai stall? I am busy. I am busy waiting for my rent.',
  lalaji: 'Close my shop? In the evening? That is when the money comes in.',
  bablu: 'I am AT the chai stall. I am always at the chai stall. What exactly is happening at my chai stall?',
  pappu: 'An event at the chai stall? Will there be people? People need haircuts.',
};
const WITNESS_YES: Record<string, string> = {
  tiwari: 'My lottery money? Five thousand rupees? I will be there before you.',
  lalaji: 'My two thousand? From that crook’s lottery? I am closing the shop. I have never closed the shop.',
  bablu: 'My eight hundred! I will make free chai for everyone. One cup each. Small cups.',
  pappu: 'If this is true, I am telling everyone. If it is false, I am also telling everyone.',
};

for (const npc of ['tiwari', 'lalaji', 'bablu', 'pappu']) {
  extend(
    npc,
    (s) => (act(s, 'finale') && !f(s, `witness.${npc}`) && !f(s, `refused.${npc}`) ? 'p3_w' : act(s, 'finale') && f(s, `witness.${npc}`) ? 'p3_w_done' : undefined),
    {
      p3_w: {
        speaker: npc,
        text: WITNESS_REASON[npc],
        choices: [
          { who: 'sam', tag: 'Negotiate', text: 'Ask him to come to the chai stall tonight: his lottery money is coming back.', next: 'p3_w_sam' },
          {
            who: 'sam',
            tag: 'Come clean',
            text: 'Admit every lie the gang told him first. All of them.',
            showIf: (s) => susp(s, npc) >= 50,
            effects: [{ suspicion: npc, delta: -45 }, { stat: 'gang.harmony', delta: -4 }, { flag: `confessed.${npc}` }],
            next: 'p3_w_clean',
          },
          { who: 'pakya', tag: 'Bluff', text: '“There’s free chai and a film star at the stall tonight.”', effects: [{ flag: `bluffed.${npc}` }], next: 'p3_w_pak' },
          { text: 'Not now.', next: 'p3_w_bye' },
        ],
      },
      p3_w_sam: { speaker: 'sam', text: 'Tonight, at Bablu’s stall. Proof of Zikomo’s lottery, and the money he took. Yours included.', branch: (s) => (susp(s, npc) < 50 ? 'p3_w_yes' : 'p3_w_no') },
      p3_w_no: {
        speaker: npc,
        text: 'You four have lied to me all month. Why would I walk across the road for another story?',
        effects: [{ toast: 'Too suspicious to listen. Come clean, or let Sam smooth it over first.' }],
      },
      p3_w_clean: { speaker: 'sam', text: 'Pakya is not a bank officer. Or a film producer. Or income tax. We are four unemployed men. But this time, it’s true.', next: 'p3_w_clean2' },
      p3_w_clean2: { speaker: npc, text: '…That is the most honest thing anyone has said to me in years. Fine. I’ll come.', next: 'p3_w_yes' },
      p3_w_pak: { speaker: npc, text: 'A film star? At Bablu’s? …Fine, I’ll come. But if there is no film star, I will remember.', effects: [{ flag: `witness.${npc}` }, { event: `witness:${npc}` }] },
      p3_w_yes: { speaker: npc, text: WITNESS_YES[npc], effects: [{ flag: `witness.${npc}` }, { event: `witness:${npc}` }] },
      p3_w_done: { speaker: npc, text: 'I said I’m coming. Stop asking, or I’ll stop coming.' },
      p3_w_bye: { speaker: npc, text: 'Hmph.' },
    },
  );
}

/* ═════════════ The finale: Shambhu has the drum ═════════════ */
extend(
  'shambhu',
  (s) => (act(s, 'finale') && s.dhol === 'cart' ? 'p3_cart' : undefined),
  {
    p3_cart: {
      speaker: 'shambhu',
      text: 'That drum? Tiwari-ji sold it to me this morning: “junk from the bachelors’ room, for rent arrears”. You want it back? ₹400.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Offer the first pick of every bachelor’s junk in the colony, for life.', next: 'p3_cart_sam' },
        { text: 'Pay ₹400.', showIf: (s) => s.money >= 400, effects: [{ money: -400 }], next: 'p3_cart_give' },
        { text: 'Leave it. Goti could search the cart instead.', next: 'p3_cart_bye' },
      ],
    },
    p3_cart_sam: { speaker: 'shambhu', text: 'For life? …Done. You drive a hard bargain for a man with no money.', next: 'p3_cart_give' },
    p3_cart_give: { speaker: 'narrator', text: 'Shambhu heaves the dhol off his cart. It is heavier than a dhol should be, and everyone pretends not to notice.', effects: [{ dholTo: 'carry' }, { event: 'gotDrum' }] },
    p3_cart_bye: { speaker: 'shambhu', text: 'Raddi! Old things, new money!' },
  },
);

/* ═════════════ The climax at the chai stall ═════════════ */
DIALOGUES_3.climax = {
  start: (s) => {
    const e = s.m('ending') as string;
    return e === 'collapse' ? 'col1' : e?.startsWith('blame') ? 'bl1' : e === 'fortune' ? 'fo1' : 'tr1';
  },
  nodes: {
    // ── triumph ──
    tr1: { speaker: 'rahul', text: 'Shanti Nagar! This book is Zikomo’s lottery. Every rupee you paid, and every rupee he never paid out. And this drum is where I hid it.', next: 'tr2' },
    tr2: { speaker: 'zikomo', text: 'Lies! These four are famous liars! Ask anyone!', next: 'tr3' },
    tr3: { speaker: 'tiwari', text: 'They are famous liars. But this book has my name and my five thousand rupees in it. In YOUR handwriting.', next: 'tr4' },
    tr4: { speaker: 'narrator', text: 'Sirens. An actual income tax team pulls up, called by a very nervous Bablu. Zikomo tries to leave and steps into the drain in his white shoes.', next: 'tr5' },
    tr5: { speaker: 'pakya', text: 'The REAL income tax department. I always said I had connections.', next: 'end' },
    // ── collapse ──
    col1: { speaker: 'zikomo', text: 'Look at them! Bank officers! Film producers! Income tax! Census! Which liar do you believe today, Shanti Nagar?', next: 'col2' },
    col2: { speaker: 'narrator', text: 'Nobody steps forward. Every face in the crowd remembers a different story the four of them told.', next: 'col3' },
    col3: { speaker: 'zikomo', text: 'As I thought. Bhaloo, the drum. Gently. It is full of my… music.', next: 'col4' },
    col4: { speaker: 'sam', text: 'We had the truth this time. We just used up everybody’s patience before we got to it.', next: 'end' },
    // ── one idiot too many ──
    bl1: { speaker: 'rahul', text: 'Shanti Nagar! This book is Zikomo’s lottery—', next: 'bl2' },
    bl2: { speaker: 'narrator', text: 'Everybody turns. Not to Rahul. To one of the four friends, who is, as usual, causing a scene.', next: 'bl3' },
    bl3: { speaker: 'zikomo', text: 'THAT one! That one has been making trouble all week! Do you trust a gang with THAT one in it?', next: 'bl4' },
    bl4: { speaker: 'narrator', text: 'In the confusion the money comes back, the book gets read, and Zikomo slinks away. But the colony has decided exactly whose fault the chaos was.', next: 'end' },
    // ── raining rupees ──
    fo1: { speaker: 'narrator', text: 'Too many things happen at once. Someone trips. Someone screams. The drum hits the ground, and the false panel pops open.', next: 'fo2' },
    fo2: { speaker: 'narrator', text: 'Rupees rain over the chai stall. The whole colony grabs at them, shouting the exact amounts they paid into Zikomo’s lottery.', next: 'fo3' },
    fo3: { speaker: 'zikomo', text: 'MY MONEY! …Your money. Our money? Whose money is this?', next: 'fo4' },
    fo4: { speaker: 'goti', text: 'Everybody’s! It worked! Nothing went to plan and it still worked!', next: 'end' },
    end: { speaker: 'narrator', text: 'And that was the night Shanti Nagar got its money back. Mostly.', effects: [{ event: 'showEnding' }] },
  },
};

extend(
  'zikomo',
  (s) => (act(s, 'finale') ? 'p3_night' : act(s, 'reveal') ? 'p3_morning' : undefined),
  {
    p3_morning: { speaker: 'zikomo', text: 'A biscuit tin. With strings. I want my money, I want my drum, and I want my dignity back. In that order.' },
    p3_night: { speaker: 'zikomo', text: 'Night is coming, idiots. When it comes, I take my drum, my money, and anyone standing near either.' },
  },
);
