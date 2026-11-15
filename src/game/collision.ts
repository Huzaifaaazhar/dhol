import type { Box, SceneDef } from './types';

export interface Circle {
  x: number;
  z: number;
  r: number;
}

/** Push a circle out of all boxes and keep it inside bounds. Mutates p. */
export function resolve(p: { x: number; z: number }, r: number, scene: SceneDef, dynamic: Circle[] = []) {
  for (let iter = 0; iter < 2; iter++) {
    for (const b of scene.colliders) pushOutBox(p, r, b);
    for (const c of dynamic) pushOutCircle(p, r, c);
  }
  const bd = scene.bounds;
  p.x = Math.min(bd.maxX - r, Math.max(bd.minX + r, p.x));
  p.z = Math.min(bd.maxZ - r, Math.max(bd.minZ + r, p.z));
}

function pushOutBox(p: { x: number; z: number }, r: number, b: Box) {
  const hx = b.w / 2;
  const hz = b.d / 2;
  const cx = Math.max(b.x - hx, Math.min(p.x, b.x + hx));
  const cz = Math.max(b.z - hz, Math.min(p.z, b.z + hz));
  const dx = p.x - cx;
  const dz = p.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return;
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2);
    p.x = cx + (dx / d) * r;
    p.z = cz + (dz / d) * r;
  } else {
    // centre inside box: push along the shallowest axis
    const left = p.x - (b.x - hx);
    const right = b.x + hx - p.x;
    const top = p.z - (b.z - hz);
    const bottom = b.z + hz - p.z;
    const m = Math.min(left, right, top, bottom);
    if (m === left) p.x = b.x - hx - r;
    else if (m === right) p.x = b.x + hx + r;
    else if (m === top) p.z = b.z - hz - r;
    else p.z = b.z + hz + r;
  }
}

function pushOutCircle(p: { x: number; z: number }, r: number, c: Circle) {
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const min = r + c.r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min || d2 < 1e-8) return;
  const d = Math.sqrt(d2);
  p.x = c.x + (dx / d) * min;
  p.z = c.z + (dz / d) * min;
}

export function insideAnyBox(x: number, z: number, scene: SceneDef, pad = 0) {
  return scene.colliders.some((b) => Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad);
}
