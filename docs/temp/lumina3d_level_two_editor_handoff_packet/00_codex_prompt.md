# Codex Prompt — Lumina3D Level Two Editor Handoff

You are working in my local Lumina3D project files.

Implement the requested `level_two` edits from the level editor handoff. Work from local files, inspect the current source before applying changes, preserve playable game behavior at `/`, and keep `/editor/` separate from gameplay.

Do **not** commit, push, pull, merge, rebase, reset, or switch branches unless I explicitly ask.

## Context files to read first

Use these attached Markdown files as implementation context:

1. `01_level_two_editor_deltas.md` — exact object deltas and notes from the level editor.
2. `02_blue_ramp_ground_indicator_design_brief.md` — the note-only Blue Ramp visual/mechanism request.
3. `03_validation_and_qa_checklist.md` — verification commands and manual checks.
4. `04_implementation_guardrails.md` — scope boundaries and source/collider cautions.

## Primary source targets

Start by inspecting:

- `src/levels/levelTwo.js`
- Every usage of `LEVEL_TWO_POINTS`, `LEVEL_TWO_BLUE_RAMP`, `LEVEL_TWO_RED_BUTTONS`, `LEVEL_TWO_RED_PLATFORMS`, and `LEVEL_TWO_PROPS`
- Every usage of `blueRamp`, `blueRampActive`, `blue button`, `red-elevator-a`, `red-elevator-b`, and `buildColliderDebugEntries`

Use `rg` to locate the runtime visual, trigger, collider, and smoke-test paths before editing.

## Scope

### 1. Apply source-backed transform edits

Apply the following source-backed transform changes where the source mapping is clear, preserving untouched rotation/scale fields:

| Object | Source ref | Final transform values to apply |
|---|---|---|
| `level_two.blue_button` | `src/levels/levelTwo.js` → `LEVEL_TWO_POINTS.blueButton` | position `x: 15.25`, `y: 2.8`, `z: 13.25` |
| `level_two.elephant_echo` | `src/levels/levelTwo.js` → `LEVEL_TWO_POINTS.elephantEcho` | position `x: 13.75`, `y: 9.5`, `z: -1.5` |
| `level_two.red-button-a` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_BUTTONS['red-button-a']` | position `x: 13.75`, `y: 9.34`, `z: -1.5` |
| `level_two.red-elevator-a` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_PLATFORMS['red-elevator-a']` | position `x: 12.25`, `y: 8.24`, `z: 0` |
| `level_two.red-elevator-b` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_PLATFORMS['red-elevator-b']` | position `x: -0.75`, `y: 1`, `z: 12.25` |
| `level_two.prop.forestTreeB.2` | `src/levels/levelTwo.js` → `LEVEL_TWO_PROPS[1]` | position `x: 18.2`, `y: 2.08`, `z: -18.75` |
| `level_two.prop.forestRock.9` | `src/levels/levelTwo.js` → `LEVEL_TWO_PROPS[8]` | position `x: 12.75`, `y: 2.08`, `z: 11` |

Keep the Elephant Echo and Red Button A aligned on the same X/Z (`13.75`, `-1.5`) so the elephant/spawn point reads as being on top of the button.

### 2. Implement the Blue Ramp ground indicator / activation visual

The Blue Ramp itself has no transform delta, but it has a design note that must be implemented or carefully scoped if the current runtime structure makes it risky.

Desired behavior:

- Before `level_two.blue_ramp` appears/activates, show a flat blue platform or panel on the ground at the ramp’s dormant origin area.
- The flat blue platform should visually communicate that the Blue Button triggers a mechanism here.
- When the Blue Button activates the Blue Ramp, the ramp should appear to move/rise from that flat blue platform into its current active ramp position.
- Preserve the existing Blue Button → Blue Ramp gameplay behavior and route readability.

Implementation guidance:

- Prefer a small, explicit source-backed config addition near `LEVEL_TWO_BLUE_RAMP` if the code already has ramp data objects.
- Prefer reusing existing blue platform/ramp materials or mesh helpers instead of adding unrelated assets.
- Keep the visual indicator readable but non-noisy. This should feel like a cozy “the platform wakes up” moment, not a new puzzle system.
- Do not create a new broad animation system. Use the smallest existing update/render path that can support a simple dormant-to-active visual transition.
- Do not make the flat dormant panel a misleading walkable shortcut unless the current design already allows it. If it is walkable, ensure colliders and route logic intentionally support that.
- If collider behavior changes, update the relevant source-backed collider/debug entries and validators. Otherwise leave unrelated collider source alone.

### 3. Inspect dependent colliders and triggers

The editor provided collider/proxy hints as handoff context, not automatic source-write instructions. Use them to inspect whether source-backed collider data or computed collider outputs need adjustment after the transform edits.

Pay special attention to:

- Blue Button trigger/press area after moving to `(15.25, 2.8, 13.25)`.
- Red Button A held-weight trigger after moving to `(13.75, 9.34, -1.5)`.
- Red Elevator A walkable surface and visual footprint after moving to `(12.25, 8.24, 0)`.
- Red Elevator A side approach / top exit transition zones. Inspect whether they are computed from platform data or need manual adjustment. Do not move them blindly.
- Red Elevator B walkable surface and visual footprint after moving to `(-0.75, 1, 12.25)`.
- Physical prop collision/visual overlap for `forestTreeB.2` and `forestRock.9`.

### 4. Keep out of scope

- No deletion or replacement work; the editor export had `deleteCount: 0` and `replaceCount: 0`.
- Do not spawn the selected read-only `player` asset. The selected asset was only catalog context.
- Do not migrate architecture, rewrite unrelated systems, or let `/editor/` directly write source files.
- Do not invent new gameplay behavior beyond the Blue Ramp visual/mechanism note.

## Verification

After edits, run:

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

Also do a focused manual/editor QA pass if possible:

- Confirm the Blue Button is reachable and visually clear at the new location.
- Confirm the Blue Ramp dormant blue platform is visible before activation.
- Confirm the Blue Ramp activation reads as the dormant platform rising/transforming into the ramp.
- Confirm Elephant Echo and Red Button A are aligned so the elephant/spawn point is on top of the button.
- Confirm Red Elevator A aligns with `level_two.terrain.red-elevator-a-top-connector.3` and remains close enough to the terrain.
- Confirm Red Elevator B no longer overlaps `level_two.terrain.human-love-letter-route.4` when rising and is centered with that tile.
- Confirm `forestTreeB.2` no longer collides with `level_two.terrain.elephant-totem-hill.3`.
- Confirm `forestRock.9` is farther from the Blue Button and does not block button readability.

## Final response requested from Codex

Report:

1. Files changed.
2. Exact transform changes applied.
3. How the Blue Ramp dormant platform/rising visual was implemented.
4. Any collider/trigger updates made or intentionally not made.
5. Verification commands run and their results.
6. Any remaining risks or follow-up recommendations.
