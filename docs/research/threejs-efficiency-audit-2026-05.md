# Lumina3D Three.js Efficiency Audit

Date: 2026-05-21

Scope: research-backed audit of Lumina3D's Vite + Three.js lane, focused on build speed, runtime efficiency, asset hygiene, AI handoff accuracy, and validation coverage before more Level Three work.

This is a docs-only planning artifact. It does not change gameplay, assets, MCP config, or runtime behavior.

## Executive Takeaway

Do not switch engines and do not add a full physics engine yet. Lumina3D's current pain is not that Three.js is the wrong renderer. The pain is that the game has grown a custom mini-engine inside `src/main.js`, with collision, walkable surfaces, level flow, editor handoff, and test hooks still too intertwined.

The best next work is a scripts-first hardening pass:

1. Add deterministic spatial probes that catch invisible walls and missing walkable exits before human review.
2. Add asset audit scripts before importing more Level Three assets.
3. Extract the remaining collision/surface contract from `src/main.js` only after probes exist.
4. Use Three.js ecosystem helpers where they reduce proven pain: glTF Transform for asset inspection/compression, InstancedMesh or merged geometry for repeated static tiles, Octree/BVH only for static-world collision experiments, and Rapier only if future Level Three mechanics require real rigid-body simulation.

## Current Repo Baseline

Verified locally on 2026-05-21:

- Branch: `codex/lumina3d-level-editor-mvp`
- Remote: `https://github.com/JonathanKHobson/Lumina3D.git`
- Latest commit: `b4261b7 Update Lumina3D Level 3 Phase 2A and publish helper`
- Dirty files already present before this audit:
  - `backlog.md`
  - `progress.md`
  - `scripts/lib/levelCatalog.js`
  - `scripts/run-fixture.js`
  - `src/main.js`
- `src/main.js` is currently about 6,213 lines.
- Current assets under `public/assets` total about 26 MB.
- Level registry validation passes for all 5 scenes.
- Level Three has 47 catalog objects, 12 scene assets, and 3 implemented fixtures.
- Level Three scene smoke passes.
- Level Three missing-collider and float-collider validators pass, checking 9 expected collider contexts against 426 observed collider labels.
- `npm run build` passes, but Vite reports chunk-size warnings:
  - `dist/assets/editor-*.js`: about 1,928 kB minified
  - `dist/assets/tutorialLevel-*.js`: about 688 kB minified

Important interpretation: the current validators catch missing/float collider categories, but they do not yet prove that a player can traverse every intended route without invisible walls, overly-tight exits, or walkable-surface edge failures.

## Research Summary

### Three.js Runtime Norms

- Three.js is a renderer and scene graph, not a complete game engine. For games, teams usually build or adopt layers for loop, input, collision, physics, state, asset pipeline, debug UI, and validation.
- The official Three.js manual recommends reducing draw calls by merging static geometry or using instancing when many objects share geometry/materials. This matters for Lumina terrain, water tiles, repeated props, and placeholder markers. Source: https://threejs.org/manual/en/optimize-lots-of-objects.html
- `InstancedMesh` is appropriate for many repeated objects with the same geometry/material, but individual editing requires separate instance data or editor proxy objects. Source: https://threejs.org/docs/api/en/objects/InstancedMesh
- Three.js requires explicit GPU resource disposal for geometries, materials, and textures when unloading/changing scenes. Source: https://threejs.org/manual/en/cleanup.html and https://threejs.org/manual/en/how-to-dispose-of-objects.html
- Texture dimensions matter more than compressed file size for GPU memory. Source: https://threejs.org/manual/en/textures.html

### Asset Pipeline Norms

- `GLTFLoader` supports Draco, Meshopt, and KTX2/Basis texture workflows through decoder/loader setup. Source: https://threejs.org/docs/pages/GLTFLoader.html
- glTF Transform is the most relevant free CLI for Lumina's future asset pipeline. It can inspect, validate, optimize, dedupe, prune, join, instance, simplify, resize textures, and convert texture formats. Source: https://gltf-transform.dev/cli
- The immediate value is not "compress everything." The immediate value is an asset budget report: vertex counts, texture dimensions, draw-call hints, duplicate materials, and whether a new Level Three asset is heavier than expected.
- KayKit's assets are a strong fit for the existing style and license posture: free for personal/commercial use, no attribution required, CC0. Source: https://kaylousberg.itch.io/kaykit-medieval-builder-pack
- Kenney, Quaternius, and Poly Pizza are useful free/low-poly discovery sources, but Lumina should not browse them as a new-scope activity. Use them only when a named Level Three need displaces a placeholder.
  - Kenney assets index: https://kenney.nl/assets
  - Quaternius asset library: https://quaternius.com/
  - Poly Pizza search: https://poly.pizza/

### Collision And Physics Norms

- For simple cozy puzzle movement, Lumina's circle-vs-AABB approach is still valid. The problem is coverage and structure, not necessarily the math.
- Three.js Octree is a reasonable experiment for static triangle-world collision. Source: https://threejs.org/docs/pages/Octree.html and https://threejs.org/examples/games_fps.html
- `three-mesh-bvh` is useful for accelerated raycasting and spatial queries against complex meshes, but it is an extra dependency and more useful after Lumina has static world meshes that justify mesh-level queries. Source: https://www.npmjs.com/package/three-mesh-bvh and https://github.com/gkjohnson/three-mesh-bvh
- Rapier is the serious free physics option if Lumina later needs rigid bodies, cargo, weight stones, pushing, or contact events. Source: https://rapier.rs/docs/ and https://github.com/dimforge/rapier.js/
- Do not introduce Rapier for Level Three Phase 2B or Phase 3 by default. It would create a second source of truth for movement/collision while the current custom collision layer is still label-driven.

### Community Signal

Reddit and forum patterns agree with the official docs on three practical points:

- Optimize assets with glTF Transform/gltfpack-style tools before blaming Three.js.
- Use KTX2/WebP/texture resizing thoughtfully because texture memory becomes a real bottleneck.
- Instancing/merging helps repeated static geometry, but editing individual instances needs a deliberate editor data model.

Treat Reddit as anecdotal signal only. Promote an idea only when it maps to a real Lumina bottleneck and has official docs or local validation behind it.

## Gap Audit

### 1. Invisible-Wall Coverage Is Still Too Human-Dependent

Current state:

- `validate-missing-colliders` and `validate-float-colliders` pass for Level Three.
- `run-scene-smoke` checks scene readiness, title, placeholders, button distinction, mostly-water shell shape, and editor marker output.
- The prompt workflow correctly separates visual mesh, gameplay collider, walkable proxy, trigger zone, and actor radius.

Gap:

- There is no general route probe that samples intended corridors/edges and confirms "actor can move from A to B without unexpected blocking."
- There is no spatial heatmap/diff artifact that lists blocked cells near intended Level Three paths.
- The validators prove "expected collider labels exist," not "the playable route is navigable and fair."

Recommended implementation:

- Add `scripts/validate-route-reachability.js`.
- Feed it route specs from `scripts/lib/levelCatalog.js` or `src/levels/<level>.js`.
- For each route, sample actor-radius points along a polyline and call a browser-exposed collision probe such as `window.__luminaTestHooks.canActorOccupy({ levelId, actor, x, z })`.
- Output JSON with pass/fail, first blocked point, nearest collider label, actor radius, and route id.
- Start with Level Three route specs:
  - `level3.start_to_frog_lane`
  - `level3.frog_lane_lily_pad_sequence`
  - `level3.totem_winch_island_button_access`
  - `level3.human_start_to_totem_dock`
- Later add Level Two elevator exit and ramp/ledge routes.

Why this matters: this targets the exact failure mode you are currently catching manually.

### 2. Collision Logic Is Correcting Too Many Special Cases In `main.js`

Current state:

- `src/systems/collisionSystem.js` contains only generic helpers: clamp, point-in-bounds, circle-vs-AABB, and zone clamping.
- Scene-specific walkable rules live in `src/main.js`, especially `sceneColliderBlocks`, `levelTwoWalkableSurfaceAllows`, and `levelThreeWalkableSurfaceAllows`.
- Label prefixes are still doing significant behavioral work.

Gap:

- Adding Level Three Crocodile, bridges, cargo stones, and red buttons will add more special cases unless the surface contract becomes data-driven.

Recommended implementation:

- Add `src/systems/surfaceSystem.js` only after route probes exist.
- Move level-specific surface checks behind explicit adapters:
  - `canOccupyLevelOneSurface(actor, point, context)`
  - `canOccupyLevelTwoSurface(actor, point, context)`
  - `canOccupyLevelThreeSurface(actor, point, context)`
- Keep labels as compatibility data at first, but require each walkable override to return:
  - `allowed`
  - `surfaceId`
  - `reason`
  - `sourceColliderLabel`
  - `requiredState`
- Expose the same result in `render_game_to_text()` and route-validator failure output.

Do not combine this extraction with new Crocodile mechanics.

### 3. Asset Hygiene Is Good Enough For Prototype Scale, But Not For Growth

Current state:

- Runtime assets are registered in `src/config/assets.js`.
- The separate editor has an external asset index and explicit draft/ghost workflow.
- `public/assets` currently weighs about 26 MB.
- OBJ/MTL is still the dominant runtime asset shape; GLTF is used for the player.

Gap:

- No asset budget command exists.
- No glTF/OBJ inspection summary exists.
- No automated check flags large texture dimensions, duplicate textures, missing license files, or AppleDouble sidecars under `public/assets`.
- More Level Three assets can increase load time and draw calls without a visible warning.

Recommended implementation:

- Add `npm run tools:audit-assets`.
- Output:
  - total public asset size
  - per asset registry entry size
  - missing file references
  - AppleDouble files under `public/assets`
  - texture dimensions
  - duplicate texture file hashes
  - likely repeated static objects that could be instanced/merged later
  - license/attribution missing warnings
- Add optional `npm run tools:gltf-inspect -- <path>` after adding `@gltf-transform/cli`.

Do not convert all assets now. First add the budget report.

### 4. Instancing Is Promising But Needs Editor-Compatible Boundaries

Current state:

- Level Three has many water tiles and land tiles.
- The editor already warns that `InstancedMesh` changes individual editing semantics.

Gap:

- If repeated terrain is instanced without editor proxies, the visual editor and AI handoff can lose source-backed object identity.

Recommended implementation:

- Do not instance interactives, actors, buttons, moving platforms, collectibles, or anything with per-object gameplay state.
- Start with non-editable, generated background water/terrain only.
- Keep a data record per tile for editor/source identity.
- Render repeated tile geometry through instancing or merged geometry, but let the editor select proxy records.
- Add a test that `render_editor_to_text()` still lists expected tile/source records after rendering optimization.

### 5. `render_game_to_text()` Is Valuable But Should Become Probe-Backed

Current state:

- Existing tooling relies on `window.render_game_to_text()`.
- Level Three exposes collider labels and useful phase state.

Gap:

- AI still cannot directly ask "can the frog stand here?" or "what blocks this coordinate?" without playing visually or reading a large section of `main.js`.

Recommended implementation:

- Add a compact debug API under `window.__luminaTestHooks`:
  - `probeCollision({ actor, x, z })`
  - `probeSurface({ actor, x, z })`
  - `probeRoute({ actor, points })`
  - `nearestColliders({ x, z, radius, levelId })`
- Keep it test/dev only.
- Keep output JSON small and deterministic.
- Have route validators use this API instead of duplicating collision logic in Node.

This is a stronger bridge between AI and visuals than asking the AI to infer from screenshots.

### 6. Prompt Workflow Needs A "Route Probe Required" Gate

Current state:

- `docs/ai-prompt-workflow` is already strong for spatial bugs.
- The checklist mentions render state, manifest, objects, screenshots, and validators.

Gap:

- It does not yet require route-reachability evidence for invisible-wall bugs.
- It does not force a route id or route name, so future prompts can still drift into vague "it gets stuck here" language.

Recommended implementation:

- Add a section to the workflow:
  - "For invisible wall, stuck, clipping, ramp, ledge, bridge, water, or platform bugs, include route probe output or explain why it cannot be generated."
- Update `spatial-bug-context-template.md` with:
  - route id
  - intended actor
  - start/end coordinates
  - first blocked sample
  - blocking collider label
  - screenshot/camera note

### 7. MCP Should Wrap Existing Proven Commands, Not Expand First

Current state:

- Lumina MCP is intentionally read-only plus validation-oriented.
- Existing memory warns against making MCP exposure the answer before local scripts prove the contract.

Gap:

- The next useful MCP addition is not a new planning surface. It is a wrapper around route probes and asset audits after the scripts exist.

Recommended implementation:

- Add scripts first.
- Then expose only:
  - `lumina_run_route_probe`
  - `lumina_audit_assets`
  - optionally `lumina_get_probe_failure_context`
- Do not add write/apply-patch behavior through MCP.

### 8. Bundle Size Is Starting To Matter

Current state:

- Production build passes.
- Vite warns that the editor and tutorial-level chunks are larger than the default warning threshold.
- The separate editor is valuable, but it does not need to sit in the first gameplay path if code splitting can keep initial game load smaller.

Gap:

- No bundle analysis command exists.
- No explicit budget exists for game bundle, editor bundle, level chunks, or public assets.

Recommended implementation:

- Add a lightweight build-size budget note before adding tooling:
  - gameplay entry bundle warning threshold
  - editor bundle warning threshold
  - public asset total warning threshold
- Consider route-level dynamic imports only after checking Vite output and preserving debug/test hooks.
- Keep this lower priority than route probes because chunk size is visible but not yet the blocker for human review.

## Prioritization Matrix

Scores: Impact, Effort, and Risk use 1-5. Higher impact is better. Higher effort/risk is worse.

| Idea | Impact | Effort | Risk | Priority | Why |
|---|---:|---:|---:|---|---|
| Route reachability validator | 5 | 3 | 2 | Do next | Directly targets invisible walls and stuck routes; can run in parallel with Level Three work. |
| Test hook collision/surface probes | 5 | 3 | 2 | Do next | Makes route validator possible and improves AI accuracy. |
| Asset audit script | 4 | 2 | 1 | Do next | Low-risk size/license/sidecar guard before more assets. |
| Prompt workflow route-probe gate | 4 | 1 | 1 | Do next | Improves AI handoffs immediately without runtime churn. |
| Surface system extraction | 5 | 4 | 4 | Next after probes | High value, but unsafe until route probes catch regressions. |
| Level Three route specs in catalog | 4 | 2 | 2 | Do next | Keeps route validation data-driven and reusable. |
| Bundle size audit/budget | 3 | 2 | 1 | Soon | Build passes, but Vite already warns about editor and level chunks. |
| Instanced/merged non-editable terrain | 3 | 3 | 3 | Later | Useful for draw calls, but must preserve editor identity. |
| glTF Transform CLI integration | 3 | 2 | 2 | Soon | Best first as inspection/reporting, not conversion. |
| Convert OBJ packs to optimized GLB | 3 | 4 | 3 | Later | Good for delivery, but changes asset pipeline and loader assumptions. |
| Octree/BVH static-world collision experiment | 3 | 4 | 3 | Later spike | Useful only after Level Three route probes show AABB limits. |
| Rapier physics integration | 4 | 5 | 5 | Not yet | Valuable for cargo/weight physics only if custom rules become too brittle. |
| Full editor collider editing | 4 | 5 | 4 | Not yet | Powerful, but current need is diagnostics/probes, not browser source writes. |
| New asset-library browsing/import sprint | 3 | 4 | 3 | Not yet | Risk of scope expansion while Level Three human review is pending. |

## Parallel Work While Level Three Builds

These can run in parallel with Level Three because they do not require changing player-facing design:

1. Route probe foundation
   - Add `probeCollision`, `probeSurface`, and `probeRoute` test hooks.
   - Add one Level Three route validator.
   - Verify against existing Level Three fixtures.

2. Asset audit foundation
   - Add `tools:audit-assets`.
   - Fail only on broken registry references and AppleDouble files; warn on budgets first.
   - Record baseline asset size.

3. Prompt workflow tightening
   - Add route-probe evidence requirements to invisible-wall prompts.
   - Add one example prompt using Level Three frog lane or Level Two elevator exit.

4. Catalog route metadata
   - Add route specs as data, not runtime behavior.
   - Use route specs for validation and future AI context packets.

Do not work in parallel on:

- Rapier integration.
- Full collision-system rewrite.
- Direct editor source writes.
- Big asset-library import.
- Engine migration.

Those are all displacement risks while the current concrete blocker is visual/gameplay review.

## Recommended Backlog Tickets

### L3-VAL-001 Route Reachability Probe

Build a browser-backed route validator for intended Level Three routes.

Acceptance:

- `npm run tools:validate-route-reachability -- level_three --pretty`
- Reports route id, actor, pass/fail, first blocked point, nearest collider labels.
- Covers at least `level3.frog_lane_lily_pad_sequence`.
- Does not change gameplay behavior.

### L3-VAL-002 Collision Probe Test Hooks

Expose deterministic dev/test-only collision and surface probes.

Acceptance:

- `window.__luminaTestHooks.probeCollision({ actor, x, z })`
- `window.__luminaTestHooks.probeSurface({ actor, x, z })`
- Output includes level id, actor radius, blocked/allowed, collider labels, and surface reason.
- Hidden or inert in production-facing paths if needed.

### ASSET-001 Asset Budget Audit

Add a script to report asset size, registry coverage, AppleDouble sidecars, duplicate textures, and large texture dimensions.

Acceptance:

- `npm run tools:audit-assets -- --pretty`
- Warns on `._*` files under `public/assets`.
- Confirms every `src/config/assets.js` entry resolves.
- Prints total asset size and per-registry-entry footprint.

### ASSET-002 glTF Transform Inspection Spike

Add optional glTF Transform inspection for future GLB assets.

Acceptance:

- No asset conversion required.
- Document command examples.
- Produce a sample report for `public/assets/kaykit/platformer/character/Character.gltf`.

### BUILD-001 Bundle Size Budget

Track build output sizes before adding more Level Three systems.

Acceptance:

- `npm run build` output is captured in a small parseable summary or documented budget.
- Editor and game chunks have separate warning thresholds.
- Any code-splitting proposal names the exact entry or route being split.
- No runtime behavior changes.

### DOC-ROUTE-001 Prompt Workflow Route Evidence Gate

Update AI prompt workflow docs for invisible-wall bugs.

Acceptance:

- Templates include route id, sampled path, first blocked coordinate, nearest collider, and route probe output.
- Collision workflow says route probe output is required when available.

### SURFACE-001 Surface Contract Extraction

After route probes pass, extract level-specific walkable-surface decisions into a focused system.

Acceptance:

- No behavior change.
- Existing Level Two and Level Three fixtures still pass.
- Route probe output is stable before/after.
- `main.js` loses special-case surface blocks rather than gaining more.

## Proposed AI Prompt Upgrade

Use this for future invisible-wall or route bugs:

```md
Use Lumina3D repo guidance and the spatial debug workflow.

This is a route/collision bug. Do not guess from screenshots alone.

Required evidence:
- `npm run tools:get-level-manifest -- <level_id> --pretty`
- `npm run tools:list-level-objects -- <level_id> --pretty`
- `npm run tools:validate-missing-colliders -- <level_id> --pretty`
- `npm run tools:validate-float-colliders -- <level_id> --pretty`
- route probe output if available
- screenshot/camera note if the bug is visual

Diagnose in this order:
1. route intent
2. actor radius and current surface
3. visual mesh vs gameplay collider
4. walkable proxy/allowed-surface rule
5. trigger zone
6. smallest safe patch

Do not change unrelated scenes, global actor radius, or asset paths. If route-probe tooling is missing, propose the smallest route-probe script before making a speculative collision patch.
```

## Source Notes

Primary references:

- Three.js optimize lots of objects: https://threejs.org/manual/en/optimize-lots-of-objects.html
- Three.js cleanup/disposal: https://threejs.org/manual/en/cleanup.html
- Three.js disposal FAQ: https://threejs.org/manual/en/how-to-dispose-of-objects.html
- Three.js textures and memory: https://threejs.org/manual/en/textures.html
- Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js InstancedMesh: https://threejs.org/docs/api/en/objects/InstancedMesh
- Three.js Octree: https://threejs.org/docs/pages/Octree.html
- Three.js FPS Octree example: https://threejs.org/examples/games_fps.html
- glTF Transform CLI: https://gltf-transform.dev/cli
- Rollup manual chunks reference from the Vite build warning: https://rollupjs.org/configuration-options/#output-manualchunks
- three-mesh-bvh: https://www.npmjs.com/package/three-mesh-bvh
- Rapier docs: https://rapier.rs/docs/
- KayKit Medieval Builder Pack: https://kaylousberg.itch.io/kaykit-medieval-builder-pack
- Kenney assets: https://kenney.nl/assets
- Quaternius assets: https://quaternius.com/
- Poly Pizza: https://poly.pizza/

Educational/reference sources:

- Discover three.js free book: https://discoverthreejs.com/book/
- Three.js Journey course: https://threejs-journey.com/lessons/introduction
- Three.js Resources course/resource directory: https://threejsresources.com/
