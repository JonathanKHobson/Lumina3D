# Code Reference Map

Use this as a starting checklist. Inspect current local source because names may have changed.

## `src/levels/levelOne.js`

Likely contains:
- `LEVEL_ONE_WATER_COLUMNS`
- old bridge constants:
  - `LEVEL_ONE_PARTIAL_BRIDGE`
  - `LEVEL_ONE_COMPLETE_BRIDGE_A`
  - `LEVEL_ONE_COMPLETE_BRIDGE_B`
  - bridge deck min/max constants
  - `LEVEL_ONE_JUMP_ZONE`
  - `LEVEL_ONE_LANDING`
- `LEVEL_ONE_BUTTON`
- `LEVEL_ONE_PROPS`

Expected edits:
- widen water columns to include 5 and 8;
- add lily pad, bloom mat, bloom gate/latch, dock/final Love Letter positions;
- optionally keep old bridge constant names only if they are temporarily needed for minimal diff, but do not keep bridge visuals.

## `src/scenes/levelOneScene.js`

Likely builds:
- Level One ground tiles;
- water tiles/colliders;
- old bridge visuals;
- old bridge deck proxy geometry;
- props.

Expected edits:
- remove old wooden bridge placement;
- add runtime procedural lily pad group;
- add blue bloom gate/latch;
- add two blue bloom mat groups;
- add explicit walkable proxy/surface definitions for lily pad and final mats;
- keep flower visuals deterministic.

## `src/main.js`

Likely contains:
- `updateLevelOneInteractions()`
- `getLevelOneFrogJump()`
- `pressButton()`
- Level One water collision checks
- `levelOneBridgeWalkableAt()` / `isOnLevelOneBridgeSurface()`
- Love Letter visual/collection logic using `SPELLBOOK`
- `registerFrogWaterBlock()`
- `showFrogLoveLetterLesson()`

Expected edits:
- replace Level One bridge jump routing with lily pad routing;
- update Level One button press behavior/copy to blue blooms;
- animate/reveal blue bloom mats;
- enable final human-safe crossing only after mats dock;
- add Level One-specific Love Letter point hook without breaking Tutorial or Level Two;
- keep Frog water-block and Frog-cannot-collect-Love-Letter behavior.

## `src/state/gameState.js`

Likely contains `createLevelOneState()`.

Expected additions:
- `blueBloomReleased`
- `blueBloomRevealActive`
- `blueBloomRevealElapsed`
- `blueBloomDocked`
- one-shot dialogue flags as needed, for example `lilyPadPromptShown`.

Minimal diff option:
- Reuse `bridgeComplete` internally as “crossing complete” if needed, but prefer clear names if the diff remains safe.

## `src/scenes/levelOneFlow.js`

Likely handles Level One start/reset/arrival.

Expected edits:
- reset new blue bloom/lily state;
- keep start prompt simple.

## Debug/test visibility

If render hooks expose Level One state/assets, update names so smoke tests can see:
- lily pad present;
- blue bloom mats held/docked;
- old bridge absent;
- crossing complete/docked state;
- Level One-specific Love Letter position/reveal state.
