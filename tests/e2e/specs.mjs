import { check } from './lib.mjs';

/* ═════════ 1. THE RICH GIRL PLAN ═════════ */
export async function rich(t) {
  const { st, api, key, advance, choose, until, near, shot, page } = t;
  // Pakya told Daadi he was the cable TV man in Part 1
  await api('jumpTo', 'rich', { 'ritu.cable': true }, {
    lies: { claims: [], suspicion: {}, contradictions: [], stories: {}, beliefs: { daadi: { 'pakya.job': { value: 'cable TV inspector', by: 'pakya', t: 0 } } } },
  });
  await t.wait(1500);
  let s = await st();
  check(s.missions.rich.startsWith('active'), 'Rich Girl Plan is active');
  check((await api('agentIds')).includes('ritu'), 'Ritu walks the street as a simulated agent');
  check(s.lies.beliefs.ritu?.['pakya.job']?.via === 'daadi', 'Ritu has heard Daadi’s version of Pakya’s job');

  // the kids know she likes Moti
  await api('tp', 0.6, 12.2);
  await t.wait(800);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.flags['likes.dogs'], 'learned from Pinky: Ritu likes Moti');

  // Sam searches the shrine slowly; not hidden, so he finds the marigolds eventually
  await api('tp', -35.4, 7.8);
  await t.wait(800);
  await key('KeyE', 400);
  s = await st();
  check(s.tasks.some((x) => x.who === 'sam' && x.kind === 'search'), 'Sam started a (slow) search at the shrine');
  // switch to Goti while Sam keeps searching: time keeps running
  const before = s.tasks.find((x) => x.who === 'sam').elapsed;
  await key('Digit3', 800);
  s = await st();
  check(s.active === 'goti' && s.posted.sam, 'switched to Goti; Sam stays behind, still searching');
  await api('tp', -32.7, -9.6);
  await t.wait(800);
  await key('KeyF', 400);
  s = await st();
  check(s.tasks.some((x) => x.who === 'goti'), 'Goti started searching under the swing');
  check(s.tasks.find((x) => x.who === 'sam').elapsed > before, 'Sam’s search kept progressing while controlling Goti');
  s = await until((x) => x.flags['likes.songs'], 40000, 'Goti’s search to finish');
  check(s.flags['likes.jalebi'] && s.flags['likes.liars'], 'Goti found Ritu’s notebook page (hidden find)');
  check(s.missions.rich.includes('rich.learn'), 'objective: find out what Ritu likes');
  s = await until((x) => x.items.includes('marigolds'), 60000, 'Sam’s shrine search');
  check(true, 'Sam found marigolds while we were busy with Goti');
  await shot('rich-search');

  // butting in: with friends following, someone interrupts
  await key('Digit1', 900); // Sam (far away at the shrine: switch moves the camera)
  await api('switchFriend', 'goti');
  await t.wait(300);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    const s = g.getState();
    g.setState({ posted: { sam: false, pakya: false, goti: false, maru: false }, where: { sam: 'street', pakya: 'street', goti: 'street', maru: 'street' } });
  });
  const r = await api('agent', 'ritu');
  for (const [c, dx] of [['goti', 1.0], ['pakya', 1.8], ['maru', 2.4], ['sam', 2.8]]) await api('tp', r.x + dx, r.z + 0.8, c);
  await t.wait(500);
  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  s = await st();
  check(s.dialogue?.script === 'ritu2' && s.dialogue.node.startsWith('butt_'), `a friend butts in (${s.dialogue?.node})`);
  await shot('rich-buttin');
  await advance();
  await choose('Introduce her to Moti');
  await advance();
  s = await st();
  check(s.flags['move.goti'], 'Goti made his move');
  check(s.stats['gang.harmony'] < 60, 'butting in hurt the gang’s harmony');

  // Q: leave the others behind so they can't interrupt
  for (const c of ['sam', 'pakya', 'maru']) {
    await api('switchFriend', c);
    await t.wait(400);
  }
  // Pakya: bluffing "film producer" clashes with the cable-TV story Daadi told Ritu
  await api('switchFriend', 'pakya');
  await t.wait(400);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ posted: { sam: true, pakya: false, goti: true, maru: true } });
  });
  for (const c of ['sam', 'goti', 'maru']) await api('tp', -36, -16 + ['sam', 'goti', 'maru'].indexOf(c), c);
  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  await advance();
  const hint = await page.locator('.lie-bad').count();
  check(hint > 0, 'as Pakya, the bluff is marked as clashing with an earlier story');
  await shot('rich-liehint');
  await choose('film producer');
  await advance();
  s = await st();
  check(s.lies.contradictions.some((c) => c.npc === 'ritu' && c.topic === 'pakya.job'), 'Ritu caught the contradiction (Lie Book records it)');
  check(s.lies.suspicion.ritu > 0, 'Ritu is now suspicious');

  // Sam and Maru
  await api('switchFriend', 'sam');
  await t.wait(500);
  await page.evaluate(() => window.__dhol.useGame.setState({ posted: { sam: false, pakya: true, goti: true, maru: true } }));
  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  await advance();
  await choose('actually listen');
  await advance();
  await api('switchFriend', 'maru');
  await t.wait(500);
  await page.evaluate(() => window.__dhol.useGame.setState({ posted: { sam: true, pakya: true, goti: true, maru: false } }));
  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  await advance();
  await choose('brother used to play');
  await advance();
  s = await st();
  check(s.missions.rich.includes('rich.moves'), `all four made their move (trust ${s.stats['ritu.trust']})`);

  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  await advance();
  s = await st();
  if (s.stats['ritu.trust'] >= 45) check(s.flags['rahul.told'], 'Ritu confides about Rahul and Jai');
  else check(true, 'Ritu doesn’t trust you enough: Daadi path needed');
  if (!s.missions.rich.startsWith('done')) {
    // fall back: Daadi tells you
    await api('tp', -28, -11.2);
    await t.wait(700);
    await key('KeyE', 2500);
    await api('tp', -3, -1.8);
    await t.wait(800);
    await key('KeyE', 500);
    await advance();
  }
  s = await until((x) => x.missions.rich.startsWith('done'), 10000, 'Rich Girl Plan to complete');
  check(true, 'The Rich Girl Plan complete');
  await until((x) => x.missions.jai.startsWith('active'), 8000, 'Jai mission to start');
  check(true, 'Who Exactly Is Jai? started');
}

/* failure: lose Ritu's trust completely, then retry from the checkpoint */
export async function richFail(t) {
  const { st, api, key, advance, choose, near, page } = t;
  await api('jumpTo', 'rich');
  await t.wait(1200);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ stats: { ...g.getState().stats, 'ritu.trust': 14 }, posted: { sam: false, pakya: true, goti: true, maru: true } });
  });
  for (const c of ['pakya', 'goti', 'maru']) await api('tp', -36, -15 + ['pakya', 'goti', 'maru'].indexOf(c), c);
  await near('ritu', 1.0, 0.9);
  await key('KeyE', 600);
  await advance();
  await choose('five-year plan');
  await advance();
  const s = await t.until((x) => !!x.failure, 6000, 'failure');
  check(s.failure.mission === 'rich', 'losing Ritu’s trust fails the mission');
  check((await page.locator('.fail').count()) === 1, 'the failure card is shown');
  await t.shot('rich-fail');
  await t.wait(1000);
  await key('Enter', 1500);
  const r = await st();
  check(!r.failure && r.stats['ritu.trust'] === 30 && !r.flags['move.sam'], 'Retry restores the checkpoint (trust 30, no moves)');
}

/* ═════════ 2. WHO EXACTLY IS JAI? ═════════ */
export async function jai(t) {
  const { st, api, key, advance, choose, near } = t;
  await api('jumpTo', 'jai');
  await t.wait(1200);
  check((await api('agentIds')).includes('jai'), 'Jai is in the colony');
  // two different versions of his story
  await api('tp', 12, 7.9);
  await t.wait(800);
  await key('KeyE', 500);
  await advance();
  await api('tp', 25, -5.6);
  await t.wait(800);
  await key('KeyE', 500);
  let r = await advance();
  let s = await st();
  check(s.lies.stories.jai?.bablu && s.lies.stories.jai?.pappu, 'heard Jai’s story from Bablu and from Pappu');
  check(s.missions.jai.includes('jai.stories'), 'two different stories: objective done');
  // Sam negotiates a look at Pappu's register (proof, approach 3)
  if (r === 'choices') {
    await choose('word-of-mouth');
    await advance();
  }
  s = await st();
  check(s.items.includes('register') && s.missions.jai.includes('jai.proof'), 'Sam got a look at Pappu’s register: Jai Malhotra, Dubai');
  await near('jai', 1.0, 1.0);
  await key('KeyE', 600);
  await advance();
  await choose('Lay out the evidence');
  await advance();
  s = await t.until((x) => x.missions.jai.startsWith('done'), 8000, 'Jai mission to complete');
  check(s.flags['jai.met'], 'Jai revealed Rahul is hiding and something is inside his dhol');
  await t.until((x) => x.missions.zikomo.startsWith('active'), 8000, 'Zikomo mission to start');
  check(true, 'Zikomo Is Looking for You started');
}

export async function jaiStealth(t) {
  const { st, api, key, page } = t;
  await api('jumpTo', 'jai');
  await t.wait(1000);
  // being seen makes Jai suspicious
  const j = await api('agent', 'jai');
  await api('switchFriend', 'maru');
  await t.wait(400);
  await api('tp', j.x, j.z - 2.2); // he faces north, towards the bungalow
  await t.until((x) => (x.lies.suspicion.jai ?? 0) > 0, 15000, 'Jai to notice Maru');
  check(true, 'Jai noticed Maru staring at him');
  await api('tp', 0, 20);
  // wait for him to leave for his phone call, then Goti goes through his bag
  await t.until(() => true, 100);
  const left = async () => {
    const a = await api('agent', 'jai');
    return a.ri >= 2 && a.ri <= 4 && Math.hypot(a.x + 22.3, a.z + 6.3) > 8;
  };
  const t0 = Date.now();
  while (!(await left())) {
    if (Date.now() - t0 > 60000) throw new Error('Jai never left his post');
    await t.wait(500);
  }
  check(true, 'Jai walked off to make a call');
  await api('switchFriend', 'goti');
  await t.wait(400);
  await api('tp', -22.3, -5.3);
  await t.wait(900);
  await key('KeyF', 500);
  let s = await st();
  check(s.tasks.some((x) => x.who === 'goti' && x.source.startsWith('jai_bag')), 'Goti is searching Jai’s bag');
  s = await t.until((x) => x.items.includes('photo') || !x.tasks.length, 30000, 'bag search');
  check(s.items.includes('photo') && s.missions.jai.includes('jai.proof'), 'Goti found the photo of Jai and Rahul (proof, approach 1)');
  await t.shot('jai-bag');
  // overhearing: wait until he is on the phone in the lane, stand behind him
  const calling = async () => {
    const a = await api('agent', 'jai');
    return a.ri === 4 && a.wait > 2;
  };
  const t1 = Date.now();
  while (!(await calling())) {
    if (Date.now() - t1 > 90000) throw new Error('Jai never made his call');
    await t.wait(500);
  }
  const a = await api('agent', 'jai');
  await api('switchFriend', 'sam');
  await t.wait(400);
  await api('tp', a.x + 0.4, a.z - 2.6);
  await t.wait(2500);
  const bubbles = await page.locator('.bubble').allInnerTexts();
  check(bubbles.some((b) => b.includes('…')), `Jai’s phone call is audible: “${bubbles.find((b) => b.includes('…'))?.slice(0, 60)}”`);
}

export async function jaiFail(t) {
  const { api } = t;
  await api('jumpTo', 'jai');
  await t.wait(1000);
  await t.page.evaluate(() => {
    const g = window.__dhol.useGame;
    const s = g.getState();
    g.setState({ lies: { ...s.lies, suspicion: { jai: 92 } } });
  });
  const j = await api('agent', 'jai');
  await api('tp', j.x, j.z - 2.0);
  const s = await t.until((x) => !!x.failure, 20000, 'Jai to skip town');
  check(s.failure.reason.includes('Jai'), 'staring at Jai once too often makes him leave: mission failed');
}

/* ═════════ 3. ZIKOMO IS LOOKING FOR YOU ═════════ */
async function inFrontOf(t, agentId, who, d = 2.2) {
  const a = await t.api('agent', agentId);
  const face = await t.page.evaluate((id) => window.__dhol.runtime.entities.get(id).face, agentId);
  await t.api('tp', a.x + Math.sin(face) * d, a.z + Math.cos(face) * d, who);
}

async function enterHideout(t) {
  await t.api('tp', -20.3, 18.4);
  await t.wait(900);
  await t.key('KeyE', 2400);
}

export async function zikomo(t) {
  const { st, api, key, advance, choose, page } = t;
  await api('jumpTo', 'zikomo');
  await t.wait(2500);
  let s = await st();
  check(s.where.sam === 'street' && s.where.goti === 'shop' && s.where.maru === 'house' && s.hidden.pakya === 'barber', 'the gang starts scattered: tea plaza, shop, home, barber chair');
  const ids = await api('agentIds');
  check(['zikomo', 'bhaloo', 'spanner'].every((i) => ids.includes(i)), 'Zikomo and his two men are on the street');
  await t.shot('zik-start');

  // Maru: from home, out the door, keeps watch, then slips into the hideout
  await key('Digit4', 2200);
  s = await st();
  check(s.scene === 'house' && s.active === 'maru', 'switching to Maru takes you into the house where he is');
  await api('tp', 3.5, 3.9);
  await t.wait(800);
  await key('KeyE', 2400);
  s = await st();
  check(s.scene === 'street' && s.where.maru === 'street', 'Maru left the house');
  check((await page.evaluate(() => window.__dhol.runtime.reveal)) === null, 'goon sightlines are hidden without a lookout');
  await api('tp', -20.0, 11.2);
  await t.wait(900);
  await key('KeyF', 600);
  s = await st();
  check(s.tasks.some((x) => x.who === 'maru' && x.kind === 'watch'), 'Maru is keeping watch');
  check((await page.evaluate(() => window.__dhol.runtime.reveal)) === 'street', 'Maru on watch reveals where the goons are looking');
  await t.wait(1500);
  await t.shot('zik-watch');
  await enterHideout(t);
  s = await st();
  check(s.where.maru === 'hideout', 'Maru reached the hideout');

  // Goti: crackers from Lalaji's back shelf, a distraction, then the hideout
  await key('Digit3', 2400);
  s = await st();
  check(s.scene === 'shop' && s.active === 'goti', 'switched to Goti in Lalaji’s store');
  await api('tp', 2.6, -2.0);
  await t.wait(900);
  await key('KeyF', 500);
  s = await t.until((x) => x.items.includes('crackers'), 30000, 'cracker search');
  check(true, 'Goti found crackers');
  await api('tp', 3, 3.3);
  await t.wait(800);
  await key('KeyE', 2400);
  await key('KeyF', 800);
  const sp = await api('agent', 'spanner');
  check(sp.mode === 'investigate' || (await api('agent', 'bhaloo')).mode === 'investigate', 'the cracker sends Zikomo’s men to look');
  await enterHideout(t);

  // Pakya gets caught and bluffs his way out
  await key('Digit2', 2400);
  s = await st();
  check(s.active === 'pakya' && s.scene === 'street', 'switched to Pakya on the street');
  // stepping out from under the towel gives him away
  await page.keyboard.down('KeyW');
  await t.wait(400);
  await page.keyboard.up('KeyW');
  s = await st();
  check(!s.hidden.pakya, 'moving out of a hiding place un-hides you');
  await t.until(async () => true, 10);
  for (let i = 0; i < 40 && (await api('agent', 'spanner')).mode !== 'route'; i++) await t.wait(500);
  await inFrontOf(t, 'spanner', 'pakya', 1.8);
  s = await t.until((x) => !!x.dialogue && x.dialogue.script === 'zikomo', 25000, 'Pakya to be caught and dragged to Zikomo');
  check(s.mstate.caught === 1, 'caught once');
  await t.shot('zik-caught');
  await advance();
  await choose('somebody important');
  await advance();
  await choose('income tax');
  await advance();
  s = await st();
  check(s.lies.beliefs.zikomo?.['pakya.job']?.value === 'income tax officer', 'Zikomo now believes Pakya is an income tax officer');
  await t.wait(1200);
  await enterHideout(t);

  // Sam brings up the rear
  await key('Digit1', 2400);
  await enterHideout(t);
  s = await t.until((x) => x.dialogue?.script === 'zik_safe' || x.missions.zikomo.startsWith('done'), 12000, 'all four in the hideout');
  await advance();
  s = await t.until((x) => x.missions.zikomo.startsWith('done'), 8000, 'Zikomo mission to complete');
  check(true, 'all four reached the hideout: mission complete');
  await t.until((x) => x.missions.dhol.startsWith('active'), 8000, 'Find the Dhol to start');
  check(true, 'Find the Dhol started');
}

export async function zikomoDeal(t) {
  const { st, api, key, advance, choose } = t;
  await api('jumpTo', 'zikomo');
  await t.wait(2500);
  await t.near('zikomo', 1.0, 1.0);
  await key('KeyE', 600);
  await advance();
  await choose('Offer a deal');
  await advance();
  const s = await t.until((x) => x.missions.zikomo.startsWith('done'), 8000, 'deal to end the mission');
  check(s.flags.deal, 'Sam made a deal with Zikomo instead (alternative approach)');
}

export async function zikomoFail(t) {
  const { api, page } = t;
  await api('jumpTo', 'zikomo');
  await t.wait(2500);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ mstate: { ...g.getState().mstate, caught: 2 } });
  });
  await inFrontOf(t, 'bhaloo', 'sam', 1.8);
  const s = await t.until((x) => !!x.failure, 25000, 'third capture');
  check(s.failure.reason.includes('three times'), 'caught a third time: mission failed');
}
