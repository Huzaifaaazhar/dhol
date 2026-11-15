import { useEffect, useRef, useState } from 'react';
import { useGame, startNewGame } from '../game/store';
import { ENDING_TITLES, epilogueLines, type EndingId } from '../game/endings';
import { FRIENDS } from '../game/data/characters';
import type { CharId } from '../game/types';
import { onInput } from '../game/input';
import { dhol, sfx, stopRhythm } from '../game/audio';
import { Logo } from './Screens';

const set = useGame.setState;

export function EndingCard() {
  const shown = useGame((s) => s.endingShown);
  const mstate = useGame((s) => s.mstate);
  const stats = useGame((s) => s.stats);
  const items = useGame((s) => s.items);
  const lies = useGame((s) => s.lies);
  const secrets = useGame((s) => s.secrets);
  const [credits, setCredits] = useState(false);
  const opened = useRef(0);

  useEffect(() => {
    if (!shown) {
      opened.current = 0;
      return;
    }
    opened.current = performance.now();
    stopRhythm();
    const id = mstate.ending as EndingId;
    if (id === 'collapse') sfx('fail');
    else {
      dhol('both', 0, 1);
      dhol('both', 0.25, 1);
      dhol('bass', 0.5, 1);
      dhol('both', 0.75, 1);
    }
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () =>
      onInput((a) => {
        // ignore the key press that ended the last line (the card has not recorded its opening yet)
        if (!useGame.getState().endingShown || opened.current === 0 || performance.now() - opened.current < 1500) return;
        if (a === 'confirm') set({ endingShown: false });
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
    <div className={`ending ending-${id}`} role="dialog" aria-label={`Ending: ${t.title}`} style={culprit ? { ['--c' as string]: FRIENDS[culprit].color } : undefined}>
      {id === 'fortune' && (
        <div className="rain" aria-hidden>
          {[...Array(24)].map((_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.45}s`, animationDuration: `${3 + (i % 5) * 0.6}s` }}>
              ₹
            </span>
          ))}
        </div>
      )}
      <div className="ending-card">
        {!credits ? (
          <>
            <div className="ending-kicker">{t.kicker}</div>
            <h2 className="ending-title">{t.title}</h2>
            {culprit && (
              <div className="ending-culprit">
                <span className="ending-badge">{FRIENDS[culprit].name[0]}</span> Blame {FRIENDS[culprit].name}.
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
              Ritu’s trust {Math.round(stats['ritu.trust'] ?? 0)} · Gang harmony {Math.round(stats['gang.harmony'] ?? 0)} · {lies.contradictions.length} lies caught · {secrets.length} secrets
            </p>
            <div className="ending-actions">
              <button className="btn" onClick={() => set({ endingShown: false })}>
                Keep exploring <kbd>Enter</kbd>
              </button>
              <button className="btn ghost" onClick={() => setCredits(true)}>
                Credits
              </button>
              <button className="btn ghost" onClick={() => startNewGame()}>
                Play again from the start
              </button>
            </div>
          </>
        ) : (
          <div className="credits">
            <Logo size="md" />
            <p>Four idiots. One big mess. One drum.</p>
            <p>An original game inspired by the spirit of a much-loved 2007 Bollywood comedy. Every character model, line of dialogue, building, poster and sound in it was made from scratch, in code.</p>
            <p>Built with React, TypeScript, three.js and React Three Fiber. Fonts: Yatra One and Baloo 2 (SIL Open Font License). Music and sound effects are synthesised live in your browser.</p>
            <p>There are four endings. Each one is decided by what you did: the lies you told, who you trusted, and how much noise you made.</p>
            <button className="btn" onClick={() => setCredits(false)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
