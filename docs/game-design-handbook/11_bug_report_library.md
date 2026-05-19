# Bug Report Library And Prevention Rules

## Purpose

This file translates bugs we have already hit into prevention rules for future levels.

Root `bug_report.md` is the living bug log. This handbook file is the slower-moving bug pattern library.

## Recurring Bug Pattern 1 - Asset Orientation

Examples:

- Home house faced the wrong way.
- Level One bridge faced the wrong direction.
- Barrier end caps faced wrong and looked unfinished.

Prevention:

- Every new major asset needs a screenshot check from the default camera.
- Add an orientation note near the scene placement code.
- If an asset is a crossing object, state what it crosses.
- For bridges: if water runs left-right, bridge runs up-down; if water runs up-down, bridge runs left-right.

Smoke check:

- `render_game_to_text().level.visibleAssets` confirms expected asset.
- Screenshot confirms front/facing/crossing direction.

## Recurring Bug Pattern 2 - Visual Alignment

Examples:

- Bridge was rotated correctly but not placed over the water.
- Barrier end cap column was centered instead of anchored by the column edge.
- Frog appeared inside bridge visuals before walkable deck/lift tuning.

Prevention:

- Treat visual anchor separately from mesh origin.
- Define whether placement is center-based or anchor-based.
- Add explicit collision/walkable proxy if visual mesh is decorative.
- Screenshot before and after actor stands on the object.

Smoke check:

- actor stands on bridge/platform surface;
- obstacle and crossing overlap visually;
- proxy state exposed in `render_game_to_text()`.

## Recurring Bug Pattern 3 - Missing Collision

Examples:

- Player could walk through the Home house.
- Home house doorway still allows partial visual entry before an invisible blocker.
- Bridge visuals needed explicit walkable collision/deck.
- Large props need collision but path must stay open.

Prevention:

- Any solid-looking large object gets a labeled collider.
- Colliders are exposed for smoke tests when important.
- Door/note trigger zones must remain reachable.
- Scenery colliders stay off required paths.

Smoke check:

- attempt to walk into object;
- verify actor does not enter collider bounds;
- verify nearby interaction still works.

## Recurring Bug Pattern 3b - Raised Surface Transitions

Examples:

- Frog previously got stuck after ledge jumps.
- Main character can currently get stuck after leaving the Level Two Elephant Totem hill without using the ramp.
- Blue ramp can work mechanically but still make the actor look embedded if the visual mesh and walkable proxy disagree.

Prevention:

- Treat raised terrain edges as explicit transitions, not incidental movement.
- Decide per edge whether descent is allowed or blocked.
- If descent is allowed, restore actor surface height and collision state immediately after landing.
- If descent is blocked, block before the actor partially enters a wall, tile, or invalid surface.
- Ramp assets need bottom contact, top contact, side blocking, height interpolation, and visual clearance checks.

Smoke check:

- walk up ramp;
- walk down ramp;
- attempt non-ramp edge exits;
- verify actor remains on top of ramp/ledge visuals;
- verify movement recovery without reset.

## Recurring Bug Pattern 4 - Dialogue Looping

Examples:

- Door note/dialogue retriggered rapidly every update frame.
- Multiple bubbles appeared too close together.

Prevention:

- Trigger dialogue on enter-zone, not every frame inside-zone.
- Track `zoneInside`, `shown`, `count`, or cooldown flags.
- Use a queue when two actors need to speak.
- Never show two lesson bubbles at once unless explicitly designed.

Smoke check:

- stand in trigger zone for several seconds;
- verify open count stays stable;
- verify text does not flicker or rotate too quickly.

## Recurring Bug Pattern 5 - Effects Too Early Or Too Noisy

Examples:

- Home heart trail appeared immediately and looked like a jet stream.
- Hearts/effects can obscure reward moments if too dense.

Prevention:

- Effects should be tied to a state reason.
- Idle reminders need delay and cooldown.
- If an effect looks bad quickly, disable it and rely on dialogue/signposting.

Smoke check:

- start state has no premature effect;
- effect count stays low;
- screenshot confirms effect reads as intended.

## Recurring Bug Pattern 6 - Autonomous Cubeling Blocking

Examples:

- Frog companion behavior moved toward the character and blocked the doorway.
- Frog celebration could cross in front of the main character/Love Letter.

Prevention:

- Autonomous Cubelings use independent patrol/idle zones.
- Do not target the main character unless a specific future mechanic requires it.
- Required path zones need exclusion/yield rules.
- Celebration perches should stay off the focal line.

Smoke check:

- move main character near/far from Cubeling;
- verify Cubeling target does not recenter around human;
- verify doorway/path remains clear.

## Recurring Bug Pattern 7 - Scene Timing

Examples:

- Level One title card appeared during Home exit instead of Level One start.
- Exit confirmation became finicky when re-entering trigger zones.

Prevention:

- Title card belongs to the scene it introduces.
- Use explicit scene phases: `leaving`, `title`, `arrival`, `play`.
- Confirmation modals need re-entry/cooldown logic.
- Reset should clear scene-specific modal/title/fade state.

Smoke check:

- assert `scene.id` before title card;
- assert fade/title phase ordering;
- dismiss and re-enter exit zones.

## Bug Report Template

Use this in `bug_report.md`:

```markdown
## YYYY-MM-DD - Short Bug Name

- Status:
- Scene:
- Symptom:
- Root cause:
- Fix:
- Prevention rule:
- Verification:
- Follow-up:
```
