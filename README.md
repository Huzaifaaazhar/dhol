# DHOL

**Four idiots. One big mess.**

A browser game inspired by the spirit of the 2007 Bollywood comedy *Dhol*. You play
four broke, unemployed friends (Sam, Pakya, Goti and Maru) trying to get rich in
a small, crowded neighbourhood: Shanti Nagar, Lane 4.

All writing, characters, art and sound are original and generated in code. There is no
film footage, film music or film dialogue in the game.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Walk (hold Shift to run; Maru may trip) |
| 1–4, Tab | Switch friend. The others follow you. |
| E | Talk, inspect, enter |
| F | The active friend's ability: on an object, or just to show off |
| Space / Enter | Continue dialogue; number keys pick a reply |
| Q | Tell the nearest friend to wait here, or to come along again |
| L | Pakya’s Lie Book: who was told what, and how suspicious they are |
| Esc | Menu: missions, controls, secrets, sound, restart |
| M | Mute |

Progress saves automatically in the browser (`localStorage`).

## The four friends

| Friend | Role | Ability |
| --- | --- | --- |
| Sam | The planner | Negotiate |
| Pakya | The smooth talker | Bluff, improvising identities |
| Goti | The wild card | Do something weird to objects |
| Maru | The nervous wreck | Make a scene and distract everyone |

## Part 2: missions, lies and chaos

Time never stops. Switch friends and the world keeps going: patrols keep walking, a friend left
searching keeps searching, and a question for Pakya will not wait.

- **Lies are remembered.** Every claim is recorded per NPC. Telling someone a different story, or
  gossip carrying one story to someone who heard another, raises suspicion and gets somebody blamed.
  As Pakya you can see which lines fit the story so far.
- **Abilities matter.** Sam negotiates, smooths things over (once per person per mission) and rallies
  the gang. Pakya bluffs and keeps people talking while answering their questions. Goti searches fast,
  finds hidden things and causes noisy accidents. Maru keeps watch, distracts, and panics.
- **Missions:** The Rich Girl Plan · Who Exactly Is Jai? · Zikomo Is Looking for You · Find the Dhol ·
  Everything Goes Wrong. Each can fail; failure lets you retry from the start of the mission.

## Tests

```bash
npm test          # unit tests (vitest)
npm run dev       # in another terminal
npm run e2e       # browser playthroughs of every mission (Playwright)
```

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full decision record.

```
src/game/      pure game logic: store, save, input, dialogue/effects runner, collision, audio
src/game/lies.ts      the lie ledger (claims, beliefs, suspicion, gossip)
src/game/sim/         world clock, NPC agents, friend tasks, noise
src/game/missions/    one director per Part 2 mission
src/game/data  content: characters, NPCs, missions, dialogue, scene layouts
src/render/    React Three Fiber scene graph: characters, buildings, props, ambient life
src/ui/        DOM overlay: dialogue, objective sign, roster, menus
src/intro/     opening sequence timeline
```
