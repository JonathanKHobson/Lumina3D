# Lumina3D AI Context Packet Schema

This schema is for manual paste workflows, future copy buttons, or future AI forms. It does not require automation, MCP, or a new editor.

## Schema

```json
{
  "schemaVersion": "lumina3d-ai-context-v1",
  "taskType": "collision | walkable-surface | orientation | positioning | trigger | scene-flow | visual-polish",
  "sceneId": "tutorial | home_intro | level_one | level_two | unknown",
  "levelId": "tutorial | home_intro | level_one | level_two | unknown",
  "actor": {
    "active": "human | frog | elephant | other | unknown",
    "position": { "x": 0, "y": null, "z": 0 },
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
  "selectedObject": {
    "id": "",
    "name": "",
    "type": "",
    "category": "",
    "asset": { "key": "", "path": "" },
    "position": null,
    "rotationY": null,
    "collisionExpected": null,
    "colliderLabel": null,
    "mechanismLink": null
  },
  "nearbyObjects": [],
  "colliderContext": {
    "suspectedColliderIds": [],
    "observedColliderCount": null,
    "actorBlocked": null,
    "actorClipping": null,
    "actorPassesThrough": null,
    "notes": ""
  },
  "orientationContext": {
    "assetAppearsBackward": null,
    "rotationYExpected": null,
    "rotationYObserved": null,
    "degreesMentionedByUser": null,
    "notes": ""
  },
  "surfaceContext": {
    "surfaceId": null,
    "bottomContact": null,
    "topContact": null,
    "slopeHeightFunction": null,
    "actorVisualClearance": null,
    "unsupportedEdgeExit": null,
    "notes": ""
  },
  "triggerContext": {
    "triggerId": null,
    "radius": null,
    "firesOnce": null,
    "firesRepeatedly": null,
    "enterExitState": null,
    "cooldown": null,
    "notes": ""
  },
  "cameraOrScreenshotNotes": "",
  "relatedFiles": [],
  "priorBugPatterns": [],
  "constraints": [],
  "validationPlan": [],
  "openQuestions": []
}
```

## Example Packet: Home House Doorway Collision

Use `home_intro` for CLI commands.

```json
{
  "schemaVersion": "lumina3d-ai-context-v1",
  "taskType": "collision",
  "sceneId": "home_intro",
  "levelId": "home_intro",
  "actor": {
    "active": "human",
    "position": { "x": null, "y": null, "z": null },
    "radius": null,
    "surfaceId": null,
    "facing": null
  },
  "observedBehavior": "Human can partially step into the house doorway/interior before an invisible blocker stops movement deeper inside.",
  "expectedBehavior": "Human should not be able to enter the house doorway/interior, while the note remains reachable from outside.",
  "reproductionSteps": [
    "Start or jump to the Home Intro scene.",
    "Move the human toward the visible house doorway.",
    "Observe whether the actor can enter the doorway/interior before collision blocks movement."
  ],
  "renderGameToText": {},
  "levelManifest": {},
  "levelObjects": [],
  "selectedObject": {
    "id": "home_house_main_body or related house collider id from object list",
    "name": "Home house",
    "type": "collider",
    "category": "home",
    "asset": { "key": "", "path": "" },
    "position": null,
    "rotationY": null,
    "collisionExpected": true,
    "colliderLabel": "house body / threshold / doorway",
    "mechanismLink": null
  },
  "nearbyObjects": ["home_house_main_body", "home_house_front_threshold", "home_note"],
  "colliderContext": {
    "suspectedColliderIds": ["home_house_main_body", "home_house_front_threshold"],
    "observedColliderCount": null,
    "actorBlocked": true,
    "actorClipping": true,
    "actorPassesThrough": false,
    "notes": "Door note trigger and house body collision should remain separate."
  },
  "orientationContext": {},
  "surfaceContext": {},
  "triggerContext": {
    "triggerId": "home_note",
    "firesOnce": null,
    "firesRepeatedly": null,
    "notes": "Note must remain reachable from outside after collision cleanup."
  },
  "cameraOrScreenshotNotes": "Human appears to enter visible doorway space before deeper blocker stops movement.",
  "relatedFiles": ["bug_report.md", "backlog.md"],
  "priorBugPatterns": ["Missing or weak scene collision", "Home doorway collision"],
  "constraints": [
    "Do not move the note out of reach.",
    "Do not change Home intro flow.",
    "Prefer collider/proxy adjustment over asset edits unless asset origin is proven wrong."
  ],
  "validationPlan": [
    "npm run build",
    "npm run tools:get-level-manifest -- home_intro --pretty",
    "npm run tools:list-level-objects -- home_intro --pretty",
    "npm run tools:run-scene-smoke -- home_intro --pretty",
    "node test-output/home-level-one/smoke.mjs if the Home/Level One flow is touched"
  ],
  "openQuestions": [
    "Exact actor position and nearby collider rows from current runtime output.",
    "Whether the doorway should remain decorative-only until a future interior exists."
  ]
}
```

## Example Packet: Level Two Blue Ramp / Walkable Surface

```json
{
  "schemaVersion": "lumina3d-ai-context-v1",
  "taskType": "walkable-surface",
  "sceneId": "level_two",
  "levelId": "level_two",
  "actor": {
    "active": "human",
    "position": { "x": null, "y": null, "z": null },
    "radius": null,
    "surfaceId": "blue-ramp",
    "facing": null
  },
  "observedBehavior": "Blue ramp visual appears embedded or the actor visually clips into/through the walkable slope proxy.",
  "expectedBehavior": "Actor should contact the ramp bottom/top cleanly, remain visually above the surface, and not get stuck on ramp entry or exit.",
  "reproductionSteps": [
    "Start Level Two.",
    "Activate the blue ramp through the current blue-button flow.",
    "Return to the human and climb the ramp toward the Elephant Totem platform.",
    "Observe actor clearance on the ramp and behavior at bottom/top transitions."
  ],
  "renderGameToText": {},
  "levelManifest": {},
  "levelObjects": [],
  "selectedObject": {
    "id": "blue ramp object id from list-level-objects",
    "name": "Blue ramp",
    "type": "walkable-surface",
    "category": "level_two",
    "asset": { "key": "", "path": "" },
    "position": null,
    "rotationY": null,
    "collisionExpected": true,
    "colliderLabel": "blue ramp / walkable ramp",
    "mechanismLink": "blue button"
  },
  "nearbyObjects": [],
  "colliderContext": {
    "suspectedColliderIds": [],
    "actorBlocked": null,
    "actorClipping": true,
    "actorPassesThrough": null,
    "notes": "Separate ramp visual, side blockers, hill colliders, and walkable slope proxy."
  },
  "surfaceContext": {
    "surfaceId": "blue-ramp",
    "bottomContact": "unknown",
    "topContact": "unknown",
    "slopeHeightFunction": "unknown",
    "actorVisualClearance": "needs verification",
    "unsupportedEdgeExit": "needs verification",
    "notes": "Check actor Y restoration, ramp entry, ramp top transition, and unsupported edge behavior."
  },
  "triggerContext": {},
  "cameraOrScreenshotNotes": "Screenshot notes should say whether clipping is visible at ramp bottom, middle, top, or step-off.",
  "relatedFiles": ["bug_report.md", "backlog.md"],
  "priorBugPatterns": [
    "Raised platform or ramp step-off stuck state",
    "Walkable slope proxy mismatch"
  ],
  "constraints": [
    "Do not introduce new Level Two mechanics.",
    "Preserve existing blue-button/ramp gameplay.",
    "Prefer a walkable-surface contract fix over broad collision refactor."
  ],
  "validationPlan": [
    "npm run build",
    "npm run tools:get-level-manifest -- level_two --pretty",
    "npm run tools:list-level-objects -- level_two --pretty",
    "npm run tools:validate-missing-colliders -- level_two --pretty",
    "npm run tools:validate-float-colliders -- level_two --pretty",
    "npm run tools:run-scene-smoke -- level_two --pretty",
    "node test-output/level-two-ramp-access/smoke.mjs if present"
  ],
  "openQuestions": [
    "Exact current ramp object row and actor runtime state near the visual clipping.",
    "Whether this is only visual polish or a gameplay blocker."
  ]
}
```
