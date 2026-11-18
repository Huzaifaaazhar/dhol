export interface ObjectiveDef {
  id: string; // full id "mission.obj"
  text: string;
  hint?: string;
  /** not needed to finish the mission */
  optional?: boolean;
}

export interface MissionDef {
  id: string;
  title: string;
  intro: string;
  objectives: ObjectiveDef[];
  next?: string;
  /** don't start `next` automatically (an interval card starts it) */
  holdNext?: boolean;
  /** runs on live timers and patrols: reloading restarts it from its checkpoint */
  live?: boolean;
  /** part of the story this belongs to */
  part: 1 | 2 | 3;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'rent',
    title: 'Mama ka Karza',
    intro: 'Maru ke Mama, Assistant Sub-Inspector Dongre, ne chaaron ko “ghar waale byaaj” pe ₹6,000 udhaar diye the. Aaj unhe wapas chahiye. Tumhare paas zero hai.',
    objectives: [
      { id: 'rent.meet', text: 'Gang ko jagaao: har dost ko baari baari chuno', hint: '1–4 dabao, ya Tab se badlo' },
      { id: 'rent.leave', text: 'Dongre Mama se bach ke ghar se niklo', hint: 'Koi jo achha jhooth bole, ya achha ghabraaye' },
    ],
    next: 'chai',
    part: 1,
  },
  {
    id: 'chai',
    title: 'Udhaar ki Chai',
    intro: 'Naashta nahi. Paisa nahi. Par Bablu ki chai ki dukaan chauraahe pe hi hai.',
    objectives: [{ id: 'chai.get', text: 'Bablu se chaar cutting chai lo', hint: 'Bablu achhe business deal ki izzat karta hai' }],
    next: 'job',
    part: 1,
  },
  {
    id: 'job',
    title: 'Pehli Imaandaar Kamaai',
    intro: 'Bablu kehta hai Lalaji ka soda fridge hafte bhar se bhootiya hai. Lalaji chamatkaar ke paise deta hai.',
    objectives: [
      { id: 'job.ask', text: 'Lalaji se unki dukaan ke kaam ke baare mein poochho' },
      { id: 'job.fix', text: 'Bhootiya soda fridge theek karo', hint: 'Samajhdaar log try kar chuke. Goti ko bhejo.' },
    ],
    next: 'plan',
    part: 1,
  },
  {
    id: 'plan',
    title: 'Master Plan',
    intro: 'Do sau rupaye ho gaye, paanch hazaar aath sau baaki. Meeting ka waqt.',
    objectives: [
      { id: 'plan.go', text: 'Patli gali waale adde pe milo' },
      { id: 'plan.board', text: 'Plan board pe strategy meeting karo' },
    ],
    next: 'ritu',
    part: 1,
  },
  {
    id: 'ritu',
    title: 'Naye Padosi',
    intro: 'Bade peele bungalow mein naye padosi: Ritu naam ki ladki aur uske Dada-Dadi. Gossip kehti hai paisa. Plan kehta hai jalwa.',
    objectives: [
      { id: 'ritu.in', text: 'Bungalow ke darwaaze pe Elizabeth Daadi se aage niklo', hint: 'Daadi sarkari logon pe bharosa karti hain, aur kamzoron pe taras khaati hain' },
      { id: 'ritu.impress', text: 'Ritu ko impress karo: har dost ko ek mauka', hint: 'Har dost ban ke Ritu se baat karo' },
    ],
    next: 'rich',
    holdNext: true,
    part: 1,
  },
  /* ───────────────────────── PART 2 ───────────────────────── */
  {
    id: 'rich',
    title: 'Ameer Ladki',
    intro: 'Chaaron ne tay kar liya hai ki Ritu se shaadi karenge. Badkismati se, chaaron ne ye tay kiya hai. Alag alag.',
    part: 2,
    objectives: [
      { id: 'rich.learn', text: 'Pata karo Ritu ko kya pasand hai (2 cheezein)', hint: 'Daadi, bachche aur Lalaji sab use jaante hain. Goti uske bageeche mein dhoondh sakta hai.' },
      { id: 'rich.moves', text: 'Har dost Ritu pe apni chaal chale', hint: 'Woh colony mein ghoomti hai. Baaki doston ko kahin rok do (Q), warna beech mein kood padenge.' },
      { id: 'rich.result', text: 'Pata karo Ritu asal mein Pune kyun aayi', hint: 'Uska bharosa banaaye rakho. Jhooth ghoom ke Daadi tak pahunch hi jaata hai.' },
    ],
    next: 'jai',
  },
  {
    id: 'jai',
    title: 'Main Hoon Jai',
    intro: 'Ritu ka bhai Rahul aur uska dost Jai pichhle saal yahin mare, aur Ritu jaanna chahti hai ki unhe kisne maara. Dada-Dadi ne Jai ko kabhi dekha nahi. Pakya ke paas ek idea hai. Bahut bekaar idea.',
    part: 2,
    objectives: [
      { id: 'jai.stories', text: 'Poochh-taachh karo: colony ko Jai ke baare mein kya yaad hai?', hint: 'Bablu, Lalaji, Pappu aur Dongre Mama sab usse ek baar mile the. Sabko alag alag yaad hai.' },
      { id: 'jai.proof', text: 'Pata karo Ritu ko maut ke baare mein kya pata hai', hint: 'Jab woh phone karne nikle toh chhup ke peechha karo, uska jhola dhoondho (Goti), ya Pappu se lodge ka register khulwaao (Sam).' },
      { id: 'jai.confront', text: 'Pakya: “Jai” ban ke bungalow mein jao', hint: 'Dadaji imtihaan lenge. Tumhara Jai waisa hona chahiye jaisa colony ko yaad hai.' },
    ],
    next: 'zikomo',
  },
  {
    id: 'zikomo',
    title: 'Zikomo Aa Gaya',
    intro: 'Baat jaldi phailti hai: Jai zinda hai. Zikomo ke paas ye maanne ki apni wajah hai ki ye namumkin hai. Safed gaadi, safed joote, do bahut bade aadmi. Use “Jai” aur uske teen gadhe chahiye.',
    part: 2,
    live: true,
    objectives: [
      { id: 'zikomo.gather', text: 'Chaaron doston ko bina pakde adde tak pahunchaao', hint: 'Doston ko baari baari chuno. Thelon ke peeche chhupo (E). Nigraani pe Maru dikhaata hai ki gunde kahaan dekh rahe hain.' },
      { id: 'zikomo.deal', text: 'Ya phir: seedhe Zikomo ke paas jaake deal karo', optional: true },
    ],
    next: 'dhol',
  },
  {
    id: 'dhol',
    title: 'Dhol Kahaan Hai?',
    intro: 'Zikomo ko woh dhol chahiye jo Rahul aur Jai ke paas tha. Ritu ke ghar waalon ko pata nahi kyun. Daadi ne pichhle hafte “koi purana dhol” kabaadi ko bech diya.',
    part: 2,
    live: true,
    objectives: [
      { id: 'dhol.trail', text: 'Gaayab dhol ka suraag dhoondho', hint: 'Daadi se shuru karo. Har aadmi agle ko zimmedaar thehraata hai.' },
      { id: 'dhol.find', text: 'Dhol khud dhoondho', hint: 'Panje ke nishaan ka peechha karo. Goti woh dhoondh leta hai jo koi nahi dhoondh paata.' },
      { id: 'dhol.bring', text: 'Bina dikhe dhol ko adde tak le jao', hint: 'Bhaari hai. Zaroorat ho toh E se kisi aur dost ko pakda do.' },
      { id: 'dhol.open', text: 'Adde pe dhol ki jaanch karo' },
    ],
    next: 'chaos',
  },
  {
    id: 'chaos',
    title: 'Sab Gadbad',
    intro: 'Kal sagaai hai: Ritu aur “Jai” ki. Aaj suraj dhalte Zikomo adde ki talaashi lene aa raha hai, aur Mama apne paise ke liye kamre ki talaashi lene. Chaar kaam, chaar gadhe, ek ghadi.',
    part: 2,
    live: true,
    objectives: [
      { id: 'chaos.plan', text: 'Sam: plan board pe plan chuno' },
      { id: 'chaos.fake', text: 'Adde mein ek nakli dhol rakho', optional: true, hint: 'Sam ka plan tay karega kaise: Lalaji se kiraaye pe lo, ya Goti banaaye.' },
      { id: 'chaos.hide', text: 'Asli dhol ghar pe, Maru ki charpai ke neeche chhupaao', optional: true, hint: 'Dongre Mama darwaaze pe nazar rakhe hain. Pakya unhe baaton mein uljha sakta hai.' },
      { id: 'chaos.survive', text: 'Suraj dhalte Zikomo ki talaashi se bacho' },
    ],
    next: 'reveal',
    holdNext: true,
  },
  /* ───────────────────────── PART 3 ───────────────────────── */
  {
    id: 'reveal',
    title: 'Sach',
    intro: 'Ritu ko pata chal gaya. Koi Jai nahi, sirf Pakya hai, aur woh tum mein se kisi se baat nahi karegi. Tumhare paas bas Rahul ka band packet bacha hai.',
    part: 3,
    objectives: [
      { id: 'reveal.packet', text: 'Adde pe Rahul ka packet kholo' },
      { id: 'reveal.cinema', text: 'Purane Shree Talkies cinema ke andar jao', hint: 'Pichhla darwaaza cinema ke peeche hai, kabaad ke dher ke paar. Pappu ka khaandaan kabhi projector chalaata tha.' },
      { id: 'reveal.locker', text: 'Cinema ki lobby mein locker 47 kholo' },
      { id: 'reveal.drum', text: 'Dhoondho ki asli dhol ke andar kya chhupa hai', hint: 'Thok-thok ke dekho. Fark sirf Goti sun sakta hai. Agar Mama ke paas hai, toh pehle wapas lo.' },
      { id: 'reveal.rahul', text: 'Projection booth mein Rahul ki aakhri tape chalaao' },
      { id: 'reveal.daadi', text: 'Elizabeth Daadi se poochho Rahul apne dhol ka khayaal kaise rakhta tha', optional: true },
    ],
    next: 'finale',
  },
  {
    id: 'finale',
    title: 'Char Yaar, Ek Dhamaka',
    intro: 'Zikomo ne Ritu aur uske Dada-Dadi ko agwa kar liya hai. Unki jaan ke badle dhol, aaj raat, Bablu ki chai ki dukaan pe. Poori colony ke saamne usse kabulwaao ki usne Rahul aur Jai ke saath kya kiya.',
    part: 3,
    live: true,
    objectives: [
      { id: 'finale.drum', text: 'Goti: dhol dhoondho (ab Shambhu ke thele pe hai)', hint: 'Shambhu badi sadak pe ghoomta hai. Uska thela dhoondho.' },
      { id: 'finale.stall', text: 'Pakya: chauk pe Zikomo ko baaton mein uljhaao', hint: 'Use sheikhi bagharne do. Uske sawaal gang ke har purane jhooth ko parkhenge.' },
      { id: 'finale.witness', text: 'Sam: Zikomo ka kabool-naama sunne kam se kam do gawaah laao', hint: 'Jinse jhooth bola, woh nahi aayenge. Sach kabool karo, ya baat sambhaalo.' },
      { id: 'finale.watch', text: 'Maru: Zikomo ke aadmiyon ko dhol se door rakho', optional: true },
      { id: 'finale.chicken', text: 'Zikomo ki gaadi se rubber ki murgi wapas lo', optional: true, hint: 'Jeetne waala lottery ticket uske andar hai.' },
      { id: 'finale.deliver', text: 'Raat se pehle dhol chai ki dukaan tak laao' },
    ],
    next: 'epilogue',
  },
  {
    id: 'epilogue',
    title: 'Picture Abhi Baaki Hai',
    intro: 'Jo hua, so hua. Colony abhi bhi yahin hai, aur chaaron bhi.',
    part: 3,
    objectives: [{ id: 'epilogue.roam', text: 'Colony mein ghoomo. Tumhare kaarnaamon pe sabke paas kehne ko kuch hai.' }],
  },
];

export const MISSION_MAP = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export const SECRETS: Record<string, string> = {
  mirror: 'Pakya ki parchhaai khud se bahut khush hai.',
  charpai: 'Maru ki charpai ke neeche ₹50 mile.',
  cow: 'Goti aur Gauri gaay ki gehri baatcheet hui.',
  poster: 'Cinema ki poster wali deewaar ki… apni raay hai.',
  hairoil: 'Lalaji ka chamatkaari tel zyaadatar ummeed hai.',
  dartboard: 'Adde ke dartboard pe ek jaana-pehchaana chehra hai.',
  scooter: 'Mara hua scooter ek gaana bajaata hai. Sirf ek.',
  barber: 'Pakya ko “Hero Cut” mila. Muft mein. Pata nahi kaise.',
  pigeons: 'Maru banaam chaalis kabootar. Kabootar jeete.',
  tank: 'Paani ke drum mein kisi ka gupt khazaana: ek prem patra. Tumhara nahi.',
  reels: 'Shree Talkies ki aakhri film ka naam tha “Chaar Gadhe aur Ek Dhol”. Hmm.',
};
