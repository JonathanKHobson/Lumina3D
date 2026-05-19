# Recommended Code Structure For Level Two

## Current Structure

The project already has a lightweight modular split:

- `src/config/assets.js`: asset registry.
- `src/config/constants.js`: shared constants, tutorial copy, message data.
- `src/config/scenes.js`: scene IDs.
- `src/core/grid.js`: grid helpers.
- `src/levels/`: level layout data.
- `src/scenes/`: scene build functions.
- `src/debug/debugLevelSelect.js`: debug shortcuts.
- `src/main.js`: runtime orchestrator and gameplay systems.

This structure is good enough for the next Level Two slice. Do not do a full architecture rewrite before Phase 2.

## Add For Level Two

Recommended files:

- `src/levels/levelTwo.js`
- `src/scenes/levelTwoScene.js`

Recommended scene ID:

- `SCENES.LEVEL_TWO = "level_two"`

Recommended debug shortcut:

- `Digit4: SCENES.LEVEL_TWO`

## Level Two Data File

`src/levels/levelTwo.js` should own:

- width/height/bounds;
- start positions;
- Echo positions;
- Totem position;
- Love Letter position;
- ledge/jump zones;
- button positions;
- platform/elevator endpoints;
- prop placement arrays.

Keep layout data out of `main.js` where possible.

## Level Two Scene Builder

`src/scenes/levelTwoScene.js` should own:

- terrain mesh placement;
- decoration placement;
- static scene colliders;
- placeholder elevated blocks;
- Echo/Totem/Love Letter visual anchors where practical.

It should not own gameplay state transitions.

## Runtime Systems To Add Gradually

Do not extract everything at once. Add small helpers only when a new Level Two component needs them.

Likely near-term helpers:

- button helper that supports blue persistent and red held behavior;
- platform/elevator update helper;
- Cubeling Recall helper;
- Elephant behavior helper;
- multi-Cubeling transfer targeting helper.

## Suggested State Shape

```js
state.levelTwo = {
  phase: "inactive",
  titleElapsed: 0,
  blueButtonPressed: false,
  bluePlatformActive: false,
  elephantEchoVisible: false,
  elephantTotemCollected: false,
  elephantUnlocked: false,
  redButtonHeld: false,
  redPlatformProgress: 0,
  recallCount: 0
};
```

Future actor state:

```js
state.elephant = createActorState(LEVEL_TWO_POINTS.elephant, radius, speed);
state.cubelings.elephant = {
  unlocked: false,
  unlockedThisLevel: false,
  echo: LEVEL_TWO_POINTS.elephantEcho
};
```

## Render/Text Hooks

Add enough state for tests:

- `scene.id`;
- `scene.phase`;
- `levelTwo.titleCardVisible`;
- `levelTwo.elephantEcho.visible/solid`;
- `levelTwo.elephantTotem.visible/collected/collectibleBy`;
- `levelTwo.blueButtonPressed`;
- `levelTwo.bluePlatformActive`;
- `levelTwo.redButtonHeld`;
- `levelTwo.redPlatformProgress`;
- `levelTwo.recallCount`;
- `level.visibleAssets`.

## Immediate Engineering Rule

Phase 2 should add only scene shell plumbing and visibility. It should not add Elephant, red buttons, moving elevators, or recall until the shell is screenshot-verified.

