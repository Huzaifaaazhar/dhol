import { useEffect, useRef, useState } from 'react';
import { useGame, startNewGame } from '../game/store';
import { ENDING_TITLES, epilogueLines, type EndingId } from '../game/endings';
import { FRIENDS } from '../game/data/characters';
import { CHAR_IDS, type CharId } from '../game/types';
import { onInput } from '../game/input';
import { playOneShot, ent } from '../game/runtime';
import { startMelody, startRhythm, stopRhythm, sfx } from '../game/audio';
import { onChase, startChase } from '../game/chase';
import { Logo } from './Screens';

const set = useGame.setState;

/** An original song for the end credits; the four dance to it in the street. */
const LYRICS = [
  '♪ Dhol baja, dhol baja, chaar yaaron ka shor baja ♪',
  '♪ Karza bhi hai, jhooth bhi hai, phir bhi dil ka zor baja ♪',
  '♪ Gali gali mein dhoom machi, Zikomo ka band baja ♪',
  '♪ Picture abhi baaki hai, mere dost, dhol baja ♪',
];

function closeCard() {
  set({ endingShown: false });
  startChase();
}

export function EndingCard() {
  const shown = useGame((s) => s.endingShown);
  const mstate = useGame((s) => s.mstate);
  const stats = useGame((s) => s.stats);
  const items = useGame((s) => s.items);
  const lies = useGame((s) => s.lies);
  const secrets = useGame((s) => s.secrets);
  const [credits, setCredits] = useState(false);
  const [lyric, setLyric] = useState(0);
  const opened = useRef(0);

  // the song, the lyrics and the dance
  useEffect(() => {
    if (!shown) {
      opened.current = 0;
      return;
    }
    opened.current = performance.now();
    stopRhythm();
    const id = mstate.ending as EndingId;
    if (id === 'collapse') {
      sfx('fail');
      startRhythm(96, 0.4);
      startMelody(96, 0.06);
    } else {
      startRhythm(132, 0.6);
      startMelody(132, 0.1);
    }
    const lyr = window.setInterval(() => setLyric((n) => n + 1), 3600);
    const dance = window.setInterval(() => {
      const st = useGame.getState();
      CHAR_IDS.forEach((c, i) => {
        if (st.where[c] !== st.scene) return;
        if (ent(c).oneShot <= 0) window.setTimeout(() => playOneShot(c, i % 2 ? 'celebrate' : 'signature', 1.3), i * 180);
      });
    }, 1400);
    return () => {
      window.clearInterval(lyr);
      window.clearInterval(dance);
    };
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () =>
      onInput((a) => {
        // ignore the key press that ended the last line (the card has not recorded its opening yet)
        if (!useGame.getState().endingShown || opened.current === 0 || performance.now() - opened.current < 1500) return;
        if (a === 'confirm') closeCard();
      }),
    [],
  );

  if (!shown) return null;
  const id = (mstate.ending as EndingId) ?? 'triumph';
  const culprit = (mstate.culprit as CharId) || undefined;
  const t = ENDING_TITLES[id];
  const scores = { sam: stats['score.sam'] ?? 0, pakya: stats['score.pakya'] ?? 0, goti: stats['score.goti'] ?? 0, maru: stats['score.maru'] ?? 0 };
  const lines = epilogueLines({
    ending: { id, culprit, cause: (mstate.endingCause as string) ?? '' },
    hasTicket: items.includes('ticket'),
    rituTrust: stats['ritu.trust'] ?? 0,
    harmony: stats['gang.harmony'] ?? 0,
    scores,
    liesCaught: lies.contradictions.length,
    secrets,
  });

  return (
    <div className={`ending ending-${id}`} role="dialog" aria-label={`Ant: ${t.title}`} style={culprit ? { ['--c' as string]: FRIENDS[culprit].color } : undefined}>
      {id === 'fortune' && (
        <div className="rain" aria-hidden>
          {[...Array(24)].map((_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.45}s`, animationDuration: `${3 + (i % 5) * 0.6}s` }}>
              ₹
            </span>
          ))}
        </div>
      )}
      <div className="lyric" key={lyric} aria-live="off">
        {LYRICS[lyric % LYRICS.length]}
      </div>
      <div className="ending-card">
        {!credits ? (
          <>
            <div className="ending-kicker">{t.kicker}</div>
            <h2 className="ending-title">{t.title}</h2>
            {culprit && (
              <div className="ending-culprit">
                <span className="ending-badge">{FRIENDS[culprit].name[0]}</span> Saara dosh {FRIENDS[culprit].name} ka.
              </div>
            )}
            <ul className="ending-lines">
              {lines.map((l, i) => (
                <li key={i} style={{ animationDelay: `${0.4 + i * 0.25}s` }}>
                  {l}
                </li>
              ))}
            </ul>
            <p className="ending-stats">
              Ritu ka bharosa {Math.round(stats['ritu.trust'] ?? 0)} · Yaari {Math.round(stats['gang.harmony'] ?? 0)} · {lies.contradictions.length} jhooth pakde gaye · {secrets.length} raaz
            </p>
            <div className="ending-actions">
              <button className="btn" onClick={closeCard}>
                Aakhri scene dekho <kbd>Enter</kbd>
              </button>
              <button className="btn ghost" onClick={() => setCredits(true)}>
                Banaane waale
              </button>
              <button className="btn ghost" onClick={() => startNewGame()}>
                Shuru se phir khelo
              </button>
            </div>
          </>
        ) : (
          <div className="credits">
            <Logo size="md" />
            <p>Chaar yaar. Ek dhol. Bada lafda.</p>
            <p>2007 ki ek pyaari Bollywood comedy se prerit ek original khel. Har kirdaar, har dialogue, har imaarat, har poster aur har awaaz shuru se, code mein banaayi gayi hai.</p>
            <p>React, TypeScript, three.js aur React Three Fiber se bana. Font: Yatra One aur Baloo 2 (SIL Open Font License). Sangeet aur awaazein aapke browser mein hi bajti hain.</p>
            <p>Chaar ant hain. Kaunsa milega, ye aapke kaamon pe hai: kitne jhooth bole, kis pe bharosa kiya, aur kitna shor machaaya.</p>
            <button className="btn" onClick={() => setCredits(false)}>
              Wapas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Letterbox and the last title while the four run after Ritu's car. */
export function ChaseCaption() {
  const [on, setOn] = useState(false);
  useEffect(() => onChase(setOn), []);
  if (!on) return null;
  return (
    <div className="chase" aria-hidden>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <div className="chase-title">
        <Logo size="md" />
        <p>Picture abhi baaki hai…</p>
      </div>
    </div>
  );
}
