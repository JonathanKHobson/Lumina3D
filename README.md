# Lumina3D

Lumina3D is a public portfolio project and a personal gift game in progress. It is a cozy 3D browser-game prototype about a main character, Cubeling animal helpers, environmental puzzles, and Love Letters.

The public GitHub repository is:

`https://github.com/JonathanKHobson/Lumina3D`

The project is developed locally first at:

`/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D`

This repository is public for portfolio/process visibility, but the game is not published as a playable release yet. A GitHub Pages or portfolio landing page can be added later when the project is ready for public presentation.

## Engine Choice

This project intentionally stays on Vite + Three.js for now. The current playable slice is already a 3D scene with KayKit and voxel OBJ/MTL assets, a GLTF main character, orthographic camera rotation, DOM overlays, custom collision proxies, and deterministic Playwright test hooks.

Phaser is a strong choice for 2D sprite and tilemap games, including the earlier Lumina 2D prototype. Moving this 3D lane to Phaser right now would be a scope expansion and would discard a working 3D asset/camera pipeline. Reconsider Phaser only if the game pivots back to a 2D implementation.

## Commands

- `npm run dev`: start Vite on localhost.
- `npm run dev:test`: start Vite on `http://127.0.0.1:5178/` for smoke tests.
- `npm run build`: production build.

## GitHub Workflow

Development is local-first:

1. Make changes in the local project folder.
2. Run `npm run build` and the relevant smoke tests.
3. Commit a working checkpoint locally.
4. Push the checkpoint to GitHub.

Use `main` for stable, playable checkpoints. Use short branches for risky work, such as collision/surface rewrites or new Cubeling mechanics. Avoid editing game code directly in the GitHub web UI except for tiny documentation fixes.

More detail: `docs/github-workflow.md`.

## Where Things Live

- Assets served by Vite: `public/assets/`
- Asset registry: `src/config/assets.js`
- Shared constants and tutorial copy: `src/config/constants.js`
- Scene IDs: `src/config/scenes.js`
- Grid helpers: `src/core/grid.js`
- Level layout data: `src/levels/`
- Scene construction: `src/scenes/`
- Runtime orchestration and systems: `src/main.js`
- Debug shortcuts: `src/debug/debugLevelSelect.js`
- Game design handbook: `docs/game-design-handbook/`
- GitHub workflow: `docs/github-workflow.md`
- Living bug report library: `bug_report.md`
- Current backlog: `backlog.md`
- Session/progress log: `progress.md`

## Adding A New Asset

1. Copy only the required source files into `public/assets/...`.
2. Add a registry entry in `src/config/assets.js`.
3. Load and place it from the relevant scene builder or runtime system.

## Adding A New Level

1. Add layout constants in `src/levels/newLevel.js`.
2. Add build logic in `src/scenes/newLevelScene.js`.
3. Add a scene ID in `src/config/scenes.js`.
4. Wire the new scene through `src/main.js`.
5. Add smoke coverage under `test-output/`.

Before adding Level Two or any later level, read `docs/game-design-handbook/00_overview.md` and the level-specific planning docs in that folder.

## Debug Shortcuts

Temporary QA shortcuts are defined in `src/debug/debugLevelSelect.js`:

- `1`: Tutorial
- `2`: Home Story Intro
- `3`: Level One
- `R`: restart the current scene/level

These are development shortcuts, not final player-facing UI.

## Asset And License Note

This prototype uses free/third-party asset packs during development. Keep original asset licenses and attribution requirements with the project. Before turning this into a public playable release or portfolio landing page, do a focused asset license/attribution pass.
