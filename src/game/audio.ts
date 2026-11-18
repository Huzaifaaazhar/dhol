/**
 * All sound is synthesised with WebAudio: an original dhol rhythm, voice blips and street ambience.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.7;
  musicBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
}

function noise(t: number, dur: number, freq: number, q: number, gain: number, dest: AudioNode) {
  if (!ctx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5, dur + 0.05);
}

function tone(t: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType, dest: AudioNode) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Bass side ("dagga") and treble side ("tilli") of the dhol. */
export function dhol(kind: 'bass' | 'treble' | 'both', when = 0, vol = 1) {
  if (!ctx || !musicBus) return;
  const t = ctx.currentTime + when;
  if (kind !== 'treble') {
    tone(t, 140, 48, 0.45, 0.9 * vol, 'sine', musicBus);
    noise(t, 0.06, 300, 1, 0.25 * vol, musicBus);
  }
  if (kind !== 'bass') {
    tone(t, 520, 380, 0.09, 0.18 * vol, 'triangle', musicBus);
    noise(t, 0.08, 3200, 2.5, 0.5 * vol, musicBus);
  }
}

// A bhangra-flavoured 8-step chaal: B = bass, T = treble, X = both, . = rest
const PATTERN = 'X.TBT.TB X.TBTTTB';
let rhythmTimer: number | null = null;

export function startRhythm(bpm = 104, vol = 0.6) {
  stopRhythm();
  if (!ctx) return;
  const steps = PATTERN.replace(/ /g, '');
  const stepDur = 60 / bpm / 2;
  let i = 0;
  const tick = () => {
    const s = steps[i % steps.length];
    if (s === 'B') dhol('bass', 0, vol);
    else if (s === 'T') dhol('treble', 0, vol);
    else if (s === 'X') dhol('both', 0, vol);
    i++;
  };
  tick();
  rhythmTimer = window.setInterval(tick, stepDur * 1000);
}

/* ── a filmi lead line: reedy, with vibrato and slides (original phrases) ── */
let melodyTimer: number | null = null;
function reed(t: number, f: number, dur: number, vol: number, slideFrom?: number) {
  if (!ctx || !musicBus) return;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(slideFrom ?? f, t);
  if (slideFrom) o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.12, dur * 0.4));
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.5;
  const vibG = ctx.createGain();
  vibG.gain.value = f * 0.012;
  vib.connect(vibG).connect(o.frequency);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f * 2.2;
  bp.Q.value = 1.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol, t + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(bp).connect(g).connect(musicBus);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 0.05);
  vib.stop(t + dur + 0.05);
}

// scale degrees on a C-based Kafi-like mode; 0 = rest. Each step is half a beat.
const SA = 261.63;
const DEG = [0, 1, 9 / 8, 6 / 5, 4 / 3, 3 / 2, 5 / 3, 16 / 9, 2, 9 / 4, 12 / 5];
const PHRASES: number[][] = [
  [5, 5, 6, 5, 4, 3, 4, 0, 3, 2, 3, 4, 5, 0, 0, 0],
  [8, 8, 7, 6, 5, 6, 5, 4, 3, 4, 5, 3, 2, 0, 1, 0],
  [5, 6, 8, 9, 8, 0, 6, 8, 7, 6, 5, 0, 4, 3, 5, 0],
  [3, 4, 5, 3, 2, 1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0],
];

/** Loop the filmi lead over the rhythm (title screen, ending song). */
export function startMelody(bpm = 104, vol = 0.09) {
  stopMelody();
  if (!ctx) return;
  const step = 60 / bpm / 2;
  let i = 0;
  let prev = 0;
  const tick = () => {
    const phrase = PHRASES[Math.floor(i / 16) % PHRASES.length];
    const d = phrase[i % 16];
    if (d && ctx) {
      let len = 1;
      while (len < 4 && phrase[(i + len) % 16] === 0 && (i + len) % 16 !== 0) len++;
      const f = SA * DEG[d];
      reed(ctx.currentTime, f, step * len * 0.95, vol, prev && Math.abs(prev - f) > 40 ? prev : undefined);
      prev = f;
    }
    i++;
  };
  tick();
  melodyTimer = window.setInterval(tick, step * 1000);
}

export function stopMelody() {
  if (melodyTimer !== null) window.clearInterval(melodyTimer);
  melodyTimer = null;
}

export function stopRhythm() {
  stopMelody();
  if (rhythmTimer !== null) window.clearInterval(rhythmTimer);
  rhythmTimer = null;
}

/** Tiny "voice" blip per typed character, pitched per speaker. */
export function blip(pitch: number) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const f = pitch * (0.9 + Math.random() * 0.25);
  tone(t, f, f * 0.92, 0.05, 0.05, 'square', master);
}

export type Sfx =
  | 'coin' | 'fail' | 'success' | 'thud' | 'scream' | 'honk' | 'door' | 'switch' | 'select' | 'secret' | 'step' | 'moo' | 'bark' | 'whoosh'
  | 'knockDull' | 'knockWood' | 'knockHollow' | 'cash' | 'crowd' | 'alarm' | 'tick' | 'pop'
  | 'dhishoom' | 'boom' | 'sting';

export function sfx(name: Sfx) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const m = master;
  switch (name) {
    case 'coin':
      tone(t, 988, 988, 0.08, 0.15, 'square', m);
      tone(t + 0.08, 1319, 1319, 0.25, 0.15, 'square', m);
      break;
    case 'success':
      [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.09, f, f, 0.22, 0.12, 'triangle', m));
      dhol('both', 0.36, 0.9);
      break;
    case 'fail':
      tone(t, 300, 120, 0.5, 0.15, 'sawtooth', m);
      break;
    case 'thud':
      tone(t, 120, 40, 0.3, 0.6, 'sine', m);
      noise(t, 0.1, 400, 1, 0.3, m);
      break;
    case 'dhishoom':
      // a filmi punch: whoosh in, a hard snap, a fat low thump
      noise(t, 0.12, 1800, 0.7, 0.25, m);
      noise(t + 0.1, 0.05, 3200, 1.5, 0.6, m);
      tone(t + 0.1, 160, 45, 0.35, 0.8, 'sine', m);
      tone(t + 0.1, 90, 60, 0.25, 0.3, 'square', m);
      break;
    case 'boom':
      // a cartoon explosion: crack, rumble, and a long tail
      noise(t, 0.08, 2600, 0.6, 0.9, m);
      noise(t + 0.02, 1.6, 180, 0.5, 0.9, m);
      tone(t, 90, 28, 1.4, 0.9, 'sine', m);
      tone(t + 0.05, 60, 30, 1.0, 0.4, 'sawtooth', m);
      break;
    case 'sting':
      // dun… dun… DUNNN: a brassy filmi reveal, with a cymbal swell
      [220, 207.65, 196].forEach((f, i) => {
        const at = t + i * 0.32;
        const len = i === 2 ? 1.3 : 0.24;
        tone(at, f, f * 0.995, len, 0.16, 'sawtooth', m);
        tone(at, f * 1.5, f * 1.49, len, 0.07, 'sawtooth', m);
        tone(at, f / 2, f / 2, len, 0.2, 'triangle', m);
      });
      noise(t + 0.64, 1.4, 6000, 0.4, 0.22, m);
      dhol('bass', 0.64, 1);
      break;
    case 'scream':
      tone(t, 700, 1400, 0.35, 0.08, 'sawtooth', m);
      tone(t + 0.3, 1400, 500, 0.4, 0.08, 'sawtooth', m);
      break;
    case 'honk':
      tone(t, 420, 420, 0.18, 0.08, 'square', m);
      tone(t, 528, 528, 0.18, 0.06, 'square', m);
      break;
    case 'door':
      noise(t, 0.15, 900, 3, 0.3, m);
      tone(t, 180, 120, 0.15, 0.2, 'triangle', m);
      break;
    case 'switch':
      dhol('treble', 0, 0.8);
      dhol('bass', 0.09, 0.6);
      break;
    case 'select':
      tone(t, 660, 880, 0.06, 0.08, 'triangle', m);
      break;
    case 'secret':
      [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * 0.07, f, f, 0.3, 0.08, 'sine', m));
      break;
    case 'step':
      noise(t, 0.035, 900 + Math.random() * 500, 1.2, 0.025, m);
      break;
    case 'moo':
      tone(t, 140, 110, 0.9, 0.15, 'sawtooth', m);
      break;
    case 'bark':
      tone(t, 500, 300, 0.1, 0.15, 'sawtooth', m);
      tone(t + 0.15, 520, 300, 0.1, 0.15, 'sawtooth', m);
      break;
    case 'whoosh':
      noise(t, 0.4, 800, 0.6, 0.25, m);
      break;
    case 'knockDull':
      [0, 0.22].forEach((d) => tone(t + d, 110, 60, 0.25, 0.5, 'sine', m));
      break;
    case 'knockWood':
      [0, 0.18].forEach((d) => {
        tone(t + d, 380, 300, 0.06, 0.25, 'triangle', m);
        noise(t + d, 0.04, 1800, 3, 0.25, m);
      });
      break;
    case 'knockHollow':
      [0, 0.2, 0.4].forEach((d, i) => tone(t + d, 760 + i * 40, 520, 0.18, 0.22, 'square', m));
      break;
    case 'cash':
      for (let i = 0; i < 9; i++) noise(t + i * 0.05, 0.06, 4000 + Math.random() * 2000, 4, 0.18, m);
      [1046, 1318, 1568].forEach((f, i) => tone(t + 0.5 + i * 0.08, f, f, 0.25, 0.1, 'triangle', m));
      break;
    case 'crowd':
      for (let i = 0; i < 6; i++) noise(t + i * 0.12, 0.5, 500 + Math.random() * 600, 0.8, 0.12, m);
      break;
    case 'alarm':
      [0, 0.25].forEach((d) => tone(t + d, 880, 660, 0.2, 0.08, 'square', m));
      break;
    case 'tick':
      tone(t, 1600, 1500, 0.03, 0.05, 'square', m);
      break;
    case 'pop':
      tone(t, 500, 900, 0.07, 0.08, 'triangle', m);
      break;
  }
}

/* ── tension: a low, quiet pulse under the live missions (original pattern) ── */
let tensionTimer: number | null = null;
let tensionLevel = 0;
export function setTension(level: 0 | 1 | 2) {
  if (level === tensionLevel) return;
  tensionLevel = level;
  if (tensionTimer !== null) window.clearInterval(tensionTimer);
  tensionTimer = null;
  if (!level || !ctx) return;
  const bpm = level === 2 ? 132 : 108;
  const step = 60 / bpm / 2;
  // B . . T B . T . : a heartbeat that leans forward
  const pat = level === 2 ? 'B.TTB.TT' : 'B..TB.T.';
  let i = 0;
  tensionTimer = window.setInterval(() => {
    const c = pat[i++ % pat.length];
    if (c === 'B') dhol('bass', 0, 0.22);
    else if (c === 'T') dhol('treble', 0, 0.12);
    if (level === 2 && i % 16 === 0 && ctx && musicBus) tone(ctx.currentTime, 220, 208, 0.5, 0.03, 'sawtooth', musicBus);
  }, step * 1000);
}

let ambienceNodes: AudioNode[] = [];
let hornTimer: number | null = null;

export function startAmbience(indoor: boolean) {
  stopAmbience();
  if (!ctx || !master || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = indoor ? 300 : 700;
  const g = ctx.createGain();
  g.gain.value = indoor ? 0.03 : 0.06;
  src.connect(f).connect(g).connect(master);
  src.start();
  ambienceNodes = [src, f, g];
  if (!indoor) {
    hornTimer = window.setInterval(() => {
      if (Math.random() < 0.45) {
        const c = ctx!;
        const t = c.currentTime;
        const p = 300 + Math.random() * 300;
        tone(t, p, p, 0.12, 0.025, 'square', master!);
        if (Math.random() < 0.5) tone(t + 0.18, p, p, 0.12, 0.025, 'square', master!);
      }
    }, 2600);
  }
}

export function stopAmbience() {
  ambienceNodes.forEach((n) => {
    try {
      (n as AudioBufferSourceNode).stop?.();
    } catch {
      /* already stopped */
    }
    n.disconnect();
  });
  ambienceNodes = [];
  if (hornTimer !== null) window.clearInterval(hornTimer);
  hornTimer = null;
}
