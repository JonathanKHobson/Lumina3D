# Lumina3D Dev Editor Hardening Pass 1 — Local Codex Packet

Prepared for: Jonathan / Kyle
Project: Lumina3D
Lane: AI feedback/debug system, separate from the full level editor lane
Date: 2026-05-20

---

## 0. Critical workflow correction

Codex is **not** working directly in GitHub.

Codex should operate on the **local Lumina3D working tree** that is open on the developer machine. GitHub is only a reference/checkpoint location. Do not assume the GitHub `main` branch, a GitHub PR branch, or the remote repo reflects the exact local state.

The correct workflow is:

1. Work inside the local Lumina3D project folder.
2. Inspect the local files first.
3. Make changes locally.
4. Run build/tests/tools locally.
5. Let the human review the diff.
6. The human decides when to commit and push to GitHub.

Do **not** commit, push, merge, or make GitHub-side assumptions unless the human explicitly asks.

---

## 1. Goal of this implementation pass

Implement a small hardening pass on the Dev Editor MVP so it becomes a more reliable **AI feedback/context capture system**.

This pass should improve:

- actual collider visualization
- schema naming consistency
- test-friendly context hooks
- `/editor/` smoke coverage
- documentation for the runtime Dev Editor vs. separate level editor route

This pass should **not** become a full level editor expansion.

---

## 2. Lane boundary

This lane is the **AI feedback/debug system lane**.

### In scope

- runtime F2 Dev Editor improvements
- actual collider overlay
- Copy AI Context reliability
- Export Scene Patch Draft reliability
- browser-safe test hooks
- docs explaining how to use the context/patch loop
- small `/editor/` smoke coverage if the route exists locally

### Out of scope

- direct source-file writes from the browser
- object creation/deletion tools
- asset browser
- terrain tools
- full undo/redo history system
- MCP/tool server
- new gameplay mechanics
- broad Level Two design changes
- GitHub commits/pushes/merges

---

## 3. In-chat prompt to give Codex

Paste the following prompt into Codex while Codex is running in the **local Lumina3D project root**.

```md
You are working on Lumina3D in my LOCAL working tree, not directly in GitHub.

Important workflow correction:
- Treat the local files as the source of truth.
- Do not assume GitHub main, a GitHub PR branch, or any remote branch reflects the current local state.
- Do not commit, push, merge, or create branches unless I explicitly ask.
- Do not use GitHub-side workflows. Work only on local files and report the diff/verification results.

Goal:
Do a small hardening pass on the Dev Editor MVP so it becomes a more reliable AI feedback/debug context system.

Lane boundary:
This is separate from the full level editor lane. Do not expand this into a full editor. Do not add source-file writing from the browser. Do not add object creation/deletion. Do not add asset palette/tooling. Do not add new gameplay mechanics.

Read/inspect local files first:
- package.json
- README.md
- AGENTS.md, if present
- AI_GAME_DEV.md, if present
- docs/project-map.md, if present
- docs/tooling/overview.md, if present
- docs/ai-prompt-workflow/README.md, if present
- docs/ai-prompt-workflow/context-packet-schema.md, if present
- index.html
- src/main.js
- src/debug/devEditor.js
- src/debug/devEntityRegistry.js, if present
- src/ui/hud.js
- src/styles.css
- src/editor/EditorApp.js, if present
- src/editor/EditorPatchExporter.js, if present
- src/editor/levelTwoAdapter.js, if present
- scripts/run-scene-smoke.js, if present
- scripts/validate-missing-colliders.js, if present
- scripts/validate-float-colliders.js, if present

First action before coding:
1. Run or inspect `git status --short` so we know whether the local tree has uncommitted changes.
2. Inspect the local package scripts in package.json.
3. Inspect the current Dev Editor implementation.
4. Report a concise implementation plan with exact files you plan to touch.
5. Then implement the smallest safe version.

Current target behavior:
The runtime F2 Dev Editor should support a better AI debugging loop:
1. Reproduce issue in game.
2. Open F2 Dev Editor.
3. Toggle actual colliders on.
4. Select suspicious object.
5. Copy AI Context.
6. Export Scene Patch Draft if transform/collider data changed.
7. Human gives the JSON to an AI/dev assistant.
8. AI proposes a minimal source patch.
9. Human reviews, applies, builds, and smoke-tests.

Deliverable 1 — Actual collider overlay:
- If the current Dev Editor only shows mesh BoxHelpers or visual bounds, add a separate overlay for actual collider debug entries.
- Prefer to consume an existing provider such as `getCurrentSceneColliderDebugEntries()` if it exists.
- If the provider does not exist, add the smallest safe provider in `src/main.js` or the appropriate local runtime file.
- Keep visual selection bounds separate from actual runtime collision proxies.
- Render actual colliders as wireframe boxes/meshes from center + halfExtents.
- For flat 2D AABB colliders with zero or tiny Y height, render a small visible height such as 0.05 or 0.1 so the overlay is visible.
- Mark every helper object with `userData.devEditorHelper = true` and propagate that flag to child meshes so click-selection ignores helpers.
- Preserve the existing Colliders On/Off toggle.
- If a selected entity has matched colliders, highlight those actual colliders differently from non-selected colliders.
- Do not remove the selected-object visual bounds helper. Visual bounds and actual colliders should both be understandable.

Deliverable 2 — Schema naming cleanup:
- Align schema names across runtime output and docs.
- Prefer these names:
  - `lumina3d.dev.aiContext.v1`
  - `lumina3d.dev.scenePatch.v1`
  - `lumina3d.editor.transformPatch.v1`
- Update runtime output and docs to match.
- Avoid changing payload semantics unless necessary.
- If older schema names are still referenced for backwards compatibility, document that clearly.

Deliverable 3 — Test-friendly context hooks:
- Add a dev/test-safe way to retrieve the same payloads that Copy AI Context and Export Patch Draft produce.
- Example shape:

```js
window.__luminaDevEditor = {
  buildAiContextPayload,
  buildPatchDraftPayload,
  listEntities,
  selectEntityById
};
```

- It is fine if this is only exposed in development/test mode.
- Do not expose functions that write source files.
- These hooks should return plain JSON-serializable values where practical.
- The hook payloads should match the button payloads, not a separate duplicate implementation.

Deliverable 4 — `/editor/` smoke coverage if the separate editor route exists locally:
- If `/editor/` exists locally, add or extend the smallest existing smoke/test script to verify:
  - `/editor/` loads.
  - `window.render_editor_to_text()` exists if currently intended.
  - the text payload reports something like mode `level-editor`, or another stable local indicator.
  - at least one editable object exists.
  - selecting/defaulting to a known object works if local data supports it.
  - a small transform change produces a dirty patch with a source reference if the editor patch system supports that.
- If `/editor/` does not exist locally, do not create a broad new editor route in this pass. Document that the route is absent and skip this deliverable.

Deliverable 5 — Documentation update:
- Update the local docs that exist to explain the split:
  - F2 runtime Dev Editor = runtime inspection, actual collider visualization, AI context capture, scene patch draft export.
  - `/editor/` route, if present = separate transform patch editor, currently not the same as runtime debug.
  - Neither tool writes source files directly from the browser.
  - Expected workflow is capture/export → AI patch proposal → human review → source edit → build/smoke/validator checks.
- Keep docs concise and practical.

Implementation requirements:
- Use local source of truth only.
- Make the smallest safe changes.
- Preserve existing Dev Editor behavior:
  - F2 toggles the panel.
  - object-list selection still works.
  - click selection still works if already implemented.
  - nudge/rotate/snap still work.
  - TransformControls still work if already implemented.
  - collider toggle still works.
  - production player behavior is unchanged with Dev Editor closed.
- Avoid broad refactors.
- Avoid changing gameplay data except where absolutely required to expose debug context.
- Avoid changing asset files.
- Avoid hidden behavior that silently writes files.

Verification:
Use the scripts that exist in local package.json. Do not invent scripts if local package.json does not define them.

At minimum, try:

```bash
npm run build
```

If these scripts exist locally, also run relevant ones:

```bash
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- tutorial --pretty
npm run tools:run-scene-smoke -- home_intro --pretty
npm run tools:run-scene-smoke -- level_one --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

Manual checks:
- `npm run dev`
- Open the game locally.
- Press F2.
- Toggle Colliders On.
- Confirm actual collider proxies are visually distinguishable from visual selection bounds.
- Select an editable object.
- Copy AI Context and confirm the JSON parses.
- Export Patch Draft and confirm the JSON parses.
- Confirm Dev Editor helper objects are not accidentally selectable.

If `/editor/` exists:
- Run the local editor script if package.json defines one, likely `npm run editor`.
- Confirm `/editor/` loads.
- Confirm transform patch export still works.

After coding, report:
1. Files changed.
2. What was implemented.
3. What was intentionally not implemented.
4. Verification commands run and results.
5. Any commands that could not run and why.
6. A short sample summary of the AI Context payload, not a giant full JSON dump unless asked.
7. Any manual testing notes.
```

---

## 4. Implementation spec details

### 4.1 Actual collider overlay

The runtime Dev Editor needs to distinguish:

| Overlay | Meaning |
|---|---|
| selected-object helper | visual bounds of the selected mesh/object |
| actual collider helpers | runtime collision proxies used by movement/collision code |
| TransformControls helper | gizmo only; should not be selectable |

The current problem to avoid:

> The Colliders toggle appears to show BoxHelpers around meshes, which can look like colliders but may not represent the actual collision data.

Desired behavior:

- Selection helper remains tied to the selected mesh/object.
- Actual collider helpers are created from collider debug entries.
- Flat X/Z collision blockers receive a small display height so they are visible.
- Selected entity's matched collider(s) are visually distinguished.
- All helper objects are marked `userData.devEditorHelper = true`.

Suggested collider debug entry shape:

```ts
type DevColliderDebugEntry = {
  id: string;
  sceneId: string;
  label: string;
  source: string;
  sourceFileHint?: string;
  active: boolean;
  type: "aabb" | "box" | "trigger" | "walkable" | "unknown";
  center: [number, number, number];
  halfExtents: [number, number, number];
  rotationEuler?: [number, number, number];
  matchedEntityIds?: string[];
};
```

If the project currently uses 2D AABB collision data like `point`, `halfX`, `halfZ`, normalize it into:

```js
center: [point.x, y, point.z]
halfExtents: [halfX, visibleHalfY, halfZ]
```

Use a small `visibleHalfY` like `0.05` or `0.1` if real collision is flat.

---

### 4.2 Schema names

Use these canonical schema IDs:

```txt
lumina3d.dev.aiContext.v1
lumina3d.dev.scenePatch.v1
lumina3d.editor.transformPatch.v1
```

Avoid mixing these older names unless explicitly documented:

```txt
lumina.dev.aiContext.v1
lumina.dev.scenePatch.v1
lumina3d-ai-context-v1
lumina3d.editor.transformPatch
```

---

### 4.3 Copy AI Context payload

Recommended shape:

```json
{
  "schema": "lumina3d.dev.aiContext.v1",
  "capturedAt": "2026-05-20T00:00:00.000Z",
  "project": {
    "name": "Lumina3D",
    "stack": "Vite + Three.js",
    "lane": "AI feedback/debug system",
    "sourceSaving": "browser-export-only"
  },
  "coordinateConventions": {
    "worldUp": "+Y",
    "movementPlane": "X/Z",
    "sourceRotationUnits": "radians",
    "uiMayDisplayDegrees": true
  },
  "scene": {
    "id": "level_two",
    "phase": "..."
  },
  "selection": {
    "id": "...",
    "name": "...",
    "category": "...",
    "asset": {},
    "transform": {},
    "visualBounds": {},
    "collision": {},
    "sourceFileHint": "..."
  },
  "nearbyEntities": [],
  "colliders": [],
  "camera": {},
  "actors": {},
  "runtime": {},
  "issueTemplate": {
    "observed": "",
    "expected": "",
    "notes": ""
  },
  "patchTargets": {
    "selectedEntityId": "...",
    "sourceFileHint": "...",
    "browserMayWriteSourceFiles": false
  }
}
```

Important principle:

> The button payload and the test hook payload must be built by the same function.

Do not create one schema for the UI button and a separate schema for tests.

---

### 4.4 Scene Patch Draft payload

Recommended shape:

```json
{
  "schema": "lumina3d.dev.scenePatch.v1",
  "patchId": "scene-patch-...",
  "createdAt": "2026-05-20T00:00:00.000Z",
  "sceneId": "level_two",
  "issueType": "",
  "selectedEntityId": "...",
  "changes": [
    {
      "path": "transform.local.position",
      "oldValue": [0, 0, 0],
      "newValue": [1, 0, 0],
      "sourceFileHint": "src/scenes/...",
      "reason": ""
    }
  ],
  "validationCommands": [
    "npm run build"
  ],
  "manualChecks": []
}
```

Important principle:

> The browser exports a draft. It does not write source files.

---

### 4.5 Test hook shape

Recommended browser global:

```js
window.__luminaDevEditor = {
  buildAiContextPayload,
  buildPatchDraftPayload,
  listEntities,
  selectEntityById
};
```

Rules:

- expose only in dev/test mode if practical
- return JSON-serializable values
- no source writes
- no commits
- no network calls
- no GitHub assumptions

---

## 5. Validation plan

### Required local validation

Always inspect local package scripts first:

```bash
cat package.json
```

Then run the commands that actually exist.

Minimum:

```bash
npm run build
```

Likely helpful if present:

```bash
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

Manual runtime check:

```bash
npm run dev
```

Manual editor-route check, if present:

```bash
npm run editor
```

---

## 6. Acceptance criteria

This pass is successful when:

- local build passes
- F2 Dev Editor still opens/closes
- existing object selection still works
- click selection still ignores dev helper objects
- TransformControls still work if present
- collider toggle shows actual runtime colliders, not only mesh bounds
- selected entity's matched actual colliders are distinguishable
- Copy AI Context emits valid JSON using `lumina3d.dev.aiContext.v1`
- Export Patch Draft emits valid JSON using `lumina3d.dev.scenePatch.v1`
- test hook returns the same payloads as the buttons
- docs explain the runtime Dev Editor vs `/editor/` route split
- no browser-side source-file writing is introduced
- no GitHub-side actions are taken by Codex

---

## 7. What to explicitly avoid

Do not do these in this pass:

- do not build the full level editor
- do not add source-file saving from the browser
- do not add GitHub automation
- do not commit or push
- do not create gameplay content
- do not redesign Level Two
- do not refactor the whole scene system
- do not replace the collision system
- do not add MCP yet
- do not make the AI context payload dependent on remote GitHub state

---

## 8. Final report template for Codex

After implementation, Codex should answer with:

```md
## Dev Editor Hardening Pass 1 Report

### Files changed
- ...

### Implemented
- ...

### Intentionally not implemented
- ...

### Verification run
- `npm run build`: pass/fail
- other commands: pass/fail/not available

### Manual checks
- F2 Dev Editor: pass/fail/not checked
- Colliders toggle: pass/fail/not checked
- Copy AI Context JSON parses: pass/fail/not checked
- Export Patch Draft JSON parses: pass/fail/not checked
- /editor route: pass/fail/not present/not checked

### AI Context sample summary
- schema: ...
- selected entity: ...
- collider count: ...
- nearby entity count: ...
- source hint included: yes/no

### Notes / risks
- ...
```

---

## 9. Human workflow after this pass

After Codex finishes:

1. Review the diff manually.
2. Run the verification commands locally.
3. Open the game and test F2 Dev Editor.
4. Capture one real bug using Copy AI Context.
5. Paste that context into an AI/dev assistant and ask for a minimal patch.
6. Apply patch manually or with Codex.
7. Run build/smoke/validator checks again.
8. Commit locally only when the checkpoint feels stable.
9. Push to GitHub when ready.
