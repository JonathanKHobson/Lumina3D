# Lumina3D — Future Refactor Plan

Created: 2026-05-19 (maintenance/audit pass)
Last updated: 2026-05-19

This document captures the full refactor strategy for reducing `main.js` and making the project easier to extend with new levels, Cubelings, and mechanics. It is a planning document — do not try to execute all phases at once.

---

## A. Current Problem Summary

`src/main.js` is approximately 5,300 lines and contains all of the following:

- Three.js renderer and camera setup
- Asset loader (OBJ/MTL/GLTF)
- Game loop (`tick`)
- Keyboard input handling
- Camera follow and yaw easing
- Collision detection and scene collider registry
- HUD DOM references (~30 selectors)
- `updateHud*` display functions
- Global `state` object (all scenes, all actors, all subsystems)
- State factory functions (`createActorState`, `createCelebrationState`, etc.)
- Scene flow for Tutorial, Home Intro, Level One, and Level Two
- Frog AI patrol and celebration logic
- Possession/transfer logic
- Speech bubble queue and display
- Love Letter reveal, lesson, and collection flow
- Particle/sparkle/heart effects
- Debug editor panel
- Test hook (`render_game_to_text`)

This is manageable at prototype scale, but each new level and Cubeling makes the file harder to search, modify, and debug.

---

## B. Refactor Goals

1. Make it easy to add a new level by creating two files (`levels/levelN.js` + `scenes/levelNScene.js`) and a few lines in `main.js`.
2. Make it easy to add a new Cubeling by following a pattern in `actors/` and `systems/`.
3. Make button/mechanism logic reusable across levels without copy-pasting.
4. Make each scene independently testable without needing to load the full game.
5. Reduce bugs caused by asset alignment, collider placement, scene-state coupling, and missed resets.
6. Preserve all gameplay behavior throughout — no mechanics should change during a refactor phase.
7. Do one phase at a time with smoke-test verification after each. Avoid a one-shot full rewrite unless a future session explicitly chooses that.

---

## C. Refactor Evaluation And Prioritization

Claude's original refactor plan is directionally right: `main.js` is the editing bottleneck, while the current extracted modules are mostly layout data, asset config, and scene builders. The important correction is priority. Do not chase the full target structure immediately. The next refactor work should remove low-risk data/debug/camera chunks first, and delay collision, dialogue, scene-flow, and Love Letter systems until test coverage is tighter.

Near-term success is not "`main.js` under 900 lines." Near-term success is: new levels and mechanics stop adding large new blocks to `main.js`.

### Priority Matrix

| Refactor slice | Impact | Effort | Risk | Status |
|---|---:|---:|---:|---|
| Move Love Letter IDs/messages to `src/content/loveLetters.js` | Medium | Low | Low | ✓ Done 2026-05-19 |
| Move tutorial/Frog Echo/Totem dialogue to `src/content/dialogue.js` | Medium | Low | Low-Med | ✓ Done 2026-05-19 (also moved STEP_IDS, TUTORIAL_STEPS, SPEECH_STEPS, FREE_PLAY_PROMPT, GUIDED_STEP_COUNT → tutorialLevel.js) |
| Remove/ignore AppleDouble `._*` source noise if safe | Medium | Low | Low | ✓ Done 2026-05-19 (.gitignore created) |
| Extract debug/dev editor to `src/debug/devEditor.js` | High | Medium | Medium | ✓ Done 2026-05-19 (−481 lines from main.js) |
| Extract camera update/rotation to `src/systems/cameraSystem.js` | Medium | Low | Low | ✓ Done 2026-05-19 (applyCameraUpdate, stepCameraYaw, cameraRelativeDir, getCameraFacingDirection) |
| Extract state factory helpers to `src/state/gameState.js` | Medium | Medium | Medium | ✓ Done 2026-05-19 |
| Extract particles to `src/systems/particleSystem.js` | Medium | Medium | Medium | ✓ Done 2026-05-19 |
| Extract scene flow per scene | High | High | High | ✓ Done 2026-05-19 (scene-shell flow extracted one scene at a time; guided/tutorial systems remain in main until system-specific passes) |
| Extract button/mechanism system | High | Medium | Medium-High | Partial ✓ 2026-05-19 (`buttonSystem.js` persistent blue-button press rules + `buttonMarker.js`; full red/held mechanisms still future) |
| Extract dialogue system | High | Medium | High | Partial ✓ 2026-05-19 (`dialogueSystem.js` owns speech queue/state; Home note/debounce and dialogue triggers remain in scene logic) |
| Extract collision/surface system | Very High | High | Very High | Partial ✓ 2026-05-19 (pure helpers only); full collision/surface remains delayed |
| Extract Love Letter system | High | High | High | Delay — last major extraction; coupled to celebration, messages, UI, scene completion |
| Extract UI/HUD helpers | Medium | Medium | Medium | Partial ✓ 2026-05-19 (`ui/hud.js` DOM refs, labels, modals, overlays, speech bubble placement) |
| Extract test/debug hooks | Medium | Low-Med | Low | ✓ Done 2026-05-19 (`debug/testHooks.js`, `debug/visibleAssets.js`) |
| Extract renderer/view setup | Medium | Medium | Low-Med | ✓ Done 2026-05-19 (`core/renderer.js`, `markers.js`, `actors.js`, `syncMeshes.js`, `revealVisibility.js`) |
| Extract Frog AI patrol system | Medium | Medium | Medium | ✓ Done 2026-05-19 (`frogAiSystem.js`; collision/movement remain callbacks owned by main) |

### Hard Refactor Rule

Do not combine collision/surface refactors, scene-flow refactors, and active Level Two mechanic work in the same pass. That combination is exactly how alignment, timing, and collision bugs become hard to isolate.

---

## D. Proposed Target Structure

```
src/
├── main.js                    ← bootstrap + orchestrator only (long-term direction, not the next-pass metric)
├── styles.css
│
├── config/
│   ├── assets.js              ← asset registry (keep as-is)
│   ├── constants.js           ← shared physics/geometry constants ONLY
│   └── scenes.js              ← scene ID enum (keep as-is)
│
├── content/                   ← NEW: story/copy data, never physics
│   ├── loveLetters.js         ← Love Letter IDs + LOVE_LETTER_MESSAGES
│   └── dialogue.js            ← FROG_ECHO_LINES, FROG_TOTEM_LINES, tutorial copy
│
├── levels/                    ← layout data per level (keep pattern, extend)
│   ├── tutorialLevel.js
│   ├── homeIntroLevel.js
│   ├── levelOne.js
│   ├── levelTwo.js
│   └── levelThree.js          ← future
│
├── scenes/                    ← scene builder functions (keep pattern, extend)
│   ├── tutorialScene.js
│   ├── homeIntroScene.js
│   ├── levelOneScene.js
│   ├── levelTwoScene.js
│   └── levelThreeScene.js     ← future
│
├── systems/                   ← NEW: one file per gameplay system
│   ├── inputSystem.js         ← keyboard state, key-to-action mapping
│   ├── cameraSystem.js        ← camera follow + yaw easing
│   ├── collisionSystem.js     ← scene collider registry + AABB helpers
│   ├── frogAi.js              ← frog patrol AI behavior and state updates
│   ├── buttonSystem.js        ← blue (persistent) and red (held) button logic
│   ├── platformSystem.js      ← moving platform/elevator update
│   ├── cubelingSystem.js      ← possession, transfer, unlock, totem collection
│   ├── recallSystem.js        ← Cubeling Recall mechanics (Level Two+)
│   ├── dialogueSystem.js      ← speech queue, bubble display, cooldowns
│   ├── loveLetterSystem.js    ← reveal, lesson, collection, message flow
│   ├── particleSystem.js      ← sparkle, heart burst, celebration particles
│   └── celebrationSystem.js  ← post-collection celebration orbit/hops
│
├── actors/                    ← NEW: per-actor state helpers and behavior
│   ├── human.js               ← human state shape, movement helpers
│   ├── frog.js                ← frog state shape, patrol AI, jump logic
│   └── elephant.js            ← elephant state shape (future)
│
├── ui/                        ← NEW: DOM wiring and display functions
│   ├── hud.js                 ← hud DOM refs + updateHud* functions
│   ├── modals.js              ← skip modal, love letter modal, level-complete modal
│   └── titleCards.js          ← title card + fade overlay display logic
│
├── state/                     ← NEW: state factory and initial shape builders
│   └── gameState.js           ← createActorState, createCelebrationState, initial state literal
│
└── debug/
    ├── debugLevelSelect.js    ← debug scene-jump shortcuts (keep as-is)
    ├── devEditor.js           ← dev editor panel, selection, export, collider helpers
    └── smokeHooks.js          ← render_game_to_text and test-only state accessors
```

---

## E. Recommended Refactor Sequence

Work one phase at a time. Smoke-test after each.

### Phase 1 — Content Extraction ✓ DONE (2026-05-19)

Moved story/copy data out of `constants.js`.

- `src/content/loveLetters.js` — `TUTORIAL_LOVE_LETTER_ID`, `LEVEL_ONE_LOVE_LETTER_ID`, `REWARD_NAME`, `LOVE_LETTER_MESSAGES`
- `src/content/dialogue.js` — `FROG_ECHO_LINES`, `FROG_TOTEM_LINES`
- `src/levels/tutorialLevel.js` — `STEP_IDS`, `GUIDED_STEP_COUNT`, `TUTORIAL_STEPS`, `FREE_PLAY_PROMPT`, `SPEECH_STEPS`
- `src/config/constants.js` trimmed to physics/geometry only

---

### Phase 2 — Workspace Hygiene ✓ DONE (2026-05-19)

`.gitignore` created at project root covering `node_modules/`, `dist/`, `test-output/`, `coverage/`, `archive/`, `.DS_Store`, `._*`, `.env`. AppleDouble files and local backup archives are excluded from future tracking.

---

### Phase 3 — Debug Editor Extraction ✓ DONE (2026-05-19)

Moved the dev editor cluster out of `main.js` into `src/debug/devEditor.js`. **−481 lines** from `main.js`.

**What moved:**
- Module-level: `DEG_15`, `DEV_EDITOR_COLLISION_COLORS`, `DEV_EDITOR_COLLIDERS` map, `devEditorSelectedMesh`, `devEditorSelectionHelper`
- All dev editor functions: `toggleDevEditorPanel`, `setDevEditorOpen`, `clearColliderHelpers`, `toggleDevEditorSnap`, `toggleDevEditorColliders`, `handleExportClick`, `selectById`, `handlePanelClick`, `updatePanel`, `inferAsset`, `inferCategory`, `inferCollisionExpected`, `collectEditableObjects`, `syncDevEditorSelectionToScene`, `syncDevEditorColliderHelpers`, `getSelectedRow`, `moveSelected`, `rotateSelected`, `applyGridSnap`, `handleDevEditorKeyDown`
- All dev editor event listener wiring (previously in `init()`)

**What stayed in `main.js`:**
- `getCurrentEditableSceneMeshes()` — owns the mesh collection references, passed as `getSceneMeshes` callback to `initDevEditor`
- `state.devEditor` shape (unchanged)
- `hud.devEditor*` DOM refs (passed to `initDevEditor` via the shared `hud` object)

**Setup API:**
```js
initDevEditor({ state, scene, hud, getSceneMeshes, sceneNav, onUpdateHud, onShowPrompt })
```

---

### Phase 4 — Camera System Extraction ✓ DONE (2026-05-19)

Moved camera follow, yaw easing, rotation step, camera-relative input direction, and camera-facing helper into `src/systems/cameraSystem.js`.

**What moved:**
- `cameraTarget`, `cameraOffset`, `cameraYawAxis` (Three.js vectors — owned by cameraSystem)
- `CAMERA_FOLLOW_EASE`, `CAMERA_ROTATE_STEP`, `CAMERA_YAW_EASE` (consumed internally)
- `applyCameraUpdate(camera, state, dt, activeActor, bounds)` — smooth follow + yaw easing
- `stepCameraYaw(state, direction)` — yaw increment step (tutorial hook stays in `main.js`)
- `cameraRelativeDir(inputX, inputZ, cameraYaw)` — camera-space → world-space direction
- `getCameraFacingDirection(camera, human)` — celebration facing helper

**What stayed in `main.js`:**
- `camera` object (owned by renderer)
- `resize()` (touches camera projection matrix)
- `rotateCamera()` wrapper (calls `stepCameraYaw` + tutorial side-effect)
- `worldToScreen()` (projection helper used by HUD arrow)
- `normalizeAngle()` (also used by dev editor rotation)

---

### Phase 5 — State Factory Extraction ✓ DONE (2026-05-19)

Move state factory helpers to `src/state/gameState.js`.

- Moved `createActorState`, `createLoveLetterAttentionState`, `createLoveLetterMessageState`, `createCelebrationState`, `createHomeState`, `createLevelOneState`, and `createLevelTwoState`.
- Did not move the full global `state` object yet.
- Kept factory inputs explicit, especially Love Letter IDs and scene phase.

**Why fifth:** This makes future scene/system extraction easier without changing runtime ownership.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, and Level Two collider validators pass. Resets for Tutorial, Home, Level One, and Level Two still restore the same state fields and render text.

---

### Phase 6 — Particle System Extraction ✓ DONE (2026-05-19)

Move sparkle, heart, landing puff, transfer, and Love Letter attention particle creation/update loops into `src/systems/particleSystem.js`.

- Moved particle lifecycle cleanup/update into `clearParticles` and `updateParticles`.
- Moved particle creation helpers for celebration hearts/confetti, Love Letter hearts, transfer sparkles, reveal sparkles, and landing puffs.
- Passed required Three.js scene/state/asset helpers through an explicit `particleContext` from `main.js`.
- Kept gameplay timing decisions in `main.js`; Love Letter attention reminder logic still decides when to spawn particles because it also owns speech and reminder state.
- Did not store unreset particle state in module scope.

**Why sixth:** Particles are visible but less tied to puzzle rules than dialogue, collision, or scene flow.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, Level Two collider validators, and deeper Home/Level One plus Level Two Playwright smokes pass. Screenshots were inspected for Love Letter completion and Level Two ramp activation coverage.

---

### Phase 6b — Scene Flow Extraction, Level Two First ✓ DONE (2026-05-19)

Moved only the Level Two scene-flow orchestration into `src/scenes/levelTwoFlow.js`.

- Moved Level Two start/reset/title/arrival/play flow into `startLevelTwoScene`, `updateLevelTwoSceneFlow`, and `resetLevelTwoSceneFlow`.
- Kept Level Two interactions, ledge/ramp mechanics, collision/surface handling, button/totem behavior, HUD, particles, and render text in `main.js`.
- `main.js` keeps thin wrappers plus an explicit `levelTwoFlowContext()` adapter so the flow module has no import path back into `main.js`.
- Did not extract Home, Level One, or Tutorial flow in this pass.

**Why Level Two first:** It has a simple title/arrival/play scene shell and strong smoke coverage, while Home note/exit flow and Level One completion timing have been more fragile.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, Level Two collider validators, Level Two shell smoke, Level Two Frog/Totem smoke, Level Two ramp-access smoke, and the full Home/Level One regression smoke all pass. Screenshots were inspected for Level Two title/start/ramp flow and Level One title regression coverage.

---

### Phase 6c — Scene Flow Extraction, Level One ✓ DONE (2026-05-19)

Moved only the Level One scene-flow orchestration into `src/scenes/levelOneFlow.js`.

- Moved Level One start/reset/title/arrival/play flow into `startLevelOneScene`, `updateLevelOneSceneFlow`, and `resetLevelOneSceneFlow`.
- Kept Level One bridge reveal timing, soft hints, button/water/Love Letter behavior, collision/surface handling, HUD, particles, and render text in `main.js`.
- `main.js` keeps a thin `levelOneFlowContext()` adapter plus a separate `updateLevelOneFlowEffects(dt)` callback for bridge-reveal animation timing and hint cadence.
- Did not extract Home or Tutorial flow in this pass.

**Why Level One second:** Its Home exit/title/arrival path has regression coverage, but its gameplay logic is still coupled to bridge, water, and Love Letter behavior. Moving only the scene shell avoids mixing handoff refactor with active puzzle mechanics.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, Level Two collider validators, the full Home/Level One regression smoke, Level Two shell smoke, and Level Two ramp-access smoke all pass. Screenshots were inspected for Level One title/start/bridge-complete states and Level Two title regression coverage.

---

### Phase 6d — Scene Flow Extraction, Home Intro ✓ DONE (2026-05-19)

Moved only the Home Intro scene-flow orchestration into `src/scenes/homeIntroFlow.js`.

- Moved Home start, arrival cinematic, play handoff, exit confirmation state, exit fade, and Level One transition flow.
- Kept Home note proximity/debounce, trail hints, wrong-way dialogue, scenery/collision, HUD, render text, and shared input dispatch in `main.js`.
- `main.js` keeps a thin `homeFlowContext()` adapter and wrapper functions for DOM/key event handlers.
- Did not extract Tutorial flow in this pass.

**Why Home third:** Home has already had fragile note and exit-confirmation bugs, so the flow module deliberately avoids taking over note-zone and hint behavior.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, Level Two collider validators, and the full Home/Level One regression smoke all pass. Screenshots were inspected for Home arrival, door note, exit confirmation, and Level One title handoff.

---

### Phase 6e — Scene Flow Extraction, Tutorial Shell ✓ DONE (2026-05-19)

Moved only the Tutorial reset/start shell into `src/scenes/tutorialFlow.js`.

- Moved Tutorial scene reset state, actor reset, unlock reset, reveal reset, speech reset, celebration reset, particle cleanup, and visible reward/barrier cleanup into `resetTutorialSceneFlow`.
- Kept guided step progression, tutorial reveal gates, skip nudges, Frog Echo/Totem proximity, possession, collision, dialogue sequencing, Love Letter behavior, and completion flow in `main.js`.
- `main.js` keeps a thin `tutorialFlowContext()` adapter and still owns route selection in `resetLevel()`.

**Why shell-only:** Tutorial is the most coupled scene because its flow is partly a state machine and partly a teaching system. Moving reset/start first reduces `main.js` without mixing scene-flow extraction with dialogue/reveal-system extraction.

**Verification:** `npm run build`, scene smoke scripts for Tutorial/Home/Level One/Level Two, Level Two collider validators, the full Home/Level One regression smoke, and Level Two ramp-access smoke all pass. Screenshots were inspected for Tutorial start/reset, Tutorial Love Letter popup, Home exit handoff, and Level Two ramp completion coverage.

---

### Phase 7 — Level-Specific Constant Extraction

Move constants that belong to individual levels into their level files.

- `LEVEL_ONE_FROG_WATER_SPEECH_COOLDOWN` is already in `levelOne.js` (done 2026-05-19).
- Continue with any remaining `LEVEL_ONE_*`, `HOME_*`, `TUTORIAL_*` values in `constants.js` that are not used by other shared exports.
- After each move: grep for all usages, confirm no references remain in `constants.js`, verify no circular imports.

**Why seventh:** Lower-risk after content registries and state factories are separated.

**Verification:** All 4 scenes load; run collider validators.

---

### Phase 8 — Mechanism Prep Before Red Buttons

Before implementing Elephant red buttons/elevators, extract a minimal mechanism interface.

- Blue button remains persistent activation.
- Red button can later become held/weight activation.
- Do not move collision/surface handling in this phase.

**Why eighth:** Level Two will need red mechanisms soon, but mechanism extraction should not be bundled with collision or elevator movement.

**Verification:** Tutorial blue button, Level One blue button/bridge, and Level Two blue button/ramp still behave exactly as before.

---

### Phase 9 — Runtime View/Test Helper Extraction ✓ DONE (2026-05-19)

Moved low-risk Three.js view setup and test/debug plumbing out of `main.js`.

- `src/core/renderer.js` owns renderer/camera/lights bootstrap.
- `src/core/markers.js` owns generated marker/ring setup.
- `src/core/actors.js` owns initial human/Frog/Echo/Totem mesh construction and material treatment.
- `src/core/buttonMarker.js` owns generated blue-button marker construction.
- `src/core/syncMeshes.js` owns actor and marker mesh syncing from state.
- `src/core/revealVisibility.js` owns reveal/visibility syncing for scene groups, tutorial floors/barriers, Level One bridge visuals, and Level Two interactive visibility.
- `src/debug/testHooks.js` owns browser test window hooks: `render_game_to_text`, `advanceTime`, `set_game_test_pause`, and Level Two setup helpers.
- `src/debug/visibleAssets.js` owns render-text visible asset lists.
- `src/state/persistence.js` owns Cubeling unlock localStorage helpers.

**Boundary:** These are render/test/state helpers only. They do not own movement, collision response, possession, Frog jump routing, Love Letter collection, or scene-specific interactions.

**Verification:** `npm run build`, scene smokes, Level Two Frog/Totem smoke, and Home/Level One smoke pass. A Frog AI callback signature bug was caught by Home/Level One and fixed before continuing.

---

### Phase 10 — Tutorial Status Helper Extraction ✓ DONE (2026-05-19)

Moved pure tutorial status helpers into `src/systems/tutorialSystem.js`.

- `currentTutorialStepId`
- `tutorialStepBefore`
- `tutorialHasLearned`
- `shouldRequestTutorialSkip`
- `recordTutorialNudgeState`
- `frogUnlockStepForState`

**Boundary:** Tutorial reveal side effects, skip modal behavior, Echo/Totem proximity, possession, Frog jump, and Love Letter logic remain in `main.js`.

---

### Phase 11 — Frog AI Patrol Extraction ✓ DONE (2026-05-19)

Moved Frog patrol and celebration target-selection/update logic into `src/systems/frogAiSystem.js`.

**Boundary:** The AI system receives callbacks for movement and collision checks. It does not own `moveActor`, scene colliders, barriers, water, ledges, ramps, or actor surface height.

**Bug caught/fixed:** Initial extraction passed old wrapper functions into the module, causing the inactive Frog to choose a target on the wrong side of the tutorial barrier. The full Home/Level One smoke caught this; the adapter now passes system functions with the expected `(context, side)` signature.

---

### Later High-Risk Extractions

Delay these until the lower-risk phases are complete and the smoke suite covers the affected behavior:

- Full dialogue trigger extraction: high risk because prior Home note/dialogue retrigger loops were severe.
- Full collision/surface system: very high risk because it owns bridge, ramp, ledge, actor height, and floor-blocking bugs.
- Love Letter system: high risk because it touches reward visibility, messages, celebration, completion modal, and scene transitions.
- Actor extraction: useful later, but safer after the systems that consume actor state have stable boundaries.
- Full `renderGameToText` payload extraction: useful, but large context surface; keep test coverage strong before moving it.

### Decisions locked from this review

- `REWARD_NAME` belongs to the same Love Letter content extraction scope as `LOVE_LETTER_MESSAGES` and moves in Phase 1 unless a blocking dependency is discovered in implementation.
- Scene-flow extraction is no longer the third phase; it is delayed until lower-risk extractions are complete.
- Do not combine collider refactors with scene routing, scene flow, or active Level Two mechanic changes in the same phase.

---

## F. Plan Review Notes (Locked Corrections)

- `REWARD_NAME` handling is now consistent between Phase 1 and the Next Task and is treated as content data, not gameplay logic.
- The proposed structure now includes `src/systems/frogAi.js` and `src/debug/devEditor.js` so target structure and extraction targets match.
- Extracted systems must avoid hidden module-level mutable state. Each system module should expose create/update/reset (or equivalent) hooks and no behavior that depends on unscoped globals.
- The `main.js` line budget target is long-term only. Early refactors should be judged by reduced editing friction and fewer new additions to `main.js`, not by a hard line-count target.
- Add scene-sequencing validation to every phase so title card timing and control handoff order do not regress.

---

## G. Risk Checklist

Before each phase, check for:

- **Import cycles** — `constants.js` is imported by `levelOne.js`; `levelOne.js` must not import back from `constants.js` if `constants.js` depends on it.
- **Computed object keys** — moving a constant that appears as `[CONSTANT]:` in an object literal in the same file will silently produce an `undefined` key at runtime. Always grep the file being edited before removing an export.
- **Moving a constant without its registry** — if a constant is used as a key inside a data structure (`LOVE_LETTER_MESSAGES`, `SPEECH_STEPS`, etc.), move the whole cluster together.
- **AppleDouble noise** — `._*` files are macOS metadata noise and should not be treated as source files during search, refactor, or script inventories.
- **Scene state reset bugs** — any extracted system that holds module-level state must be reset on scene change or must take state as a parameter.
- **Gameplay-order drift** — do not change title card timing or scene transition/control-order sequence unless explicitly targeted for that phase.
- **Collision behavior changes** — do not refactor collider registration and scene loading in the same pass.
- **Over-combined high-risk work** — do not combine collision/surface extraction, scene-flow extraction, and active Level Two mechanics in one pass.
- **Actor height/grounding** — `SURFACE_Y`, `FLOOR_TARGET`, actor lift values must not be touched during structural refactors.
- **HUD references** — DOM selectors break silently at runtime; verify the HUD after any `ui/` extraction.
- **Debug shortcuts** — confirm keys 1–4 still trigger scene loads after any scene-routing change.
- **Asset paths** — Vite resolves `/assets/...` from `public/`; do not change asset import patterns.

---

## H. Verification Checklist (run after every phase)

- [ ] `npm run dev` starts with no console errors.
- [ ] No import/export errors in browser console.
- [ ] Before execution, confirm plan coherence by checking for conflicting symbol scopes and naming references within this document.
- [ ] Before first code phase, confirm Task 1A moves the Love Letter content cluster together and leaves dialogue extraction for the next content pass.
- [ ] Debug shortcuts 1–4 load correct scenes.
- [ ] Tutorial loads and completes: movement, frog possession, jump, button, Love Letter message, tutorial-complete modal.
- [ ] Home Intro loads: door note, trail guidance, exit confirmation, fade to Level One.
- [ ] Level One loads: frog water-block dialogue at correct cooldown, bridge reveal, Love Letter message, level-complete modal.
- [ ] Level Two loads: title, arrival, Frog available, Elephant Totem visible, blue button on ledge.
- [ ] Frog patrol and celebration behavior unchanged.
- [ ] Run `npm run tools:run-scene-smoke -- tutorial`.
- [ ] Run `npm run tools:run-scene-smoke -- home_intro`.
- [ ] Run `npm run tools:run-scene-smoke -- level_one`.
- [ ] Run `npm run tools:run-scene-smoke -- level_two`.
- [ ] Run `npm run tools:validate-missing-colliders -- level_two`.
- [ ] Run `npm run tools:validate-float-colliders -- level_two`.
- [ ] For UI, dialogue, collision, or scene-flow extraction, also run the deeper Playwright smoke scripts under `test-output/`.
- [ ] After each phase, compare baseline scene-sequencing traces (`title shown`, `player control gained`, `scene transition complete`) for ordering regressions.

---

## I. Recommended Next Refactor Task

**Task 1A: Move all Love Letter IDs and `LOVE_LETTER_MESSAGES` into `src/content/loveLetters.js`.**

This is the first half of Phase 1 and the direct follow-up to the 2026-05-19 maintenance pass. Do this before moving tutorial/Frog Echo/Totem dialogue.

**Steps:**
1. Create `src/content/loveLetters.js`.
2. Move `TUTORIAL_LOVE_LETTER_ID`, `LEVEL_ONE_LOVE_LETTER_ID`, `REWARD_NAME`, and `LOVE_LETTER_MESSAGES` into it.
3. In `constants.js`: remove those four exports entirely (confirm no remaining usages of `[LEVEL_ONE_LOVE_LETTER_ID]` in that file after the move).
4. In `main.js`: add `import { ... } from "./content/loveLetters.js"` and remove the four names from the `constants.js` import block.
5. Verify: Tutorial Love Letter message correct, Level One Love Letter message correct, no console errors.

**Why this is safe:** pure data relocation, no logic, no circular deps (the new file has no imports from `levelOne.js`).

Implementation guardrail: no gameplay logic changes are allowed during this extraction phase; if behavior adjustments are required, split them into a separate follow-up task and keep refactor scope unchanged.
