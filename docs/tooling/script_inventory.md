# Script Inventory

## `scripts/lib`

- `lib/levelCatalog.js`  
  Canonical level metadata source: ids, scenes, assets, objects, fixture matrix.
- `lib/cli-utils.js`  
  Shared Playwright bridge utilities and deterministic input/state polling helpers.

## CLI scripts and outputs

- `list-levels.js`  
  Command: `npm run tools:list-levels [--pretty]`  
  Returns compact JSON: `count`, `levels[]`, each level has `id/name/sceneId/hasSmoke/hasFixtures`.

- `get-level-manifest.js`  
  Command: `npm run tools:get-level-manifest -- <level_id> [--pretty]`  
  Returns concise manifest with landmarks, collectibles, cubelings, fixtures.

- `list-level-objects.js`  
  Command: `npm run tools:list-level-objects -- <level_id> [--pretty]`  
  Returns compact object rows used for quick inspection and manual diffs.

- `run-scene-smoke.js`  
  Command: `npm run tools:run-scene-smoke -- [level_id] [--pretty] [--no-headless]`  
  Direct scene smoke with invariant checks (no full tutorial replay by default).

- `run-fixture.js`  
  Command: `npm run tools:run-fixture -- <level_id> <fixture_id> [--pretty] [--no-headless]`  
  Returns `implemented` or explicit `unsupported` outcomes with migration hints.

- `validate-missing-colliders.js`  
  Command: `npm run tools:validate-missing-colliders -- [<level_id>] [--pretty] [--no-headless]`  
  Returns counters: `checked`, `missing`, `suspicious`, `issueCount`, `observedColliderCount`, `observedColliderSample[]`, and `issues[]`.

- `validate-float-colliders.js`  
  Command: `npm run tools:validate-float-colliders -- [<level_id>] [--pretty] [--no-headless]`  
  Returns elevation and collision-context checks with counters plus `observedColliderCount`, `observedColliderSample[]`, and `issues[]`.
