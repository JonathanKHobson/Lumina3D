# Tooling Progress

## Current Status (Stabilization Pass)

### Slice 1 — Foundation & catalog

- [x] Added shared catalog in `scripts/lib/levelCatalog.js` for `tutorial`, `home_intro`, `level_one`, `level_two`.
- [x] Added shared CLI helpers in `scripts/lib/cli-utils.js`.
- [x] Added scripts: `list-levels.js`, `get-level-manifest.js`, `list-level-objects.js`.
- [x] Enabled `--help` and usage text on script entry points.

### Slice 2 — Deterministic scene runners

- [x] Added `run-scene-smoke` with direct debug-key level jumps (except `tutorial`).
- [x] Added `run-fixture` with implemented fixtures:
  - `level_two_start`
  - `level_two_love_letter_ready`
- [x] Added unsupported fixture handling in `run-fixture` and metadata with migration hints.

### Slice 3 — Collider validators

- [x] Added `validate-missing-colliders`.
- [x] Added `validate-float-colliders`.
- [x] Both return `{ checked, missing, suspicious, issueCount, issues[] }`.
- [x] Both return non-zero exit status when findings are detected.

## Current level-two fixture matrix

### Implemented
- `level_two_start`
- `level_two_love_letter_ready`

### Planned (explicitly unsupported today)
- `level_two_elephant_unlock_test`
- `level_two_red_button_test`
- `level_two_recall_test`
- `level_two_elevator_test`

## NPM scripts in `package.json`

- [x] `tools:list-levels`
- [x] `tools:get-level-manifest`
- [x] `tools:list-level-objects`
- [x] `tools:run-scene-smoke`
- [x] `tools:run-fixture`
- [x] `tools:validate-missing-colliders`
- [x] `tools:validate-float-colliders`

## Handoff checks status

- `npm run tools:list-levels -- --pretty` — pass
- `npm run tools:get-level-manifest -- level_two --pretty` — pass
- `npm run tools:list-level-objects -- level_two --pretty` — pass
- `npm run tools:run-scene-smoke -- level_two --pretty` — pass
- `npm run tools:run-fixture -- level_two level_two_start --pretty` — pass
- `npm run tools:validate-missing-colliders -- level_two --pretty` — pass
- `npm run tools:validate-float-colliders -- level_two --pretty` — pass

## Output review (for handoff)

- Useful and compact:
  - `list-levels` (small level matrix)
  - `run-scene-smoke` (phase/invariant summary)
  - `run-fixture` (step-level result)
  - validators when no issues (compact counters + samples)
- Acceptable but larger:
  - `get-level-manifest` (contains manifest detail, still bounded)
  - `list-level-objects` (full object rows; useful before object-level edits)
- Too noisy if left in long run:
  - `list-level-objects` on very large levels (consider narrowing use to objects after manifest diff)
  - previous validator collider-label dumps were verbose; now constrained to fixed sample + truncation metadata
