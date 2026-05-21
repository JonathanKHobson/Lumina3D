# Lumina3D Backlog

## Current Priority - Level Three Phase 1.5

1. P1 - Level 3 Phase 2: Crocodile Totem opening puzzle
   - Current state: Level Three exists as a 26x22 mostly-water lake/island shell with named zones, placeholder objects, registry/catalog/editor/smoke coverage, and no active Level Three mechanics.
   - Expected behavior: build the opening Frog lane and Crocodile Totem raft unlock only. Crocodile control waits until Phase 3.

2. P1 - Human review the cleaned Level Two Red Button B / Elevator B route
   - Current state: automated fixture coverage verifies the full Love Letter completion route.
   - Expected behavior: the route should read clearly enough in browser before more Level Two mechanics are added.

3. P1 - Human review the Level Three lake/island shell and authoring packet loop
   - Current state: Phase 1 shell screenshots and smoke tests pass; Phase 1.5 adds documentation and editor prep.
   - Expected behavior: the shell should be useful for small Phase 2 layout/mechanic edits without implying central bridge, cargo, red-button, or final route behavior.

4. P1 - Home house collision/doorway cleanup
   - Current issue: the player can partially enter/clip into the house doorway, then hit an invisible blocker deeper inside.
   - Expected behavior: the house reads as solid; the player can approach the visible door note but cannot visually step into the house unless an interior is intentionally implemented later.

5. P2 - Level Two blue ramp visual polish, if screenshots still show awkward clipping
   - Current state: the P0 stuck-state blocker is fixed and the ramp smoke verifies walk-up, blocked edge probing, recovery, and walk-down.
   - Remaining polish: if future visual review still sees actor/ramp clipping, tune ramp mesh placement or actor visual clearance without changing puzzle behavior.

## Next Level Three Feature Slice

Current gate: implement only the opening Crocodile Totem puzzle.

### Phase 2 - Crocodile Totem Opening Puzzle

- Frog crosses a short moving-lily-pad timing lane.
- If Frog misses during this intended lane, Frog splash-resets to the Frog Lane Start Perch.
- This splash-reset behavior is Level Three lane-specific and must not globally change Frog water behavior.
- Frog reaches Totem Winch Island.
- Frog repeatedly presses `level3TotemGreenButton`.
- Each green press moves/winches `level3TotemRaft` one state closer to Start Island.
- After enough presses, the raft docks.
- Human collects the Crocodile Totem.
- Crocodile Echo wakes.
- Crocodile control remains out of scope until Phase 3.

### Later Level Three Phases

- Phase 3: Crocodile actor plus amphibious land/water movement.
- Phase 4: `level3BridgeGreenButton` plus central rotating/cycling bridge.
- Phase 5: Elephant Island plus Red Button A plus horizontal platform.
- Phase 6: Crocodile cargo stones plus Red Button B plus elevator activation.
- Phase 7: final Love Letter route.
- Phase 8: polish, Crocodile patrol, communication, and QA.

## Next Level Two Feature Slice

Current gate: human review the cleaned Red Button B / Elevator B route in the browser.

Do next only after that review:

1. Tune Level Two route readability and hinting if the happy path is confusing.
2. Fix any human-review blockers in the Red Button B / Elevator B route.
3. Then decide whether Cubeling Recall is still needed for Level Two or should wait for a later level.

Stop there. Do not add Red Button C, optional collectibles, new Cubelings, or extra red-button chains until the completed Level Two route has been played and accepted.

## Home Scene Backlog

- P1 - Fix house collider alignment so the player cannot step into the doorway/interior while still reaching the note trigger.
- P2 - Add a clearer visible door note placeholder: parchment/paper rectangle on or near the door, optionally with a subtle mark or sparkle.
- P2 - Add cooldowned hint dialogue if the player walks past the house or tries to leave before reading the note, such as "I should check the door first."

## Level Two Bug And Polish Backlog

- Fixed 2026-05-19 - Main-character raised-platform step-off stuck state after leaving the Elephant Totem platform without using the ramp.
- Fixed 2026-05-19 - Blue ramp collision/lift blocker; character can walk up, probe unsupported hill edge without getting stuck, recover, and walk back down.
- Fixed 2026-05-19 - Red Elevator A visual placement/flicker pass; removed the unwanted half-sand dock, restored a flush-enough connection to the tier-3 sand tiles, stabilized the idle red platform before Elephant activation, and kept the human off Red Platform A in the current teaching slice.
- Fixed 2026-05-19 - Red Platform A / Elephant access blocker: Red Button A and Elephant spawn now sit near the platform edge for side possession, Red Platform A cycles while Elephant holds the button, release finishes the current direction and stops at the next endpoint, and Elephant can walk off onto adjacent ground without getting trapped.
- Fixed 2026-05-20 - Red Button B / Elevator B completion loop: Elephant reaches west-side Button B, human rides Elevator B, Level Two Love Letter collects, and Level Two completion triggers.
- Fixed 2026-05-20 - Red Elevator B surgical cleanup: moved Elevator B to the requested dock position, restored ground under it, removed the shaft/dock-marker visual clutter, moved Button B onto existing tier-3 mountain grass, removed active reserved scaffold tiles, and proved the human walks the Love Letter route in `level_two_red_b_route`.
- P1 - Human review cleaned Red Button B / Elevator B route in browser, especially ground readability and top landing clarity.
- P2 - Tune Elevator B visual timing/camera readability if the cycling window feels too tight.
- P2 - Add optional hint dialogue if the player presses Button B before placing the human on Elevator B.
- P2 - Add Elephant Totem discovery dialogue before pickup so the player understands the immediate objective, such as "That Elephant Cubeling is out of reach" or "There has to be a way up there."
- P2 - Reduce Frog low-ledge jump arc so it reads as a small hop and does not imply Frog can jump the central mountain.
- P3 - Make Frog low-ledge landing feel less visibly snapped while keeping reliable landing positions.
- P2 - Investigate grass tile/player grounding mismatch where the main character appears slightly floating over some grass tiles.
- P2 - Revisit Level Two Frog spawn so Frog is discoverable through exploration, not immediate, and remains separated from the blue-button ledge.
- Fixed 2026-05-20 - Level One and Level Two title cards now appear during arrival/walk-in instead of as a separate pre-walk delay.
- P3 - Add a reusable Cubeling Totem pickup celebration effect for Frog, Elephant, and future Cubelings, such as sparkles, a short character animation, and a more rewarding "Cubeling Found!" beat.

## Status Notes

- Level One title card timing is currently resolved. Keep the later pacing polish idea, but no immediate action is needed.
- Level Two Red Elevator A and Red Elevator B are implemented with continuous cycling and automated smoke coverage. The next step is human review of the cleaned full Level Two route.
- Git/GitHub setup is complete; continue local-first development with intentional commits/pushes after stable slices.
- Level Three is a lake/island shell only. It has named islands, water blockers, placeholder Love Letter, Crocodile Echo/Totem raft placeholders, distinct green button placeholders, registry/catalog/editor/smoke wiring, and no active Level Three mechanics.

## Shipped In This Pass

1. P1 - Tutorial Ground Asset Swap
   - Replace tutorial grass floor visuals with KayKit BlockBits `sand_with_grass`.
   - Keep tutorial layout, collision, tutorial logic, object placement, and UI unchanged.

2. P2 - Home Space Story Intro
   - Add `Next Level` flow from the tutorial complete menu into a short home exterior intro.
   - Include Level One title card, arrival cinematic, door note, trail guidance, and exit transition.

3. P2 - Level One Frog Water-Gap Puzzle
   - Build the first unguided frog puzzle after the Home Space intro.
   - Use a two-tile water gap, partial bridge, frog jump, button bridge completion, and Love Letter goal.

## Refactor — Remaining / Do Between Feature Slices

- Keep remaining high-risk systems in `main.js` until the related mechanics are stable and covered by smoke tests: collision/surface handling, active movement, possession/transfer, Frog jump routing, Love Letter/celebration flow, and scene-specific interactions.
- Prefer small extraction slices that do not change gameplay. Do not combine collision, scene flow, and active Level Two mechanics in the same pass.
- See `docs/refactor-plan.md` for the current refactor sequence and completed slices.

## Later

- Continue Level Two in phases using `docs/game-design-handbook/07_level_two_phased_implementation_plan.md`.
- Current Level Two state: shell, Frog low-ledge / blue-ramp / Elephant Totem access, Elephant Echo/Totem visuals, Elephant unlock/spawn/possession, Red Elevator A, Red Button B / Red Elevator B, Level Two Love Letter collection, and Level Two completion are functionally present.
- Next feature slice after human review: polish blockers only, then decide whether Cubeling Recall belongs in Level Two or a later level.
- Next Level Three slice after Phase 1.5: Phase 2 Crocodile Totem opening puzzle only, not Crocodile control, central bridge cycling, cargo, red-button systems, or the final Love Letter route.
- Replace temporary Level One Love Letter copy with final writing.
- Add a real level select/start-flow router so replaying Level One can skip the Home Space intro.
- Move testing-only reset into a menu when the pause/menu surface exists.
- Investigate rare lingering open Love Letter/open book objects after scene switches or resets; verify celebration/reward meshes and effects are hidden or destroyed when leaving a scene.
- Polish button cause-and-effect logic so switches feel physically connected to puzzle objects, such as gate/door assets in the tutorial, bridge pieces rising/sliding/unfolding, or less generic switch assets.
- Revisit Level One complexity later only if needed: fairer button exploration, possible lily pads, a future water collectible, and a replayability hook that requires returning with another Cubeling.
- Explore future Duck Cubeling Echo/Totem ideas, including a Duck Echo near water and optional earlier or alternate Duck Totem placement, but do not implement until the multi-Cubeling collectible system is in scope.
- Low-priority timing polish (future):
  - Keep title-during-arrival behavior covered by smoke tests as more scenes are added.
