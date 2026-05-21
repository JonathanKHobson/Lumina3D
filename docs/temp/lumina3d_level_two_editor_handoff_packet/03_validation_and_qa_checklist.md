# Validation and QA Checklist

Run these after implementing the Level Two editor handoff.

## Required commands

```bash
npm run build
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-scene-smoke -- level_two --pretty
npm run tools:validate-missing-colliders -- level_two --pretty
npm run tools:validate-float-colliders -- level_two --pretty
```

## Source verification

Confirm the final source-backed values are present in the source or generated manifest/object output:

- `LEVEL_TWO_POINTS.blueButton` → `(15.25, 2.8, 13.25)`
- `LEVEL_TWO_POINTS.elephantEcho` → `(13.75, 9.5, -1.5)`
- `LEVEL_TWO_RED_BUTTONS['red-button-a']` → `(13.75, 9.34, -1.5)`
- `LEVEL_TWO_RED_PLATFORMS['red-elevator-a']` → `(12.25, 8.24, 0)`
- `LEVEL_TWO_RED_PLATFORMS['red-elevator-b']` → `(-0.75, 1, 12.25)`
- `LEVEL_TWO_PROPS[1]` / `forestTreeB.2` → z `-18.75`
- `LEVEL_TWO_PROPS[8]` / `forestRock.9` → `(12.75, 2.08, 11)`

## Manual / screenshot QA

Use the editor and/or gameplay viewport for a focused pass:

- Blue Button is reachable and not visually crowded by `forestRock.9`.
- Blue Ramp dormant flat blue platform is visible before activation.
- Blue Ramp activation reads as the dormant platform rising/transforming into the ramp.
- Elephant Echo and Red Button A share the same X/Z and look intentionally stacked/paired.
- Red Elevator A aligns with `level_two.terrain.red-elevator-a-top-connector.3`.
- Red Elevator B does not overlap `level_two.terrain.human-love-letter-route.4` during its rising motion.
- `forestTreeB.2` no longer collides with `level_two.terrain.elephant-totem-hill.3`.
- No new missing-collider or float-collider warnings appear for Level Two.

## Report format

When done, report:

1. Commands run and pass/fail result.
2. Any warnings from validators.
3. Any Level Two smoke-test failure details.
4. Any unresolved visual alignment risk.
5. Whether the Blue Ramp visual request was fully implemented or intentionally scoped down.
