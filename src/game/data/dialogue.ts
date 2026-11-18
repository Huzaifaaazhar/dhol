import type { DialogueScript, StateView } from '../types';
import { DIALOGUES_2, EXTENSIONS } from './dialogue2';
import { DIALOGUES_3, EXTENSIONS_3 } from './dialogue3';

const f = (s: StateView, k: string) => !!s.flags[k];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * All writing is original, in Hindi (Roman script). Speakers: friend id, npc id,
 * 'me' (whoever is active) or 'narrator'. Choice tags and toasts are UI and stay in English.
 *
 * Internal ids are kept from earlier versions: 'tiwari' is Dongre Mama (Maru's miser uncle,
 * an Assistant Sub-Inspector who lent the four ₹6,000), 'daadi' is Elizabeth Daadi.
 */
export const DIALOGUES: Record<string, DialogueScript> = {
  /* ───────────── Mission 1: Mama ka Karza ───────────── */
  tiwari: {
    start: (s) => (f(s, 'landlord.cleared') ? pick(['after1', 'after2', 'after3']) : 'block'),
    nodes: {
      block: {
        speaker: 'tiwari',
        text: 'Aha! Chaar bhaanje. Ek darwaaza. Ek Mama. Mera chhe hazaar kahaan hai? Byaaj ke saath, beta. Byaaj ke saath!',
        effects: [{ emote: 'tiwari', kind: '💢' }],
        next: 'block2',
      },
      block2: {
        speaker: 'tiwari',
        text: 'Jab tak paise ki khushboo nahi aayegi, koi is ghar se bahar nahi jaayega. Main police mein hoon, bhool gaye?',
        choices: [
          { who: 'sam', tag: 'Sauda', text: 'Ek flexible payment plan pesh karo.', next: 'sam1' },
          { who: 'pakya', tag: 'Jhaansa', text: 'Jaldi se koi bada aadmi ban jao.', next: 'pakya1' },
          { who: 'maru', tag: 'Tamaasha', text: 'Seena pakdo. Filmi style mein gir jao.', next: 'maru1' },
          { who: 'goti', tag: 'Ajeeb Harkat', text: 'Girvi mein ek chamakta patthar do.', next: 'goti1' },
          { text: 'Bhaago!', next: 'run1' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Mama-ji. Ek flexible, long-term, dono taraf faayde wala payment structure discuss karte hain.', next: 'sam2' },
      sam2: { speaker: 'tiwari', text: 'Flexible? Mera pet flexible hai. Mera byaaj nahi. Aaj kuch toh do. Ek rupaya bhi chalega.', next: 'sam3' },
      sam3: { speaker: 'sam', text: '…Aatmavishvas mein payment chalega?', next: 'pushback' },
      pakya1: {
        speaker: 'pakya',
        text: '*collar theek karta hai* Mama-ji, aap ek bahut busy aadmi se baat kar rahe ho. Main asal mein…',
        choices: [
          { who: 'pakya', tag: 'Jhaansa', text: '“…bank officer hoon. Somvaar ko salary aayegi.”', effects: [{ claim: 'pakya.job', value: 'bank mein afsar', to: 'tiwari' }], next: 'bank1' },
          { who: 'pakya', tag: 'Jhaansa', text: '“…Income Tax department se hoon. Undercover.”', effects: [{ claim: 'pakya.job', value: 'income tax ka afsar', to: 'tiwari' }], next: 'tax1' },
          { who: 'pakya', tag: 'Jhaansa', text: '“…film producer hoon. Aapki chhat pe shooting karni hai.”', effects: [{ claim: 'pakya.job', value: 'filmon ka producer', to: 'tiwari' }], next: 'film1' },
        ],
      },
      bank1: { speaker: 'tiwari', text: 'Bank? Tu? *aankhein sikodta hai* Kaunsa bank?', next: 'bank2' },
      bank2: { speaker: 'pakya', text: 'Woh bada wala. Logo wala. Building wala.', next: 'bank3' },
      bank3: { speaker: 'tiwari', text: 'Somvaar. SOMVAAR. Warna tum chaaron ko havalaat mein byaaj bharna padega.', next: 'cleared' },
      tax1: {
        speaker: 'tiwari',
        text: 'Income tax?! M-mera koi extra income nahi hai! Woh byaaj ka dhanda… woh toh samaaj seva hai! Jaao, jaao, aaram se jaao, sahab!',
        effects: [{ emote: 'tiwari', kind: '!' }],
        next: 'cleared',
      },
      film1: { speaker: 'tiwari', text: 'Meri chhat? Film mein? *topi theek karta hai* Theek hai. Somvaar. Aur credits mein mera naam. Bade bade akshar mein. “Inspector Dongre.”', next: 'cleared' },
      maru1: { speaker: 'maru', text: 'Aaah! Mera dil! Byaaj ka… pressure… sab kuch… dhundhla ho raha hai… Mama… meri wasiyat mein… kuch nahi hai…', effects: [{ sfx: 'thud' }], next: 'maru2' },
      maru2: {
        speaker: 'tiwari',
        text: 'Arre arre arre! Bhaanje, mar mat! Tera loan kaun chukaayega?! Paani! Koi paani lao!',
        effects: [{ emote: 'tiwari', kind: '!' }],
        next: 'maru3',
      },
      maru3: { speaker: 'narrator', text: 'Mama paani dhoondhne bhaagte hain. Gang chupke se nikal leti hai. Maru kuch zyaada hi jaldi theek ho jaata hai.', next: 'cleared' },
      goti1: { speaker: 'goti', text: 'Mama-ji. Ye patthar. Bahut lucky hai. Bahut chamakdaar. Somvaar tak aap rakh lo.', next: 'goti2' },
      goti2: { speaker: 'tiwari', text: '…Ye mere gamle se uthaaya hai na?', next: 'goti3' },
      goti3: { speaker: 'goti', text: '…Nahi.', next: 'pushback' },
      run1: { speaker: 'tiwari', text: 'Aa-ha-ha. Ghutne boodhe hain, beta. Haath police wale hain.', next: 'pushback' },
      pushback: {
        speaker: 'tiwari',
        text: 'ANDAR. Saare ke saare. Paisa lao, ya phir koi achhi kahaani.',
        effects: [
          { emote: 'tiwari', kind: '💢' },
          { goto: 'house', spawn: 'door' },
          { toast: 'Mama ko aisi kahaani chahiye jise woh kaat na sakein. Ya koi beemari ka naatak.' },
        ],
      },
      cleared: {
        speaker: 'narrator',
        text: 'Aap azaad ho. Filhaal. Mama apni kursi pe akhbaar aur gehre dhokhe ke ehsaas ke saath baith jaate hain.',
        effects: [{ flag: 'landlord.cleared' }, { complete: 'rent.leave' }, { sfx: 'success' }],
      },
      after1: { speaker: 'tiwari', text: 'Somvaar! Diary mein likh liya hai. Pen se! Pencil se nahi!' },
      after2: { speaker: 'tiwari', text: 'Main tum chaaron pe nazar rakh raha hoon. Mere paas aur koi kaam nahi, isliye bahut dhyaan se rakh raha hoon.' },
      after3: { speaker: 'tiwari', text: 'Hamare zamaane mein ladkon ke paas naukri hoti thi. Aur moonchh. Asli wali.' },
    },
  },

  /* ───────────── Mission 2: Udhaar ki Chai ───────────── */
  bablu: {
    start: (s) => {
      if (s.missionStatus('chai') === 'active') return 'ask';
      if (s.missionStatus('chai') === 'locked') return 'early';
      return pick(['gossip_ritu', 'gossip_tiwari', 'gossip_lalaji']);
    },
    nodes: {
      early: { speaker: 'bablu', text: 'Chai? Pehle apne Mama ko sambhaalo. Subah chhe baje yahaan aake chillaane ki practice kar rahe the.' },
      ask: {
        speaker: 'bablu',
        text: 'Chaar chai? Tumhara khaata teen sau chaalis rupaye ka hai. Meri dukaan pe sharam ki deewaar hai, aur woh deewaar TUM chaaron ho.',
        choices: [
          { who: 'sam', tag: 'Sauda', text: 'Partnership offer karo: free advertising.', next: 'sam1' },
          { who: 'pakya', tag: 'Jhaansa', text: 'Batao ki tum famous food critic ho.', effects: [{ claim: 'pakya.job', value: 'khaane ka aalochak', to: 'bablu' }], next: 'pakya1' },
          { who: 'maru', tag: 'Tamaasha', text: 'Bhookh se behosh ho jao.', next: 'maru1' },
          { who: 'goti', tag: 'Ajeeb Harkat', text: 'Saare biscuit taste-test karne ka offer do.', next: 'goti1' },
          { text: 'Rehne do.', next: 'bye' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Bablu bhai, socho. Chaar handsome jawaan, tumhari chai peete hue, sabke saamne. Isse kehte hain advertising.', next: 'sam2' },
      sam2: { speaker: 'bablu', text: 'Handsome?', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'Relatively. Gaay ke muqaable.', next: 'sam4' },
      sam4: {
        speaker: 'bablu',
        text: '…Chalo theek hai. Chaar cutting. Lekin ZOR se surrrrp karna. Jaise shehar ki sabse achhi chai ho. Kyunki hai.',
        effects: [{ flag: 'chai.got' }, { complete: 'chai.get' }, { emote: 'bablu', kind: '♥' }],
        next: 'tip',
      },
      tip: {
        speaker: 'bablu',
        text: 'Aur paise chahiye toh suno: Lalaji ka soda fridge hafte bhar se band hai. Kehta hai bhoot hai. Chamatkaar ke paise deta hai.',
      },
      pakya1: { speaker: 'bablu', text: 'Pichhle mahine tu cricket selector tha. Usse pehle film producer. Usse pehle mera bichhda hua bhai.', next: 'pakya2' },
      pakya2: { speaker: 'pakya', text: 'Range hai meri.', next: 'no' },
      maru1: { speaker: 'maru', text: 'Bablu bhai… itni… bhookh… mujhe… apne purvaj dikh rahe hain…', next: 'maru2' },
      maru2: { speaker: 'bablu', text: 'Subah ke nau baje hain. Kal bhi yahin behosh hua tha. Mangalvaar ko bhi. Isi jagah.', next: 'no' },
      goti1: { speaker: 'bablu', text: 'Pichhli baar tune aadha dabba “taste-test” kiya aur dabbe ko paanch star de diye.', next: 'no' },
      no: { speaker: 'bablu', text: 'Chai nahi milegi. Asli offer leke aao.' },
      bye: { speaker: 'bablu', text: 'Garam chai! Sirf nakad!' },
      gossip_ritu: {
        speaker: 'bablu',
        text: 'Badi khabar: peele bungalow mein ek ladki apne dada-dadi ke saath aayi hai. Bada ghar, bada gate. Log kehte hain bada paisa.',
        effects: [{ flag: 'gossip.ritu' }],
      },
      gossip_tiwari: { speaker: 'bablu', text: 'Tumhare Dongre Mama sirf do cheezon se darte hain: income tax department aur Mami. Isi order mein.' },
      gossip_lalaji: { speaker: 'bablu', text: 'Lalaji din mein do baar sikke ginte hain. Ek baar ginne ke liye, ek baar shubh raatri kehne ke liye.' },
    },
  },

  /* ───────────── Mission 3: Pehli Imaandaar Kamaai ───────────── */
  lalaji: {
    start: (s) => {
      if (f(s, 'fridge.fixed')) return 'after';
      if (s.missionStatus('job') === 'active') return s.objectiveDone('job.ask') ? 'waiting' : 'job1';
      return 'shop';
    },
    nodes: {
      shop: { speaker: 'lalaji', text: 'Ram Ram. Udhaar nahi. Na aaj, na kal, na agle janam mein.' },
      job1: { speaker: 'lalaji', text: 'Ram Ram. Tum chaaron. Khareedne aaye ho, ya waqt kaatne?', next: 'job2' },
      job2: { speaker: 'me', text: 'Lalaji, suna hai ek bhootiya fridge hai jise theek karna hai.', next: 'job3' },
      job3: {
        speaker: 'lalaji',
        text: 'Bhootiya! Cola garam jaata hai, garam nikalta hai. Mechanic, electrician aur mera saala, teeno haar gaye.',
        next: 'job4',
      },
      job4: {
        speaker: 'lalaji',
        text: 'Jo theek karega, do sau rupaye. Kone mein rakha hai. Aur bigaadna mat. Bechaara pehle se dukhi hai.',
        effects: [{ complete: 'job.ask' }],
      },
      waiting: { speaker: 'lalaji', text: 'Fridge kone mein hai. Abhi bhi bhootiya hai. Main abhi bhi paise de raha hoon.' },
      after: { speaker: 'lalaji', text: 'Jab se tumhare gol-matol dost ne fridge ko thappad maara, barf bana raha hai. BARF. Cola fridge mein. Zindagi ke sabse achhe do sau rupaye.' },
    },
  },
  fridge_look: {
    start: (s) => (f(s, 'fridge.fixed') ? 'fixed' : 'look'),
    nodes: {
      look: { speaker: 'me', text: 'Gungunaata hai. Muh phulaata hai. Pakka bhootiya hai. Koi samajhdaar aadmi isko kabhi nahi maarega.', next: 'look2' },
      look2: { speaker: 'narrator', text: 'Goti samajhdaar aadmi nahi hai.' },
      fixed: { speaker: 'narrator', text: 'Fridge khushi se ghurr-ghurr karta hai. Label pe chhota sa barf ka tukda jam gaya hai. Lalaji har ghante milne aate hain.' },
    },
  },
  fridge_goti: {
    start: 'a',
    nodes: {
      a: { speaker: 'goti', text: 'Fridge bhi chachaon jaise hote hain. Izzat se maante hain… aur baayi taraf ek zordaar thappad se.', next: 'b' },
      b: { speaker: 'narrator', text: '*DHADAAM*', effects: [{ sfx: 'thud' }], next: 'c' },
      c: { speaker: 'narrator', text: 'Fridge kaanpta hai, khaansta hai, aur garajke chalu ho jaata hai. Ek barf ka tukda gir ke farsh pe phisalta hai.', next: 'd' },
      d: {
        speaker: 'lalaji',
        text: 'CHAMATKAAR! Lo apne do sau rupaye aur niklo, isse pehle ki kuch aur chhoo lo.',
        effects: [{ flag: 'fridge.fixed' }, { money: 200 }, { complete: 'job.fix' }, { emote: 'lalaji', kind: '!' }],
      },
    },
  },
  hairoil: {
    start: 'a',
    nodes: {
      a: { speaker: 'sam', text: '“Lalaji ka Chamatkaari Tel. Saat din mein asar, ya saat saal mein. Guarantee nahi. Khushboo achhi hai.”', next: 'b' },
      b: { speaker: 'sam', text: 'Ye product nahi hai. Ye business plan hai. Main izzat karta hoon.', effects: [{ secret: 'hairoil' }] },
    },
  },

  /* ───────────── Mission 4: Master Plan ───────────── */
  plan_board: {
    start: (s) => (s.missionStatus('plan') === 'active' && s.objectiveDone('plan.go') ? 'm1' : f(s, 'plan.made') ? 'after' : 'idle'),
    nodes: {
      idle: { speaker: 'narrator', text: 'Plan board pe likha hai: “1. Ameer bano. 2. ??? 3. Ameer raho.” Step 2 kayi baar mitaaya gaya hai.' },
      after: { speaker: 'narrator', text: 'Board pe ab likha hai: “OPERATION NAYE PADOSI. Rule 1: Koi bewakoofi nahi karega.” Goti ne neeche joda hai: “bewakoofi matlab?”' },
      m1: { speaker: 'sam', text: 'Gentlemen. Facts. Mama ka karza: chhe hazaar, plus byaaj. Hamare paas: do sau.', next: 'm2' },
      m2: { speaker: 'goti', text: 'Aur ek barf ka tukda. Maine rakh liya. Jeb mein hai.', next: 'm3' },
      m3: { speaker: 'sam', text: 'Option ek: naukri dhoondhein.', next: 'm4' },
      m4: { speaker: 'narrator', text: 'Ek lambi, izzatdaar khaamoshi.', next: 'm5' },
      m5: { speaker: 'sam', text: 'Option do: lottery.', next: 'm6' },
      m6: { speaker: 'maru', text: 'Pichhle saal ticket liya tha. Phir ticket kho gaya. Phir shayad hum jeet gaye. Main is baare mein baat nahi karna chahta.', next: 'm7' },
      m7: { speaker: 'pakya', text: 'Option teen. *peeche jhukta hai* Ameer ladki se shaadi.', next: 'm8' },
      m8: { speaker: 'sam', text: 'Ye toh… *board palat-ta hai* …pehle se meri list mein hai.', next: 'm9' },
      m9: { speaker: 'pakya', text: 'Peele bungalow wali nayi ladki. Ritu. Bablu kehta hai ghar do manzil ka hai aur andar jhoola hai. ANDAR.', next: 'm10' },
      m10: { speaker: 'maru', text: 'Uski dadi ke paas lathi hai. Maine lathi dekhi hai. Lathi ne mujhe dekha hai.', next: 'm11' },
      m11: {
        speaker: 'sam',
        text: 'Toh tay raha. Operation Naye Padosi. Saath jaayenge, achha impression daalenge, aur koi bewakoofi nahi karega.',
        next: 'm12',
      },
      m12: {
        speaker: 'goti',
        text: 'Bewakoofi matlab?',
        effects: [{ flag: 'plan.made' }, { complete: 'plan.board' }],
      },
    },
  },

  /* ───────────── Mission 5: Naye Padosi ───────────── */
  ritu_gate: {
    start: (s) => {
      if (f(s, 'ritu.in')) return 'open';
      if (s.missionStatus('ritu') === 'active') return 'd1';
      return 'closed';
    },
    nodes: {
      closed: { speaker: 'narrator', text: 'Bada sa peela bungalow, bahut chamakta gate. Chhoti si takhti: “Salesman ko daudaaya jaayega.”' },
      open: { speaker: 'narrator', text: 'Daadi ne darwaaza khula chhoda hai. Ya toh bharosa hai, ya phir jaal.' },
      d1: { speaker: 'daadi', text: 'Kaun hai? Water purifier bechne aaye ho toh mere paas teen hain. Ek toh baat bhi karta hai.', next: 'd2' },
      d2: {
        speaker: 'daadi',
        text: 'Hmm? Bolo. Main boodhi hoon, sabr waali nahi.',
        choices: [
          { who: 'sam', tag: 'Sauda', text: 'Khud ko official welcome committee batao.', effects: [{ claim: 'gang.who', value: 'Gali Chaar Swagat Samiti', to: 'daadi' }], next: 'sam1' },
          { who: 'pakya', tag: 'Jhaansa', text: 'Kaho ki sarkari kaam se aaye ho.', next: 'pakya1' },
          { who: 'maru', tag: 'Tamaasha', text: 'Unke darwaaze pe murjha jao.', next: 'maru1' },
          { who: 'goti', tag: 'Ajeeb Harkat', text: 'Poochho ki extra biscuit hain kya.', next: 'goti1' },
          { text: 'Dheere dheere peeche hato.', next: 'leave' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Namaste Daadi. Hum Lane Chaar Swagat Samiti hain. Official. Hum swagat karte hain.', next: 'sam2' },
      sam2: { speaker: 'daadi', text: 'Aisi koi samiti nahi hai.', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'Ab hai. Aaj subah banaayi. Aap hamari pehli aur sabse important member ho.', next: 'sam4' },
      sam4: { speaker: 'daadi', text: '…Hmph. Kam se kam organised toh ho. Andar aao. Pair ponchh ke. Aathon.', next: 'in' },
      pakya1: {
        speaker: 'pakya',
        text: 'Madam, hum…',
        choices: [
          { who: 'pakya', tag: 'Jhaansa', text: '“…Cable TV company se hain. Routine inspection.”', effects: [{ claim: 'pakya.job', value: 'cable TV ka jaanchkarta', to: 'daadi' }], next: 'cable1' },
          { who: 'pakya', tag: 'Jhaansa', text: '“…Census department se hain. Log gin rahe hain.”', effects: [{ claim: 'gang.who', value: 'janganana waale', to: 'daadi' }], next: 'census1' },
        ],
      },
      cable1: {
        speaker: 'daadi',
        text: 'AAKHIR! Do din se mera serial band hai! Saas sab kuch bataane hi waali thi! Andar aao, andar aao, theek karo!',
        effects: [{ flag: 'ritu.cable' }],
        next: 'in',
      },
      census1: { speaker: 'daadi', text: 'Census? Pichhle census wale ke paas uniform tha aur clipboard. Tumhari uniform kahaan hai?', next: 'census2' },
      census2: { speaker: 'pakya', text: '…Casual Friday.', next: 'census3' },
      census3: { speaker: 'daadi', text: 'Aaj Budhvaar hai. Namaste.', effects: [{ emote: 'daadi', kind: '💢' }] },
      maru1: { speaker: 'maru', text: 'Ohhh… dhoop… garmi… meri taangein… daal ki bani hain…', effects: [{ sfx: 'thud' }], next: 'maru2' },
      maru2: {
        speaker: 'daadi',
        text: 'Arre, bechaara patla wala! Andar lao, paani do! Tum teeno nahi. …Achha, tum teeno bhi. Kuch chhoona mat.',
        next: 'in',
      },
      goti1: { speaker: 'daadi', text: 'Extra biscuit nahi hain. Extra lathi hai. Milna chahoge?', effects: [{ emote: 'daadi', kind: '💢' }] },
      leave: { speaker: 'daadi', text: 'Hmph. Aaj kal ke ladke. Baat karna bhi nahi aata.' },
      in: {
        speaker: 'narrator',
        text: 'Darwaaza charr-charr karke khulta hai. Aap andar ho. Kaise, kisi ko nahi pata.',
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
      default: { speaker: 'ritu', text: 'Oh. Phir se hello. Waise Daadi tumhe dekh rahi hain. Woh hamesha dekhti rehti hain.' },
      done_me: { speaker: 'ritu', text: 'Tumhari baari ho gayi. Apne doston ko bhi apni beizzati karne do.' },
      try_sam: {
        speaker: 'sam',
        text: 'Hello. Main Sam. Mere paas paanch saal ka plan hai, das saal ka plan hai, aur dono ka backup plan.',
        next: 'sam2',
      },
      sam2: { speaker: 'ritu', text: 'Impressive. Aur aaj ka plan kya hai?', next: 'sam3' },
      sam3: { speaker: 'sam', text: '…Aapse baat karna hi poora plan tha. Iske aage maine socha nahi.', next: 'sam4' },
      sam4: { speaker: 'ritu', text: 'Shuruaat dhaansu. Aage ka kuch nahi.', effects: [{ flag: 'impress.sam' }, { emote: 'ritu', kind: '…' }], branch: check },
      try_pakya: { speaker: 'pakya', text: '*almaari pe tik ke* Log mujhe Pakya kehte hain. Kuch log “The Voice” bhi.', next: 'pakya2' },
      pakya2: { speaker: 'ritu', text: 'Kaunse log?', next: 'pakya3' },
      pakya3: { speaker: 'pakya', text: '…Log. Bahut saare log. International.', next: 'pakya4' },
      pakya4: {
        speaker: 'narrator',
        text: 'Peeche almaari ka darwaaza khul jaata hai. Pakya hilta nahi. Usne tay kar liya hai ki ye cool hai.',
        effects: [{ flag: 'impress.pakya' }, { emote: 'ritu', kind: '?' }],
        branch: check,
      },
      try_goti: { speaker: 'goti', text: 'Hi! Imli pasand hai? Meri jeb mein hai. Holi se.', next: 'goti2' },
      goti2: { speaker: 'ritu', text: 'Holi… se?', next: 'goti3' },
      goti3: { speaker: 'goti', text: 'Puraani hai. Achhi wine ki tarah. Ya cheese. Ya Daadi.', next: 'goti4' },
      goti4: {
        speaker: 'ritu',
        text: '*hasi rok nahi paati* Tum bahut ajeeb ho.',
        effects: [{ flag: 'impress.goti' }, { emote: 'ritu', kind: '♥' }],
        next: 'goti5',
      },
      goti5: { speaker: 'goti', text: 'Shukriya!', branch: check },
      try_maru: { speaker: 'maru', text: 'H-hello. Main Maru. Main normally bahut shaant aur bahut—', next: 'maru2' },
      maru2: {
        speaker: 'narrator',
        text: 'Maru ki kohni Daadi ke pyaare peetal ke guldaan se milti hai. Guldaan farsh se milta hai. Farsh jeet-ta hai, zor se.',
        effects: [{ sfx: 'thud' }, { emote: 'daadi', kind: '💢' }, { flag: 'vase.broken' }],
        next: 'maru3',
      },
      maru3: { speaker: 'daadi', text: 'MERA GULDAAN!', next: 'maru4' },
      maru4: { speaker: 'maru', text: 'YE PEHLE SE AISA— nahi tha. Maaf kijiye. Main isse shaadi kar loonga. Matlab theek kar doonga.', next: 'maru5' },
      maru5: {
        speaker: 'ritu',
        text: '*hasi dabaate hue* Peetal ka hai. Uchhalta hai. Daadi, uchhal gaya.',
        effects: [{ flag: 'impress.maru' }, { emote: 'ritu', kind: '♥' }],
        branch: check,
      },
      more: {
        speaker: 'ritu',
        text: 'Aur koi? Ya bas itna hi show tha?',
        effects: [{ toast: 'Dost badlo aur Ritu se phir baat karo. Har ek ko ek mauka.' }],
      },
      finale1: {
        speaker: 'ritu',
        text: 'Waah. Tum chaaron toh… kuch alag hi ho. Daadi, mujhe ye pasand aaye. TV se zyaada funny hain.',
        next: 'finale1b',
      },
      finale1b: {
        speaker: 'dadaji',
        text: '*chashma utaarke* Ek ka kurta polyester. Ek ka nylon. Ek ka pata nahi kya. Aur ek ne guldaan toda. PhD in Textiles, beta. Mujhse kuch nahi chhupta.',
        next: 'finale2',
      },
      finale2: { speaker: 'daadi', text: 'TV ab chal raha hai. Bahar. Saare.', next: 'finale3' },
      finale3: {
        speaker: 'narrator',
        text: 'Chaar dost bilkul chup-chaap ghar laut-te hain. Har ek ko pakka yakeen hai ki Ritu ko WOH pasand aaya.',
        next: 'finale4',
      },
      finale4: {
        speaker: 'narrator',
        text: 'Ye problem banne waali hai.',
        effects: [{ complete: 'ritu.impress' }, { endPart: true }, { goto: 'street', spawn: 'rituGate' }],
      },
    },
  },
  daadi: {
    start: (s) => (f(s, 'vase.broken') ? 'vase' : f(s, 'ritu.cable') ? 'cable' : 'warn'),
    nodes: {
      warn: { speaker: 'daadi', text: 'Seedhe baitho. Guldaan ko haath mat lagao. Guldaan ko dekho bhi mat. Guldaan tumhare liye nahi hai.' },
      cable: { speaker: 'daadi', text: 'Tumne plug wapas laga ke mera TV theek kar diya. Kitna hoshiyaar ladka. Tumhare dost kam hoshiyaar hain.' },
      vase: { speaker: 'daadi', text: 'Woh guldaan meri shaadi ka tha. Teen baadh, do bhookamp aur ek Maru jhel chuka hai.' },
    },
  },
  /* Ritu's grandfather: PhD in Textiles, judges everyone by their fabric */
  dadaji: {
    start: () => pick(['a', 'b', 'c']),
    nodes: {
      a: { speaker: 'dadaji', text: '*tumhari kameez ko chhoota hai* Hmm. Sixty percent polyester. Forty percent jhooth. Baitho.' },
      b: { speaker: 'dadaji', text: 'Chaalis saal kapde ki research ki. Aadmi ko uske dhaage se pehchaanta hoon. Tumhara dhaaga… dheela hai.' },
      c: { speaker: 'dadaji', text: 'Ritu bahut ziddi hai. Apni Dadi pe gayi hai. Main toh shaant aadmi hoon. Cotton ki tarah. Saans leta hoon.' },
    },
  },

  /* ───────────── Neighbourhood life ───────────── */
  pappu: {
    start: () => pick(['a', 'b']),
    nodes: {
      a: { speaker: 'pappu', text: 'Baal, daadhi aur aaj ki gossip: pachaas rupaye. Sirf gossip free. Tumhare Mama income tax office se darte hain. Maine nahi bataaya.' },
      b: { speaker: 'pappu', text: 'Kamla kehti hai Lalaji roz uski bhindi khareedte hain. Itni bhindi koi nahi khaata. Koi nahi.' },
    },
  },
  pappu_pakya: {
    start: 'a',
    nodes: {
      a: { speaker: 'pakya', text: 'Pappu bhai. Socho. Mere baal. Tumhari kainchi. Din bhar colony mein ghoomte hue. Chalta-phirta advertisement.', next: 'b' },
      b: { speaker: 'pappu', text: '…Pata hai? Ye toh sach mein smart hai. Baith.', next: 'c' },
      c: {
        speaker: 'narrator',
        text: 'Bees minute baad, Pakya ke baal baarah centimeter oonche hain aur kanoonan ek landmark hain.',
        effects: [{ secret: 'barber' }, { emote: 'pappu', kind: '♥' }],
      },
    },
  },
  carrom: {
    start: () => pick(['a', 'b', 'c']),
    nodes: {
      a: { speaker: 'sharma', text: 'Unnees sau chauraasi mein maine aankh band karke queen daali thi.', next: 'a2' },
      a2: { speaker: 'verma', text: 'Aur tab se kholi nahi. Isiliye haarte ho.' },
      b: { speaker: 'verma', text: 'Tum ladkon ko naukri kar leni chahiye. Hamare zamaane mein naukri hoti thi. Bekaar naukri. Hum usse pyaar karte the.', next: 'b2' },
      b2: { speaker: 'sharma', text: 'Isko apni naukri se nafrat thi.', next: 'b3' },
      b3: { speaker: 'verma', text: 'Nafrat karne mein mazaa aata tha. Isse character banta hai.' },
      c: { speaker: 'sharma', text: 'Shhh. Shhh! Striker apna raasta chun raha hai. Board pe saans mat lo.' },
    },
  },
  kids: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'chintu',
        text: 'Bhaiya! Ek over daalo na. Bas ek! Pinky kehti hai usko koi out nahi kar sakta.',
        choices: [
          { who: 'goti', tag: 'Ajeeb Harkat', text: 'Underarm daalo. Ulta. Ghoomte hue.', next: 'goti1' },
          { who: 'sam', tag: 'Sauda', text: 'Pehle rules tay karo.', next: 'sam1' },
          { text: 'Abhi nahi, hum gareeb hone mein busy hain.', next: 'no' },
        ],
      },
      goti1: { speaker: 'pinky', text: 'Ye ALLOWED nahi hai! …Phir se karo! Phir se!', effects: [{ emote: 'pinky', kind: '♥' }, { emote: 'chintu', kind: '!' }] },
      sam1: { speaker: 'pinky', text: 'Rules? Rule ye hai: scooter ko lagi toh chhakka. Dongre Mama ko lagi toh bhaago.' },
      no: { speaker: 'chintu', text: 'Tum log hamesha gareeb hone mein busy rehte ho.' },
    },
  },
  sabzi: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'sabziwali',
        text: 'Tamatar chaalis, pyaaz tees, salaah free: naukri dhoondho.',
        choices: [
          { who: 'sam', tag: 'Sauda', text: 'Mol-bhaav karo. Bas practice ke liye.', next: 'sam1' },
          { text: 'Bas dekh raha hoon.', next: 'bye' },
        ],
      },
      sam1: { speaker: 'sam', text: 'Pyaaz bees mein. Final offer.', next: 'sam2' },
      sam2: { speaker: 'sabziwali', text: 'Paise toh hain nahi. Shauk se mol-bhaav kar raha hai?', next: 'sam3' },
      sam3: { speaker: 'sam', text: 'Practice. Jab ameer ho jaaunga tab ke liye.', next: 'sam4' },
      sam4: { speaker: 'sabziwali', text: '…Izzat hai. Pachchees. Jab ameer ho jaaoge.', effects: [{ emote: 'sabziwali', kind: '♥' }] },
      bye: { speaker: 'sabziwali', text: 'Dekhne ke bhi chaalis rupaye. Mazaak. Zyaadatar.' },
    },
  },
  cow: {
    start: 'a',
    nodes: {
      a: { speaker: 'me', text: 'Gauri gaay. Traffic signal se zyaada saal se is chauraahe pe hai, aur usse behtar kaam karti hai.' },
    },
  },
  cow_goti: {
    start: 'a',
    nodes: {
      a: { speaker: 'goti', text: 'Gauri. Sach batana. Hum ameer banenge?', next: 'b' },
      b: { speaker: 'narrator', text: 'Gauri soch-samajh ke jugaali karti hai. Phir dheere se sar hilaati hai. Ya phir sar pe makkhi baith gayi.', effects: [{ sfx: 'moo' }], next: 'c' },
      c: { speaker: 'goti', text: 'Usne haan bola! Doston! Gaay ne haan bola!', effects: [{ secret: 'cow' }, { emote: 'gauri', kind: '♥' }] },
    },
  },
  dog: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Moti poonchh hilaata hai. Moti ki zindagi mein aaj tak ek bhi problem nahi aayi.', effects: [{ sfx: 'bark' }] },
    },
  },
  posters: {
    start: 'a',
    nodes: {
      a: {
        speaker: 'narrator',
        text: 'Das parat poster: “KHATARNAK KHILADI 3: Phir Se Badla”. “Ludhiana Waala Pyaar”. “Pinto Sir Tuition: Result Guaranteed*”.',
        next: 'b',
      },
      b: { speaker: 'me', text: 'Ek din hamare chehre bhi is deewaar pe honge.', next: 'c' },
      c: {
        speaker: 'narrator',
        text: 'Neeche, ek purana notice: “WANTED: chaar ladke, Dongre Mama ke aam churaane ke liye.” Tasveer mein tumhare chehre hain.',
        effects: [{ secret: 'poster' }],
      },
    },
  },
  drum: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Neele drum ke andar, plastic mein lipta: ek khat. “Priya Kamla, tumhari bhindi taazi hai, mere pyaar ki tarah. — L.”', next: 'b' },
      b: { speaker: 'me', text: 'Humne ye nahi dekha. Humne ye nahi dekha. Wapas rakh do.', effects: [{ secret: 'tank' }] },
    },
  },
  lane_sign: {
    start: 'a',
    nodes: {
      a: { speaker: 'narrator', text: 'Shanti Nagar, Gali No. 4, Pune. “Shanti” matlab sukoon. Saalon se kisi ne check nahi kiya.' },
    },
  },
};

function check(s: StateView) {
  return ['sam', 'pakya', 'goti', 'maru'].every((c) => s.flags[`impress.${c}`]) ? 'finale1' : 'more';
}

/* Part 2: new scripts, and extra branches on Part 1 characters */
Object.assign(DIALOGUES, DIALOGUES_2, DIALOGUES_3);
for (const ext of [...EXTENSIONS, ...EXTENSIONS_3]) {
  const base = DIALOGUES[ext.id];
  const old = base.start;
  Object.assign(base.nodes, ext.nodes);
  base.start = (s) => ext.start(s) ?? (typeof old === 'function' ? old(s) : old);
}
