# Prompt Workflow Test Log

Use this file to record whether the Lumina3D prompt workflow actually improves spatial bug sessions. The point is to test the workflow on real bugs, not to keep expanding documentation.

## Test Template

````md
## Test 000 - Short name

Date:
Local branch:
AI assistant used:
Bug type:
Level ID:
Template used:
Context packet complete? yes/no

### Bug Summary

Observed:
Expected:

### Context Provided

- `window.render_game_to_text()` provided? yes/no
- Level manifest provided? yes/no
- Level object list provided? yes/no
- Screenshot/visual notes provided? yes/no
- Relevant object IDs known? yes/no
- Prior bug pattern identified? yes/no
- Constraints listed? yes/no
- Validation plan included? yes/no

### AI Behavior

- Asked for missing context instead of guessing? yes/no
- Classified the bug correctly? yes/no/unclear
- Separated visual mesh/collider/walkable proxy/trigger/state? yes/no
- Proposed a narrow fix? yes/no
- Listed files to inspect/edit? yes/no
- Listed validation commands? yes/no
- Avoided unrelated refactors? yes/no
- Respected local Git/no-push/no-commit boundaries? yes/no

### Outcome

Accepted / partially accepted / rejected / not tested

### Commands Run

```bash
paste commands here
```

### Notes For Improving The Workflow

-
````

## First Real Bug Candidates

- Home doorway collision in `home_intro`.
- Level Two ramp / walkable surface issue in `level_two`.
- Asset orientation drift.
- Trigger/proximity loop.
- Missing collision proxy.

## Success Signals

- The AI asks for missing context instead of guessing.
- The AI classifies the problem as visual mesh, collider, walkable proxy, trigger/proximity, actor radius/padding, or scene-flow/state.
- The AI proposes a narrow fix.
- The AI lists exact validation commands.
- The AI does not rewrite unrelated systems.
