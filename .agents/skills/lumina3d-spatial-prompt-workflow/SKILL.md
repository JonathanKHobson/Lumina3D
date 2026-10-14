---
name: lumina3d-spatial-prompt-workflow
description: Use for Lumina3D local spatial bug workflows involving collision, walkable surfaces, ramps, orientation, positioning, triggers, level context, or scene-flow issues. Do not use for unrelated gameplay implementation or broad refactors.
---

# Lumina3D Spatial Prompt Workflow Skill

Use this skill when working locally in the Lumina3D project on a spatial bug, spatial-bug prompt workflow, or context packet review.

## When To Use

Use for tasks involving:

- Collision issues.
- Walkable surfaces, ramps, platforms, ledges, elevation, or actor Y/lift state.
- Object orientation or facing direction.
- Object positioning, alignment, or local/world/grid placement.
- Trigger/proximity loops.
- Scene-flow bugs where actor position, scene state, reveal state, or fixture state matters.
- Preparing or reviewing structured context before an AI spatial bug session.
- Testing whether the prompt workflow helps a real bug session.

## When Not To Use

Do not use this skill for:

- Broad gameplay feature implementation.
- Asset creation or asset sourcing.
- Full editor work.
- MCP/server/tooling architecture.
- Git merge, push, PR, or commit tasks.
- General refactors unrelated to a specific spatial issue.
- Changing runtime hooks, CLI behavior, or source-file writers for the sake of the workflow.

## Local-First Rule

Work from local files. Do not assume GitHub or any remote branch is current.

Before editing, inspect:

```bash
git status --short
git branch --show-current
```

Do not merge, push, open a PR, or commit unless the user explicitly asks.

## Read First

Read these if present:

```txt
AI_GAME_DEV.md
AGENTS.md
docs/ai-prompt-workflow/README.md
docs/ai-prompt-workflow/START_HERE_PROMPT.md
docs/ai-prompt-workflow/spatial-bug-context-template.md
docs/ai-prompt-workflow/context-packet-schema.md
docs/ai-prompt-workflow/verification-and-test-commands.md
bug_report.md
backlog.md
progress.md
```

## Context Collection Rule

Do not guess transforms, object IDs, collider labels, trigger names, surface IDs, actor radius/padding, or asset orientation from prose.

Ask for or gather structured context first:

- Bug type.
- Level ID.
- Actor involved.
- Observed and expected behavior.
- Exact reproduction steps.
- Relevant object/entity IDs if known.
- `window.render_game_to_text()` output when available.
- Level manifest output.
- Level object list output.
- Screenshot/visual notes.
- Nearby objects/colliders/triggers.
- Prior bug pattern.
- Constraints.
- Validation commands.

If critical context is missing, list the missing context before proposing code changes.

## Classification Rule

Before proposing a patch, classify the issue as one or more of:

- Visual mesh.
- Gameplay collider.
- Walkable proxy/surface.
- Trigger/proximity zone.
- Actor radius/padding.
- Scene-flow/state gate.
- Asset import orientation.
- Instance rotation/position.
- Parent transform.

## Minimal-Fix Rule

Prefer the smallest safe fix. Do not rewrite unrelated systems. Do not use a spatial bug as permission to refactor `src/main.js`, rebuild editor tooling, alter assets, or change unrelated scenes.

If out-of-scope local changes already exist, report them and avoid touching them.

## Parallel-Lane Rule

Runtime, gameplay, editor, level, scene, asset, and CLI changes may already exist locally from another lane. Report them clearly, but do not delete, revert, overwrite, or "clean up" that work unless the user explicitly asks.

## Verification Rule

Always list commands run or intentionally not run. For docs/skill-only work, prefer:

```bash
git diff --name-only
npm run build
npm run tools:list-levels -- --pretty
```

For spatial code fixes, use the level-specific commands from `references/verification-commands.md` and the repo docs.

Unsupported fixtures are valid outputs. Report them as unsupported with their reason or migration hint; do not count them as pass or fail.

## Output Format

Respond with:

```md
## Diagnosis
## Evidence Used
## Missing Context, if any
## Minimal Fix Plan
## Files To Inspect/Edit
## Proposed Patch Strategy
## Verification Commands
## Risks / Assumptions
```
