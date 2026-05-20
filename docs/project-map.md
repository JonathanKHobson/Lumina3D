# Lumina3D Project Map

Last updated: 2026-05-20

## Purpose

Lumina3D is a cozy 3D browser-game prototype built with Vite and Three.js. It
uses KayKit, voxel, and local OBJ/MTL/GLTF assets to support a small playable
world with a human player, Cubeling helpers, environmental puzzles, Love
Letters, and level-to-level progression.

This map exists so future AI or human collaborators can extend the game without
repeating the old pattern of putting everything into `src/main.js`.

## Current State

- Project root: `/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D`
- Runtime stack: Vite + Three.js
- Current major architecture issue: `src/main.js` is still large. The refactor
  plan reduced it from about 5,300 lines to about 3,600 lines, but it remains
  an orchestration bottleneck.
- Current rule: new gameplay systems should not be added to `src/main.js` by
  default. Add or extend the smallest existing module lane that fits the change.
- Active collaboration risk: source files may be dirty because another agent is
  working in parallel. Always check `git status --short` before editing.

## Source Map

Use the current structure this way:

| Path | Owns | Do not put here |
|---|---|---|
| `src/main.js` | Runtime startup, orchestration, legacy glue, adapters to extracted systems | New feature systems, level data, long copy blocks, asset registries |
| `src/config/` | Asset registry, shared constants, scene IDs | Level-specific layouts or behavior |
| `src/content/` | Dialogue, Love Letter IDs/messages, player-facing story copy | Collision, scene flow, or state transitions |
| `src/levels/` | Per-level layout data and coordinates | Mesh construction or runtime logic |
| `src/scenes/` | Scene builders and extracted scene-flow shells | Cross-scene gameplay systems |
| `src/systems/` | Gameplay systems such as input, camera, collision helpers, buttons, dialogue, particles, Frog AI, tutorial helpers | Static level data or DOM selector wiring |
| `src/core/` | Renderer setup, asset loading/placement helpers, mesh sync, grid helpers, marker helpers | Scene-specific mechanics |
| `src/state/` | State factories and local persistence | Rendering or input handling |
| `src/ui/` | HUD refs, labels, modals, overlays, speech placement | Game physics or level layouts |
| `src/debug/` | Dev editor, AI context capture, dev entity registry, debug shortcuts, render-text/test hooks, visible asset summaries | Player-facing gameplay logic |
| `src/editor/` | Separate browser level-editor app, editor adapters, transform patch/state export, editor-only metadata | Gameplay orchestration or direct source-file writes |
| `scripts/` | Deterministic CLI checks and level inspection tooling | Runtime gameplay code |
| `docs/game-design-handbook/` | Design intent, mechanic backlog, level plans, smoke-test notes | Source-of-truth runtime logic |

## Asset Map

Canonical asset registry:

- `src/config/assets.js`

Served asset root:

- `public/assets/`

Important asset lanes:

- `public/assets/voxel/frog/`: Frog Cubeling model.
- `public/assets/voxel/elephant/`: Elephant Cubeling model for Level Two work.
- `public/assets/voxel/main/green/`: voxel terrain and green-world props.
- `public/assets/kaykit/platformer/character/`: GLTF main character.
- `public/assets/kaykit/platformer/bridge/`: bridge pieces.
- `public/assets/kaykit/platformer/button-blue/`: blue button base/top.
- `public/assets/kaykit/platformer/blue-ramp/`: Level Two ramp.
- `public/assets/kaykit/platformer/heart-red/`: Love Letter/reward heart.
- `public/assets/kaykit/blockbits/`: ground, path, and water tiles.
- `public/assets/kaykit/dungeon/`: barriers and wall pieces.
- `public/assets/kaykit/forest/`: trees, rocks, bushes, grass.
- `public/assets/kaykit/medieval/home-blue/`: Home Intro house.
- `public/assets/kaykit/adventurers/spellbook/`: spellbook props.
- `public/assets/animals-farm/background/`: background/cloud imagery.

Rules:

- Register any runtime asset in `src/config/assets.js` before using it.
- Keep raw asset files under `public/assets/...`; do not import them directly
  from source modules unless the build setup intentionally changes.
- Before public release or portfolio publication, run a focused license and
  attribution pass.

## Supporting Skills And Plugins

Use these when a future session needs more than direct code editing:

- `project-structure-architect`: use before adding new folders, refactoring
  module boundaries, creating project maps, or touching `src/main.js` size.
- `develop-web-game`: use for playable browser-game implementation, Playwright
  smoke runs, screenshot inspection, and interaction verification.
- `game-designer`: use for mechanic design, Cubeling abilities, puzzle pacing,
  level flow, onboarding, and playtest goals.
- Game Studio plugin:
  - `game-studio` for routing and stack-level decisions.
  - `web-game-foundations` for architecture and simulation boundaries.
  - `three-webgl-game` for imperative Three.js runtime guidance.
  - `web-3d-asset-pipeline` for OBJ/MTL/GLTF asset preparation.
  - `game-ui-frontend` for HUD, menus, overlays, and responsive play UI.
  - `game-playtest` for screenshot-driven game QA.
- `frontend-ux`: use for HUD, modal, overlay, accessibility, and responsive
  interaction quality.
- `ux-writer`: use for tutorial text, hints, prompts, labels, and player-facing
  recovery copy.
- `communication-story-crafter`: use for public case-study/devlog/portfolio
  framing after the playable work is stable.

## Safe Expansion Patterns

For a new level:

1. Add layout data in `src/levels/<levelName>.js`.
2. Add scene construction in `src/scenes/<levelName>Scene.js`.
3. Add a scene ID in `src/config/scenes.js`.
4. Add only thin orchestration/wiring in `src/main.js`.
5. Add or update scene smoke/tooling coverage.

For a new mechanic:

1. Put state shape in `src/state/` or the relevant level file.
2. Put reusable rules in `src/systems/`.
3. Keep scene-specific placements in `src/levels/` and `src/scenes/`.
4. Wire from `src/main.js` only after the module boundary is clear.

For a new asset:

1. Copy the minimum required files into `public/assets/...`.
2. Add a registry entry in `src/config/assets.js`.
3. Place it through a scene builder or a focused system.
4. Run the relevant scene smoke and visually inspect the result.

For refactors:

1. Read `docs/refactor-plan.md`.
2. Pick one low-risk slice.
3. Do not combine collision/surface refactors, scene-flow refactors, and active
   Level Two mechanic work.
4. Keep behavior unchanged.
5. Run the relevant smoke commands before continuing.

## Verification Map

Docs-only change:

```bash
git diff --name-only
rg "project-structure-architect|src/main.js|Game Studio|public/assets" AGENTS.md docs/project-map.md README.md
```

General code change:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:run-scene-smoke -- level_two --pretty
```

Runtime Dev Editor or AI-context debug change:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:run-scene-smoke -- level_two --pretty
```

- In local dev/test runs, `window.__luminaDevEditor` exposes browser-safe
  context helpers for `lumina3d.dev.aiContext.v1`,
  `lumina3d.dev.selectionDelta.v1`, and `lumina3d.dev.scenePatch.v1`.
- The F2 Dev Editor collider toggle should show actual runtime collider
  proxies separately from the selected visual bounds helper.
- While the F2 Dev Editor is open, debug-camera input owns `W/A/S/D`, `Q/E`,
  `R/F`, and zoom so gameplay actors do not move during inspection.

Level Two layout or asset change:

```bash
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

UI, visual, interaction, scene-flow, or player-facing change:

- Start the local dev server.
- Run the `develop-web-game` or Game Studio playtest loop.
- Inspect screenshots, not just console output.
- Confirm `window.render_game_to_text()` agrees with the visible state.

Separate level-editor change:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
npm run tools:run-editor-smoke -- --pretty
```

- Open `/editor/` with `npm run editor` or a normal Vite dev server.
- Confirm `window.render_editor_to_text()` reports the selected object, camera state, and dirty patch summary.
- Confirm editor transform patches use `lumina3d.editor.transformPatch.v1`.
- Confirm editor state exports use `lumina3d.editor.stateExport.v1`.
- Confirm editor camera pan, yaw, pitch, and zoom work before relying on a placement screenshot.
- Confirm object notes, delete marks, reset selected, and play-in-game handoff still work.
- Inspect an editor screenshot before calling the tool usable.

## Current Non-Goals

- Do not continue the `src/main.js` refactor while another agent is actively
  changing gameplay code.
- Do not create a new engine, framework, MCP wrapper, or asset pipeline unless
  it directly supports the current playable slice.
- Do not let the separate `/editor/` route rewrite source files; export patches
  first and apply them in reviewed code changes.
- Do not turn documentation work into a broad architecture rewrite.
