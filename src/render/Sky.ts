import * as THREE from 'three';
import { useGame } from '../game/store';

/**
 * Time of day follows the story: lazy afternoon by default, a fresh morning for
 * the reveal, a sunset that deepens as the Everything Goes Wrong clock runs down,
 * and dusk with the bulbs on for the final mission.
 */
export interface SkyMood {
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  bg: string;
  fog: string;
  /** 0 = day, 1 = full night (lamps lit) */
  night: number;
}

const AFTERNOON: SkyMood = { sun: '#ffd9a0', sunI: 2.6, hemiSky: '#ffe9c4', hemiGround: '#9a6b4f', hemiI: 1.25, bg: '#efcf9f', fog: '#f1d2a2', night: 0 };
const MORNING: SkyMood = { sun: '#fff3dc', sunI: 2.3, hemiSky: '#eaf1ff', hemiGround: '#8a7a64', hemiI: 1.35, bg: '#f1e4c8', fog: '#efe6d2', night: 0 };
const SUNSET: SkyMood = { sun: '#ff9257', sunI: 2.0, hemiSky: '#ffc59a', hemiGround: '#7a4a52', hemiI: 1.05, bg: '#eea27a', fog: '#e9a07c', night: 0.35 };
const DUSK: SkyMood = { sun: '#ff8a72', sunI: 1.15, hemiSky: '#b6a2dc', hemiGround: '#4e3552', hemiI: 0.95, bg: '#6f5281', fog: '#725683', night: 1 };

const ca = new THREE.Color();
const cb = new THREE.Color();
function mixHex(a: string, b: string, t: number) {
  return '#' + ca.set(a).lerp(cb.set(b), t).getHexString();
}
function mix(a: SkyMood, b: SkyMood, t: number): SkyMood {
  return {
    sun: mixHex(a.sun, b.sun, t),
    sunI: a.sunI + (b.sunI - a.sunI) * t,
    hemiSky: mixHex(a.hemiSky, b.hemiSky, t),
    hemiGround: mixHex(a.hemiGround, b.hemiGround, t),
    hemiI: a.hemiI + (b.hemiI - a.hemiI) * t,
    bg: mixHex(a.bg, b.bg, t),
    fog: mixHex(a.fog, b.fog, t),
    night: a.night + (b.night - a.night) * t,
  };
}

/** What the sky should look like right now, from story state alone. */
export function skyMood(): SkyMood {
  const s = useGame.getState();
  const st = (id: string) => s.missions[id]?.status;
  const progress = () => {
    const end = (s.mstate.timerEnd as number) ?? 0;
    const len = (s.mstate.timerLen as number) ?? 240;
    if (!end) return 0;
    return Math.max(0, Math.min(1, 1 - (end - s.worldTime) / len));
  };
  if (st('epilogue') === 'active' || st('epilogue') === 'done') return DUSK;
  if (st('finale') === 'active') return mix(SUNSET, DUSK, 0.45 + progress() * 0.55);
  if (st('reveal') === 'active') return MORNING;
  if (st('chaos') === 'active') return mix(AFTERNOON, SUNSET, progress());
  return AFTERNOON;
}

/** Eases live light colours towards the mood, so changes never pop. */
export class SkyEaser {
  cur: SkyMood = { ...AFTERNOON };
  private c = new THREE.Color();
  step(dt: number) {
    const goal = skyMood();
    const k = Math.min(1, dt * 1.2);
    const lerpHex = (from: string, to: string) => '#' + this.c.set(from).lerp(ca.set(to), k).getHexString();
    this.cur = {
      sun: lerpHex(this.cur.sun, goal.sun),
      sunI: this.cur.sunI + (goal.sunI - this.cur.sunI) * k,
      hemiSky: lerpHex(this.cur.hemiSky, goal.hemiSky),
      hemiGround: lerpHex(this.cur.hemiGround, goal.hemiGround),
      hemiI: this.cur.hemiI + (goal.hemiI - this.cur.hemiI) * k,
      bg: lerpHex(this.cur.bg, goal.bg),
      fog: lerpHex(this.cur.fog, goal.fog),
      night: this.cur.night + (goal.night - this.cur.night) * k,
    };
    return this.cur;
  }
  snap() {
    this.cur = skyMood();
    return this.cur;
  }
}

export const sky = new SkyEaser();

/** Shared bulb material: every street bulb glows together as night falls. */
export const bulbMat = new THREE.MeshBasicMaterial({ color: '#7a7466' });
const bulbOff = new THREE.Color('#7a7466');
const bulbOn = new THREE.Color('#ffd27a');
export function updateBulbs(night: number) {
  bulbMat.color.copy(bulbOff).lerp(bulbOn, Math.min(1, night * 1.4));
}
