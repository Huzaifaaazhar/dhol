import { useEffect, useRef, useState } from 'react';
import { useGame, retryMission, activeMission } from '../game/store';
import { FRIENDS } from '../game/data/characters';
import { NPCS } from '../game/data/npcs';
import { SCENES } from '../game/data/scenes';
import { CHAR_IDS, type CharId } from '../game/types';
import { TOPICS, checkLine } from '../game/lies';
import { switchFriend } from '../game/party';
import { answerQuestion } from '../game/sim/tasks';
import { agents } from '../game/sim/agents';
import { ent } from '../game/runtime';
import { onInput } from '../game/input';
import { ASKER } from '../game/data/questions';
import { stopAmbience, sfx } from '../game/audio';

const set = useGame.setState;
const npcName = (id: string) => NPCS[id]?.name ?? id;

function Eyes({ value }: { value: number }) {
  const n = Math.round(value / 20);
  return (
    <span className="eyes" aria-label={`Suspicion ${Math.round(value)} of 100`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}

/* ───────────── Pakya’s Lie Book (L) ───────────── */
export function LieBook() {
  const open = useGame((s) => s.lieBook);
  const lies = useGame((s) => s.lies);
  if (!open) return null;
  const npcs = [...new Set([...Object.keys(lies.beliefs), ...Object.keys(lies.suspicion).filter((k) => lies.suspicion[k] > 1)])].filter((n) => n !== 'jai' || lies.beliefs.jai);
  const jai = lies.stories.jai ?? {};
  return (
    <div className="book-wrap" role="dialog" aria-label="Pakya’s Lie Book" onClick={() => set({ lieBook: false })}>
      <div className="book" onClick={(e) => e.stopPropagation()}>
        <section className="page">
          <h2>Who believes what</h2>
          <p className="page-sub">Pakya’s private record. Do not lose. Do not let Sam read.</p>
          {npcs.length === 0 && <p className="page-empty">Nobody has been lied to yet. Suspicious in itself.</p>}
          {npcs.map((n) => (
            <div key={n} className="entry">
              <div className="entry-head">
                <b>{npcName(n)}</b>
                <Eyes value={lies.suspicion[n] ?? 0} />
              </div>
              {Object.entries(lies.beliefs[n] ?? {}).map(([topic, b]) => (
                <div key={topic} className="entry-line">
                  <span className="entry-topic">{TOPICS[topic] ?? topic}:</span> “{b.value}”
                  <span className="entry-by" style={{ ['--c' as string]: FRIENDS[b.by].color }}>
                    {b.via ? `via ${npcName(b.via)}` : FRIENDS[b.by].name}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
        <section className="page">
          <h2>Caught out</h2>
          {lies.contradictions.length === 0 && <p className="page-empty">No contradictions. Yet.</p>}
          {[...lies.contradictions].reverse().slice(0, 8).map((c, i) => (
            <div key={i} className="caught">
              <span className="stamp">Caught</span>
              <b>{npcName(c.npc)}</b> believed “{c.believed}” ({FRIENDS[c.earlierBy].name}), then heard “{c.heard}” {c.via ? `from ${npcName(c.via)}` : `from ${FRIENDS[c.by].name}`}.
            </div>
          ))}
          {Object.keys(jai).length > 0 && (
            <>
              <h2>What Jai told people</h2>
              {Object.entries(jai).map(([teller, v]) => (
                <div key={teller} className="entry-line">
                  <b>{npcName(teller)}:</b> “{v}”
                </div>
              ))}
            </>
          )}
          <p className="page-foot">
            <kbd>L</kbd> or <kbd>Esc</kbd> to close
          </p>
        </section>
      </div>
    </div>
  );
}

/* ───────────── where everyone is, and what they’re doing ───────────── */
export function Situations() {
  const where = useGame((s) => s.where);
  const tasks = useGame((s) => s.tasks);
  const posted = useGame((s) => s.posted);
  const hidden = useGame((s) => s.hidden);
  const active = useGame((s) => s.active);
  const dhol = useGame((s) => s.dhol);
  const panic = useGame((s) => s.panic);
  const m = activeMission();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 400);
    return () => window.clearInterval(t);
  }, []);
  const split = CHAR_IDS.some((c) => posted[c] || where[c] !== where[active]) || tasks.length > 0;
  if (!split && !m?.live) return null;
  return (
    <div className="situations" aria-label="The gang">
      {CHAR_IDS.map((c, i) => {
        const t = tasks.find((x) => x.who === c);
        const danger = [...agents.values()].some((a) => a.hostile && a.scene === where[c] && Math.hypot(ent(a.id).x - ent(c).x, ent(a.id).z - ent(c).z) < 7);
        const status = c === active ? 'You' : t ? t.label : hidden[c] ? 'Hiding' : posted[c] ? 'Waiting' : 'With you';
        return (
          <button
            key={c}
            className={`sit ${c === active ? 'is-active' : ''} ${danger ? 'is-danger' : ''}`}
            style={{ ['--c' as string]: FRIENDS[c].color }}
            onClick={() => {
              switchFriend(c);
              sfx('switch');
            }}
          >
            <span className="sit-key">{i + 1}</span>
            <span className="sit-name">{FRIENDS[c].name}</span>
            <span className="sit-where">{SCENES[where[c]].name}</span>
            <span className="sit-what">
              {status}
              {dhol === `carried:${c}` ? ' · carrying the dhol' : ''}
            </span>
            {t?.duration ? (
              <span className="sit-bar">
                <span style={{ width: `${Math.min(100, (t.elapsed / t.duration) * 100)}%` }} />
              </span>
            ) : null}
            {c === 'maru' && panic > 5 && (
              <span className="sit-panic" title="Maru’s panic">
                <span style={{ width: `${panic}%` }} />
              </span>
            )}
            {danger && <span className="sit-alert">!</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── the sunset clock ───────────── */
export function MissionTimer() {
  const end = useGame((s) => (s.missions.chaos?.status === 'active' ? (s.mstate.timerEnd as number) : 0));
  const now = useGame((s) => s.worldTime);
  if (!end) return null;
  const left = Math.max(0, Math.ceil(end - now));
  const urgent = left < 30;
  return (
    <div className={`timer ${urgent ? 'is-urgent' : ''}`} role="timer" aria-label="Time until Zikomo arrives">
      <span className="timer-label">Sunset in</span>
      <span className="timer-time">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

/* ───────────── a question for Pakya ───────────── */
export function QuestionCard() {
  const q = useGame((s) => s.question);
  const active = useGame((s) => s.active);
  const now = useGame((s) => s.worldTime);
  const lies = useGame((s) => s.lies);
  const dialogue = useGame((s) => s.dialogue);
  if (!q || dialogue) return null;
  const left = Math.max(0, Math.ceil(q.deadline - now));
  const me = active === 'pakya';
  return (
    <div className={`question ${me ? 'is-mine' : ''}`} role="dialog" aria-label="Question for Pakya">
      <div className="question-who">
        {ASKER[q.npc] ?? npcName(q.npc)} <span className="question-left">{left}s</span>
      </div>
      <p className="question-text">“{q.prompt}”</p>
      {me ? (
        <ol className="question-opts">
          {q.options.map((o, i) => {
            const c = checkLine(lies, q.topic, o, q.npc);
            return (
              <li key={o}>
                <button onClick={() => answerQuestion(i)}>
                  <kbd>{i + 1}</kbd> {o}
                  {c.kind === 'matches' && <span className="lie-ok">fits your story</span>}
                  {c.kind === 'contradicts' && (
                    <span className="lie-bad">
                      clashes: {npcName(c.against.to)} heard “{c.against.value}”
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="question-switch">
          <button className="btn" onClick={() => switchFriend('pakya')}>
            Switch to Pakya <kbd>2</kbd>
          </button>{' '}
          to answer, or he will improvise.
        </p>
      )}
    </div>
  );
}

/* ───────────── failure ───────────── */
export function FailCard() {
  const failure = useGame((s) => s.failure);
  const opened = useRef(0);
  useEffect(() => {
    if (failure) {
      opened.current = performance.now();
      sfx('fail');
    }
  }, [failure]);
  useEffect(
    () =>
      onInput((a) => {
        if (!useGame.getState().failure || performance.now() - opened.current < 900) return;
        if (a === 'confirm') retryMission();
      }),
    [],
  );
  if (!failure) return null;
  return (
    <div className="fail" role="alertdialog" aria-label="Mission failed">
      <div className="fail-inner">
        <div className="fail-kicker">Plan failed</div>
        <p className="fail-reason">{failure.reason}</p>
        <div className="fail-actions">
          <button className="btn" onClick={() => retryMission()}>
            Try again from the start of the mission <kbd>Enter</kbd>
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              stopAmbience();
              retryMission();
              set({ mode: 'title' });
            }}
          >
            Quit to title
          </button>
        </div>
      </div>
    </div>
  );
}

export function busyLabel(c: CharId) {
  const s = useGame.getState();
  return s.tasks.find((t) => t.who === c)?.label;
}
