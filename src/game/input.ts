/**
 * Keyboard input. Held keys are polled each frame; discrete actions are pushed to listeners.
 */
export type InputAction =
  | 'interact'
  | 'ability'
  | 'cycle'
  | 'char1'
  | 'char2'
  | 'char3'
  | 'char4'
  | 'pause'
  | 'confirm'
  | 'choice1'
  | 'choice2'
  | 'choice3'
  | 'choice4'
  | 'choice5'
  | 'mute'
  | 'up'
  | 'down'
  | 'order'
  | 'book';

const held = new Set<string>();
const listeners = new Set<(a: InputAction, e: KeyboardEvent) => void>();

const ACTION_KEYS: Record<string, InputAction[]> = {
  KeyE: ['interact'],
  KeyF: ['ability'],
  Tab: ['cycle'],
  Digit1: ['char1', 'choice1'],
  Digit2: ['char2', 'choice2'],
  Digit3: ['char3', 'choice3'],
  Digit4: ['char4', 'choice4'],
  Digit5: ['choice5'],
  Escape: ['pause'],
  Enter: ['confirm'],
  Space: ['confirm'],
  KeyM: ['mute'],
  KeyQ: ['order'],
  KeyL: ['book'],
  ArrowUp: ['up'],
  ArrowDown: ['down'],
  KeyW: ['up'],
  KeyS: ['down'],
};

let installed = false;
export function installInput() {
  if (installed) return;
  installed = true;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    held.add(e.code);
    if (e.repeat) return;
    const acts = ACTION_KEYS[e.code];
    if (acts) for (const a of acts) listeners.forEach((l) => l(a, e));
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
}

export function onInput(fn: (a: InputAction, e: KeyboardEvent) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function isHeld(code: string) {
  return held.has(code);
}

/* ───────── touch ───────── */
const touchAxis = { x: 0, y: 0, run: false };
export function setTouchAxis(x: number, y: number, run: boolean) {
  touchAxis.x = x;
  touchAxis.y = y;
  touchAxis.run = run;
}

/** On-screen buttons fire the same actions as their keys. */
export function fireAction(a: InputAction) {
  const e = new KeyboardEvent('keydown');
  listeners.forEach((l) => l(a, e));
}

/** Screen-relative movement axis (x = right, y = up), normalised. */
export function moveAxis() {
  if (touchAxis.x || touchAxis.y) {
    const l = Math.hypot(touchAxis.x, touchAxis.y);
    return { x: touchAxis.x / Math.max(1, l), y: touchAxis.y / Math.max(1, l), running: touchAxis.run };
  }
  let x = 0;
  let y = 0;
  if (held.has('KeyW') || held.has('ArrowUp')) y += 1;
  if (held.has('KeyS') || held.has('ArrowDown')) y -= 1;
  if (held.has('KeyD') || held.has('ArrowRight')) x += 1;
  if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1;
  const l = Math.hypot(x, y);
  if (l > 0) {
    x /= l;
    y /= l;
  }
  return { x, y, running: held.has('ShiftLeft') || held.has('ShiftRight') };
}

/** Camera sits at +x,+z looking at origin; convert screen axis to world XZ. */
export function screenToWorld(x: number, y: number) {
  const s = Math.SQRT1_2;
  return { x: (x - y) * s, z: (-x - y) * s };
}
