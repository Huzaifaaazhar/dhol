export interface ObjectiveDef {
  id: string; // full id "mission.obj"
  text: string;
  hint?: string;
  /** not needed to finish the mission */
  optional?: boolean;
}

export interface MissionDef {
  id: string;
  title: string;
  intro: string;
  objectives: ObjectiveDef[];
  next?: string;
  /** don't start `next` automatically (an interval card starts it) */
  holdNext?: boolean;
  /** runs on live timers and patrols: reloading restarts it from its checkpoint */
  live?: boolean;
  /** part of the story this belongs to */
  part: 1 | 2 | 3;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'rent',
    title: 'Rent Day',
    intro: 'It is the first of the month. Tiwari-ji wants six thousand rupees. You have zero.',
    objectives: [
      { id: 'rent.meet', text: 'Wake up the gang: switch to each friend', hint: 'Press 1–4, or Tab to cycle' },
      { id: 'rent.leave', text: 'Get out of the house past Tiwari-ji', hint: 'Someone who lies well, or panics well' },
    ],
    next: 'chai',
    part: 1,
  },
  {
    id: 'chai',
    title: 'Chai on Credit',
    intro: 'No breakfast. No money. But Bablu’s chai stall is right at the crossing.',
    objectives: [{ id: 'chai.get', text: 'Get four cups of chai from Bablu', hint: 'Bablu respects a good business deal' }],
    next: 'job',
    part: 1,
  },
  {
    id: 'job',
    title: 'The First Honest Rupee',
    intro: 'Bablu says Lalaji’s soda fridge has been cursed for a week. Lalaji pays for miracles.',
    objectives: [
      { id: 'job.ask', text: 'Ask Lalaji about the job at his store' },
      { id: 'job.fix', text: 'Fix the cursed soda fridge', hint: 'Sensible people already tried. Send Goti.' },
    ],
    next: 'plan',
    part: 1,
  },
  {
    id: 'plan',
    title: 'The Grand Plan',
    intro: 'Two hundred rupees down, five thousand eight hundred to go. Time for a meeting.',
    objectives: [
      { id: 'plan.go', text: 'Meet at the hideout down the narrow lane' },
      { id: 'plan.board', text: 'Hold a strategy meeting at the plan board' },
    ],
    next: 'ritu',
    part: 1,
  },
  {
    id: 'ritu',
    title: 'Hello, Neighbour',
    intro: 'New neighbours moved into the big yellow bungalow. The gossip says money. The plan says charm.',
    objectives: [
      { id: 'ritu.in', text: 'Get past Daadi at the bungalow door', hint: 'Daadi trusts officials, and pities the weak' },
      { id: 'ritu.impress', text: 'Impress Ritu: every friend gets one try', hint: 'Talk to Ritu as each friend' },
    ],
    next: 'rich',
    holdNext: true,
    part: 1,
  },
  /* ───────────────────────── PART 2 ───────────────────────── */
  {
    id: 'rich',
    title: 'The Rich Girl Plan',
    intro: 'All four of them have decided Ritu is the one. Unfortunately, all four of them have decided this.',
    part: 2,
    objectives: [
      { id: 'rich.learn', text: 'Find out what Ritu likes (2 things)', hint: 'Daadi, the kids and Lalaji all know her. Goti could search her garden.' },
      { id: 'rich.moves', text: 'Every friend makes his move on Ritu', hint: 'She walks around the colony. Leave the others somewhere (Q) or they butt in.' },
      { id: 'rich.result', text: 'Find out what Ritu is hiding', hint: 'Keep her trust up. Lies have a way of getting back to Daadi.' },
    ],
    next: 'jai',
  },
  {
    id: 'jai',
    title: 'Who Exactly Is Jai?',
    intro: 'A stranger in a cap keeps watching the yellow bungalow. Everyone in the colony has heard a different story about him.',
    part: 2,
    objectives: [
      { id: 'jai.stories', text: 'Ask around: what did Jai tell people?', hint: 'Bablu, Lalaji, Pappu and Tiwari-ji have all met him.' },
      { id: 'jai.proof', text: 'Get proof of who Jai really is', hint: 'Search his bag (Goti), follow him unseen, or talk Pappu into opening his register (Sam).' },
      { id: 'jai.confront', text: 'Confront Jai' },
    ],
    next: 'zikomo',
  },
  {
    id: 'zikomo',
    title: 'Zikomo Is Looking for You',
    intro: 'A white car. White shoes. Two very large men. Zikomo wants to talk to “the four idiots”, and the whole colony knows who that means.',
    part: 2,
    live: true,
    objectives: [
      { id: 'zikomo.gather', text: 'Get all four friends to the hideout without being caught', hint: 'Switch between them. Hide (E) behind carts. Maru on watch shows where the goons are looking.' },
      { id: 'zikomo.deal', text: 'Or: walk up to Zikomo and make a deal', optional: true },
    ],
    next: 'dhol',
  },
  {
    id: 'dhol',
    title: 'Find the Dhol',
    intro: 'Rahul’s dhol. Zikomo wants it. Jai wants it kept safe. Nobody knows where it went.',
    part: 2,
    live: true,
    objectives: [
      { id: 'dhol.trail', text: 'Follow the trail of the missing dhol', hint: 'Start with Daadi. Every person in the chain blames the next one.' },
      { id: 'dhol.find', text: 'Find the dhol itself', hint: 'Follow the paw prints. Goti finds things nobody else can.' },
      { id: 'dhol.bring', text: 'Carry the dhol to the hideout without being seen', hint: 'It is heavy. Hand it to another friend with E if you need to.' },
      { id: 'dhol.open', text: 'Examine the dhol at the hideout' },
    ],
    next: 'chaos',
  },
  {
    id: 'chaos',
    title: 'Everything Goes Wrong',
    intro: 'Zikomo is coming to search the hideout at sunset. Four jobs, four idiots, one clock.',
    part: 2,
    live: true,
    objectives: [
      { id: 'chaos.plan', text: 'Sam: choose the plan at the plan board' },
      { id: 'chaos.fake', text: 'Get a fake dhol into the hideout', optional: true, hint: 'Sam’s plan decides how: borrow one from Lalaji, or Goti builds one.' },
      { id: 'chaos.hide', text: 'Hide the real dhol at home, under Maru’s charpai', optional: true, hint: 'Tiwari-ji is watching the door. Pakya can keep him busy.' },
      { id: 'chaos.survive', text: 'Survive Zikomo’s visit at sunset' },
    ],
    next: 'reveal',
    holdNext: true,
  },
  /* ───────────────────────── PART 3 ───────────────────────── */
  {
    id: 'reveal',
    title: 'The Missing Drum Mystery',
    intro: 'Zikomo opened his “dhol” this morning and found a biscuit tin. Meanwhile, Rahul’s sealed packet is still in your pocket.',
    part: 3,
    objectives: [
      { id: 'reveal.packet', text: 'Open Rahul’s packet at the hideout' },
      { id: 'reveal.cinema', text: 'Get inside the old Shree Talkies cinema', hint: 'Its back door is behind the cinema, past the junk pile. Pappu’s family once ran the projector.' },
      { id: 'reveal.locker', text: 'Open locker 47 in the cinema lobby' },
      { id: 'reveal.drum', text: 'Find what is hidden inside the real dhol', hint: 'Knock along it. Only Goti can hear the difference. If Tiwari-ji has it, get it back first.' },
      { id: 'reveal.rahul', text: 'Find out who has been living in the projection booth' },
      { id: 'reveal.daadi', text: 'Ask Daadi how Rahul looked after his dhol', optional: true },
    ],
    next: 'finale',
  },
  {
    id: 'finale',
    title: 'Four Friends, One Disaster',
    intro: 'Tonight, at Bablu’s chai stall, the colony gets its money back in front of Zikomo. That is the plan. Plans and this gang do not mix.',
    part: 3,
    live: true,
    objectives: [
      { id: 'finale.drum', text: 'Goti: find the dhol (Shambhu’s cart has it now)', hint: 'Shambhu walks the main road. Search his cart.' },
      { id: 'finale.stall', text: 'Pakya: keep Zikomo talking at the plaza', hint: 'His questions test every lie the gang ever told him.' },
      { id: 'finale.witness', text: 'Sam: bring at least two witnesses to the chai stall', hint: 'People who were lied to will not come. Come clean, or smooth things over.' },
      { id: 'finale.watch', text: 'Maru: keep Zikomo’s men away from the dhol', optional: true },
      { id: 'finale.chicken', text: 'Get the rubber chicken back from Zikomo’s car', optional: true, hint: 'The winning lottery ticket is inside it.' },
      { id: 'finale.deliver', text: 'Bring the dhol to the chai stall before nightfall' },
    ],
    next: 'epilogue',
  },
  {
    id: 'epilogue',
    title: 'Shanti Nagar, After',
    intro: 'Whatever happened, happened. The colony is still here, and so are the four of them.',
    part: 3,
    objectives: [{ id: 'epilogue.roam', text: 'Wander the colony. Everyone has something to say about what you did.' }],
  },
];

export const MISSION_MAP = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export const SECRETS: Record<string, string> = {
  mirror: 'Pakya’s reflection is very pleased with itself.',
  charpai: 'Found ₹50 under Maru’s charpai.',
  cow: 'Goti and Gauri the cow had a deep conversation.',
  poster: 'The cinema poster wall has… opinions.',
  hairoil: 'Lalaji’s miracle hair oil is mostly hope.',
  dartboard: 'The hideout dartboard has a familiar face on it.',
  scooter: 'The dead scooter plays one song. Only one.',
  barber: 'Pakya got the “Hero Cut”. It cost nothing. Somehow.',
  pigeons: 'Maru vs. forty pigeons. The pigeons won.',
  tank: 'Somebody’s secret stash in the water drum: a love letter. Not yours.',
  reels: 'The last film Shree Talkies ever showed was called “Four Idiots and a Drum”. Huh.',
};
