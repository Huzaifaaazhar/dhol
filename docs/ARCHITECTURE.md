# ADR-001: Game architecture for DHOL (Part 1)

**Status:** Accepted
**Date:** 2026-11-15

## Context

DHOL is a browser game: a stylised 2.5D Indian neighbourhood explored by four
playable friends. The repository started empty, so there was no stack to
preserve. Requirements that shape the design:

- Angled/isometric camera, a world that *is* the interface (no dashboard).
- Keyboard movement, character switching, contextual interaction, dialogue,
  NPC reactions, missions, character abilities, persistent saves.
- Must run smoothly in an ordinary browser, with no downloaded art assets
  (everything is original and generated in code).

## Decision

React + TypeScript + Vite, rendering with React Three Fiber (three.js) and an
orthographic camera. Game state lives in a single Zustand store persisted to
`localStorage`. Per-frame data (positions, velocities) lives in a plain mutable
`runtime` object so movement never triggers React re-renders.

Content (scenes, NPCs, dialogue, missions) is plain TypeScript data. Systems
read that data; render components read the same data, so a building's
collider and its mesh always come from one definition.

```
src/
  game/                 pure game logic, no rendering
    types.ts            shared types (scenes, interactables, dialogue, effects)
    store.ts            Zustand store: mode, scene, missions, flags, dialogue, save
    runtime.ts          mutable per-frame state (entity positions, focus)
    input.ts            keyboard state + edge-triggered actions
    audio.ts            WebAudio synth: dhol rhythm, voice blips, street ambience
    collision.ts        circle-vs-AABB resolution, bounds
    effects.ts          applies declarative effects (flags, money, objectives, scene changes)
    data/
      characters.ts     the four friends: look, movement style, ability
      missions.ts       mission + objective definitions
      dialogue.ts       all dialogue scripts
      npcs.ts           NPC definitions and appearance
      scenes/*.ts       layout + colliders + interactables per scene
  render/               three.js scene graph (R3F components)
    GameWorld.tsx       picks the active scene, camera rig, lighting
    Person.tsx          procedural humanoid + per-character animation styles
    Gang.tsx            player controller + follower AI
    NPCs.tsx            NPC behaviour (idle, wander, face player, emotes)
    Ambient.tsx         pedestrians, vehicles, birds, steam
    scenes/*.tsx        visuals for each scene, built from the scene data
    props/*.tsx         reusable props (scooter, cart, pole, tree...)
  ui/                   DOM overlay (dialogue, prompts, objective sign, menus)
  intro/                cinematic opening timeline
```

### Data flow

1. `input.ts` collects keys. `Gang.tsx` reads them each frame, moves the
   active friend through `collision.ts`, steers followers, and writes positions
   into `runtime`.
2. Every few frames the interaction system finds the nearest interactable and
   writes its id to the store only when it changes (cheap re-render of the prompt).
3. `E`/`F` resolve an `Action`: open a dialogue, change scene, or apply effects.
4. Dialogue choices carry `effects`; `effects.ts` mutates the store (flags,
   money, objectives, secrets, scene changes, NPC emotes).
5. The store is persisted (`zustand/middleware/persist`); positions are copied
   from `runtime` into the store on a timer and on scene change.

## Options considered

| Option | Complexity | Look | Perf | Notes |
|---|---|---|---|---|
| **R3F + ortho camera (chosen)** | Med | True 2.5D lighting, shadows, depth | Good with low-poly | Declarative scene graph fits data-driven levels |
| Phaser / 2D isometric sprites | Med | Needs a lot of drawn sprite art | Excellent | No art pipeline available; animation would be stiff |
| Plain three.js, no React | High | Same | Same | UI overlay and state wiring would be hand-rolled |

## Consequences

- Easier: adding a location is a data file + a visual component; dialogue and
  missions are edited without touching systems.
- Harder: everything visual is procedural, so art polish is code work.
- Revisit in Part 2: a scripted-sequence (cutscene) system on top of the
  effect runner, and a richer inventory if the story needs items.

---

# ADR-002: Part 2 — a world that keeps moving, and lies that are remembered

**Status:** Accepted
**Date:** 2026-11-15

## Context

Part 2 needs four friends acting in parallel while time continues, NPCs who remember what
each friend told them, and five interconnected missions with multiple approaches, complications
and failure states. Part 1 had a single "gang follows the leader" controller and NPC logic that
only ran while its scene was on screen.

## Decision

1. **Simulation separate from rendering.** `game/sim/sim.ts` advances one world clock per frame
   in play mode (paused only by the menu, cards and scene fades). It ticks NPC agents, friend tasks,
   gossip, suspicion decay, the lookout and the active mission's director. Nothing in it depends on
   which scene is drawn, so a goon keeps walking towards the lane while you are indoors as someone else.
2. **Agents** (`sim/agents.ts`): patrols, schedules, investigate/distract/chase, view cones with a
   simple line-of-sight test. Scene NPCs from Part 1 are untouched; any NPC the simulation owns is
   drawn by `<Agents>` instead.
3. **Independent friends** (`party.ts`): each friend has a scene, a position and a "posted" flag.
   Unposted friends follow the leader; posted ones stay put. In live (split-up) missions, switching
   away leaves a friend where he is; switching to a friend in another scene transitions there.
4. **Tasks** (`sim/tasks.ts`): search (Goti 3× faster and the only one who finds hidden things;
   searches can be noisy), watch (Maru: early warnings, reveals sightlines, panics), stall
   (Pakya: the NPC is frozen but asks timed questions), wait. Tasks run on the world clock.
5. **Lie ledger** (`lies.ts`, pure and unit tested): claims, per-NPC beliefs, contradictions,
   suspicion, gossip along a social graph, confessions, and other people's stories (Jai).
   Dialogue choices carry `{ claim }` effects; branches read `believes()`/`suspicion()`.
6. **Mission directors** (`missions/*.ts`): one per live mission with `start/resume/tick/event/caught`.
   Missions start with a checkpoint snapshot; failure offers a retry that restores it.
   Live missions restart from their checkpoint when a save is continued.
7. **In-world labels** moved from drei `<Html>` (one React root per label) to a single projected DOM
   layer (`ui/WorldOverlay.tsx`), which is cheaper and avoids React 19 unmount races.

## Testing strategy

| Layer | Tool | What |
|---|---|---|
| Unit | vitest (`npm test`) | lie ledger (claims, contradictions, blame, corroboration, confession, gossip, decay), checkpoints/retry, optional objectives, save migration, ability rates |
| Browser E2E | Playwright (`npm run e2e`, dev server running) | every mission end to end through the keyboard, every failure path, the Part 1 → Part 2 bridge, Part 1 regression |

The browser tests use a dev-only `window.__dhol.api` (excluded from production builds) to jump to a
mission, teleport and read state; everything else is driven with real key presses.

## Consequences

- Easier: new missions are a data file of dialogue plus a small director.
- Harder: timers and patrols make missions non-deterministic, so tests wait on conditions rather than fixed times.
- Revisit in Part 3: NPCs crossing scenes on their own, richer line of sight, saving mid-mission director state instead of restarting live missions.
