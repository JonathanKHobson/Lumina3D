# Context Notes

## Scope and lock during this pass

This lane is a **tooling/stability pass only**. Gameplay/runtime work should pause until the lock is lifted.

**Pause for now**
- `/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D/src/main.js`
- `/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D/src/levels`
- `/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D/src/scenes`
- Shared Playwright/fixture state helpers used by scene state initialization
- Shared test utility files outside `scripts/` that feed smoke/fixture state

**Safe to edit in parallel during this pass**
- `docs/tooling/*`
- Asset/copy tasks outside runtime/gameplay modules
- Bug triage non-scope files
- Build/test support files not consumed by runtime code

## Contract principle

- `window.render_game_to_text()` remains the deterministic source of truth.
- Tooling outputs must stay concise JSON.
- Unsupported fixtures are valid outputs with `status: "unsupported"` plus migration hints.
- No full MCP wrapper is added yet.

## Fixture policy for this pass

Do not add fixtures for every level by default.

Use fixtures for:
- high-risk mechanics
- new Cubeling mechanics
- button/platform systems
- recall/teleport/reposition systems
- Love Letter completion states
- scene-start determinism states

Avoid adding fixtures for:
- purely visual/static scenery with no gameplay transition risk
- routine prop-only edits that do not affect mechanics

## Resume signal for gameplay work

Resume normal gameplay/content edits once the following checks pass on a fresh run:

- `npm run tools:list-levels -- --pretty`
- `npm run tools:get-level-manifest -- level_two --pretty`
- `npm run tools:list-level-objects -- level_two --pretty`
- `npm run tools:run-scene-smoke -- level_two --pretty`
- `npm run tools:run-fixture -- level_two level_two_start --pretty`
- `npm run tools:validate-missing-colliders -- level_two --pretty`
- `npm run tools:validate-float-colliders -- level_two --pretty`

## Unsupported fixture policy

- Keep unsupported fixtures explicit in the catalog as `status: unsupported`.
- Never report unsupported fixtures as pass/fail.
- Provide `reason` and `migrationHint` for each unsupported fixture so engineering knows exactly what state hook is missing.
