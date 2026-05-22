# Level Two Editor Deltas — Source-Backed Objects

Derived from the 2026-05-20 Lumina3D level editor handoff for `level_two`.

## Export summary

| Field | Value |
|---|---:|
| Active level | `level_two` |
| Affected objects | 8 |
| Objects with transform changes | 7 |
| Objects with notes | 6 |
| Map-level note | No |
| Marked delete | 0 |
| Marked replace | 0 |
| Collider/proxy hints | 789 total; affected-object proxies included in export |
| Selected object | None |
| Selected read-only asset | `player` only; do not place/spawn |

## Transform edits

| Object | Source ref | Original | Final | Intent / note |
|---|---|---|---|---|
| `level_two.blue_button` | `src/levels/levelTwo.js` → `LEVEL_TWO_POINTS.blueButton` | `(14.7, 2.8, 13)` | `(15.25, 2.8, 13.25)` | Move button slightly; keep Blue Button trigger behavior linked to Blue Ramp reveal. |
| `level_two.elephant_echo` | `src/levels/levelTwo.js` → `LEVEL_TWO_POINTS.elephantEcho` | `(13.4, 9.5, 1)` | `(13.75, 9.5, -1.5)` | Move spawn/echo closer to corner. Ensure elephant/spawn point is on top of Red Button A. |
| `level_two.red-button-a` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_BUTTONS['red-button-a']` | `(13.4, 9.34, 1)` | `(13.75, 9.34, -1.5)` | Keep aligned with Elephant Echo on same X/Z; held-weight button for `red-elevator-a`. |
| `level_two.red-elevator-a` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_PLATFORMS['red-elevator-a']` | `(12.4, 8.24, 1)` | `(12.25, 8.24, 0)` | Center with `level_two.terrain.red-elevator-a-top-connector.3`; move closer to terrain. |
| `level_two.red-elevator-b` | `src/levels/levelTwo.js` → `LEVEL_TWO_RED_PLATFORMS['red-elevator-b']` | `(-1.75, 1.32, 10.25)` | `(-0.75, 1, 12.25)` | Prevent overlap when rising with `level_two.terrain.human-love-letter-route.4`; center with that tile. |
| `level_two.prop.forestTreeB.2` | `src/levels/levelTwo.js` → `LEVEL_TWO_PROPS[1]` | `(18.2, 2.08, -16)` | `(18.2, 2.08, -18.75)` | Avoid collision with `level_two.terrain.elephant-totem-hill.3`. |
| `level_two.prop.forestRock.9` | `src/levels/levelTwo.js` → `LEVEL_TWO_PROPS[8]` | `(14.4, 2.08, 11.8)` | `(12.75, 2.08, 11)` | Move farther from Blue Button for readability and access. |

## Note-only affected object

| Object | Source ref | Transform changed? | Required implementation note |
|---|---|---:|---|
| `level_two.blue_ramp` | `src/levels/levelTwo.js` → `LEVEL_TWO_BLUE_RAMP.position` | No | Add a flat blue platform/panel on the ground before the ramp appears. When activated, the ramp should visually move/rise from that flat platform into its current active ramp position. |

## Collider/proxy hints to inspect

These are visual/source hints, not automatic source-write instructions.

| Owner | Relevant hint | Why it matters |
|---|---|---|
| Blue Button | Trigger center follows `(15.25, 2.88, 13.25)` with half extents about `(0.7, 0.1, 0.7)` | Confirm trigger is computed from `LEVEL_TWO_POINTS.blueButton` or update paired source if separate. |
| Blue Ramp | Walkable envelope center `(9.7, 3.005, -12.9)`, half extents `(4.2, 0.925, 1.4)` | Preserve active ramp walkable behavior while adding dormant platform visual. |
| Elephant Echo | Interaction ring center `(13.75, 9.5, -1.5)` | Confirm interaction is available on the terrace and aligned with Red Button A. |
| Red Button A | Held-weight trigger center `(13.75, 9.26, -1.5)` | Confirm elephant held-weight activation remains centered after move. |
| Red Elevator A | Walkable surface center `(12.25, 9.42, 0)`; footprint center `(12.25, 8.74, 0)` | Confirm runtime colliders/visuals follow the new source position. |
| Red Elevator A | Side approach zone and top exit zone have separate source refs | Inspect but do not move blindly; move only if route/validator shows mismatch. |
| Red Elevator B | Walkable surface center `(-0.75, 2.18, 12.25)`; footprint center `(-0.75, 1.5, 12.25)` | Confirm no overlap with Human Love Letter Route Tile 4 during rising. |
| Forest props | Visual proxies only | Confirm visual/collision clearance manually or via validators. |
