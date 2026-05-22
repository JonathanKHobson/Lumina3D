# Timeline / Solution Scrubber Research + Plan

## User intent

The editor currently shows everything in starting positions. Future versions should allow scrubbing through the intended level solution or animation sequence.

The user imagines a bottom timeline where dragging a playhead changes the level state:

- platforms move,
- buttons activate,
- objects appear/disappear,
- maybe characters/path solution states update,
- level changes reflect the intended one-solution path.

## Important design decision

Do not build a full runtime simulator first.

Start with a **preview timeline** that visualizes known scripted/solution states. This is safer than trying to run the actual playable game inside the editor.

## Recommended phases

### Phase 1 — Timeline data model only

Add a design doc and optional skeleton module:

```txt
src/editor/timeline/EditorTimelineModel.js
```

No visible UI required yet unless low-risk.

### Phase 2 — Read-only timeline strip

Add a bottom panel:

```txt
[ 0.0s ----------------------------- 12.0s ]
Play | Pause | Reset | Scrub
```

No object mutation yet except preview mode.

### Phase 3 — Platform/button preview

Support simple deterministic tracks:

```js
{
  id: "level_two.platform.red_elevator_a.position.y",
  objectId: "level_two.red_elevator_a",
  property: "position.y",
  keyframes: [
    { time: 0, value: 4.0 },
    { time: 3, value: 1.0 }
  ]
}
```

### Phase 4 — Solution sequence

Add events:

```js
{
  time: 2.5,
  type: "button.activate",
  actor: "elephant",
  targetId: "level_two.red_button_a"
}
```

### Phase 5 — Export AI context

When timeline is active, export:

```json
{
  "timeline": {
    "mode": "preview",
    "currentTime": 2.5,
    "duration": 12,
    "activeEvents": [],
    "visibleTracks": []
  }
}
```

## Suggested timeline model

```js
export const solutionTimeline = {
  id: "level_two.solution.default",
  levelId: "level_two",
  duration: 12,
  actors: ["frog", "elephant"],
  tracks: [
    {
      id: "red_elevator_a_y",
      objectId: "level_two.red_elevator_a",
      property: "position.y",
      keyframes: [
        { time: 0, value: 4 },
        { time: 3, value: 1 }
      ]
    }
  ],
  events: [
    {
      time: 2.5,
      type: "button.activate",
      targetId: "level_two.red_button_a"
    }
  ]
};
```

## Technical options

### Option A — Custom deterministic preview

Best for current Lumina3D.

Pros:
- simple,
- data-driven,
- AI-readable,
- no runtime simulation complexity.

Cons:
- may diverge from actual game logic if not maintained.

### Option B — Three.js AnimationMixer/AnimationClip

Useful for keyframed Object3D properties. Three.js has `AnimationClip`, `KeyframeTrack`, and `AnimationMixer` concepts.

Pros:
- built into Three.js,
- supports keyframed transform-like behavior,
- can theoretically scrub by setting time.

Cons:
- may be overkill for gameplay state,
- clips do not naturally represent puzzle causality,
- source mapping back to level data may be harder.

### Option C — Theatre.js

Theatre.js is a professional web animation/motion design toolset that can work with Three.js. It may be useful later, but adding it now would likely be too much.

Pros:
- powerful sequence editor,
- strong animation tooling.

Cons:
- new dependency and workflow,
- may distract from level-specific tooling,
- less directly tied to Lumina source data.

## Recommendation

For now, create only:

1. a timeline design doc,
2. a data model skeleton if helpful,
3. export shape planning,
4. perhaps a disabled/future “Timeline” tab placeholder.

Do not implement full playback until tile movement/filtering and asset catalog are stable.
