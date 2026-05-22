# Level 3: Stillwater Circuit

## Purpose

This is the current Level Three planning source. It captures the lake/island direction after the Phase 1 shell rewrite and keeps later Crocodile work split into small implementation lanes.

This doc is design intent, not runtime source. Use `src/levels/levelThree.js`, `src/scenes/levelThreeScene.js`, `render_game_to_text()`, and the level catalog for current executable truth.

## Core Fantasy

Level Three is a mostly-water lake made of small islands. The player starts with Frog, unlocks Crocodile through a cozy opening puzzle, uses repeatable green buttons to route mechanisms, uses Elephant and small stones for later red weight systems, and eventually reaches a raised Love Letter as the human.

The level should feel like reading a quiet circuit around a lake: separated islands, obvious water routes, small docks, visible future destinations, and a final cliff that feels emotionally inviting but not yet reachable.

## Current Phase 1 Shell

Phase 1 shipped a `26x22` mostly-water shell with:

- Start Island with Human and Frog available.
- Frog Lane Start Perch.
- static moving-lily-pad placeholders.
- Totem Winch Island with `level3TotemGreenButton`.
- dormant `level3CrocodileEcho`.
- `level3TotemRaft` and raft state markers.
- Center Hub and future bridge destination markers.
- separate `level3BridgeGreenButton`.
- Elephant, Red Button A, Platform Dock, Weight Cache, Red Button B, and Love Letter Cliff zones.
- visible, non-collectable Love Letter placeholder on the raised cliff.

The shell contract repair after Phase 1.5 tightened the visual language before mechanics:

- Start Island now has a visible left-edge grass/shore connection for honest arrival.
- random sand/path marker tiles were removed from the Level Three shell.
- the Frog lily-pad lane now has a clearer water gap toward Totem Winch Island.
- all three lily pad centers are authored on water tiles and use the shared Level One lily pad visual.
- Level Three green/red button placeholders use the established KayKit two-part button geometry family; green is a material variant because no green KayKit button asset is present.

After Phase 2A, the opening Crocodile Totem puzzle is active under automated coverage only. Human visual review is still pending, so do not treat the shell or Phase 2A as visually accepted yet.

## Design Locks

- Crocodile can move on land and water.
- Crocodile can press normal/cycle buttons if physically reachable.
- Crocodile is not heavy enough to satisfy red buttons.
- Crocodile can eventually carry small weight stones.
- Crocodile cannot carry humans.
- Crocodile cannot carry Cubelings.
- Red buttons require held weight: Elephant or enough small weight stones.
- Green buttons are repeatable/cycle buttons.
- Blue buttons are one-and-done.
- Human collects Totems and Love Letters.
- Cubelings do not collect Totems or Love Letters.

## Phase Plan

### Phase 1 - Lake/Island Shell

Status: implemented.

Rewrite Level Three as a mostly-water island map with named zones and visible placeholder objects only. Keep all future mechanics inactive.

### Phase 1.5 - Documentation And Editor Prep

Status: implemented.

Update living docs, progress tracking, render/debug output, and editor metadata so future Level Three passes can stay small and source-backed.

### Phase 1.6 - Shell Contract Repair

Status: implemented.

Correct the Phase 1 shell visual contract before mechanics: connect Start Island to the left edge, remove unmotivated sand markers, move the Frog lane/Totem Winch spacing apart, put lily pads over water, reuse the established lily pad visual, and replace generated button cylinders with the KayKit button visual family. Keep all future mechanics inactive.

### Phase 2A - Crocodile Totem Opening Puzzle

Status: implemented with automated verification; human visual review pending.

Build only the opening puzzle:

- Frog crosses a short static lily-pad jump lane.
- If controlled Frog enters the intended lane water while off a lily-pad surface, Frog splash-resets to the Frog Lane Start Perch.
- Splash reset is Level Three lane-specific and does not globally change Frog water behavior.
- Frog reaches Totem Winch Island.
- Frog repeatedly presses `level3TotemGreenButton`.
- Each green press winches `level3TotemRaft` one state closer to Start Island.
- After enough presses, the raft docks at the Start Island Totem Dock.
- Human collects the Crocodile Totem.
- `level3CrocodileEcho` wakes.
- Crocodile control remains out of scope until Phase 3.

The static lily-pad lane is deliberate for Phase 2A. Moving lily-pad timing is deferred to Phase 2B unless review decides the static route is sufficient for this opening lesson.

### Phase 2B - Optional Moving Lily Timing Polish

Add deterministic small lily-pad motion and tune splash-reset feel if the opening route needs more timing texture after human review. Keep it lane-specific and cozy. Do not add Crocodile control, central bridge cycling, cargo, red buttons, elevators, or the final Love Letter route.

### Phase 3 - Crocodile Actor

Add Crocodile as a controllable Cubeling with amphibious land/water movement. Keep cargo and bridge puzzle behavior out of scope unless explicitly pulled forward.

### Phase 4 - Central Green Button And Bridge

Implement `level3BridgeGreenButton` as a repeatable/cycle button and add the central bridge state model:

- State 0: Center Hub connects to Start Island.
- State 1: Center Hub connects to Elephant Island.
- State 2: Center Hub connects to Red Button A Island.
- State 3: Center Hub connects to Platform Dock Island.

The bridge should not connect directly to Green Button Island, Weight Cache Island, Red Button B Island, or Love Letter Cliff.

### Phase 5 - Elephant Island And Red Button A

Bring Elephant into the Level Three route and implement Red Button A plus the horizontal platform or route segment it holds. Crocodile remains not-heavy-enough for red buttons.

### Phase 6 - Crocodile Cargo Stones And Red Button B

Add small anchor-stone pickup/carry/drop for Crocodile, sum stones on `level3RedButtonB`, and activate the later elevator or access mechanism.

### Phase 7 - Final Love Letter Route

Author the final path to Love Letter Cliff. Human collects the Love Letter; Cubelings still cannot.

### Phase 8 - Polish, Patrol, Communication, QA

Tune readability, Crocodile idle/patrol, hints, camera framing, screenshot coverage, and portfolio-ready communication.

## Opening Totem Puzzle Notes

The opening puzzle should teach green repeatability without asking the player to understand the whole lake system. Frog should see the lane, hop through a tiny water crossing, reach the winch island, and press the button enough times to bring the raft home.

Splash reset should feel cozy and specific, not like death or punishment. A miss means Frog pops or splashes back to the Frog Lane Start Perch, ready to try again. Do not make global Frog water behavior harsher to support this one lane.

The first green button is `level3TotemGreenButton`. It is separate from `level3BridgeGreenButton`; do not share state between them.

## Dev And Editor Note

New Level Three shell objects should keep stable names and IDs so future work can use Dev Editor selection, `/editor/` inspection, `render_game_to_text()`, scene smokes, level manifests, and screenshot QA without re-discovering object identity.

Important source-authored IDs:

- `level3StartIsland`
- `level3FrogLaneStart`
- `level3TotemWinchIsland`
- `level3TotemGreenButton`
- `level3TotemRaft`
- `level3CrocodileEcho`
- `level3CenterHub`
- `level3BridgeGreenButton`
- `level3ElephantIsland`
- `level3RedButtonAIsland`
- `level3PlatformDockIsland`
- `level3WeightCacheIsland`
- `level3RedButtonBIsland`
- `level3LoveLetterCliff`
