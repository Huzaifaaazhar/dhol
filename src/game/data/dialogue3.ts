/**
 * Part 3 writing: the truth, the kidnapping and the endings. All original, in Hindi (Roman script).
 * Discoveries are spread across places and people; no single scene explains everything.
 *
 * Rahul and Jai are dead. Rahul was Zikomo's accountant; Zikomo's "lucky draw" took lakhs from the
 * colony and paid nothing. Rahul and Jai took the money back and hid it in Rahul's dhol, the ledger
 * in the old cinema, and Rahul's last words on a cassette. Zikomo killed them for it.
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
    a: { speaker: 'narrator', text: 'Sam laal dhaaga kholta hai. Andar: ek zang lagi chaabi, ₹500 ka aadha note, aur ek tah kiya hua khat.', next: 'b' },
    b: { speaker: 'goti', text: 'Aadha note. AADHA. Aadhe note se kaun payment karta hai?', next: 'c' },
    c: { speaker: 'sam', text: '“Agar ye padh rahe ho, toh tum Zikomo nahi ho. Achha hai. Aur shayad main zinda nahi hoon. Chaabi cinema ki hai. Sangeet dhol mein hai. —R.”', next: 'd' },
    d: { speaker: 'pakya', text: '“Sangeet dhol mein hai.” Shaayaraana. Bekaar, par shaayaraana.', next: 'e' },
    e: { speaker: 'maru', text: 'Chaabi pe likha hai “Shree Talkies, 47”. Purana cinema. Unnees sau ninyaanve se band hai. Bhootiya hai. Sabko pata hai ki bhootiya hai.', next: 'f' },
    f: {
      speaker: 'sam',
      text: 'Toh din mein jaayenge. Aur saath jaayenge. Zyaadatar saath. Kuch log.',
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
      text: 'Shree Talkies? Mere chacha wahaan projector chalaate the. Unki chaabi abhi bhi mere paas hai. Bees saal se koi andar nahi gaya. …Bas pichhle saal, kuch raaton tak, booth mein roshni dikhi thi.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Imaandaari se chaabi maango, aur kyun chahiye ye batao.', next: 'p3_key_sam' },
        { who: 'pakya', tag: 'Jhaansa', text: '“Hum municipal inspector hain. Building girne waali hai.”', effects: [{ claim: 'gang.who', value: 'nagar nigam ke jaanchkarta' }], next: 'p3_key_pak' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Poochho ki cinema mein koi aisa chhed hai jisme gol aadmi ghus sake.', next: 'p3_key_goti' },
        { text: 'Rehne do.', next: 'p3_bye' },
      ],
    },
    p3_key_sam: { speaker: 'sam', text: 'Pappu bhai, wahaan kisi ne kuch chhupaaya hai jo poori colony ka hai. Hum lautaana chahte hain. Ye sach hai.', branch: (s) => (susp(s, 'pappu') < 50 ? 'p3_key_yes' : 'p3_key_no') },
    p3_key_yes: { speaker: 'pappu', text: 'Sach? Tum chaaron se? …Le jao. Wapas laana. Aur agar bhoot mile, toh uska haircut appointment mere saath.', effects: [{ flag: 'cinema.open' }, { give: 'cinemakey' }, { toast: 'Pappu ne cinema ki chaabi de di. Pichhla darwaaza cinema ke peeche hai.' }] },
    p3_key_no: { speaker: 'pappu', text: 'Tumhare doston ne is mahine paanch alag naukriyaan bataayi hain. Aaj sach chahiye? Chaabi nahi.', effects: [{ toast: 'Pappu ko tum pe bharosa nahi. Baat sambhaalo, ya andar jaane ka koi aur raasta dhoondho.' }] },
    p3_key_pak: { speaker: 'pappu', text: 'Municipal inspector.', branch: (s) => (s.flags['tell.contra'] ? 'p3_key_caught' : 'p3_key_yes') },
    p3_key_caught: { speaker: 'pappu', text: 'Pichhle mahine census officer. Aaj municipal inspector. Kal astronaut? Meri kursi se utro.', effects: [{ suspicion: 'pappu', delta: 15 }] },
    p3_key_goti: { speaker: 'pappu', text: '*Goti ko der tak dekhta hai* Peeche ek toota vent hai. Bade aadmi ke liye chhota. Tum ekdum fit ho jaaoge.', effects: [{ toast: 'Cinema ke pichhle darwaaze pe ek vent hai. Goti usme se ghus sakta hai.' }] },
    p3_bye: { speaker: 'pappu', text: 'Baal pachaas rupaye.' },
  },
);

/* ═════════════ Discovery 3: locker 47 ═════════════ */
DIALOGUES_3.locker = {
  start: 'a',
  nodes: {
    a: { speaker: 'narrator', text: 'Chaabi karaahte hue ghoomti hai. Locker 47 ke andar: ek moti kapde ki jild wali kitaab aur chhape hue lottery ticketon ka dher.', next: 'b' },
    b: { speaker: 'sam', text: '“SUNEHRA RUPAYA LUCKY DRAW. Zikomo Enterprises.” Shanti Nagar se jama: ₹4,44,444. Inaam diya: zero.', next: 'c' },
    c: { speaker: 'pakya', text: 'Zikomo ki lottery? YAHAAN? Maine ticket liya tha! Sabne liya tha!', next: 'd' },
    d: { speaker: 'sam', text: 'Har naam isme hai. Lalaji, do hazaar. Bablu, aath sau. Kamla, baarah sau. Aur… Dongre Mama, paanch hazaar. Byaaj ke paise se.', next: 'd2' },
    d2: { speaker: 'sam', text: 'Aur last page pe, Rahul ki likhaawat: “Main aur Jai ye paisa colony ko wapas karenge. Zikomo ko pata chal gaya hai.”', next: 'e' },
    e: { speaker: 'maru', text: 'Aur jeetne waala ticket… number 4444. Ye HAMARA hai! Pichhle saal liya tha! Kho gaya tha! Maine BOLA tha hum jeete! Maru ki koi nahi sunta!', next: 'f' },
    f: { speaker: 'goti', text: 'Khoya nahi. Maine bahut safe jagah rakha. Apni rubber ki murgi ke andar.', branch: (s) => (f(s, 'end.fake') ? 'g_home' : 'g_hostage') },
    g_home: { speaker: 'goti', text: 'Murgi hideout mein mere trunk mein hai. Dheere se dabaana. Pyaank karti hai.', next: 'h' },
    g_hostage: { speaker: 'goti', text: '…jo Zikomo ne hideout ki talaashi mein bandhak bana li thi. Toh. Hamara ticket Zikomo ki gaadi mein hai.', effects: [{ flag: 'chicken.zikomo' }], next: 'h' },
    h: { speaker: 'sam', text: 'Toh Zikomo ne poori colony ko loota. Rahul aur Jai ne paisa wapas chheena. Aur Zikomo ne… *ruk jaata hai* Aur paisa?', next: 'i' },
    i: {
      speaker: 'pakya',
      text: '“Sangeet dhol mein hai.”',
      effects: [{ give: 'register' }, { flag: 'locker.open' }, { complete: 'reveal.locker' }],
    },
  },
};

/* ═════════════ Discovery 4: knocking on the drum ═════════════ */
const knockChoices = (prefix: string) => [
  { text: 'Baayi khaal ke paas thok.', effects: [{ sfx: 'knockDull' as const }], next: `${prefix}left` },
  { text: 'Beech mein lakdi pe thok.', effects: [{ sfx: 'knockWood' as const }], next: `${prefix}mid` },
  {
    text: 'Daayi taraf, patte ke paas thok.',
    showIf: (s: StateView) => !s.flags['daadi.skin'],
    effects: [{ sfx: 'knockHollow' as const }],
    next: 'hollow',
  },
  {
    text: 'Wahaan thok jahaan Rahul aadhi raat ko gond lagaata tha: daayi taraf.',
    showIf: (s: StateView) => !!s.flags['daadi.skin'],
    effects: [{ sfx: 'knockHollow' as const }],
    next: 'hollow',
  },
];

DIALOGUES_3.knock = {
  start: (s) => (s.active === 'goti' ? 'a' : 'other'),
  nodes: {
    other: { speaker: 'me', text: '*thak thak* …Bilkul dhol jaisa lagta hai. Goti kehta hai use lakdi ki awaaz samajh aati hai. Goti bahut kuch kehta hai.' },
    a: { speaker: 'narrator', text: 'Goti dhol pe kaan lagaata hai aur bahut gambhirta se thokta hai, doctor ki tarah.', choices: knockChoices('') },
    left: { speaker: 'goti', text: 'Dhum. Normal. Swasth khaal. Agla.', choices: knockChoices('') },
    mid: { speaker: 'goti', text: 'Thok. Thos lakdi. Bahut thos. Shak waali thos? Nahi. Bas thos.', choices: knockChoices('') },
    hollow: { speaker: 'narrator', text: 'Tok. Tok. TOK. Khokhla. Goti chammach se ek patra dheela karta hai.', effects: [{ sfx: 'cash' }], next: 'cash' },
    cash: { speaker: 'narrator', text: 'Nakli deewaar se laal dhaage mein bandhe noton ke bandal phisalte hain. Bahut saare bandal. Behisaab bandal.', next: 'c2' },
    c2: { speaker: 'goti', text: '…Doston. Sangeet dhol mein hai.', next: 'c3' },
    c3: { speaker: 'pakya', text: 'Ye duniya ka sabse khoobsurat vaakya hai.', next: 'c4' },
    c4: { speaker: 'sam', text: 'Koi haath nahi lagaayega. KOI NAHI. Ye hamara nahi hai. Ye colony ka hai. Aur Rahul aur Jai ne iske liye jaan di. Maru, ginna band kar.', next: 'c5' },
    c5: {
      speaker: 'maru',
      text: 'Chaar lakh, chauvaalees hazaar, chaar sau chauvaalees. Ruk nahi raha. Haath nahi ruk rahe.',
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
      text: '*Pakya ki taraf dekhti bhi nahi* Ritu ne sab bata diya. …Par Rahul ka dhol? Har aadhi raat, dhum dhum dhum, daayi taraf gond lagaata tha. Hamesha daayi taraf. Woh aakhri baar ghar aaya tha toh bhi.',
      effects: [{ flag: 'daadi.skin' }, { complete: 'reveal.daadi' }],
    },
  },
);

extend(
  'tiwari',
  (s) => (['reveal', 'finale'].some((m) => act(s, m)) && s.dhol === 'tiwari' ? 'p2_hasdhol' : undefined),
  {},
);

/* ═════════════ Discovery 5: the projection booth and Rahul's tape ═════════════ */
DIALOGUES_3.booth = {
  start: (s) => (f(s, 'rahul.out') ? 'replay' : f(s, 'drum.open') ? 'code' : 'hum'),
  nodes: {
    hum: { speaker: 'narrator', text: 'Darwaaze ke peeche se ek purana filmi gaana aa raha hai, ghis-ghis ke, baar baar. Darwaaze pe teen ank ka taala hai.', next: 'hum2' },
    hum2: { speaker: 'maru', text: 'Bhoot. BHOOT. Purane gaane jaanne waala bhoot. Ye sabse buri kism ka hota hai.' },
    code: {
      speaker: 'narrator',
      text: 'Wahi gaana. Taale pe teen ank. Sam ledger yaad karta hai. Jeetne waala number. Lottery jo kabhi kisi ne nahi jeeti.',
      choices: [
        { text: '4 – 4 – 4', next: 'code2' },
        { who: 'goti', tag: 'Ajeeb Harkat', text: 'Taale ko pyaar se samjhaao.', next: 'nope' },
      ],
    },
    nope: { speaker: 'goti', text: 'Taala-ji. Hum achhe log hain. Khul jaao. …Nahi khula. Taale bahut ziddi hote hain.', choices: [{ text: '4 – 4 – 4', next: 'code2' }] },
    code2: { speaker: 'narrator', text: 'Khatak. Andar ek chatai, ek ketli, Bablu ke gyaarah samose ke kaagaz, aur ek cassette player jo ab bhi chal raha hai. Gaana khatam hota hai. Ek awaaz aati hai.', effects: [{ flag: 'rahul.out' }, { sfx: 'door' }, { event: 'reveal' }], next: 'r1' },
    r1: { speaker: 'rahul', text: '*cassette pe* Main Rahul Tripathi. Agar ye sun rahe ho, toh shayad main aur Jai… khair. Main Zikomo ka accountant tha. Uski lottery ne colony se chaar lakh liye aur ek paisa nahi diya.', next: 'r2' },
    r2: { speaker: 'rahul', text: '*cassette pe* Maine aur Jai ne paisa wapas chheena. Paisa mere dhol mein, kitaab locker mein, aur ye tape yahaan. Zikomo ko pata chal gaya hai. Wo humein dhoondh raha hai.', next: 'r3' },
    r3: { speaker: 'rahul', text: '*cassette pe* Agar humein kuch ho jaaye… toh samajh lena Zikomo ne kiya. Aur Ritu… meri behen ko batana ki main uske liye Dubai se jhumke laane waala tha. *khatak*', next: 'r4' },
    r4: { speaker: 'narrator', text: 'Bahut der tak koi kuch nahi bolta. Maru bhi nahi.', next: 'r5' },
    r5: { speaker: 'pakya', text: 'Maine… uska naam istemaal kiya. Jai ka. Daadi ka khaana khaane ke liye.', next: 'r6' },
    r6: { speaker: 'sam', text: 'Toh ab uska naam theek se istemaal karenge. Zikomo ko poori colony ke saamne sach bolna padega. Paisa wapas, aur gunaah kabool.', next: 'r7' },
    r7: { speaker: 'goti', text: 'Aur Ritu?', next: 'r8' },
    r8: { speaker: 'sam', text: 'Ritu humse baat nahi karti. Par usko ye tape sunna chahiye. Chalo. Sab.', effects: [{ complete: 'reveal.rahul' }, { event: 'kidnap' }] },
    replay: { speaker: 'rahul', text: '*cassette pe* …Agar humein kuch ho jaaye, toh samajh lena Zikomo ne kiya. *khatak*' },
  },
};

DIALOGUES_3.rahul = {
  start: 'a',
  nodes: { a: { speaker: 'narrator', text: 'Rahul ki tasveer. Muskura raha hai, dhol gale mein. Peeche Jai ka chehra, chai ke daag mein gaayab.' } },
};

/* ═════════════ The finale: witnesses ═════════════ */
const WITNESS_REASON: Record<string, string> = {
  tiwari: 'Aaj raat? Chai ki dukaan pe? Main busy hoon. Apne karze ka intezaar karne mein busy.',
  lalaji: 'Shaam ko dukaan band karoon? Usi waqt toh paisa aata hai.',
  bablu: 'Main chai ki dukaan pe HI hoon. Hamesha hota hoon. Meri dukaan pe hone kya waala hai?',
  pappu: 'Chai ki dukaan pe event? Log honge? Logon ko haircut chahiye.',
};
const WITNESS_YES: Record<string, string> = {
  tiwari: 'Meri lottery ke paise? Paanch hazaar? Aur Rahul ka case? *topi seedhi karta hai* Aaj main asli police waala banunga. Pehle pahunchunga.',
  lalaji: 'Mere do hazaar? Us lutere ki lottery ke? Dukaan band kar raha hoon. Maine zindagi mein kabhi dukaan band nahi ki.',
  bablu: 'Mere aath sau! Sabke liye free chai banaaunga. Ek ek cup. Chhote cup.',
  pappu: 'Agar ye sach hai, toh sabko bataunga. Agar jhooth hai, toh bhi sabko bataunga.',
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
          { who: 'sam', tag: 'Sauda', text: 'Aaj raat chai ki dukaan pe aane ko kaho: lottery ka paisa wapas aa raha hai, aur Zikomo sach bolega.', next: 'p3_w_sam' },
          {
            who: 'sam',
            tag: 'Sach Kabool',
            text: 'Pehle gang ka har jhooth kabool karo. Saare.',
            showIf: (s) => susp(s, npc) >= 50,
            effects: [{ suspicion: npc, delta: -45 }, { stat: 'gang.harmony', delta: -4 }, { flag: `confessed.${npc}` }],
            next: 'p3_w_clean',
          },
          { who: 'pakya', tag: 'Jhaansa', text: '“Aaj raat dukaan pe free chai aur ek film star hai.”', effects: [{ flag: `bluffed.${npc}` }], next: 'p3_w_pak' },
          { text: 'Abhi nahi.', next: 'p3_w_bye' },
        ],
      },
      p3_w_sam: { speaker: 'sam', text: 'Aaj raat, Bablu ki dukaan. Zikomo ki lottery ka saboot, uska loota hua paisa, aapka bhi. Aur Rahul aur Jai ke saath kya hua, woh bhi.', branch: (s) => (susp(s, npc) < 50 ? 'p3_w_yes' : 'p3_w_no') },
      p3_w_no: {
        speaker: npc,
        text: 'Tum chaaron ne poore mahine mujhse jhooth bola. Ek aur kahaani ke liye sadak kyun paar karoon?',
        effects: [{ toast: 'Itna shak hai ki sunenge nahi. Sach kabool karo, ya pehle Sam se baat sambhalwaao.' }],
      },
      p3_w_clean: { speaker: 'sam', text: 'Pakya bank officer nahi hai. Film producer nahi. Income tax nahi. Jai bhi nahi. Hum chaar berozgaar hain. Par is baar, sach hai.', next: 'p3_w_clean2' },
      p3_w_clean2: { speaker: npc, text: '…Saalon mein kisi ne mujhse itna imaandaar kuch nahi bola. Theek hai. Aaunga.', next: 'p3_w_yes' },
      p3_w_pak: { speaker: npc, text: 'Film star? Bablu ki dukaan pe? …Theek hai, aaunga. Par film star nahi mila toh yaad rakhunga.', effects: [{ flag: `witness.${npc}` }, { event: `witness:${npc}` }] },
      p3_w_yes: { speaker: npc, text: WITNESS_YES[npc], effects: [{ flag: `witness.${npc}` }, { event: `witness:${npc}` }] },
      p3_w_done: { speaker: npc, text: 'Bola na aa raha hoon. Baar baar poochhoge toh nahi aaunga.' },
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
      text: 'Woh dhol? Dongre sahab ne aaj subah becha: “kunwaaron ke kamre ka kabaad, karze ki vasooli”. Wapas chahiye? ₹400.',
      choices: [
        { who: 'sam', tag: 'Sauda', text: 'Colony ke har kunwaare ka kabaad, zindagi bhar ke liye, pehli pasand offer karo.', next: 'p3_cart_sam' },
        { text: '₹400 do.', showIf: (s) => s.money >= 400, effects: [{ money: -400 }], next: 'p3_cart_give' },
        { text: 'Rehne do. Goti cart mein dhoondh lega.', next: 'p3_cart_bye' },
      ],
    },
    p3_cart_sam: { speaker: 'shambhu', text: 'Zindagi bhar? …Pakka. Bina paise ke aadmi ke liye bada tagda mol-bhaav hai.', next: 'p3_cart_give' },
    p3_cart_give: { speaker: 'narrator', text: 'Shambhu dhol utaarta hai. Dhol jitna bhaari hona chahiye, usse zyaada hai, aur sab anjaan bane rehte hain.', effects: [{ dholTo: 'carry' }, { event: 'gotDrum' }] },
    p3_cart_bye: { speaker: 'shambhu', text: 'Raddi! Purani cheez, naya paisa!' },
  },
);

/* ═════════════ The climax at the chai stall ═════════════
 * Zikomo holds Ritu and her grandparents by his white car. He gets the drum, gloats, and confesses.
 * His own dynamite (he carries it "for negotiations") is what finally ends him: cartoon-style.
 */
DIALOGUES_3.climax = {
  start: (s) => {
    const e = s.m('ending') as string;
    return e === 'collapse' ? 'col1' : e?.startsWith('blame') ? 'bl1' : e === 'fortune' ? 'fo1' : 'tr1';
  },
  nodes: {
    // ── triumph ──
    tr1: { speaker: 'zikomo', text: 'Dhol! Aakhir! *thapthapaata hai* Chaar lakh, chauvaalees hazaar… Rahul ne socha mujhse chheen lega. Jai ne bhi. Dekho unka kya hua.', next: 'tr2' },
    tr2: { speaker: 'sam', text: 'Kya hua, Zikomo-ji? Zor se bataiye. Colony sunna chahti hai.', next: 'tr3' },
    tr3: { speaker: 'zikomo', text: '*hasta hai* Haan, MAINE maara! Dono ko! Accident banaaya! Aur tum chaar gadhe kya kar loge? Main abhi—', effects: [{ event: 'reveal' }], next: 'tr4' },
    tr4: { speaker: 'tiwari', text: '*bheed mein se, topi seedhi karke* Assistant Sub-Inspector Dongre. Poori colony ne suna. Maine bhi suna. Aur maine likh bhi liya. Pen se.', next: 'tr5' },
    tr5: { speaker: 'zikomo', text: 'Pen se? *kurte se dynamite ki chhadein nikaalta hai* Mere paas bhi ek “pen” hai! Koi hila toh—', next: 'tr6' },
    tr6: { speaker: 'narrator', text: 'Goti ka ek bacha hua pataakha. Ek chingaari. Zikomo ki apni safed jeb mein, apni hi dynamite. Phhhsssss…', effects: [{ sfx: 'whoosh' }], next: 'tr7' },
    tr7: { speaker: 'narrator', text: '*DHADAAAAM!*', effects: [{ sfx: 'thud' }, { event: 'blast' }], next: 'tr8' },
    tr8: { speaker: 'narrator', text: 'Dhuaan chhat-ta hai. Zikomo khada hai: kaala chehra, khade baal, safed joote ab safed nahi. Woh bas itna bolta hai: “…mere joote.” Aur girta hai. Dongre Mama hathkadi laga dete hain.', next: 'tr9' },
    tr9: { speaker: 'ritu', text: '*Dada-Dadi ka haath pakde* Tumne… Bhaiya ke liye ye sab kiya? Jhooth bolne waalon ne sach bulwaaya?', next: 'tr10' },
    tr10: { speaker: 'pakya', text: 'Bas ek baar, Ritu-ji. Pehli aur aakhri baar. Shayad.', next: 'end' },
    // ── collapse ──
    col1: { speaker: 'zikomo', text: 'Dekho inko! Bank officer! Film producer! Income tax! Census! Aur JAI! Aaj kaunse jhoothe pe bharosa karoge, Shanti Nagar?', next: 'col2' },
    col2: { speaker: 'narrator', text: 'Koi aage nahi aata. Bheed ke har chehre ko chaaron ki ek alag kahaani yaad hai.', next: 'col3' },
    col3: { speaker: 'zikomo', text: 'Jaisa socha tha. Bhaloo, dhol utha. Aur ye budhe log? Chhod do. Mujhe sirf paisa chahiye tha. *gaadi mein baith-ta hai* *dynamite ki chhadi se cigar jalaata hai*', next: 'col4' },
    col4: { speaker: 'narrator', text: '*DHADAAAAM!* Safed gaadi ek pal ke liye kaali ho jaati hai. Noton ki baarish. Zikomo dhuaan mein kaanpta hua bahar aata hai, aur pakda jaata hai. Paisa kiska hai, ab koi nahi jaanta.', effects: [{ sfx: 'thud' }, { event: 'blast' }], next: 'col5' },
    col5: { speaker: 'sam', text: 'Is baar hamare paas sach tha. Bas sabka bharosa pehle hi khatam kar chuke the.', next: 'end' },
    // ── one idiot too many ──
    bl1: { speaker: 'zikomo', text: 'Haan, maine maara Rahul aur Jai ko! Aur ab—', next: 'bl2' },
    bl2: { speaker: 'narrator', text: 'Sab mudte hain. Zikomo ki taraf nahi. Chaaron mein se ek ki taraf, jo hamesha ki tarah, tamaasha kar raha hai.', next: 'bl3' },
    bl3: { speaker: 'zikomo', text: 'Woh dekho! WOH waala! Poore hafte se musibat kar raha hai! Aise gang pe bharosa karoge?', next: 'bl4' },
    bl4: { speaker: 'narrator', text: 'Dhakka-mukki mein Zikomo ki apni dynamite gir ke phat-ti hai. *DHADAAM* Paisa wapas aata hai, Zikomo dhuaan mein pakda jaata hai. Par colony ne tay kar liya hai ki is tamaashe ka zimmedaar kaun hai.', effects: [{ sfx: 'thud' }, { event: 'blast' }], next: 'end' },
    // ── raining rupees ──
    fo1: { speaker: 'narrator', text: 'Ek saath bahut kuch hota hai. Koi phisalta hai. Koi cheekhta hai. Dhol zameen pe girta hai, aur nakli patra khul jaata hai.', next: 'fo2' },
    fo2: { speaker: 'narrator', text: 'Bablu ki dukaan pe noton ki baarish. Poori colony note pakadti hai, chilla chilla ke apni lottery ki rakam bolti hai.', next: 'fo3' },
    fo3: { speaker: 'zikomo', text: 'MERA PAISA! Maine is paise ke liye do aadmi maare! …*sab chup* …Maine ye zor se bola kya?', next: 'fo4' },
    fo4: { speaker: 'narrator', text: 'Zikomo bhaagta hai, jeb mein dynamite, aur seedha Gauri gaay se takraata hai. *DHADAAM* Gauri ko kuch nahi hota. Zikomo ko bahut kuch hota hai.', effects: [{ sfx: 'thud' }, { event: 'blast' }], next: 'fo5' },
    fo5: { speaker: 'goti', text: 'Sabka paisa! Ho gaya! Kuch bhi plan ke mutaabik nahi hua aur phir bhi ho gaya!', next: 'end' },
    end: { speaker: 'narrator', text: 'Aur us raat Shanti Nagar ko apna paisa wapas mila. Rahul aur Jai ko insaaf. Aur chaar gadhon ko… ek aur kahaani.', effects: [{ event: 'showEnding' }] },
  },
};

extend(
  'zikomo',
  (s) => (act(s, 'finale') ? 'p3_night' : act(s, 'reveal') ? 'p3_morning' : undefined),
  {
    p3_morning: { speaker: 'zikomo', text: 'Biscuit ka dabba. Taaron ke saath. Mujhe mera paisa chahiye, mera dhol chahiye, aur meri izzat wapas chahiye. Isi order mein.' },
    p3_night: { speaker: 'zikomo', text: 'Ladki aur uske budhe mere paas hain, gadho. Raat se pehle dhol. Warna… *dynamite ki chhadi se daant saaf karta hai*' },
  },
);
