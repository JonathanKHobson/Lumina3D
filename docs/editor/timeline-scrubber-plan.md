# Editor Timeline Scrubber Plan

The editor should eventually preview intended solution/animation state without
becoming the playable runtime. The current slice only adds an inactive data
model skeleton so future work has a stable shape.

## Future Model

```js
{
  schema: "lumina3d.editor.solutionTimeline.v1",
  levelId: "level_two",
  mode: "inactive",
  currentTime: 0,
  duration: 0,
  tracks: [
    {
      id: "level_two.red-elevator-a.track",
      ownerId: "level_two.red-elevator-a",
      label: "Red Elevator A",
      kind: "transform"
    }
  ],
  events: [
    {
      id: "event-001",
      time: 1.2,
      ownerId: "level_two.red-button-a",
      kind: "trigger",
      note: "Button press begins platform lift preview."
    }
  ]
}
```

## Boundaries

- The editor default remains static start-state view.
- Timeline playback should preview platform/button/trigger intent, not run full
  gameplay simulation.
- Timeline data belongs in editor state exports as context once a visible
  scrubber exists.
- Runtime button logic and collision behavior remain source-of-truth in the
  playable game.

## Next Slice

Add a compact bottom scrubber only after tile movement and object-list filtering
are stable. First useful preview target: Level Two red buttons and red elevator
positions over time.
