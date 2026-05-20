# Lumina3D Level Editor - Next Implementation Packet (Local-First Version)

Date: 2026-05-20
Prepared for: Codex / local AI development assistant
Project: Lumina3D
Working model: Codex works in the user's local files first. GitHub is only used later when the user decides to push, commit, or sync.
Primary goal: harden the Level Editor MVP and make exported transform patches actionable.

---

## 0. Critical Context for Codex

You are working in the user's local Lumina3D project files, not directly in GitHub and not directly in a GitHub PR.

The local working tree is the source of truth.

Do not assume GitHub, `main`, a remote branch, or a draft PR reflects the current local project state. The user may push changes to GitHub occasionally, but your implementation work should happen against the current local files.

Before changing anything:

1. Inspect the local file tree.
2. Run `git status --short` if git is available.
3. Identify the current local branch if useful.
4. Do not switch branches unless explicitly asked.
5. Do not reset, pull, push, merge, rebase, or commit unless explicitly asked.
6. Do not treat remote GitHub state as authoritative.

---

## 1. Executive Summary

The Level Editor MVP exists locally and should now move into a review/hardening stage. Do not expand the editor into a larger feature set yet. The next implementation should make the MVP stable, maintainable, and useful as an AI handoff tool.

The main work is:

1. Clean and harden the local editor MVP.
2. Preserve the separate `/editor/` route and keep the playable game at `/` unaffected.
3. Remove or resolve hidden/bidirectional Unicode warnings if present locally.
4. Format compressed source files for maintainability if needed.
5. Verify core editor interactions manually and through available smoke/tooling commands.
6. Add a clear editor patch workflow so exported transform patches can be applied to `src/levels/levelTwo.js` safely.
7. Optionally add a dry-run patch explanation script, but do not auto-write source unless the implementation is extremely safe and well validated.

This is not the sprint for collider editing, object creation/deletion, or behavior editing. Those come after patch export and application are trustworthy.

---

## 2. Current Expected Local State

The local files may include:

- A separate `/editor/` route.
- An editor entry such as `editor/index.html`.
- Editor source under `src/editor/`.
- An `npm run editor` script.
- An editor app using Three.js selection/manipulation tools such as `TransformControls`, `Raycaster`, object selection, camera controls, snap toggles, and JSON patch export.
- A transform patch exporter that may use a patch type similar to `lumina3d.editor.transformPatch`.
- A Level Two adapter or data bridge that creates editable records from local level data.
- AI/dev workflow docs such as `AGENTS.md`, `AI_GAME_DEV.md`, or docs under `docs/`.

Do not assume these names are exact. Inspect the local files first and adapt carefully.

---

## 3. Guiding Principle

The editor is not a replacement game engine. It is a focused spatial authoring and AI handoff tool.

The editor should answer these questions precisely:

- Which level am I editing?
- Which object is selected?
- What is its stable editor ID?
- What is its source data reference?
- What was its original transform?
- What is its current transform?
- What changed?
- How should Codex or a human apply that change to source data?

Avoid adding features that obscure this flow.

---

## 4. Primary Implementation Goals

### Goal A - Harden the local MVP

Make the existing level editor MVP safe and maintainable.

Required tasks:

1. Confirm `/editor/` remains a separate route.
2. Confirm the editor does not import or boot `src/main.js` unless the local architecture intentionally requires a safe shared module.
3. Confirm the playable game at `/` still runs.
4. Confirm `npm run editor` opens the editor route if that script exists; add or fix the script if needed.
5. Confirm `npm run build` succeeds.
6. Remove hidden or bidirectional Unicode characters if present locally and not intentionally required.
7. Format compressed one-line files where appropriate, especially:
   - `package.json`
   - `vite.config.js`
   - `editor/index.html`
   - `src/editor/**/*.js`
   - `src/editor/**/*.css`
8. Preserve existing editor behavior while formatting.
9. Document the editor usage flow.

### Goal B - Make patches actionable

The editor should export transform patches that are easy for Codex or a human to apply to the level data source.

Required tasks:

1. Add or update `docs/tooling/editor-patch-workflow.md`.
2. Explain the patch schema in plain language.
3. Explain how `sourceRef.file`, `sourceRef.exportName`, and `sourceRef.path` map to local level source data.
4. Include examples for likely Level Two data sources:
   - point objects from `LEVEL_TWO_POINTS`
   - the blue ramp, likely `LEVEL_TWO_BLUE_RAMP.position`
   - red buttons, likely array entries in `LEVEL_TWO_RED_BUTTONS`
   - red platforms, likely array entries in `LEVEL_TWO_RED_PLATFORMS`
   - props, likely entries in `LEVEL_TWO_PROPS`
5. Add a dry-run explanation script if feasible:
   - Suggested file: `scripts/explain-editor-patch.js`
   - Suggested npm script: `tools:explain-editor-patch`
6. The script should read a patch JSON file and print suggested source edits without modifying files.
7. Do not implement auto-apply unless you can guarantee safety and include a dry-run mode.

### Goal C - Preserve the next-feature runway

Make this implementation set up future work without implementing it yet.

Future work to keep in mind but not implement in this sprint:

- collider/proxy visualization
- collider editing
- behavior parameter display
- platform path previews
- object creation/deletion
- level-generalized adapters
- undo/redo
- AI context capture beyond transform patches

---

## 5. Non-Goals

Do not do these in this implementation:

- Do not add collider editing.
- Do not add object creation or deletion.
- Do not implement behavior editing.
- Do not implement platform animation editing.
- Do not rewrite the level architecture.
- Do not migrate to another engine.
- Do not copy code from external repos.
- Do not directly rewrite source files from the browser.
- Do not use GitHub as the source of truth.
- Do not switch branches unless asked.
- Do not pull, push, merge, rebase, reset, or commit unless asked.

---

## 6. Desired Patch Workflow

The target user workflow should be:

1. Run the editor locally:

```bash
npm run editor
```

2. Open `/editor/`.
3. Select Level Two.
4. Select an object visually or from the object list.
5. Move or rotate it using transform controls.
6. Copy the generated patch.
7. Save the patch temporarily, for example:

```txt
scratch/editor-patches/level-two-blue-ramp-adjustment.json
```

8. Ask Codex to apply it, or run a dry-run explanation script:

```bash
npm run tools:explain-editor-patch -- scratch/editor-patches/level-two-blue-ramp-adjustment.json
```

9. Apply the source edits manually or via Codex.
10. Run validation commands.
11. Commit/push only when the user explicitly asks or approves.

---

## 7. Patch Schema Expectations

The transform patch shape may be roughly:

```json
{
  "patchType": "lumina3d.editor.transformPatch",
  "levelId": "level_two",
  "objectId": "level_two.blue_ramp",
  "sourceRef": {
    "file": "src/levels/levelTwo.js",
    "exportName": "LEVEL_TWO_BLUE_RAMP",
    "path": "position"
  },
  "changes": [
    {
      "path": "transform.position.x",
      "oldValue": 0,
      "newValue": 1.25
    }
  ],
  "objects": [
    {
      "objectId": "level_two.blue_ramp",
      "name": "Blue Ramp",
      "category": "mechanic",
      "sourceRef": {
        "file": "src/levels/levelTwo.js",
        "exportName": "LEVEL_TWO_BLUE_RAMP",
        "path": "position"
      },
      "changes": []
    }
  ]
}
```

Codex should inspect the actual local implementation and refine this schema if needed, but it should not break existing editor patch behavior.

### Recommendation

If the patch schema is improved, prefer additive fields over breaking changes:

```json
{
  "schemaVersion": 1,
  "createdBy": "Lumina3D Level Editor",
  "editorRoute": "/editor/",
  "levelId": "level_two",
  "objects": []
}
```

Do not introduce required fields that the current editor cannot reliably produce.

---

## 8. Patch Explanation Script Requirements

If implemented, `scripts/explain-editor-patch.js` should:

1. Accept a patch JSON file path as a CLI argument.
2. Parse and validate JSON.
3. Verify `patchType === "lumina3d.editor.transformPatch"` or match the actual local patch type.
4. Print a summary:
   - level ID
   - dirty object count
   - total change count
   - each object ID
   - source reference
   - changed paths
   - old/new values
5. Translate editor transform paths to source data suggestions.
6. Avoid modifying files.
7. Exit nonzero for malformed patches.
8. Be readable and dependency-light.

Example command:

```bash
npm run tools:explain-editor-patch -- scratch/editor-patches/example.json
```

Example output:

```txt
Lumina3D editor patch dry run
Level: level_two
Dirty objects: 1

Object: level_two.blue_ramp
Source: src/levels/levelTwo.js
Export: LEVEL_TWO_BLUE_RAMP
Source path: position

Suggested edits:
- position.x: 4 -> 4.25
- position.y: 0 -> 0
- position.z: -8 -> -7.75

Validation after applying:
- npm run build
- npm run tools:get-level-manifest -- level_two --pretty
- npm run tools:list-level-objects -- level_two --pretty
- npm run tools:run-scene-smoke -- level_two --pretty
```

---

## 9. Editor Manual QA Checklist

Before considering this local implementation done, verify:

- `/` still opens the playable game.
- `/editor/` opens the editor.
- The editor loads Level Two.
- The object list appears.
- Object count is reasonable.
- Selection from the object list works.
- Selection by viewport click works.
- Translate mode works.
- Rotate mode works.
- Snap toggle works.
- Frame selected works.
- Camera pan/zoom/rotate controls work.
- Patch output starts clean or predictable.
- Moving one object creates one dirty object.
- Moving multiple objects creates multiple dirty objects.
- Copy patch copies valid JSON.
- Reset/reload returns the scene to source state.

---

## 10. Suggested Validation Commands

Run as many as apply locally:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

If the patch explanation script is added:

```bash
npm run tools:explain-editor-patch -- scratch/editor-patches/example.json
```

If Playwright visual QA exists locally, also run the editor smoke/visual flow that verifies:

- `/editor/` loads.
- camera navigation works.
- transform patch flow works.

---

## 11. Risk Notes

### Local state beats remote state

The user may have local changes that are newer than GitHub. Inspect local files and current working tree first.

### Git operations

Do not run destructive Git commands. Avoid branch switching. Do not commit or push unless the user asks.

### Hidden Unicode

If hidden or bidirectional Unicode characters exist locally, treat them as a source hygiene issue. Remove suspicious invisible characters unless intentionally required.

### Compressed Source Files

If files are one-liners locally, format them. If a compressed view was only a remote rendering artifact, do not make unnecessary changes.

### Patch Source Mapping

Do not assume every object maps cleanly to a simple `position` object. Inspect `src/levels/levelTwo.js` carefully.

Likely cases:

- named object constants
- nested position objects
- arrays of objects with IDs
- generated/editor-only helper records
- source refs that point to a conceptual source rather than a literal path

When in doubt, document the limitation rather than making a risky auto-apply script.

---

## 12. Deliverables

Expected deliverables for this implementation:

1. Cleaned/formatted local editor MVP.
2. Hidden Unicode issue resolved locally or explicitly documented.
3. `docs/tooling/editor-patch-workflow.md` added or updated.
4. Optional `scripts/explain-editor-patch.js` added.
5. Optional `tools:explain-editor-patch` script added to `package.json`.
6. Existing `/editor/` behavior preserved.
7. Existing playable game behavior preserved.
8. Validation command results listed in the final response.
9. Known limitations listed clearly.
10. No commit/push unless explicitly requested.

---

## 13. Final Response Format for Codex

After implementing, respond with:

```md
## Summary
- What changed
- What was intentionally not changed

## Files changed
- path: purpose

## Verification
- command: result
- command: result

## Manual QA notes
- editor route status
- playable game route status
- patch export status

## Git/local state notes
- current branch, if known
- whether working tree has uncommitted changes
- no push/commit performed unless asked

## Known limitations
- limitation 1
- limitation 2

## Recommended next step
- usually collider/proxy visualization, not editing yet
```

---

## 14. Paste-Ready Codex Prompt

```md
You are working in my local Lumina3D project files.

Important local-first context:
- Work from the current local files, not directly from GitHub.
- Do not assume GitHub, `main`, a remote branch, or a draft PR reflects my current project state.
- Inspect the local file tree and current working tree before changing anything.
- Run `git status --short` if git is available.
- Do not switch branches unless I explicitly ask.
- Do not pull, push, merge, rebase, reset, or commit unless I explicitly ask.
- Make changes locally and report what changed.

Project context:
- Lumina3D is a Vite + Three.js browser game.
- The Level Editor MVP exists locally or is partially implemented locally.
- The editor should remain a separate `/editor/` route and must not become another in-game F2 debug overlay.
- The playable game at `/` must continue to function normally.
- The editor may already support Level Two loading, object selection, `TransformControls`, camera navigation, snap toggles, and JSON transform patch export.
- The current patch type may be `lumina3d.editor.transformPatch`; verify the actual local implementation.

Primary goal:
Harden the Level Editor MVP and make exported transform patches actionable for a human or AI assistant.

Tasks:
1. Inspect the current local project structure before changing anything.
2. Verify `/editor/` is a separate Vite route and does not import or boot `src/main.js` unless the local architecture intentionally uses safe shared modules.
3. Verify the playable game at `/` is not broken.
4. Remove suspicious hidden or bidirectional Unicode characters if present locally and not intentionally required.
5. Format compressed files if needed, especially:
   - `package.json`
   - `vite.config.js`
   - `editor/index.html`
   - `src/editor/**/*.js`
   - `src/editor/**/*.css`
6. Preserve current editor behavior.
7. Add or update `docs/tooling/editor-patch-workflow.md` explaining:
   - what editor patches are
   - how to copy/export them
   - how `sourceRef.file`, `sourceRef.exportName`, and `sourceRef.path` map to local level source data
   - how to apply transform patches to Level Two source data
   - examples for `LEVEL_TWO_POINTS`, `LEVEL_TWO_BLUE_RAMP`, `LEVEL_TWO_RED_BUTTONS`, `LEVEL_TWO_RED_PLATFORMS`, and `LEVEL_TWO_PROPS`, if those exist locally
   - validation commands to run after applying a patch
8. If safe and low-risk, add a dry-run script:
   - `scripts/explain-editor-patch.js`
   - npm script: `tools:explain-editor-patch`
   - It should read a patch JSON file and print suggested source edits.
   - It must not modify source files.
   - It must exit nonzero on malformed patches.
9. Add or update documentation for how to run and manually QA the editor.
10. Run relevant validation commands.

Non-goals:
- Do not add collider editing.
- Do not add object creation or deletion.
- Do not add behavior editing.
- Do not implement platform animation editing.
- Do not rewrite the level architecture.
- Do not migrate the game to another engine.
- Do not directly rewrite source files from the browser.
- Do not use GitHub as the source of truth.
- Do not commit or push unless I explicitly ask.

Validation commands to run if available:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

If you add the patch explanation script, also test it with a sample patch:

```bash
npm run tools:explain-editor-patch -- scratch/editor-patches/example.json
```

Final response format:

```md
## Summary
- What changed
- What was intentionally not changed

## Files changed
- path: purpose

## Verification
- command: result

## Manual QA notes
- editor route status
- playable route status
- patch export status

## Git/local state notes
- current branch, if known
- whether working tree has uncommitted changes
- no push/commit performed unless asked

## Known limitations
- limitation 1
- limitation 2

## Recommended next step
- usually collider/proxy visualization, not editing yet
```
```
