# Cubeling Recall

## Definition

Cubeling Recall is a recovery/repositioning mechanic. When the player presses `C`, all unlocked/active Cubelings in the current level return to their own Echo points.

This is not Elephant-specific.

## Core Rule

Press `C` to recall active Cubelings to their Echoes.

- Frog returns to Frog Echo.
- Elephant returns to Elephant Echo.
- Future unlocked Cubelings also return.

Status: `LOCKED / CURRENT DIRECTION`

## What Recall Does

Recall:

- affects all active/unlocked Cubelings in the current level;
- returns each active Cubeling to its own Echo/spawn point;
- is a player recovery tool;
- should have a short cooldown;
- should provide a visible/aural effect on departure and arrival.

## What Recall Does Not Do

Recall does not:

- reset the full level state;
- summon dormant/future Cubelings;
- collect items;
- replace proximity transfer;
- reset Love Letter progress;
- reverse solved mechanisms by default.

## Player-facing copy

Preferred prompt:

> Press C to recall Cubelings to their Echoes.

Avoid:

- "Recall Frog/Elephant" as hardcoded one-off verbs unless the level has a single active Cubeling.
- Treating Recall as possession.

## Level Two and beyond

- Current implementation order should keep recall available once Cubeling set is stable enough that recalls matter.
- Avoid forcing Recall into puzzle beats unless a future design pass intentionally does so.

## Deferred/optional Cubelings interaction

Recall is active only for unlocked Cubelings. Deferred patterns (for example Bunny or Unicorn echoes shown before their Totem) stay unresolved in Recall until their unlock gate is completed.

This is `LOCKED / CURRENT DIRECTION` for current mechanics and `EXPLORATORY / BACKLOG` for deferred behavior details.

## Open design notes

- Source/signal tags:
  - Direct user idea / Locked current direction
  - Needs playtest validation
- Open question:
  - Should recall have a level-wide cooldown shared across all Cubelings or per Cubeling?
