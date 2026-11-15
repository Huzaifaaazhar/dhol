import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { advanceDialogue, chooseDialogue, currentNode, endDialogue, lineCheck, visibleChoices } from '../game/effects';
import { onInput } from '../game/input';
import { FRIENDS } from '../game/data/characters';
import { NPCS } from '../game/data/npcs';
import type { CharId } from '../game/types';
import { blip } from '../game/audio';

function speakerInfo(speaker: string, active: CharId) {
  const id = speaker === 'me' ? active : speaker;
  if (id in FRIENDS) {
    const f = FRIENDS[id as CharId];
    return { name: f.name, color: f.color, voice: f.voice, narrator: false };
  }
  if (NPCS[id]) return { name: NPCS[id].name, color: NPCS[id].color, voice: NPCS[id].voice, narrator: false };
  return { name: '', color: '#ffb400', voice: 0, narrator: true };
}

/** Renders *stage directions* in italics. */
function Rich({ text }: { text: string }) {
  const parts = text.split('*');
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : <span key={i}>{p}</span>))}
    </>
  );
}

export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue);
  const active = useGame((s) => s.active);
  const node = dialogue ? currentNode() : null;
  const [shown, setShown] = useState(0);
  const [sel, setSel] = useState(0);
  const key = dialogue ? `${dialogue.script}:${dialogue.node}` : '';
  const text = node?.text ?? '';
  const done = shown >= text.length;
  const info = node ? speakerInfo(node.speaker, active) : null;
  // choices depend on flags/active: recompute on change
  useGame((s) => s.flags);
  const choices = useMemo(() => (node ? visibleChoices() : []), [node, active, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef({ done, choices, sel, text, key, openedAt: 0 });
  stateRef.current = { ...stateRef.current, done, choices, sel, text, key };

  useEffect(() => {
    setShown(0);
    setSel(0);
    stateRef.current.openedAt = performance.now();
  }, [key]);

  useEffect(() => {
    if (!node || done) return;
    const id = window.setInterval(() => {
      setShown((n) => {
        const nx = Math.min(text.length, n + 2);
        if (info && info.voice && text[n] !== ' ' && n % 4 === 0) blip(info.voice);
        return nx;
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [key, done, text, node, info]);

  useEffect(
    () =>
      onInput((a) => {
        const d = useGame.getState().dialogue;
        if (!d) return;
        const st = stateRef.current;
        // ignore the key press that opened this line (it may not have rendered yet)
        if (`${d.script}:${d.node}` !== st.key || performance.now() - st.openedAt < 120) return;
        if (a === 'confirm' || a === 'interact') {
          if (!st.done) return setShown(st.text.length);
          if (st.choices.length) return chooseDialogue(st.sel);
          return advanceDialogue();
        }
        if (a === 'pause') {
          if (!st.choices.length) endDialogue();
          return;
        }
        if (!st.done) return;
        if (a === 'up') setSel((v) => (v - 1 + st.choices.length) % Math.max(1, st.choices.length));
        if (a === 'down') setSel((v) => (v + 1) % Math.max(1, st.choices.length));
        if (a.startsWith('choice')) {
          const i = Number(a.slice(-1)) - 1;
          if (i < st.choices.length) chooseDialogue(i);
        }
      }),
    [],
  );

  if (!node || !info) return null;
  return (
    <div className={`dialogue ${info.narrator ? 'is-narrator' : ''}`} style={{ ['--c' as string]: info.color }} role="dialog" aria-live="polite">
      {!info.narrator && <div className="dialogue-name">{info.name}</div>}
      <p className="dialogue-text" onClick={() => (done ? !choices.length && advanceDialogue() : setShown(text.length))}>
        <Rich text={text.slice(0, shown)} />
        {!done && <span className="caret" />}
      </p>
      {done && choices.length > 0 && (
        <ol className="choices">
          {choices.map((c, i) => {
            const locked = !!c.who && c.who !== active;
            const f = c.who ? FRIENDS[c.who] : null;
            return (
              <li
                key={i}
                className={`choice ${i === sel ? 'is-sel' : ''} ${locked ? 'is-locked' : ''}`}
                style={f ? { ['--cc' as string]: f.color } : undefined}
                onMouseEnter={() => setSel(i)}
                onClick={() => chooseDialogue(i)}
              >
                <kbd>{i + 1}</kbd>
                {f && <span className="choice-tag">{f.name} · {c.tag}</span>}
                <span className="choice-text">{c.text}</span>
                {locked && <span className="choice-lock">{f!.name} steps in</span>}
                <LieHint effects={c.effects} />
              </li>
            );
          })}
        </ol>
      )}
      {done && !choices.length && (
        <div className="dialogue-next" aria-hidden>
          <kbd>Space</kbd>
        </div>
      )}
    </div>
  );
}

/** Only Pakya keeps track of the stories: as Pakya you see whether a line fits what was said before. */
function LieHint({ effects }: { effects?: import('../game/types').Effect[] }) {
  const active = useGame((s) => s.active);
  const talkingTo = useGame((s) => s.talkingTo);
  useGame((s) => s.lies);
  if (active !== 'pakya' || !effects) return null;
  const c = effects.find((e) => 'claim' in e) as { claim: string; value: string; to?: string; truth?: boolean } | undefined;
  if (!c) return null;
  if (c.truth) return <span className="lie-ok">the truth, for once</span>;
  const to = c.to ?? talkingTo ?? '';
  const r = lineCheck(c.claim, c.value, to);
  if (r.kind === 'matches') return <span className="lie-ok">fits your story</span>;
  if (r.kind === 'contradicts') return <span className="lie-bad">clashes: {NPCS[r.against.to]?.name ?? r.against.to} heard “{r.against.value}”</span>;
  return <span className="lie-new">new lie</span>;
}
