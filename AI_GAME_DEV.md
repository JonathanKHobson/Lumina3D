# AI Game Dev Instructions for Lumina3D

Use this file as the first context block for AI assistants working on Lumina3D.

## Project Identity

Lumina3D is a Vite + Three.js cozy 3D puzzle-adventure prototype. It uses imported KayKit, voxel, OBJ/MTL, and GLTF assets, custom scene construction, level data, custom collision proxies, DOM overlays, and deterministic debug/test tooling.

## Coordinate Conventions

- X/Z are the ground-plane axes.
- Y is vertical/elevation.
- Default grid tile size is `2.0` unless a level says otherwise.
- Rotations in source code are radians unless UI/docs explicitly say degrees.
- Actor movement and collision often use 2D X/Z checks plus actor radius/padding.

## Spatial Bug Rule

Do not guess transforms, object IDs, collider labels, trigger names, surface IDs, or asset orientation from prose. For collision, orientation, positioning, trigger, walkable-surface, or scene-flow tasks, request or gather a structured context packet before changing code.

When object identity is ambiguous, use `docs/architecture/naming-conventions.md`: keep asset keys, source stems, canonical IDs, display names, roles, and collider labels separate.

Start with:

- `window.render_game_to_text()` output from the running game when available.
- `npm run tools:get-level-manifest -- <level_id> --pretty`
- `npm run tools:list-level-objects -- <level_id> --pretty`
- Relevant notes from `bug_report.md`, `backlog.md`, or `progress.md`.

## Collision And Surface Rule

Visual meshes are not enough. Gameplay blocking, walkable behavior, ramps, platforms, and triggers need explicit proxies, invariants, or state rules. Before editing, classify the problem as one or more of:

- visual mesh
- gameplay collider
- walkable proxy/surface
- trigger/proximity zone
- actor radius/padding
- scene-flow/state gate

Lumina3D uses custom collision helpers/proxies, not a physics-engine workflow. Do not assume Rapier, Cannon, Ammo, or engine-native physics behavior.

## Prompt Workflow Rule

For spatial bugs, use `docs/ai-prompt-workflow/spatial-bug-context-template.md` or `docs/ai-prompt-workflow/context-packet-schema.md` before coding. Then diagnose with `docs/ai-prompt-workflow/lumina3d-spatial-debug-skill.md`.

The workflow is prompt/context first, not editor first. Do not require MCP, a new editor, or a runtime wrapper.

## Repo Tooling Rule

Prefer existing deterministic tooling and concise JSON outputs:

```bash
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:list-level-objects -- <level_id> --pretty
npm run tools:run-scene-smoke -- <level_id> --pretty
npm run tools:run-fixture -- <level_id> <fixture_id> --pretty
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

If a fixture returns `status: "unsupported"`, report the unsupported result and migration hint. Do not count it as pass or fail.

## Scope Rule

Keep fixes narrow. Do not change unrelated scenes, mechanics, assets, CLI scripts, or runtime systems. Do not use a spatial bug as permission to refactor `src/main.js`, rebuild the level editor, or start a new tooling architecture.

## Output Rule

When responding to a Lumina3D spatial bug, use:

```md
## Diagnosis
## Evidence Used
## Minimal Fix Plan
## Files To Inspect/Edit
## Proposed Patch Strategy
## Verification Commands
## Risks / Assumptions
```

Always list proposed files, validation commands, and unverified assumptions.

## Current Known Spatial Patterns

Check `bug_report.md` before proposing a patch. Recurring patterns include:

- Home doorway collision: level id `home_intro`; the player can partially enter the house doorway before a deeper blocker catches movement.
- Level Two ramp/walkable-surface issues: level id `level_two`; ramp visuals, actor Y/lift, surface state, and unsupported edge exits need separate evidence.
- Asset orientation/alignment drift: imported asset forward/origin may not match gameplay intent.
- Missing collision proxies: large solid visuals and walkable platforms need explicit collider/proxy data.
- Trigger loops: proximity/dialogue should usually fire on enter-zone or with cooldown, not every update tick.
