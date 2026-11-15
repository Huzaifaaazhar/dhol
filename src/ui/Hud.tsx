import { useEffect, useState } from 'react';
import { useGame, switchTo, activeMission } from '../game/store';
import { MISSION_MAP } from '../game/data/missions';
import { FRIENDS } from '../game/data/characters';
import { CHAR_IDS } from '../game/types';
import { SCENES } from '../game/data/scenes';
import { sfx } from '../game/audio';

/** Mission + current objective, painted like a small shop sign. Expands when something changes. */
export function ObjectiveSign() {
  const missions = useGame((s) => s.missions);
  const money = useGame((s) => s.money);
  const [expanded, setExpanded] = useState(true);
  const m = activeMission();
  const ms = m ? missions[m.id] : null;
  const obj = m && ms ? m.objectives.find((o) => !ms.done.includes(o.id)) : null;
  const sig = `${m?.id}|${obj?.id}`;

  useEffect(() => {
    setExpanded(true);
    const t = window.setTimeout(() => setExpanded(false), 9000);
    return () => window.clearTimeout(t);
  }, [sig]);

  if (!m) return null;
  return (
    <div className={`objective ${expanded ? 'is-open' : ''}`} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <div className="objective-title">{m.title}</div>
      {obj && <div className="objective-text">{obj.text}</div>}
      {expanded && obj?.hint && <div className="objective-hint">{obj.hint}</div>}
      <div className="wallet" title="Money saved towards the rent">
        ₹{money.toLocaleString('en-IN')} <span>of ₹6,000 rent</span>
      </div>
    </div>
  );
}

export function Roster() {
  const active = useGame((s) => s.active);
  const flash = useGame((s) => s.switchFlash);
  const [showRole, setShowRole] = useState(false);
  useEffect(() => {
    if (!flash) return;
    setShowRole(true);
    const t = window.setTimeout(() => setShowRole(false), 2600);
    return () => window.clearTimeout(t);
  }, [flash]);
  const f = FRIENDS[active];
  return (
    <div className="roster">
      <div className={`roster-card ${showRole ? 'is-flash' : ''}`} style={{ ['--c' as string]: f.color }} key={flash}>
        <div className="roster-name">{f.name}</div>
        <div className="roster-role">{f.role}</div>
        <div className="roster-ability">
          <kbd>F</kbd> {f.ability}
        </div>
      </div>
      <div className="roster-tokens" role="tablist" aria-label="Switch friend">
        {CHAR_IDS.map((id, i) => (
          <button
            key={id}
            role="tab"
            aria-selected={id === active}
            className={`token ${id === active ? 'is-active' : ''}`}
            style={{ ['--c' as string]: FRIENDS[id].color }}
            onClick={() => {
              switchTo(id);
              sfx('switch');
            }}
            title={`${FRIENDS[id].name}: ${FRIENDS[id].role}`}
          >
            <span className="token-initial">{FRIENDS[id].name[0]}</span>
            <span className="token-key">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.sub && <div className="toast-sub">{t.sub}</div>}
          <div className="toast-text">{t.text}</div>
        </div>
      ))}
    </div>
  );
}

/** Teaches controls in context, then gets out of the way. */
export function Hints() {
  const hints = useGame((s) => s.hints);
  const missions = useGame((s) => s.missions);
  const focus = useGame((s) => s.focus);
  const dialogue = useGame((s) => s.dialogue);
  const scene = useGame((s) => s.scene);
  if (dialogue) return null;
  let content: React.ReactNode = null;
  if (!hints.moved)
    content = (
      <>
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> or arrows to walk · hold <kbd>Shift</kbd> to run
      </>
    );
  else if (!missions.rent.done.includes('rent.meet'))
    content = (
      <>
        <kbd>1</kbd>–<kbd>4</kbd> or <kbd>Tab</kbd> to switch friend · <kbd>F</kbd> for their special move
      </>
    );
  else if (!hints.interacted && focus)
    content = (
      <>
        <kbd>E</kbd> to interact · <kbd>F</kbd> to try your friend’s ability on it
      </>
    );
  else if (scene === 'house' && missions.rent.done.includes('rent.meet') && missions.rent.status === 'active')
    content = <>The door is at the front of the room. Walk down-left.</>;
  if (!content) return null;
  return <div className="hint">{content}</div>;
}

export function SceneCard() {
  const scene = useGame((s) => s.scene);
  const at = useGame((s) => s.sceneCard);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!at) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 2400);
    return () => window.clearTimeout(t);
  }, [at, scene]);
  if (!show) return null;
  return (
    <div className="scenecard" key={at}>
      <span>{SCENES[scene].name}</span>
    </div>
  );
}

export function MissionLog() {
  const missions = useGame((s) => s.missions);
  return (
    <ul className="log">
      {Object.entries(missions)
        .filter(([, v]) => v.status !== 'locked')
        .map(([id, v]) => {
          const def = MISSION_MAP[id];
          return (
            <li key={id} className={`log-item is-${v.status}`}>
              <div className="log-title">
                {def.title} {v.status === 'done' && <span className="log-done">done</span>}
              </div>
              <div className="log-intro">{def.intro}</div>
              <ul>
                {def.objectives.map((o) => (
                  <li key={o.id} className={v.done.includes(o.id) ? 'is-done' : ''}>
                    {o.text}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
    </ul>
  );
}
