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
  // step out from behind the bench
  await page.keyboard.down('KeyW');
  await t.wait(400);
  await page.keyboard.up('KeyW');
  await inFrontOf(t, 'bhaloo', 'sam', 1.8);
  const s = await t.until((x) => !!x.failure, 25000, 'third capture');
  check(s.failure.reason.includes('three times'), 'caught a third time: mission failed');
}

/* ═════════ 4. FIND THE DHOL ═════════ */
export async function dhol(t) {
  const { st, api, key, advance, choose, page } = t;
  await api('jumpTo', 'dhol');
  await t.wait(1500);
  let s = await st();
  check(s.dhol === 'junk', 'the dhol is lost somewhere in the colony');
  check((await api('agentIds')).includes('shambhu'), 'Shambhu the kabadiwala is doing his rounds');

  // 1. Daadi, inside the bungalow
  await api('tp', -28, -11.2);
  await t.wait(800);
  await key('KeyE', 2400);
  await api('tp', -3.0, -1.8);
  await t.wait(800);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.flags['clue.daadi'], 'Daadi sold it to Shambhu for forty rupees');
  await api('tp', 4, 4.2);
  await t.wait(800);
  await key('KeyE', 2400);

  // 2. Shambhu, wherever his rounds have taken him
  await t.near('shambhu', 0.9, 0.9);
  await key('KeyE', 600);
  await advance();
  await choose('Pay twenty');
  await advance();
  s = await st();
  check(s.flags['clue.shambhu'] && s.money === 230, 'paid Shambhu ₹20: he sold it to Lalaji');

  // 3. Lalaji
  await api('tp', 13.5, -6.8);
  await t.wait(800);
  await key('KeyE', 2400);
  await api('tp', -0.8, -0.2);
  await t.wait(800);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.flags['clue.lalaji'], 'Lalaji lent it to the cricket kids');
  await api('tp', 3, 3.3);
  await t.wait(800);
  await key('KeyE', 2400);

  // 4. the kids
  await api('tp', 0.6, 12.2);
  await t.wait(800);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.flags.paws && s.missions.dhol.includes('dhol.trail'), 'Moti ran off with it: paw prints appear');
  await api('tp', 9, 17.2);
  await t.wait(1500);
  await t.shot('dhol-paws');

  // Goti digs it out of the junk pile
  await api('switchFriend', 'goti');
  await t.wait(500);
  await api('tp', 22.2, 18.3);
  await t.wait(900);
  await key('KeyF', 500);
  s = await t.until((x) => x.dhol === 'lane', 40000, 'Goti to dig out the dhol');
  check(s.missions.dhol.includes('dhol.find'), 'Goti found Rahul’s dhol in the junk');
  await t.wait(800);
  await key('KeyE', 700);
  s = await st();
  check(s.dhol === 'carried:goti', 'Goti lifted the dhol');
  check((await api('agentIds')).includes('spanner'), 'Zikomo’s men turn up as soon as it is lifted');
  await t.shot('dhol-carry');

  // hand it over to Sam
  const g = await api('pos', 'goti');
  await api('tp', g[0] + 0.9, g[1], 'sam');
  await t.wait(500);
  await key('KeyE', 600);
  s = await st();
  check(s.dhol === 'carried:sam', 'Goti handed the dhol to Sam (E next to a friend)');
  await api('switchFriend', 'sam');
  await t.wait(500);
  await enterHideout(t);
  s = await st();
  check(s.dhol === 'hideout' && s.missions.dhol.includes('dhol.bring'), 'the dhol is safe in the hideout');

  // Sam can’t find the seam; Goti can
  await api('tp', 0.2, 3.2);
  await t.wait(800);
  const prompt = await page.locator('.prompt').innerText();
  check(prompt.includes('Examine the dhol') && prompt.includes('Goti could try'), 'prompt offers Sam a slow search and hints that Goti is better');
  await api('switchFriend', 'goti');
  await t.wait(2600);
  await enterHideout(t);
  await api('tp', 0.2, 3.2);
  await t.wait(800);
  await key('KeyF', 500);
  s = await t.until((x) => x.dialogue?.script === 'dhol_open', 30000, 'Goti to find the hidden packet');
  await advance();
  s = await t.until((x) => x.missions.dhol.startsWith('done'), 8000, 'dhol mission complete');
  check(s.items.includes('packet'), 'a sealed packet was sewn inside the drum');
  await t.until((x) => x.missions.chaos.startsWith('active'), 10000, 'Everything Goes Wrong to start');
  check(true, 'Everything Goes Wrong started');
}

export async function dholFail(t) {
  const { api, key } = t;
  await api('jumpTo', 'dhol', { paws: true, 'clue.kids': true }, { dhol: 'lane' });
  await t.wait(1500);
  await api('tp', 22.2, 18.6);
  await t.wait(900);
  await key('KeyE', 700);
  let s = await t.st();
  check(s.dhol === 'carried:sam', 'Sam picked up the dhol');
  await t.wait(800);
  await t.page.keyboard.down('KeyS');
  await t.wait(300);
  await t.page.keyboard.up('KeyS');
  await inFrontOf(t, 'spanner', 'sam', 1.8);
  s = await t.until((x) => !!x.failure, 30000, 'Spanner to catch the carrier');
  check(s.failure.reason.includes('Spanner') && s.dhol === 'zikomo', 'caught carrying the dhol: Zikomo has it, mission failed');
}

/* ═════════ 5. EVERYTHING GOES WRONG ═════════ */
async function exitHideout(t) {
  await t.api('tp', 3.5, 3.9);
  await t.wait(800);
  await t.key('KeyE', 2400);
}

export async function chaos(t) {
  const { st, api, key, advance, choose, page } = t;
  await api('jumpTo', 'chaos');
  await t.until((x) => x.dialogue?.script === 'chaos_intro', 10000, 'Pinky’s warning');
  await advance();
  let s = await st();
  check(s.scene === 'hideout' && s.dhol === 'hideout', 'everyone is in the hideout with the real dhol');

  // Sam makes the plan
  await api('tp', 2.4, -2.5);
  await t.wait(800);
  await key('KeyF', 600);
  await advance();
  await choose('Plan B');
  await advance();
  s = await st();
  check(s.missions.chaos.includes('chaos.plan') && s.mstate.timerEnd > 0, `plan B chosen: the sunset clock is running`);
  check((await page.locator('.timer').count()) === 1, 'the sunset clock is on screen');

  // Pakya keeps Tiwari-ji talking
  await key('Digit2', 700);
  await exitHideout(t);
  await api('tp', -10.6, -5.9);
  await t.wait(900);
  await key('KeyF', 600);
  s = await st();
  check(s.tasks.some((x) => x.who === 'pakya' && x.kind === 'stall'), 'Pakya is keeping Tiwari-ji talking');
  check((await api('agent', 'tiwari')).mode === 'stalled', 'Tiwari-ji is stuck in conversation');
  s = await t.until((x) => !!x.question, 30000, 'Tiwari-ji to ask Pakya something');
  check(s.question.npc === 'tiwari', `Tiwari-ji asks: “${s.question.prompt}”`);
  await t.shot('chaos-question');
  await key('Digit1', 700);
  s = await st();
  check(s.lies.claims.some((c) => c.by === 'pakya' && c.to === 'tiwari'), 'Pakya’s answer went into the lie ledger');

  // Goti starts scavenging; the world keeps going while we switch away
  await key('Digit3', 2600);
  await exitHideout(t);
  await api('tp', -20.1, 12.6);
  await t.wait(900);
  await key('KeyF', 600);
  s = await st();
  const g0 = s.tasks.find((x) => x.who === 'goti')?.elapsed ?? -1;
  check(g0 >= 0, 'Goti is searching the laundry line for rope');

  // Maru takes the lookout post at the mouth of the lane, once Spanner has moved on
  await key('Digit4', 2600);
  for (let i = 0; i < 80; i++) {
    const a = await api('agent', 'spanner');
    if (Math.hypot(a.x + 20, a.z - 10) > 10) break;
    await t.wait(500);
  }
  await exitHideout(t);
  await api('tp', -20, 10.0);
  await t.wait(900);
  await key('KeyF', 600);
  s = await st();
  check(s.tasks.some((x) => x.who === 'maru' && x.kind === 'watch'), 'Maru is keeping watch');
  check((s.tasks.find((x) => x.who === 'goti')?.elapsed ?? 99) > g0 || s.items.includes('rope'), 'Goti’s search kept running while we set up Maru');
  s = await t.until((x) => x.items.includes('rope'), 30000, 'rope');
  check(true, 'Goti found rope while nobody was controlling him');

  // more parts: biscuit tin and a tabla skin
  await api('switchFriend', 'goti');
  await t.wait(500);
  for (const [x, z, item] of [
    [14.0, 12.0, 'tin'],
    [28.2, -6.7, 'skin'],
  ]) {
    await api('tp', x, z);
    await t.wait(900);
    await key('KeyF', 600);
    s = await t.until((y) => y.items.includes(item), 40000, item);
    check(true, `Goti found the ${item}`);
  }
  await enterHideout(t);
  await api('tp', 1.9, 2.6);
  await t.wait(900);
  await key('KeyF', 600);
  s = await t.until((x) => x.mstate.fake === 'hideout', 40000, 'the fake dhol to be built');
  check(s.missions.chaos.includes('chaos.fake'), 'Goti built a fake dhol from a tin, rope and a tabla skin');

  // a question may be waiting for Pakya; answer anything pending
  s = await st();
  if (s.question) {
    await api('switchFriend', 'pakya');
    await t.wait(2600);
    await key('Digit1', 600);
  }

  // Sam carries the real dhol home while Pakya keeps Tiwari-ji busy
  await api('switchFriend', 'sam');
  await t.wait(2600);
  s = await st();
  check(s.scene === 'hideout', 'back to Sam in the hideout');
  await api('tp', 0.2, 3.0);
  await t.wait(900);
  await key('KeyE', 600);
  s = await st();
  check(s.dhol === 'carried:sam', 'Sam picked up the real dhol');
  await exitHideout(t);
  await api('tp', -14, -6.9);
  await t.wait(900);
  s = await st();
  check(s.dhol === 'carried:sam', 'Tiwari-ji didn’t notice: Pakya kept him busy');
  await key('KeyE', 2400);
  await api('tp', -3.9, 1.6);
  await t.wait(900);
  const p = await page.locator('.prompt').innerText();
  check(p.includes('Hide the real dhol'), 'the charpai offers to hide the real dhol');
  await key('KeyE', 700);
  s = await st();
  check(s.dhol === 'house' && s.missions.chaos.includes('chaos.hide'), 'the real dhol is under Maru’s charpai');

  // fast-forward to sunset
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ mstate: { ...g.getState().mstate, timerEnd: window.__dhol.api.now() + 2 } });
  });
  s = await t.until((x) => x.dialogue?.script === 'chaos_end', 20000, 'Zikomo to arrive at sunset');
  check(s.flags['end.fake'], 'Zikomo found the fake dhol');
  await t.shot('chaos-sunset');
  await advance();
  s = await t.until((x) => x.partEnded === 'part2', 10000, 'end of Part 2');
  check(s.missions.chaos.startsWith('done'), 'Everything Goes Wrong complete: Part 2 ends');
  await t.wait(1500);
  await t.shot('part2-end');
}

/* Maru panics and runs past Tiwari-ji, wrecking Pakya's "sick in bed" story */
export async function chaosPanic(t) {
  const { st, api, page } = t;
  await api('jumpTo', 'chaos', {}, {
    lies: { claims: [], suspicion: {}, contradictions: [], stories: {}, beliefs: { tiwari: { 'maru.health': { value: 'Sick in bed', by: 'pakya', t: 0 } } } },
  });
  await t.until((x) => x.dialogue?.script === 'chaos_intro', 10000, 'intro');
  await t.advance();
  await api('switchFriend', 'maru');
  await t.wait(400);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ where: { ...g.getState().where, maru: 'street' }, panic: 99 });
  });
  const sp = await api('agent', 'spanner');
  await api('tp', sp.x + 3, sp.z + 3, 'maru');
  const s = await t.until((x) => x.lies.contradictions.some((c) => c.npc === 'tiwari' && c.topic === 'maru.health'), 20000, 'Maru’s panic to reach Tiwari-ji');
  check(s.lies.suspicion.tiwari >= 20, 'Tiwari-ji saw “sick” Maru sprinting past: suspicion up');
  check(s.stats['gang.harmony'] < 60, 'Pakya blames Maru: harmony drops');
}

/* Sunset with the real dhol still in the hideout: Zikomo takes it */
export async function chaosFail(t) {
  const { api, page } = t;
  await api('jumpTo', 'chaos');
  await t.until((x) => x.dialogue?.script === 'chaos_intro', 10000, 'intro');
  await t.advance();
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    window.__dhol.api.completeObjective('chaos.plan');
    g.setState({ mstate: { ...g.getState().mstate, timerEnd: window.__dhol.api.now() + 2 } });
  });
  const s = await t.until((x) => !!x.failure, 20000, 'sunset failure');
  check(s.dhol === 'zikomo' && s.failure.reason.includes('real dhol'), 'real dhol left in the hideout at sunset: Zikomo takes it, mission failed');
}

/* ═════════ Part 1 regression ═════════ */
export async function part1Start(t) {
  const { st, key, advance, choose, page } = t;
  await key('KeyX', 1500); // boot
  await key('Escape', 2500); // skip intro
  await key('Enter', 3000); // start the story
  let s = await st();
  check(s.mode === 'play' && s.scene === 'house' && s.missions.rent.startsWith('active'), 'new game starts in the rented room');
  await page.keyboard.down('KeyD');
  await t.wait(800);
  await page.keyboard.up('KeyD');
  for (const k of ['Digit2', 'Digit3', 'Digit4', 'Digit1']) await key(k, 500);
  s = await st();
  check(s.missions.rent.includes('rent.meet'), 'switching to every friend wakes the gang');
  check(Object.values(s.where).every((w) => w === 'house') && !Object.values(s.posted).some(Boolean), 'outside split-up missions the gang still sticks together');
  await t.api('tp', 3.5, 3.9);
  await t.wait(800);
  await key('KeyE', 2600);
  s = await st();
  check(s.scene === 'street' && s.dialogue?.script === 'tiwari', 'Tiwari-ji blocks the door');
  check(Object.values(s.where).every((w) => w === 'street'), 'the whole gang came outside together');
  await advance();
  await choose('somebody important');
  await advance();
  await choose('Income Tax');
  await advance();
  s = await st();
  check(s.missions.rent.startsWith('done'), 'Rent Day still completes');
  check(s.lies.beliefs.tiwari?.['pakya.job']?.value === 'income tax officer', 'Part 1 bluffs are recorded in the lie ledger');
}

export async function interval(t) {
  const { st, api, key, advance } = t;
  await api('jumpTo', 'ritu', { 'ritu.in': true });
  await api('completeObjective', 'ritu.in');
  await t.wait(1000);
  await api('tp', -28, -11.2);
  await t.wait(800);
  await key('KeyE', 2400);
  for (const k of ['Digit1', 'Digit2', 'Digit3', 'Digit4']) {
    await key(k, 500);
    await api('tp', 1.2, -0.4);
    await t.wait(800);
    await key('KeyE', 600);
    await advance();
  }
  let s = await t.until((x) => x.partEnded === 'part1', 15000, 'the interval card');
  check(s.missions.ritu.startsWith('done') && s.missions.rich.startsWith('locked'), 'Part 1 ends on the interval card; Part 2 waits');
  await t.shot('interval');
  await t.wait(1500);
  await key('Enter', 1500);
  s = await st();
  check(!s.partEnded && s.missions.rich.startsWith('active'), 'closing the interval starts The Rich Girl Plan');
}

/* ═════════ PART 3: THE MISSING DRUM MYSTERY ═════════ */
async function goThroughDoor(t, x, z, ms = 2500) {
  await t.api('tp', x, z);
  await t.wait(900);
  await t.key('KeyE', ms);
}

export async function reveal(t) {
  const { st, api, key, advance, choose, page } = t;
  await api('jumpTo', 'reveal', { 'end.fake': true, 'jai.met': true }, { dhol: 'house', items: ['packet'] });
  await t.wait(1500);
  let s = await st();
  check(s.missions.reveal.startsWith('active'), 'The Missing Drum Mystery is active');

  // 1. the packet, at the hideout
  await goThroughDoor(t, -20.3, 18.6);
  await api('tp', 1.4, 2.5);
  await t.wait(900);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.items.includes('lockerkey') && s.items.includes('halfnote') && s.missions.reveal.includes('reveal.packet'), 'discovery 1: a locker key, half a ₹500 note and Rahul’s letter');
  await goThroughDoor(t, 3.5, 3.9);

  // 2. Pappu lends the cinema key (Sam, honestly)
  await api('tp', 25, -5.6);
  await t.wait(900);
  await key('KeyE', 500);
  await advance();
  await choose('Ask for the key honestly');
  await advance();
  s = await st();
  check(s.flags['cinema.open'], 'discovery 2: Pappu hands over his uncle’s cinema key (and mentions a light in the booth)');
  await goThroughDoor(t, 27.8, 22.4);
  s = await st();
  check(s.scene === 'cinema' && s.missions.reveal.includes('reveal.cinema'), 'inside Shree Talkies');
  await t.shot('reveal-cinema');

  // 3. locker 47
  await api('tp', -1.6, -2.9);
  await t.wait(900);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(s.items.includes('register') && s.missions.reveal.includes('reveal.locker'), 'discovery 3: Zikomo’s lottery book, and the winning ticket was #4444');
  // the booth hums but stays shut
  await api('tp', -4.6, -1.4);
  await t.wait(900);
  await key('KeyE', 500);
  await advance();
  s = await st();
  check(!s.flags['rahul.out'], 'someone is humming in the bolted projection booth');
  await goThroughDoor(t, 4.5, 4.3);

  // 4. Goti knocks along the real dhol under Maru's charpai
  await goThroughDoor(t, -14, -7.3);
  await api('switchFriend', 'goti');
  await t.wait(500);
  await api('tp', -3.9, 1.6);
  await t.wait(900);
  await key('KeyF', 600);
  await advance();
  await choose('left skin');
  await advance();
  s = await st();
  check(!s.flags['drum.open'], 'a wrong knock just sounds like a drum');
  await choose('beside the strap');
  await advance();
  s = await st();
  check(s.flags['drum.open'] && s.missions.reveal.includes('reveal.drum'), 'discovery 4: the hollow side, and ₹4,44,444 in a false wall');
  await t.shot('reveal-cash');

  // 5. the booth opens to the code
  await goThroughDoor(t, 3.5, 3.9);
  await goThroughDoor(t, 27.8, 22.4);
  await api('tp', -4.6, -1.4);
  await t.wait(900);
  await key('KeyE', 500);
  await advance();
  await choose('The music is in the drum');
  await advance();
  s = await t.until((x) => x.missions.reveal.startsWith('done'), 10000, 'the reveal to finish');
  check(s.flags['rahul.out'], 'discovery 5: Rahul has been living in the projection booth');
  await t.until((x) => x.missions.finale.startsWith('active'), 10000, 'the final mission to start');
  check(true, 'Four Friends, One Disaster started');
  await t.wait(1200);
  await t.shot('finale-start');
}

/* ═════════ PART 3: FOUR FRIENDS, ONE DISASTER ═════════ */
const FINALE_FLAGS = { 'end.fake': true, 'locker.open': true, 'drum.open': true, 'rahul.out': true, 'packet.open': true };

async function answerAs(t, wantClash) {
  const opts = t.page.locator('.question-opts li');
  const n = await opts.count();
  if (!n) return false;
  let pick = 0;
  for (let i = 0; i < n; i++) {
    const txt = await opts.nth(i).innerText();
    const clash = txt.includes('clashes');
    if (clash === wantClash) {
      pick = i;
      break;
    }
  }
  await t.key(`Digit${pick + 1}`, 600);
  return true;
}

async function waitFor(t, label, fn, timeout = 40000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return true;
    await t.wait(400);
  }
  throw new Error('timed out: ' + label);
}

/** Goti finds Shambhu on the safe side of the road and searches his cart. */
async function gotiGetsDrum(t) {
  await t.api('switchFriend', 'goti');
  await t.wait(500);
  await waitFor(t, 'Shambhu on the south side', async () => (await t.api('agent', 'shambhu')).z > 4, 90000);
  await t.near('shambhu', 1.0, 1.0);
  await t.key('KeyF', 600);
  let s = await t.st();
  check(s.tasks.some((x) => x.who === 'goti' && x.source.includes('cart')), 'Goti is searching Shambhu’s cart (Shambhu stops to haggle)');
  s = await t.until((x) => x.dhol === 'carried:goti', 40000, 'Goti to find the drum');
  check(s.missions.finale.includes('finale.drum'), 'Goti found the dhol in Shambhu’s cart');
}

async function pakyaStallsZikomo(t, clashes) {
  await t.api('switchFriend', 'pakya');
  await t.wait(500);
  await waitFor(t, 'Zikomo at the plaza', async () => {
    const z = await t.api('agent', 'zikomo');
    return Math.hypot(z.x - 14.6, z.z - 9.4) < 1.5;
  });
  await t.api('tp', 13.4, 9.0);
  await t.wait(900);
  await t.key('KeyF', 600);
  const s = await t.st();
  check(s.tasks.some((x) => x.who === 'pakya' && x.kind === 'stall'), 'Pakya is keeping Zikomo talking');
  let answered = 0;
  const t0 = Date.now();
  while (answered < (clashes ? 2 : 1) && Date.now() - t0 < 60000) {
    if (await answerAs(t, clashes)) answered++;
    await t.wait(400);
  }
  return answered;
}

async function samBrings(t, npc, x, z, label = 'Ask him to come') {
  await t.api('switchFriend', 'sam');
  await t.wait(400);
  await t.api('tp', x, z);
  await t.wait(900);
  await t.key('KeyE', 500);
  await t.advance();
  await t.choose(label);
  await t.advance();
  const s = await t.st();
  return !!s.flags[`witness.${npc}`];
}

async function deliver(t, who = 'goti') {
  await t.api('switchFriend', who);
  await t.wait(500);
  await t.api('tp', 11.6, 15.2);
  await t.until((x) => x.dialogue?.script === 'climax', 15000, 'the climax at the chai stall');
  await t.advance(80);
  return t.until((x) => x.endingShown, 10000, 'the ending card');
}

export async function finaleTriumph(t) {
  const { api } = t;
  await api('jumpTo', 'finale', { ...FINALE_FLAGS, 'jai.met': true }, { items: ['register', 'ticket'], stats: { 'ritu.trust': 50, 'gang.harmony': 65 } });
  await t.wait(2000);
  let s = await t.st();
  check(s.flags['jai.helps'] && !(await api('agentIds')).includes('bhaloo'), 'because you confronted Jai, he draws Bhaloo away');
  check(s.flags['witness.ritu'], 'because Ritu trusts you, she and Daadi come as witnesses');
  check(s.mstate.timerEnd - (await api('now')) > 290, 'a united gang (harmony 65) gets extra time');
  await gotiGetsDrum(t);
  // leave Goti hidden while the others work
  await api('tp', -4.1, 13.4, 'goti');
  await t.key('KeyE', 400);
  await pakyaStallsZikomo(t, false);
  check(await samBrings(t, 'tiwari', -10.6, -5.9), 'Sam convinced Tiwari-ji to come');
  check(await samBrings(t, 'pappu', 25, -5.6), 'Sam convinced Pappu to come');
  s = await t.st();
  check(s.missions.finale.includes('finale.witness'), 'two witnesses or more: objective done');
  s = await deliver(t);
  check(s.mstate.ending === 'triumph', `ending: The Rightful Owners (finale lies ${s.mstate.finaleContra}, chaos ${s.mstate.chaos})`);
  check((await t.page.locator('.ending-triumph').count()) === 1, 'the triumph ending screen is shown');
  await t.shot('ending-triumph');
  await t.key('Enter', 1200);
  s = await t.st();
  check(!s.endingShown && s.missions.epilogue.startsWith('active'), 'after the ending, the colony is free to roam (epilogue)');
}

export async function finaleCollapse(t) {
  const { api } = t;
  // Pakya told Zikomo he was a bank officer in Part 2, and Lalaji suspects everyone
  await api('jumpTo', 'finale', FINALE_FLAGS, {
    items: ['register'],
    lies: {
      claims: [{ topic: 'pakya.job', value: 'bank officer', by: 'pakya', to: 'zikomo', t: 0 }],
      suspicion: {},
      contradictions: [],
      stories: {},
      beliefs: { zikomo: { 'pakya.job': { value: 'bank officer', by: 'pakya', t: 0 }, 'gang.dhol': { value: 'Never heard of a dhol', by: 'pakya', t: 0 }, 'gang.who': { value: 'nobody, ji. Nobody.', by: 'sam', t: 0 }, 'gang.money': { value: 'What money?', by: 'pakya', t: 0 }, 'dhol.fake': { value: 'Must have been Shambhu', by: 'goti', t: 0 } } },
    },
  });
  await t.wait(2000);
  await gotiGetsDrum(t);
  await api('tp', -4.1, 13.4, 'goti');
  await t.key('KeyE', 400);
  const n = await pakyaStallsZikomo(t, true);
  const s0 = await t.st();
  check(n >= 2 && s0.mstate.finaleContra >= 2, `Pakya contradicted his old story to Zikomo ${s0.mstate.finaleContra} times`);
  check(await samBrings(t, 'tiwari', -10.6, -5.9), 'Tiwari-ji still comes');
  const s = await deliver(t);
  check(s.mstate.ending === 'collapse' && s.mstate.endingCause === 'lies', 'ending: House of Cards (the lies collapsed in front of everyone)');
  await t.shot('ending-collapse');
}

export async function finaleBlame(t) {
  const { api } = t;
  // Maru panicked his way through the whole week
  const contradictions = [0, 1, 2, 3, 4].map((i) => ({ npc: 'tiwari', topic: 'maru.health', believed: 'Sick in bed', heard: 'running around screaming', by: 'maru', earlierBy: 'pakya', t: i }));
  await api('jumpTo', 'finale', FINALE_FLAGS, { items: ['register'], stats: { 'ritu.trust': 50, 'gang.harmony': 60 }, lies: { claims: [], suspicion: {}, beliefs: {}, stories: {}, contradictions } });
  await t.wait(2000);
  await gotiGetsDrum(t);
  await api('tp', -4.1, 13.4, 'goti');
  await t.key('KeyE', 400);
  check(await samBrings(t, 'tiwari', -10.6, -5.9), 'Tiwari-ji comes');
  const s = await deliver(t);
  check(s.mstate.ending === 'blame' && s.mstate.culprit === 'maru', 'ending: One Idiot Too Many, and it is Maru (caught out five times this week)');
  check((await t.page.locator('.ending-culprit').innerText()).includes('Maru'), 'the ending screen names the culprit');
  await t.shot('ending-blame');
}

export async function finaleFortune(t) {
  const { api } = t;
  await api('jumpTo', 'finale', FINALE_FLAGS, { items: ['register'], stats: { 'ritu.trust': 20, 'gang.harmony': 60 } });
  await t.wait(2000);
  await gotiGetsDrum(t);
  await api('tp', -4.1, 13.4, 'goti');
  await t.key('KeyE', 400);
  check(await samBrings(t, 'pappu', 25, -5.6), 'only Pappu comes (Ritu does not trust you enough to bring Daadi)');
  const s = await deliver(t);
  check(s.mstate.ending === 'fortune', `ending: Raining Rupees (${s.mstate.endingCause})`);
  check((await t.page.locator('.rain span').count()) > 10, 'rupees rain across the ending screen');
  await t.shot('ending-fortune');
}

export async function finaleTimeout(t) {
  const { api, page } = t;
  await api('jumpTo', 'finale', FINALE_FLAGS, { items: ['register'] });
  await t.wait(1500);
  await page.evaluate(() => {
    const g = window.__dhol.useGame;
    g.setState({ mstate: { ...g.getState().mstate, timerEnd: window.__dhol.api.now() + 2 } });
  });
  await t.until((x) => x.dialogue?.script === 'climax', 20000, 'night to fall');
  await t.advance(80);
  const s = await t.until((x) => x.endingShown, 10000, 'ending');
  check(s.mstate.ending === 'collapse' && s.mstate.endingCause === 'time', 'nightfall without the drum: Zikomo takes it (House of Cards)');
}
