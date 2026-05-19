# Tooling Readiness Plan (Scripts-first + fixture policy)

## Immediate goals (implemented now)

1. `list-levels`  
2. `get-level-manifest <id>`  
3. `list-level-objects <id>`  
4. `run-scene-smoke [<id>]`  
5. `run-fixture <id> <fixture>`  
6. `validate-missing-colliders [<id>]`  
7. `validate-float-colliders [<id>]`

## Execution conventions

- Use direct scene jumps (`Digit1..Digit4`) by default.
- Keep `tutorial` and `full_flow` as full-sequence exceptions only.
- Use `--pretty` for reading; default output remains compact machine JSON.
- Unsupported fixtures are valid outputs with explicit `reason` + `migrationHint`.

## Fixture policy (this pass)

Add targeted fixtures only for:

- high-risk mechanics
- new Cubeling mechanics
- new button/platform systems
- recall/teleport/reposition systems
- Love Letter completion checks
- scene-start deterministic states

Do not add fixtures for routine static scenery edits.

## Level Two fixture contracts

### Implemented
- `level_two_start`
- `level_two_love_letter_ready`

### Planned (explicitly unsupported today)
- `level_two_elephant_unlock_test`  
  Purpose: start with Frog available and the Elephant Totem/Echo flow ready to test.  
  Checks: Elephant Totem exists, Elephant Echo exists, Frog collects the totem, Elephant appears/spawns after pickup.
- `level_two_red_button_test`  
  Purpose: start with Elephant unlocked near a red weight button.  
  Checks: Elephant can activate button, Frog cannot, Human cannot, linked platform/elevator responds.
- `level_two_recall_test`  
  Purpose: start with Frog and Elephant away from their echoes.  
  Checks: pressing C recalls both active Cubelings, Frog returns to Frog Echo, Elephant returns to Elephant Echo, recall does not reset the level or remove collected Cubeling totems.
- `level_two_elevator_test`  
  Purpose: start with platform/elevator mechanic ready to run.  
  Checks: platform moves to expected position, actor can stand/use it, alignment is correct, no obvious floating/clipping.

When unsupported, tests must return `status: "unsupported"` and a concrete migration hint; they must not be reported as passing.

## Targeted run strategy

- `run-scene-smoke`:
  - Use for quick scene presence checks and invariant checks.
  - Use for focused reruns after scene-level object/asset edits.

- `run-fixture`:
  - Use when a risky mechanic is being developed.
  - Use for one-step behavior checks before integrating with full flow.

- Validators:
  - Run `validate-missing-colliders` and `validate-float-colliders` after deterministic object additions, layout edits, or mechanic placement changes.

## Future level workflow

1. Create level design scope.
2. Update level manifest inputs.
3. Add direct scene smoke support.
4. Add only the fixtures needed for risky mechanics.
5. Build one mechanic slice.
6. Run targeted fixture + validators.
7. Run full-flow smoke only after integration pass.

## Targeted command sequence by work type

- Scene/layout tweaks:
  - `tools:list-level-objects -- <level_id> --pretty`
  - `tools:run-scene-smoke -- <level_id> --pretty`
  - `tools:validate-missing-colliders -- <level_id> --pretty`
  - `tools:validate-float-colliders -- <level_id> --pretty`
- Mechanic slice:
  - Add/enable the contract fixture for the change.
  - `tools:run-fixture -- <level_id> <fixture_id> --pretty`
  - same two validators
- End-to-end integration:
  - `tools:run-scene-smoke -- level_two --pretty`
  - then full tutorial flow only if cross-scene handoff changed.
