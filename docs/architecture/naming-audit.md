# Lumina3D Naming Audit

Last updated: 2026-05-20

## Purpose

This audit names the identity layers already present in Lumina3D so future AI
sessions do not confuse asset files, placed objects, editor IDs, collider labels,
and human display names.

This is documentation only. Do not rename existing IDs from this audit. Several
IDs are already used by runtime probes, CLI tools, smoke checks, editor
selection, collider validators, or prompt packets.

## Current Naming Layers

| Layer | Purpose | Current example | Notes |
|---|---|---|---|
| Asset registry key | Game-facing asset alias in `ASSETS` | `pathTile` | Stable loading key from `src/config/assets.js`. |
| Asset source stem | Raw OBJ/GLTF filename stem | `sand_A` | File identity, not gameplay identity. |
| Asset path | Resolved served asset path | `/assets/kaykit/blockbits/path/sand_A.obj` | Built from registry data by `resolveAssetPath()`. |
| Runtime semantic label | Scene-builder or `userData` role label | `red-elevator-a-top-connector` | Useful design meaning, not always a stable tooling ID. |
| Level catalog ID | CLI object identity | `level_two_red_elevator_a` | Used by `tools:list-level-objects` output. |
| Editor object ID | Separate editor selection identity | `level_two.red-elevator-a` | Mixed dot and hyphen convention today. |
| Dev registry fallback ID | Runtime generated selection identity | `level_two.ramp.1` | Generated when no `devEditorId` exists. |
| Display name | Human-readable label | `Red Elevator A` | Good for UI/debug text, weak as a stable ID. |
| Collider label | Collision/debug label | `level-two-red-elevator-a-top-connector-0` | Used to match gameplay collision/proxy expectations. |
| Runtime probe | Compact script/debug locator | `levelTwo.redPlatforms.red-elevator-a` | Useful for scripts and smoke reports. |

## Asset Key vs Source Stem

`src/config/assets.js` already separates the in-game asset key from the source
filename:

| Asset key | Source stem | Resolved path |
|---|---|---|
| `groundTile` | `sand_with_grass` | `/assets/kaykit/blockbits/ground/sand_with_grass.obj` |
| `pathTile` | `sand_A` | `/assets/kaykit/blockbits/path/sand_A.obj` |
| `homeBlue` | `building_home_A_blue` | `/assets/kaykit/medieval/home-blue/building_home_A_blue.obj` |
| `buttonBaseBlue` | `button_base_blue` | `/assets/kaykit/platformer/button-blue/button_base_blue.obj` |

This separation is good. A placed `pathTile` can be a generic path, an Elephant
route tile, a ramp approach, or decorative trail support. The asset key answers
"how the game loads it"; the placed object ID and role answer "why this instance
exists here."

## Runtime `userData` Examples

Level Two scene construction stores useful semantic hints in `userData`:

| Field | Example | Meaning |
|---|---|---|
| `levelTwoTile` | `12,14` | Grid tile coordinate marker. |
| `levelTwoAsset` | `blue-ramp` | Runtime semantic asset/role label. |
| `levelTwoTier` | `3` | Terrain/elevation tier. |
| `levelTwoZone` | `central_mountain_support` | Terrain zone or support region. |
| `redButtonId` | `red-button-a` | Mechanism source ID. |
| `redPlatformId` | `red-elevator-a` | Mechanism target ID. |
| `devEditorId` | `elephant_echo` | Curated dev selection ID before scene prefixing. |
| `devEditorAsset` | `elephant` | Asset hint for dev editor context. |

These fields are useful but do not yet form one shared identity packet. Some are
asset-like, some are role-like, and some are editor-only.

## Level Two ID Inconsistencies

Level Two has strong semantic concepts, but the same concepts appear with
different delimiter styles:

| Concept | Current forms |
|---|---|
| Red Elevator A | `red-elevator-a`, `level_two_red_elevator_a`, `level_two.red-elevator-a` |
| Red Elevator A top connector | `red-elevator-a-top-connector`, `level_two_red_elevator_a_top_connector`, `level-two-red-elevator-a-top-connector-0` |
| Blue ramp | `blue-ramp`, `level_two.blue_ramp`, `LEVEL_TWO_BLUE_RAMP` |
| Red buttons | `red-button-a`, `level_two_red_button_a`, `level_two.red-button-a` |
| Elephant route | `tier-3-elephant-route`, `level-two-tier-3-elephant-route-` |

The concepts are meaningful. The risk is that prompts and tools have to guess
which spelling is the "real" one.

## Dev Entity Registry Findings

`src/debug/devEntityRegistry.js` is already trying to produce usable runtime
identity:

- `makeStableId()` prefixes existing `devEditorId` values with the scene ID when
  needed.
- If no curated ID exists, it derives an ID from `sceneId`, category, and a
  counter.
- It has display-name maps for known categories and assets.
- It infers categories from asset-like words such as button, ramp, elevator,
  tree, rock, bush, and grass.

This is useful fallback behavior. It should not become the only source of
important object identity because generated counter IDs can shift when scene
contents change.

## Tooling Object Output

`scripts/lib/levelCatalog.js` and `scripts/list-level-objects.js` currently
produce compact object records with fields such as:

```json
{
  "id": "level_two_red_elevator_a",
  "name": "Red Elevator A",
  "type": "moving-platform",
  "category": "mechanism",
  "asset": {
    "key": "redPlatform4x4",
    "path": "/assets/kaykit/platformer/platform-red/platform_4x4x1_red.obj",
    "scale": 1
  },
  "colliderLabel": null,
  "mechanismLink": "red-button-a -> red-elevator-a"
}
```

This is already close to what prompt packets need. The main missing layer is a
canonical ID plus explicit asset stem when the prompt needs to distinguish source
file identity from placed object identity.

## Collider Label Findings

Collider labels use their own collision/debug naming style:

| Area | Current collider label example | Notes |
|---|---|---|
| Home house | `home-house-front-threshold` | Tied to Home doorway collision reports. |
| Home house body | `home-house-main-body` | Exact label in level catalog expectations. |
| Level Two terrain | `level-two-tier-3-elephant-route-` | Prefix-matched collider band. |
| Level Two connector | `level-two-red-elevator-a-top-connector-` | Prefix-matched raised route tiles. |
| Level props | `level-two-forestTreeA` | Prefix label from prop asset key. |

Collider labels are not the same thing as display names or asset keys. Future
metadata should link collider labels to entity IDs instead of forcing every
collider label to become a canonical object name.

## Names That Should Not Be Renamed Directly

Treat these as compatibility-sensitive until an alias migration exists:

- `ASSETS` keys in `src/config/assets.js`.
- Level IDs used by tooling: `tutorial`, `home_intro`, `level_one`, `level_two`.
- Level object IDs emitted by `scripts/lib/levelCatalog.js`.
- `devEditorId`, `editorId`, and object IDs used by F2 Dev Editor or `/editor/`.
- Collider labels used by missing/float collider validators.
- `runtimeProbe` strings used in smoke/tool output.
- Constants and source refs used by Level Two layout/editor adapters.

Renaming any of these without aliases can break prompt packets, editor selection,
smoke reports, and validators even if gameplay still appears to run.

## Practical Conclusions

- The project does not need a broad rename sweep.
- Asset filenames should not become runtime object names by default.
- Prompt/debug output should expose both placed-object identity and asset
  identity.
- Important entities should eventually have curated canonical IDs and legacy ID
  aliases.
- Generated IDs are acceptable fallbacks for non-critical objects, not the best
  identity for major mechanisms, actors, triggers, routes, or colliders.
