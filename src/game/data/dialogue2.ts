/**
 * Part 2 writing. Everything here is original.
 * Existing Part 1 scripts are extended with `extend()` so the same NPC talks differently per mission.
 */
import type { DialogueNode, DialogueScript, Effect, StateView } from '../types';

const f = (s: StateView, k: string) => !!s.flags[k];
const act = (s: StateView, m: string) => s.missionStatus(m) === 'active';
const done = (s: StateView, o: string) => s.objectiveDone(o);
const susp = (s: StateView, n: string) => s.suspicion(n);

type Nodes = Record<string, DialogueNode>;
type Start = (s: StateView) => string | undefined;

/** New scripts that did not exist in Part 1. */
export const DIALOGUES_2: Record<string, DialogueScript> = {};

/** Part 2 additions to Part 1 scripts: a start override plus extra nodes. */
export const EXTENSIONS: Array<{ id: string; start: Start; nodes: Nodes }> = [];

const extend = (id: string, start: Start, nodes: Nodes) => EXTENSIONS.push({ id, start, nodes });

/* ═════════════════════ 1. THE RICH GIRL PLAN ═════════════════════ */

const like = (key: string) => [{ flag: `likes.${key}` }, { event: 'like' }];

extend(
  'daadi',
  (s) => {
    if (act(s, 'rich') && susp(s, 'daadi') >= 50) return 'p2_cold';
    if (act(s, 'rich') && done(s, 'rich.moves') && !done(s, 'rich.result')) return 'p2_rahul';
    if (act(s, 'rich') && !f(s, 'likes.songs')) return 'p2_songs';
    if (act(s, 'dhol') && !f(s, 'clue.daadi')) return susp(s, 'daadi') >= 60 ? 'p2_cold' : 'p2_sold';
    return undefined;
  },
  {
    p2_cold: {
      speaker: 'daadi',
      text: 'Cable man. Census man. Welcome committee. Film producer. How many people are you, exactly? I am not talking to any of them.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Apologise properly, with folded hands and no excuses.', next: 'p2_sorry' },
        { text: 'Leave quietly.', next: 'p2_cold_bye' },
      ],
    },
    p2_sorry: {
      speaker: 'sam',
      text: 'Daadi, we lied. Constantly. It is a disease. We are getting treatment. Today’s treatment is honesty.',
      effects: [{ suspicion: 'daadi', delta: -40 }],
      next: 'p2_sorry2',
    },
    p2_sorry2: { speaker: 'daadi', text: '…At least you admit it. Sit. Not on the good sofa.' },
    p2_cold_bye: { speaker: 'daadi', text: 'Hmph.' },
    p2_songs: {
      speaker: 'daadi',
      text: 'What does Ritu like? Old film songs. She hums them all day. Her brother used to play them on his dhol, badly, at midnight.',
      effects: like('songs'),
      next: 'p2_songs2',
    },
    p2_songs2: { speaker: 'daadi', text: 'And she hates liars. Her grandfather was a liar. Lovely man. Terrible liar.', effects: [{ flag: 'likes.liars' }] },
    p2_rahul: {
      speaker: 'daadi',
      text: 'She won’t tell you herself? Fine. Her brother Rahul has not come home in three weeks. And a stranger called Jai keeps standing outside my gate.',
      effects: [{ flag: 'rahul.fromDaadi' }, { complete: 'rich.result' }],
    },
    p2_sold: {
      speaker: 'daadi',
      text: 'Rahul’s dhol? That noisy thing? I sold it to Shambhu the kabadiwala for forty rupees. It was giving me headaches even when nobody played it.',
      effects: [{ flag: 'clue.daadi' }, { event: 'clue' }],
      next: 'p2_sold2',
    },
    p2_sold2: { speaker: 'me', text: 'You sold the one thing everyone in this colony is looking for. For forty rupees.' },
  },
);

extend(
  'kids',
  (s) => {
    if (act(s, 'rich') && !f(s, 'likes.dogs')) return 'p2_dog';
    if (act(s, 'dhol') && f(s, 'clue.lalaji') && !f(s, 'clue.kids')) return 'p2_moti';
    if (act(s, 'dhol') && !f(s, 'clue.lalaji')) return 'p2_noclue';
    return undefined;
  },
  {
    p2_dog: {
      speaker: 'pinky',
      text: 'Ritu didi? She feeds Moti every evening. She says Moti is the only honest man in this colony.',
      effects: like('dogs'),
      next: 'p2_dog2',
    },
    p2_dog2: { speaker: 'chintu', text: 'Moti is not a man.', next: 'p2_dog3' },
    p2_dog3: { speaker: 'pinky', text: 'That is why he is honest.' },
    p2_noclue: { speaker: 'chintu', text: 'A drum? We don’t have a drum. We have a bat with a crack and a ball with a different crack.' },
    p2_moti: {
      speaker: 'pinky',
      text: 'Oh, the drum! We used it as stumps. Then Moti grabbed the strap and ran off with it like a bone.',
      next: 'p2_moti2',
    },
    p2_moti2: {
      speaker: 'chintu',
      text: 'He dragged it past the carrom uncles, behind the old cinema. You can still see his footprints. He has very muddy feet.',
      effects: [{ flag: 'clue.kids' }, { flag: 'paws' }, { event: 'clue' }],
    },
  },
);

extend(
  'lalaji',
  (s) => {
    if (act(s, 'rich') && !f(s, 'likes.jalebi')) return 'p2_jalebi';
    if (act(s, 'rich') && !s.has('jalebi')) return 'p2_buy';
    if (act(s, 'jai') && !s.flags['story.lalaji']) return 'p2_jai';
    if (act(s, 'dhol') && f(s, 'clue.shambhu') && !f(s, 'clue.lalaji')) return susp(s, 'lalaji') >= 50 ? 'p2_refuse' : 'p2_drum';
    if (act(s, 'chaos') && s.flags['chaos.planA'] && !s.has('fakedhol') && !f(s, 'chaos.lalajiDone')) return f(s, 'chaos.lalajiWait') ? 'p2_wed_back' : 'p2_wed';
    return undefined;
  },
  {
    p2_jalebi: {
      speaker: 'lalaji',
      text: 'Ritu? She buys jalebi every afternoon. Hot, extra syrup. I know because she pays. Unlike some people.',
      effects: like('jalebi'),
      next: 'p2_buy',
    },
    p2_buy: {
      speaker: 'lalaji',
      text: 'You want jalebi? Twenty rupees.',
      choices: [
        { text: 'Pay twenty rupees.', showIf: (s) => s.money >= 20, effects: [{ money: -20 }, { give: 'jalebi' }], next: 'p2_paid' },
        { who: 'sam', tag: 'Negotiate', text: 'Propose a “jalebi now, payment later” arrangement.', next: 'p2_credit' },
        { who: 'pakya', tag: 'Bluff', text: '“I’m a food critic. Jalebi reviews are free.”', effects: [{ claim: 'pakya.job', value: 'food critic' }], next: 'p2_critic' },
        { text: 'Not today.', next: 'p2_bye' },
      ],
    },
    p2_paid: { speaker: 'lalaji', text: 'Cash! In my shop! From you! I need to sit down.' },
    p2_credit: { speaker: 'sam', text: 'Lalaji. Long-term customers. Excellent references. A jalebi today builds loyalty for life.', branch: (s) => (susp(s, 'lalaji') < 50 ? 'p2_credit_ok' : 'p2_credit_no') },
    p2_credit_ok: { speaker: 'lalaji', text: '…One cone. On the tab. The tab is now longer than my arm.', effects: [{ give: 'jalebi' }] },
    p2_credit_no: { speaker: 'lalaji', text: 'Loyalty? Your friends have told me four different jobs this week. No credit for liars.' },
    p2_critic: {
      speaker: 'lalaji',
      text: 'A food critic? Bablu said you were a bank officer. Tiwari-ji said income tax. Make up your mind and then come back with money.',
      branch: (s) => (s.flags['tell.contra'] ? 'p2_bye' : 'p2_critic_ok'),
    },
    p2_critic_ok: { speaker: 'lalaji', text: 'Fine. One cone. If the review is bad, I will find you.', effects: [{ give: 'jalebi' }] },
    p2_bye: { speaker: 'lalaji', text: 'Ram Ram.' },
    p2_jai: {
      speaker: 'lalaji',
      text: 'The man in the cap? Said he was Ritu’s cousin from Delhi. Bought one matchbox. Cousins buy more than one matchbox.',
      effects: [{ flag: 'story.lalaji' }, { story: 'jai', teller: 'lalaji', value: 'Ritu’s cousin from Delhi' }],
    },
    p2_refuse: {
      speaker: 'lalaji',
      text: 'I don’t talk to liars. Bank officer, food critic, income tax. Out. Unless you are buying, and you are never buying.',
      effects: [{ toast: 'Lalaji won’t talk. Sam could smooth it over, or Maru distracts him while Goti checks his ledger.' }],
    },
    p2_drum: {
      speaker: 'lalaji',
      text: 'That old drum? Yes, I bought it. Then the cricket children “borrowed” it for stumps. They returned a ball. A ball is not a drum.',
      effects: [{ flag: 'clue.lalaji' }, { event: 'clue' }],
    },
    p2_wed: {
      speaker: 'lalaji',
      text: 'My wedding dhol? The one with the tassels? For rent? Three hundred a day.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Offer free labour: Goti will fix every fridge in the shop.', next: 'p2_wed_deal' },
        { text: 'Pay three hundred rupees.', showIf: (s) => s.money >= 300, effects: [{ money: -300 }, { give: 'fakedhol' }, { flag: 'chaos.lalajiDone' }], next: 'p2_wed_paid' },
        { text: 'Leave.', next: 'p2_bye' },
      ],
    },
    p2_wed_deal: {
      speaker: 'lalaji',
      text: 'Hmm. Hmm. Let me count my coins first. Come back in twenty seconds. Don’t touch anything while you wait.',
      branch: (s) => (susp(s, 'lalaji') < 50 ? 'p2_wed_wait' : 'p2_wed_no'),
    },
    p2_wed_wait: {
      speaker: 'narrator',
      text: 'Lalaji begins counting. Sam has to stay in the shop while he does.',
      effects: [{ flag: 'chaos.lalajiWait' }, { event: 'lalajiWait' }],
    },
    p2_wed_no: { speaker: 'lalaji', text: '…No. Too many lies in this colony lately. Ask your round friend to build a drum out of rubbish.', effects: [{ event: 'lalajiRefused' }] },
    p2_wed_back: {
      speaker: 'lalaji',
      text: 'Four hundred and twelve rupees and one button. Fine. Take the wedding dhol. Bring it back without a scratch, or I will scratch you.',
      branch: (s) => (s.flags['chaos.waited'] ? 'p2_wed_give' : 'p2_wed_notyet'),
    },
    p2_wed_notyet: { speaker: 'lalaji', text: 'I said twenty seconds. I am at three hundred and six. Stand there.' },
    p2_wed_give: { speaker: 'narrator', text: 'Sam receives a tasselled wedding dhol. It looks nothing like Rahul’s. From far away, in bad light, maybe.', effects: [{ give: 'fakedhol' }, { flag: 'chaos.lalajiDone' }] },
    p2_wed_paid: { speaker: 'lalaji', text: 'Three hundred! I will tell my grandchildren about this.' },
  },
);

/* Ritu, walking around the colony. Every friend gets a move, and the others butt in. */
const RITU_MOVE = (who: string, trust: number, score: number): Effect[] => [
  { flag: `move.${who}` },
  { stat: 'ritu.trust', delta: trust },
  { stat: `score.${who}`, delta: score },
  { event: 'move' },
];

DIALOGUES_2.ritu2 = {
  start: (s) => {
    if (!act(s, 'rich')) return f(s, 'rahul.told') ? 'idle_after' : 'idle';
    if (done(s, 'rich.moves')) return 'result';
    if (f(s, `move.${s.active}`)) return 'already';
    if (s.crowd.length) return `butt_${s.crowd[0]}`;
    return `${s.active}_open`;
  },
  nodes: {
    idle: { speaker: 'ritu', text: 'Hello again. Daadi says I should not talk to you four. Daadi is usually right.' },
    idle_after: { speaker: 'ritu', text: 'Any news about Rahul bhaiya? Tell me if you hear anything. Anything true.' },
    already: { speaker: 'ritu', text: 'You already had your turn. Let your friends embarrass themselves too.' },
    // friends barging in
    butt_sam: { speaker: 'sam', text: 'Sorry, sorry. Just reminding everyone that this was MY plan originally.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_pakya: { speaker: 'pakya', text: '*slides in* Ritu-ji, whatever he says, I said it better earlier.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_goti: { speaker: 'goti', text: 'Hi! Hi. Hello. I’m also here. Is this a group thing? It feels like a group thing.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_maru: { speaker: 'maru', text: 'Is Daadi coming? I feel like Daadi is coming. Should we run? I’m running. No, I’m staying.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },

    sam_open: {
      speaker: 'sam',
      text: 'Ritu-ji. What a coincidence. I happened to be passing, at exactly this time, as planned. As not planned.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Offer her the jalebi, casually.', showIf: (s) => s.has('jalebi'), effects: [{ take: 'jalebi' }], next: 'sam_jal' },
        { text: 'Present his five-year plan for her happiness.', next: 'sam_plan' },
        { text: 'Ask about her day, and actually listen.', next: 'sam_listen' },
      ],
    },
    sam_jal: { speaker: 'ritu', text: 'Jalebi? Hot? Extra syrup? Who told you?', branch: (s) => (f(s, 'likes.jalebi') ? 'sam_jal_good' : 'sam_jal_ok') },
    sam_jal_good: { speaker: 'sam', text: 'Research. Strategy. Also Lalaji.', effects: RITU_MOVE('sam', 15, 3), next: 'sam_jal_good2' },
    sam_jal_good2: { speaker: 'ritu', text: 'You did research. On jalebi. That is… actually sweet.' },
    sam_jal_ok: { speaker: 'ritu', text: 'Thank you. I don’t usually eat it, but this is nice.', effects: RITU_MOVE('sam', 6, 1) },
    sam_plan: { speaker: 'sam', text: 'Year one: we meet. Year two: we have chai. Year three—', next: 'sam_plan2' },
    sam_plan2: { speaker: 'ritu', text: 'Year three: I move to another city. Goodbye, Sam.', effects: RITU_MOVE('sam', -6, -1) },
    sam_listen: { speaker: 'ritu', text: 'My day? I looked for my brother’s old things. Then I fed a dog. Then four men followed me around.', next: 'sam_listen2' },
    sam_listen2: { speaker: 'sam', text: 'That sounds… hard. Except the dog part. And the four men part. Mostly the brother part.', effects: RITU_MOVE('sam', 9, 2) },

    pakya_open: {
      speaker: 'pakya',
      text: '*leans on a pole* Ritu-ji. Has anyone ever told you that you have a face for cinema?',
      choices: [
        { who: 'pakya', tag: 'Bluff', text: 'Claim to be a film producer, casting her in his next film.', effects: [{ claim: 'pakya.job', value: 'film producer' }], next: 'pak_bluff' },
        { text: 'Sing an old film song, badly.', showIf: (s) => f(s, 'likes.songs'), next: 'pak_song' },
        { text: 'Tell her the truth: he is unemployed, and broke.', effects: [{ claim: 'pakya.job', value: 'unemployed', truth: true }], next: 'pak_truth' },
      ],
    },
    pak_bluff: {
      speaker: 'ritu',
      text: 'A film producer?',
      branch: (s) => {
        const d = s.believes('daadi', 'pakya.job');
        if (s.flags['tell.contra'] || (d && d !== 'film producer')) return 'pak_caught';
        return f(s, 'likes.liars') ? 'pak_liar' : 'pak_bluff_ok';
      },
    },
    pak_caught: {
      speaker: 'ritu',
      text: 'Daadi told me you were the cable TV inspector. Last week you were a film producer for Tiwari-ji, and a bank officer for Bablu. Which one is it today?',
      effects: [{ suspicion: 'ritu', delta: 25 }, ...RITU_MOVE('pakya', -15, -3)],
      next: 'pak_caught2',
    },
    pak_caught2: { speaker: 'pakya', text: '…I am a man of many talents. And many business cards.' },
    pak_liar: { speaker: 'ritu', text: 'Producers don’t usually live in a rented room with three other men and one lemon. I don’t like liars, Pakya.', effects: RITU_MOVE('pakya', -8, -2) },
    pak_bluff_ok: { speaker: 'ritu', text: 'Ha! Okay, Mr. Producer. When the film releases, I’ll buy a ticket.', effects: RITU_MOVE('pakya', 4, 1) },
    pak_song: { speaker: 'narrator', text: 'Pakya sings a love song from an old film, with feeling, and in at least three different keys.', next: 'pak_song2' },
    pak_song2: { speaker: 'ritu', text: '*laughing* Bhaiya used to sing that one. Equally badly. Thank you.', effects: RITU_MOVE('pakya', 12, 3) },
    pak_truth: { speaker: 'ritu', text: 'Unemployed and broke. That is the first true thing anyone in your group has said to me. I respect it.', effects: RITU_MOVE('pakya', 10, 2) },

    goti_open: {
      speaker: 'goti',
      text: 'Hi! I brought you something. Close your eyes. No, open them. No—okay, whatever your eyes want.',
      choices: [
        { text: 'Give her the marigold garland.', showIf: (s) => s.has('marigolds'), effects: [{ take: 'marigolds' }], next: 'goti_flowers' },
        { text: 'Introduce her to Moti, formally.', showIf: (s) => f(s, 'likes.dogs'), next: 'goti_dog' },
        { who: 'goti', tag: 'Something weird', text: 'Show her the trick where a whole jalebi fits in his mouth.', showIf: (s) => s.has('jalebi'), effects: [{ take: 'jalebi' }], next: 'goti_jal' },
        { text: 'Tell her about the time he got stuck in a water tank.', next: 'goti_tank' },
      ],
    },
    goti_flowers: { speaker: 'narrator', text: 'Ritu takes the garland. Moti takes it from Ritu. Moti eats one marigold, and looks pleased about it.', next: 'goti_flowers2' },
    goti_flowers2: { speaker: 'ritu', text: 'Well. Moti liked it.', effects: RITU_MOVE('goti', 6, 1) },
    goti_dog: { speaker: 'goti', text: 'Ritu-ji, this is Moti. Moti, this is Ritu-ji. Moti, sit. Moti. Moti, please.', next: 'goti_dog2' },
    goti_dog2: { speaker: 'ritu', text: '*laughing* He doesn’t sit for anyone. You’re very strange, Goti. I like strange.', effects: RITU_MOVE('goti', 14, 3) },
    goti_jal: { speaker: 'narrator', text: 'The jalebi goes in. The jalebi does not come out. Goti gives a thumbs up with tears in his eyes.', effects: RITU_MOVE('goti', 5, 1) },
    goti_tank: { speaker: 'ritu', text: 'For six hours? And you sang to keep calm? You’re ridiculous.', effects: RITU_MOVE('goti', 4, 1) },

    maru_open: {
      speaker: 'maru',
      text: 'R-Ritu-ji. I wrote you a poem. It is about courage. I was too scared to write the ending.',
      choices: [
        { text: 'Recite the poem.', next: 'maru_poem' },
        { text: 'Sing the song her brother used to play on his dhol.', showIf: (s) => f(s, 'likes.songs'), next: 'maru_song' },
        { who: 'maru', tag: 'Make a scene', text: 'Panic and hide behind the nearest pole.', next: 'maru_hide' },
      ],
    },
    maru_poem: { speaker: 'maru', text: '“O moon, O light, O… Daadi?” *a cough from somewhere* DADI IS HERE. I’m fine. I’m… lying down now.', effects: [{ sfx: 'thud' }], next: 'maru_poem2' },
    maru_poem2: { speaker: 'ritu', text: 'That was not Daadi. That was Moti. Get up, poet.', effects: RITU_MOVE('maru', 8, 2) },
    maru_song: { speaker: 'narrator', text: 'Maru sings the old dhol song. His voice cracks on every high note. Ritu goes quiet.', next: 'maru_song2' },
    maru_song2: { speaker: 'ritu', text: 'Bhaiya sang exactly like that. Thank you, Maru. Really.', effects: RITU_MOVE('maru', 14, 3) },
    maru_hide: { speaker: 'ritu', text: 'Maru, the pole is thinner than you. I can see all of you.', effects: RITU_MOVE('maru', 1, 0) },

    // after all four moves
    result: {
      speaker: 'ritu',
      text: 'Okay. All four of you have tried. Now let me ask you something.',
      branch: (s) => (s.stat('ritu.trust') >= 45 ? 'confide' : 'meh'),
    },
    confide: { speaker: 'ritu', text: 'My brother Rahul hasn’t come home in three weeks. A man called Jai keeps asking about him. And about Bhaiya’s dhol.', next: 'confide2' },
    confide2: { speaker: 'ritu', text: 'I don’t know who to trust. You four are idiots. But you’re honest idiots. Mostly. Will you find out who Jai is?', effects: [{ flag: 'rahul.told' }, { complete: 'rich.result' }] },
    meh: {
      speaker: 'ritu',
      text: 'You’re sweet. And ridiculous. And I don’t trust a single one of you yet. If you want to know what is wrong in my house, ask Daadi.',
      effects: [{ toast: 'Ritu won’t confide in you. Daadi might talk instead.' }],
    },
  },
};

/* ═════════════════════ 2. WHO EXACTLY IS JAI? ═════════════════════ */

extend(
  'bablu',
  (s) => {
    if (act(s, 'jai') && !s.flags['story.bablu']) return 'p2_jai';
    if (act(s, 'zikomo')) return 'p2_scared';
    return undefined;
  },
  {
    p2_jai: {
      speaker: 'bablu',
      text: 'That Jai? He told me he’s from Pune, here for a job interview. Who goes to an interview in sunglasses? And who interviews for three weeks?',
      effects: [{ flag: 'story.bablu' }, { story: 'jai', teller: 'bablu', value: 'from Pune, for a job interview' }],
    },
    p2_scared: { speaker: 'bablu', text: 'Don’t stand near my stall! Zikomo’s men asked me about you. I told them everything. I panic-talk. I’m sorry. Here, free chai. Now go.' },
  },
);

extend(
  'pappu',
  (s) => {
    if (act(s, 'jai') && !s.flags['story.pappu']) return 'p2_jai';
    if (act(s, 'jai') && !done(s, 'jai.proof') && !s.has('register')) return 'p2_register';
    return undefined;
  },
  {
    p2_jai: {
      speaker: 'pappu',
      text: 'Jai? He came for a shave. Said he’s a musician, plays the dhol at weddings. Hands too soft for a dhol-wala. I notice hands. It’s my job.',
      effects: [{ flag: 'story.pappu' }, { story: 'jai', teller: 'pappu', value: 'a wedding dhol player' }],
      next: 'p2_register',
    },
    p2_register: {
      speaker: 'pappu',
      text: 'Everyone who sits in my chair writes their real name in my register. Customer privacy. Very strict. Very.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Trade a month of free word-of-mouth for one look at the register.', next: 'p2_reg_sam' },
        { who: 'pakya', tag: 'Bluff', text: '“We’re from the census. We need to see your register.”', effects: [{ claim: 'gang.who', value: 'census officers' }], next: 'p2_reg_pak' },
        { text: 'Never mind.', next: 'p2_reg_bye' },
      ],
    },
    p2_reg_sam: {
      speaker: 'pappu',
      text: 'A month? You four, walking around saying “Hero Cut Salon” all day? …Deal. Look quickly. “Jai Malhotra. Address: Dubai. Paid in dirhams.”',
      effects: [{ give: 'register' }, { event: 'proof' }],
    },
    p2_reg_pak: {
      speaker: 'pappu',
      text: 'Census? Last month you were a food critic in this chair. Sit down, census officer, your sideburns are uneven.',
      branch: (s) => (s.flags['tell.contra'] ? 'p2_reg_bye' : 'p2_reg_pak2'),
    },
    p2_reg_pak2: { speaker: 'pappu', text: '…Fine. Census. Quick look. “Jai Malhotra. Address: Dubai.” Now count my customers and leave.', effects: [{ give: 'register' }, { event: 'proof' }] },
    p2_reg_bye: { speaker: 'pappu', text: 'Fifty rupees for a haircut. Gossip is free. Registers are not.' },
  },
);

extend(
  'tiwari',
  (s) => {
    if (act(s, 'jai') && !s.flags['story.tiwari']) return 'p2_jai';
    if (act(s, 'chaos') && s.dhol === 'tiwari') return 'p2_hasdhol';
    if (act(s, 'chaos') && susp(s, 'tiwari') >= 60) return 'p2_wary';
    return undefined;
  },
  {
    p2_jai: {
      speaker: 'tiwari',
      text: 'The cap man? Asked if a room was free. Said he’s a land surveyor. He surveyed my face for ten minutes and left.',
      effects: [{ flag: 'story.tiwari' }, { story: 'jai', teller: 'tiwari', value: 'a land surveyor looking for a room' }],
    },
    p2_wary: { speaker: 'tiwari', text: 'I am watching you. Every one of you has told me a different story this month. I have started writing them down.' },
    p2_hasdhol: {
      speaker: 'tiwari',
      text: 'Your drum is with me. Rent first, drum later. That is the law. My law.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Pay two hundred rupees now as “goodwill”.', showIf: (s) => s.money >= 200, effects: [{ money: -200 }, { event: 'tiwariReturns' }], next: 'p2_back' },
        { who: 'pakya', tag: 'Bluff', text: '“That drum is evidence for the income tax department.”', showIf: (s) => s.believes('tiwari', 'pakya.job') === 'income tax officer', next: 'p2_tax' },
        { text: 'Leave it for now.', next: 'p2_keep' },
      ],
    },
    p2_back: { speaker: 'tiwari', text: 'Goodwill accepted. Take your noisy drum. Monday, the rest!' },
    p2_tax: { speaker: 'tiwari', text: 'Evidence?! Take it! I never touched it! I have never seen a drum in my life!', effects: [{ event: 'tiwariReturns' }] },
    p2_keep: { speaker: 'tiwari', text: 'It stays with me. It looks good next to my chair.' },
  },
);

DIALOGUES_2.jai = {
  start: (s) => {
    if (act(s, 'jai') && done(s, 'jai.proof')) return 'confront';
    if (act(s, 'jai')) return susp(s, 'jai') >= 60 ? 'angry' : 'brush';
    if (act(s, 'dhol') || act(s, 'chaos')) return 'later';
    return 'brush';
  },
  nodes: {
    brush: { speaker: 'jai', text: 'Do I know you? No. Good. Let’s keep it that way.', effects: [{ suspicion: 'jai', delta: 8 }] },
    angry: { speaker: 'jai', text: 'You four keep turning up wherever I go. Stop following me, or I disappear and you never see me again.', effects: [{ suspicion: 'jai', delta: 5 }] },
    later: { speaker: 'jai', text: 'Keep the dhol away from Zikomo. Whatever happens. Rahul’s life is inside that drum.' },
    confront: {
      speaker: 'jai',
      text: 'You’ve been asking about me all over the colony. Loudly. What do you want?',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Lay out the evidence, calmly and in order.', next: 'c_sam' },
        { who: 'pakya', tag: 'Bluff', text: '“We are CBI. Undercover. Very undercover.”', effects: [{ claim: 'gang.who', value: 'CBI officers' }], next: 'c_pak' },
        { who: 'goti', tag: 'Something weird', text: 'Hold up the photo. Upside down.', showIf: (s) => s.has('photo'), next: 'c_goti' },
        { who: 'maru', tag: 'Make a scene', text: 'Faint preemptively, to save time.', next: 'c_maru' },
      ],
    },
    c_sam: {
      speaker: 'sam',
      text: 'To Bablu you’re from Pune. To Lalaji you’re Ritu’s cousin. To Pappu you play the dhol. And your real name is Jai Malhotra, from Dubai. So?',
      next: 'reveal',
    },
    c_pak: { speaker: 'jai', text: '*laughs for a long time* CBI. You. Okay, CBI. Since you are so official, let me tell you something.', effects: [{ suspicion: 'jai', delta: 10 }], next: 'reveal' },
    c_goti: { speaker: 'jai', text: 'That’s me and Rahul. In Dubai. And you’re holding it upside down. Fine. You found me.', next: 'reveal' },
    c_maru: { speaker: 'narrator', text: 'Maru faints. Jai catches him, sighs, and props him against a wall like a broom.', next: 'reveal' },
    reveal: {
      speaker: 'jai',
      text: 'Rahul is my best friend. He’s not missing. He’s hiding. From a man called Zikomo.',
      next: 'reveal2',
    },
    reveal2: {
      speaker: 'jai',
      text: 'Before he ran, Rahul hid something inside his old dhol. If Zikomo finds that dhol before we do, Rahul is finished.',
      next: 'reveal3',
    },
    reveal3: { speaker: 'goti', text: 'What did he hide?', next: 'reveal4' },
    reveal4: {
      speaker: 'jai',
      text: 'The less you know, the less Zikomo can squeeze out of you. Which, with you four, is a real risk. Go home. Keep your heads down.',
      effects: [{ complete: 'jai.confront' }, { flag: 'jai.met' }],
    },
  },
};

/* ═════════════════════ 3. ZIKOMO IS LOOKING FOR YOU ═════════════════════ */

const zikRelease = [{ event: 'release' }];

DIALOGUES_2.zikomo = {
  start: (s) => (f(s, 'zik.caught') ? 'caught' : act(s, 'zikomo') ? 'walkup' : act(s, 'chaos') ? 'chaos' : 'idle'),
  nodes: {
    idle: { speaker: 'zikomo', text: 'Ah. The four idiots. My favourite idiots. Run along.' },
    chaos: { speaker: 'zikomo', text: 'Sunset. Your garage. My dhol. Simple, no?' },
    walkup: {
      speaker: 'zikomo',
      text: 'You walked up to me? On purpose? Either you are very brave or very stupid. Bablu says stupid.',
      next: 'menu',
    },
    caught: {
      speaker: 'zikomo',
      text: 'There you are. My men had to run. I hate when my men run. It wrinkles them.',
      next: 'menu',
    },
    menu: {
      speaker: 'zikomo',
      text: 'Rahul left something with his old dhol. I want it. And people say you four were asking about Rahul. Explain.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Offer a deal: you find the dhol for him, he leaves you alone.', next: 'deal' },
        { who: 'pakya', tag: 'Bluff', text: 'Become somebody important. Quickly.', next: 'pak' },
        { who: 'goti', tag: 'Something weird', text: 'Offer him the rubber chicken. As a sign of respect.', next: 'goti' },
        { who: 'maru', tag: 'Make a scene', text: 'Faint dramatically onto his white shoes.', next: 'maru' },
      ],
    },
    deal: {
      speaker: 'sam',
      text: 'Zikomo-ji. You want a dhol. We know this colony. Give us one day. We find it, you get it, everybody keeps their kneecaps.',
      branch: (s) => (susp(s, 'zikomo') < 60 ? 'deal_ok' : 'deal_no'),
    },
    deal_ok: {
      speaker: 'zikomo',
      text: '…I like a man with a plan. One day. If you cheat me, I will plant you in Lalaji’s rice sacks. My men will be watching.',
      effects: [{ flag: 'deal' }, { complete: 'zikomo.deal' }, { event: 'deal' }],
    },
    deal_no: { speaker: 'zikomo', text: 'A deal? From you? Bablu says you lie to everybody. Bhaloo, show them out. Gently. These shoes are new.', effects: zikRelease },
    pak: {
      speaker: 'pakya',
      text: 'Zikomo-ji, you are speaking to a very busy man. I am actually…',
      choices: [
        { who: 'pakya', tag: 'Bluff', text: '“…an income tax officer.”', effects: [{ claim: 'pakya.job', value: 'income tax officer' }], next: 'pak_check' },
        { who: 'pakya', tag: 'Bluff', text: '“…a film producer. You have a face for villain roles.”', effects: [{ claim: 'pakya.job', value: 'film producer' }], next: 'pak_check' },
        { who: 'pakya', tag: 'Bluff', text: '“…a bank officer. I know your accounts.”', effects: [{ claim: 'pakya.job', value: 'bank officer' }], next: 'pak_check' },
      ],
    },
    pak_check: {
      speaker: 'zikomo',
      text: 'Hmm.',
      branch: (s) => (s.flags['tell.contra'] ? 'pak_caught' : s.believes('zikomo', 'pakya.job') === 'income tax officer' ? 'pak_tax' : 'pak_ok'),
    },
    pak_caught: {
      speaker: 'zikomo',
      text: 'Bablu told my men you were something else entirely. You lie like a puppy: badly, and with enthusiasm. Throw him out.',
      effects: [{ suspicion: 'zikomo', delta: 15 }, ...zikRelease],
    },
    pak_tax: { speaker: 'zikomo', text: 'Income… tax? *checks shoes nervously* You can go. Tell your department I donate generously to temples.', effects: zikRelease },
    pak_ok: { speaker: 'zikomo', text: 'Interesting. Very interesting. Go. I will check. I always check.', effects: zikRelease },
    goti: { speaker: 'zikomo', text: 'A… chicken. A rubber chicken. *squeezes it* …I will keep this. Go away before I start liking you.', effects: zikRelease },
    maru: { speaker: 'narrator', text: 'Maru faints onto Zikomo’s white shoes. There is a long, terrible silence.', next: 'maru2' },
    maru2: { speaker: 'zikomo', text: 'Take him away. Take him FAR away. And bring me new socks.', effects: zikRelease },
  },
};

DIALOGUES_2.goon = {
  start: 'a',
  nodes: { a: { speaker: 'spanner', text: 'Keep walking, idiot. Unless you want to talk to the boss.' } },
};

DIALOGUES_2.zik_safe = {
  start: 'a',
  nodes: {
    a: { speaker: 'sam', text: 'Everyone here? Everyone breathing? Good. Zikomo wants Rahul’s dhol. Jai wants it safe. We want to not die.', next: 'b' },
    b: { speaker: 'goti', text: 'And rent.', next: 'c' },
    c: { speaker: 'sam', text: 'And rent. So we find that dhol before Zikomo does. Ritu’s Daadi will know where it went.', next: 'd' },
    d: { speaker: 'maru', text: 'I would like to formally register that I hate this plan.', effects: [{ complete: 'zikomo.gather' }] },
  },
};

/* ═════════════════════ 4. FIND THE DHOL ═════════════════════ */

extend(
  'ritu',
  (s) => {
    if (act(s, 'dhol') && !f(s, 'clue.daadi') && s.stat('ritu.trust') >= 45) return 'p2_help';
    if (['jai', 'zikomo', 'dhol', 'chaos', 'after'].some((m) => act(s, m))) return f(s, 'rahul.told') ? 'p2_worried' : 'p2_cool';
    return undefined;
  },
  {
    p2_help: { speaker: 'ritu', text: 'Bhaiya’s dhol was in the storeroom. It’s gone. Daadi! What did you do with Bhaiya’s drum?', next: 'p2_help2' },
    p2_help2: { speaker: 'daadi', text: 'Sold it. To Shambhu, the kabadiwala. Forty rupees. Best forty rupees of my life.', effects: [{ flag: 'clue.daadi' }, { event: 'clue' }] },
    p2_worried: { speaker: 'ritu', text: 'Any news about Bhaiya? Find his dhol before that man does. Please. And don’t lie to me about it.' },
    p2_cool: { speaker: 'ritu', text: 'Daadi says you four are trouble. I am starting to think Daadi is right.' },
  },
);

DIALOGUES_2.shambhu = {
  start: (s) => (act(s, 'dhol') && f(s, 'clue.daadi') && !f(s, 'clue.shambhu') ? 'ask' : 'junk'),
  nodes: {
    junk: { speaker: 'shambhu', text: 'Old newspapers? Old bottles? Old friends? I buy everything except feelings.' },
    ask: {
      speaker: 'shambhu',
      text: 'A drum from the yellow bungalow? Maybe I remember. Maybe I forget. My memory works better with twenty rupees in it.',
      choices: [
        { text: 'Pay twenty rupees.', showIf: (s) => s.money >= 20, effects: [{ money: -20 }], next: 'tell' },
        { who: 'sam', tag: 'Negotiate', text: 'Offer him first pick of the rented room’s junk.', next: 'tell_sam' },
        { who: 'pakya', tag: 'Bluff', text: '“I’m the municipal drum inspector. Information, please.”', effects: [{ claim: 'gang.who', value: 'municipal drum inspectors' }], next: 'tell' },
        { who: 'goti', tag: 'Something weird', text: 'Trade him a button, a bottle cap and one confident wink.', next: 'tell_goti' },
      ],
    },
    tell_sam: { speaker: 'shambhu', text: 'First pick? Of FOUR bachelors’ junk? That is a treasure. Done.', next: 'tell' },
    tell_goti: { speaker: 'shambhu', text: '*examines the bottle cap* …This is a very good bottle cap. Done.', next: 'tell' },
    tell: {
      speaker: 'shambhu',
      text: 'I sold that drum to Lalaji. Sixty rupees. He haggled like a crocodile. Go ask the crocodile.',
      effects: [{ flag: 'clue.shambhu' }, { event: 'clue' }],
    },
  },
};

DIALOGUES_2.dhol_open = {
  start: 'a',
  nodes: {
    a: { speaker: 'goti', text: 'There’s something sewn inside the drum skin. A flat packet. Tied with wedding thread.', next: 'b' },
    b: { speaker: 'pakya', text: 'Open it! It’s money. I can feel it. I can smell it.', next: 'c' },
    c: { speaker: 'sam', text: 'Nobody opens it. Not until we know who to trust. Rahul hid it on purpose.', next: 'd' },
    d: { speaker: 'maru', text: 'Can we at least stop whispering? Whispering makes me feel like something bad is about to happen.', effects: [{ complete: 'dhol.open' }, { give: 'packet' }] },
  },
};

/* ═════════════════════ 5. EVERYTHING GOES WRONG ═════════════════════ */

DIALOGUES_2.chaos_intro = {
  start: 'a',
  nodes: {
    a: { speaker: 'narrator', text: 'A knock on the shutter. It’s Pinky, out of breath.', next: 'b' },
    b: { speaker: 'pinky', text: 'A man in white shoes says he’s coming to your garage at sunset. He gave me ten rupees to tell you. And twenty not to. I’m keeping both.', next: 'c' },
    c: { speaker: 'sam', text: 'Sunset. That’s… soon. Everyone: plan board. NOW.', next: 'd' },
    d: { speaker: 'goti', text: 'Also, Tiwari-ji is doing a room inspection today. He put up a notice. On our door. With a nail.' },
  },
};

DIALOGUES_2.chaos_board = {
  start: (s) => (done(s, 'chaos.plan') ? 'after' : 'plan'),
  nodes: {
    after: { speaker: 'narrator', text: 'The board says: “1. Fake dhol in here. 2. Real dhol under Maru’s charpai. 3. Pakya keeps Tiwari talking. 4. Maru watches the lane. 5. DO NOT PANIC.” Number 5 is underlined by Maru.' },
    plan: {
      speaker: 'sam',
      text: 'Zikomo searches this garage at sunset. He must find a dhol, just not the real one. Where do we get a fake?',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Plan A: Sam talks Lalaji into renting out his wedding dhol.', effects: [{ flag: 'chaos.planA' }], next: 'jobs' },
        { who: 'sam', tag: 'Plan', text: 'Plan B: Goti builds a fake from a biscuit tin, rope and an old tabla skin.', effects: [{ flag: 'chaos.planB' }], next: 'jobs' },
      ],
    },
    jobs: {
      speaker: 'sam',
      text: 'Real dhol goes home, under Maru’s charpai. Pakya: keep Tiwari-ji busy so nobody gets searched at the door. Maru: watch the lane for Zikomo’s men.',
      next: 'jobs2',
    },
    jobs2: { speaker: 'pakya', text: 'And what are you doing?', next: 'jobs3' },
    jobs3: { speaker: 'sam', text: 'Managing.', effects: [{ complete: 'chaos.plan' }, { event: 'planChosen' }] },
  },
};

DIALOGUES_2.chaos_end = {
  start: (s) => {
    const o = s.flags;
    if (o['end.fake']) return 'fake';
    return 'empty';
  },
  nodes: {
    fake: { speaker: 'zikomo', text: '*lifts the dhol, sniffs it* Ah. Rahul’s dhol. It smells of… biscuits? And weddings? Hm. Bhaloo, carry it. Gently.', next: 'fake2' },
    fake2: { speaker: 'zikomo', text: 'Good boys. Stupid, but good. Do not leave the colony.', next: 'end' },
    empty: { speaker: 'zikomo', text: 'No dhol? NO DHOL? Bhaloo, turn this garage upside down.', next: 'empty2' },
    empty2: { speaker: 'narrator', text: 'Bhaloo turns the garage upside down. He finds a rubber chicken. Zikomo confiscates it as a hostage.', next: 'empty3' },
    empty3: { speaker: 'zikomo', text: 'Tomorrow, I come back. With more men. And without my patience.', next: 'end' },
    end: { speaker: 'narrator', text: 'Zikomo’s white car drives away. Somewhere across the colony, a real dhol sits very quietly.', next: 'end2' },
    end2: { speaker: 'goti', text: 'We did it. Did we do it? What did we do?', next: 'end3' },
    end3: { speaker: 'sam', text: 'We bought one night. Tomorrow, Zikomo opens that drum, and finds nothing inside.', effects: [{ complete: 'chaos.survive' }, { endPart: 'part2' }] },
  },
};

/* Ramesh the postman: everyday life between the missions. He knows everybody's post. */
DIALOGUES_2.postman = {
  start: (s) =>
    s.missionStatus('epilogue') !== 'locked' ? 'after' : s.missionStatus('reveal') === 'done' || s.missionStatus('finale') === 'active' ? 'zikomo' : f(s, 'ritu.in') ? 'ritu' : 'rent',
  nodes: {
    rent: {
      speaker: 'postman',
      text: 'You four again. Your post this month: one rent reminder, one rent reminder written angrily, and one rent reminder drawn as a picture.',
      choices: [
        { who: 'sam', tag: 'Negotiate', text: 'Could the reminders maybe… get lost? For a small consideration?', next: 'sam' },
        { who: 'pakya', tag: 'Bluff', text: '“Those are for a different Pakya. A poorer one.”', next: 'pakya' },
        { who: 'goti', tag: 'Something weird', text: 'Ask if he can post Goti to Goa.', next: 'goti' },
        { who: 'maru', tag: 'Make a scene', text: 'Faint at the word “reminder”.', next: 'maru' },
        { text: 'Thanks, Ramesh-ji.', next: 'bye' },
      ],
    },
    ritu: {
      speaker: 'postman',
      text: 'The yellow bungalow gets letters on paper so thick it does not bend. Somebody in your room keeps asking me what Ritu-ji’s handwriting looks like.',
      effects: [{ emote: 'maru', kind: '!' }],
      next: 'bye',
    },
    zikomo: {
      speaker: 'postman',
      text: 'A man in white shoes asked me which house the drummers live in. I told him I only know houses by their bills. Yours is the one with the most.',
      next: 'bye',
    },
    after: {
      speaker: 'postman',
      text: 'Ten years delivering on this road, and today, for the first time, a parcel for you four that is NOT a rent reminder. It is… a bill for a drum skin.',
      effects: [{ emote: 'postman', kind: '♪' }],
      next: 'bye',
    },
    sam: { speaker: 'postman', text: 'The post does not get lost, Sam-babu. The post gets delayed. Tiwari-ji has already paid me to un-delay it.', next: 'bye' },
    pakya: { speaker: 'postman', text: 'Same address, same name, same face, same unpaid rent. Very poor disguise.', effects: [{ emote: 'postman', kind: '?' }], next: 'bye' },
    goti: { speaker: 'postman', text: 'Stamps for a whole Goti would cost… *counts on fingers* …more than the rent. Stay.', next: 'bye' },
    maru: { speaker: 'postman', text: '*fans Maru with a letter* It is only paper, Maru-babu. Very angry paper, but only paper.', effects: [{ emote: 'maru', kind: '…' }], next: 'bye' },
    bye: { speaker: 'postman', text: 'Right. Lalaji next, then your room, then the long road. The post never stops. Unlike you four.' },
  },
};
