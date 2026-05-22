# Blue Ramp Ground Indicator Design Brief

## Goal

Make the Blue Button → Blue Ramp relationship more readable before the player presses the button.

The player should see a flat blue platform/panel on the ground where the Blue Ramp mechanism lives. When the Blue Button activates the Blue Ramp, the visual should read as that flat platform rising or transforming into the ramp’s active position.

## Current source-backed object

- Object: `level_two.blue_ramp`
- Source ref: `src/levels/levelTwo.js` → `LEVEL_TWO_BLUE_RAMP.position`
- Current transform remains unchanged:
  - Position: `(9.2, 2.08, -12.9)`
  - Rotation: `(0, -1.570796, 0)`
  - Scale: `(0.36, 0.48, 0.92)`

## Desired player read

1. **Before activation:** “There is a blue mechanism here.”
2. **After pressing Blue Button:** “The blue floor piece woke up and became a ramp.”
3. **After activation completes:** “This ramp is the new route forward.”

## Implementation preference

Use the smallest stable implementation that fits the current runtime:

- Add minimal source-backed data near `LEVEL_TWO_BLUE_RAMP` if needed, such as a dormant-panel position/scale/material reference.
- Reuse existing platform/ramp mesh helpers and blue material conventions where possible.
- Animate through the existing Level Two update path if there is already button/ramp state such as `blueRampActive`.
- Keep the timing simple and readable. A short ease from dormant panel to active ramp is enough.
- Avoid introducing a new reusable animation framework in this pass.

## Collision/readability cautions

- The dormant flat panel can be visual-only unless the existing route design intentionally supports walking on it.
- If the dormant panel is walkable, make that explicit in colliders and validate that it does not create a shortcut or confusing false route.
- The active ramp walkable envelope should remain correct for the current Blue Ramp route.
- If the Blue Ramp collider is currently enabled only when active, preserve that contract unless there is a clear reason to change it.

## Acceptance checks

- The dormant blue panel is visible from the expected approach route before pressing the Blue Button.
- The panel is visually tied to the Blue Ramp location and color language.
- Pressing the Blue Button causes a clear transition from dormant panel to active ramp.
- The active ramp remains walkable by the intended actor.
- The player is not punished or confused by the dormant visual.
