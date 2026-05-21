# Lumina3D Naming Conventions

Last updated: 2026-05-20

## Purpose

Use this convention when describing, debugging, or eventually migrating Lumina3D
entities. It is a proposal for stable AI/tooling identity, not a runtime API
change.

Do not rename existing IDs in the first pass. Add documentation first, then add
metadata and aliases in later slices.

## Core Rule

`assetKey != assetStem != canonicalId != displayName != role != colliderLabel`

Each field answers a different question:

| Field | Answers | Example |
|---|---|---|
| `assetKey` | How does the game load this asset? | `pathTile` |
| `assetStem` | What source model file is this? | `sand_A` |
| `canonicalId` | Which placed gameplay/tooling entity is this? | `level_two.terrain.base.path.r12_c14` |
| `displayName` | What should a human call it? | `Path Tile` |
| `role` | Why does it exist here? | `elephant_terrace_trail` |
| `colliderLabel` | Which collision/debug proxy is related? | `level-two-red-elevator-a-top-connector-0` |

## Identity Shape

Use this shape as documentation for future metadata and prompt packets. Do not
treat it as an implemented TypeScript type yet.

```ts
type LuminaEntityIdentity = {
  canonicalId: string;
  legacyIds?: string[];
  displayName: string;
  assetKey?: string;
  assetStem?: string;
  assetPath?: string;
  domain: "terrain" | "prop" | "mechanism" | "actor" | "collectible" | "trigger" | "collider" | "debug";
  role?: string;
  tags?: string[];
};
```

## Canonical ID Format

Use dot-delimited hierarchy with snake_case tokens inside each segment:

```txt
<scene>.<domain>.<kind>.<qualifier>
```

Good examples:

```txt
level_two.actor.human
level_two.actor.frog
level_two.actor.elephant

level_two.terrain.base.ground.r00_c00
level_two.terrain.base.path.r12_c14
level_two.terrain.ledge.blue_button.r15_c17
level_two.terrain.route.elephant.r10_c09

level_two.mechanism.blue_button.main
level_two.mechanism.red_button.a
level_two.mechanism.red_button.b
level_two.mechanism.red_elevator.a
level_two.mechanism.red_elevator.b

level_two.collectible.love_letter
level_two.collectible.elephant_totem
level_two.marker.elephant_echo

home_intro.structure.house.main
home_intro.collider.house.front_threshold
```

Avoid using these as new canonical IDs:

```txt
level-two-red-elevator-a
level_two_red_elevator_a
levelTwoRedElevatorA
level_two.red-elevator-a
```

Legacy forms can remain in `legacyIds` while tools and prompts learn the
canonical form.

## Examples

### Level Two path tile

```json
{
  "canonicalId": "level_two.terrain.base.path.r14_c10",
  "legacyIds": [
    "level_two_pathTile_23",
    "level-two-path-tile-23"
  ],
  "displayName": "Path Tile",
  "assetKey": "pathTile",
  "assetStem": "sand_A",
  "assetPath": "/assets/kaykit/blockbits/path/sand_A.obj",
  "domain": "terrain",
  "role": "elephant_terrace_trail",
  "tags": ["walkable", "path", "level_two"]
}
```

### Red Elevator A

```json
{
  "canonicalId": "level_two.mechanism.red_elevator.a",
  "legacyIds": [
    "red-elevator-a",
    "level_two.red-elevator-a",
    "level_two_red_elevator_a"
  ],
  "displayName": "Red Elevator A",
  "assetKey": "redPlatform4x4",
  "assetStem": "platform_4x4x1_red",
  "assetPath": "/assets/kaykit/platformer/platform-red/platform_4x4x1_red.obj",
  "domain": "mechanism",
  "role": "held_weight_elevator",
  "tags": ["moving_platform", "elephant_route"]
}
```

### Home house doorway threshold collider

```json
{
  "canonicalId": "home_intro.collider.house.front_threshold",
  "legacyIds": [
    "home_house_front_threshold",
    "home-house-front-threshold"
  ],
  "displayName": "Home House Front Threshold",
  "assetKey": "homeBlue",
  "assetStem": "building_home_A_blue",
  "assetPath": "/assets/kaykit/medieval/home-blue/building_home_A_blue.obj",
  "domain": "collider",
  "role": "doorway_collision_threshold",
  "tags": ["home_intro", "house", "collision"]
}
```

## Three.js And glTF Notes

Three.js `Object3D` provides useful runtime fields such as `name`, `uuid`, and
`userData`; `userData` is the right place for custom debug metadata. Treat
`name` as display/debug text, not the only stable game ID. See the
[Three.js Object3D docs](https://threejs.org/docs/pages/Object3D.html).

glTF asset names are optional, intended for application/display use, and not
guaranteed unique. The glTF coordinate system also uses +Y up, +Z forward, meters,
and radians. Treat imported names and transforms as asset metadata that may need
adaptation to Lumina3D gameplay identity. See the
[glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

## Prompt Packet Guidance

When a prompt mentions a spatial bug, include both object identity and asset
identity when known:

```json
{
  "selectedObject": {
    "canonicalId": "level_two.mechanism.red_elevator.a",
    "legacyIds": ["level_two.red-elevator-a", "level_two_red_elevator_a"],
    "displayName": "Red Elevator A",
    "assetKey": "redPlatform4x4",
    "assetStem": "platform_4x4x1_red",
    "role": "held_weight_elevator"
  }
}
```

If `canonicalId` does not exist yet, use the current tooling ID and clearly mark
the canonical ID as proposed.

## Phased Migration Plan

### Phase 1: Docs only

- Keep this convention and `naming-audit.md` current.
- Do not rename source IDs.
- Do not change CLI output.
- Use the convention in prompts, bug packets, and implementation notes.

### Phase 2: Add metadata and aliases

- Add `canonicalId` and `legacyIds` to important catalog/dev editor records.
- Preserve existing IDs as aliases.
- Expose `assetKey`, `assetStem`, and `assetPath` together in prompt/debug
  packets where practical.
- Keep generated fallback IDs for minor objects only.

### Phase 3: Add a naming validator

Future script plan only:

```bash
npm run tools:validate-naming
```

Possible implementation target:

```txt
scripts/validate-naming.js
```

Checks to include:

- Duplicate `canonicalId` values.
- Missing `displayName` on important entities.
- Invalid canonical ID delimiters or non-snake_case tokens.
- Missing or unresolved `assetKey`.
- Missing `assetStem` or `assetPath` where an object uses an asset.
- Important objects relying only on generated counter IDs.
- Collider labels that do not declare a linked entity ID or legacy relationship.

### Phase 4: Pilot Level Two

- Start with major Level Two actors, ramp, red buttons, red elevators, Elephant
  Totem, Elephant Echo, Love Letter, important routes, raised ledges, and
  important colliders.
- Do not migrate every base tile unless the editor or prompt workflow needs it.
- For repeated tiles, use procedural canonical IDs such as
  `level_two.terrain.base.path.r12_c14`.

### Phase 5: Gradual migration

- Apply the same pattern to `home_intro`, `level_one`, and `tutorial`.
- Migrate docs, prompt examples, validators, and smoke expectations only after
  aliases exist.
- Retire legacy IDs only when tests, tools, and prompt packets no longer depend
  on them.

## Anti-Patterns

- Do not use raw asset filenames as placed object IDs by default.
- Do not use display names as stable IDs.
- Do not rely on generated dev registry counters for important objects.
- Do not rename collider labels without a compatibility plan.
- Do not make a whole-project rename sweep before adding aliases and validators.
- Do not make naming cleanup a reason to refactor gameplay, scene flow, editor
  behavior, or asset loading.
