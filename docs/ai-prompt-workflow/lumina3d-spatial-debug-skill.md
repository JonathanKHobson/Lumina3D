# Lumina3D Spatial Debug Skill

Use this as an AI skill/instruction document when fixing or diagnosing Lumina3D spatial bugs.

## When To Use

Use for:

- actor blocked too early or too late
- actor clipping into or passing through objects
- missing, shifted, or overbroad colliders
- walkable surface, ramp, bridge, platform, ledge, hill, or elevation bugs
- object facing/orientation bugs
- object placement/offset bugs
- trigger, proximity, dialogue, pickup, or prompt loops
- scene-start, restart, unlock, fixture, or actor-switch spatial state bugs
- "looks right but plays wrong" bugs

Do not use for narrative copy edits, unrelated UI styling, dependency upgrades, new editor work, MCP wrappers, or broad architecture refactors.

## Required Context Before Coding

Ask for or gather:

| Context | Why |
|---|---|
| Scene/level ID | Prevents edits to the wrong scene. |
| Actor involved | Human, Frog, Elephant, and future actors can have different radius and surface rules. |
| Observed and expected behavior | Keeps the fix tied to a visible failure. |
| Reproduction steps | Prevents fixing the wrong state. |
| `render_game_to_text()` output | Runtime source of truth. |
| Level manifest | Confirms scene identity, landmarks, fixtures, and mechanics. |
| Level object list | Provides stable IDs and compact spatial rows. |
| Screenshot/camera notes | Separates visual bugs from gameplay bugs. |
| Selected/nearby object IDs | Keeps patch scope narrow. |
| Prior bug pattern | Reuses lessons from `bug_report.md`. |
| Validation plan | Makes the fix testable. |

If the packet is missing a critical spatial fact, ask for that fact instead of guessing.

## Decision Tree

### Collision Bug

Use when the actor is blocked, clipping, or passing through something.

Check:

- Is the visible mesh solid but missing a collider?
- Is the collider too large, too small, shifted, or attached to the wrong anchor?
- Is actor radius/padding involved?
- Is this a static obstacle, walkable surface, barrier, or trigger zone?
- Does `tools:list-level-objects` show `collisionExpected`, `colliderLabel`, or related object metadata?

### Orientation Bug

Use when an object faces the wrong way.

Check:

- asset import orientation
- instance `rotationY`
- parent transform
- visual front vs gameplay forward
- degrees vs radians
- all instances vs one placed instance

### Positioning Bug

Use when an object is shifted, floating, embedded, or one tile off.

Check:

- local vs world transform
- grid coordinate vs world X/Z coordinate
- asset pivot/origin
- Y/elevation
- paired collider, trigger, or walkable proxy

### Trigger / Proximity Bug

Use when dialogue, prompts, pickups, or collection fire too often or not at all.

Check:

- one-shot vs repeated trigger
- enter/exit-zone state
- radius threshold
- active actor condition
- tutorial/scene phase gate
- cooldown/timer state

### Walkable Surface / Elevation Bug

Use when a ramp, ledge, bridge, hill, platform, elevator, or terrain top behaves incorrectly.

Check:

- bottom contact
- top contact
- slope or height function
- actor visual clearance
- side blocking
- unsupported edge exits
- transition between ground and surface states
- actor Y restoration after leaving the surface

### Scene-Flow / State Bug

Use when the bug appears after scene switch, restart, fixture jump, unlock, actor switch, or title/arrival flow.

Check:

- scene initialization
- reveal state
- active actor
- fixture support
- tutorial step state
- persistent unlock state
- reset/start ordering

## Diagnosis Checklist

Before proposing a patch, answer:

```txt
What exact level id is affected?
What exact actor is affected?
What object/collider/trigger/surface is likely involved?
Is the visible mesh wrong, the gameplay proxy wrong, or both?
Is the issue local to one scene or shared data?
Which prior bug pattern does this resemble?
What is the smallest safe change?
How will this be verified?
```

## Minimal-Fix Principles

- Fix the smallest data/code surface that explains the observed behavior.
- Prefer level-specific data over global constants unless the issue is proven global.
- Prefer explicit collider, surface, or trigger intent over relying on visuals.
- Preserve deterministic hooks such as `window.render_game_to_text()`.
- Preserve concise JSON CLI output.
- Preserve current gameplay unless the bug is specifically in gameplay behavior.
- Keep future AI prompts copy/pasteable.

## Never Do

- Do not guess object IDs or transforms.
- Do not invent physics-engine assumptions.
- Do not treat visual mesh presence as collision evidence.
- Do not patch a visual mesh when the collider/proxy is the bug.
- Do not patch a collider/proxy when the visual mesh/origin is the bug.
- Do not silently convert degrees/radians.
- Do not reduce global actor radius to hide a local collision issue.
- Do not change multiple scenes for one local bug unless shared cause is proven.
- Do not skip validation commands.
- Do not report unsupported fixtures as passing or failing.

## Expected Response Format

```md
## Diagnosis
Short diagnosis of the likely broken spatial layer.

## Evidence Used
Concrete context used: render text, manifest, object list, screenshot notes, source files.

## Minimal Fix Plan
Smallest likely change, with alternatives only if uncertainty remains.

## Files To Inspect/Edit
Only files directly relevant to the patch.

## Proposed Patch Strategy
Explain the data/code change without broad refactors.

## Verification Commands
Exact commands to run.

## Risks / Assumptions
Anything not verified, especially visual alignment or missing screenshot evidence.
```
