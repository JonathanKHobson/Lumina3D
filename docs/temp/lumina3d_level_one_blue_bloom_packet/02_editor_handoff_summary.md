# Editor Handoff Summary

## Map-level note

- Expand Level One river by replacing Ground Tile columns 5 and 8 with water.
- Resulting water columns should be 5, 6, 7, 8.
- Player flow: Frog reaches button via lily pad; button releases blue flower mats; mats dock against lily pad; Love Letter rises from right-side mat; human crosses and collects it.

## Bridge removal intent

Objects marked for deletion/removal:
- `level_one.partial_bridge`
- `level_one.complete_bridge_a`
- `level_one.complete_bridge_b`
- `level_one.partial_bridge_deck`
- `level_one.complete_bridge_deck`

Do not just move these offscreen in source. Remove/replace the runtime visuals and walkable decks with the lily pad + blue bloom crossing.

## Lily pad draft placement

Editor draft:
- `level_one.draft.procedural.lilypad.tile.001`
- asset key: `procedural.lilyPad.tile`
- reference source: `src/editor/EditorProceduralAssets.js:createProceduralLilyPad`
- approximate draft transform:
  - position: x `0.25`, y `2.25`, z `0.450729`
  - rotation y `-1.047198`
  - scale x `1.8`, y `4.75`, z `1.8`

Use this as placement/design reference only. Do not import gameplay runtime code from `/editor/`.

## Lily pad note

- Replace old flattened bridge/deck setup with a lily pad.
- Lily pad should be centered in the widened river.
- Frog should be able to stand on it and jump from it.
- Frog should jump onto the lily pad and off it to the grass/right side.
- Human and Frog still cannot walk on water.
- Add subtle floating wobble.

## Blue button note

- Existing Level One blue button no longer makes a bridge appear.
- It should trigger the Blue Bloom Crossing release/reveal.

## Prop edits

Editor proposed:
- `forestTreeB 3`: x `11.4` → x `6`
- `forestRock 7`: x `10`, z `-3.8` → x `3.75`, z `-7.5`

Keep if they help route readability and do not overlap collision/crossing. Adjust if needed after inspecting scene.
