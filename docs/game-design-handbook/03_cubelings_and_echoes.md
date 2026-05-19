# Cubelings, Echoes, And Totems

## Purpose

This is the handbook for Cubeling identity, unlock timing, and behavior interactions with explicit status labeling. It separates locked design from candidate ideas and optional/replay systems.

## Glossary

### Cubeling

A Cubeling is an animal helper the player can temporarily control. Cubelings solve environment and movement puzzles.

- Can activate mechanism-linked interactions.
- Do not collect Love Letters or Cubeling Totems.
- Act on a local route basis once unlocked.

### Cubeling Echo

A Cubeling Echo is an inactive or active anchor point for one Cubeling.

- `Dormant echo` = Cubeling not yet available in the main progression.
- `Appearing echo` = Optional/replay systems may place the Echo before the Totem is collected.
- `Awake echo` = Cubeling has been unlocked and can be possessed.
- `Recalled echo` = active Cubeling can return to it with Recall.

### Cubeling Totem

A Cubeling Totem is the unlock item for that Cubeling.

- Collected by the main character only.
- Unlock is global for future level sessions unless design says otherwise.
- Totems are not usually replay collectibles.

## Status framework used in this document

- `LOCKED / CURRENT DIRECTION`
- `STRONG CANDIDATE`
- `EXPLORATORY / BACKLOG`
- `OPTIONAL / DEFERRED`
- `AI-SUGGESTED / NEEDS HUMAN REVIEW`

Source/Confidence tags used per idea:

- Direct user idea
- Shared brainstorm
- Assistant suggestion
- Needs asset review
- Needs playtest validation

## Core unlock model

### Tutorial and early progression baseline

- Frog Echo appears first.
- Frog Totem appears in a controlled context.
- Main character collects Frog Totem.
- Frog becomes available as an active Cubeling.

### Standard level behavior (current pass)

- Before global unlock: Echo can be present but is dormant.
- After Totem unlock: Echo supports possession/transfer.
- Echo remains a visual anchor, not a control point before unlock.
- Already-collected Totems should stay out of normal replay, except when intentionally restaged for teaching.

## Cubeling behavior map (high-level)

For full role-by-role status and future possibilities, use:

- [`11_cubeling_ability_map.md`](/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D/docs/game-design-handbook/11_cubeling_ability_map.md)

## Current transfer model

- Transfer is distance-based.
- Press `Shift` to enter/exit a nearby active Cubeling.
- Multiple active Cubelings must still use a deterministic target rule (closest valid first).

Status: `LOCKED / CURRENT DIRECTION`

## Current recall compatibility

- Recall returns active Cubelings to their active Echo locations.
- Recall does not summon dormant Cubelings.
- Recall does not reset level-wide progression by default.
- Recall does not reappear dormant Totems.

Status: `LOCKED / CURRENT DIRECTION`

Source: `Direct user idea` and `Locked current direction`

## Animal behavior/reaction system (future-facing)

Use only readable, obvious relationships first.

Current strongest candidates:

- Mouse scares Elephant — `STRONG CANDIDATE`
- Cheese attracts Mouse — `STRONG CANDIDATE`

Possible later candidates:

- Bone attracts Dog — `EXPLORATORY / BACKLOG`
- Cat may affect Mouse — `EXPLORATORY / BACKLOG`
- Mouse may trigger Cat panic chain — `AI-SUGGESTED / NEEDS HUMAN REVIEW`
- Chicken/city-crossing motif — `EXPLORATORY / BACKLOG`

Notes:

- Keep these as behavior hooks, not mandatory for every level.
- A relationship should be introduced only if the player can infer it without explicit tutorial text.

## Deferred/replayability pattern link

A deferred Cubeling pattern (Echo appears before Totem) is documented in:

- [`12_deferred_cubelings_and_replayability.md`](/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D/docs/game-design-handbook/12_deferred_cubelings_and_replayability.md)

## Echo visual contract

Echoes are readable as inactive anchors.

- muted color,
- reduced collision,
- no active AI before unlock,
- ring/ground marker or light pulse for location memory,
- optional label text in debug/dev builds.

Avoid:

- full-color active silhouette before unlock,
- active audio/AI behavior while dormant,
- forcing color-only interpretation without mechanism context.
