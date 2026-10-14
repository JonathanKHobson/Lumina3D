# Visual QA Contract

Purpose: make scene readability and visual/collision alignment testable before Jonathan has to catch problems manually.

This is a planning contract. It does not require screenshot baselines to block work until a human approves the first baseline set.

## Principle

State QA is not enough. A scene is only ready when the important gameplay object proves all of these:

- visible from an expected camera
- spatially aligned with its collider or walkable proxy
- readable at desktop and narrow viewport sizes
- not embedded in terrain or another object
- not hiding a trigger, exit, collectible, or blocked route

The first visual QA phase should be warning-only. Capture screenshots, name the intended proof, and let a human approve baselines before failures become blocking.

## Screenshot Sets

Every playable scene should eventually define:

| Shot kind | Required? | Purpose |
|---|---|---|
| `default_desktop` | Yes | Confirms the scene reads from the normal play camera. |
| `narrow_view` | Yes | Catches clipped overlays, cramped composition, and unreadable routes. |
| `mechanic_focus` | When mechanics changed | Shows the specific route, object, or interaction under review. |
| `failure_repro` | When fixing bugs | Preserves the bug camera before/after the fix. |
| `editor_handoff` | When editor layout changed | Confirms the authored object is visible and selectable in context. |

## Bookmark Shape

Store future screenshot bookmarks as data, not prose:

```js
{
  id: "level_two_ramp_midpoint",
  levelId: "level_two",
  viewport: { width: 1280, height: 720 },
  fixture: "level_two_ramp_ready",
  actor: "human",
  cameraYaw: 0,
  description: "Human is visibly on top of the active blue ramp, not embedded in it.",
  expectedVisible: ["human", "blueRamp"],
  expectedNotVisible: ["human-inside-ramp"],
  status: "warning-only"
}
```

## Review Rules

- Do not approve a screenshot baseline if the object is merely present. It must prove the intended relationship.
- For collision bugs, pair the screenshot with a probe path or fixture output.
- For moving platforms, capture at least one endpoint and one in-between state.
- For ramps/bridges/lily pads, capture actor contact, entry, and exit when practical.
- For collectibles and Love Letters, confirm they are visible, reachable by the right actor, and not intersecting terrain.
- For narrow viewports, check that HUD and overlays do not hide the route or actor.

## Warning-Only To Blocking

Use this progression:

1. `baseline-missing`: capture only; never fail.
2. `human-review`: baseline exists but needs Jonathan approval.
3. `warning-only`: report diffs but do not fail CI/local gates.
4. `blocking`: fail only after the baseline and tolerances are trusted.

## Suggested Commands

Future commands should follow the existing scripts-first pattern:

```bash
npm run tools:capture-scene-screenshots -- level_two --pretty
npm run tools:validate-scene-screenshots -- level_two --pretty
```

Until those commands exist, use `run-scene-smoke`, targeted fixtures, and manual Playwright screenshots.

## First Bookmark Candidates

| Level | Bookmark | Why |
|---|---|---|
| `home_intro` | `home_house_doorway` | Confirms the player can trigger the note from outside but cannot clip into the house. |
| `level_one` | `level_one_bridge_crossing` | Confirms bridge/water readability and walkable deck alignment. |
| `level_two` | `level_two_ramp_midpoint` | Confirms human is supported by the ramp, not swallowed by it. |
| `level_two` | `level_two_red_elevator_a_exit` | Confirms Elephant and human can exit without invisible-wall behavior. |
| `level_three` | `level_three_frog_lane` | Confirms lily pads, water gaps, and Totem Winch Island read as the intended route. |

