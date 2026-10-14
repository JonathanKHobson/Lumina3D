# Verification Commands

## Docs / Skill-Only Changes

```bash
git diff --name-only
npm run build
npm run tools:list-levels -- --pretty
```

## Context Commands Before Spatial Fixes

```bash
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:list-level-objects -- <level_id> --pretty
```

## Scene Smoke

```bash
npm run tools:run-scene-smoke -- <level_id> --pretty
```

## Fixture

```bash
npm run tools:run-fixture -- <level_id> <fixture_id> --pretty
```

If a fixture is unsupported, report it as unsupported. Do not count it as pass or fail.

## Collider / Walkable Surface Validators

```bash
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

## Existing Smoke Files

Use `node test-output/.../smoke.mjs` files only when they cover the changed scene or behavior. Do not run broad smoke suites for docs-only work.
