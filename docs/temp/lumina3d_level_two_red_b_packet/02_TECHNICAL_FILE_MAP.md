# Technical File Map: Level Two Red Button B + Elevator B Slice

## Repo structure notes

The README identifies the current project as Vite + Three.js and lists the relevant source structure:

- assets: `public/assets/`
- asset registry: `src/config/assets.js`
- level layout data: `src/levels/`
- scene construction: `src/scenes/`
- runtime orchestration/systems: `src/main.js`
- design handbook: `docs/game-design-handbook/`

Use that existing structure. Do not create a parallel architecture for this slice.

## Current files to inspect first

### `src/levels/levelTwo.js`

Use this for layout constants and static anchors.

Important existing Level Two concepts include:

- `LEVEL_TWO_POINTS`
- `LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS`
- `LEVEL_TWO_CENTRAL_MOUNTAIN_TILES`
- `LEVEL_TWO_RESERVED_TERRACE_GROUPS`
- `LEVEL_TWO_RESERVED_TERRACE_TILES`
- `LEVEL_TWO_BLUE_RAMP`
- `LEVEL_TWO_ELEPHANT_TOTEM_HILL`

The GitHub `main` version already includes reserved terrace groups such as:

- `lower-elephant-elevator-bay`
- `elephant-echo-start-terrace`
- `middle-elephant-platform-station`
- `upper-red-button-station`

For this slice, either reuse `upper-red-button-station` as Red Button B if it matches the intended position, or rename/add a clearer `red-button-b-terrace` anchor.

Recommended additions if not already present locally:

```js
export const LEVEL_TWO_RED_BUTTON_B = {
  id: "red-button-b",
  type: "red-continuous-cycle",
  requiredActor: "elephant",
  position: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, /* choose grid x */, /* choose grid y */, TILE),
  tierId: "red-button-b-terrace",
  controls: "elevator-b"
};

export const LEVEL_TWO_ELEVATOR_B = {
  id: "elevator-b-human-lift",
  role: "human-goal-elevator",
  asset: "redElevatorPlatform", // or generated red placeholder
  groundPosition: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, /* x */, /* y */, TILE),
  upperPosition: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, /* x */, /* y */, TILE),
  groundY: SURFACE_Y,
  upperY: /* align to Love Letter route / upper stop */,
  cycleSeconds: 4.5,
  dwellSeconds: 0.35,
  controlledBy: "red-button-b"
};
```

Actual coordinates should be selected visually in the current branch, but the placement relationship is fixed:

- Red Button B: opposite Platform/Elevator A / Red Button A, same tier as Elevator A upper endpoint.
- Elevator B: offset to the side of Red Button B, with a ground stop for human and upper stop for Love Letter route.

### `src/scenes/levelTwoScene.js`

Use this for creating/placing meshes.

This file already places Level Two terrain, raised tiles, Love Letter placeholder, blue button, blue ramp, Elephant Totem, and props in the GitHub `main` snapshot.

Add or verify placement for:

- Red Button B mesh/group.
- Elevator B mesh/group.
- Any generated red platform placeholder.
- Any visual markers showing the elevator's ground and upper stop.

Keep `userData.levelTwoAsset` labels explicit for debug/editor visibility, for example:

```js
redButtonB.userData.levelTwoAsset = "red-button-b";
elevatorB.userData.levelTwoAsset = "elevator-b-human-lift";
```

If using `levelTwoInteractiveMeshes`, add handles such as:

```js
levelTwoInteractiveMeshes.redButtonB = redButtonB;
levelTwoInteractiveMeshes.redButtonBTop = redButtonBTop;
levelTwoInteractiveMeshes.elevatorB = elevatorB;
```

### `src/systems/buttonSystem.js`

The GitHub `main` button system currently defines colors and activation types, including red and held weight behavior, but it does not yet reflect the newer red continuous-cycle design.

Update or extend it so red supports continuous held behavior without breaking blue persistent behavior.

Suggested model:

```js
export const BUTTON_ACTIVATION_TYPES = {
  PERSISTENT: "persistent",
  HELD_WEIGHT: "held-weight",
  HELD_CONTINUOUS_CYCLE: "held-continuous-cycle",
  TIMED_OR_POWERED: "timed-or-powered"
};
```

Keep the actor permission check simple:

- Blue button: currently Frog/main configured by existing behavior.
- Red Button B: required actor should be Elephant.

### `src/main.js`

Use for current orchestration/wiring if the mechanic is not extracted yet.

Likely responsibilities for this slice:

- Track whether Red Button B is pressed/held by Elephant.
- Update Elevator B position each frame while Red Button B is held.
- Carry the human while standing on Elevator B.
- Allow human to exit at the upper stop.
- Trigger Level Two Love Letter collection.
- Expose state in `render_game_to_text()` for smoke tests.

Avoid moving broad collision/surface ownership during this feature slice.

### `src/config/assets.js`

The GitHub `main` asset registry has blue button and blue ramp entries, but no obvious red button/red platform entries in the inspected snapshot.

If local branch has red assets, register them here.

If not, use generated temporary red meshes in `levelTwoScene.js` and add a backlog note to replace them.

Suggested asset keys if assets exist:

```js
buttonBaseRed
buttonTopRed
redElevatorPlatform
```

### `src/content/loveLetters.js`

Add `LEVEL_TWO_LOVE_LETTER_ID` and Level Two message if not present.

### `docs/game-design-handbook/02_color_coded_buttons_and_mechanisms.md`

Update red grammar to:

> Red = heavy hold, continuously cycles the linked mechanism while held.

### `docs/game-design-handbook/09_level_two_smoke_tests.md`

Add the smoke checklist from `03_SMOKE_TEST_CHECKLIST.md`.

## Suggested state shape

Add to `createLevelTwoState` if not already present:

```js
redButtonBPressed: false,
elevatorBActive: false,
elevatorBCycleT: 0,
elevatorBPosition: "ground", // "ground" | "moving-up" | "upper" | "moving-down"
elevatorBHasHuman: false,
loveLetterCollectable: false,
complete: false
```

Names can change, but state needs to be visible enough for smoke tests.

## Collision / surface warning

This slice depends on moving platforms. The highest-risk bugs are:

- human clipping into Elevator B;
- human falling through Elevator B;
- human not riding with Elevator B;
- human being unable to exit at the upper stop;
- Elephant wandering off Red Button B when unpossessed;
- elevator moving through terrain;
- red button activation radius too wide/narrow.

Implement the smallest reliable platform-follow behavior first.
