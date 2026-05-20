# Lumina3D AI Prompt Workflow

This workflow helps future AI sessions fix small spatial bugs without guessing. It is documentation and prompt guidance only. It does not add a new editor, MCP wrapper, runtime feature, or gameplay system.

Use it for collision, orientation, positioning, trigger, walkable-surface, ramp, platform, ledge, and scene-context bugs.

## Workflow

1. User observes a spatial bug.
2. User captures context using:
   - `window.render_game_to_text()`
   - level manifest CLI output
   - level object list CLI output
   - screenshot or camera notes
   - relevant `bug_report.md`, `backlog.md`, or `progress.md` notes
3. User fills `spatial-bug-context-template.md` or a JSON-like packet from `context-packet-schema.md`.
4. AI diagnoses with `lumina3d-spatial-debug-skill.md`.
5. AI proposes a minimal patch and exact verification commands.
6. Developer verifies with build, smoke tests, fixtures, and collider validators as appropriate.

## Start Here

For any AI assistant:

1. Read `AI_GAME_DEV.md`.
2. Read the workflow file that matches the bug:
   - `collision-prompt-workflow.md`
   - `orientation-positioning-prompt-workflow.md`
   - `lumina3d-spatial-debug-skill.md`
3. Ask for missing structured context before coding.

## Level IDs

Use current tooling IDs:

| Human name | Tooling level id |
|---|---|
| Tutorial | `tutorial` |
| Home Intro / Home scene | `home_intro` |
| Level One | `level_one` |
| Level Two | `level_two` |

Do not use `home` in CLI commands unless the tooling catalog changes.

## Evidence Commands

```bash
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:list-level-objects -- <level_id> --pretty
```

For collider or surface bugs:

```bash
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

For changed scenes:

```bash
npm run build
npm run tools:run-scene-smoke -- <level_id> --pretty
```

Use existing `node test-output/.../smoke.mjs` files only when they cover the changed scene or behavior.

## Good Prompt Shape

````md
Use `AI_GAME_DEV.md` and the Lumina3D spatial debug skill.

Here is the structured context packet:

```json
PASTE_PACKET_HERE
```

Do not guess missing transforms, object IDs, collider labels, or asset orientation. If critical context is missing, list exactly what is missing before proposing a patch.
````

## Non-Goals

- Do not build a full dev editor.
- Do not require MCP.
- Do not change CLI script behavior.
- Do not change gameplay mechanics while preparing a prompt packet.
- Do not eyeball spatial bugs without structured context.
