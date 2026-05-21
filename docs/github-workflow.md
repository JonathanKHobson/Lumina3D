# Lumina3D GitHub Workflow

## Repository

- Local project: `/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D`
- GitHub repository: `https://github.com/JonathanKHobson/Lumina3D`
- Visibility: public
- Purpose: portfolio project and personal gift game in progress
- Publishing status: source repository only for now; no public playable build or landing page yet

## Working Model

Lumina3D stays local-first.

GitHub is the remote record, backup, sharing surface, and future portfolio-development trail. It is not the main editing environment.

Normal workflow:

1. Edit locally.
2. Run the relevant tests locally.
3. Commit locally.
4. Push to GitHub.

Direct GitHub web edits should be limited to tiny documentation corrections.

## Branching

Use `main` for stable checkpoints that build and keep the game playable.

Commit directly to `main` for:

- documentation updates;
- small copy changes;
- narrow bug fixes with passing smoke tests;
- clean refactor slices that do not change behavior.

Use a short feature/fix branch for:

- collision or surface handling changes;
- scene-flow changes;
- new Cubeling mechanics;
- Level Two Elephant/red-button/elevator work;
- any pass likely to break multiple scenes.

Suggested branch names:

- `fix/level-two-ramp-recovery`
- `fix/home-house-collision`
- `feature/elephant-echo-unlock`
- `refactor/collision-surfaces`

## Test Before Commit

Minimum before normal commits:

```bash
npm run build
```

For gameplay changes, also run the relevant smoke:

```bash
npm run tools:validate-level-registry -- --pretty
npm run tools:run-scene-smoke -- tutorial
npm run tools:run-scene-smoke -- home_intro
npm run tools:run-scene-smoke -- level_one
npm run tools:run-scene-smoke -- level_two
npm run tools:run-scene-smoke -- level_three
```

For Level Two surface/collision changes:

```bash
npm run tools:validate-missing-colliders -- level_two
npm run tools:validate-float-colliders -- level_two
node test-output/level-two-frog-totem/smoke.mjs
node test-output/level-two-ramp-access/smoke.mjs
```

For new-level wiring changes:

```bash
npm run tools:list-levels -- --pretty
npm run tools:validate-level-registry -- --pretty
npm run tools:get-level-manifest -- <level_id> --pretty
npm run tools:run-scene-smoke -- <level_id> --pretty
```

For Home/Level One flow changes:

```bash
node test-output/home-level-one/smoke.mjs
```

## Commit Style

Use small, descriptive commits:

```text
Initialize Lumina3D public repo
Fix Level Two ramp recovery
Add Elephant Echo unlock slice
Refactor Frog AI patrol helpers
Update Level Two smoke checklist
```

Commit when there is a useful rollback point, not after every tiny keystroke.

## What Not To Commit

Ignored local-only output:

- `node_modules/`
- `dist/`
- `test-output/`
- `coverage/`
- `archive/`
- `.env`
- `.DS_Store`
- `._*`

Keep backup zips and generated screenshots local unless they are intentionally curated into docs.

## Public Repo Notes

This is public for process visibility and portfolio credibility, but it is not a finished release.

Before creating a public playable build or landing page:

- review third-party asset licenses and attribution;
- add a proper credits/attribution section;
- decide whether to add an explicit project license;
- remove or archive any old debug-only public-facing copy;
- run visual QA on desktop and narrow viewport.

## Immediate Development Order

Current next work after the Level Three Phase 1 lake/island shell and Phase 1.5 documentation/editor prep:

1. Implement Level Three Phase 2 only: Frog moving-lily-pad lane, lane-specific splash reset, repeatable `level3TotemGreenButton`, Crocodile Totem raft winch states, Human Totem collection, and awakened Crocodile Echo.
2. Keep Crocodile control, central bridge cycling, cargo stones, red-button systems, moving platforms, elevators, and the final Love Letter route out of Phase 2.
3. Human-review the current Level Two Red Button B / Elevator B route in browser before adding more Level Two mechanics.
4. Clean up Home house doorway collision if it still feels visibly wrong.

Do not add a broad collision refactor, Red Button C chain, city/desert/restaurant sequence, Crocodile control, or final Level Three route while the Phase 2 opening puzzle is the active lane.
