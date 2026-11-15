export interface ObjectiveDef {
  id: string; // full id "mission.obj"
  text: string;
  hint?: string;
}

export interface MissionDef {
  id: string;
  title: string;
  intro: string;
  objectives: ObjectiveDef[];
  next?: string;
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
  },
  {
    id: 'chai',
    title: 'Chai on Credit',
    intro: 'No breakfast. No money. But Bablu’s chai stall is right at the crossing.',
    objectives: [{ id: 'chai.get', text: 'Get four cups of chai from Bablu', hint: 'Bablu respects a good business deal' }],
    next: 'job',
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
  },
  {
    id: 'ritu',
    title: 'Hello, Neighbour',
    intro: 'New neighbours moved into the big yellow bungalow. The gossip says money. The plan says charm.',
    objectives: [
      { id: 'ritu.in', text: 'Get past Daadi at the bungalow door', hint: 'Daadi trusts officials, and pities the weak' },
      { id: 'ritu.impress', text: 'Impress Ritu: every friend gets one try', hint: 'Talk to Ritu as each friend' },
    ],
    next: 'part2',
  },
  {
    id: 'part2',
    title: 'To Be Continued',
    intro: 'Four friends. One neighbour. Zero rent. Part 2 is coming.',
    objectives: [{ id: 'part2.wait', text: 'Explore the colony and find every secret' }],
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
};
