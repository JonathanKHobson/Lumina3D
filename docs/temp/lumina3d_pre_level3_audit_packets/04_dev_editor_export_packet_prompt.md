# Codex Prompt — Dev Editor Export Packet Upgrade

You are working in the Lumina3D repo. Improve the F2 dev editor so it better supports the planned Level Three editor-to-Codex workflow.

## Current goal

The user wants to use the in-game/dev level editor to move objects, mark water/terrain/asset placements, export notes, then paste that export into Codex. The editor does not need to author complex animations or mechanism connections yet, but it should produce a clearer packet.

## Files to inspect

- src/debug/devEditor.js
- src/ui/hud.js
- src/main.js
- scripts/lib/levelCatalog.js
- scripts/list-level-objects.js
- scripts/get-level-manifest.js

## Task

Add an enhanced export mode while preserving the existing compact JSON export.

The new export should include:

1. `levelId`, `sceneId`, display name, and timestamp.
2. A `sourceFiles` section listing likely files to update.
3. Object rows with:
   - objectId
   - objectName
   - category
   - asset
   - position
   - rotationY
   - scale
   - collisionExpected
   - optional triggerExpected / collectibleExpected / walkableExpected where inferable
   - colliderLabelGuess if inferable
   - notes field initialized as empty string
4. A `terrainNotes` section for high-level notes such as water regions, ground tiles, raised surfaces, and intended walkable proxies.
5. A `mechanismNotes` section for manual notes such as “blue button opens gate” or “moving platform starts here”.
6. A Markdown prompt export that says: “Apply this editor packet to the level data. Do not invent new mechanics beyond the notes. Preserve existing mechanics and run verification.”
7. Copy-to-clipboard support for both JSON and Markdown, with fallback console logging.

## Verification

Run:

- npm run build
- npm run tools:run-scene-smoke -- tutorial
- npm run tools:run-scene-smoke -- level_one
- npm run tools:run-scene-smoke -- level_two

Manual smoke:
- Open dev editor with F2.
- Select/move one object.
- Export compact JSON.
- Export Markdown packet.
- Confirm no console errors and existing selection still works.

## Guardrails

- Do not make editor movements mutate source files directly.
- Do not add animation/mechanism editing yet.
- Do not include floor tiles in default export unless explicitly toggled; keep the packet readable.
