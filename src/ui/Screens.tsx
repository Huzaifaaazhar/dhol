import { useEffect, useRef, useState } from 'react';
import { useGame, startNewGame, continueGame } from '../game/store';
import { initAudio, setMuted, sfx, startRhythm, startMelody, stopRhythm, dhol, startAmbience, stopAmbience } from '../game/audio';
import { onInput } from '../game/input';
import { INTRO, BROKE_BEATS, introClock, introTime } from '../intro/timeline';
import { FRIENDS } from '../game/data/characters';
import { SECRETS } from '../game/data/missions';
import { SCENES } from '../game/data/scenes';
import { MissionLog } from './Hud';
import { SlotList } from './Saves';
import { listSlots } from '../game/saves';
import { CHAR_IDS } from '../game/types';
import { NPCS } from '../game/data/npcs';
import { MISSION_MAP } from '../game/data/missions';
import { activateMission, toast, retryMission, activeMission } from '../game/store';

const set = useGame.setState;

/** The DHOL logotype: stacked, offset, hand-painted-poster lettering that beats with the drum. */
export function Logo({ beat = false, size = 'xl' }: { beat?: boolean; size?: 'xl' | 'md' }) {
  return (
    <h1 className={`logo logo-${size} ${beat ? 'is-beat' : ''}`} aria-label="Dhol">
      {'DHOL'.split('').map((ch, i) => (
        <span key={i} className="logo-ch" style={{ ['--i' as string]: i }} data-ch={ch}>
          {ch}
        </span>
      ))}
    </h1>
  );
}

/* ───────────── boot: needs a gesture to start audio ───────────── */
export function Boot() {
  useEffect(() => {
    const go = () => {
      initAudio();
      setMuted(useGame.getState().muted);
      const seen = useGame.getState().introSeen;
      if (seen) {
        set({ mode: 'title' });
      } else {
        introClock.start = performance.now();
        set({ mode: 'intro' });
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Tab') return;
      go();
    };
    window.addEventListener('keydown', key, { once: true });
    window.addEventListener('pointerdown', go, { once: true });
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', go);
    };
  }, []);
  return (
    <div className="boot">
      <Logo />
      <p className="boot-tag">Chaar yaar. Ek dhol. Bada lafda.</p>
      <p className="boot-cta">
        <span className="pulse">{navigator.maxTouchPoints > 0 ? 'Shuru karne ke liye kahin bhi tap karo' : 'Shuru karne ke liye koi bhi button dabao ya click karo'}</span>
        <span className="boot-sub">Awaaz chalu rakho, agar padosi ijaazat dein</span>
      </p>
    </div>
  );
}

/* ───────────── opening captions over the 3D intro ───────────── */
/** Bollywood freeze-frame name card: a flash, a drum hit, a full name and a filmi line. */
function FreezeCard({ id, color, fullName, tagline, role, first }: { id: string; color: string; fullName: string; tagline: string; role: string; first: boolean }) {
  useEffect(() => {
    dhol('both', 0, 1);
    dhol('bass', 0.12, 0.9);
  }, [id]);
  return (
    <div className="intro-friend freeze" style={{ ['--c' as string]: color }}>
      <div className="freeze-flash" />
      <div className="freeze-band" />
      <div className="intro-friend-kicker">{first ? 'Pesh hai' : 'Aur'}</div>
      <div className="intro-friend-name">{fullName}</div>
      <div className="intro-friend-blurb">{tagline}</div>
      <div className="intro-friend-role">{role}</div>
    </div>
  );
}

export function IntroOverlay() {
  const [t, setT] = useState(0);
  const ended = useRef(false);
  useEffect(() => {
    startRhythm(104, 0.55);
    startMelody(104, 0.08);
    let raf = 0;
    const loop = () => {
      const now = introTime();
      setT(now);
      if (now > INTRO.hoodEnd && !ended.current) finish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const off = onInput((a) => {
      if (a === 'pause' || a === 'confirm') finish();
    });
    return () => {
      cancelAnimationFrame(raf);
      off();
    };
  }, []);
  function finish() {
    if (ended.current) return;
    ended.current = true;
    set({ introSeen: true, mode: 'title' });
  }

  const friendIdx = Math.floor((t - INTRO.titleEnd) / INTRO.friendDur);
  const inFriends = t >= INTRO.titleEnd && t < INTRO.friendsEnd;
  const f = inFriends ? FRIENDS[INTRO.order[friendIdx]] : null;
  const brokeT = t - INTRO.friendsEnd;
  const hoodT = t - INTRO.brokeEnd;

  return (
    <div className="intro">
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      {t < INTRO.titleEnd && (
        <div className="intro-title">
          <Logo beat />
          {t > 1.6 && (
            <p className="intro-tag">
              CHAAR YAAR. EK DHOL. BADA LAFDA.                          </p>
          )}
        </div>
      )}
      {f && (
        <FreezeCard key={f.id} id={f.id} color={f.color} fullName={f.fullName} tagline={f.tagline} role={f.role} first={friendIdx === 0} />
      )}
      {brokeT >= 0 && t < INTRO.brokeEnd && (
        <div className="intro-beats">
          {BROKE_BEATS.filter((b) => brokeT > b.at).map((b) => (
            <span key={b.text} className="intro-beat">
              {b.text}
            </span>
          ))}
        </div>
      )}
      {hoodT >= 0.4 && (
        <div className="intro-hood">
          <div className="intro-hood-name">Shanti Nagar, Gali No. 4, Pune</div>
          <div className="intro-hood-sub">Jahaan har ameer banne ka plan ghar aake dum todta hai.</div>
        </div>
      )}
      <div className="skip">
        <kbd>Esc</kbd> aage badho
      </div>
    </div>
  );
}

/* ───────────── title screen ───────────── */
export function TitleScreen() {
  const hasSave = useGame((s) => s.hasSave);
  const muted = useGame((s) => s.muted);
  const save = useGame((s) => s.savedPos);
  const items = [
    ...(hasSave ? [{ id: 'continue', label: 'Jaari rakho', sub: save ? SCENES[save.scene].name : '' }] : []),
    { id: 'new', label: hasSave ? 'Naye sire se' : 'Kahaani shuru karo', sub: hasSave ? 'Sambhaala hua khel mit jaayega' : '' },
    ...(listSlots().some((x) => x.slot) ? [{ id: 'load', label: 'Sambhaala hua khel kholo', sub: '' }] : []),
    { id: 'intro', label: 'Shuruaat phir dekho', sub: '' },
    { id: 'sound', label: muted ? 'Awaaz: band' : 'Awaaz: chalu', sub: '' },
  ];
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const [confirmNew, setConfirmNew] = useState(false);
  const ref = useRef({ sel, items, confirmNew, loading });
  ref.current = { sel, items, confirmNew, loading };

  useEffect(() => {
    startRhythm(92, 0.32);
    startMelody(92, 0.07);
    return () => stopRhythm();
  }, []);

  const pick = (id: string) => {
    sfx('select');
    if (id === 'continue') {
      stopRhythm();
      continueGame();
    } else if (id === 'new') {
      if (useGame.getState().hasSave && !ref.current.confirmNew) {
        setConfirmNew(true);
        return;
      }
      stopRhythm();
      startNewGame();
    } else if (id === 'load') {
      setLoading(true);
    } else if (id === 'intro') {
      introClock.start = performance.now();
      set({ mode: 'intro' });
    } else if (id === 'sound') {
      const m = !useGame.getState().muted;
      set({ muted: m });
      setMuted(m);
    }
  };

  useEffect(
    () =>
      onInput((a) => {
        const { sel, items } = ref.current;
        if (ref.current.loading) {
          if (a === 'pause') setLoading(false);
          return;
        }
        if (a === 'up') setSel((sel - 1 + items.length) % items.length);
        else if (a === 'down') setSel((sel + 1) % items.length);
        else if (a === 'confirm' || a === 'interact') pick(items[sel].id);
        else if (a === 'pause') {
          setConfirmNew(false);
          setLoading(false);
        }
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="title">
      <div className="title-head">
        <Logo />
        <p className="title-tag">Chaar yaar. Ek dhol. Bada lafda.</p>
      </div>
      {loading ? (
        <div className="title-load">
          <SlotList canSave={false} />
          <button className="btn ghost" onClick={() => setLoading(false)}>
            Back <kbd>Esc</kbd>
          </button>
        </div>
      ) : (
      <nav className="menu" aria-label="Mukhya suchi">
        {items.map((it, i) => (
          <button key={it.id} className={`menu-item ${i === sel ? 'is-sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => pick(it.id)}>
            <span className="menu-label">{it.id === 'new' && confirmNew ? 'Naye sire se shuru karne ke liye phir dabao' : it.label}</span>
            {it.sub && <span className="menu-sub">{it.sub}</span>}
          </button>
        ))}
      </nav>
      )}
      <p className="title-foot">
        <kbd>↑</kbd>
        <kbd>↓</kbd> chuno · <kbd>Enter</kbd> pakka · <kbd>M</kbd> awaaz
      </p>
    </div>
  );
}

/* ───────────── pause menu ───────────── */
export function PauseMenu() {
  const paused = useGame((s) => s.paused);
  const secrets = useGame((s) => s.secrets);
  const muted = useGame((s) => s.muted);
  const [tab, setTab] = useState<'missions' | 'saves' | 'controls' | 'secrets'>('missions');
  const [confirmRetry, setConfirmRetry] = useState(false);
  const hasCheckpoint = useGame((s) => !!s.checkpoint);
  const [confirm, setConfirm] = useState(false);
  if (!paused) return null;
  return (
    <div className="pause" role="dialog" aria-label="Ruka hua">
      <div className="pause-card">
        <div className="pause-head">
          <Logo size="md" />
          <button className="btn" onClick={() => set({ paused: false })}>
            Wapas khelo <kbd>Esc</kbd>
          </button>
        </div>
        <div className="tabs" role="tablist">
          {(['missions', 'saves', 'controls', 'secrets'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'is-on' : ''}`} onClick={() => setTab(t)}>
              {t === 'missions' ? 'Muhimein' : t === 'saves' ? 'Sambhaalo / Kholo' : t === 'controls' ? 'Kaise khelein' : `Raaz ${secrets.length}/${Object.keys(SECRETS).length}`}
            </button>
          ))}
        </div>
        <div className="pause-body">
          {tab === 'missions' && <MissionLog />}
          {tab === 'saves' && (
            <>
              <p className="saves-note">Khel apne aap bhi sambhalta rehta hai. Ghadi waali muhimein kholne pe shuru se chalti hain.</p>
              <SlotList canSave />
            </>
          )}
          {tab === 'controls' && (
            <dl className="controls">
              <dt>
                <kbd>WASD</kbd> / teer
              </dt>
              <dd>Chalo. Daudne ke liye Shift dabaaye rakho (Maru gir sakta hai).</dd>
              <dt>
                <kbd>1</kbd>–<kbd>4</kbd>, <kbd>Tab</kbd>
              </dt>
              <dd>Sam, Pakya, Goti aur Maru mein badlo. Baaki peeche aate hain.</dd>
              <dt>
                <kbd>E</kbd>
              </dt>
              <dd>Baat karo, dekho, andar jao. Jis cheez ke upar nishaan ho, us pe chalta hai.</dd>
              <dt>
                <kbd>F</kbd>
              </dt>
              <dd>Chaalu dost ki khoobi: kisi cheez pe, ya bas dikhaane ke liye.</dd>
              <dt>
                <kbd>Space</kbd> / <kbd>Enter</kbd>
              </dt>
              <dd>Baatcheet aage badhaao. Number dabaake jawaab chuno.</dd>
              <dt>
                <kbd>Q</kbd>
              </dt>
              <dd>Paas wale dost ko yahin rukne, ya phir saath chalne ko bolo.</dd>
              <dt>
                <kbd>L</kbd>
              </dt>
              <dd>Pakya ki Jhooth ki Diary: kisko kya bola, aur kise kitna shak hai.</dd>
              <dt>
                <kbd>M</kbd>
              </dt>
              <dd>Awaaz band ya chalu.</dd>
              <dt>Mobile pe</dt>
              <dd>Baayein pad se chalo (zor se dabao toh daudo). E aur F button batate hain kya karenge. Dost badalne ke liye uske gole pe tap karo. Baatcheet aage badhaane ke liye us pe tap karo.</dd>
            </dl>
          )}
          {tab === 'secrets' && (
            <ul className="secrets">
              {Object.entries(SECRETS).map(([k, v]) => (
                <li key={k} className={secrets.includes(k) ? 'is-found' : ''}>
                  {secrets.includes(k) ? v : 'Abhi tak nahi mila'}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pause-foot">
          <button className="btn ghost" onClick={() => set({ paused: false, lieBook: true })}>
            Jhooth ki Diary <kbd>L</kbd>
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              const m = !muted;
              set({ muted: m });
              setMuted(m);
            }}
          >
            {muted ? 'Awaaz: band' : 'Awaaz: chalu'}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              stopAmbience();
              set({ paused: false, mode: 'title' });
            }}
          >
            Sambhaalo aur shuru ke screen pe jao
          </button>
          {hasCheckpoint && activeMission() && (
            <button
              className="btn ghost"
              onClick={() => {
                if (!confirmRetry) return setConfirmRetry(true);
                setConfirmRetry(false);
                set({ paused: false });
                retryMission();
              }}
            >
              {confirmRetry ? 'Muhim shuru se karne ke liye phir dabao' : 'Ye muhim shuru se karo'}
            </button>
          )}
          <button
            className="btn ghost danger"
            onClick={() => {
              if (!confirm) return setConfirm(true);
              setConfirm(false);
              startNewGame();
            }}
          >
            {confirm ? 'Sab mitaane ke liye phir dabao' : 'Bilkul shuru se khelo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── end of part 1 ───────────── */
export function PartEnd() {
  const ended = useGame((s) => s.partEnded);
  const secrets = useGame((s) => s.secrets);
  const money = useGame((s) => s.money);
  const stats = useGame((s) => s.stats);
  const lies = useGame((s) => s.lies);
  const flags = useGame((s) => s.flags);
  const openedAt = useRef(0);
  useEffect(() => {
    if (!ended) {
      openedAt.current = 0;
      return;
    }
    openedAt.current = performance.now();
    dhol('both', 0, 1);
    dhol('both', 0.3, 1);
    dhol('bass', 0.6, 1);
  }, [ended]);
  useEffect(
    () =>
      onInput((a) => {
        const opened = openedAt.current;
        if (useGame.getState().partEnded && opened > 0 && performance.now() - opened > 1200 && (a === 'confirm' || a === 'pause')) closePartEnd();
      }),
    [],
  );
  if (!ended) return null;
  const part2 = ended === 'part2';
  const worst = Object.entries(lies.suspicion).sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="partend" role="dialog" aria-label={part2 ? 'Doosra hissa khatam' : 'Interval'}>
      <div className="partend-inner">
        <div className="partend-kicker">{part2 ? 'Picture Abhi Baaki Hai' : 'INTERVAL'}</div>
        <Logo size="md" />
        {part2 ? (
          <>
            <p className="partend-line">{flags['end.fake'] ? 'Zikomo khaali dhol leke chala gaya.' : 'Zikomo khaali haath gaya, aur gusse mein.'} Aur Ritu ko sach pata chal gaya: Jai nahi, Pakya.</p>
            <p className="partend-stats">
              Ritu ka bharosa {Math.round(stats['ritu.trust'] ?? 0)} · Yaari {Math.round(stats['gang.harmony'] ?? 0)} · {lies.contradictions.length} jhooth pakde gaye
              {worst && worst[1] > 0 ? ` · Sabse zyaada shak: ${NPCS[worst[0]]?.name ?? worst[0]}` : ''}
            </p>
            <p className="partend-next">
              {flags['end.tiwari'] ? 'Asli dhol Dongre Mama ki kursi ke paas pada hai, karze ke badle bandhak. ' : 'Asli dhol Maru ki charpai ke neeche mehfooz hai. Maru soya nahi hai. '}
              Kal pata chalega ki us dhol mein asal mein kya tha.
            </p>
          </>
        ) : (
          <>
            <p className="partend-line">Chaar dost. Ek padosan. Har ek ko yakeen ki woh usi ko pasand karti hai.</p>
            <p className="partend-stats">
              ₹{money} jama / ₹6,000 · {secrets.length} / {Object.keys(SECRETS).length} raaz mile
            </p>
            <p className="partend-next">Samosa break. Iske baad: chaaron Ritu ke liye aapas mein ladenge, aur sab kuch aur bigdega.</p>
          </>
        )}
        <button className="btn" onClick={closePartEnd}>
          {part2 ? 'Teesra hissa shuru karo' : 'Doosra hissa shuru karo'} <kbd>Enter</kbd>
        </button>
      </div>
    </div>
  );
}

/** Closing the interval card starts Part 2. */
function closePartEnd() {
  const s = useGame.getState();
  set({ partEnded: false });
  // the interval always leads into Part 2, even if Part 1 ended with something left undone
  // the end of Part 2 leads straight into Part 3
  if (s.partEnded === 'part2' && s.missions.reveal?.status === 'locked') {
    activateMission('reveal');
    toast(MISSION_MAP.reveal.title, 'mission', 'Teesra hissa');
    return;
  }
  const part2Started = ['rich', 'jai', 'zikomo', 'dhol', 'chaos'].some((m) => s.missions[m]?.status !== 'locked');
  if (s.partEnded === 'part1' && (s.mstate['pending.rich'] || !part2Started)) {
    if (s.missions.ritu?.status === 'active') set({ missions: { ...s.missions, ritu: { status: 'done', done: s.missions.ritu.done } } });
    set({ mstate: { ...s.mstate, 'pending.rich': false } });
    activateMission('rich');
    toast(MISSION_MAP.rich.title, 'mission', 'Doosra hissa');
  }
}

/* ───────────── scene transitions ───────────── */
export function Fader() {
  const transition = useGame((s) => s.transition);
  const mode = useGame((s) => s.mode);
  const scene = useGame((s) => s.scene);

  useEffect(() => {
    if (!transition) return;
    if (transition.phase === 'out') {
      const t = window.setTimeout(() => {
        const sc = SCENES[transition.to];
        const sp = transition.at ?? sc.spawns[transition.spawn] ?? Object.values(sc.spawns)[0];
        const st = useGame.getState();
        // the leader and anyone following him walk through together; friends left waiting stay put
        const where = { ...st.where, [st.active]: transition.to };
        for (const c of CHAR_IDS) if (c !== st.active && !st.posted[c] && st.where[c] === st.scene) where[c] = transition.to;
        set({
          where,
          friendPos: { ...st.friendPos, [st.active]: sp },
          scene: transition.to,
          entry: sp,
          savedPos: { scene: transition.to, x: sp.x, z: sp.z, face: sp.face },
          transition: { ...transition, phase: 'in' },
          sceneCard: performance.now(),
          focus: null,
        });
      }, 380);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => set({ transition: null }), 420);
    return () => window.clearTimeout(t);
  }, [transition]);

  // ambient bed follows the scene
  useEffect(() => {
    if (mode !== 'play') return;
    startAmbience(SCENES[scene].interior);
    return () => stopAmbience();
  }, [mode, scene]);

  return <div className={`fader ${transition?.phase === 'out' ? 'is-on' : ''}`} aria-hidden />;
}
