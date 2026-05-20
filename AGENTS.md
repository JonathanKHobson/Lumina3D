# Lumina3D Agent Guide

## First Read

Start here before making project changes:

1. `README.md`
2. `docs/project-map.md`
3. `docs/refactor-plan.md`
4. `docs/tooling/overview.md`
5. `docs/tooling/context.md`
6. `docs/game-design-handbook/00_overview.md`

For Level Two work, also read:

- `docs/game-design-handbook/05_level_two_design_scope.md`
- `docs/game-design-handbook/08_level_two_asset_plan.md`
- `docs/game-design-handbook/09_level_two_smoke_tests.md`

## Current Structure Rule

Lumina3D is an expandable Vite + Three.js browser game, not a one-file
prototype. The completed refactor pass reduced `src/main.js` substantially, but
`src/main.js` is still the main bottleneck and remains large. Treat it as legacy
orchestration and glue, not as the destination for new systems.

Before creating or expanding project files, use the `project-structure-architect`
skill. Do not add new feature-specific gameplay systems to `src/main.js` unless
there is no smaller safe boundary for the current slice. Prefer existing module
lanes:

- `src/config/` for registries, constants, and scene IDs.
- `src/content/` for story text, Love Letter data, and dialogue.
- `src/levels/` for level layout data.
- `src/scenes/` for scene builders and scene-flow shells.
- `src/systems/` for gameplay systems.
- `src/core/` for renderer, asset, mesh, grid, and low-level helpers.
- `src/state/` for state factories and persistence.
- `src/ui/` for DOM/HUD wiring.
- `src/debug/` for dev tools and test hooks.

## Coordination Rules

- Run `git status --short` before editing.
- If another agent is actively changing source, prefer docs or a narrow
  non-conflicting file. Do not overwrite live work.
- Ignore `._*`, `.DS_Store`, `node_modules/`, `dist/`, `test-output/`, and
  `.git/` as source.
- Do not combine collision/surface refactors, scene-flow refactors, and active
  Level Two mechanics in the same pass.
- Do not change asset paths casually. Vite serves assets from `public/assets/`,
  and `src/config/assets.js` is the canonical asset registry.
- Keep generated, cached, and smoke-test output out of source/docs unless the
  task explicitly asks for an artifact.

## Supporting Skills And Plugins

Use these local skills/plugins as project context, not as extra scope:

- `project-structure-architect`: structure, project maps, staged refactors, and
  anti-monolith guardrails.
- `develop-web-game`: browser-game implementation plus Playwright smoke and
  screenshot review loop.
- `game-designer`: mechanics, level design, Cubeling abilities, progression,
  tutorial pacing, and playtest hypotheses.
- Game Studio plugin: `game-studio`, `web-game-foundations`,
  `three-webgl-game`, `web-3d-asset-pipeline`, `game-ui-frontend`, and
  `game-playtest`.
- `frontend-ux`: HUD, overlays, accessibility, responsive UI, and visual state.
- `ux-writer`: tutorial hints, button labels, modal copy, and player-facing text.
- `communication-story-crafter`: public portfolio framing, devlogs, and handoff
  notes after the playable slice works.

## Verification Defaults

For docs-only changes, verify with:

- `git diff --name-only`
- targeted `rg` checks for the new guidance terms

For game/code changes, prefer the smallest relevant checks first:

- `npm run build`
- `npm run tools:list-levels -- --pretty`
- `npm run tools:get-level-manifest -- level_two --pretty`
- `npm run tools:run-scene-smoke -- level_two --pretty`
- `npm run tools:validate-missing-colliders -- level_two --pretty`
- `npm run tools:validate-float-colliders -- level_two --pretty`

For visual, UI, scene-flow, asset, or interaction changes, also run the
`develop-web-game` or Game Studio playtest loop and inspect screenshots before
calling the work done.
