/**
 * In-world labels (interaction prompts, speech bubbles, emotes, "busy" markers) drawn in ONE DOM layer.
 * Positions are projected from 3D every animation frame. This replaces per-label nested React roots,
 * which are slower and race with React 19 when a label disappears mid-update.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../game/store';
import { SCENES } from '../game/data/scenes';
import { CHAR_IDS, type CharId } from '../game/types';
import { FRIENDS } from '../game/data/characters';
import { ent, runtime } from '../game/runtime';
import { actionsFor } from '../game/effects';
import { taskRate } from '../game/sim/tasks';

type Getter = () => [number, number, number] | null;
const anchors = new Map<HTMLElement, { current: Getter }>();
const v = new THREE.Vector3();

function useAnchor(get: Getter) {
  const ref = useRef<HTMLDivElement>(null);
  const getter = useRef(get);
  getter.current = get;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    anchors.set(el, getter);
    place(el, getter.current);
    return () => {
      anchors.delete(el);
    };
  }, []);
  return ref;
}

function place(el: HTMLElement, get: Getter) {
  const cam = runtime.camera;
  const p = get();
  if (!cam || !p) {
    el.style.visibility = 'hidden';
    return;
  }
  v.set(p[0], p[1], p[2]).project(cam);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = ((v.x + 1) / 2) * w;
  const y = ((1 - v.y) / 2) * h;
  const off = x < -200 || x > w + 200 || y < -200 || y > h + 200;
  el.style.visibility = off ? 'hidden' : 'visible';
  el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

const at = (id: string | undefined, x: number, z: number, y: number): Getter => () => {
  if (id) {
    const e = ent(id);
    return [e.x, y + e.y, e.z];
  }
  return [x, y, z];
};

export function WorldOverlay() {
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      anchors.forEach((g, el) => place(el, g.current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="world-overlay" aria-hidden={false}>
      <FriendMarkers />
      <Emotes />
      <Bubbles />
      <Prompt />
    </div>
  );
}

/* ───────────── interaction prompt ───────────── */
function Prompt() {
  const focus = useGame((s) => s.focus);
  const active = useGame((s) => s.active);
  const sceneId = useGame((s) => s.scene);
  useGame((s) => s.flags);
  useGame((s) => s.items);
  useGame((s) => s.lies);
  useGame((s) => s.dhol);
  useGame((s) => s.mstate);
  const dialogue = useGame((s) => s.dialogue);
  const it = SCENES[sceneId].interactables.find((i) => i.id === focus);
  if (!it || dialogue) return null;
  return <PromptCard key={`${it.id}:${active}`} id={it.id} />;
}

function PromptCard({ id }: { id: string }) {
  const s = useGame.getState();
  const it = SCENES[s.scene].interactables.find((i) => i.id === id)!;
  const ref = useAnchor(at(it.npc, it.x, it.z, it.y ?? 2.4));
  const active = s.active;
  const acts = actionsFor(it);
  const main = acts.find((a) => !a.who);
  const mine = acts.find((a) => a.who === active);
  const others = acts.filter((a) => a.who && a.who !== active);
  const sus = it.npc ? (s.lies.suspicion[it.npc] ?? 0) : 0;
  return (
    <div ref={ref} className="anchor">
      <div className="prompt">
        <div className="prompt-label">
          {it.label}
          {sus >= 5 && (
            <span className="prompt-sus" title="How suspicious they are of you">
              {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} className={i < Math.round(sus / 20) ? 'on' : ''} />
              ))}
            </span>
          )}
        </div>
        {main && (
          <div className="prompt-row">
            <kbd>E</kbd>
            <span>{main.verb}</span>
          </div>
        )}
        {mine && (
          <div className="prompt-row prompt-special" style={{ ['--c' as string]: FRIENDS[active].color }}>
            <kbd>F</kbd>
            <span>{mine.verb}</span>
          </div>
        )}
        {!main && !mine && others.length > 0 && <div className="prompt-row prompt-muted">Not a job for {FRIENDS[active].name}</div>}
        {others.length > 0 && (
          <div className="prompt-others">
            {others.map((a) => (
              <span key={a.id} className="chip" style={{ ['--c' as string]: FRIENDS[a.who!].color }}>
                <b>{CHAR_IDS.indexOf(a.who!) + 1}</b> {FRIENDS[a.who!].name} could try something
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── speech bubbles ───────────── */
function Bubbles() {
  const bubbles = useGame((s) => s.bubbles);
  const dialogue = useGame((s) => s.dialogue);
  return (
    <>
      {bubbles.map((b) => (
        <BubbleEl key={b.id} target={b.target} text={b.text} dim={!!dialogue} />
      ))}
    </>
  );
}

function BubbleEl({ target, text, dim }: { target: string; text: string; dim: boolean }) {
  const ref = useAnchor(() => (sceneHas(target) ? at(target, 0, 0, 3.0)() : null));
  const friend = FRIENDS[target as CharId];
  return (
    <div ref={ref} className="anchor" style={{ opacity: dim ? 0.35 : 1 }}>
      <div className="bubble" style={{ ['--c' as string]: friend?.color ?? '#ffffff' }}>
        {text}
      </div>
    </div>
  );
}

/** Only show labels for people who are actually in the scene on screen. */
function sceneHas(id: string) {
  const s = useGame.getState();
  if ((CHAR_IDS as string[]).includes(id)) return s.where[id as CharId] === s.scene;
  return runtime.entities.has(id);
}

/* ───────────── emotes ───────────── */
function Emotes() {
  const emotes = useGame((s) => s.emotes);
  return (
    <>
      {Object.entries(emotes).map(([id, e]) => (
        <EmoteEl key={id + e.until} id={id} kind={e.kind} />
      ))}
    </>
  );
}

function EmoteEl({ id, kind }: { id: string; kind: string }) {
  const ref = useAnchor(() => (sceneHas(id) ? at(id, 0, 0, id === 'gauri' ? 2.2 : 3.1)() : null));
  return (
    <div ref={ref} className="anchor">
      <div className={`emote emote-${kind === '💢' ? 'angry' : kind === '♥' ? 'love' : 'plain'}`}>{kind}</div>
    </div>
  );
}

/* ───────────── what each friend left behind is doing ───────────── */
function FriendMarkers() {
  const tasks = useGame((s) => s.tasks);
  const where = useGame((s) => s.where);
  const hidden = useGame((s) => s.hidden);
  const posted = useGame((s) => s.posted);
  const active = useGame((s) => s.active);
  const scene = useGame((s) => s.scene);
  return (
    <>
      {CHAR_IDS.filter((c) => {
        if (where[c] !== scene || c === active) return false;
        if (tasks.some((t) => t.who === c) || hidden[c]) return true;
        // a friend simply waiting only needs a label when he is somewhere else
        if (!posted[c]) return false;
        const a = ent(active);
        const e = ent(c);
        return Math.hypot(a.x - e.x, a.z - e.z) > 4;
      }).map((c) => {
        const task = tasks.find((t) => t.who === c);
        const label = task ? task.label : hidden[c] ? 'Hiding' : 'Waiting here';
        const slow = task?.kind === 'search' && taskRate(c, task.spec) < 1;
        return <Marker key={c} who={c} label={label} timed={!!task?.duration} slow={slow} />;
      })}
    </>
  );
}

function Marker({ who, label, timed, slow }: { who: CharId; label: string; timed: boolean; slow: boolean }) {
  const ref = useAnchor(at(who, 0, 0, 2.55));
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = useGame.getState().tasks.find((x) => x.who === who);
      if (bar.current && t?.duration) bar.current.style.width = `${Math.min(100, (t.elapsed / t.duration) * 100)}%`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [who]);
  return (
    <div ref={ref} className="anchor">
      <div className="busy" style={{ ['--c' as string]: FRIENDS[who].color }}>
        <span className="busy-who">{FRIENDS[who].name}</span>
        <span className="busy-what">{label}</span>
        {timed ? (
          <span className="busy-bar">
            <span ref={bar} />
          </span>
        ) : null}
        {slow && <span className="busy-slow">slow: Goti is faster</span>}
      </div>
    </div>
  );
}
