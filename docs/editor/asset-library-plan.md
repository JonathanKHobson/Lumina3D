# Editor Asset Library Plan

The Level Editor needs a future asset library for Level Three building. The
current slice supports catalog browsing plus editor-only draft ghosts/markers,
but still stops before drag/drop source placement, runtime import, or browser
source writing.

## Current Catalog And Draft Lane

`src/editor/EditorAssetCatalog.js` builds `lumina3d.editor.assetCatalog.v1`
records from `src/config/assets.js`, procedural editor assets in
`src/editor/EditorProceduralAssets.js`, and the generated external reference
snapshot in `src/editor/EditorExternalAssetCatalog.generated.js`.

`/editor/` exposes those records in a visible `Assets` tab beside the object
list. `Place Ghost` creates export-only draft placement records:

- in-project assets can preview as mostly opaque ghost models when the asset is
  cloneable from the existing cache
- procedural assets preview as generated editor models, starting with a
  tile-sized lily pad for water-layout sketches
- external assets preview as labeled footprint markers
- both export as `draftPlacements` in State JSON and Copy AI Prompt
- neither writes source files, imports external assets, or makes runtime objects

`placementEnabled` remains `false`. `draftPlacementEnabled` is `true` to signal
that the browser can sketch intent without claiming source ownership.

The external snapshot is refreshed manually:

```bash
npm run tools:build-external-asset-index -- --pretty
```

The first indexing scope is intentionally focused:

```txt
/Volumes/KyleSSD/Documents/My Projects/My Games/game_design/assets/graphics/sprite_packs/3D_packs/Kaykits
/Volumes/KyleSSD/Documents/My Projects/My Games/game_design/assets/graphics/sprite_packs/3D_packs/Cubeling Pack
```

The scanner skips `._*` AppleDouble sidecars, prefers `gltf`, `glb`, `obj`,
`fbx`, then `vox`, and deduplicates common same-model format variants into one
reference record where possible.

Each asset record exposes:

```txt
assetKey
label
type
category
source
sourceScope
provider
packName
folderPath
relativePath
format
tags
targetFootprint or targetHeight
allowedLevels
usageNotes
placementEnabled
draftPlacementEnabled
```

The catalog can be searched and filtered by asset key, category, type, tag, and
source path. The `Filters` disclosure adds source, pack, and folder controls:

- `In project`: records already served by Lumina3D through `public/assets`.
- `Procedural`: editor-generated draft assets that are not runtime source yet.
- `External`: local game-design library records that can be referenced in notes
  but are not imported into the game.

Selecting an asset preserves object selection and adds compact selected-asset
context to editor debug/export state. Full record dumps are not included in
copied state by default.

Asset note references use stable tokens such as:

```txt
#procedural.lilyPad.tile
#external.kaykits.medieval_pack.building_bridge_a
#external.cubeling_pack.animals.elephant
```

State JSON and Copy AI Prompt expand those tokens with pack, folder, source path,
format, tags, and explicit `placementEnabled: false`,
`draftPlacementEnabled: true`, source scope, and reference/manual-review status.

## Draft Placement Shape

Draft placement records represent proposed new instances with stable ids and
export-only add-intent data. The browser editor still must not write source
files directly.

If a draft ghost or marker was placed by mistake, select it and use
`Remove Draft`. That deletes only the editor draft record and its draft note
metadata from localStorage. It does not touch level source files.

Draft placement records include:

- proposed stable object id
- asset key
- starting transform
- target level
- source ownership or manual-review flag
- add/replace intent notes

## Future Placement Lane

The next placement expansion should be drag/click placement ergonomics and
better source ownership review, not browser source writing. Full external asset
importing, source-backed object creation, and runtime behavior wiring remain a
Codex/source-edit task after the draft is accepted.
