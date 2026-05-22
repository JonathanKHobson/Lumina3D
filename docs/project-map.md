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
| `src/config/` | Asset registry, shared constants, scene IDs, level registry metadata | Level-specific layouts or behavior |
| `src/content/` | Dialogue, Love Letter IDs/messages, player-facing story copy | Collision, scene flow, or state transitions |
| `src/levels/` | Per-level layout data and coordinates | Mesh construction or runtime logic |
| `src/scenes/` | Scene builders and extracted scene-flow shells | Cross-scene gameplay systems |
| `src/systems/` | Gameplay systems such as input, camera, collision helpers, buttons, dialogue, particles, Frog AI, tutorial helpers | Static level data or DOM selector wiring |
| `src/core/` | Renderer setup, asset loading/placement helpers, mesh sync, grid helpers, marker helpers | Scene-specific mechanics |
| `src/state/` | State factories and local persistence | Rendering or input handling |
| `src/ui/` | HUD refs, labels, modals, overlays, speech placement | Game physics or level layouts |
| `src/debug/` | Dev editor, AI context capture, dev entity registry, debug shortcuts, render-text/test hooks, visible asset summaries | Player-facing gameplay logic |
| `src/editor/` | Separate browser level-editor app, level adapters, asset catalog including generated external reference records and editor-only procedural assets, draft placement/replacement-intent helpers, collider diagnostics, note intent/reference helpers, transform patch/state export, AI prompt handoff, editor-only metadata | Gameplay orchestration or direct source-file writes |
| `src/editor/timeline/` | Inactive editor timeline/scrubber data-model prep for future solution previews | Playable runtime simulation or behavior source of truth |
| `mcp/` | Local stdio MCP server and AI-facing tool registration for read-only context, allowlisted validation, archetype contracts, editor context, and the guarded current-branch publish helper | Gameplay behavior, browser editor UI, arbitrary shell tools, source-writing patch application |
| `.codex/` | Project-scoped Codex hook registration for Lumina3D sessions | MCP server definitions or gameplay/tooling source |
| `scripts/` | Deterministic CLI checks and level inspection tooling | Runtime gameplay code |
| `scripts/codex/` | Lightweight project-local Codex hook helpers, including closeout reminders | Auto-mutating project docs or broad session automation |
| `scripts/lib/` | Shared tooling logic for level catalogs, command allowlists, validation suites, editor-state reads, and archetype contracts | Browser UI state, runtime-only rendering, unchecked file access |
| `docs/architecture/` | Architecture notes such as naming conventions, audits, and migration plans | Runtime source-of-truth behavior |
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
- `src/editor/EditorExternalAssetCatalog.generated.js`: generated read-only
  editor reference index for focused local 3D packs outside the game project.
- `src/editor/EditorProceduralAssets.js`: editor-only generated asset previews
  such as the draft lily pad; these are not runtime source until implemented.

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
4. Add registry metadata in `src/config/levelRegistry.js`.
5. Add catalog/tooling coverage in `scripts/lib/levelCatalog.js`.
6. Add or update `src/editor/levels/` adapter support when editor inspection is expected.
7. Add only thin orchestration/wiring in `src/main.js`.
8. Add or update scene smoke/tooling coverage, then run `tools:validate-level-registry`.

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
npm run tools:validate-level-registry -- --pretty
npm run tools:run-scene-smoke -- level_two --pretty
```

Current-branch publish after checks:

```bash
npm run tools:publish-current-branch -- --message "Update Lumina3D Level 3 and editor prep" --branch codex/lumina3d-level-editor-mvp --yes --pretty
```

This publish helper runs `git diff --check` and `npm run build` before staging, committing, and pushing. It is also exposed through the Lumina3D MCP as `lumina_publish_current_branch` with `confirm: true`.

Runtime Dev Editor or AI-context debug change:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:validate-level-registry -- --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:run-dev-editor-selectability-smoke -- --pretty
```

- In local dev/test runs, `window.__luminaDevEditor` exposes browser-safe
  context helpers for `lumina3d.dev.aiContext.v1`,
  `lumina3d.dev.selectionDelta.v1`, `lumina3d.dev.scenePatch.v1`, selected
  object annotations, runtime-to-editor handoff payloads, and Level Authoring
  Packet JSON/Markdown payloads.
- The F2 Dev Editor collider toggle should show actual runtime collider
  proxies separately from the selected visual bounds helper.
- While the F2 Dev Editor is open, debug-camera input owns `W/A/S/D`, `Q/E`,
  `R/F`, and zoom so gameplay actors do not move during inspection.
- Runtime Dev Editor annotations use `lumina3d.dev.objectAnnotations.v1`.
  Delete/replace markers are intent only and must never remove objects, swap
  assets, or write source files from the browser.
- Runtime Dev Editor object selection should expose all real scene objects,
  including terrain tiles, while keeping tiles hidden from the default object
  list unless `Show Tiles` or the object filter is used.
- `Open in Level Editor` uses `lumina3d.dev.editorHandoff.v1` localStorage
  handoffs. `/editor/` may select a matching supported editor object,
  otherwise it should show a read-only summary.

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
npm run tools:validate-editor-sync -- level_two --pretty
npm run tools:run-editor-smoke -- --pretty
```

- Open `/editor/` with `npm run editor` or a normal Vite dev server.
- Confirm `window.render_editor_to_text()` reports the selected object, camera
  state, dirty patch summary, draft placement count, replacement candidate
  count, and collider diagnostics summary.
- Confirm editor transform patches use `lumina3d.editor.transformPatch.v1`.
- Confirm editor state exports use `lumina3d.editor.stateExport.v1`.
- Confirm `Copy AI Prompt` produces Markdown with local-first rules and fenced state JSON.
- Confirm object-list filters report visible/total counts, keep selection stable,
  and clearly distinguish movable elevated tiles from locked base terrain.
- Timeline support is data/docs-only until its visible UI slice is explicitly
  scheduled.
- Confirm the Assets tab can search/filter local asset registry entries, place
  editor-only draft ghosts/markers, and still avoid source writes or runtime
  importing.
- Confirm the level picker can load Tutorial, Home Intro, Level One, Level Two,
  and registered Level Three skeletons.
- Confirm note `@intent` typeahead works and static note chips are absent.
- Confirm `Mark Delete` and `Mark Replace` are mutually exclusive export-only
  flags, and `Use Asset` exports a structured replacement candidate.
- Confirm `Reset Level` clears current-level transforms and editor metadata after confirmation.
- Confirm editor camera pan, yaw, pitch, and zoom work before relying on a placement screenshot.
- Confirm `Show Colliders` and `Collider View` display editor-only
  collider/proxy helpers, actor walkability rows, and problem warnings, and that
  exported state treats them as handoff context, not editable collider source.
- For Level Two, confirm source-backed mechanism proxies are present for the
  blue ramp, buttons/platforms, Elephant Echo/Totem, and major route/transition
  areas before considering collider editing controls.
- Confirm floor/path/sand/grass terrain preview tiles can be selected for
  read-only AI handoff notes.
- Confirm clicking empty viewport space clears object selection and enables
  level/map notes in Copy State JSON and Copy AI Prompt.
- Confirm object notes, delete/replace marks, reset selected, reset level, and play-in-game handoff still work.

Local MCP tooling change:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:validate-level-registry -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:explain-editor-patch -- docs/tooling/fixtures/editor-transform-patch-example.json
npm run mcp:smoke
```

- Keep MCP stdout reserved for stdio protocol messages.
- Do not add source-writing, patch-apply, arbitrary-shell, or object-scaffold tools without a separate explicit phase.
- Full command output belongs in ignored `tmp/lumina-mcp/logs/`; MCP responses should stay compact by default.
- Confirm runtime handoffs from the F2 Dev Editor load as selection/focus when
  supported and read-only summaries when unsupported.
- Inspect an editor screenshot before calling the tool usable.

Editor usage and AI handoff guidance live in `docs/editor/level-editor.md`,
`docs/tooling/editor-ai-handoff.md`, and
`docs/tooling/editor-patch-workflow.md`.

## Current Non-Goals

- Do not continue the `src/main.js` refactor while another agent is actively
  changing gameplay code.
- Do not create a new engine, framework, MCP wrapper, or asset pipeline unless
  it directly supports the current playable slice.
- Do not let the separate `/editor/` route rewrite source files; export patches
  first and apply them in reviewed code changes.
- Do not turn documentation work into a broad architecture rewrite.
