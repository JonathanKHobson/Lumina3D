# Lumina3D Editor Patch Workflow

The separate `/editor/` route is a visual placement tool for Level Two. It does
not boot the playable game entrypoint and it does not write source files from
the browser. Its job is to export small transform patches that a human or AI
assistant can review and apply to local level source data.

## Patch Shape

Current transform patches use:

```json
{
  "schema": "lumina3d.editor.transformPatch.v1",
  "patchType": "lumina3d.editor.transformPatch.v1",
  "legacyPatchType": "lumina3d.editor.transformPatch",
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
      "oldValue": 9.2,
      "newValue": 9.45
    }
  ],
  "objects": []
}
```

- `schema` / `patchType`: identifies the payload as a Lumina3D editor transform patch.
- `legacyPatchType`: compatibility label for older docs and tools.
- `levelId`: the level the editor was showing when the patch was exported.
- `objectId`: the selected or primary dirty object.
- `sourceRef.file`: local source file that owns the data.
- `sourceRef.exportName`: named export in that source file.
- `sourceRef.path`: path inside the export, array entry, or object ID.
- `changes`: primary object changes.
- `objects`: all dirty objects, each with its own `sourceRef` and `changes`.

## Editor State Export Shape

`Copy State` exports the broader handoff payload for planning source edits. It
still does not write files. The state export includes only affected objects:
objects that moved, rotated, scaled, received a note, or were marked for delete.

```json
{
  "schema": "lumina3d.editor.stateExport.v1",
  "exportType": "lumina3d.editor.stateExport.v1",
  "levelId": "level_two",
  "selectedId": "level_two.blue_ramp",
  "affectedObjectCount": 2,
  "objects": [
    {
      "objectId": "level_two.blue_ramp",
      "name": "Blue Ramp",
      "category": "ramp",
      "assetKey": "blueRamp",
      "sourceRef": {
        "file": "src/levels/levelTwo.js",
        "exportName": "LEVEL_TWO_BLUE_RAMP",
        "path": "position"
      },
      "originalTransform": {},
      "currentTransform": {},
      "changes": [],
      "note": "@move Raise this slightly after the button trigger.",
      "noteTags": ["@move"],
      "markedForDelete": false
    }
  ]
}
```

Object notes persist in browser `localStorage` under
`lumina3d.editor.objectMeta.v1:<levelId>`. Delete marks are export-only intent;
they do not remove or hide objects in the editor.

## Copy And Export

1. Run the editor locally:

```bash
npm run editor
```

2. Open `/editor/`.
3. Select an object from the object list or viewport.
4. Move or rotate it with the transform controls.
5. Add an object note or keyword chips when the change needs human/AI context.
6. Use `Mark Delete` when an object should be removed in a later reviewed edit.
7. Use `Copy Patch` for transform-only patch JSON.
8. Use `Copy State` for the full affected-object handoff JSON.
9. Save the payload somewhere temporary or hand it to Codex directly.

Editor exports are review artifacts. Applying them still happens through normal
local source edits.

## Source Reference Mapping

All first-pass Level Two editor source references currently point to:

```txt
src/levels/levelTwo.js
```

Use `sourceRef.exportName` and `sourceRef.path` to find the target data.

### LEVEL_TWO_POINTS

Objects such as the blue button, Elephant Echo, Elephant Totem, and placeholder
Love Letter map to `LEVEL_TWO_POINTS`.

Example:

```json
{
  "exportName": "LEVEL_TWO_POINTS",
  "path": "blueButton"
}
```

Apply position changes to `LEVEL_TWO_POINTS.blueButton`. Most entries are built
with `sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, gridX, gridY, TILE)`, so
the patch's world `x` and `z` values may need conversion back to grid arguments.
For Level Two:

```txt
gridX = worldX / TILE + (LEVEL_TWO_WIDTH - 1) / 2
gridY = worldZ / TILE + (LEVEL_TWO_HEIGHT - 1) / 2
```

Y values are usually derived from terrain height, `SURFACE_Y`, or scene logic.
Review Y changes manually before editing source.

### LEVEL_TWO_BLUE_RAMP

The blue ramp maps to `LEVEL_TWO_BLUE_RAMP`.

Example:

```json
{
  "exportName": "LEVEL_TWO_BLUE_RAMP",
  "path": "position"
}
```

Position changes apply to `LEVEL_TWO_BLUE_RAMP.position`, which currently aliases
`LEVEL_TWO_POINTS.blueRamp`. Rotation changes map cleanly to:

```js
LEVEL_TWO_BLUE_RAMP.rotationY
```

Scale changes map to:

```js
LEVEL_TWO_BLUE_RAMP.visualScale.x
LEVEL_TWO_BLUE_RAMP.visualScale.y
LEVEL_TWO_BLUE_RAMP.visualScale.z
```

### LEVEL_TWO_RED_BUTTONS

Red button objects map to array entries in `LEVEL_TWO_RED_BUTTONS`.

Example:

```json
{
  "exportName": "LEVEL_TWO_RED_BUTTONS",
  "path": "red-button-a"
}
```

Find the entry where `id === "red-button-a"`. Its `position` currently aliases
`LEVEL_TWO_POINTS.redButtonA`, so prefer moving the point when the intent is to
move the button in the level. Y is derived from platform surface height and
clearance.

### LEVEL_TWO_RED_PLATFORMS

Red platform objects map to array entries in `LEVEL_TWO_RED_PLATFORMS`.

Example:

```json
{
  "exportName": "LEVEL_TWO_RED_PLATFORMS",
  "path": "red-elevator-a"
}
```

Find the entry where `id === "red-elevator-a"`. Its `position` currently aliases
`LEVEL_TWO_POINTS.redElevatorA`. X and Z placement should usually move that
point. Y placement is derived from `baseY`, `initialProgress`, and `maxLift`, so
review Y changes manually.

### LEVEL_TWO_PROPS

Props map to tuple entries in `LEVEL_TWO_PROPS`.

Example:

```json
{
  "exportName": "LEVEL_TWO_PROPS",
  "path": "[0]"
}
```

The tuple shape is:

```js
["assetKey", gridX, gridY, scale]
```

Editor patches report world coordinates. Convert world `x` and `z` back to
`gridX` and `gridY` before editing the tuple. Prop scale is uniform in source,
so non-uniform scale edits should be treated as manual review unless the source
shape changes later.

## Dry-Run Explanation Script

Use the dry-run helper to translate a patch into suggested source edits without
modifying files:

```bash
npm run tools:explain-editor-patch -- docs/tooling/fixtures/editor-transform-patch-example.json
```

The script exits nonzero for malformed JSON, missing files, or unsupported patch
types. It accepts the canonical `lumina3d.editor.transformPatch.v1` schema and
the older `lumina3d.editor.transformPatch` compatibility label. It exits zero
for valid patches, including patches with no dirty objects.

## Validation After Applying A Patch

After manually applying any patch to source data, run:

```bash
npm run build
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

Then open `/editor/` and confirm the changed object appears where expected.

## Manual Editor QA

- `/` still opens the playable game.
- `/editor/` opens the separate Level Two editor.
- Object list selection works.
- Viewport click selection works.
- Move and rotate controls update the inspector.
- Camera pan, yaw, and zoom controls still work.
- Camera tilt buttons and `[` / `]` shortcuts change camera pitch.
- Snap toggle still changes transform behavior.
- Object notes, keyword chips, and delete marks update `Copy State`.
- `Reset Selected` restores the selected object to its load-time transform.
- `Play in game` opens source-backed playable Level Two with `?debugScene=level_two`.
- Copying the patch or state export produces valid JSON.
- Reloading the editor returns to source state.

## Current Non-Goals

- Collider editing.
- Object creation or deletion.
- Behavior editing.
- Platform animation editing.
- Browser-side source rewriting.
- Level architecture migration.
