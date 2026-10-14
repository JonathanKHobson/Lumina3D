# Spatial Context Packet

Use this structure before diagnosing or coding Lumina3D spatial bugs.

```json
{
  "taskType": "collision | walkable-surface | orientation | positioning | trigger | scene-flow | visual-polish",
  "sceneId": "tutorial | home_intro | level_one | level_two | unknown",
  "levelId": "tutorial | home_intro | level_one | level_two | unknown",
  "actor": {
    "active": "human | frog | elephant | other | unknown",
    "position": { "x": null, "y": null, "z": null },
    "radius": null,
    "surfaceId": null,
    "facing": null
  },
  "observedBehavior": "",
  "expectedBehavior": "",
  "reproductionSteps": [],
  "renderGameToText": {},
  "levelManifest": {},
  "levelObjects": [],
  "selectedObject": {},
  "nearbyObjects": [],
  "colliderContext": {},
  "orientationContext": {},
  "surfaceContext": {},
  "triggerContext": {},
  "cameraOrScreenshotNotes": "",
  "relatedFiles": [],
  "priorBugPatterns": [],
  "constraints": [],
  "validationPlan": [],
  "openQuestions": []
}
```

## Required First Pass

If critical fields are empty, ask for them instead of guessing. At minimum, the bug report should include:

- Level ID.
- Actor involved.
- Observed behavior.
- Expected behavior.
- Reproduction steps.
- Either runtime evidence, object-list evidence, or an explicit statement that the evidence is missing.

## Current Level IDs

- `tutorial`
- `home_intro`
- `level_one`
- `level_two`
