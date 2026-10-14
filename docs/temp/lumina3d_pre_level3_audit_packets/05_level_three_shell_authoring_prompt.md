# Codex Prompt — Level Three Shell and Editor-First Authoring Contract

You are working in the Lumina3D repo. Add only a Level Three shell and authoring contract, not a finished level.

## Read first

- README.md
- src/config/scenes.js
- src/config/sceneRegistry.js or src/config/levelRegistry.js, if present
- scripts/lib/levelCatalog.js
- src/levels/levelTwo.js
- src/scenes/levelTwoScene.js
- src/scenes/levelTwoFlow.js
- src/debug/devEditor.js
- docs/game-design-handbook/00_overview.md
- docs/game-design-handbook/07_level_two_phased_implementation_plan.md

## Design intent

Level Three should be editor-first. The first pass should create a simple, readable shell that can be adjusted in the editor. Do not build a final puzzle route.

Candidate direction:
- compact water-focused garden/pond/brook map;
- visible Love Letter placeholder;
- Frog Cubeling available if needed for traversal testing;
- no new Cubeling mechanics unless explicitly requested;
- reserve clear zones for future water or Duck/Axolotl ideas, but do not implement them.

## Task

1. Add `SCENES.LEVEL_THREE`.
2. Add `src/levels/levelThree.js` with:
   - width/height/bounds;
   - start point;
   - initial terrain/water/path arrays;
   - authoring notes constants;
   - placeholder Love Letter position;
   - simple prop list.
3. Add `src/scenes/levelThreeScene.js` that builds the shell.
4. Add a minimal Level Three flow module using the corrected title-during-arrival pattern.
5. Add scene group and wiring in main.js only as much as needed.
6. Add debug shortcut 5, if the registry supports it.
7. Add levelCatalog/manifest entry.
8. Add render_game_to_text().levelThree basics.
9. Add a scene smoke for `level_three` that verifies load, title/arrival/play, bounds, actor control, placeholder Love Letter visibility, and editor export visibility.
10. Update README.md, progress.md, and backlog.md.

## Verification

Run:

- npm run build
- npm run tools:list-levels
- npm run tools:get-level-manifest -- level_three
- npm run tools:run-scene-smoke -- level_three
- npm run tools:run-scene-smoke -- tutorial
- npm run tools:run-scene-smoke -- level_one
- npm run tools:run-scene-smoke -- level_two

## Guardrails

- No final Level Three puzzle route.
- No new Cubeling unless explicitly requested.
- No complex mechanism connections.
- No collision/surface refactor.
- Every solid-looking prop gets an intentional collider or explicit non-solid note.
- Every walkable platform has an explicit walkable proxy/contract.
