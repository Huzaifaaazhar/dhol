/**
 * Browser test helpers. Drives the real game in headless Chromium through the keyboard,
 * using the dev-only window.__dhol.api only to jump between missions, teleport, and read state.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const URL = process.env.DHOL_URL ?? 'http://localhost:5173/';

export async function launch({ width = 1280, height = 720, shots = null } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__dhol?.api, null, { timeout: 20000 });
  await page.evaluate(() => window.__dhol.api.speed(3));
  const t = makeHelpers(page, shots);
  return { browser, page, errors, ...t };
}

function makeHelpers(page, shots) {
  const st = () =>
    page.evaluate(() => {
      const s = window.__dhol.useGame.getState();
      return {
        mode: s.mode,
        scene: s.scene,
        active: s.active,
        dialogue: s.dialogue,
        focus: s.focus,
        flags: s.flags,
        money: s.money,
        items: s.items,
        stats: s.stats,
        dhol: s.dhol,
        where: s.where,
        posted: s.posted,
        hidden: s.hidden,
        tasks: s.tasks.map((t) => ({ who: t.who, kind: t.kind, elapsed: t.elapsed, duration: t.duration, source: t.source })),
        question: s.question,
        failure: s.failure,
        partEnded: s.partEnded,
        endingShown: s.endingShown,
        transition: !!s.transition,
        mstate: s.mstate,
        lies: s.lies,
        missions: Object.fromEntries(Object.entries(s.missions).map(([k, v]) => [k, `${v.status}:${v.done.join(',')}`])),
      };
    });
  const api = (fn, ...args) => page.evaluate(([fn, args]) => window.__dhol.api[fn](...args), [fn, args]);
  const wait = (ms) => page.waitForTimeout(ms);
  const key = async (k, ms = 350) => {
    await page.keyboard.press(k);
    await wait(ms);
  };
  const shot = async (name) => {
    if (shots) await page.screenshot({ path: `${shots}/${name}.png` });
  };
  /** Press Space through lines until a choice appears or the conversation ends. */
  const advance = async (max = 40) => {
    for (let i = 0; i < max; i++) {
      const s = await st();
      if (!s.dialogue) return 'ended';
      if (await page.locator('.choices').count()) return 'choices';
      await key('Space', 260);
    }
    return 'stuck';
  };
  /** Pick a reply; if it belongs to another friend, the first press brings him forward. */
  const choose = async (label) => {
    const items = page.locator('.choice');
    const n = await items.count();
    for (let i = 0; i < n; i++) {
      const txt = await items.nth(i).innerText();
      if (txt.toLowerCase().includes(label.toLowerCase())) {
        await key(`Digit${i + 1}`, 450);
        if (await page.locator('.choice').count()) {
          const again = await page.locator('.choice').nth(i).innerText().catch(() => '');
          if (again.toLowerCase().includes(label.toLowerCase())) await key(`Digit${i + 1}`, 450);
        }
        return true;
      }
    }
    throw new Error(`no choice containing "${label}" in: ${(await items.allInnerTexts()).join(' | ')}`);
  };
  const until = async (fn, timeout = 30000, label = 'condition') => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const s = await st();
      if (fn(s)) return s;
      await wait(250);
    }
    throw new Error(`timed out waiting for ${label}`);
  };
  const near = async (agentId, dx = 1.1, dz = 1.1) => {
    const a = await api('agent', agentId);
    if (!a) throw new Error(`no agent ${agentId}`);
    await api('tp', a.x + dx, a.z + dz);
    await wait(700);
  };
  return { st, api, wait, key, shot, advance, choose, until, near };
}

export function check(cond, msg) {
  if (!cond) throw new Error('CHECK FAILED: ' + msg);
  console.log('  ✓ ' + msg);
}
