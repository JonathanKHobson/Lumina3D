# Codex Prompt — Home House Doorway Collision Cleanup

You are working in the Lumina3D repo. Fix the known Home house doorway collision issue as a small bug pass.

## Problem

The player can partially step into or visually clip through the house doorway, then hit an invisible blocker deeper inside. The house should read as solid, while the exterior door note remains reachable.

## Read first

- bug_report.md
- backlog.md
- src/levels/homeIntroLevel.js
- src/scenes/homeIntroScene.js
- src/scenes/homeIntroFlow.js
- src/main.js
- scripts/lib/levelCatalog.js
- test-output/home-level-one/smoke.mjs, if present

## Task

1. Tune or add labeled house colliders so the visible doorway/interior cannot be entered unless an interior is intentionally implemented later.
2. Keep a separate exterior interaction apron for the note.
3. Update render_game_to_text().home.houseColliders if needed.
4. Add or update smoke checks:
   - cannot enter the visible doorway/interior;
   - cannot pass through front/side/rear of house;
   - can still trigger/read note from outside;
   - exit flow still works.

## Verification

Run:

- npm run build
- npm run tools:run-scene-smoke -- home_intro
- npm run tools:run-scene-smoke -- level_one
- node test-output/home-level-one/smoke.mjs, if present

## Guardrails

- Do not redesign Home.
- Do not add house interior.
- Do not change Home story flow except as needed for collision.
