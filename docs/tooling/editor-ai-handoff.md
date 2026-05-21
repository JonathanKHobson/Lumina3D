# Editor AI Handoff

The editor's main production workflow is visual intent capture:

1. Open `/editor/`.
2. Select a level and object, or select `Map Notes` for overall level intent.
3. Move, rotate, or resize objects where needed.
4. Use object search/filters when the list is tile-heavy.
5. Use the Assets tab when you need asset context, replacement candidates, or draft add-intent markers.
6. Add plain-text object or level notes with `@intent` tags and `#` references.
7. Mark objects for delete or replace when needed.
8. Choose a collider view mode when spatial context matters.
9. Click `Copy AI Prompt`.

The copied prompt is designed for a local Codex session. It tells the assistant
to inspect local files first, preserve playable `/`, keep `/editor/` separate,
avoid Git operations unless asked, apply clear source-backed transform changes,
and run validation after edits.

## Intent Tags

Intent meanings live in one registry:

```txt
src/editor/EditorNoteIntents.js
```

The registry currently supports:

```txt
@move @rotate @scale @fade @appear @disappear @spawn @trigger @button @platform @collision @replace
```

Object notes stay simple, for example:

```txt
@move raise this platform slightly so it meets the ramp edge
```

Exports expand tags into `noteIntents` and a top-level `intentGlossary` so a
future assistant does not have to guess what the tag means.

Level notes use the same textarea/typeahead behavior when no object is selected.
They are for map-wide intent such as terrain readability, broad collision
concerns, or overall puzzle changes.

## Note References

Type `#` in the note textarea to reference editor records without manually
copying IDs. The suggestion source follows the active left-panel tab:

- `Objects`: current-level objects, inserted as stable tokens like `#level_two.blue_ramp`.
- `Assets`: read-only asset catalog records, inserted as stable tokens like `#blueRamp` or `#external.kaykits.medieval_pack.building_bridge_a`.

These tokens remain plain text in the note. Exports resolve them into
`noteReferences` on affected objects or `levelNoteReferences` for map notes, plus
a top-level `referenceGlossary`. Object glossary entries include source refs,
transform context, editability, and collider hints when available. Asset
glossary entries include asset key, source scope, pack/folder, local file path,
type/category, dimensions where known, reference-only status, and
`placementEnabled: false`. Asset entries also report
`draftPlacementEnabled: true` because draft ghosts/markers are editor-only
add-intent records, not source writes.

If a token is unresolved, Codex should inspect local source before guessing or
propose options if the intended object/asset is ambiguous.

## State JSON Shape

`Copy State JSON` and `Copy AI Prompt` use:

```txt
lumina3d.editor.stateExport.v1
```

Top-level fields include:

- `levelId`
- `selectedId`
- `supportedLevelIds`
- `camera`
- `levelNote`
- `levelNoteTags`
- `levelNoteIntents`
- `levelNoteReferences`
- `colliderOverlay`
- `colliderDiagnostics`
- `selectedColliderProxies`
- `selectedObjectContext`
- `objectFilter`
- `timeline`
- `assetCatalog`
- `draftPlacements`
- `draftPlacementCount`
- `affectedObjectCount`
- `affectedItemCount`
- `transformChangeCount`
- `noteCount`
- `levelNoteCount`
- `totalNoteCount`
- `deleteCount`
- `replaceCount`
- `replacementCandidateCount`
- `intentGlossary`
- `referenceGlossary`
- `referenceCount`
- `objects`

Each affected object includes:

- `objectId`, `name`, `category`, `assetKey`
- `type`, `tags`, `tileKind`
- `movable`, `locked`, `lockReason`, `sourceBacked`, `generated`
- `sourceRef`
- `originalTransform`
- `currentTransform`
- `changes`
- `note`
- `noteTags`
- `noteIntents`
- `noteReferences`
- `markedForDelete`
- `markedForReplace`
- `replacementCandidate`
- `actionIntent`
- `colliderProxies`

Selectable terrain preview records may appear as locked/manual-review objects
when they have notes, delete/replace marks, or selected-object context. Do not
treat generated terrain records as direct source-edit instructions unless their
`sourceRef` clearly names a source-backed terrain array.

Level Two elevated terrain tiles are currently the safest movable tile class.
Base ground/path tiles remain selectable but locked. Use `lockReason` and
`selectedObjectContext` to understand whether the user moved an object, simply
inspected it, or needs a note-driven source review.

`actionIntent` is one of:

```txt
none | delete | replace
```

## Delete Vs Replace

Delete means the object is a deletion candidate. Replace means the object should
not simply disappear; it should be swapped or reworked while preserving role,
behavior, or linkage where appropriate. If replacement details are unclear, the
assistant should propose options instead of guessing.

When the user assigns an asset, affected objects include a structured
`replacementCandidate`:

```json
{
  "schema": "lumina3d.editor.replacementCandidate.v1",
  "token": "#blueRamp",
  "type": "asset",
  "assetKey": "blueRamp",
  "sourceScope": "in-project",
  "preserveRole": true,
  "manualReview": false
}
```

Treat this as intended direction, not proof that the replacement is already
implemented. For external assets, inspect/import/register before runtime use.

## Draft Placements

Draft placements are proposed additions. They are not source-backed editor
objects yet, and they never appear in transform patch JSON.

If a draft was placed by mistake, select it and use `Remove Draft`. That deletes
the editor-only ghost/marker from the current level draft storage. Do not use
`Mark Delete` for draft placements; `Mark Delete` is reserved for source-backed
objects that should become delete intent in a Codex handoff.

Each draft placement includes:

- `schema: lumina3d.editor.draftPlacement.v1`
- `draftId`
- `assetKey`
- `referenceToken`
- `sourceScope`
- `previewType`
- `actionIntent: add`
- `proposedObjectId`
- `transform`
- `note`
- `referenceOnly`
- `manualReview`

In-project drafts use `previewType: "ghost-model"` when the asset can be cloned
for preview. Procedural editor drafts use `previewType: "procedural-model"` and
`manualReview: true`; for example `#procedural.lilyPad.tile` is generated in
the editor but still needs deliberate runtime source work if accepted. External
drafts use `previewType: "marker"`, `referenceOnly: true`, and
`manualReview: true`. Codex should materialize accepted drafts through the normal
level source/scene builder paths, preserving playable `/` and the separate
`/editor/` route.

## Patch JSON Vs State JSON Vs AI Prompt

- `Copy Patch JSON`: smallest delta-only transform payload for source coordinate edits.
- `Copy State JSON`: structured affected-object handoff for scripts or AI, including references and selected context.
- `Copy AI Prompt`: full Markdown instruction packet for Codex with intent and reference glossaries.

Use `Copy AI Prompt` for normal implementation handoffs. Use patch/state JSON
when you need a smaller machine-readable artifact.

## Object Filters

The object-list filter state is included as `objectFilter` so a future AI can
understand what the user was looking at while selecting or noting objects.
Search supports plain terms and lightweight tokens such as `type:tile`,
`id:level_two.blue_ramp`, `tag:elevated`, `state:dirty`, `mark:delete`,
`movable:true`, and `locked:true`.

## Asset Catalog Context

The Assets tab is a browser for in-project asset registry entries and focused
external 3D pack references. It is useful when a note says something like
`@replace use a taller platform asset` and the user wants to point at a known
asset key, or when a draft placement needs an asset token and transform.

Asset filters are collapsed behind `Filters` to keep the left panel usable.
Search remains visible. The source filter distinguishes `In project` from
`External`, and pack/folder filters help narrow KayKit and Cubeling records.

External records come from:

```txt
/Volumes/KyleSSD/Documents/My Projects/My Games/game_design/assets/graphics/sprite_packs/3D_packs
```

They are generated by:

```bash
npm run tools:build-external-asset-index -- --pretty
```

External references are metadata-only local library pointers. They are not
imported into `public/assets` and are not runtime-loaded. If an AI prompt
contains an external `#external...` reference or draft marker, Codex should
treat it as a candidate asset to inspect or propose, not as proof that the asset
already exists inside Lumina3D.

`assetCatalog` in copied state is intentionally compact. It includes catalog
counts, filter state, `placementEnabled: false`, `draftPlacementEnabled: true`,
and the selected asset context when one is selected. It does not include every
catalog record, and it does not mean the editor wrote a source-backed object.

## Collider/Proxy Context

Editor collider/proxy data is visual handoff evidence. It helps a future Codex
session see whether an object move probably needs a paired collider, trigger, or
walkable-proxy review. `Collider View` can filter the overlay to All, Blocking,
Walkable, Triggers, Visual Bounds, Actor Walkability, or Problems Only.

Level Two has source-backed hints for the blue ramp, blue button, red
buttons/platforms, Elephant Echo, Elephant Totem, Love Letter route, and major
route/transition areas. Use those hints to identify what source data needs
inspection before touching gameplay collision or trigger logic.

Proxy source meanings:

- `source-hint`: derived from known level data in an editor adapter.
- `visual-proxy`: derived from the object bounds shown in the editor.
- `manual-review`: useful spatial clue, but not authoritative runtime collision.

Do not treat these proxies as direct collider-edit instructions. Change collider
source only when the object note explicitly asks for `@collision`, or when a
transform edit clearly requires checking and moving the paired gameplay proxy.

`colliderDiagnostics` includes selected proxy roles, an actor walkability matrix
for Human/Frog/Elephant, selected-object warnings, and global problem counts.
Problem warnings are review evidence. They should guide source inspection, not
automatically rewrite collision data.

## Validation After Applying A Handoff

Run the commands that exist locally and match the edited level:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:list-level-objects -- <level_id> --pretty
npm run tools:run-scene-smoke -- <level_id> --pretty
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
npm run tools:validate-editor-sync -- <level_id> --pretty
npm run tools:run-editor-smoke -- --pretty
```

## Future Scope

The timeline scrubber, mechanism-link overlay, collider editing, source-file
writing, and full external-asset importing are intentionally future work. Draft
placement is already export-only add intent; keep it out of patch JSON and let a
Codex/source-edit pass decide what becomes real gameplay data.
