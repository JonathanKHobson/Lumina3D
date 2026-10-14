# AI Task Contract

Purpose: give future AI dev sessions a tight scope, proof requirements, and explicit out-of-scope boundaries before they touch Lumina3D.

Use this for gameplay, layout, scene-flow, visual QA, collision, asset, editor, or tooling tasks.

## Prompt Template

```md
# Lumina3D Task

## Goal
[One concrete deliverable.]

## Scope
Change only:
- [files or folders]

Do not change:
- [systems that are tempting but out of scope]

## Read first
- README.md
- AGENTS.md
- docs/project-map.md
- progress.md
- backlog.md
- bug_report.md
- relevant docs/tooling or docs/game-design-handbook files

## Source of truth
- `render_game_to_text()` for deterministic runtime state
- level manifest for object/fixture inventory
- object list for collider and mechanism metadata
- screenshot/probe evidence for visual/collision truth

## Acceptance
Must pass:
- `npm run build`
- `npm run tools:run-scene-smoke -- <level_id> --pretty`
- `npm run tools:validate-missing-colliders -- <level_id> --pretty`
- `npm run tools:validate-float-colliders -- <level_id> --pretty`

Visual/collision proof:
- screenshot QA: [shot ids or reason unavailable]
- probe paths: [probe ids or reason unavailable]

## Handoff
Report:
- files changed
- commands run
- screenshots/probes reviewed
- known gaps
- what not to touch next
```

## Required Out-Of-Scope List

Every task should explicitly name what it is not doing. Use these common exclusions when appropriate:

- no engine migration
- no Rapier or physics rewrite
- no full ECS rewrite
- no broad `src/main.js` refactor
- no collision/surface extraction unless that is the only task
- no scene-flow changes
- no active Level Two mechanic changes
- no asset path changes
- no direct browser/editor source writes
- no public-release license claims without ledger review

## Visual/Collision Bug Requirements

For invisible walls, clipping, ramp embedding, bridge/water confusion, ledge exits, or platform edge bugs, require:

- level id
- actor
- reproduction steps
- expected route
- `render_game_to_text()` output or fixture state
- level manifest
- level object list
- missing/float collider validator output
- screenshot notes or screenshot path
- route probe output when available

If route-probe tooling is missing, the AI should propose the smallest route-probe script or manual probe plan before making a speculative patch.

## Done Criteria

The task is done when:

- the intended behavior works
- verification commands pass or unrun commands are explained
- visual/collision proof is reviewed when relevant
- unrelated dirty files are left alone
- the handoff names the next single safe slice

