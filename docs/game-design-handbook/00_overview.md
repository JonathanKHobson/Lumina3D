# Lumina3D Game Design Handbook

## Purpose

This handbook is the plain-language design source for Lumina3D. It exists so future levels are built from a shared set of rules instead of rediscovering the same mechanics, alignment risks, and tutorial lessons every pass.

This is not a replacement for code, `progress.md`, or `backlog.md`.

- `progress.md`: live session history and verification log.
- `backlog.md`: current deferred work and near-term planning queue.
- `bug_report.md`: recurring bug library and prevention notes.
- `docs/game-design-handbook/`: slower-moving design system, mechanics, level-planning, and build rules.
  - `15_prompting_glossary_and_space_language.md`: map vocabulary bridge between plain-language design intent and code-ready wording.

## Current Game Shape

Lumina3D is a cozy 3D puzzle adventure about a main character following Love Letters through small environmental puzzle spaces. The player uses Cubelings - animal helpers with different abilities - to create paths the main character cannot create alone.

Core rules:

- The main character explores, transfers into Cubelings, and collects important items.
- Cubelings solve environmental puzzles but do not collect Love Letters or Cubeling Totems.
- Love Letters are the main level reward and can show unique message text.
- Cubeling Totems unlock new Cubelings.
- Cubeling Echoes are the visible spawn/home-anchor points for Cubelings.
- Levels should introduce mechanics gradually and keep the puzzle readable before it becomes complex.

## Known Playable Structure

### Tutorial

The tutorial introduces:

- main character movement;
- camera rotation;
- Frog Echo;
- Frog Cubeling Totem;
- Frog Cubeling unlock;
- transfer/possession;
- Frog jump;
- blue button;
- Love Letter collection;
- Love Letter message popup and celebration.

The tutorial is now the only tutorial. Do not plan additional tutorial levels unless the broader game structure changes.

### Home Story Intro

The Home Story Intro is a short story transition between the tutorial and Level One. It includes:

- home exterior;
- arrival cinematic;
- door note;
- trail exit confirmation;
- transition into Level One.

It is not Level One.

### Level One

Level One is the first unguided puzzle. It applies the Frog Cubeling mechanic to a water-gap/bridge puzzle:

- Frog starts available.
- Frog jumps across a water gap from a partial bridge.
- Frog presses a blue button.
- The bridge completes.
- Main character crosses and collects the Love Letter.

### Level Two Planned Direction

Level Two should introduce:

- Elephant Cubeling;
- Elephant Echo and Elephant Cubeling Totem;
- red weight buttons;
- platforms/elevators;
- elevated Love Letter goal;
- Cubeling Recall with `C`.

## Design Philosophy

Lumina3D should feel like a sequence of small realizations, not a set of chores. Each level should answer one main question:

> What can this Cubeling help me do that I cannot do alone?

Good level design here means:

- the goal is visible or emotionally clear;
- the current obstacle is readable;
- the required Cubeling ability is discoverable;
- the main character still matters;
- failure creates guidance, not punishment;
- solved objects communicate why they changed.

## Production Rule

Do not implement a whole new level in one pass.

For Level Two, the smallest safe next implementation slice is:

1. Add Level Two scene ID, debug shortcut, and empty scene shell.
2. Build terrain shell with main character, Frog Cubeling, and placeholder elevated Love Letter.
3. Verify load, camera, movement, collision bounds, screenshots, and `render_game_to_text()`.

Only after that should Frog ledge jump, Elephant unlock, red buttons, elevators, and recall be layered in.
