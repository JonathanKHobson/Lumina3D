# Level Two Phased Implementation Plan

## Rule

Do not build all of Level Two in one implementation pass.

The project has already shown the cost of broad passes: asset orientation, collision, dialogue loops, bridge alignment, and scene timing all become harder to isolate when too many systems move at once.

## Phase 1 - Planning Docs And Asset Inventory

Status: current pass.

Deliverables:

- handbook docs;
- mechanism design system;
- Cubeling Recall rules;
- Level Two scope;
- component breakdown;
- asset plan;
- smoke checklist;
- backlog/roadmap alignment;
- bug report library.

Stop condition:

- docs exist and identify the smallest safe next slice.

## Phase 2 - Level Two Shell

Goal:

Create the empty Level Two scene and verify it runs.

Scope:

- add `SCENES.LEVEL_TWO`;
- add debug shortcut `4 = Level Two`;
- add `src/levels/levelTwo.js`;
- add `src/scenes/levelTwoScene.js`;
- create terrain shell with current ground/path style;
- place main character start;
- place Frog available from start;
- place placeholder elevated Love Letter;
- add `render_game_to_text().levelTwo` basics.

Smoke:

- Level Two loads directly;
- title card appears;
- player enters and gains control;
- camera follows;
- movement/collision bounds work;
- Frog is present;
- Love Letter placeholder is visible but not necessarily reachable.

## Phase 3 - Frog Ledge + Blue Button Platform Test

Goal:

Build the first functional Level Two slice using a familiar Frog interaction.

Scope:

- add one raised ledge or side platform;
- add Frog jump zone;
- add blue button;
- add simple persistent platform/elevator response;
- let main character reach the Elephant Totem area or placeholder access point.

Smoke:

- Frog can jump to ledge from forgiving valid positions;
- Frog cannot jump from invalid positions and gets feedback;
- Frog presses blue button;
- blue platform/elevator activates;
- main character can use the activated route.

## Phase 4 - Elephant Echo + Elephant Totem Unlock

Goal:

Introduce Elephant unlock sequence.

Precondition:

- fixed 2026-05-19: raised-terrain step-off stuck bug;
- fixed 2026-05-19: blue ramp walkable-surface alignment enough for the current slice;
- confirmed 2026-05-19: the main character can reach the Totem hill, probe an unsupported edge without getting stuck, recover, and walk back down the ramp.

Scope:

- copy/register Elephant asset after review;
- add Elephant Echo;
- add Elephant Cubeling Totem;
- main character collects Totem;
- Echo converts to real Elephant;
- show "Elephant Cubeling Found!".

Smoke:

- Echo is transparent, non-solid, and labeled;
- Totem is visually distinct from Echo;
- only main character collects Totem;
- Elephant spawns at Echo.

## Phase 5 - Elephant Movement + Red Button Weight Test

Goal:

Make Elephant feel heavy and useful.

Scope:

- add Elephant actor state;
- add transfer targeting;
- set slower speed/larger radius;
- add red button;
- Elephant activates red button;
- Frog/main character fail to activate red button with feedback.

Smoke:

- transfer to Elephant works near Elephant;
- Elephant moves slower;
- Elephant activates red button;
- Frog/main character do not activate red button.

## Phase 6 - Red Button Platform/Elevator Movement

Goal:

Connect red button to a readable moving platform/elevator.

Scope:

- red button held activation;
- platform moves while Elephant remains on button;
- platform returns slowly when Elephant leaves;
- actor standing/riding behavior.

Smoke:

- platform moves when red button held;
- platform returns when released;
- platform movement is slow/readable;
- actors do not clip or fall through.

## Phase 7 - Cubeling Recall

Goal:

Add recovery tool for multiple Cubelings.

Scope:

- `C` input;
- recall cooldown;
- Frog returns to Frog Echo;
- Elephant returns to Elephant Echo;
- recall particles/effect;
- state exposure.

Smoke:

- recall returns all active Cubelings to their Echoes;
- recall does not reset Totem unlock;
- recall does not reset persistent blue mechanisms;
- recall still leaves transfer as proximity-based.

## Phase 8 - Assemble First Playable Level Two Route

Goal:

Connect the Frog section, Elephant unlock, red-button route, and Love Letter.

Scope:

- route tuning;
- camera readability;
- collision pass;
- hint dialogue only where needed;
- first playable completion path.

Smoke:

- full path from start to Love Letter works;
- no sequence break from Cubeling positions;
- reset works.

## Phase 9 - Completion Flow And Polish

Goal:

Finish the level experience.

Scope:

- Level Two Love Letter message;
- celebration;
- completion menu;
- optional soft hints;
- screenshot/design QA.

Smoke:

- Love Letter message appears;
- completion menu appears;
- reset clears Level Two scene-specific state.

## Recommended Immediate Next Slice

Either clean up the Home house doorway collision bug or proceed to Phase 4 if the next pass is strictly Level Two.

Reason:

- Phase 2 and the Frog/Totem access slice are now implemented and smoke-tested.
- The raised-terrain/ramp recovery blocker is fixed and covered by smoke tests.
- Home house collision remains a known medium-high bug, but it does not block the next Level Two mechanic slice.

The next Level Two feature slice should be Phase 4 only:

- refine Elephant Cubeling Totem visual;
- add Elephant Echo visual/spawn anchor;
- collect Totem with the main character;
- show "Elephant Cubeling Found!";
- spawn/unlock Elephant from the Echo.

Stop before Elephant movement, red buttons, elevators, Cubeling Recall, or final Love Letter routing.
