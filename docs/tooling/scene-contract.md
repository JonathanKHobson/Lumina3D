# Scene Contract

Purpose: define the minimum evidence a Lumina3D scene object or mechanic must provide before it is considered ready.

The scene contract is the bridge between visual truth and machine-readable state. It turns "the AI says tests pass" into "the scene proves its state, collider, walkable surface, screenshot, performance, and asset assumptions."

## Contract Shape

Future level metadata can grow toward this shape:

```js
{
  levelId: "level_three",
  qaCameras: [],
  probePaths: [],
  colliderExpectations: [],
  walkableProxyExpectations: [],
  fixtures: {
    implemented: [],
    planned: []
  },
  performanceBudget: {
    drawCallsWarning: null,
    trianglesWarning: null,
    geometriesWarning: null,
    texturesWarning: null
  },
  assetLedgerRefs: []
}
```

Keep this data close to the existing catalog/tooling lane before promoting it into runtime behavior. Do not make `src/main.js` bigger to satisfy this contract.

## Object Contract Fields

Each important object should answer:

| Field | Meaning |
|---|---|
| `id` | Stable source/tooling object id. |
| `assetKey` | Runtime registry key or generated/editor asset key. |
| `looksSolid` | Player would expect this to block movement. |
| `collisionExpected` | Runtime should expose a blocking collider. |
| `colliderLabel` | Stable label or prefix expected in `render_game_to_text()`. |
| `looksWalkable` | Player would expect an actor to stand/walk on it. |
| `walkableProxyExpected` | Runtime should expose an allowed-surface rule or proxy. |
| `probePaths` | Route probes that prove entry/exit/blocking behavior. |
| `qaCameras` | Screenshot bookmarks that prove visual readability. |
| `allowedActors` | Actors that can use or stand on the object. |
| `blockedActors` | Actors that should be blocked. |
| `triggers` | Dialogue, collection, button, or scene-flow triggers tied to it. |
| `assetLedgerRef` | Source/license ledger entry for third-party assets. |

## Probe Path Shape

Probe paths should test route intent, not just object existence.

```js
{
  id: "home.house_door_boundary",
  levelId: "home_intro",
  actor: "human",
  start: { x: -2.8, z: -0.4 },
  end: { x: -2.8, z: -2.2 },
  allowedZones: ["note_apron"],
  blockedZones: ["doorway_interior", "house_body"],
  expectedColliderLabels: [
    "home-house-front-threshold",
    "home-house-left-front",
    "home-house-right-front"
  ],
  forbiddenStates: ["actorInsideHouse"],
  status: "planned"
}
```

## Readiness Levels

| Level | Meaning |
|---|---|
| `planned` | Contract exists, but no automated proof yet. |
| `state-proven` | `render_game_to_text()` or fixture proves relevant state. |
| `probe-proven` | Route/collision behavior is sampled and passes. |
| `screenshot-proven` | Human-approved screenshot baseline or manual screenshot proof exists. |
| `release-ready` | State, probe, screenshot, and asset/license assumptions are all satisfied. |

## Level Three Intake Questions

Before adding a Level Three object, answer:

1. Does it look solid?
2. Does it need a collider?
3. Does it look walkable?
4. Does it need a walkable proxy?
5. Can the main character use it?
6. Can a Cubeling use it?
7. Should it block Cubelings?
8. Does it need a screenshot bookmark?
9. Does it need a probe path?
10. Is its license logged?

If those answers are unknown, the object is allowed as a placeholder only. Do not wire gameplay behavior around an unknown contract.

## First Contract Targets

- `home_intro.home_house_doorway`: doorway clipping and invisible blocker prevention.
- `level_one.bridge_crossing`: bridge/water walkability clarity.
- `level_two.blue_ramp`: ramp top contact, visual clearance, and exit behavior.
- `level_two.red_elevator_a`: endpoint latch plus human/Elephant exit routes.
- `level_three.frog_lane`: lily pad route, water reset, and Totem Winch access.

