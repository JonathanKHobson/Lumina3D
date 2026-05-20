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
- `tools:run-scene-smoke [<id>]`
- `tools:run-editor-smoke`
- `tools:run-fixture <id> <fixture>`
- `tools:validate-missing-colliders [<id>]`
- `tools:validate-float-colliders [<id>]`
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
- `run-scene-smoke <id>`
  - Use for quick scene entry sanity and invariant checks.
  - Default choice after layout edits or asset swaps in a level.
- `run-editor-smoke`
  - Use after `/editor/` or editor patch schema changes.
  - Confirms the route loads, render hook exists, default selection works, camera pitch works, state export works, and a small transform creates a dirty source-referenced patch.
- `run-fixture <id> <fixture>`
  - Use for risky mechanics and behavior edits.
  - Keeps targeted behavior checks from forcing a full replay.
- `validate-missing-colliders [<id>]`
  - Run after adding/changing solid geometry candidates.
  - Flags expected collider context that is missing.
- `validate-float-colliders [<id>]`
  - Run after position or elevation edits.
  - Flags likely floating/sinking/position anomalies before manual test passes.
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
- Collision sanity pass:
  - `npm run tools:validate-missing-colliders -- level_two --pretty`
  - `npm run tools:validate-float-colliders -- level_two --pretty`

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
  - Tutorial/Home/Level One/Level Two buttons in the editor panel.
  - Uses existing scene jump pathways (same as debug debug-key flow).
- Object list: filtered by current level, excluding tile fillers and procedural filler meshes.
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
  - `Copy Layout JSON` logs compact JSON and copies to clipboard when browser permissions allow.
  - `Copy Selection Delta` copies `lumina3d.dev.selectionDelta.v1` JSON with the selected entity, original transform, current transform, and delta.
  - `Copy AI Context` copies `lumina3d.dev.aiContext.v1` JSON with selected entity, nearby entities, runtime colliders, camera, actors, and source hints.
  - `Export Patch Draft` copies `lumina3d.dev.scenePatch.v1` JSON for human-reviewed source patching.
- Test hook:
  - In local dev/test runs, `window.__luminaDevEditor` exposes `buildAiContextPayload`, `buildPatchDraftPayload`, `buildSelectionDeltaPayload`, `listEntities`, and `selectEntityById`.
  - These hooks return browser payloads only; they do not write source files.

### Practical usage

- Use scripts for deterministic checks:
  - `tools:run-scene-smoke -- level_two --pretty`
  - `tools:validate-missing-colliders -- level_two --pretty`
  - `tools:validate-float-colliders -- level_two --pretty`
- Use the Dev Editor for fast local edits:
  - Moving bridges/props/buttons/totems quickly.
  - Inspecting current `x/y/z/rotation` before running one targeted check.

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

## Separate Level Editor MVP (`/editor/`)

The separate editor route is the durable path for visual placement patches. It
does not boot `src/main.js`, does not write source files, and starts with Level
Two objects whose source mapping is clear.

### Open and scope

- `npm run editor`: start Vite and open `/editor/`.
- `/editor/`: load the Level Two editor viewport.
- Supported first objects: blue ramp, blue button, placeholder Love Letter,
  Elephant Echo, Elephant Totem, red button, red platform, and simple props.
- Not supported yet: collider editing, behavior fields, object creation or
  deletion, asset palettes, patch application, and source-file writes.

### Patch flow

- Select an object from the list or by clicking it in the viewport.
- Move or rotate it with Three.js TransformControls.
- Navigate the editor camera with `W/A/S/D`, rotate it with `Q/E`, tilt it with
  `[` / `]`, and zoom with wheel, trackpad pinch over the canvas, `+`, or `-`.
- Use `Reset Selected` to restore an object to its load-time transform.
- Use object notes, keyword chips, and `Mark Delete` for planning context.
- Use `Play in game` to open source-backed playable Level Two in a new tab.
- Copy transform-only JSON with `Copy Patch` or affected-object handoff JSON
  with `Copy State`.
- Editor patches use `lumina3d.editor.transformPatch.v1`.
- Editor state exports use `lumina3d.editor.stateExport.v1`.
- Dry-run a saved patch with
  `npm run tools:explain-editor-patch -- <patch.json>`.
- Use `window.render_editor_to_text()` for compact QA state: selected object,
  dirty count, affected state-export count, camera state, patch summary, and
  state-export summary.
- Run `npm run tools:run-editor-smoke -- --pretty` against a local dev server to confirm the route, render hook, default selection, dirty transform patch, notes/delete state export, reset, camera pitch, and play-in-game handoff.

The old F2 Dev Editor can remain useful for runtime inspection. Use `/editor/`
when the output should become a structured transform patch that Codex can apply
in a reviewed source edit later.

Detailed patch application guidance lives in
`docs/tooling/editor-patch-workflow.md`.
