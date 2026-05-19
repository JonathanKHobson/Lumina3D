# MCP Readiness Notes

## Why MCP stays deferred

Current scripts now provide deterministic, compact outputs and explicit unsupported contracts.
That is enough for stable gameplay-targeted usage without adding the MCP wrapper yet.

## Current MCP candidate tools

- `tools:list-levels`
- `tools:get-level-manifest`
- `tools:list-level-objects`
- `tools:run-scene-smoke`
- `tools:run-fixture`
- `tools:validate-missing-colliders`
- `tools:validate-float-colliders`

## Exit criteria for MCP wrapper

- No fixture schema churn for implemented fixtures.
- Stable pass/fail shape across repeated runs:
  - `ok`, `command`, `levelId`, `checked/missing/suspicious` for validators
  - `status` + `migrationHint` for fixtures
- Fixture policy is explicit and documented (implemented vs unsupported-by-default).

## Current fixture notes

- Implemented: `level_two_start`, `level_two_love_letter_ready`
- Unsupported: `level_two_elephant_unlock_test`, `level_two_red_button_test`, `level_two_recall_test`, `level_two_elevator_test`
- Unsupported fixtures must stay explicit and non-green.

## Near-term MCP-facing contract goals

- Keep manifest/fixture shape stable (`ok`, `command`, `levelId`, `fixtureId`, `status`, `reason`, `migrationHint`, `stepResults[]`) so future MCP tooling can call scripts with low parsing overhead.
- Preserve the unsupported fixture contract until deterministic hooks are added; this is intentional, not incomplete.
