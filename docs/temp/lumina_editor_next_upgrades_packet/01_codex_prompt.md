# Codex Prompt — Lumina3D Level Editor Next Upgrades

```md
You are working in my local Lumina3D project files.

Important local-first context:
- Work from the current local files, not directly from GitHub.
- Do not assume GitHub, `main`, a remote branch, or any PR reflects my current project state.
- Inspect the local file tree and current working tree before changing anything.
- Run `git status --short` if git is available.
- Do not switch branches unless I explicitly ask.
- Do not pull, push, merge, rebase, reset, or commit unless I explicitly ask.
- Make changes locally and report what changed.

Current editor context:
- The Level Editor is under active local development.
- The editor is a separate `/editor/` route and must remain separate from the playable game.
- The playable game at `/` must continue to function normally.
- Recent editor upgrades may include camera tilt, object notes, note intent tags, copy/export state, mark delete, mark replace, and reset behavior.
- Some current bugs are being fixed separately: missing meshes/registry records, non-clickable objects, and objects arranged differently from the playable game.
- This task is for the next upgrade lane, not for those active bug fixes unless the bugs directly block this implementation.

Primary goal:
Round out the Level Editor so it becomes useful for refining Tutorial, Level One, Level Two, and eventually building Level Three.

Implement now:
1. Make selectable elevated/extra ground tiles movable when they are meant to be editor-editable.
2. Add search/filter controls to the editor object list so the list is usable even when ground/tile objects are included.
3. Prepare the data architecture for future timeline playback/scrubbing, but do not build a full timeline unless it is already nearly implemented locally.
4. Prepare the data architecture for a future asset library tab/panel, but do not build full asset placement unless it is very low-risk.

High-priority problem 1 — Ground/elevated tile movement:
- I can now select floor/ground/tile cubes such as grass, sand, central mountain tiles, etc.
- But I cannot move them with the same move controls as other editable objects.
- I want to be able to move at least elevated/additional tiles above the base ground.
- It is acceptable to keep base terrain locked if moving it would break the level, but the editor must make that state explicit.

Ground/tile implementation requirements:
1. Inspect how tiles are represented locally.
2. Determine whether tiles are normal Object3D/Mesh objects, child meshes under a root object, generated records, merged geometry, or InstancedMesh instances.
3. Ensure each selectable tile has a stable editor record with:
   - id
   - label
   - category/type
   - tags
   - movable/locked state
   - lock reason if locked
   - sourceRef if source-backed
4. If a tile is movable, TransformControls should attach to the correct transform target.
5. If a tile is a child mesh, attach controls to the intended editor root/wrapper, not an arbitrary child that cannot persist changes.
6. If tiles are instanced, do not pretend a single instance is a normal Object3D unless there is a proxy/edit wrapper. Implement a small editor proxy strategy or document why instanced tile movement is not supported yet.
7. Base ground may be locked by default, but elevated/extra tiles should be movable if source-backed.
8. Locked tiles should still be selectable/inspectable, but the inspector should clearly say why movement is disabled.
9. Exported state/AI prompt should include whether a selected tile was movable, locked, or attempted-to-move.

High-priority problem 2 — Editor object list filtering/search:
- The left object list is now overloaded because ground tiles were added.
- Add search and filter mechanisms to the editor object list.

Object list filtering requirements:
1. Add a search input above the object list.
2. Search should match at least:
   - id
   - label/name
   - category/type
   - asset key
   - tags
   - notes text if object notes exist
3. Add quick filter chips or toggles for common groups:
   - All
   - Dirty/Changed
   - Noted
   - Marked Delete
   - Marked Replace
   - Movable
   - Locked
   - Tiles/Ground
   - Elevated Tiles
   - Props
   - Buttons
   - Platforms
   - Colliders/Triggers if present
4. Add an option to hide base ground tiles by default if they flood the list.
5. Preserve selected object even if filters change, or clearly show when the selected object is hidden by filters.
6. Show visible/total object counts, e.g. `42 / 318 objects`.
7. Filtering should not delete or mutate objects.
8. Filtering state may persist in localStorage if this is consistent with existing editor preference behavior.
9. Update editor smoke/debug output to include search/filter state and visible object count.

Preferred search syntax:
- Basic text search should work first.
- If easy, support token-style filters later:
  - `type:tile`
  - `tag:elevated`
  - `asset:grass`
  - `state:dirty`
  - `mark:delete`
  - `movable:true`
  - `locked:true`

Future-scope problem 3 — Timeline/scrubber:
- I want a bottom timeline that can scrub through the intended level solution/animation.
- Default editor view should still show all objects in their starting positions.
- Timeline mode should allow dragging a playhead so platforms, buttons, triggers, appearances/disappearances, etc. move through the expected solution sequence.
- This is probably future scope, but prepare for it with a design doc and maybe a minimal data model if safe.

Timeline requirements for this sprint:
1. Add documentation or a small skeleton module only if low-risk.
2. Do not break current editor static/start-state view.
3. Define a future data model for `solutionTimeline`, `events`, and `tracks`.
4. Consider platform/button movement preview, not full runtime simulation.
5. Keep timeline playback separate from actual playable game logic for now.
6. Exported AI prompt/state should eventually include current timeline time if timeline mode is active.

Future-scope problem 4 — Asset library tab:
- I eventually want a tab/panel where I can browse assets available in the game and assets available for the current level.
- This will be critical for building Level Three.
- Do not fully implement drag/drop asset placement unless it is already nearly available locally.

Asset library requirements for this sprint:
1. Add planning/docs for an asset library panel.
2. If low-risk, add a read-only asset catalog tab that lists known assets from local asset config/registry.
3. Search/filter asset catalog by name, type/category, tags, and level availability.
4. Do not add new asset spawning/placement yet unless explicitly safe.
5. Future asset records should include:
   - assetKey
   - label
   - type/category
   - path/source
   - tags
   - dimensions/bounds if known
   - default scale/rotation if known
   - allowed levels or usage notes

Preserve existing editor features:
- camera tilt/pitch
- object notes
- @intent note tags/typeahead if present
- mark delete
- mark replace
- reset selected
- reset all/level if present
- copy patch/state/AI prompt export
- normal playable route

Non-goals:
- Do not implement full timeline playback unless a minimal version is already safe.
- Do not implement full asset placement/spawning yet.
- Do not add collider editing in this sprint.
- Do not rewrite level architecture wholesale.
- Do not directly rewrite source files from the browser.
- Do not migrate to another engine.
- Do not commit or push unless explicitly asked.

Validation:
Inspect package.json and run only commands that exist locally. Likely commands include:
- npm run build
- npm run editor
- npm run tools:list-levels -- --pretty
- npm run tools:get-level-manifest -- tutorial --pretty
- npm run tools:get-level-manifest -- level_one --pretty
- npm run tools:get-level-manifest -- level_two --pretty
- npm run tools:list-level-objects -- tutorial --pretty
- npm run tools:list-level-objects -- level_one --pretty
- npm run tools:list-level-objects -- level_two --pretty
- npm run tools:run-editor-smoke -- --pretty

Manual QA checklist:
1. Open /editor/.
2. Confirm playable / still works.
3. Confirm object list loads.
4. Confirm object list search filters by object id/name/type/asset/tags.
5. Confirm quick filters work.
6. Confirm visible/total object count is accurate.
7. Select a normal prop and move it.
8. Select a button/platform and move it.
9. Select a base ground tile and confirm it is either movable or clearly locked with a reason.
10. Select an elevated/extra tile and confirm it can be moved if source-backed.
11. Confirm TransformControls attach to the correct tile target.
12. Confirm exported state includes tile move/lock metadata.
13. Confirm existing notes/delete/replace/export behavior still works.
14. Confirm camera tilt still works.

Final response format:
## Summary
- What changed
- What was intentionally not changed

## Files changed
- path: purpose

## Verification
- command: result

## Manual QA notes
- playable route
- editor route
- object list filters
- tile selection/movement
- export state
- known issues

## Git/local state notes
- current branch if known
- working tree status
- no push/commit performed unless explicitly asked

## Known limitations
- limitation 1
- limitation 2

## Recommended next step
- likely timeline skeleton, asset library read-only tab, or collider/proxy visualization depending on stability
```
