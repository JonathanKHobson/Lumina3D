# Implementation Acceptance Checklist

Use this checklist to decide whether the prompt workflow package is ready.

## Files

- [ ] `AI_GAME_DEV.md` exists at repo root.
- [ ] `docs/ai-prompt-workflow/README.md` exists.
- [ ] `docs/ai-prompt-workflow/lumina3d-spatial-debug-skill.md` exists.
- [ ] `docs/ai-prompt-workflow/spatial-bug-context-template.md` exists.
- [ ] `docs/ai-prompt-workflow/context-packet-schema.md` exists.
- [ ] `docs/ai-prompt-workflow/collision-prompt-workflow.md` exists.
- [ ] `docs/ai-prompt-workflow/orientation-positioning-prompt-workflow.md` exists.
- [ ] `docs/ai-prompt-workflow/verification-and-test-commands.md` exists.
- [ ] `docs/ai-prompt-workflow/example-prompts.md` exists.
- [ ] `docs/ai-prompt-workflow/implementation-acceptance-checklist.md` exists.

## Accuracy

- [ ] Docs identify Lumina3D as Vite + Three.js.
- [ ] Docs describe X/Z as ground plane and Y as vertical.
- [ ] Docs warn that source rotations are radians unless explicitly documented otherwise.
- [ ] Docs mention custom collision helpers/proxies rather than assuming a physics engine.
- [ ] Docs reference `window.render_game_to_text()` as deterministic source-of-truth evidence.
- [ ] Docs reference existing CLI tools accurately.
- [ ] Docs use `home_intro` for Home Intro CLI examples.
- [ ] Docs include current recurring bug patterns from `bug_report.md`.

## Usability

- [ ] Spatial bug template is copy/paste usable.
- [ ] Context packet schema is structured enough for future automation but does not require automation.
- [ ] Collision workflow separates visual mesh, gameplay collider, walkable proxy, trigger zone, and actor radius/padding.
- [ ] Orientation workflow separates asset import orientation, instance rotation, parent transform, gameplay facing, and companion objects.
- [ ] Example prompts are specific to real Lumina3D issues.
- [ ] Instructions are practical, short-sectioned, and not academic.

## Scope

- [ ] No gameplay mechanics changed.
- [ ] No asset files changed.
- [ ] No full dev editor added.
- [ ] No MCP wrapper added.
- [ ] No broad runtime refactor added.
- [ ] No existing CLI script behavior changed.
- [ ] Optional `.github/copilot-instructions.md`, if added, is short and points to these docs rather than duplicating them.

## Verification

- [ ] `git diff --name-only` was reviewed.
- [ ] Targeted `rg` checks confirm required guidance terms are present.
- [ ] `npm run tools:list-levels -- --pretty` confirms level IDs.
- [ ] `npm run build` passes.
- [ ] Any unrun commands are explicitly listed with reason.
- [ ] Final handoff explains how to use the prompt workflow.
