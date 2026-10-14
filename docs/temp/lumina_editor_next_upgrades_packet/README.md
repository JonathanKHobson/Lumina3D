# Lumina3D Level Editor — Next Upgrades Research + Codex Packet

Prepared: 2026-05-20

## Purpose

This packet gives Codex a local-first implementation brief for the next round of Lumina3D Level Editor upgrades.

The goal is to keep rounding the editor into a practical level-building and AI-handoff tool before Level 3 creation.

## Primary next upgrades

1. Fix/editability for selectable ground/elevated tiles.
2. Add search + filters to the editor object list.
3. Plan, but do not fully implement yet, a bottom timeline/scrubber for level solution playback/debugging.
4. Plan an asset library tab/panel for future level building.
5. Preserve existing editor features: object notes, intent tags, camera tilt, state export, delete/replace marks, reset behavior, and normal playable game route.

## Local-first operating model

Codex is working in the user's local Lumina3D workspace.

Do not assume GitHub reflects the latest local files. Inspect the local file tree first. Do not commit, push, pull, merge, reset, rebase, or switch branches unless the user explicitly asks.

## Suggested file order

1. `01_codex_prompt.md` — paste-ready prompt.
2. `02_upgrade_scope.md` — scope, goals, non-goals.
3. `03_ground_tile_editability.md` — diagnosis + implementation plan for movable tiles.
4. `04_object_list_search_filtering.md` — object list search/filter design.
5. `05_timeline_scrubber_research_plan.md` — future timeline architecture.
6. `06_asset_library_future_scope.md` — future asset browser/library planning.
7. `07_level3_readiness_roadmap.md` — roadmap toward Level 3 creation.
8. `08_validation_manual_qa.md` — validation and test checklist.
9. `09_research_references.md` — external references and design patterns.
