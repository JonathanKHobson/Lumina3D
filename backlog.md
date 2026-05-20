# Lumina3D Backlog

## Current Priority - Before The Next Level Two Feature Slice

1. P1 - Home house collision/doorway cleanup
   - Current issue: the player can partially enter/clip into the house doorway, then hit an invisible blocker deeper inside.
   - Expected behavior: the house reads as solid; the player can approach the visible door note but cannot visually step into the house unless an interior is intentionally implemented later.

2. P2 - Level Two blue ramp visual polish, if screenshots still show awkward clipping
   - Current state: the P0 stuck-state blocker is fixed and the ramp smoke verifies walk-up, blocked edge probing, recovery, and walk-down.
   - Remaining polish: if future visual review still sees actor/ramp clipping, tune ramp mesh placement or actor visual clearance without changing puzzle behavior.

## Next Level Two Feature Slice

Current gate: human review the corrected Red Platform A / Elephant access slice. If it passes, the next Level Two feature slice can move to the next contained red elevator step.

Do next:

1. Plan and implement Red Button / Elevator B as a contained slice.
2. Keep the red continuous-cycle behavior from Red Platform A.
3. Verify human boarding/riding only in the Elevator B slice, not on Red Platform A.

Stop there. Do not add Red Button C, final Love Letter routing, Cubeling Recall, optional collectibles, or extra red-button chains until Elevator B is stable.

## Home Scene Backlog

- P1 - Fix house collider alignment so the player cannot step into the doorway/interior while still reaching the note trigger.
- P2 - Add a clearer visible door note placeholder: parchment/paper rectangle on or near the door, optionally with a subtle mark or sparkle.
- P2 - Add cooldowned hint dialogue if the player walks past the house or tries to leave before reading the note, such as "I should check the door first."

## Level Two Bug And Polish Backlog

- Fixed 2026-05-19 - Main-character raised-platform step-off stuck state after leaving the Elephant Totem platform without using the ramp.
- Fixed 2026-05-19 - Blue ramp collision/lift blocker; character can walk up, probe unsupported hill edge without getting stuck, recover, and walk back down.
- Fixed 2026-05-19 - Red Elevator A visual placement/flicker pass; removed the unwanted half-sand dock, restored a flush-enough connection to the tier-3 sand tiles, stabilized the idle red platform before Elephant activation, and kept the human off Red Platform A in the current teaching slice.
- Fixed 2026-05-19 - Red Platform A / Elephant access blocker: Red Button A and Elephant spawn now sit near the platform edge for side possession, Red Platform A cycles while Elephant holds the button, release finishes the current direction and stops at the next endpoint, and Elephant can walk off onto adjacent ground without getting trapped.
- P1 - Human review Red Platform A access/cycling fix before implementing Elevator B.
- P2 - Add Elephant Totem discovery dialogue before pickup so the player understands the immediate objective, such as "That Elephant Cubeling is out of reach" or "There has to be a way up there."
- P2 - Reduce Frog low-ledge jump arc so it reads as a small hop and does not imply Frog can jump the central mountain.
- P3 - Make Frog low-ledge landing feel less visibly snapped while keeping reliable landing positions.
- P2 - Investigate grass tile/player grounding mismatch where the main character appears slightly floating over some grass tiles.
- P2 - Revisit Level Two Frog spawn so Frog is discoverable through exploration, not immediate, and remains separated from the blue-button ledge.
- P3 - Future pacing polish: level title cards should ideally appear during character walk-in, not as a separate pre-walk delay.
- P3 - Add a reusable Cubeling Totem pickup celebration effect for Frog, Elephant, and future Cubelings, such as sparkles, a short character animation, and a more rewarding "Cubeling Found!" beat.

## Status Notes

- Level One title card timing is currently resolved. Keep the later pacing polish idea, but no immediate action is needed.
- Level Two Red Elevator A teaching assembly is implemented with continuous cycling and automated smoke coverage. The next step is human review before Elevator B.
- Git/GitHub setup is complete; continue local-first development with intentional commits/pushes after stable slices.

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
- Current Level Two state: shell, Frog low-ledge / blue-ramp / Elephant Totem access, Elephant Echo/Totem visuals, Elephant unlock/spawn/possession, and Red Elevator A teaching/access assembly are functionally present.
- Next feature slice after Red Platform A human review: Red Button / Elevator B as a contained slice. Stop before Red Button C, Cubeling Recall, and the final Love Letter route.
- Replace temporary Level One Love Letter copy with final writing.
- Add a real level select/start-flow router so replaying Level One can skip the Home Space intro.
- Move testing-only reset into a menu when the pause/menu surface exists.
- Investigate rare lingering open Love Letter/open book objects after scene switches or resets; verify celebration/reward meshes and effects are hidden or destroyed when leaving a scene.
- Polish button cause-and-effect logic so switches feel physically connected to puzzle objects, such as gate/door assets in the tutorial, bridge pieces rising/sliding/unfolding, or less generic switch assets.
- Revisit Level One complexity later only if needed: fairer button exploration, possible lily pads, a future water collectible, and a replayability hook that requires returning with another Cubeling.
- Explore future Duck Cubeling Echo/Totem ideas, including a Duck Echo near water and optional earlier or alternate Duck Totem placement, but do not implement until the multi-Cubeling collectible system is in scope.
- Low-priority timing polish (future):
  - Add a Level One title card so Level One transitions match Level Two style.
  - Fix title card sequencing so title appears during character walk-in (not fully before movement).
  - Desired sequence:
    - Level starts
    - Character begins walking in
    - Title card appears during the walk-in
    - Title card fades
    - Character completes entrance
    - Player control begins
  - This should preserve cinematic intent while removing extra idle dead-time between title and gameplay.
