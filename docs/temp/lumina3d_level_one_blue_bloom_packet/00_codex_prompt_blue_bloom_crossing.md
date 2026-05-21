# Codex Prompt — Lumina3D Level One “Blue Bloom Crossing” Pass

You are working in my local Lumina3D project files.

Implement a focused Level One revision called **Blue Bloom Crossing**. Work from the local files, inspect current source before editing, preserve the playable game at `/`, and keep `/editor/` separate from gameplay runtime. Do **not** commit, push, pull, merge, rebase, reset, or switch branches unless I explicitly ask.

## Goal

Replace the old Level One partial/complete bridge puzzle with a lily-pad + blue-flower crossing puzzle:

> The Frog Cubeling uses a central lily pad to reach a blue button. Pressing the blue button releases blue-accented floating flower mats from a visible upstream/river-edge blue flower latch. The mats drift into place, dock against the lily pad, form a human-safe crossing, and reveal the Love Letter on the right-side blue-bloom mat. The main character then crosses and collects the Love Letter.

This should stay small, stable, and Level-One-only. Do **not** add Axolotl, Crocodile, Totems, green buttons, carrying, logs, physics, or a new Cubeling.

## Source-of-truth context

Current Level One source likely lives around:

- `src/levels/levelOne.js` — layout constants, water columns, bridge/button positions, props.
- `src/scenes/levelOneScene.js` — Level One terrain/water/bridge/deck/prop construction.
- `src/main.js` — Level One button handling, Frog jump routing, water collision, Love Letter interactions, visual effect updates.
- `src/state/gameState.js` — `createLevelOneState`.
- `src/scenes/levelOneFlow.js` — Level One start/reset/arrival.
- `src/debug/visibleAssets.js` and test/render hooks — update only if existing Level One visible asset/state reporting needs it.
- Existing scene-smoke tooling under `scripts/` and `test-output/`.

The attached editor handoff says:
- Expand the Level One river by replacing ground columns 5 and 8 with water, so the river becomes columns 5, 6, 7, and 8.
- Delete/remove the old bridge visuals and old generated bridge walkable decks from Level One.
- Add a procedural lily pad centered in the widened river, roughly above Water Tile `6,4`, using the editor draft position only as a reference, not as a direct browser-source write.
- The lily pad must be a real walkable/traversable surface for Frog, and human should be able to use it as part of the final crossing after the blue blooms dock.
- The existing blue button should no longer complete a wooden bridge; it should trigger the Blue Bloom Crossing reveal.
- Tutorial, Home, and Level Two behavior must remain unchanged.

## Design requirements

### Start state

Player sees:
- widened river;
- central lily pad in the water;
- Frog Cubeling available;
- blue button on the far/right bank;
- visible blue-accented flower mats held upstream or at the river edge by a blue blossom latch/gate;
- no completed bridge/crossing yet;
- Love Letter not immediately sitting in the old fixed Level One/Tutorial position.

### Solve flow

1. Player enters Level One.
2. Human cannot cross the river.
3. Player transfers into Frog.
4. Frog jumps from the left bank to the lily pad.
5. Frog jumps from the lily pad to the right-bank/button nook.
6. Frog presses the blue button.
7. Blue flower latch opens.
8. Blue-accented flower mats drift into place.
9. One flower mat connects left bank to lily pad.
10. The second flower mat connects lily pad to right side and carries/reveals the Love Letter.
11. Player switches back to human.
12. Human crosses the Blue Bloom Crossing and collects the Love Letter.

### Color-language requirement

Because the trigger is a **blue** button, the activated mechanism must read as blue:
- blue button;
- blue flower latch/gate;
- blue-accented floating flower mats;
- optional blue dock glows/markers where mats settle against the lily pad.

Avoid dominant red flowers here, because red should remain visually available for future red/weight-button mechanics.

## Implementation requirements

### 1. River and old bridge removal

- Update Level One water columns from the old narrow river to columns `[5, 6, 7, 8]` or equivalent source constants.
- Remove old wooden bridge visuals from runtime Level One:
  - old partial bridge;
  - old complete bridge A/B;
  - old bridge deck visuals/proxies.
- Do not merely move old bridge objects offscreen. Remove/replace them from the source scene build.
- It is acceptable to keep temporary internal names like `bridgeComplete` only if that keeps the diff small, but no wooden bridge should be visible or functionally relevant in the level after this pass.

### 2. Lily pad

- Add a runtime-safe procedural lily pad helper. Do **not** import gameplay code from `src/editor/`.
- The lily pad should be centered in the widened river, visually aligned around the crossing row.
- It should have a subtle bob/wobble animation, but keep it restrained and deterministic.
- It must have an explicit walkable surface/proxy contract:
  - Frog can stand on it before and after the button press.
  - Human can use it as part of the final crossing after the blue-bloom mats dock.
  - Neither actor should be treated as walking on water; lily pad traversal should bypass water collision only inside the lily pad surface.

### 3. Blue bloom crossing mats

Create two generated blue-bloom mat groups:
- left mat: initially held upstream/at river edge, then drifts to connect left bank to the lily pad;
- right mat: initially held upstream/at river edge, then drifts to connect lily pad to the right side and reveal/carry the Love Letter.

Use generated Three.js geometry/materials if no project asset already fits:
- green/reed/leaf base;
- blue flower clusters as the clear mechanism color;
- optional white/pale pink accent flowers;
- deterministic seeded placement, not frame-random placement.

The mats should:
- be visible in a “held” position before the button, with a readable blue latch/gate;
- animate into final docked positions after the blue button press;
- become walkable only after docking, not during movement;
- not require physics or actor riding while they move.

### 4. Blue button behavior

Update the Level One button path:
- Keep the blue button trigger position unless local inspection shows it is now blocked by river/props.
- Pressing it should release/animate the blue-bloom mats, not complete a wooden bridge.
- Keep the existing button press visual if available.
- Change prompt/copy from “bridge complete” language to something like:
  - `The blue blooms drifted into place.`
  - or `The blue flowers opened a crossing.`

### 5. Frog jump routing

Replace Level One’s old “partial bridge” jump logic with lily-pad routing:
- left-bank approach zone → lily pad;
- lily pad → right-bank/button nook;
- right-bank/button nook → lily pad, if returning is needed;
- lily pad → left bank, if returning is needed.

Make the jump zones forgiving. Avoid requiring pixel-perfect facing. Prefer clear proximity + rough facing/side checks. Preserve existing Frog jump animation/hop structure where possible.

Important:
- Frog still cannot swim.
- Frog water-block feedback should still work when trying to walk into water.
- Frog can stand on the lily pad.
- Frog cannot collect the Love Letter.

### 6. Love Letter positioning

Level One should stop using the same fixed Love Letter point as Tutorial.

Add the smallest safe scene-specific position hook, for example:
- `currentLoveLetterPoint()`;
- `levelOneLoveLetterPoint()`;
- or similar.

Requirements:
- Tutorial Love Letter behavior stays unchanged.
- Level Two placeholder/elevated Love Letter behavior stays unchanged.
- In Level One, the Love Letter should reveal/rise from the right-side blue-bloom mat after the mats dock.
- Collection radius and visual bobbing should use the Level One-specific final position once revealed.
- Frog should still be blocked/reminded that it cannot pick up the Love Letter.
- Main character collects it and gets the existing Level One completion flow/message.

### 7. Dialogue and guidance

Keep dialogue cozy, short, and sparse. Use existing dialogue systems (`showPrompt`, `showSpeech`, `queueSpeech`, cooldowns/one-shot flags) rather than adding a new dialogue system.

Add only a few short lines, with flags/cooldowns so they do not spam or overlap:
- Start prompt can remain: `Find the Love Letter.`
- Frog water block: keep or reuse `I need to jump, not swim.`
- First successful lily-pad landing, optional one-shot Frog line:
  - `This leaf can hold my hops!`
  - or `A lily pad! Perfect for a little hop.`
- Button press:
  - `The blue blooms are drifting in!`
- After switching back to human once the crossing is ready:
  - `Now I can cross.`
- Frog near Love Letter:
  - `I brought it closer, but you pick it up.`

Avoid:
- multiple bubbles at once unless the existing system already queues them cleanly;
- rapid trigger loops;
- long tutorial-style explanation;
- overwhelming the first unguided level with text.

### 8. Collision and visual QA priorities

Be careful here. This pass is mostly about surfaces and collision.

Requirements:
- Every solid-looking blocker still has intentional collision.
- Every walkable crossing surface has an explicit walkable proxy/surface contract.
- Human cannot cross before the button.
- Frog cannot swim.
- Frog can stand on lily pad.
- Human can walk across left bloom mat → lily pad → right bloom mat after docking.
- Love Letter is not inside/under a mat or water surface.
- Actors should not appear embedded in flower mats or lily pad.
- Flower mats should not overlap the button, Frog, human spawn, or major props.

If needed, move the edited prop placements from the editor handoff:
- `forestTreeB 3` moved from x `11.4` to x `6`;
- `forestRock 7` moved from x `10`, z `-3.8` to x `3.75`, z `-7.5`;
but only keep them if they improve readability and do not collide with the new route.

## Out of scope

Do **not**:
- change Tutorial mechanics or copy;
- change Home flow;
- change Level Two;
- add Axolotl/Crocodile/Elephant behavior;
- add green buttons;
- add logs/dams/physics;
- rewrite architecture broadly;
- import external asset library files;
- make `/editor/` write gameplay source directly;
- remove QA/debug affordances.

## Validation commands

After applying changes, run the smallest relevant verification set available locally:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_one --pretty
npm run tools:list-level-objects -- level_one --pretty
npm run tools:run-scene-smoke -- level_one --pretty
npm run tools:validate-missing-colliders -- level_one --pretty
npm run tools:validate-float-colliders -- level_one --pretty
```

Also run Tutorial and Level Two smoke checks if the Love Letter positioning helper or shared collision code is touched:

```bash
npm run tools:run-scene-smoke -- tutorial --pretty
npm run tools:run-scene-smoke -- level_two --pretty
```

If existing Playwright smoke scripts are available for Home/Level One, run the Home → Level One regression too.

## Manual screenshot QA to capture/inspect

Capture and inspect screenshots for:
- Level One start/default desktop camera;
- widened river + lily pad before button;
- Frog standing on lily pad;
- Frog at/right near blue button;
- blue bloom mats held before press;
- blue bloom mats docked after press;
- Love Letter rising/visible on right bloom mat;
- human crossing the full route;
- Love Letter collection/completion;
- narrow/mobile-ish viewport.

## Acceptance criteria

The pass is successful when:

- Level One no longer shows or relies on wooden bridge pieces.
- The river is wider and readable.
- Frog uses the lily pad as the crossing midpoint.
- The blue button releases blue-marked flower mats.
- The flower mats visibly form the final human-safe crossing.
- The Love Letter reveals from the right-side blue-bloom mat.
- Human crosses and collects the Love Letter.
- Frog still cannot collect the Love Letter.
- Dialogue is cute, short, and non-spammy.
- Tutorial and Level Two remain unchanged.
- Build and Level One smoke/validator checks pass.
