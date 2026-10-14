# Codex Prompt — Baseline Verification and Truth Check

You are working in the Lumina3D repo. Before implementing new features, verify the current pushed state and update the living docs accurately.

## Source-of-truth files to read first

- README.md
- progress.md
- backlog.md
- bug_report.md
- docs/github-workflow.md
- docs/refactor-plan.md
- docs/game-design-handbook/00_overview.md
- docs/game-design-handbook/07_level_two_phased_implementation_plan.md
- package.json
- src/config/scenes.js
- scripts/lib/levelCatalog.js

## Task

Run the smallest useful verification set and produce a concise status update.

1. Run:
   - npm run build
   - npm run tools:run-scene-smoke -- tutorial
   - npm run tools:run-scene-smoke -- home_intro
   - npm run tools:run-scene-smoke -- level_one
   - npm run tools:run-scene-smoke -- level_two
   - npm run tools:validate-missing-colliders -- level_two
   - npm run tools:validate-float-colliders -- level_two
2. If deeper smoke scripts exist, run the relevant Level Two ramp/Frog/Totem and Home/Level One scripts.
3. Inspect render_game_to_text() for Level Two and determine whether Level Two has a real collectable Love Letter/completion route or only a placeholder.
4. Update progress.md with the exact commands and outcomes.
5. Update backlog.md only for verified open bugs or stale priorities.
6. Update bug_report.md only if a bug is newly found, fixed, or intentionally deferred.

## Guardrails

- Do not implement feature changes in this pass.
- Do not edit level layouts.
- Do not refactor collision/surface behavior.
- If docs conflict with code, prefer current code and state the conflict clearly.
