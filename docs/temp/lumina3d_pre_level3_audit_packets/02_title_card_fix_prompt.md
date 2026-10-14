# Codex Prompt — Title Card Timing and Stale Text Fix

You are working in the Lumina3D repo. Fix title-card behavior with the smallest stable change.

## Problem

Level One and Level Two currently show the title card before the character walk-in. Desired sequence:

1. Level starts.
2. Character begins walking in.
3. Title card appears during the walk-in.
4. Title fades.
5. Character completes entrance.
6. Player control begins.

There is also a Level Two bug where the title card can briefly show "Level One" before disappearing.

## Files to inspect

- src/ui/hud.js
- src/scenes/levelOneFlow.js
- src/scenes/levelTwoFlow.js
- src/scenes/homeIntroFlow.js
- src/state/gameState.js
- test-output/home-level-one/smoke.mjs, if present
- test-output/level-two-shell/smoke.mjs, if present
- scripts/run-scene-smoke.js

## Task

1. Remove any fallback that renders "Level One" when titleCardText is empty. A missing title should render an empty string or a scene-derived safe value, never the wrong level.
2. Change Level One and Level Two scene flow so the title card appears during arrival instead of blocking arrival before movement.
3. Keep the title card owned by the scene it introduces.
4. Add or update smoke assertions for:
   - Level One title text never appears in Level Two.
   - Level Two title text remains "Level Two" while visible.
   - The player is moving/arrival phase begins while title card is visible.
   - Player control is disabled until arrival completes.
5. Run:
   - npm run build
   - npm run tools:run-scene-smoke -- level_one
   - npm run tools:run-scene-smoke -- level_two
   - node test-output/home-level-one/smoke.mjs, if present
   - node test-output/level-two-shell/smoke.mjs, if present

## Guardrails

- Do not touch collision, movement speed, map layout, or Love Letter behavior.
- Do not change Tutorial or Home flow unless required to preserve transition ownership.
- Keep this as a scene-flow/UI timing fix only.
