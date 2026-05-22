# START HERE Prompt

Use this copy/paste prompt at the start of a future Lumina3D spatial bug session.

````md
You are helping with a Lumina3D spatial bug in my local project files.

Work from local files. Do not assume GitHub or any remote branch is current. Do not merge, push, open a PR, or commit unless I explicitly ask.

Read and follow:

1. `AI_GAME_DEV.md`
2. `docs/ai-prompt-workflow/README.md`
3. `docs/ai-prompt-workflow/lumina3d-spatial-debug-skill.md`
4. `docs/ai-prompt-workflow/spatial-bug-context-template.md`
5. `docs/ai-prompt-workflow/context-packet-schema.md`
6. `docs/ai-prompt-workflow/verification-and-test-commands.md`

Before coding:

- Run or inspect `git status --short` and `git branch --show-current`.
- Report any changed runtime, editor, level, scene, asset, or CLI files as parallel-lane work. Do not alter them unless this bug requires it and I explicitly approve that scope.
- Do not guess transforms, object IDs, collider labels, trigger names, surface IDs, actor radius/padding, or asset orientation from prose.
- Classify the bug as one or more of: visual mesh, gameplay collider, walkable proxy/surface, trigger/proximity zone, actor radius/padding, scene-flow/state, asset import orientation, instance transform, or parent transform.
- If critical structured context is missing, ask for that context before proposing code changes.
- Keep the proposed fix narrow and list exact validation commands.

Use this response format:

## Diagnosis
## Evidence Used
## Missing Context, if any
## Minimal Fix Plan
## Files To Inspect/Edit
## Proposed Patch Strategy
## Verification Commands
## Risks / Assumptions
````

## Suggested First Workflow Test

Use the Home doorway collision or Level Two ramp/walkable-surface issue as the first real trial. Paste a filled context packet, ask the AI not to code yet, and check whether it asks for missing facts instead of guessing.
