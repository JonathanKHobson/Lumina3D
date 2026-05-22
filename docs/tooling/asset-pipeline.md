# Asset Pipeline

Purpose: keep Lumina3D fast, legally clean, and visually coherent as the asset library grows.

This document is a contract for future asset work. It does not require immediate conversion of existing OBJ/MTL assets.

## Current Rule

Runtime assets enter through `src/config/assets.js` and live under `public/assets/`. The separate editor may reference external assets as read-only draft candidates, but browser tools must not import, place, or write source-backed assets directly.

## Format Guidance

| Format | Use now | Notes |
|---|---|---|
| OBJ/MTL | Allowed for existing project assets | Workable, but can be heavier and less structured for long-term delivery. |
| GLTF/GLB | Preferred for future optimized runtime assets | Better long-term path for transmission, animation, and packaged scenes. |
| FBX/VOX | Reference/import source only | Convert or wrap deliberately before runtime use. |
| Generated/procedural | Editor planning or lightweight runtime visuals | Must have stable ids if used in handoff. |

Do not convert the whole library at once. Use one non-critical asset group, then verify screenshots and route probes before accepting the pipeline change.

## Asset Intake Checklist

Before adding a new runtime asset:

- source URL or local source path is recorded
- author/provider is recorded
- license is recorded
- attribution requirement is recorded
- file size and format are known
- target footprint or target height is defined
- collision expectation is named
- screenshot/probe requirement is named if gameplay-facing
- asset is registered in `src/config/assets.js`
- asset has a ledger row in `docs/assets/asset-ledger.md`

## Audit Script Target

Future command:

```bash
npm run tools:asset-audit -- --pretty
```

Minimum output:

```json
{
  "assetCount": 84,
  "missingRegistryFiles": [],
  "appleDoubleFiles": [],
  "missingLedgerEntries": [],
  "largeAssets": [],
  "objMtlPairs": 0,
  "gltfOrGlb": 0,
  "licenseUnknown": 0,
  "recommendations": []
}
```

Start with warnings. Only fail hard for broken registry references or source files that cannot load.

## Offline Optimization Tools

Use offline tools for inspection before conversion:

```bash
gltf-transform inspect input.glb
gltf-transform validate input.glb
gltf-transform optimize input.glb output.glb
gltfpack -i input.obj -o output.glb
```

Conversion acceptance:

- original source remains available
- names/origins needed by editor/runtime are preserved or mapped
- object scale matches previous placement
- screenshots compare cleanly
- relevant collider/probe checks pass
- asset ledger updates `Current format` and `Optimization status`

## Optimization Order

1. Inventory and ledger.
2. Broken-reference and sidecar cleanup.
3. Texture dimension and duplicate texture audit.
4. One safe GLB conversion spike.
5. Screenshot/probe comparison.
6. Only then consider wider conversion.

## Do Not Do Yet

- No wholesale OBJ to GLB migration.
- No runtime loader rewrite just to satisfy an audit.
- No new external asset pack browsing unless it displaces a named placeholder.
- No browser source writes from the editor.

