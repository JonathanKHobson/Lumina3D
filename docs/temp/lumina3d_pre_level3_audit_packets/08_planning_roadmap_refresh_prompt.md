# Codex Prompt — Planning and Roadmap Refresh Before Level Three

You are working in the Lumina3D repo. Refresh planning docs so the next month of work is focused and realistic.

## Read first

- README.md
- progress.md
- backlog.md
- bug_report.md
- docs/github-workflow.md
- docs/game-design-handbook/00_overview.md
- docs/game-design-handbook/07_level_two_phased_implementation_plan.md
- scripts/lib/levelCatalog.js

## Task

Create or update a concise planning document, such as `docs/roadmap-current.md`.

It should include:

1. Current playable structure:
   - Tutorial
   - Home Intro
   - Level One
   - Level Two
2. Verified current status of each scene.
3. Near-term priorities before Level Three.
4. A one-month scope recommendation.
5. Candidate Level Three directions:
   - water-focused compact level;
   - Frog reuse plus optional future Duck/Axolotl placeholder;
   - no full new Cubeling unless explicitly chosen.
6. A “do not do yet” section:
   - do not build city/desert/restaurant all at once;
   - do not add multiple Cubelings in one pass;
   - do not refactor collision while adding a new level.
7. Update backlog.md to match this roadmap.

## Verification

No gameplay verification required if this is docs-only, but run:

- npm run tools:list-levels
- npm run tools:get-level-manifest -- level_two

## Guardrails

- Do not invent final story text.
- Do not remove existing phased Level Two plan.
- Keep this as planning clarity, not a design bible rewrite.
