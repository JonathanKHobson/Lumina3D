# Example Prompts For Lumina3D Spatial Bugs

Use these examples as copy/paste starting points. Replace placeholders with current structured context.

## 1. Home House Doorway Collision

````md
Use `AI_GAME_DEV.md` and the Lumina3D spatial debug skill.

I need a narrow collision fix for the Home Intro scene.

## Observed

The human can partially step into the house doorway/interior before an invisible blocker stops movement deeper inside.

## Expected

The human should not be able to enter the house doorway/interior, but the Home note must remain reachable outside.

## Context

- Scene/level: `home_intro`
- Actor: human
- Prior bug pattern: Missing or weak scene collision; Home doorway collision

## Evidence

Paste:

- `window.render_game_to_text()` output
- `npm run tools:get-level-manifest -- home_intro --pretty`
- `npm run tools:list-level-objects -- home_intro --pretty`
- screenshot notes showing how far the actor enters the doorway

## Constraints

- Do not alter unrelated Home intro flow.
- Prefer house collider/proxy adjustment over asset edits unless asset origin/orientation is proven wrong.
- Preserve note reachability.

## Required output

Respond with Diagnosis, Evidence Used, Minimal Fix Plan, Files To Inspect/Edit, Proposed Patch Strategy, Verification Commands, Risks/Assumptions.
````

## 2. Level Two Blue Ramp / Walkable-Surface Visual Embedding

````md
Use `AI_GAME_DEV.md` and the Lumina3D spatial debug skill.

I need a narrow walkable-surface/ramp diagnosis for Level Two.

## Observed

The blue ramp/walkable surface appears visually embedded or causes actor visual clearance problems.

## Expected

The actor should contact the ramp bottom/top cleanly, stay visually above the surface, and not get stuck on ramp entry/exit.

## Context

- Scene/level: `level_two`
- Actor: [human/frog]
- Prior bug patterns: Raised platform step-off stuck state; walkable slope proxy mismatch

## Evidence

Paste:

- `window.render_game_to_text()` output near ramp
- `npm run tools:get-level-manifest -- level_two --pretty`
- `npm run tools:list-level-objects -- level_two --pretty`
- `npm run tools:validate-float-colliders -- level_two --pretty`
- screenshot notes

## Constraints

- Do not introduce new Level Two mechanics.
- Preserve existing blue-button/ramp gameplay.
- Prefer a walkable-surface contract fix: bottom contact, top contact, slope height function, side blocking, actor visual clearance.

## Required output

Respond with Diagnosis, Evidence Used, Minimal Fix Plan, Files To Inspect/Edit, Proposed Patch Strategy, Verification Commands, Risks/Assumptions.
````

## 3. Asset Orientation / Alignment Drift

````md
Use `AI_GAME_DEV.md` and the orientation-positioning workflow.

An asset appears to face the wrong direction or is aligned incorrectly.

## Object

- ID:
- Scene/level:
- Asset key/path:

## Observed

[Describe facing/placement from screenshot. Define camera angle and world direction if known.]

## Expected

[Describe desired facing/placement.]

## Evidence

Paste the relevant row from:

```bash
npm run tools:list-level-objects -- <level_id> --pretty
```

Also paste screenshot notes and any render text.

## Constraints

- Do not change all instances unless this is an asset import orientation issue.
- If only one placed instance is wrong, adjust instance data only.
- State rotations in radians and degrees if changed.
- Check whether collider/trigger/walkable proxy must move with the visual mesh.

## Required output

Classify as asset-level, instance-level, parent-transform, or gameplay-facing issue before proposing a patch.
````

## 4. Trigger Fires Repeatedly While Actor Remains Inside Zone

````md
Use `AI_GAME_DEV.md` and the Lumina3D spatial debug skill.

A trigger/proximity interaction fires repeatedly while the actor remains inside a zone.

## Observed

[Prompt/dialogue/collection behavior repeats continuously or too often.]

## Expected

[Should fire once on enter, respect cooldown, or wait for exit/re-entry.]

## Context

- Scene/level:
- Actor:
- Trigger/interaction name if known:
- Prior bug pattern: Rapid dialogue/trigger loop

## Evidence

Paste:

- `window.render_game_to_text()` output before/after entering zone
- relevant manifest/object rows if available
- source file names if known

## Constraints

- Prefer enter/exit-zone state or cooldown fix.
- Do not globally suppress prompts.
- Preserve intended tutorial/scene gates.

## Required output

Identify whether this is radius, active actor, scene step, cooldown, or enter/exit state before coding.
````

## 5. Generic Prompt With Context Packet

````md
Use the Lumina3D AI game dev instructions and spatial debug skill.

I am providing a structured context packet. Do not guess missing spatial facts. If critical context is missing, list exactly what is missing before proposing a patch.

## Context packet

```json
PASTE_CONTEXT_PACKET_HERE
```

## Required output

1. Diagnosis
2. Evidence Used
3. Minimal Fix Plan
4. Files To Inspect/Edit
5. Proposed Patch Strategy
6. Verification Commands
7. Risks / Assumptions

Keep the fix narrow and repo-specific. Do not require MCP, a new editor, or a broad runtime refactor.
````
