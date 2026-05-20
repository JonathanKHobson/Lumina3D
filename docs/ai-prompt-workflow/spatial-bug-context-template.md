# Spatial Bug Context Template

Copy this template before asking an AI assistant to fix a Lumina3D spatial bug.

````md
# Lumina3D Spatial Bug Context

## Bug type

Collision / walkable surface / orientation / positioning / trigger / scene-flow / visual polish

## Scene / level

- Scene ID:
- Level ID:
- How I got there:

Use current tooling IDs: `tutorial`, `home_intro`, `level_one`, `level_two`.

## Actor involved

Human / Frog / Elephant / other:

## Observed behavior

What happened exactly?

## Expected behavior

What should happen instead?

## Exact reproduction steps

1.
2.
3.

## Relevant object/entity IDs

Known IDs from `tools:list-level-objects`, Dev Editor export, source files, or visible context:

```txt
paste IDs here
```

## Runtime state: `window.render_game_to_text()`

Paste output here:

```json
{}
```

## Level manifest

Command:

```bash
npm run tools:get-level-manifest -- <level_id> --pretty
```

Output:

```json
{}
```

## Level object list

Command:

```bash
npm run tools:list-level-objects -- <level_id> --pretty
```

Output:

```json
{}
```

## Screenshot / visual notes

Describe what the screenshot shows. Include camera angle and what "left/right/front/back" means if relevant.

```txt
Example: In `home_intro`, the human appears to enter the house doorway about half a body width before an invisible blocker stops movement deeper inside.
```

## Nearby objects / colliders / triggers

List nearby objects and suspected gameplay proxies.

```txt
object id / collider label / trigger zone / surface id
```

## Prior bug pattern from `bug_report.md`

Choose one or more:

- Asset orientation/alignment drift
- Missing or weak scene collision
- Rapid dialogue/trigger loop
- Raised platform or ramp step-off stuck state
- Walkable slope proxy mismatch
- Home doorway collision
- Other:

## Constraints

- Do not change unrelated scenes.
- Do not change asset files unless explicitly necessary.
- Prefer narrow level-specific fix.
- Preserve current story/gameplay behavior.
- Do not require MCP or a new editor.

## Validation commands to run

```bash
npm run build
npm run tools:run-scene-smoke -- <level_id> --pretty
```

For collider/surface bugs, also consider:

```bash
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

## Requested AI output

Please respond with:

1. Diagnosis.
2. Evidence used.
3. Minimal fix plan.
4. Files to inspect/edit.
5. Proposed patch strategy.
6. Verification commands.
7. Risks/assumptions.

Do not code until you identify whether this is a visual mesh, collider, walkable proxy, trigger, orientation, or scene-flow problem.
````
