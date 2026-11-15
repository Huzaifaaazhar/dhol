/**
 * Runs browser playthroughs against the dev server (npm run dev must be running).
 *   node tests/e2e/run.mjs            # all
 *   node tests/e2e/run.mjs rich jai   # selected
 */
import { mkdirSync } from 'node:fs';
import { launch } from './lib.mjs';
import * as specs from './specs.mjs';

const shots = process.env.SHOTS ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const wanted = process.argv.slice(2);
const names = Object.keys(specs).filter((n) => !wanted.length || wanted.includes(n));
let failed = 0;
for (const name of names) {
  const t = await launch({ shots });
  console.log(`\n▶ ${name}`);
  const t0 = Date.now();
  try {
    await specs[name](t);
    const errs = t.errors.filter((e) => !e.includes('favicon'));
    if (errs.length) throw new Error('console errors:\n' + errs.slice(0, 5).join('\n'));
    console.log(`  PASS ${name} (${Math.round((Date.now() - t0) / 1000)}s)`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}: ${e.message}`);
    if (shots) await t.page.screenshot({ path: `${shots}/FAIL-${name}.png` });
  }
  await t.browser.close();
}
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
