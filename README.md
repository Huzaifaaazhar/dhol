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
| Esc | Menu: missions, save/load, controls, secrets, restart mission |
| M | Mute |

**Touch screens** get their own layout: a drag pad (bottom left) to walk, push it to the edge to run;
friend circles to switch; a labelled action button for whatever is in front of you; an ability button;
tap the dialogue to continue and tap a reply to choose.

Progress autosaves in the browser (`localStorage`). The menu also has three manual save slots,
and a *Restart this mission* option.

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

## Part 3: the big reveal and the final mission

- **The Missing Drum Mystery.** Rahul’s packet, a key from the barber, a locker in the abandoned
  Roxy cinema, a projector booth with the reels Rahul hid in. Goti knocks the drum (one side sounds
  wrong), Daadi explains drum skins, and the false bottom opens: ₹40 lakh in Zikomo’s money.
- **Four Friends, One Disaster.** A timed final mission at dusk. Shambhu the kabadiwala has the drum
  on his cart; Zikomo waits in the plaza; his men hunt the lanes. Goti finds the drum, Pakya keeps
  Zikomo talking, Sam gathers witnesses, Maru keeps watch, and the drum must reach the chai stall
  before nightfall. Everything you did earlier changes it: whom you lied to, how suspicious Zikomo
  is, whether Jai and Ritu trust you, how well the gang got on.
- **Four endings, none random:** the plan works; the lies collapse; one friend’s mess lands on
  everyone; or chaos that somehow turns out fine. The epilogue names what you actually did.
- **People move between buildings.** Tiwari-ji walks into your room to inspect it; a goon chasing
  you through a door may follow you in and look round (hide behind the door); Ramesh the postman
  delivers to the shop and your room between the missions.
- **Presentation:** faces that blink, talk and react; speaker portraits; afternoon, sunset, morning and
  dusk lighting that follows the story; street lamps; footsteps and a tension rhythm in live missions;
  NPCs with routines; iris transitions between places.

## Tests

```bash
npm test          # unit tests (vitest)
npm run dev       # in another terminal
npm run e2e       # browser playthroughs: every mission, all four endings, mobile, save/load
```

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full decision record.

```
src/game/      pure game logic: store, save, input, dialogue/effects runner, collision, audio
src/game/lies.ts      the lie ledger (claims, beliefs, suspicion, gossip)
src/game/sim/         world clock, NPC agents, friend tasks, noise
src/game/missions/    one director per live mission (Part 2 and the Part 3 reveal and finale)
src/game/endings.ts   how the finale ends, decided from what the player did
src/game/saves.ts     manual save slots
src/game/data  content: characters, NPCs, missions, dialogue, scene layouts
src/render/    React Three Fiber scene graph: characters, buildings, props, ambient life
src/ui/        DOM overlay: dialogue, objective sign, roster, menus
src/intro/     opening sequence timeline
```
