# Codex Prompt — Level Registry and Interconnectivity Pass

You are working in the Lumina3D repo. Improve interconnectivity so adding Level Three does not require remembering scattered manual updates.

## Read first

- README.md
- src/config/scenes.js
- src/debug/debugLevelSelect.js
- src/main.js
- scripts/lib/levelCatalog.js
- src/debug/devEditor.js
- docs/github-workflow.md
- docs/refactor-plan.md

## Task

Create a small registry/validation layer without changing gameplay.

Preferred approach:
1. Add a lightweight `src/config/sceneRegistry.js` or `src/config/levelRegistry.js` that records scene id, display name, debug key, and tool/catalog id for existing scenes.
2. Keep imports simple and avoid circular dependencies.
3. Update debug shortcut mapping to use the registry where safe.
4. Add `scripts/validate-level-registry.js` that checks:
   - every SCENES entry has a registry entry;
   - every registry entry has a levelCatalog entry or an explicit reason;
   - every debug key is unique;
   - README/debug docs do not omit an active debug shortcut;
   - levelCatalog does not contain stale scenes.
5. Add `npm run tools:validate-level-registry`.
6. Update README.md and docs/github-workflow.md with current debug shortcuts and the new validation command.
7. Update progress.md with verification.

## Verification

Run:

- npm run build
- npm run tools:list-levels
- npm run tools:get-level-manifest -- tutorial
- npm run tools:get-level-manifest -- level_one
- npm run tools:get-level-manifest -- level_two
- npm run tools:validate-level-registry
- npm run tools:run-scene-smoke -- tutorial
- npm run tools:run-scene-smoke -- home_intro
- npm run tools:run-scene-smoke -- level_one
- npm run tools:run-scene-smoke -- level_two

## Guardrails

- Do not add Level Three in this pass unless the prompt explicitly says to.
- Do not refactor all scene flow.
- Do not change gameplay behavior.
- Avoid dynamic imports until there is a measured load-time reason.
