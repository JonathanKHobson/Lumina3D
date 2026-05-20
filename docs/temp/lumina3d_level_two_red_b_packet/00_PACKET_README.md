# Lumina3D Level Two Slice Packet: Red Button B + Elevator B

## Purpose

This packet defines the next Level Two implementation slice: add the Red Button B / Elevator B sequence that completes the Level Two game loop.

The player-facing design goal is:

> Elephant rides Elevator A back up, crosses to Red Button B on the opposite side of the central mountain, holds Red Button B, and Elevator B cycles up/down so the human can board it and ride to the Love Letter route.

## Source assumptions

This packet was written after inspecting the public GitHub repo:

- `src/levels/levelTwo.js`
- `src/scenes/levelTwoScene.js`
- `src/scenes/levelTwoFlow.js`
- `src/systems/buttonSystem.js`
- `src/config/assets.js`
- `docs/game-design-handbook/02_color_coded_buttons_and_mechanisms.md`
- `docs/game-design-handbook/05_level_two_design_scope.md`
- `docs/game-design-handbook/07_level_two_phased_implementation_plan.md`
- `docs/game-design-handbook/09_level_two_smoke_tests.md`

The developer should inspect the latest local branch before implementing, because the local/dev branch may be ahead of GitHub `main`.

## Files in this packet

1. `01_IMPLEMENTATION_PROMPT.md` — the prompt to give the dev/AI.
2. `02_TECHNICAL_FILE_MAP.md` — repo-specific file and module guidance.
3. `03_SMOKE_TEST_CHECKLIST.md` — verification checklist for this slice.
4. `04_HANDBOOK_BACKLOG_UPDATES.md` — documentation/backlog updates to make after implementation.

## Critical design correction

Do not solve the possession constraint by putting Elevator A and Elevator B side-by-side.

Instead:

- Elephant stays on Red Button B.
- Red Button B continuously cycles Elevator B while held.
- The player shifts back to the human.
- Human waits for Elevator B to return to ground level, boards, rides upward, and exits toward the Love Letter.

This works because Cubeling -> human transfer is allowed, while human -> Cubeling remains proximity-gated.

## Implementation boundary

This slice should complete Level Two's full game loop, but it should not become a broad refactor.

Focus only on:

- Red Button B placement.
- Elevator B placement and movement.
- Red continuous-cycle behavior if not already implemented.
- Connecting Elevator B's upper stop to the Love Letter route.
- Level Two Love Letter collection/completion flow.
- Smoke tests and minimal handbook/backlog updates.
