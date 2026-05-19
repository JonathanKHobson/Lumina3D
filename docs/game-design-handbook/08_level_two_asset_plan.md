# Level Two Asset Plan

## Asset Selection Rule

Prefer assets that are:

- easy to orient;
- easy to align to grid/terrain;
- easy to collide with using simple AABBs/circles;
- readable from the current orthographic camera;
- visually distinct by role.

If an asset looks good but is hard to align or collide with, treat it as a risk until screenshot-tested.

## Known Current Assets

### Ground Tile

- Runtime key: `groundTile`
- Served path: `/assets/kaykit/blockbits/ground/sand_with_grass.obj`
- Purpose: standard grass/sand floor.
- Concern: keep footprint normalized to current tile grid.
- Status: current standard.

### Path Tile

- Runtime key: `pathTile`
- Served path: `/assets/kaykit/blockbits/path/sand_A.obj`
- Purpose: readable trail/path.
- Concern: path should not imply exit unless placed deliberately.
- Status: current standard.

### Water Tile

- Runtime key: `waterTile`
- Served path: `/assets/kaykit/blockbits/water/water.obj`
- Purpose: water/gap obstacle.
- Concern: collision must be narrowed or bridged deliberately.
- Status: used in Level One.

### Blue Button

- Runtime keys: `buttonBaseBlue`, `buttonTopBlue`
- Served path: `/assets/kaykit/platformer/button-blue/`
- Purpose: blue persistent activation.
- Concern: two-part visual needs top press animation.
- Status: current standard blue button.

### Love Letter Visual

- Runtime keys: `spellbookClosed`, `spellbookOpen`
- Served path: `/assets/kaykit/adventurers/spellbook/`
- Player-facing name: Love Letter.
- Purpose: level reward.
- Concern: do not use "spellbook" in player-facing UI.
- Status: current temporary visual.

### Hearts

- Runtime key: `heartRed`
- Served path: `/assets/kaykit/platformer/heart-red/heart_red.obj`
- Purpose: Love Letter celebration VFX.
- Concern: too many hearts can become visual noise.
- Status: current reward VFX.

### Forest Decoration

- Runtime keys: `forestTreeA`, `forestTreeB`, `forestBush`, `forestRock`, `forestGrass`
- Served path: `/assets/kaykit/forest/`
- Purpose: sparse environmental dressing.
- Concern: solid props must not block paths or camera.
- Status: current Home/Level One decoration.

## Needed Level Two Asset Categories

### Elephant Model

- Candidate path: not selected.
- Visual purpose: heavy Cubeling.
- Gameplay purpose: red button activation.
- Scale/orientation concerns: must read as heavier than Frog but not block the level.
- Review needed: human asset review required.
- Status: required before Phase 4.

### Elephant Echo

- Candidate: transparent clone of Elephant model.
- Visual purpose: inactive spawn/home anchor.
- Gameplay purpose: unlock destination and recall destination.
- Scale/orientation concerns: should be muted and non-solid; must not be mistaken for active Elephant.
- Review needed: yes after Elephant model chosen.
- Status: planned.

### Elephant Cubeling Totem

- Candidate: small floating Elephant charm/clone.
- Visual purpose: collectible unlock.
- Gameplay purpose: main-character-only unlock item.
- Scale/orientation concerns: smaller and more shiny than Echo; placed away from Echo enough to teach "find my Totem."
- Review needed: yes.
- Status: planned.

### Red Button

- Candidate path: likely KayKit Platformer Pack red button variant, not copied yet.
- Visual purpose: weight/held pressure button.
- Gameplay purpose: Elephant-only activation.
- Scale/orientation concerns: same footprint family as blue button; top should depress while held.
- Review needed: asset path selection.
- Status: required before Phase 5.

### Elevated Blocks / Cliff Blocks / Ledge Blocks

- Candidate path: not selected.
- Visual purpose: height and terrain readability.
- Gameplay purpose: raised paths, ledges, jump landings.
- Scale/orientation concerns: must align with current tile grid and collision proxies.
- Review needed: high.
- Status: required before Phase 2 or can be placeholder stacked ground tiles.

### Elevator / Platform Block

- Candidate path: not selected.
- Visual purpose: moving walkable surface.
- Gameplay purpose: carry main character/Elephant.
- Scale/orientation concerns: top surface must align with terrain endpoints and actor lift.
- Review needed: high.
- Status: required before Phase 3/6.

### Red Platform/Elevator Visual

- Candidate path: not selected.
- Visual purpose: show red button connection.
- Gameplay purpose: weight-driven platform/elevator.
- Scale/orientation concerns: red accent should not overpower scene.
- Review needed: medium.
- Status: planned.

### Optional Direction/Indicator Asset

- Candidate path: not selected.
- Visual purpose: show platform movement direction.
- Gameplay purpose: communicate elevator behavior.
- Scale/orientation concerns: should not look like collectible.
- Review needed: medium.
- Status: optional.

## Asset QA Checklist

For each new asset:

1. Copy only required `.obj/.mtl/texture` files into `public/assets/...`.
2. Add an `ASSETS` registry entry.
3. Normalize footprint/height.
4. Place in a debug scene or small slice.
5. Screenshot from default camera.
6. Verify orientation.
7. Verify ground contact.
8. Add collision proxy if solid.
9. Expose visible asset/state in `render_game_to_text()`.

