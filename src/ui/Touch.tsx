/**
 * Touch controls: a floating joystick on the left thumb, contextual action buttons on the right.
 * Buttons show what they will do right now ("Talk", "Search properly"), not just a key letter.
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { fireAction, setTouchAxis } from '../game/input';
import { actionsFor } from '../game/effects';
import { SCENES } from '../game/data/scenes';
import { FRIENDS } from '../game/data/characters';

export function useTouchUI() {
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0));
  useEffect(() => {
    const on = () => setTouch(true);
    window.addEventListener('touchstart', on, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', on);
  }, []);
  return touch;
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const id = useRef<number | null>(null);
  const R = 52;

  const move = (cx: number, cy: number) => {
    const b = base.current!.getBoundingClientRect();
    let dx = cx - (b.left + b.width / 2);
    let dy = cy - (b.top + b.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
    const mag = Math.min(1, d / R);
    setTouchAxis(mag > 0.15 ? dx / R : 0, mag > 0.15 ? -dy / R : 0, mag > 0.92);
  };
  const end = () => {
    id.current = null;
    knob.current!.style.transform = '';
    setTouchAxis(0, 0, false);
  };
  useEffect(() => () => setTouchAxis(0, 0, false), []);

  return (
    <div
      ref={base}
      className="stick"
      aria-label="Move"
      onPointerDown={(e) => {
        id.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (id.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="stick-knob" />
      <span className="stick-hint">Push hard to run</span>
    </div>
  );
}

export function TouchControls() {
  const touch = useTouchUI();
  const focus = useGame((s) => s.focus);
  const active = useGame((s) => s.active);
  const scene = useGame((s) => s.scene);
  const dialogue = useGame((s) => s.dialogue);
  const blocked = useGame((s) => s.paused || !!s.failure || !!s.partEnded || s.endingShown || s.lieBook);
  useGame((s) => s.flags);
  useGame((s) => s.dhol);
  useEffect(() => {
    document.documentElement.classList.toggle('touch-ui', touch);
  }, [touch]);
  if (!touch || blocked) return null;
  if (dialogue) return null; // dialogue is driven by tapping the box and its choices

  const it = focus ? SCENES[scene].interactables.find((i) => i.id === focus) : null;
  const acts = it ? actionsFor(it) : [];
  const main = acts.find((a) => !a.who);
  const mine = acts.find((a) => a.who === active);
  const f = FRIENDS[active];
  const press = (a: Parameters<typeof fireAction>[0]) => (e: React.PointerEvent) => {
    e.preventDefault();
    fireAction(a);
  };

  return (
    <div className="touch">
      <Joystick />
      <div className="tbuttons">
        <button className="tbtn tbtn-e" onPointerDown={press('interact')} aria-label={main?.verb ?? 'Interact'}>
          <span className="tbtn-key">E</span>
          <span className="tbtn-label">{it?.hide ? 'Hide' : (main?.verb ?? 'Interact')}</span>
        </button>
        <button className="tbtn tbtn-f" style={{ ['--c' as string]: f.color }} onPointerDown={press('ability')} aria-label={mine?.verb ?? f.ability}>
          <span className="tbtn-key">F</span>
          <span className="tbtn-label">{mine?.verb ?? f.ability}</span>
        </button>
        <button className="tbtn tbtn-small" onPointerDown={press('order')} aria-label="Tell the nearest friend to wait or follow">
          <span className="tbtn-label">Wait / Follow</span>
        </button>
        <button className="tbtn tbtn-small" onPointerDown={press('book')} aria-label="Lie Book">
          <span className="tbtn-label">Lie Book</span>
        </button>
      </div>
    </div>
  );
}
