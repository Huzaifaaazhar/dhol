import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** Deterministic pseudo-random so textures look the same every load. */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return `#${c.getHexString()}`;
}

function grime(g: CanvasRenderingContext2D, w: number, h: number, r: () => number, n = 40) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(60,40,20,${0.03 + r() * 0.06})`;
    const x = r() * w;
    const y = r() * h;
    g.beginPath();
    g.ellipse(x, y, 10 + r() * 60, 6 + r() * 30, 0, 0, Math.PI * 2);
    g.fill();
  }
  // rain streaks from the top
  for (let i = 0; i < n / 2; i++) {
    g.fillStyle = `rgba(40,30,20,${0.04 + r() * 0.05})`;
    g.fillRect(r() * w, 0, 2 + r() * 5, r() * h * 0.6);
  }
}

/** Painted facade with a grid of windows, shutters and grime. */
export function facadeTexture(seed: number, base: string, trim: string, floors: number, cols: number, shopFront: boolean) {
  return make(`facade|${seed}|${base}|${floors}|${cols}|${shopFront}`, 512, 128 * floors, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // paint patches (repainted sections)
    for (let i = 0; i < 6; i++) {
      g.fillStyle = shade(base, (r() - 0.5) * 0.08);
      g.fillRect(r() * w, r() * h, 40 + r() * 140, 30 + r() * 80);
    }
    const fh = h / floors;
    for (let f = 0; f < floors; f++) {
      const y0 = f * fh;
      // floor band
      g.fillStyle = trim;
      g.fillRect(0, y0 + fh - 10, w, 10);
      if (shopFront && f === floors - 1) continue;
      for (let c = 0; c < cols; c++) {
        const cw = w / cols;
        const x = c * cw + cw * 0.2;
        const ww = cw * 0.6;
        const wy = y0 + fh * 0.2;
        const wh = fh * 0.55;
        // window frame
        g.fillStyle = trim;
        g.fillRect(x - 6, wy - 6, ww + 12, wh + 14);
        const lit = r() < 0.25;
        g.fillStyle = lit ? '#ffd27a' : '#2b3a4a';
        g.fillRect(x, wy, ww, wh);
        // curtains
        if (r() < 0.6) {
          const cc = ['#e63946', '#ffb703', '#8338ec', '#06d6a0', '#ff006e', '#3a86ff'][Math.floor(r() * 6)];
          g.fillStyle = cc;
          g.fillRect(x, wy, ww * (0.25 + r() * 0.2), wh);
          g.fillRect(x + ww * (0.6 + r() * 0.15), wy, ww * 0.4, wh);
        }
        // grille bars
        g.fillStyle = 'rgba(30,30,30,0.6)';
        for (let b = 1; b < 4; b++) g.fillRect(x + (ww * b) / 4, wy, 2, wh);
        // AC unit or pot
        if (r() < 0.18) {
          g.fillStyle = '#e8e8e8';
          g.fillRect(x + ww * 0.1, wy + wh + 10, ww * 0.6, 18);
        }
      }
    }
    grime(g, w, h, r, 30 + floors * 10);
  });
}

/** Hand-painted shop signboard. */
export function signTexture(text: string, sub: string | undefined, bg: string, fg: string) {
  return make(`sign|${text}|${sub}|${bg}`, 1024, 256, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = fg;
    g.lineWidth = 10;
    g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${sub ? 112 : 140}px "Yatra One", "Baloo 2", serif`;
    g.fillText(text, w / 2, sub ? h * 0.42 : h / 2, w - 70);
    if (sub) {
      g.font = '600 44px "Baloo 2", sans-serif';
      g.fillText(sub, w / 2, h * 0.8, w - 80);
    }
  });
}

const POSTERS: Array<[string, string, string, string]> = [
  ['KHATARNAK KHILADI 3', 'Revenge Again', '#d00000', '#ffba08'],
  ['LOVE IN LUDHIANA', 'A musical tragedy', '#ff006e', '#fff'],
  ['PINTO SIR', 'Tuitions · Results*', '#ffffff', '#1d3557'],
  ['HERO NO. 420', 'Now in colour', '#3a0ca3', '#f72585'],
  ['DANGER BHAI', 'He is back. Again.', '#000000', '#ffd60a'],
  ['MANGO THIEVES', 'WANTED · Reward ₹10', '#f1faee', '#9d0208'],
  ['DHINCHAK DIWALI', 'Mega sale!', '#ffb703', '#6a040f'],
  ['ROOM FOR RENT', 'No bachelors!!!', '#e9edc9', '#283618'],
];

export function posterTexture(i: number) {
  const [title, sub, bg, fg] = POSTERS[i % POSTERS.length];
  return make(`poster|${i}`, 256, 360, (g, w, h) => {
    const r = rng(i * 31 + 7);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // sunburst
    g.save();
    g.translate(w / 2, h * 0.45);
    for (let k = 0; k < 16; k++) {
      g.rotate((Math.PI * 2) / 16);
      g.fillStyle = k % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(300, -30);
      g.lineTo(300, 30);
      g.fill();
    }
    g.restore();
    // silhouette hero
    g.fillStyle = fg;
    g.beginPath();
    g.arc(w / 2, h * 0.36, 34, 0, Math.PI * 2);
    g.fill();
    g.fillRect(w / 2 - 40, h * 0.44, 80, 90);
    g.font = 'bold 34px "Yatra One", serif';
    g.textAlign = 'center';
    g.fillText(title, w / 2, h * 0.82, w - 20);
    g.font = '600 20px "Baloo 2", sans-serif';
    g.fillText(sub, w / 2, h * 0.92, w - 20);
    // tear and fade
    g.fillStyle = 'rgba(255,255,240,0.25)';
    g.fillRect(0, 0, w, h * r() * 0.2);
  });
}

/** Wall-length poster collage for the cinema. */
export function posterWallTexture() {
  return make('posterwall', 1024, 320, (g, w, h) => {
    g.fillStyle = '#d9c7a7';
    g.fillRect(0, 0, w, h);
    const r = rng(99);
    for (let k = 0; k < 18; k++) {
      const pt = posterTexture(k).image as HTMLCanvasElement;
      const pw = 120 + r() * 40;
      const ph = pw * 1.4;
      g.save();
      g.translate(r() * w, 40 + r() * (h - 120));
      g.rotate((r() - 0.5) * 0.2);
      g.drawImage(pt, -pw / 2, -ph / 3, pw, ph);
      g.restore();
    }
  });
}

export function floorTexture(kind: string, a: string, b: string) {
  return make(`floor|${kind}|${a}|${b}`, 512, 512, (g, w, h) => {
    const r = rng(kind.length * 13 + 5);
    g.fillStyle = a;
    g.fillRect(0, 0, w, h);
    if (kind === 'tiles' || kind === 'marble') {
      const n = kind === 'tiles' ? 8 : 4;
      const s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          g.fillStyle = (i + j) % 2 ? a : b;
          g.fillRect(i * s, j * s, s, s);
          if (kind === 'tiles') {
            g.fillStyle = 'rgba(255,255,255,0.08)';
            g.beginPath();
            g.arc(i * s + s / 2, j * s + s / 2, s * 0.3, 0, Math.PI * 2);
            g.fill();
          } else {
            g.strokeStyle = 'rgba(120,100,80,0.18)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(i * s, j * s + r() * s);
            g.bezierCurveTo(i * s + s * 0.3, j * s + r() * s, i * s + s * 0.6, j * s + r() * s, i * s + s, j * s + r() * s);
            g.stroke();
          }
        }
      g.strokeStyle = 'rgba(0,0,0,0.15)';
      g.lineWidth = 2;
      for (let i = 0; i <= n; i++) {
        g.beginPath();
        g.moveTo(i * s, 0);
        g.lineTo(i * s, h);
        g.moveTo(0, i * s);
        g.lineTo(w, i * s);
        g.stroke();
      }
    } else {
      for (let i = 0; i < 2500; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
      }
      if (kind === 'oil')
        for (let i = 0; i < 8; i++) {
          g.fillStyle = 'rgba(20,15,10,0.25)';
          g.beginPath();
          g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, Math.PI * 2);
          g.fill();
        }
    }
  });
}

export function roadTexture() {
  const t = make('road', 512, 512, (g, w, h) => {
    const r = rng(42);
    g.fillStyle = '#6d6560';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)';
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    for (let i = 0; i < 10; i++) {
      g.fillStyle = 'rgba(40,30,25,0.18)';
      g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 50, 8 + r() * 20, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function sidewalkTexture() {
  const t = make('sidewalk', 256, 256, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#c8b59a';
    g.fillRect(0, 0, w, h);
    const s = 64;
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        g.fillStyle = ['#c8b59a', '#bfa98d', '#d1bea3', '#b9a385'][Math.floor(r() * 4)];
        g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Bollywood poster sunburst used behind the intro stage. */
export function sunburstTexture() {
  return make('sunburst', 1024, 1024, (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const grad = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.7);
    grad.addColorStop(0, '#ffe066');
    grad.addColorStop(0.45, '#ff7b00');
    grad.addColorStop(1, '#b5005b');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.save();
    g.translate(cx, cy);
    const n = 28;
    for (let k = 0; k < n; k++) {
      g.rotate((Math.PI * 2) / n);
      if (k % 2) continue;
      g.fillStyle = 'rgba(255,255,255,0.13)';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, -w * 0.11);
      g.lineTo(w, w * 0.11);
      g.fill();
    }
    g.restore();
  });
}

export function shirtTexture(pattern: string, color: string) {
  return make(`shirt|${pattern}|${color}`, 64, 64, (g, w, h) => {
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    if (pattern === 'check') {
      g.fillStyle = 'rgba(255,255,255,0.28)';
      for (let i = 0; i < w; i += 16) {
        g.fillRect(i, 0, 5, h);
        g.fillRect(0, i, w, 5);
      }
    } else if (pattern === 'print') {
      g.fillStyle = '#e63946';
      g.beginPath();
      g.arc(32, 30, 12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1d3557';
      g.fillRect(24, 26, 4, 4);
      g.fillRect(36, 26, 4, 4);
    } else if (pattern === 'shiny') {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, 'rgba(255,255,255,0.35)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0)');
      gr.addColorStop(1, 'rgba(255,255,255,0.25)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    } else if (pattern === 'kurta') {
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(29, 0, 6, 26);
      for (let y = 4; y < 26; y += 6) g.fillRect(31, y, 2, 2);
    } else if (pattern === 'saree') {
      g.fillStyle = 'rgba(200,40,60,0.6)';
      g.fillRect(0, h - 10, w, 6);
      g.fillRect(0, 10, w, 3);
    }
  });
}

export function textTexture(text: string, bg: string, fg: string, w = 256, h = 128, font = '"Yatra One", serif') {
  return make(`text|${text}|${bg}|${fg}|${w}x${h}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${Math.floor(h * 0.5)}px ${font}`;
    g.fillText(text, w / 2, h / 2, w - 16);
  });
}

/** Clear all cached canvases (used after web fonts finish loading so signs re-render with them). */
export function invalidateTextTextures() {
  for (const [k, t] of cache) {
    if (k.startsWith('sign') || k.startsWith('poster') || k.startsWith('text')) {
      t.dispose();
      cache.delete(k);
    }
  }
}
