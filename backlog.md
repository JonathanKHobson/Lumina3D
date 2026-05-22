# Lumina3D Backlog

## Current Priority - Level Three Spatial Contract Human Review Gate

1. P1 - Human review Level 3 spatial contract repair screenshots/play state
   - Current state: automated verification now covers the corrected Frog lily-lane spacing, small artificial bridge pivot, bridge destination ring metadata, gated Totem raft drift, fixed Start Island dock marker, Phase 2A Totem collection, and Phase 3A Crocodile actor/water movement. Screenshot artifacts are captured for human review; this corrected layout is not human-approved yet.
   - Expected behavior: the Frog lane should read as separate floating stepping stones with room for later motion, `level3CenterHub` should read as a small artificial rotating-bridge pivot rather than a natural island, and the Totem raft should drift after gates open instead of teleporting between markers.

2. P1 - Human review the cleaned Level Two Red Button B / Elevator B route
   - Current state: automated fixture coverage verifies the full Love Letter completion route.
   - Expected behavior: the route should read clearly enough in browser before more Level Two mechanics are added.

3. P1 - Decide whether Level Three needs Phase 2B moving-lily timing before the central bridge
   - Current state: the spatial repair reserves movement corridors, but lily pads remain static. Frog walking into water blocks with a hint; cozy reset is still reserved for future intentional failed timing misses.
   - Expected behavior: if the Frog lane feels too flat after human review, do Phase 2B as a small moving-lily/splash-polish pass. Otherwise proceed to Phase 4 central bridge only.

4. P1 - Home house collision/doorway cleanup
   - Current issue: the player can partially enter/clip into the house doorway, then hit an invisible blocker deeper inside.
   - Expected behavior: the house reads as solid; the player can approach the visible door note but cannot visually step into the house unless an interior is intentionally implemented later.

5. P2 - Level Two blue ramp visual polish, if screenshots still show awkward clipping
   - Current state: the P0 stuck-state blocker is fixed and the ramp smoke verifies walk-up, blocked edge probing, recovery, and walk-down.
   - Remaining polish: if future visual review still sees actor/ramp clipping, tune ramp mesh placement or actor visual clearance without changing puzzle behavior.

## Next Level Three Feature Slice

Current gate: human review the captured spatial contract repair screenshots/play state. Automated verification passed, but the corrected layout is not human-approved yet.

### Phase 2A - Crocodile Totem Opening Puzzle

Status: implemented and visually cleared for forward progress with minor polish notes.

- Frog crosses a short static lily-pad jump lane.
- Frog walking into water is blocked with a hint; it does not reset.
- Future splash reset is reserved for failed moving-lily timing, should Phase 2B happen.
- Frog reaches Totem Winch Island.
- Frog repeatedly presses `level3TotemGreenButton`.
- Each green press opens the next raft gate and starts a smooth drift toward the next resting marker.
- After enough presses, the raft docks.
- Human collects the Crocodile Totem.
- Crocodile Echo wakes.

### Phase 2B - Optional Moving Lily Timing Polish

- Add deterministic small lily-pad motion only if human review says the static Phase 2A crossing needs more timing texture.
- Keep the splash reset lane-specific and cozy.
- Do not add bridge cycling, red buttons, cargo, elevators, or the final Love Letter route in this slice.

### Phase 3A - Crocodile Actor And Water Movement

Status: implemented; automated verification passed; screenshots captured for human review.

- Enlarge Level Three lily pads so Frog visually fits.
- Block Frog walking into water with "I need to hop to the leaf" style feedback.
- Spawn Crocodile after Human collects the Crocodile Totem.
- Allow Shift transfer into Crocodile near the Human.
- Let Crocodile move on land and water.
- Keep cargo, ferrying, bridge cycling, red buttons, elevators, and the final Love Letter route deferred.

### Spatial Contract Repair - Lily Lane, Pivot, And Raft Drift

Status: implemented; automated verification passed; screenshots captured for human review.

- Enlarged and re-spaced the Frog lily lane so each pad is separate and has future movement room.
- Kept lily pad centers and future track endpoints over water.
- Shrunk non-start bridge islands to small puzzle footprints.
- Reframed `level3CenterHub` as a one-tile artificial rotating-bridge pivot/turntable with inactive bridge-arm hint.
- Repositioned bridge destinations into a readable ring and kept `level3BridgeGreenButton` inactive.
- Added raft reed gates and changed the Totem raft from snap movement to smooth gated drift.
- Kept `level3TotemDockMarker` fixed as a destination/reference marker, distinct from the moving raft.

### Later Level Three Phases

- Phase 4: `level3BridgeGreenButton` plus central rotating/cycling bridge built around the small pivot/turntable.
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
- Level Three has a lake/island shell plus the Phase 2A opening Crocodile Totem puzzle, Phase 3A Crocodile actor/control lane, and the spatial contract repair for the lily lane, raft drift, and future rotating bridge pivot. It has named islands, water blockers, enlarged/spaced lily pads, placeholder Love Letter, Crocodile Echo/Totem raft drift state, distinct green buttons, registry/catalog/editor/smoke wiring, and no Crocodile cargo, central bridge rotation, red-button, elevator, or final Love Letter route behavior.

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
- Next Level Three slice after spatial-contract human review: optional Phase 2B moving-lily timing polish or Phase 4 central bridge. Do not add cargo, red-button systems, elevators, or the final Love Letter route yet.
- Replace temporary Level One Love Letter copy with final writing.
- Add a real level select/start-flow router so replaying Level One can skip the Home Space intro.
- Move testing-only reset into a menu when the pause/menu surface exists.
- Investigate rare lingering open Love Letter/open book objects after scene switches or resets; verify celebration/reward meshes and effects are hidden or destroyed when leaving a scene.
- Polish button cause-and-effect logic so switches feel physically connected to puzzle objects, such as gate/door assets in the tutorial, bridge pieces rising/sliding/unfolding, or less generic switch assets.
- Revisit Level One complexity later only if needed: fairer button exploration, possible lily pads, a future water collectible, and a replayability hook that requires returning with another Cubeling.
- Explore future Duck Cubeling Echo/Totem ideas, including a Duck Echo near water and optional earlier or alternate Duck Totem placement, but do not implement until the multi-Cubeling collectible system is in scope.
- Low-priority timing polish (future):
  - Keep title-during-arrival behavior covered by smoke tests as more scenes are added.
