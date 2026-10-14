# QA Checklist — Blue Bloom Crossing

## Build and manifest checks

Run:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_one --pretty
npm run tools:list-level-objects -- level_one --pretty
npm run tools:run-scene-smoke -- level_one --pretty
npm run tools:validate-missing-colliders -- level_one --pretty
npm run tools:validate-float-colliders -- level_one --pretty
```

If shared Love Letter/collision code changes, also run:

```bash
npm run tools:run-scene-smoke -- tutorial --pretty
npm run tools:run-scene-smoke -- level_two --pretty
```

## Functional smoke expectations

- Level One loads.
- Old wooden bridge visuals are gone.
- River is widened to four water columns.
- Frog cannot walk into water.
- Human cannot cross before button.
- Frog can jump left bank → lily pad.
- Frog can stand on lily pad.
- Frog can jump lily pad → right/button side.
- Frog can press blue button.
- Blue bloom mats animate/reveal and dock.
- Mats are not walkable while moving.
- Final crossing is walkable after docking.
- Human can cross left mat → lily pad → right mat.
- Love Letter rises/reveals from right-side mat.
- Frog cannot collect Love Letter.
- Human collects Love Letter and completes Level One.

## Visual screenshot QA

Inspect:
- start/default camera;
- frog on lily pad;
- blue button area;
- mats held before button;
- mats docked after button;
- Love Letter on right mat;
- human crossing;
- completion;
- narrow/mobile-ish viewport.

## Dialogue QA

- No overlapping rapid dialogue bubbles.
- No repeated water/lily/button lines every frame.
- Text stays short and cozy.
- Existing Tutorial dialogue is unchanged.
- Level Two is unchanged.

## Collision QA

- No actor embedding in lily pad or flower mats.
- No walking on water outside explicit surfaces.
- No invisible old bridge deck left behind.
- No flower mat prop overlap with button, actors, Love Letter, or spawn.
- Walkable proxies match visible surfaces closely enough for default camera readability.
