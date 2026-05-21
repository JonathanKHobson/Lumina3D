# Lumina3D Tooling Foundation (Scripts-First)

This lane keeps gameplay/code changes separate from gameplay-inspection and test plumbing.

## Current Scope

- Reduce token/context use for future Level Two work by giving short, deterministic tooling calls.
- Keep outputs compact and JSON-first:
  - Level inventory + fixture matrix
  - Per-level manifest
  - Per-level object summaries
  - Deterministic scene smoke
  - Targeted fixture runs
  - Collider + float checks
  - Runtime/editor route smoke checks

## Commands in this phase

- `tools:list-levels`
- `tools:get-level-manifest <id>`
- `tools:list-level-objects <id>`
- `tools:build-external-asset-index`
- `tools:run-scene-smoke [<id>]`
- `tools:run-editor-smoke`
- `tools:run-fixture <id> <fixture>`
- `tools:validate-level-registry`
- `tools:validate-missing-colliders [<id>]`
- `tools:validate-float-colliders [<id>]`
- `tools:validate-editor-sync [<id>|all]`
- `tools:explain-editor-patch <patch.json>`

All scripts support `--help` usage text and `--pretty` output.

## When to use each command

- `list-levels`
  - Start every new session.
  - Use for a quick, stable inventory of levels and fixture coverage.
- `get-level-manifest <id>`
  - Use when you need manifest-level context without opening the scene.
  - Preferred for design notes and quick checks before edits.
- `list-level-objects <id>`
  - Use when you need deterministic object rows for review or spot-diff checks.
  - Good for direct Cubeling/prope/terrain inspection before fixture edits.
- `build-external-asset-index`
  - Use after adding or reorganizing focused local 3D packs outside the game project.
  - Refreshes the read-only editor asset reference snapshot; it does not import,
    load, place, or source-write external assets.
- `run-scene-smoke <id>`
  - Use for quick scene entry sanity and invariant checks.
  - Default choice after layout edits or asset swaps in a level.
- `run-editor-smoke`
  - Use after `/editor/` or editor patch schema changes.
  - Confirms the route loads, level picker works, render hook exists, default selection works, camera pitch works, note typeahead works, state/AI prompt export works, replacement candidates export, draft placements stay out of patch JSON, collider view modes work, delete/replace marks are mutually exclusive, reset level clears state, and a small transform creates a dirty source-referenced patch.
- `run-fixture <id> <fixture>`
  - Use for risky mechanics and behavior edits.
  - Keeps targeted behavior checks from forcing a full replay.
- `validate-level-registry`
  - Use after adding, renaming, or wiring a scene.
  - Confirms scene IDs, registry metadata, catalog IDs, debug keys, smoke IDs,
    and editor support do not drift across files.
- `validate-missing-colliders [<id>]`
  - Run after adding/changing solid geometry candidates.
  - Flags expected collider context that is missing.
- `validate-float-colliders [<id>]`
  - Run after position or elevation edits.
  - Flags likely floating/sinking/position anomalies before manual test passes.
- `validate-editor-sync [<id>|all]`
  - Run after gameplay/editor adapter changes.
  - Flags stale source refs, duplicate editor IDs, orphan collider proxies,
    missing asset keys, mechanism-link metadata gaps, and editor/game coverage drift.
- `explain-editor-patch <patch.json>`
  - Use after copying a transform patch from `/editor/`.
  - Prints suggested source edits without modifying files.

## Common workflow examples

- Start-of-session check:
  - `npm run tools:list-levels -- --pretty`
  - `npm run tools:get-level-manifest -- level_two --pretty`
- Quick gameplay slice checks:
  - `npm run tools:run-scene-smoke -- level_two --pretty`
  - `npm run tools:run-fixture -- level_two level_two_start --pretty`
- Refresh editor external asset references:
  - `npm run tools:build-external-asset-index -- --pretty`
- Collision sanity pass:
  - `npm run tools:validate-level-registry -- --pretty`
  - `npm run tools:validate-missing-colliders -- level_two --pretty`
  - `npm run tools:validate-float-colliders -- level_two --pretty`
  - `npm run tools:validate-editor-sync -- level_two --pretty`

## Full-flow vs targeted smoke

Use direct targeted smoke for iterative work:

- `run-scene-smoke -- level_two` for scene load/invariant checks.
- `run-fixture -- level_two level_two_*` for focused behavior paths.

Use full-flow tutorial replay only when:

- Cross-scene handoffs changed, or
- You are ready for final integration verification.

## Dev Editor MVP (runtime, no file writes)

This lane also ships a runtime editor overlay for tiny edit loops.

### Open and Controls

- Open/close the Dev Editor: `F2` (or click `Dev Editor`).
- Scene jump:
  - Tutorial/Home/Level One/Level Two/Level Three buttons in the editor panel.
  - Uses existing scene jump pathways (same as debug debug-key flow).
- Object list: filtered by current level, with tiles hidden by default but
  selectable by canvas click. Use `Show Tiles` or the filter box when a floor,
  water, path, grass/sand, or raised terrain tile needs list selection.
- Selection:
  - Click an object row in the panel.
  - Click editable objects directly in the canvas while the Dev Editor remains open.
  - Selected row shows in the panel summary.
- Debug camera:
  - While the Dev Editor is open, `W/A/S/D` moves the free camera, `Q/E` yaws, `R/F` tilts, and wheel/`+`/`-` zooms.
  - Gameplay movement and Cubeling actions are blocked until the Dev Editor closes.
- Move/rotate:
  - Arrow keys / I J K L: nudge selected object by step size (`0.25` or `0.5`).
  - TransformControls and panel buttons handle move/rotate/scale, including ±X ±Z ±Y and ±15/±90 rotation.
- Collision debug:
  - `Colliders: On/Off` in the panel draws actual runtime collider proxies from the current scene, not mesh visual bounds.
  - The selected-object helper remains a separate visual bounds outline.
  - Selected entities with matched colliders highlight those actual collider proxies.
- Export:
  - `Copy Layout Snapshot` logs compact JSON and copies to clipboard when browser permissions allow.
  - `Copy Transform Delta` copies `lumina3d.dev.selectionDelta.v1` JSON with the selected entity, original transform, current transform, and delta.
  - `Copy AI Context` copies `lumina3d.dev.aiContext.v1` JSON with selected entity, nearby entities, runtime colliders, camera, actors, and source hints.
  - `Export Patch Draft` copies `lumina3d.dev.scenePatch.v1` JSON for human-reviewed source patching.
  - `Export Authoring JSON` copies `lumina3d.dev.levelAuthoringPacket.v1`
    with level/source/object/collision/mechanism context for Codex handoff.
  - `Export Codex Markdown Packet` copies a Markdown version of the same
    authoring packet with explicit "layout changes only" instructions.
  - `Open in Level Editor` stores a temporary `lumina3d.dev.editorHandoff.v1`
    handoff and opens `/editor/` with the current selected object context.
- Selected object annotations:
  - Notes, issue flags, replacement intent, and delete-candidate intent are
    stored locally as `lumina3d.dev.objectAnnotations.v1`.
  - Delete/replace flags are annotation-only. They do not remove objects,
    swap assets, or write source files.
- Test hook:
  - In local dev/test runs, `window.__luminaDevEditor` exposes
    `buildAiContextPayload`, `buildPatchDraftPayload`,
    `buildSelectionDeltaPayload`, `buildTransformDeltaPayload`,
    `buildEditorHandoffPayload`, `buildAuthoringPacketPayload`,
    `buildAuthoringMarkdownPacket`, annotation helpers, `listEntities`,
    `canvasPointForEntity`, and `selectEntityById`.
  - These hooks return browser payloads only; they do not write source files.

### Practical usage

- Use scripts for deterministic checks:
  - `tools:validate-level-registry -- --pretty`
  - `tools:run-scene-smoke -- level_two --pretty`
  - `tools:run-dev-editor-selectability-smoke -- --pretty`
  - `tools:validate-missing-colliders -- level_two --pretty`
  - `tools:validate-float-colliders -- level_two --pretty`
- Use the Dev Editor for fast local edits:
  - Moving bridges/props/buttons/totems quickly.
  - Inspecting current `x/y/z/rotation` before running one targeted check.
  - Annotating suspicious objects before copying AI context or handing off to
    `/editor/`.

### Important limitations

- Dev Editor edits are preview-only while the session runs:
  - No file writes yet.
  - No MCP wrapper in this pass; this is runtime-only workflow.
- Actor transforms (`human`, `frog`, `elephant`) are visible during the session but do not persist across code save/asset changes.
- Advanced systems (undo/redo, asset add/remove, direct persistence) are intentionally not included in this pass.
- Browser output is clipboard/console/test-hook only. Apply any source patch through reviewed code edits, then build and smoke-test.

## Why this is still scripts-first

- The Dev Editor is an additive runtime layer in `src/main.js` for fast manual iteration.
- `src/levels`, `src/scenes`, and tooling scripts are still the preferred stable contract for automation and pre-checks.
- MCP wrapping is intentionally deferred until this contract is stable across a few fixture passes.

## Separate Level Editor (`/editor/`)

The separate editor route is the durable path for visual placement patches and
AI handoffs. It does not boot `src/main.js` and does not write source files.

### Open and scope

- `npm run editor`: start Vite and open `/editor/`.
- `/editor/`: load the editor viewport.
- Level picker: Tutorial, Home Intro, Level One, Level Two, and registered
  Level Three skeletons.
- Level Two has the richest source-mapped coverage. Other levels are MVP
  previews with useful editable anchors, props, and selectable terrain preview
  tiles.
- Not supported yet: collider editing, behavior fields, source-backed object
  creation or deletion, patch application, full external-asset importing, and
  source-file writes.

### Patch flow

- Select an object from the list or by clicking it in the viewport.
- Select `Map Notes` or click empty viewport space to clear object selection and
  write notes about the whole level.
- Move or rotate it with Three.js TransformControls.
- Navigate the editor camera with `W/A/S/D`, rotate it with `Q/E`, tilt it with
  `[` / `]`, and zoom with wheel, trackpad pinch over the canvas, `+`, or `-`.
- Use `Reset Selected` to restore an object to its load-time transform.
- Type `@` in Object Note to insert intent tags such as `@move`, `@trigger`,
  `@collision`, and `@replace`; hover/focus suggestions for usage examples.
- Type `#` in Object Note or Level Note to reference editor objects or read-only
  assets. The Objects tab suggests tokens like `#level_two.blue_ramp`; the
  Assets tab suggests tokens like `#blueRamp` and external reference tokens
  like `#external.kaykits.medieval_pack.building_bridge_a`.
- Generated terrain tiles are selectable for notes and AI handoff, but remain
  read-only/manual-review transform targets until a source-backed terrain edit
  workflow exists.
- Level Two elevated/source-backed terrain tiles are movable in the editor.
  Base ground and generated terrain stay selectable but locked, with lock
  reasons shown in the inspector and exported state.
- Use object-list search and collapsed quick filters to manage dense tile-heavy levels.
  Search supports plain text plus tokens such as `id:level_two.blue_ramp`,
  `type:tile`, `tag:elevated`, `state:dirty`, `mark:replace`,
  `movable:true`, and `locked:true`.
- Use the Assets tab source/pack/folder filters for the external 3D pack index.
  `Place Ghost` creates editor-only draft add-intent records. In-project assets
  can preview as translucent ghosts; external assets preview as labeled
  reference-only markers and still require later import/register review.
- Use `Mark Delete` or `Mark Replace` for export-only planning context; the
  marks are mutually exclusive and do not alter the scene. `Use Asset` can
  attach the selected asset as a structured replacement candidate.
- Use `Reset Level` to restore current-level transforms and clear current-level
  notes/delete/replace marks after confirmation.
- If opened from the runtime Dev Editor, `/editor/` reads the temporary
  handoff from localStorage. Matching supported editor objects are
  selected/framed when available; unsupported scenes or entities show a
  read-only handoff summary.
- Use `Play in game` to open the selected source-backed playable level in a new tab.
- Copy transform-only JSON with `Copy Patch JSON`, affected-object handoff JSON
  with `Copy State JSON`, or a complete Codex handoff with `Copy AI Prompt`.
- Editor patches use `lumina3d.editor.transformPatch.v1`.
- Editor state exports use `lumina3d.editor.stateExport.v1`.
- State exports include camera context, note intents, intent glossary,
  note references, reference glossary,
  delete/replace marks, replacement candidates, draft placements, collider
  diagnostics, level notes, action intent, selected object context, tile
  editability metadata, object-list filter summary, and editor-only
  timeline/asset-catalog summaries.
- Dry-run a saved patch with
  `npm run tools:explain-editor-patch -- <patch.json>`.
- Use `window.render_editor_to_text()` for compact QA state: selection mode,
  selected object, selectable terrain count, dirty count, affected state-export
  count, level note tags, note-reference counts, camera state, object-list
  filter state, movable/locked tile counts, draft placements, replacement
  candidates, collider view/diagnostic counts, patch summary, and state-export
  summary.
- Run `npm run tools:validate-editor-sync -- all --pretty` after adapter/source
  changes.
- Run `npm run tools:run-editor-smoke -- --pretty` against a local dev server to confirm the route, level picker, render hook, default selection, terrain selection, elevated tile movement, base terrain locking, object-list filters, empty-click level-note mode, dirty transform patch, note intent/reference export, replacement candidates, draft placement export, collider view modes, delete/replace state export, reset selected, reset level, camera pitch, AI prompt export, and play-in-game handoff.

The old F2 Dev Editor can remain useful for runtime inspection. Use `/editor/`
when the output should become a structured transform patch that Codex can apply
in a reviewed source edit later.

Detailed editor guidance lives in `docs/editor/level-editor.md`,
`docs/editor/timeline-scrubber-plan.md`, `docs/editor/asset-library-plan.md`,
`docs/tooling/editor-ai-handoff.md`, and
`docs/tooling/editor-patch-workflow.md`.
