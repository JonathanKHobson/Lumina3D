# Codex Prompt — Level Two Invisible Wall and Collider QA

You are working in the Lumina3D repo. Investigate Level Two ground-level invisible walls and small movement blockers without redesigning the level.

## Read first

- bug_report.md
- backlog.md
- src/main.js
- src/levels/levelTwo.js
- src/scenes/levelTwoScene.js
- scripts/lib/levelCatalog.js
- scripts/validate-missing-colliders.js
- scripts/validate-float-colliders.js
- test-output/level-two-ramp-access/smoke.mjs, if present
- test-output/level-two-frog-totem/smoke.mjs, if present

## Task

1. Add a temporary or debug-only collider probe to render_game_to_text() for Level Two:
   - actor position;
   - attempted movement direction;
   - collider labels intersecting the actor radius;
   - surface id;
   - whether block came from bounds, scene collider, raised transition guard, actor collision, or barrier.
2. Use the probe to identify any ground-level blockers that feel like invisible walls.
3. Fix only confirmed bad collider placement/labeling or overly broad blockers.
4. Update validators or smoke tests so the bug does not reappear.
5. Update bug_report.md only if a confirmed bug is found/fixed/deferred.

## Verification

Run:

- npm run build
- npm run tools:run-scene-smoke -- level_two
- npm run tools:validate-missing-colliders -- level_two
- npm run tools:validate-float-colliders -- level_two
- node test-output/level-two-ramp-access/smoke.mjs, if present
- node test-output/level-two-frog-totem/smoke.mjs, if present

## Guardrails

- Do not change the Level Two route design.
- Do not refactor the full collision system.
- Do not alter the ramp/raised-surface recovery unless the bug directly requires it.
- Keep all fixes small and labeled.
