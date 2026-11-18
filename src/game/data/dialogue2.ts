/**
 * Part 2 writing. Everything here is original, in Hindi (Roman script).
 * Existing Part 1 scripts are extended with `extend()` so the same NPC talks differently per mission.
 *
 * The story follows the film's outline: Ritu came to Pune to find out who killed her brother
 * Rahul and his friend Jai. Her grandparents never met Jai, so Pakya becomes "Jai". Word that
 * Jai is alive brings Zikomo, who wants the dhol Rahul and Jai carried.
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

/* ═════════════════════ 1. AMEER LADKI ═════════════════════ */

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
      text: 'Cable wala. Census wala. Swagat samiti. Film producer. Tum log kitne aadmi ho, ek baar mein bata do? Main kisi se baat nahi kar rahi.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Haath jod ke, bina bahaane ke, maafi maango.', next: 'p2_sorry' },
        { text: 'Chup-chaap nikal jao.', next: 'p2_cold_bye' },
      ],
    },
    p2_sorry: {
      speaker: 'sam',
      text: 'Daadi, humne jhooth bola. Lagaataar. Bimaari hai. Ilaaj chal raha hai. Aaj ka ilaaj: sach.',
      effects: [{ suspicion: 'daadi', delta: -40 }],
      next: 'p2_sorry2',
    },
    p2_sorry2: { speaker: 'daadi', text: '…Kam se kam maan toh liya. Baitho. Achhe sofe pe nahi.' },
    p2_cold_bye: { speaker: 'daadi', text: 'Hmph.' },
    p2_songs: {
      speaker: 'daadi',
      text: 'Ritu ko kya pasand hai? Purane filmi gaane. Din bhar gungunaati hai. Uska bhai Rahul aadhi raat ko unhe dhol pe bajaata tha. Bahut bura.',
      effects: like('songs'),
      next: 'p2_songs2',
    },
    p2_songs2: { speaker: 'daadi', text: 'Aur jhoothon se nafrat hai usse. Uske Dadaji jhoothe the. Achhe aadmi. Bahut bure jhoothe.', effects: [{ flag: 'likes.liars' }] },
    p2_rahul: {
      speaker: 'daadi',
      text: 'Woh khud nahi batayegi? Theek hai. Uska bhai Rahul aur uska dost Jai pichhle saal yahin Pune mein mar gaye. Police ne accident bola. Ritu nahi maanti. Isiliye aayi hai.',
      effects: [{ flag: 'rahul.fromDaadi' }, { complete: 'rich.result' }],
    },
    p2_sold: {
      speaker: 'daadi',
      text: 'Rahul ka dhol? Woh shor machaane wala? Police ne uska saamaan lautaaya tha. Maine Shambhu kabaadi ko chaalis rupaye mein bech diya. Bina bajaaye bhi sar dard deta tha.',
      effects: [{ flag: 'clue.daadi' }, { event: 'clue' }],
      next: 'p2_sold2',
    },
    p2_sold2: { speaker: 'me', text: 'Jo cheez poori colony dhoondh rahi hai, aapne chaalis rupaye mein bech di.' },
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
      text: 'Ritu didi? Roz shaam ko Moti ko khaana khilaati hain. Kehti hain Moti is colony ka akela imaandaar mard hai.',
      effects: like('dogs'),
      next: 'p2_dog2',
    },
    p2_dog2: { speaker: 'chintu', text: 'Moti mard nahi hai.', next: 'p2_dog3' },
    p2_dog3: { speaker: 'pinky', text: 'Isiliye toh imaandaar hai.' },
    p2_noclue: { speaker: 'chintu', text: 'Dhol? Hamare paas dhol nahi hai. Ek toota bat hai aur ek alag tarah se toota ball.' },
    p2_moti: {
      speaker: 'pinky',
      text: 'Arre, woh dhol! Humne usko stumps banaaya tha. Phir Moti uska patta pakad ke haddi ki tarah le bhaaga.',
      next: 'p2_moti2',
    },
    p2_moti2: {
      speaker: 'chintu',
      text: 'Carrom wale uncle ke paas se, purane cinema ke peeche ghaseet ke le gaya. Uske pairon ke nishaan abhi bhi hain. Bahut keechad wale pair hain uske.',
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
      text: 'Ritu? Roz dopahar ko jalebi leti hai. Garam, extra chaashni. Mujhe pata hai kyunki woh paise deti hai. Kuch logon ki tarah nahi.',
      effects: like('jalebi'),
      next: 'p2_buy',
    },
    p2_buy: {
      speaker: 'lalaji',
      text: 'Jalebi chahiye? Bees rupaye.',
      choices: [
        { text: 'Bees rupaye do.', showIf: (s) => s.money >= 20, effects: [{ money: -20 }, { give: 'jalebi' }], next: 'p2_paid' },
        { who: 'sam', tag: 'Sauda', text: '“Jalebi abhi, paisa baad mein” waala arrangement suggest karo.', next: 'p2_credit' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Main food critic hoon. Jalebi ka review free hota hai.”', effects: [{ claim: 'pakya.job', value: 'khaane ka aalochak' }], next: 'p2_critic' },
        { text: 'Aaj nahi.', next: 'p2_bye' },
      ],
    },
    p2_paid: { speaker: 'lalaji', text: 'Nakad! Meri dukaan mein! Tumse! Mujhe baithna padega.' },
    p2_credit: { speaker: 'sam', text: 'Lalaji. Purane graahak. Shaandaar references. Aaj ki ek jalebi, zindagi bhar ki wafaadaari.', branch: (s) => (susp(s, 'lalaji') < 50 ? 'p2_credit_ok' : 'p2_credit_no') },
    p2_credit_ok: { speaker: 'lalaji', text: '…Ek kon. Khaate mein. Khaata ab meri baanh se lamba ho gaya hai.', effects: [{ give: 'jalebi' }] },
    p2_credit_no: { speaker: 'lalaji', text: 'Wafaadaari? Tumhare doston ne is hafte chaar alag naukriyaan bataayi hain. Jhoothon ko udhaar nahi.' },
    p2_critic: {
      speaker: 'lalaji',
      text: 'Food critic? Bablu ne bola tu bank officer hai. Dongre sahab ne bola income tax. Pehle tay kar le, phir paise leke aa.',
      branch: (s) => (s.flags['tell.contra'] ? 'p2_bye' : 'p2_critic_ok'),
    },
    p2_critic_ok: { speaker: 'lalaji', text: 'Theek hai. Ek kon. Review kharaab hua toh main dhoondh lunga.', effects: [{ give: 'jalebi' }] },
    p2_bye: { speaker: 'lalaji', text: 'Ram Ram.' },
    p2_jai: {
      speaker: 'lalaji',
      text: 'Jai? Rahul ke saath aata tha. Har baar ek maachis leta tha, aur kehta tha shaadiyon mein dhol bajaata hai. Maachis se dhol kaun bajaata hai?',
      effects: [{ flag: 'story.lalaji' }, { story: 'jai', teller: 'lalaji', value: 'shaadiyon mein dhol bajaata tha' }],
    },
    p2_refuse: {
      speaker: 'lalaji',
      text: 'Jhoothon se baat nahi karta. Bank officer, food critic, income tax. Niklo. Jab tak khareedna nahi, aur tum kabhi khareedte nahi.',
      effects: [{ toast: 'Lalaji baat nahi karenge. Sam baat sambhaal sakta hai, ya Maru unka dhyaan bhatkaaye aur Goti bahi-khaata dekhe.' }],
    },
    p2_drum: {
      speaker: 'lalaji',
      text: 'Woh purana dhol? Haan, maine liya tha. Phir cricket waale bachche stumps ke liye “udhaar” le gaye. Ball lauta di. Ball dhol nahi hoti.',
      effects: [{ flag: 'clue.lalaji' }, { event: 'clue' }],
    },
    p2_wed: {
      speaker: 'lalaji',
      text: 'Meri shaadi wala dhol? Jhaalar wala? Kiraaye pe? Teen sau rupaye roz.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Free mazdoori offer karo: Goti dukaan ke saare fridge theek karega.', next: 'p2_wed_deal' },
        { text: 'Teen sau rupaye do.', showIf: (s) => s.money >= 300, effects: [{ money: -300 }, { give: 'fakedhol' }, { flag: 'chaos.lalajiDone' }], next: 'p2_wed_paid' },
        { text: 'Chalo.', next: 'p2_bye' },
      ],
    },
    p2_wed_deal: {
      speaker: 'lalaji',
      text: 'Hmm. Hmm. Pehle sikke gin loon. Bees second mein aana. Tab tak kuch chhoona mat.',
      branch: (s) => (susp(s, 'lalaji') < 50 ? 'p2_wed_wait' : 'p2_wed_no'),
    },
    p2_wed_wait: {
      speaker: 'narrator',
      text: 'Lalaji ginna shuru karte hain. Jab tak woh ginte hain, Sam ko dukaan mein hi rukna padega.',
      effects: [{ flag: 'chaos.lalajiWait' }, { event: 'lalajiWait' }],
    },
    p2_wed_no: { speaker: 'lalaji', text: '…Nahi. Colony mein aaj kal bahut jhooth chal raha hai. Apne gol-matol dost se kachre ka dhol banwa lo.', effects: [{ event: 'lalajiRefused' }] },
    p2_wed_back: {
      speaker: 'lalaji',
      text: 'Chaar sau baarah rupaye aur ek button. Theek hai. Le jao shaadi wala dhol. Ek kharonch aayi toh tumhe kharonch doonga.',
      branch: (s) => (s.flags['chaos.waited'] ? 'p2_wed_give' : 'p2_wed_notyet'),
    },
    p2_wed_notyet: { speaker: 'lalaji', text: 'Bees second bola tha. Teen sau chhe pe hoon. Khade raho.' },
    p2_wed_give: { speaker: 'narrator', text: 'Sam ko jhaalar wala shaadi ka dhol milta hai. Rahul ke dhol jaisa bilkul nahi dikhta. Door se, kam roshni mein, shayad.', effects: [{ give: 'fakedhol' }, { flag: 'chaos.lalajiDone' }] },
    p2_wed_paid: { speaker: 'lalaji', text: 'Teen sau! Main apne pote-potiyon ko ye kahaani sunaaunga.' },
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
    idle: { speaker: 'ritu', text: 'Phir se hello. Daadi kehti hain tum chaaron se baat mat karo. Daadi aksar sahi hoti hain.' },
    idle_after: { speaker: 'ritu', text: 'Bhaiya ke baare mein kuch pata chala? Kuch bhi suno toh batana. Kuch sach.' },
    already: { speaker: 'ritu', text: 'Tumhari baari ho gayi. Apne doston ko bhi apni beizzati karne do.' },
    // friends barging in
    butt_sam: { speaker: 'sam', text: 'Sorry, sorry. Bas yaad dila raha tha ki ORIGINALLY ye mera plan tha.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_pakya: { speaker: 'pakya', text: '*beech mein ghus-ta hai* Ritu-ji, ye jo bhi bole, maine pehle aur behtar bola tha.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_goti: { speaker: 'goti', text: 'Hi! Hi. Hello. Main bhi hoon. Ye group wali cheez hai? Group wali lag rahi hai.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },
    butt_maru: { speaker: 'maru', text: 'Daadi aa rahi hain kya? Mujhe lag raha hai Daadi aa rahi hain. Bhaagein? Main bhaag raha hoon. Nahi, ruk raha hoon.', effects: [{ stat: 'gang.harmony', delta: -8 }, { stat: 'ritu.trust', delta: -3 }], branch: (s) => `${s.active}_open` },

    sam_open: {
      speaker: 'sam',
      text: 'Ritu-ji. Kya coincidence hai. Main yahin se guzar raha tha, bilkul isi waqt, plan ke mutaabik. Matlab bina plan ke.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Jalebi offer karo, aise hi, casually.', showIf: (s) => s.has('jalebi'), effects: [{ take: 'jalebi' }], next: 'sam_jal' },
        { text: 'Uski khushi ke liye apna paanch saal ka plan pesh karo.', next: 'sam_plan' },
        { text: 'Uska din kaisa gaya poochho, aur sach mein suno.', next: 'sam_listen' },
      ],
    },
    sam_jal: { speaker: 'ritu', text: 'Jalebi? Garam? Extra chaashni? Kisne bataaya?', branch: (s) => (f(s, 'likes.jalebi') ? 'sam_jal_good' : 'sam_jal_ok') },
    sam_jal_good: { speaker: 'sam', text: 'Research. Strategy. Aur Lalaji.', effects: RITU_MOVE('sam', 15, 3), next: 'sam_jal_good2' },
    sam_jal_good2: { speaker: 'ritu', text: 'Tumne research kiya. Jalebi pe. Ye toh… sach mein sweet hai.' },
    sam_jal_ok: { speaker: 'ritu', text: 'Shukriya. Main aam taur pe khaati nahi, par achha laga.', effects: RITU_MOVE('sam', 6, 1) },
    sam_plan: { speaker: 'sam', text: 'Pehla saal: hum milte hain. Doosra saal: chai peete hain. Teesra saal—', next: 'sam_plan2' },
    sam_plan2: { speaker: 'ritu', text: 'Teesra saal: main doosre shehar chali jaati hoon. Bye, Sam.', effects: RITU_MOVE('sam', -6, -1) },
    sam_listen: { speaker: 'ritu', text: 'Mera din? Bhaiya ka purana saamaan dhoondha. Phir ek kutte ko khilaaya. Phir chaar aadmi mere peeche peeche ghoome.', next: 'sam_listen2' },
    sam_listen2: { speaker: 'sam', text: 'Ye toh… mushkil hai. Kutte waala hissa chhod ke. Aur chaar aadmi waala. Zyaadatar bhaiya waala.', effects: RITU_MOVE('sam', 9, 2) },

    pakya_open: {
      speaker: 'pakya',
      text: '*khambhe se tik ke* Ritu-ji. Kisi ne kabhi bataaya ki aapka chehra cinema ke liye bana hai?',
      choices: [
        { who: 'pakya', tag: 'Jhaansa', text: 'Film producer bano, aur use apni agli film mein cast karo.', effects: [{ claim: 'pakya.job', value: 'filmon ka producer' }], next: 'pak_bluff' },
        { text: 'Ek purana filmi gaana gaao, bura.', showIf: (s) => f(s, 'likes.songs'), next: 'pak_song' },
        { text: 'Sach batao: berozgaar ho, aur kangaal.', effects: [{ claim: 'pakya.job', value: 'berozgaar', truth: true }], next: 'pak_truth' },
      ],
    },
    pak_bluff: {
      speaker: 'ritu',
      text: 'Film producer?',
      branch: (s) => {
        const d = s.believes('daadi', 'pakya.job');
        if (s.flags['tell.contra'] || (d && d !== 'filmon ka producer')) return 'pak_caught';
        return f(s, 'likes.liars') ? 'pak_liar' : 'pak_bluff_ok';
      },
    },
    pak_caught: {
      speaker: 'ritu',
      text: 'Daadi ne bataaya tum cable TV inspector ho. Pichhle hafte Dongre Mama ke liye film producer the, aur Bablu ke liye bank officer. Aaj kaunsa hai?',
      effects: [{ suspicion: 'ritu', delta: 25 }, ...RITU_MOVE('pakya', -15, -3)],
      next: 'pak_caught2',
    },
    pak_caught2: { speaker: 'pakya', text: '…Main bahut saari khoobiyon wala aadmi hoon. Aur bahut saare visiting card.' },
    pak_liar: { speaker: 'ritu', text: 'Producer log aam taur pe teen aadmiyon aur ek nimbu ke saath kiraaye ke kamre mein nahi rehte. Mujhe jhoothe pasand nahi, Pakya.', effects: RITU_MOVE('pakya', -8, -2) },
    pak_bluff_ok: { speaker: 'ritu', text: 'Ha! Theek hai, Mr. Producer. Film release ho toh ticket le loongi.', effects: RITU_MOVE('pakya', 4, 1) },
    pak_song: { speaker: 'narrator', text: 'Pakya ek purani film ka pyaar bhara gaana gaata hai, dil se, aur kam se kam teen alag suron mein.', next: 'pak_song2' },
    pak_song2: { speaker: 'ritu', text: '*haste hue* Bhaiya bhi yahi gaate the. Utna hi bura. Shukriya.', effects: RITU_MOVE('pakya', 12, 3) },
    pak_truth: { speaker: 'ritu', text: 'Berozgaar aur kangaal. Tumhare group mein kisi ne mujhse pehli baar sach bola hai. Izzat hai.', effects: RITU_MOVE('pakya', 10, 2) },

    goti_open: {
      speaker: 'goti',
      text: 'Hi! Aapke liye kuch laaya hoon. Aankhein band karo. Nahi, kholo. Nahi— achha, jo aankhon ka mann.',
      choices: [
        { text: 'Gende ki maala do.', showIf: (s) => s.has('marigolds'), effects: [{ take: 'marigolds' }], next: 'goti_flowers' },
        { text: 'Moti se formally milwaao.', showIf: (s) => f(s, 'likes.dogs'), next: 'goti_dog' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Wo trick dikhao jisme poori jalebi ek baar mein muh mein jaati hai.', showIf: (s) => s.has('jalebi'), effects: [{ take: 'jalebi' }], next: 'goti_jal' },
        { text: 'Woh kissa sunao jab paani ki tanki mein phas gaye the.', next: 'goti_tank' },
      ],
    },
    goti_flowers: { speaker: 'narrator', text: 'Ritu maala leti hai. Moti Ritu se le leta hai. Moti ek genda kha jaata hai, aur bahut khush dikhta hai.', next: 'goti_flowers2' },
    goti_flowers2: { speaker: 'ritu', text: 'Chalo. Moti ko toh pasand aaya.', effects: RITU_MOVE('goti', 6, 1) },
    goti_dog: { speaker: 'goti', text: 'Ritu-ji, ye Moti. Moti, ye Ritu-ji. Moti, baith. Moti. Moti, please.', next: 'goti_dog2' },
    goti_dog2: { speaker: 'ritu', text: '*haste hue* Ye kisi ke liye nahi baithta. Tum bahut ajeeb ho, Goti. Mujhe ajeeb pasand hai.', effects: RITU_MOVE('goti', 14, 3) },
    goti_jal: { speaker: 'narrator', text: 'Jalebi andar jaati hai. Jalebi bahar nahi aati. Goti aankhon mein aansu leke thumbs-up deta hai.', effects: RITU_MOVE('goti', 5, 1) },
    goti_tank: { speaker: 'ritu', text: 'Chhe ghante? Aur shaant rehne ke liye gaana gaate rahe? Tum pagal ho.', effects: RITU_MOVE('goti', 4, 1) },

    maru_open: {
      speaker: 'maru',
      text: 'R-Ritu-ji. Aapke liye kavita likhi hai. Himmat ke baare mein. Ant likhne ki himmat nahi hui.',
      choices: [
        { text: 'Kavita sunao.', next: 'maru_poem' },
        { text: 'Woh gaana gaao jo uska bhai dhol pe bajaata tha.', showIf: (s) => f(s, 'likes.songs'), next: 'maru_song' },
        { who: 'maru', tag: 'Tamaasha', text: 'Ghabraao aur sabse paas wale khambhe ke peeche chhup jao.', next: 'maru_hide' },
      ],
    },
    maru_poem: { speaker: 'maru', text: '“O chaand, O roshni, O… Daadi?” *kahin se khaansi* DAADI AA GAYI. Main theek hoon. Main… let raha hoon.', effects: [{ sfx: 'thud' }], next: 'maru_poem2' },
    maru_poem2: { speaker: 'ritu', text: 'Woh Daadi nahi thi. Moti tha. Utho, kavi-raaj.', effects: RITU_MOVE('maru', 8, 2) },
    maru_song: { speaker: 'narrator', text: 'Maru purana dhol wala gaana gaata hai. Har oonche sur pe awaaz phat jaati hai. Ritu chup ho jaati hai.', next: 'maru_song2' },
    maru_song2: { speaker: 'ritu', text: 'Bhaiya bilkul aise hi gaate the. Shukriya, Maru. Sach mein.', effects: RITU_MOVE('maru', 14, 3) },
    maru_hide: { speaker: 'ritu', text: 'Maru, khambha tumse patla hai. Tum poore dikh rahe ho.', effects: RITU_MOVE('maru', 1, 0) },

    // after all four moves
    result: {
      speaker: 'ritu',
      text: 'Achha. Chaaron ne try kar liya. Ab main tumse kuch poochhti hoon.',
      branch: (s) => (s.stat('ritu.trust') >= 45 ? 'confide' : 'meh'),
    },
    confide: {
      speaker: 'ritu',
      text: 'Mera bhai Rahul aur uska dost Jai pichhle saal yahin Pune mein mare. Police ne accident bola. Main nahi maanti. Isiliye aayi hoon.',
      next: 'confide2',
    },
    confide2: {
      speaker: 'ritu',
      text: 'Dada-Dadi ne Jai ko kabhi dekha bhi nahi. Bas Bhaiya ki chitthiyon mein padha. Tum chaaron bewakoof ho. Par imaandaar bewakoof. Zyaadatar. Meri madad karoge?',
      effects: [{ flag: 'rahul.told' }, { complete: 'rich.result' }],
      next: 'confide3',
    },
    confide3: { speaker: 'pakya', text: '*dheere se, khud se* …Dada-Dadi ne Jai ko kabhi dekha nahi. Hmm. Hmmmm.' },
    meh: {
      speaker: 'ritu',
      text: 'Tum sweet ho. Aur hasyaaspad. Aur abhi main tum mein se kisi pe bharosa nahi karti. Jaanna hai mere ghar mein kya gadbad hai, toh Daadi se poochho.',
      effects: [{ toast: 'Ritu tumhe apni baat nahi batayegi. Shayad Daadi bata dein.' }],
    },
  },
};

/* ═════════════════════ 2. MAIN HOON JAI ═════════════════════ */
// The colony remembers the dead Jai four different ways. Those memories are what Pakya has to become.

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
      text: 'Jai? Rahul ke saath aata tha. Lamba, Delhi wala. Chai mein chaar chammach cheeni. Itni meethi chai peene wala aadmi bura nahi ho sakta. Bechaara.',
      effects: [{ flag: 'story.bablu' }, { story: 'jai', teller: 'bablu', value: 'Delhi wala, chaar chammach cheeni' }],
    },
    p2_scared: { speaker: 'bablu', text: 'Meri dukaan ke paas mat khade ho! Zikomo ke aadmi tumhare baare mein pooch rahe the. Maine sab bata diya. Darr mein bolta hoon. Sorry. Lo, free chai. Ab jao.' },
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
      text: 'Jai? Shave karwaane aata tha. Bahut shaukeen moonchh thi. Kehta tha moonchh nahi toh mard nahi. Aur Rahul ke saath meri lodge mein ruka tha.',
      effects: [{ flag: 'story.pappu' }, { story: 'jai', teller: 'pappu', value: 'shaukeen moonchh wala' }],
      next: 'p2_register',
    },
    p2_register: {
      speaker: 'pappu',
      text: 'Upar lodge mein jo bhi rukta hai, register mein asli naam likhta hai. Customer ki privacy. Bahut strict. Bahut.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Register pe ek nazar ke badle ek mahine ka free prachaar offer karo.', next: 'p2_reg_sam' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Hum census se hain. Register dikhaao.”', effects: [{ claim: 'gang.who', value: 'janganana waale' }], next: 'p2_reg_pak' },
        { text: 'Rehne do.', next: 'p2_reg_bye' },
      ],
    },
    p2_reg_sam: {
      speaker: 'pappu',
      text: 'Ek mahina? Tum chaaron din bhar “Hero Cut Salon” bolte ghoomoge? …Deal. Jaldi dekho. “Rahul Tripathi, Jaishankar Yadav. Kamra teen.” Aur neeche ek naam kaata hua hai. Sirf “Z” bacha hai.',
      effects: [{ give: 'register' }, { event: 'proof' }],
    },
    p2_reg_pak: {
      speaker: 'pappu',
      text: 'Census? Pichhle mahine isi kursi pe tu food critic tha. Baith, census officer, teri kalmein tedhi hain.',
      branch: (s) => (s.flags['tell.contra'] ? 'p2_reg_bye' : 'p2_reg_pak2'),
    },
    p2_reg_pak2: { speaker: 'pappu', text: '…Theek hai. Census. Ek nazar. “Rahul Tripathi, Jaishankar Yadav. Kamra teen.” Aur ek kaata hua “Z”. Ab mere graahak gino aur niklo.', effects: [{ give: 'register' }, { event: 'proof' }] },
    p2_reg_bye: { speaker: 'pappu', text: 'Baal pachaas rupaye. Gossip free. Register nahi.' },
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
      text: 'Jaishankar Yadav? Case file mein hai. Accident. Case band. Mujhe bas itna yaad hai ki Haryana ka tha, aur mujhse kabhi udhaar nahi liya. Shareef aadmi tha.',
      effects: [{ flag: 'story.tiwari' }, { story: 'jai', teller: 'tiwari', value: 'Haryana ka, shareef aadmi' }],
    },
    p2_wary: { speaker: 'tiwari', text: 'Main tum pe nazar rakh raha hoon. Is mahine tum mein se har ek ne mujhe alag kahaani sunaayi hai. Maine likhna shuru kar diya hai.' },
    p2_hasdhol: {
      speaker: 'tiwari',
      text: 'Tumhara dhol mere paas hai. Pehle karza, phir dhol. Ye kaanoon hai. Mera kaanoon.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: '“Goodwill” ke naam pe abhi do sau rupaye do.', showIf: (s) => s.money >= 200, effects: [{ money: -200 }, { event: 'tiwariReturns' }], next: 'p2_back' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Ye dhol income tax department ka saboot hai.”', showIf: (s) => s.believes('tiwari', 'pakya.job') === 'income tax ka afsar', next: 'p2_tax' },
        { text: 'Abhi rehne do.', next: 'p2_keep' },
      ],
    },
    p2_back: { speaker: 'tiwari', text: 'Goodwill sweekaar. Le jao apna shor-sharaabe wala dhol. Baaki Somvaar ko!' },
    p2_tax: { speaker: 'tiwari', text: 'Saboot?! Le jao! Maine chhua bhi nahi! Maine zindagi mein kabhi dhol dekha hi nahi!', effects: [{ event: 'tiwariReturns' }] },
    p2_keep: { speaker: 'tiwari', text: 'Ye mere paas rahega. Meri kursi ke saath achha lagta hai.' },
  },
);

/* Pakya walks into the bungalow as Jai. Dadaji tests him; Pakya builds a Jai out of the colony's memories. */
const JAI_TEST_DONE: Effect[] = [
  { claim: 'pakya.who', value: 'Jai', to: 'dadaji' },
  { claim: 'pakya.who', value: 'Jai', to: 'daadi' },
  { claim: 'pakya.who', value: 'Jai', to: 'ritu' },
  { flag: 'jai.met' },
  { complete: 'jai.confront' },
];

extend(
  'dadaji',
  (s) => {
    if (act(s, 'jai') && done(s, 'jai.proof') && !done(s, 'jai.confront')) return s.active === 'pakya' ? 'jt_in' : 'jt_notpakya';
    if (f(s, 'jai.met') && !act(s, 'epilogue') && s.active === 'pakya' && !f(s, 'truth.out')) return 'jt_again';
    return undefined;
  },
  {
    jt_notpakya: {
      speaker: 'dadaji',
      text: 'Tum? *kameez chhoota hai* Nylon. Tum Jai nahi ho sakte. Rahul ne likha tha Jai sirf khaadi pehenta hai.',
      effects: [{ toast: 'Ye sirf Pakya kar sakta hai. Pakya ko chuno aur Dadaji se baat karo.' }],
    },
    jt_in: {
      speaker: 'pakya',
      text: '*darwaaze pe, aankhon mein aansu, haath mein phool* Dadaji. Dadi. Main… Jai hoon. Jaishankar. Rahul ka dost. Main… bach gaya.',
      effects: [{ event: 'reveal' }],
      next: 'jt_in2',
    },
    jt_in2: { speaker: 'daadi', text: 'HAAYE RAM! Jai beta! Zinda hai! Ritu! RITU! Dekho kaun aaya hai!', effects: [{ emote: 'daadi', kind: '!' }], next: 'jt_in3' },
    jt_in3: { speaker: 'ritu', text: 'J-Jai bhaiya? Par… police ne kaha tha… dono…', effects: [{ emote: 'ritu', kind: '!' }], next: 'jt_in4' },
    jt_in4: { speaker: 'dadaji', text: '*chashma pehenta hai* Ruko. PhD in Textiles, beta. Kuch sawaal. Rahul ne chitthiyon mein tumhare baare mein bahut likha tha. Pehla sawaal: kahaan ke ho?', next: 'jt_q1' },
    jt_q1: {
      speaker: 'pakya',
      text: 'Main… main…',
      choices: [
        { text: '“Delhi ka, Dadaji. Dilli dil waalon ki.”', next: 'jt_q1_ok', showIf: (s) => !!s.flags['story.bablu'] },
        { text: '“Haryana ka, Dadaji. Taau ka laadla.”', next: 'jt_q1_ok', showIf: (s) => !!s.flags['story.tiwari'] },
        { who: 'pakya', tag: 'Jhaansa', text: '“Delhi… Haryana ke paas wali Delhi. Border pe. Dono.”', next: 'jt_q1_both' },
        { text: '“Pune. Yahin ka. Hamesha se.”', next: 'jt_q1_bad' },
      ],
    },
    jt_q1_ok: { speaker: 'dadaji', text: 'Hmm. Rahul ne bhi yahi likha tha. Theek.', effects: [{ stat: 'jai.cred', delta: 1 }], next: 'jt_q2' },
    jt_q1_both: { speaker: 'dadaji', text: 'Border pe? …Haan, Rahul ne likha tha tum thode confused ho. Theek.', effects: [{ stat: 'jai.cred', delta: 1 }], next: 'jt_q2' },
    jt_q1_bad: { speaker: 'dadaji', text: 'Pune? Rahul ne toh likha tha… *aankhein sikodta hai* …khair. Sadma hai. Yaaddaasht. Hota hai.', effects: [{ suspicion: 'dadaji', delta: 20 }], next: 'jt_q2' },
    jt_q2: { speaker: 'dadaji', text: 'Doosra sawaal. Rahul ne likha tha Jai ki ek pehchaan hai. Kya?', next: 'jt_q2c' },
    jt_q2c: {
      speaker: 'pakya',
      text: 'Meri pehchaan…',
      choices: [
        { text: '“Meri moonchh, Dadaji. Shaukeen moonchh.” *upper lip pe ungli rakhta hai*', showIf: (s) => !!s.flags['story.pappu'], next: 'jt_q2_mou' },
        { text: '“Chai mein chaar chammach cheeni.”', showIf: (s) => !!s.flags['story.bablu'], next: 'jt_q2_ok' },
        { text: '“Shaadiyon mein dhol bajaata hoon.”', showIf: (s) => !!s.flags['story.lalaji'], next: 'jt_q2_ok' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Meri pehchaan… meri muskaan hai.” *muskuraata hai*', next: 'jt_q2_smile' },
      ],
    },
    jt_q2_mou: { speaker: 'dadaji', text: 'Moonchh? Kahaan hai moonchh?', next: 'jt_q2_mou2' },
    jt_q2_mou2: { speaker: 'pakya', text: '*bhari awaaz mein* Rahul ke jaane ke baad… maine… mundwa di. Dukh mein, Dadaji.', effects: [{ stat: 'jai.cred', delta: 2 }], next: 'jt_end' },
    jt_q2_ok: { speaker: 'dadaji', text: 'Haan! Haan, Rahul ne yahi likha tha. Aao beta. Gale lago.', effects: [{ stat: 'jai.cred', delta: 1 }], next: 'jt_end' },
    jt_q2_smile: { speaker: 'dadaji', text: '…Rahul ne aisa kuch nahi likha tha. Par muskaan achhi hai. Polyester ki tarah. Chamakti hai, tikti nahi.', effects: [{ suspicion: 'dadaji', delta: 15 }], next: 'jt_end' },
    jt_end: {
      speaker: 'daadi',
      text: 'Jai beta, ab tum yahin aate rahoge. Roz. Khaana yahin khaaoge. Hamara Rahul toh nahi raha, tum hi sahi.',
      next: 'jt_end2',
    },
    jt_end2: { speaker: 'narrator', text: 'Pakya ab Jai hai. Bungalow mein roz khaana, Dadi ka pyaar, Ritu ki nazar. Aur ek chhoti si dikkat: Jai mar chuka hai, aur kisi ko ye pata hai.', effects: JAI_TEST_DONE },
    jt_again: { speaker: 'dadaji', text: 'Jai beta! Aao. *kameez chhoota hai* Hmm. Ye kurta polyester hai, beta. Jai toh khaadi pehenta tha. …Khair, dukh mein aadmi badal jaata hai.' },
  },
);

/* Jai himself is gone; his name is now Pakya's. Kept for the Lie Book and old saves. */
DIALOGUES_2.jai = {
  start: 'a',
  nodes: { a: { speaker: 'narrator', text: 'Jai ki tasveer. Chai ka daag uska poora chehra kha gaya hai. Bas ek muskaan dikhti hai, aur woh bhi Pakya jaisi.' } },
};

/* ═════════════════════ 3. ZIKOMO AA GAYA ═════════════════════ */

const zikRelease = [{ event: 'release' }];

DIALOGUES_2.zikomo = {
  start: (s) => (f(s, 'zik.caught') ? 'caught' : act(s, 'zikomo') ? 'walkup' : act(s, 'chaos') ? 'chaos' : 'idle'),
  nodes: {
    idle: { speaker: 'zikomo', text: 'Aha. Chaar gadhe. Mere favourite gadhe. Chalo, bhaago.' },
    chaos: { speaker: 'zikomo', text: 'Suraj dhalega. Tumhara garage. Mera dhol. Simple, haina?' },
    walkup: {
      speaker: 'zikomo',
      text: 'Tum khud chal ke mere paas aaye? Ya toh bahut bahaadur ho, ya bahut bewakoof. Bablu kehta hai bewakoof.',
      next: 'menu',
    },
    caught: {
      speaker: 'zikomo',
      text: 'Aa gaye. Mere aadmiyon ko bhaagna pada. Mujhe pasand nahi jab mere aadmi bhaagte hain. Unke kapdon mein silvatein pad jaati hain.',
      next: 'menu',
    },
    menu: {
      speaker: 'zikomo',
      text: 'Suna hai Jai zinda hai. Ajeeb baat hai. Kyunki maine apni aankhon se… *khaansta hai* …suna tha ki woh mar gaya. Aur Rahul ka dhol? Woh mera hai. Bolo.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Deal offer karo: tum dhol dhoondh ke doge, woh tumhe chhod dega.', next: 'deal' },
        { who: 'pakya', tag: 'Jhaansa', text: 'Jaldi se koi bada aadmi ban jao.', next: 'pak' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Izzat ke taur pe rubber ki murgi do.', next: 'goti' },
        { who: 'maru', tag: 'Tamaasha', text: 'Uske safed jooton pe filmi style mein behosh ho jao.', next: 'maru' },
      ],
    },
    deal: {
      speaker: 'sam',
      text: 'Zikomo-ji. Aapko dhol chahiye. Hum colony jaante hain. Ek din do. Hum dhoondhenge, aapko milega, sabke ghutne salaamat.',
      branch: (s) => (susp(s, 'zikomo') < 60 ? 'deal_ok' : 'deal_no'),
    },
    deal_ok: {
      speaker: 'zikomo',
      text: '…Plan wala aadmi pasand hai mujhe. Ek din. Dhokha diya toh Lalaji ki chaawal ki boriyon mein bo doonga. Mere aadmi nazar rakhenge.',
      effects: [{ flag: 'deal' }, { complete: 'zikomo.deal' }, { event: 'deal' }],
    },
    deal_no: { speaker: 'zikomo', text: 'Deal? Tumse? Bablu kehta hai tum sabse jhooth bolte ho. Bhaloo, bahar chhod aao. Dheere se. Joote naye hain.', effects: zikRelease },
    pak: {
      speaker: 'pakya',
      text: 'Zikomo-ji, aap ek bahut busy aadmi se baat kar rahe ho. Main asal mein…',
      choices: [
        { who: 'pakya', tag: 'Jhaansa', text: '“…income tax officer hoon.”', effects: [{ claim: 'pakya.job', value: 'income tax ka afsar' }], next: 'pak_check' },
        { who: 'pakya', tag: 'Jhaansa', text: '“…film producer hoon. Aapka chehra villain ke liye perfect hai.”', effects: [{ claim: 'pakya.job', value: 'filmon ka producer' }], next: 'pak_check' },
        { who: 'pakya', tag: 'Jhaansa', text: '“…bank officer hoon. Aapke accounts jaanta hoon.”', effects: [{ claim: 'pakya.job', value: 'bank mein afsar' }], next: 'pak_check' },
      ],
    },
    pak_check: {
      speaker: 'zikomo',
      text: 'Hmm.',
      branch: (s) => (s.flags['tell.contra'] ? 'pak_caught' : s.believes('zikomo', 'pakya.job') === 'income tax ka afsar' ? 'pak_tax' : 'pak_ok'),
    },
    pak_caught: {
      speaker: 'zikomo',
      text: 'Bablu ne mere aadmiyon ko kuch aur hi bataaya. Tu pille ki tarah jhooth bolta hai: bura, aur bade josh se. Bahar phenko.',
      effects: [{ suspicion: 'zikomo', delta: 15 }, ...zikRelease],
    },
    pak_tax: { speaker: 'zikomo', text: 'Income… tax? *ghabraake joote dekhta hai* Jao. Apne department ko batana main mandiron mein bahut daan deta hoon.', effects: zikRelease },
    pak_ok: { speaker: 'zikomo', text: 'Interesting. Bahut interesting. Jao. Main check karunga. Main hamesha check karta hoon.', effects: zikRelease },
    goti: { speaker: 'zikomo', text: 'Ek… murgi. Rubber ki murgi. *dabaata hai, “pyaaank”* …Ye main rakh leta hoon. Jao, isse pehle ki tum mujhe pasand aane lago.', effects: zikRelease },
    maru: { speaker: 'narrator', text: 'Maru Zikomo ke safed jooton pe behosh hota hai. Ek lambi, bhayaanak khaamoshi.', next: 'maru2' },
    maru2: { speaker: 'zikomo', text: 'Isko le jao. BAHUT door le jao. Aur mere liye naye mozey lao.', effects: zikRelease },
  },
};

DIALOGUES_2.goon = {
  start: 'a',
  nodes: { a: { speaker: 'spanner', text: 'Chalta reh, gadhe. Ya boss se baat karni hai?' } },
};

DIALOGUES_2.zik_safe = {
  start: 'a',
  nodes: {
    a: { speaker: 'sam', text: 'Sab aa gaye? Sab saans le rahe hain? Badhiya. Zikomo ko lagta hai Jai zinda hai. Aur Jai… *Pakya ko dekhta hai* …ye hai.', next: 'b' },
    b: { speaker: 'pakya', text: 'Mujhe kya pata tha ki Jai ko maarne waala bhi isi colony mein ghoom raha hai!', next: 'c' },
    c: { speaker: 'goti', text: 'Toh Zikomo ne hi maara?', next: 'd' },
    d: { speaker: 'sam', text: 'Shhh! Pata nahi. Par usko Rahul ka dhol chahiye. Agar hum pehle dhoondh lein, toh shayad sach bhi mil jaaye. Daadi ko pata hoga dhol kahaan gaya.', next: 'e' },
    e: { speaker: 'maru', text: 'Main officially darj karwaana chahta hoon ki mujhe ye plan bilkul pasand nahi.', effects: [{ complete: 'zikomo.gather' }] },
  },
};

/* ═════════════════════ 4. DHOL KAHAAN HAI? ═════════════════════ */

extend(
  'ritu',
  (s) => {
    if (act(s, 'dhol') && !f(s, 'clue.daadi') && s.stat('ritu.trust') >= 45) return 'p2_help';
    if (['jai', 'zikomo', 'dhol', 'chaos', 'after'].some((m) => act(s, m))) return f(s, 'rahul.told') ? 'p2_worried' : 'p2_cool';
    return undefined;
  },
  {
    p2_help: { speaker: 'ritu', text: 'Bhaiya ka dhol storeroom mein tha. Ab nahi hai. Daadi! Bhaiya ke dhol ka kya kiya?', next: 'p2_help2' },
    p2_help2: { speaker: 'daadi', text: 'Bech diya. Shambhu kabaadi ko. Chaalis rupaye. Zindagi ke sabse achhe chaalis rupaye.', effects: [{ flag: 'clue.daadi' }, { event: 'clue' }] },
    p2_worried: { speaker: 'ritu', text: 'Jai bhaiya, kuch pata chala? Us aadmi se pehle Bhaiya ka dhol dhoondh lo. Please. Aur mujhse jhooth mat bolna.' },
    p2_cool: { speaker: 'ritu', text: 'Daadi kehti hain tum chaaron musibat ho. Mujhe bhi ab lagne laga hai.' },
  },
);

DIALOGUES_2.shambhu = {
  start: (s) => (act(s, 'dhol') && f(s, 'clue.daadi') && !f(s, 'clue.shambhu') ? 'ask' : 'junk'),
  nodes: {
    junk: { speaker: 'shambhu', text: 'Purane akhbaar? Purani botal? Purane dost? Sab khareedta hoon, sirf jazbaat nahi.' },
    ask: {
      speaker: 'shambhu',
      text: 'Peele bungalow ka dhol? Shayad yaad hai. Shayad bhool gaya. Bees rupaye daalo toh yaaddaasht tez ho jaati hai.',
      choices: [
        { text: 'Bees rupaye do.', showIf: (s) => s.money >= 20, effects: [{ money: -20 }], next: 'tell' },
        { who: 'sam', tag: 'Sauda', text: 'Kiraaye ke kamre ke kabaad mein pehli pasand offer karo.', next: 'tell_sam' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Main municipal dhol inspector hoon. Jaankaari dijiye.”', effects: [{ claim: 'gang.who', value: 'nagar nigam ke dhol jaanchkarta' }], next: 'tell' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Ek button, ek botal ka dhakkan aur ek pakki aankh maar ke trade karo.', next: 'tell_goti' },
      ],
    },
    tell_sam: { speaker: 'shambhu', text: 'Pehli pasand? CHAAR kunwaaron ke kabaad mein? Ye toh khazaana hai. Pakka.', next: 'tell' },
    tell_goti: { speaker: 'shambhu', text: '*dhakkan ko gaur se dekhta hai* …Ye bahut achha dhakkan hai. Pakka.', next: 'tell' },
    tell: {
      speaker: 'shambhu',
      text: 'Woh dhol maine Lalaji ko becha. Saath rupaye. Magarmachh ki tarah mol-bhaav kiya. Jao, magarmachh se poochho.',
      effects: [{ flag: 'clue.shambhu' }, { event: 'clue' }],
    },
  },
};

DIALOGUES_2.dhol_open = {
  start: 'a',
  nodes: {
    a: { speaker: 'goti', text: 'Dhol ki khaal ke andar kuch sila hua hai. Ek chapta packet. Shaadi wale laal dhaage se bandha.', next: 'b' },
    b: { speaker: 'pakya', text: 'Kholo! Paisa hai. Mujhe mehsoos ho raha hai. Khushboo aa rahi hai.', next: 'c' },
    c: { speaker: 'sam', text: 'Koi nahi kholega. Jab tak pata na chale kis pe bharosa karein. Rahul ne jaan-boojh ke chhupaaya tha.', next: 'd' },
    d: { speaker: 'maru', text: 'Kam se kam phus-phusaana toh band karo? Phus-phusaane se lagta hai kuch bura hone waala hai.', effects: [{ complete: 'dhol.open' }, { give: 'packet' }] },
  },
};

/* ═════════════════════ 5. SAB GADBAD ═════════════════════ */

DIALOGUES_2.chaos_intro = {
  start: 'a',
  nodes: {
    a: { speaker: 'narrator', text: 'Shutter pe khat-khat. Pinky hai, saans phooli hui.', next: 'b' },
    b: { speaker: 'pinky', text: 'Safed jooton waala aadmi bol raha hai suraj dhalte hi tumhare garage aayega. Batane ke dus rupaye diye. Na batane ke bees. Main dono rakh rahi hoon.', next: 'c' },
    c: { speaker: 'sam', text: 'Suraj dhalte… matlab jaldi. Sab log: plan board. ABHI.', next: 'd' },
    d: { speaker: 'goti', text: 'Aur Dongre Mama aaj kamre ki talaashi lene aa rahe hain. Apne paise dhoondhne. Darwaaze pe notice laga diya. Keel se.', next: 'e' },
    e: { speaker: 'pakya', text: 'Aur kal meri sagaai hai. Ritu se. Jai ban ke. Koi mujhe badhaai dega?', next: 'f' },
    f: { speaker: 'maru', text: 'Badhaai ho. Hum sab marne waale hain.' },
  },
};

DIALOGUES_2.chaos_board = {
  start: (s) => (done(s, 'chaos.plan') ? 'after' : 'plan'),
  nodes: {
    after: { speaker: 'narrator', text: 'Board pe likha hai: “1. Nakli dhol yahaan. 2. Asli dhol Maru ki charpai ke neeche. 3. Pakya Mama ko baaton mein uljhaaye. 4. Maru gali pe nazar rakhe. 5. GHABRAANA MANA HAI.” Number 5 ke neeche Maru ne line kheechi hai.' },
    plan: {
      speaker: 'sam',
      text: 'Suraj dhalte hi Zikomo is garage ki talaashi lega. Usko dhol milna chahiye, bas asli nahi. Nakli kahaan se laayein?',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Plan A: Sam Lalaji ko unka shaadi wala dhol kiraaye pe dene ke liye manaaye.', effects: [{ flag: 'chaos.planA' }], next: 'jobs' },
        { who: 'sam', tag: 'Tarkeeb', text: 'Plan B: Goti biscuit ke dabbe, rassi aur purani tabla ki khaal se nakli banaaye.', effects: [{ flag: 'chaos.planB' }], next: 'jobs' },
      ],
    },
    jobs: {
      speaker: 'sam',
      text: 'Asli dhol ghar jaayega, Maru ki charpai ke neeche. Pakya: Mama ko baaton mein uljhaao taaki darwaaze pe talaashi na ho. Maru: gali mein Zikomo ke aadmiyon pe nazar rakho.',
      next: 'jobs2',
    },
    jobs2: { speaker: 'pakya', text: 'Aur tum kya karoge?', next: 'jobs3' },
    jobs3: { speaker: 'sam', text: 'Management.', effects: [{ complete: 'chaos.plan' }, { event: 'planChosen' }] },
  },
};

DIALOGUES_2.chaos_end = {
  start: (s) => {
    const o = s.flags;
    if (o['end.fake']) return 'fake';
    return 'empty';
  },
  nodes: {
    fake: { speaker: 'zikomo', text: '*dhol uthaake soonghta hai* Aha. Rahul ka dhol. Isme khushboo hai… biscuit ki? Aur shaadi ki? Hm. Bhaloo, utha. Dheere se.', next: 'fake2' },
    fake2: { speaker: 'zikomo', text: 'Achhe bachche. Bewakoof, par achhe. Colony chhod ke mat jaana.', next: 'end' },
    empty: { speaker: 'zikomo', text: 'Dhol nahi? DHOL NAHI? Bhaloo, is garage ko ulta kar do.', next: 'empty2' },
    empty2: { speaker: 'narrator', text: 'Bhaloo garage ulta kar deta hai. Use ek rubber ki murgi milti hai. Zikomo use bandhak bana leta hai.', next: 'empty3' },
    empty3: { speaker: 'zikomo', text: 'Kal phir aaunga. Zyaada aadmiyon ke saath. Aur bina sabr ke.', next: 'end' },
    end: { speaker: 'narrator', text: 'Zikomo ki safed gaadi chali jaati hai. Colony ke doosre kone mein, ek asli dhol bahut chup-chaap pada hai.', next: 'end2' },
    end2: { speaker: 'goti', text: 'Humne kar diya! Kar diya na? Kya kiya humne?', next: 'end3' },
    end3: { speaker: 'sam', text: 'Pakya, tu toh JAI ban ke bhi itna bura actor hai ki—', next: 'end4' },
    end4: { speaker: 'narrator', text: 'Shutter ke bahar ek parchhaai. Sagaai ki mithaai ka dabba zameen pe girta hai.', effects: [{ sfx: 'thud' }], next: 'end5' },
    end5: { speaker: 'ritu', text: 'Pakya? PAKYA? Tum… Jai nahi ho? Tum log mere bhai ke naam pe… mere Dada-Dadi ke saamne… *aawaaz kaanpti hai* Mujhse kabhi baat mat karna.', effects: [{ emote: 'ritu', kind: '💢' }, { flag: 'truth.out' }, { event: 'reveal' }], next: 'end6' },
    end6: { speaker: 'maru', text: '…Maine kaha tha na. Hum sab marne waale hain. Bas pehle dil toota.', effects: [{ complete: 'chaos.survive' }, { endPart: 'part2' }] },
  },
};

/* Ramesh the postman: everyday life between the missions. He knows everybody's post. */
DIALOGUES_2.postman = {
  start: (s) =>
    s.missionStatus('epilogue') !== 'locked' ? 'after' : s.missionStatus('reveal') === 'done' || s.missionStatus('finale') === 'active' ? 'zikomo' : f(s, 'ritu.in') ? 'ritu' : 'rent',
  nodes: {
    rent: {
      speaker: 'postman',
      text: 'Phir tum chaaron. Is mahine ki daak: ek karza reminder, ek gusse mein likha karza reminder, aur ek tasveer bana ke karza reminder. Sab Dongre sahab ki taraf se.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Ye reminder… kho sakte hain kya? Thodi si “seva” ke badle?', next: 'sam' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Ye kisi aur Pakya ke liye hain. Ek gareeb wale.”', next: 'pakya' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Poochho ki kya woh Goti ko Goa post kar sakta hai.', next: 'goti' },
        { who: 'maru', tag: 'Tamaasha', text: '“Reminder” shabd sunke behosh ho jao.', next: 'maru' },
        { text: 'Shukriya, Ramesh-ji.', next: 'bye' },
      ],
    },
    ritu: {
      speaker: 'postman',
      text: 'Peele bungalow ko itne mote kaagaz pe khat aate hain ki mudte hi nahi. Tumhare kamre mein koi baar baar poochhta hai ki Ritu-ji ki likhaawat kaisi hai.',
      effects: [{ emote: 'maru', kind: '!' }],
      next: 'bye',
    },
    zikomo: {
      speaker: 'postman',
      text: 'Safed jooton waale ek aadmi ne poochha dhol bajaane waale kis ghar mein rehte hain. Maine kaha main gharon ko unke bills se pehchaanta hoon. Tumhara sabse zyaada bills waala hai.',
      next: 'bye',
    },
    after: {
      speaker: 'postman',
      text: 'Is sadak pe das saal, aur aaj pehli baar tum chaaron ke liye ek parcel aaya hai jo karza reminder NAHI hai. Ye hai… ek naye dhol ki khaal ka bill.',
      effects: [{ emote: 'postman', kind: '♪' }],
      next: 'bye',
    },
    sam: { speaker: 'postman', text: 'Daak khoti nahi, Sam-babu. Daak der se pahunchti hai. Aur Dongre sahab ne usko jaldi pahunchaane ke paise pehle hi de diye hain.', next: 'bye' },
    pakya: { speaker: 'postman', text: 'Wahi pata, wahi naam, wahi chehra, wahi baaki karza. Bahut kamzor bhes.', effects: [{ emote: 'postman', kind: '?' }], next: 'bye' },
    goti: { speaker: 'postman', text: 'Poore Goti ke stamp… *ungliyon pe ginta hai* …karze se zyaada ho jaayenge. Yahin raho.', next: 'bye' },
    maru: { speaker: 'postman', text: '*khat se Maru ko hawa karta hai* Bas kaagaz hai, Maru-babu. Bahut gusse wala kaagaz, par kaagaz hi hai.', effects: [{ emote: 'maru', kind: '…' }], next: 'bye' },
    bye: { speaker: 'postman', text: 'Chalo. Pehle Lalaji, phir tumhara kamra, phir lambi sadak. Daak kabhi nahi rukti. Tum chaaron ki tarah nahi.' },
  },
};
