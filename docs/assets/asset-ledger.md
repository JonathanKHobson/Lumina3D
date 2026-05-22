# Lumina3D Asset Ledger

Purpose: track third-party and generated assets before public release, portfolio publication, or wider asset-library growth.

Status: starter ledger. Existing project assets still need a full source/license pass.

## Rules

- Add a ledger row before adding a new runtime asset to `public/assets/`.
- Keep source and license facts specific to the asset or pack, not guessed from memory.
- If license is unknown, mark `Unknown` and keep the asset out of public-release claims.
- Keep attribution requirements even when attribution is not required.
- Record collision expectations for gameplay-facing assets.

## Ledger

| Asset | Source | Author | License | Attribution required? | Original format | Current format | Size | Used in | Collision expectation | Optimization status |
|---|---|---|---|---|---|---|---:|---|---|---|
| KayKit platformer character | `public/assets/kaykit/platformer/character/Character.gltf` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | GLTF | GLTF | TBD | Human actor | Actor collider handled by runtime actor radius | Baseline existing asset |
| KayKit Block Bits tiles | `public/assets/kaykit/blockbits/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Ground/path/water tiles | Terrain/water contract varies by level | Baseline existing asset |
| KayKit platformer buttons | `public/assets/kaykit/platformer/button-blue/`, `button-red/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Button mechanics | Trigger/proximity contract, not solid blocker by default | Baseline existing asset |
| KayKit bridge pieces | `public/assets/kaykit/platformer/bridge/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Tutorial/Level One bridge visuals | Walkable proxy required when used as route | Baseline existing asset |
| KayKit blue ramp | `public/assets/kaykit/platformer/blue-ramp/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Level Two ramp | Walkable proxy and entry/exit probes required | Baseline existing asset |
| KayKit forest props | `public/assets/kaykit/forest/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Home/Level Three props | Trees/bushes/rocks often solid; grass decorative | Baseline existing asset |
| KayKit home-blue building | `public/assets/kaykit/medieval/home-blue/` | Kay Lousberg / KayKit | Needs verification against source pack | Needs verification | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Home Intro house | Doorway/body collider contract required | Baseline existing asset |
| Frog voxel model | `public/assets/voxel/frog/` | Local/pack source TBD | Unknown | Unknown | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Frog Cubeling | Actor collider handled by runtime actor radius | Needs source verification |
| Elephant voxel model | `public/assets/voxel/elephant/` | Local/pack source TBD | Unknown | Unknown | OBJ/MTL/PNG | OBJ/MTL/PNG | TBD | Elephant Cubeling | Actor collider handled by runtime actor radius | Needs source verification |
| Animal farm background images | `public/assets/animals-farm/background/` | Source TBD | Unknown | Unknown | PNG | PNG | TBD | Background/cloud imagery | Visual only | Needs source verification |

## Future Audit Fields

An asset audit script should fill or check:

- file size
- texture dimensions
- duplicate texture hashes
- missing registry files
- AppleDouble sidecars
- missing ledger rows
- unknown licenses
- candidate GLB optimization groups

