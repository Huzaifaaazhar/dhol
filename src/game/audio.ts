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

export function stopRhythm() {
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

export type Sfx = 'coin' | 'fail' | 'success' | 'thud' | 'scream' | 'honk' | 'door' | 'switch' | 'select' | 'secret' | 'step' | 'moo' | 'bark' | 'whoosh';

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
      noise(t, 0.03, 1200, 1, 0.04, m);
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
  }
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
