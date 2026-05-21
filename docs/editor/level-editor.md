# Lumina3D Level Editor

`/editor/` is a separate Vite route for visual level-editing handoffs. It does
not boot the playable game entrypoint, does not use `src/main.js`, and does not
write source files from the browser.

## Open The Editor

```bash
npm run editor
```

Or start a normal dev server and open:

```txt
http://127.0.0.1:5178/editor/
```

The playable game remains at `/`.

## Supported Levels

The level picker is driven by editor adapters in `src/editor/levels/`.

- `tutorial`
- `home_intro`
- `level_one`
- `level_two`

Level Two has the richest source-mapped coverage. Tutorial, Home Intro, and
Level One are MVP previews with useful editable anchors, props, and selectable
terrain preview tiles. Generated or unclear terrain is selectable for notes and
AI handoff, but is marked read-only/manual-review instead of pretending it is a
safe transform patch target.

## Object And Asset Tabs

The left panel has two tabs:

- `Objects`: selectable level records, notes, movement locks, filters, and source-backed transform handoff.
- `Assets`: a read-only catalog from `src/config/assets.js` plus focused external 3D asset references from the local game-design library.

The Assets tab is for inspection only. It can search and filter local assets by
asset key, category, type, tags, source path, pack/folder, and known dimensions,
but it does not place, spawn, drag, import, or write assets into source files.
Selecting an asset preserves the current object selection and exports only
compact selected-asset context in State JSON and Copy AI Prompt.

## Object List Search And Filters

The object list is dense now that terrain tiles are selectable. Use the search
box above the list to filter by object id, name, category/type, asset key, tags,
or note text.

Examples:

```txt
blue ramp
id:level_two.terrain.central-mountain.1
type:tile
tag:elevated
asset:ground
state:dirty
mark:replace
movable:true
locked:true
```

The filter chips live behind the compact `Filters` disclosure so the list stays
dense. Quick filters cover common handoff groups: Changed, Noted, Delete,
Replace, Movable, Locked, Tiles, Elevated, Props, Buttons, Platforms, and
Colliders/Triggers. `Hide base ground` is on by default so base floor tiles do
not flood the list. Hidden filters never deselect or mutate objects; if the
selected object is hidden, the editor shows a warning with reveal/clear actions.

Asset filters are also behind `Filters`. Search stays visible, and the filter
summary shows the active category/source/pack/folder. The `Source` filter
distinguishes:

- `In project`: assets already served by Lumina3D through `src/config/assets.js`.
- `External`: available local 3D pack assets that are reference-only.

The first external scope indexes KayKit 3D packs and Cubeling/animal assets
under:

```txt
/Volumes/KyleSSD/Documents/My Projects/My Games/game_design/assets/graphics/sprite_packs/3D_packs
```

Use `Pack` and `Folder` filters to narrow KayKit and Cubeling assets. External
asset records show local file paths and stable `#external...` tokens, but they
are not imported into `public/assets` and are not placeable yet.

## Tile Editability

Selectable terrain records now carry explicit editability metadata:

```txt
type
tags
tileKind
movable
locked
lockReason
sourceBacked
```

Level Two elevated/source-backed tiles are movable in the editor and export as
transform handoff records. Base ground, generated terrain previews, and base
path tiles remain selectable for notes and AI context, but movement is locked
with a visible reason. That avoids pretending structural or generated terrain
has a clean one-object source mapping when it does not.

`Copy State JSON` and `Copy AI Prompt` include the selected object context even
when the selected item has no transform changes. This is useful when inspecting
a locked base tile and explaining what should change through notes rather than
moving it directly.

## Core Controls

- Select objects from the list or by clicking the viewport.
- Select `Map Notes` or click empty viewport space to clear object selection and write notes for the overall level.
- `T`: move/translate mode.
- `R`: rotate mode.
- `F`: frame selected.
- `Escape`: clear selection.
- `W/A/S/D`: pan the editor camera.
- `Q/E`: rotate camera yaw.
- `[` / `]`: tilt camera pitch.
- Wheel, trackpad gesture over the canvas, `+`, and `-`: editor camera zoom.
- `Show Colliders`: toggle editor-only collider/proxy boxes in the viewport.
- `Reset Selected`: restore the selected object to its load-time transform.
- `Reset Level`: restore all current-level transforms and clear notes/delete/replace marks after confirmation.

## Collider And Proxy Preview

`Show Colliders` displays editor-only helper boxes for likely collision,
walkable, terrain, trigger, and visual-boundary proxies. Selected object proxies
are highlighted, and the inspector's `Collider Preview` panel shows proxy
labels, source type, and manual-review flags.

These helpers are handoff context, not editable collider source. `source-hint`
proxies are derived from known level data where the adapter can map them safely.
`visual-proxy` and `manual-review` proxies are useful spatial evidence, but a
future implementation pass still needs to inspect local collider code and run
the collider validators before changing gameplay collision behavior.

Level Two now has richer source-backed mechanism hints for the blue ramp, blue
button, red buttons, red platforms, Elephant Echo, Elephant Totem, and important
route/transition areas. These hints are still read-only. They exist so a copied
AI prompt can distinguish visual movement from paired trigger/walkable/collider
review.

## Object Notes

Object and level notes are plain textarea text persisted per level in
localStorage. Type `@` in the note field to open intent suggestions, keep typing
to filter, then use arrow keys plus Enter/Tab or click to insert a tag. Intent
suggestions show a short meaning plus usage/example detail on hover or keyboard
focus.

Type `#` to reference another editor object or asset without copying names by
hand. The left panel decides the suggestion source:

- On `Objects`, `#` suggests current-level objects and inserts stable tokens such as `#level_two.blue_ramp`.
- On `Assets`, `#` suggests read-only asset catalog records and inserts stable tokens such as `#blueRamp` or `#external.kaykits.medieval_pack.building_bridge_a`.

Notes stay plain text, but State JSON and Copy AI Prompt expand references into
`noteReferences` and `referenceGlossary` so Codex can see source refs,
transforms, editability, collider context, asset paths, and placement-disabled
status behind the token.

When no object is selected, the inspector switches to `Level Note`. Use that for
map-wide observations such as terrain readability, broad collision concerns, or
overall puzzle-state instructions. Level notes export at the top level of State
JSON and Copy AI Prompt as `levelNote`, `levelNoteTags`, and
`levelNoteIntents`.

Supported intent tags:

```txt
@move @rotate @scale @fade @appear @disappear @spawn @trigger @button @platform @collision @replace
```

Note actions:

- `Save Note`: explicitly saves the current note and gives feedback. Notes also auto-save.
- `Copy Note`: copies the selected object's note, or the level note when no object is selected.
- `Clear Note`: removes the selected object's note, or the level note when no object is selected.

## Delete And Replace Marks

`Mark Delete` and `Mark Replace` are export-only intent flags. They never remove,
hide, or swap objects in the editor. The two marks are mutually exclusive:
marking one clears the other.

Use replacement details in the note, for example:

```txt
@replace replace this crate with a taller broken pillar asset, preserving its blocking role
```

## Export Buttons

- `Copy Patch JSON`: delta-only transform patch using `lumina3d.editor.transformPatch.v1`.
- `Copy State JSON`: affected-object state using `lumina3d.editor.stateExport.v1`, including notes, references, selected context, and collider hints.
- `Copy AI Prompt`: Markdown handoff prompt with local-first rules, summary counts, validation commands, intent/reference glossaries, and the state JSON in a fenced code block.

Hover or focus these buttons in the editor for a compact description of what
each export copies. Use `Copy Patch JSON` for the smallest transform delta, and
`Copy AI Prompt` for the normal Codex implementation handoff.

`window.render_editor_to_text()` returns compact smoke-test state including
active level, supported levels, selected object, dirty/noted/delete/replace
counts, selection mode, selectable terrain count, active and level note tags,
typeahead availability, collider/proxy counts, camera yaw/pitch/zoom, and
patch/state summaries. It also reports object-list filter state, visible object
count, selected hidden status, movable/locked tile counts, and selected-object
lock details. The hook also reports note-reference typeahead availability,
active note query context, reference counts, selected object/asset reference
tokens, and export-tooltip availability.

## Future Timeline And Asset Library

The editor now has architecture placeholders for future work:

- `lumina3d.editor.solutionTimeline.v1`: inactive timeline model for future
  solution playback/scrubbing tracks and events.
- `lumina3d.editor.assetCatalog.v1`: visible read-only asset catalog from the
  local asset registry plus generated external reference records.

There is no visible timeline, drag/drop placement, or playback simulation in
this slice. Asset placement should come only after the editor can export
explicit add-intent records with stable proposed IDs and source ownership.

## Current Limits

- No source-file rewriting from the browser.
- No drag-in placement or source-backed asset creation yet.
- Asset catalog is read-only; selected in-project and external assets are context only.
- External assets are not runtime-loaded, imported, served, or placeable from the editor.
- No object creation/deletion from source files yet.
- Collider/proxy visualization only; no collider editing.
- No behavior simulation, timeline playback, or platform animation editor.
- No rich-text note editor.
