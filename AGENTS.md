# Agent Guide

Lumina3D is a local-first Three.js/Vite game prototype. The public repository records source and progress; the README does not promise a released playable site.

- Read `README.md` and `docs/github-workflow.md`. `src/main.js` orchestrates the runtime; `src/scenes/`, `src/levels/`, and `src/systems/` own scene, layout, and behavior; `src/config/assets.js` maps assets in `public/assets/`.
- Run `npm run build` after installing dependencies. The `tools:*` scripts in `package.json` support focused scene and collider checks. `test-output/` is local ignored QA output, not committed test source.
- Preserve asset attribution and existing saved-state behavior. Review rendered gameplay when changing scenes, layout, or controls.
