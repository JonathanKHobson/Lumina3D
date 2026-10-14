# Verification And Test Commands

Use this file to choose validation commands for Lumina3D prompt-driven fixes.

## Always Run After Repo Changes

```bash
npm run build
```

## Tooling Context Commands

Use these before a spatial fix to gather AI-ready context:

```bash
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:list-level-objects -- <level_id> --pretty
```

Valid current level IDs include:

```txt
tutorial
home_intro
level_one
level_two
```

## Smoke And Fixture Commands

Use after scene, mechanics, trigger, or surface changes:

```bash
npm run tools:run-scene-smoke -- <level_id> --pretty
npm run tools:run-fixture -- <level_id> <fixture_id> --pretty
```

If a fixture returns `status: "unsupported"`, do not treat it as pass/fail. Record the reason and migration hint.

## Collision Validator Commands

Use for collision, walkable surface, ramp, platform, obstacle, large scene object, or elevation changes:

```bash
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

## Existing Test-Output Smoke Files

When relevant and present, use existing smoke files under `test-output/`, such as:

```bash
node test-output/home-level-one/smoke.mjs
node test-output/level-two-shell/smoke.mjs
node test-output/level-two-frog-totem/smoke.mjs
node test-output/level-two-ramp-access/smoke.mjs
node test-output/level-two-red-prototype/smoke.mjs
```

Use these only when the changed scene/behavior is covered by the smoke file.

## Validation Matrix

| Change type | Minimum validation |
|---|---|
| Docs-only prompt package | `git diff --name-only`, targeted `rg`, `tools:list-levels`, `npm run build`. |
| Collision change | Build, object list, scene smoke, missing/float collider validators. |
| Walkable ramp/platform change | Build, manifest, object list, scene smoke, float collider validator, relevant fixture/smoke. |
| Orientation-only visual placement | Build, object list, screenshot/manual visual verification. |
| Trigger/proximity change | Build, scene smoke, fixture if available, enter/exit behavior notes. |
| Scene-flow change | Build, scene smoke, relevant fixture or `test-output` smoke. |

## Evidence Requirements For AI Responses

Future AI assistants should report:

```txt
Commands run:
Results:
Files changed:
Context used:
Assumptions/unverified visual checks:
```

Do not accept "looks fixed" without at least a build and the relevant context/test evidence.
