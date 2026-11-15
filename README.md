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

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full decision record.

```
src/game/      pure game logic: store, save, input, dialogue/effects runner, collision, audio
src/game/data  content: characters, NPCs, missions, dialogue, scene layouts
src/render/    React Three Fiber scene graph: characters, buildings, props, ambient life
src/ui/        DOM overlay: dialogue, objective sign, roster, menus
src/intro/     opening sequence timeline
```
