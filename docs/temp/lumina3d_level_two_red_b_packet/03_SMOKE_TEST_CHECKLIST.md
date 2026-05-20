# Smoke Test Checklist: Level Two Red Button B + Elevator B Slice

## Build / boot

- `npm run build` passes.
- `npm run dev:test` starts on `http://127.0.0.1:5178/`.
- Debug shortcut `4` loads Level Two.
- Browser console has no new import/runtime errors.

## Regression: existing Level Two critical path

- Human enters Level Two and gains control.
- Frog is available from start.
- Frog can still jump onto the intended low ledges.
- Frog can still press the blue button.
- Blue ramp still activates.
- Human can still reach Elephant Cubeling Totem.
- Human can still collect Elephant Cubeling Totem.
- Elephant still spawns/unlocks as previously implemented.
- Human can still possess Elephant when near it.

## Red Button B placement

- Red Button B is visible as part of the level layout.
- Red Button B is directly opposite Platform/Elevator A / Red Button A across the central mountain.
- Red Button B is on the same tier/level as Elevator A's upper endpoint.
- Red Button B is not on the Love Letter peak.
- Red Button B is not on the Elephant Totem hill.
- Elephant can walk from Elevator A's upper endpoint to Red Button B.

## Elevator B placement

- Elevator B is to the side of Red Button B.
- Elevator B has a reachable ground-level stop for the human.
- Elevator B has an upper stop aligned with the Love Letter route.
- Elevator B does not overlap or clip through the central mountain.
- Elevator B is visually tied to red mechanism language.

## Red activation rules

- Human cannot activate Red Button B.
- Frog cannot activate Red Button B.
- Elephant can activate Red Button B.
- Red Button B visibly depresses/activates when Elephant stands on it.
- Red Button B stays active while Elephant remains on it.
- Elephant remains stationary on Red Button B when unpossessed.

## Elevator B cycle

- Elevator B begins cycling when Elephant stands on Red Button B.
- Elevator B cycles ground -> upper -> ground while held.
- Elevator B movement is slow/readable.
- Elevator B does not require Elephant to step off the red button.
- Elevator B stops or returns safely when Elephant leaves Red Button B.

## Human riding Elevator B

- Player can Shift from Elephant back to human while Elephant remains on Red Button B.
- Human can walk to Elevator B's ground stop.
- Human can board Elevator B when it cycles down.
- Human rides upward with Elevator B.
- Human does not clip into Elevator B.
- Human does not fall through Elevator B.
- Human can exit Elevator B at the upper stop.

## Level Two completion

- Human can reach the Love Letter after exiting Elevator B.
- Frog cannot collect the Love Letter.
- Elephant cannot collect the Love Letter.
- Human can collect the Love Letter.
- Love Letter modal/message appears.
- Celebration/continue flow works.
- Level Two completion menu appears.
- Reset clears Level Two reward/celebration state.

## Render/test hooks

Update `render_game_to_text()` or equivalent smoke state so tests can inspect:

- `levelTwo.redButtonBPressed`
- `levelTwo.elevatorBActive`
- `levelTwo.elevatorBPosition` or equivalent
- `levelTwo.elevatorBHasHuman` or equivalent
- `levelTwo.loveLetterReachable` / `levelTwo.complete`

Exact names can differ, but state should be inspectable.
