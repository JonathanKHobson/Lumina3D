# Orientation And Positioning Prompt Workflow

Use this workflow when a Lumina3D object is facing the wrong way, shifted, floating, embedded, rotated incorrectly, or placed in the wrong scene position.

## Coordinate Reminder

- X/Z are ground-plane axes.
- Y is vertical/elevation.
- Default tile size is `2.0` unless a level says otherwise.
- Source rotations are radians unless explicitly documented as degrees.
- If the user describes degrees, convert deliberately and state the radian value.

## Orientation Layers

| Layer | Meaning | Common failure |
|---|---|---|
| Asset import orientation | OBJ/MTL/GLB model's inherent forward/up/origin. | All instances face wrong direction. |
| Instance rotation | Rotation applied when a specific object is placed. | One placed object faces wrong direction. |
| Parent transform | Transform inherited from a group/root. | Child appears wrong even though child rotation seems right. |
| Gameplay-facing direction | Direction used by movement/interactions. | Visual faces one way, logic treats another as forward. |
| Collider/trigger companion | Paired gameplay proxy that may need matching orientation. | Visual rotates but collider/trigger does not. |

## Positioning Layers

| Layer | Meaning | Common failure |
|---|---|---|
| Grid coordinate | Level-design coordinate. | Object appears one tile off. |
| World X/Z coordinate | Three.js placement on ground plane. | Wrong conversion from grid. |
| Y/elevation | Vertical placement. | Object floats or is embedded. |
| Pivot/origin | Asset local origin. | Mesh appears offset from intended anchor. |
| Parent transform | Group-level offset. | Children inherit hidden shift. |
| Collider/trigger/walkable proxy | Gameplay object paired with visual mesh. | Visual moves but gameplay proxy stays behind. |

## Required Context

Ask for:

- level id
- object ID from `tools:list-level-objects`
- asset key/path if known
- observed facing or placement
- expected facing or placement
- screenshot/camera notes
- `render_game_to_text()` output when relevant
- nearby collider/trigger/walkable proxy IDs
- whether one instance or all instances are affected

If the user says "left", "right", "front", or "back", ask for camera/world-axis context unless it is obvious from a screenshot.

## Template: Object Facing Wrong Way

````md
# Lumina3D Orientation Fix Request

Use `AI_GAME_DEV.md` and the orientation/positioning workflow.

## Object

- ID:
- Scene/level:
- Asset key/path if known:

## Observed

The object visually faces:

## Expected

The object should visually face:

## Evidence

### list-level-objects row

```json
{}
```

### visual notes / screenshot notes

```txt
Describe camera angle and what "forward" means.
```

## Constraints

- Do not change all instances unless this is proven to be an asset import orientation issue.
- If only one placed object is wrong, adjust instance data only.
- Convert degrees to radians explicitly.
- Check if any collider/trigger orientation must move with the visual object.

## Required AI output

1. Decide asset-level vs instance-level vs parent-transform issue.
2. State rotation in radians and degrees if changed.
3. Name files to inspect/edit.
4. Give validation commands.
5. List assumptions.
````

## Template: Object In Wrong Spot

````md
# Lumina3D Positioning Fix Request

Use `AI_GAME_DEV.md` and the orientation/positioning workflow.

## Object

- ID:
- Scene/level:
- Asset key/path if known:

## Observed

Where is it now?

## Expected

Where should it be?

## Evidence

### render_game_to_text

```json
{}
```

### level object list

```json
{}
```

### visual notes

```txt
Include nearby anchors, tiles, actors, colliders, triggers, and camera angle.
```

## Constraints

- Do not move unrelated scene objects.
- If moving a visual mesh, check if collider/trigger/walkable proxy must move too.
- If moving a collider, check if visual mesh should stay unchanged.
- Preserve scene flow and collectible reachability.

## Required AI output

1. Identify visual vs gameplay layer.
2. State exact expected coordinate change or data strategy.
3. Name files to inspect/edit.
4. Give validation commands.
5. List assumptions.
````

## Red Flags

Ask for more context if:

- no object ID is known
- only a vague screenshot description is available
- camera-relative language is used without camera angle
- a collider/trigger companion exists but only the visual mesh is described
- requested rotation is in degrees but source uses radians
- the issue could be asset origin/pivot rather than actual position
