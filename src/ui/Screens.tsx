import { useEffect, useRef, useState } from 'react';
import { useGame, startNewGame, continueGame } from '../game/store';
import { initAudio, setMuted, sfx, startRhythm, stopRhythm, dhol, startAmbience, stopAmbience } from '../game/audio';
import { onInput } from '../game/input';
import { INTRO, BROKE_BEATS, introClock, introTime } from '../intro/timeline';
import { FRIENDS } from '../game/data/characters';
import { SECRETS } from '../game/data/missions';
import { SCENES } from '../game/data/scenes';
import { MissionLog } from './Hud';
import { CHAR_IDS } from '../game/types';
import { NPCS } from '../game/data/npcs';
import { MISSION_MAP } from '../game/data/missions';
import { activateMission, toast } from '../game/store';

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
      <p className="boot-tag">Four idiots. One big mess.</p>
      <p className="boot-cta">
        <span className="pulse">Press any key or click to begin</span>
        <span className="boot-sub">Sound on, if your neighbours allow it</span>
      </p>
    </div>
  );
}

/* ───────────── opening captions over the 3D intro ───────────── */
export function IntroOverlay() {
  const [t, setT] = useState(0);
  const ended = useRef(false);
  useEffect(() => {
    startRhythm(104, 0.55);
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
          {t > 1.6 && <p className="intro-tag">FOUR IDIOTS. ONE BIG MESS.</p>}
        </div>
      )}
      {f && (
        <div className="intro-friend" key={f.id} style={{ ['--c' as string]: f.color }}>
          <div className="intro-friend-name">{f.name}</div>
          <div className="intro-friend-role">{f.role}</div>
          <div className="intro-friend-blurb">{f.blurb}</div>
        </div>
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
          <div className="intro-hood-name">Shanti Nagar, Lane 4</div>
          <div className="intro-hood-sub">Where every get-rich plan comes home to die.</div>
        </div>
      )}
      <div className="skip">
        <kbd>Esc</kbd> skip
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
    ...(hasSave ? [{ id: 'continue', label: 'Continue', sub: save ? SCENES[save.scene].name : '' }] : []),
    { id: 'new', label: hasSave ? 'Start over' : 'Start the story', sub: hasSave ? 'Your saved progress will be replaced' : '' },
    { id: 'intro', label: 'Watch the opening', sub: '' },
    { id: 'sound', label: muted ? 'Sound: off' : 'Sound: on', sub: '' },
  ];
  const [sel, setSel] = useState(0);
  const [confirmNew, setConfirmNew] = useState(false);
  const ref = useRef({ sel, items, confirmNew });
  ref.current = { sel, items, confirmNew };

  useEffect(() => {
    startRhythm(92, 0.32);
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
        if (a === 'up') setSel((sel - 1 + items.length) % items.length);
        else if (a === 'down') setSel((sel + 1) % items.length);
        else if (a === 'confirm' || a === 'interact') pick(items[sel].id);
        else if (a === 'pause') setConfirmNew(false);
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="title">
      <div className="title-head">
        <Logo />
        <p className="title-tag">Four idiots. One big mess.</p>
      </div>
      <nav className="menu" aria-label="Main menu">
        {items.map((it, i) => (
          <button key={it.id} className={`menu-item ${i === sel ? 'is-sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => pick(it.id)}>
            <span className="menu-label">{it.id === 'new' && confirmNew ? 'Press again to start over' : it.label}</span>
            {it.sub && <span className="menu-sub">{it.sub}</span>}
          </button>
        ))}
      </nav>
      <p className="title-foot">
        <kbd>↑</kbd>
        <kbd>↓</kbd> choose · <kbd>Enter</kbd> select · <kbd>M</kbd> mute
      </p>
    </div>
  );
}

/* ───────────── pause menu ───────────── */
export function PauseMenu() {
  const paused = useGame((s) => s.paused);
  const secrets = useGame((s) => s.secrets);
  const muted = useGame((s) => s.muted);
  const [tab, setTab] = useState<'missions' | 'controls' | 'secrets'>('missions');
  const [confirm, setConfirm] = useState(false);
  if (!paused) return null;
  return (
    <div className="pause" role="dialog" aria-label="Paused">
      <div className="pause-card">
        <div className="pause-head">
          <Logo size="md" />
          <button className="btn" onClick={() => set({ paused: false })}>
            Resume <kbd>Esc</kbd>
          </button>
        </div>
        <div className="tabs" role="tablist">
          {(['missions', 'controls', 'secrets'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'is-on' : ''}`} onClick={() => setTab(t)}>
              {t === 'missions' ? 'Missions' : t === 'controls' ? 'Controls' : `Secrets ${secrets.length}/${Object.keys(SECRETS).length}`}
            </button>
          ))}
        </div>
        <div className="pause-body">
          {tab === 'missions' && <MissionLog />}
          {tab === 'controls' && (
            <dl className="controls">
              <dt>
                <kbd>WASD</kbd> / arrows
              </dt>
              <dd>Walk. Hold Shift to run (Maru may trip).</dd>
              <dt>
                <kbd>1</kbd>–<kbd>4</kbd>, <kbd>Tab</kbd>
              </dt>
              <dd>Switch between Sam, Pakya, Goti and Maru. The others follow.</dd>
              <dt>
                <kbd>E</kbd>
              </dt>
              <dd>Talk, inspect, enter. Works on anything with a sign over it.</dd>
              <dt>
                <kbd>F</kbd>
              </dt>
              <dd>The active friend’s ability: on an object, or just to show off.</dd>
              <dt>
                <kbd>Space</kbd> / <kbd>Enter</kbd>
              </dt>
              <dd>Continue dialogue. Number keys pick a reply.</dd>
              <dt>
                <kbd>Q</kbd>
              </dt>
              <dd>Tell the nearest friend to wait here, or to come along again.</dd>
              <dt>
                <kbd>L</kbd>
              </dt>
              <dd>Pakya’s Lie Book: who was told what, and how suspicious they are.</dd>
              <dt>
                <kbd>M</kbd>
              </dt>
              <dd>Mute or unmute.</dd>
            </dl>
          )}
          {tab === 'secrets' && (
            <ul className="secrets">
              {Object.entries(SECRETS).map(([k, v]) => (
                <li key={k} className={secrets.includes(k) ? 'is-found' : ''}>
                  {secrets.includes(k) ? v : 'Not found yet'}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pause-foot">
          <button className="btn ghost" onClick={() => set({ paused: false, lieBook: true })}>
            Lie Book <kbd>L</kbd>
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              const m = !muted;
              set({ muted: m });
              setMuted(m);
            }}
          >
            {muted ? 'Sound: off' : 'Sound: on'}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              stopAmbience();
              set({ paused: false, mode: 'title' });
            }}
          >
            Save and quit to title
          </button>
          <button
            className="btn ghost danger"
            onClick={() => {
              if (!confirm) return setConfirm(true);
              setConfirm(false);
              startNewGame();
            }}
          >
            {confirm ? 'Click again to erase progress' : 'Restart from the beginning'}
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
    <div className="partend" role="dialog" aria-label={part2 ? 'End of part two' : 'Interval'}>
      <div className="partend-inner">
        <div className="partend-kicker">{part2 ? 'End of Part 2' : 'Interval'}</div>
        <Logo size="md" />
        {part2 ? (
          <>
            <p className="partend-line">{flags['end.fake'] ? 'Zikomo drove off with a drum full of nothing.' : 'Zikomo left empty-handed, and angrier.'} Tomorrow, he finds out.</p>
            <p className="partend-stats">
              Ritu’s trust {Math.round(stats['ritu.trust'] ?? 0)} · Gang harmony {Math.round(stats['gang.harmony'] ?? 0)} · {lies.contradictions.length} lies caught
              {worst && worst[1] > 0 ? ` · Most suspicious: ${NPCS[worst[0]]?.name ?? worst[0]}` : ''}
            </p>
            <p className="partend-next">
              {flags['end.tiwari'] ? 'The real dhol is sitting next to Tiwari-ji’s chair, held hostage for rent. ' : 'The real dhol is safe under Maru’s charpai. Maru has not slept. '}
              The story continues in Part 3.
            </p>
          </>
        ) : (
          <>
            <p className="partend-line">Four friends. One neighbour. Each of them sure she liked him.</p>
            <p className="partend-stats">
              ₹{money} saved of ₹6,000 · {secrets.length} of {Object.keys(SECRETS).length} secrets found
            </p>
            <p className="partend-next">Samosa break. After this: the four of them start competing for Ritu, and everything gets worse.</p>
          </>
        )}
        <button className="btn" onClick={closePartEnd}>
          {part2 ? 'Keep exploring' : 'Start Part 2'} <kbd>Enter</kbd>
        </button>
      </div>
    </div>
  );
}

/** Closing the interval card starts Part 2. */
function closePartEnd() {
  const s = useGame.getState();
  set({ partEnded: false });
  if (s.mstate['pending.rich']) {
    set({ mstate: { ...s.mstate, 'pending.rich': false } });
    activateMission('rich');
    toast(MISSION_MAP.rich.title, 'mission', 'Part 2');
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
