# Editor Asset Library Plan

The Level Editor needs a future asset library for Level Three building, but this
slice intentionally stops at a read-only data catalog. No drag/drop placement or
source writing is implemented yet.

## Current Read-Only Catalog

`src/editor/EditorAssetCatalog.js` builds `lumina3d.editor.assetCatalog.v1`
records from `src/config/assets.js` and the generated external reference
snapshot in `src/editor/EditorExternalAssetCatalog.generated.js`.

`/editor/` now exposes those records in a visible `Assets` tab beside the
object list. This is intentionally read-only: there is no drag/drop placement,
spawn preview, runtime import, source rewrite, or add-object export yet.

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
```

The catalog can be searched and filtered by asset key, category, type, tag, and
source path. The `Filters` disclosure adds source, pack, and folder controls:

- `In project`: records already served by Lumina3D through `public/assets`.
- `External`: local game-design library records that can be referenced in notes
  but are not imported into the game.

Selecting an asset preserves object selection and adds compact selected-asset
context to editor debug/export state. Full record dumps are not included in
copied state by default.

External asset note references use stable tokens such as:

```txt
#external.kaykits.medieval_pack.building_bridge_a
#external.cubeling_pack.animals.elephant
```

State JSON and Copy AI Prompt expand those tokens with pack, folder, local file
path, format, tags, and explicit `placementEnabled: false` / reference-only
status.

## Future Placement Lane

Asset placement should wait until the editor can represent new instances with
stable ids, source refs, and export-only add-intent records. The browser editor
should still not write source files directly.

Future asset placement records should include:

- proposed stable object id
- asset key
- starting transform
- target level
- source ownership or manual-review flag
- add/replace intent notes
