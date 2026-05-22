# Ground / Elevated Tile Editability Spec

## Problem

Ground/tile/cube objects can now be selected, but some cannot be moved with the same transform controls as other objects.

This likely means one or more of these are true:

1. The selected mesh is not the correct transform root.
2. The tile is marked locked/non-movable in editor state.
3. The tile has no stable editor record/sourceRef.
4. The tile is part of generated terrain data that is not source-backed.
5. The tile is an instance inside `InstancedMesh`, so a single instance is not a normal movable `Object3D`.
6. The transform controls are attached to the wrong object or disabled for tile categories.
7. Selection works by raycast, but the editor registry cannot map the hit result back to an editable record.

## Required distinction

Not all tiles are equal.

| Tile type | Recommended default |
|---|---|
| Base infinite/primary floor | Locked/selectable/inspectable |
| Terrain foundation grid | Usually locked |
| Elevated platform/mountain tile | Movable if source-backed |
| Decorative tile cube | Movable if source-backed |
| Generated tile without sourceRef | Selectable but locked with reason |
| Instanced tile | Movable only through proxy/instance matrix support |

## Editor object record requirement

Each selectable tile should have an editor record:

```js
{
  id: "level_two.tile.mountain_034",
  label: "Mountain Tile 034",
  type: "tile",
  category: "terrain",
  tags: ["tile", "elevated", "mountain"],
  assetKey: "grassTile",
  movable: true,
  locked: false,
  lockReason: null,
  sourceRef: {
    file: "src/levels/levelTwo.js",
    exportName: "LEVEL_TWO_MOUNTAIN_TILES",
    path: "[34]"
  },
  object3D: tileRoot
}
```

Locked example:

```js
{
  id: "level_two.tile.base_ground_000",
  tags: ["tile", "ground", "base"],
  movable: false,
  locked: true,
  lockReason: "Base ground is generated structural terrain and is not source-backed for editor movement yet."
}
```

## Transform target rule

Do not attach `TransformControls` to whatever mesh the raycaster hit by accident.

Use:

```txt
raycast hit mesh → climb parent chain → find object/userData.editorId → resolve editor record → attach controls to record.transformTarget
```

The `transformTarget` should be the object whose transform can be safely persisted.

## If tiles are child meshes

If a tile’s visible mesh is a child of a parent group, use the parent group or an explicit wrapper as `transformTarget`.

Do not persist child-local offsets unless the source model actually expects that.

## If tiles are InstancedMesh instances

If tiles are instanced, `Raycaster` may return `instanceId`, but `TransformControls` cannot directly attach to one instance as a normal object.

Recommended MVP options:

### Option A — Lock instanced tiles

Selectable but locked:

```txt
This tile is an instanced tile. Individual instance movement requires proxy editing support.
```

### Option B — Proxy object editing

Create an invisible or visible editor proxy object for the selected instance:

1. Read instance matrix with `getMatrixAt(instanceId, matrix)`.
2. Decompose to position/quaternion/scale.
3. Attach TransformControls to a proxy Object3D.
4. On change, compose matrix and write back with `setMatrixAt(instanceId, proxy.matrix)`.
5. Set `instanceMatrix.needsUpdate = true`.
6. Export patch against the source tile record, not the transient proxy.

Use Option B only if the source data can be updated safely.

## Export metadata

When exporting state/AI prompt, include:

```json
{
  "id": "level_two.tile.mountain_034",
  "type": "tile",
  "movable": true,
  "locked": false,
  "lockReason": null,
  "tileKind": "elevated",
  "sourceBacked": true,
  "transformChanged": true
}
```

For locked tiles:

```json
{
  "id": "level_two.tile.base_ground_000",
  "type": "tile",
  "movable": false,
  "locked": true,
  "lockReason": "Base ground is generated structural terrain."
}
```

## Acceptance criteria

- Selecting ground/tile objects still works.
- Movable elevated tiles show transform controls.
- Locked base tiles clearly explain why they cannot move.
- Object list can filter tiles separately from props/buttons/platforms.
- Exported state includes tile editability/lock metadata.
- Existing non-tile object editing still works.
