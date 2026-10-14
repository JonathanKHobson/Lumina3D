# Collision Prompt Workflow

Use this workflow for Lumina3D collision and surface bugs. Diagnose the data/proxy/context problem before changing code.

## Core Distinctions

| Layer | Meaning | Common failure |
|---|---|---|
| Visual mesh | What the player sees. | Looks solid but has no gameplay blocker. |
| Gameplay collider | What blocks actor movement. | Missing, shifted, too large, too small, or attached to the wrong anchor. |
| Walkable proxy | What actor can stand or walk on. | Platform/ramp exists visually but surface state or height is wrong. |
| Trigger/proximity zone | What starts dialogue, collection, prompts, or scene flow. | Fires repeatedly, too early, too late, or at wrong radius. |
| Actor radius/padding | Actor movement footprint used by custom collision helpers. | Actor clips through tight gaps or is blocked too early. |

Lumina3D uses custom collision helpers/proxies. Do not assume a physics engine.

## Required Context

Before coding, gather:

```txt
level id
actor involved
observed blocked/clipping/passing-through behavior
expected behavior
reproduction steps
render_game_to_text output
tools:get-level-manifest output
tools:list-level-objects output
nearby collider labels and object IDs
screenshot notes
prior bug_report.md pattern
validation plan
```

## Collision Diagnosis Checklist

Answer these before proposing a patch:

```txt
Which actor is affected?
Which level id is affected?
Is the actor blocked, clipping, or passing through?
Is this visual mesh, collider, walkable proxy, trigger, or actor radius?
Which object IDs are nearby?
Does the object list mark collisionExpected or colliderLabel?
Does render_game_to_text show actor position/surface/collider state?
Is the issue local to one scene?
Does it resemble a known bug_report.md pattern?
What is the smallest safe change?
```

## Large Solid Object Rule

Every large object that reads as solid should have explicit collision intent. For buildings, walls, rocks, tree clusters, terrain blockers, barriers, and platforms, future prompts should ask:

- Is the visual object meant to block movement?
- Which collider label owns that blocking?
- Is there a separate trigger zone nearby?
- Should the actor ever enter the visual footprint?
- Is the object decorative, solid, walkable, or interactive?

## Walkable Surface Rule

Every walkable platform, bridge, ramp, hill, elevator, or ledge needs a walkable-surface contract:

- bottom contact
- top contact
- valid approach side
- side blocking
- actor visual clearance
- actor Y/elevation update
- unsupported edge behavior
- exit/step-off behavior

## Prompt Template: Collision Fix

````md
# Lumina3D Collision Fix Request

Use `AI_GAME_DEV.md` and `docs/ai-prompt-workflow/lumina3d-spatial-debug-skill.md`.

## Bug

[Observed behavior]

## Expected

[Expected behavior]

## Scene/level

[Use tooling id: tutorial, home_intro, level_one, or level_two]

## Actor

[human/frog/elephant/other]

## Evidence

### render_game_to_text

```json
{}
```

### level manifest

```json
{}
```

### level object list

```json
{}
```

### visual notes

```txt
Describe screenshot/camera notes here.
```

## Constraints

- Do not change unrelated scenes.
- Prefer narrow collider/proxy/data fix.
- Do not adjust global actor radius unless proven necessary.
- Keep visual mesh and gameplay collision separate.
- Do not require a new editor or MCP wrapper.

## Required output

1. Diagnose visual mesh vs collider vs surface vs trigger.
2. Name the exact files to inspect/edit.
3. Propose the smallest safe patch.
4. Provide verification commands.
5. State assumptions.
````

## Validation Commands

```bash
npm run build
npm run tools:list-level-objects -- <level_id> --pretty
npm run tools:run-scene-smoke -- <level_id> --pretty
npm run tools:validate-missing-colliders -- <level_id> --pretty
npm run tools:validate-float-colliders -- <level_id> --pretty
```

Use relevant `node test-output/.../smoke.mjs` files when they cover the changed behavior.

## Anti-Patterns

Do not accept fixes that:

- move unrelated objects to hide a collider bug
- reduce actor radius globally without evidence
- make collision depend on camera view
- ignore visual mesh vs collider distinction
- move a visual mesh but leave its collider/trigger companion behind
- change multiple scenes for one local bug
- skip validation because the fix "seems obvious"
