# Handbook / Backlog Updates For This Slice

After implementing Red Button B + Elevator B, update docs/backlog so future devs do not reintroduce the old possession contradiction.

## Update: `docs/game-design-handbook/02_color_coded_buttons_and_mechanisms.md`

Replace or revise the red button behavior to match the new rule:

```md
### Red button — Heavy continuous-cycle activation

Status: `LOCKED / CURRENT DIRECTION`

Player model: `Red = Hold with weight.`

Behavior:
- Red buttons require heavy weight.
- Elephant is the first Cubeling that can activate red buttons.
- Human and Frog do not activate red buttons.
- While Elephant remains on a red button, the connected mechanism continuously operates.
- For elevators/platforms, this means the mechanism cycles between endpoints while held.
- When Elephant leaves the red button, the mechanism stops cycling or returns to its rest/default position.

Design examples:
- Elephant stands on Red Button B -> Elevator B cycles up and down.
- Player shifts back to human -> Elephant stays on button -> Elevator B continues cycling.
- Human boards Elevator B when it returns to ground and rides it upward.
```

## Add design note: Level Two possession constraint

Add this note to Level Two scope/phased docs:

```md
### Level Two red elevator possession constraint

The human can only possess a Cubeling when near it. Therefore, the human cannot board a distant elevator and then possess Elephant elsewhere.

Level Two solves this by making Red Button B continuously cycle Elevator B while Elephant holds the button. The player can safely shift back to human after Elephant is already standing on Red Button B. Human then boards Elevator B when it cycles down and rides upward.
```

## Update: `docs/game-design-handbook/07_level_two_phased_implementation_plan.md`

Add or replace the current Phase 6/8 wording with:

```md
### Phase 6b — Red Button B + Human Elevator B

Goal: Complete the Level Two route from Elephant unlock to Love Letter.

Scope:
- Place Red Button B opposite Platform/Elevator A on the same elevated tier as Elevator A's upper endpoint.
- Place Elevator B to the side of Red Button B.
- Red Button B requires Elephant.
- While Elephant holds Red Button B, Elevator B cycles ground <-> upper stop.
- Human boards Elevator B from ground level while Elephant remains on Red Button B.
- Human rides Elevator B to the Love Letter route.
- Human collects the Level Two Love Letter.
```

## Update: `docs/game-design-handbook/09_level_two_smoke_tests.md`

Add the smoke checks from `03_SMOKE_TEST_CHECKLIST.md`.

## Update: `backlog.md`

Add any deferred items discovered during implementation:

- Replace generated red button/platform placeholders with final red assets if placeholders were used.
- Tune Elevator B movement speed/dwell time after playtesting.
- Add clearer red mechanism affordance if the cause/effect is not readable.
- Add optional hint dialogue if player does not understand waiting for Elevator B to cycle down.
- Revisit Cubeling Recall after Level Two loop is complete.

## Update: `progress.md`

Add a short entry when implementation is complete:

```md
- DONE: Level Two Red Button B / Elevator B slice: Elephant reaches Red Button B on the opposite side of the central mountain, Red Button B continuously cycles Elevator B while held, human boards Elevator B from ground level, rides upward, reaches the Level Two Love Letter, and triggers the Level Two completion flow. Build and smoke tests pass.
```
