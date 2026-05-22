# Lumina3D Bug Report Library

This is the living bug report file. Update it when a bug is found, fixed, or intentionally deferred.

Use `progress.md` for session history, `backlog.md` for deferred work, and `docs/game-design-handbook/11_bug_report_library.md` for recurring bug patterns and prevention rules.

## 2026-05-18 - Asset Orientation And Alignment Drift

- Status: fixed in prior passes; prevention rule active.
- Scene: Home, Tutorial, Level One.
- Symptom: house faced the wrong direction; bridge and barrier pieces were visually misaligned.
- Root cause: asset origin/orientation did not match gameplay intent, and visual placement was assumed before screenshot verification.
- Fix: rotated/repositioned assets, anchored barrier caps by column edge, and added explicit bridge deck/proxy tuning.
- Prevention rule: every new crossing/building/barrier asset needs screenshot QA from default camera plus an explicit placement note about what its anchor means.
- Verification: prior Home/Level One smoke and screenshots.
- Follow-up: apply the same rule before any Level Two elevator/platform asset is accepted.

## 2026-05-18 - Missing Or Weak Scene Collision

- Status: fixed for current Home/Level One; prevention rule active.
- Scene: Home, Level One.
- Symptom: player could walk through the house; bridge visuals did not initially behave like a walkable surface.
- Root cause: visual mesh presence was treated as enough, but gameplay needs separate collision/walkable proxies.
- Fix: added labeled Home house colliders and explicit bridge walkable deck/proxy.
- Prevention rule: every solid-looking large object gets a collider label and every walkable visual platform gets a walkable proxy.
- Verification: `test-output/home-level-one/smoke.mjs` passed 60 checks after the small bug-fix pass.
- Follow-up: Level Two elevated terrain and platforms must expose collider/proxy state in `render_game_to_text()`.

## 2026-05-18 - Rapid Dialogue/Trigger Loop

- Status: fixed; prevention rule active.
- Scene: Home.
- Symptom: door note/dialogue rapidly retriggered and became unreadable.
- Root cause: trigger behavior fired continuously while inside the interaction zone instead of once on zone entry.
- Fix: track note-zone inside state and note open count; keep note stable while inside the zone.
- Prevention rule: interaction text should trigger on enter-zone, not every update tick; repeated hints require cooldowns or one-shot flags.
- Verification: Home smoke checks note open count remains stable while standing in the zone.
- Follow-up: use this same enter/exit-zone pattern for Level Two Echo, Totem, red button feedback, and recall prompt.

## 2026-05-18 - Noisy Or Premature Guidance Effects

- Status: current Home heart trail disabled; future treatment deferred.
- Scene: Home.
- Symptom: heart trail appeared too early and looked like a jet stream/red dots instead of a gentle cue.
- Root cause: effect density/timing was not tied tightly enough to player need and did not read well at camera distance.
- Fix: disabled Home trail hearts and relied on dialogue/arrow signposting.
- Prevention rule: effects need a state reason, delay, cooldown, and screenshot validation; if an effect looks bad quickly, disable it rather than polishing around it.
- Verification: Home smoke confirms trail hearts disabled and no heart spam.
- Follow-up: revisit only when there is time for custom heart/petal motion.

## 2026-05-18 - Autonomous Cubeling Path Blocking

- Status: fixed for Frog; prevention rule active.
- Scene: Tutorial.
- Symptom: autonomous Frog could block the doorway or celebration framing.
- Root cause: companion-follow behavior pulled the Frog toward the main character.
- Fix: changed Frog autonomy to independent side-based patrol and off-character celebration perch.
- Prevention rule: Cubelings should have their own local idle/patrol zones and should not cluster around the main character unless a future mechanic explicitly calls for it.
- Verification: Tutorial smoke checks Frog does not use human as target.
- Follow-up: Elephant should mostly idle or settle in place, not patrol toward the player.

## 2026-05-18 - Scene Title Timing

- Status: fixed for Home -> Level One; superseded by the 2026-05-20 title-card readiness fix for Level One/Level Two timing.
- Scene: Home, Level One.
- Symptom: Level One title appeared while still effectively leaving the Home scene.
- Root cause: title card phase lived in Home instead of Level One.
- Fix: Home now fades/leaves first, then Level One starts in its own `title` phase.
- Prevention rule: a title card belongs to the scene it introduces; scene phases should make this explicit.
- Verification: `test-output/home-level-one/smoke.mjs` checks Home fade before `scene.id === "level_one"` title.
- Follow-up: keep title-card timing covered in scene smokes when new scenes are added.

## 2026-05-20 - Title Card Fallback Flashed Wrong Scene Name

- Status: fixed in the pre-Level-3 readiness checkpoint.
- Scene: Level Two, Level One, Level Three shell.
- Symptom: Level Two could flash `Level One` during title-card fade/transition frames after `titleCardText` was cleared.
- Root cause: the HUD title renderer supplied `"Level One"` as a fallback whenever `state.scene.titleCardText` was empty.
- Fix: removed the fallback, made empty title text render as an empty string, and changed Level One/Level Two title timing so the card appears during arrival/walk-in instead of before movement.
- Prevention rule: title text should come from scene state or registry metadata, never from another scene's display name as a UI fallback.
- Verification: scene smokes assert Level Two never renders `Level One` as title text and that Level One/Level Two title cards clear after the title window.
- Follow-up: keep player control disabled until arrival completes in every new scene-flow shell.

## 2026-05-22 - Level Three Frog Water Reset Overreach

- Status: fixed in Phase 3A; prevention rule active.
- Scene: Level Three.
- Symptom/risk: controlled Frog walking into water in the opening lane triggered the cozy splash reset. That made normal movement mistakes feel like a failed jump/timing miss and weakened the rule that water is a boundary unless Frog intentionally hops to a valid leaf.
- Root cause: Phase 2A used the lane water collider as both a movement blocker and a future failed-lily timing reset trigger.
- Fix: ordinary Frog walking into Level Three water now blocks movement and shows a gentle hint. `resetLevelThreeFrogLane()` remains available for future intentional failed moving-lily timing, but walking-water collision no longer calls it. Level Three lily pads were also enlarged so the Frog visibly fits on the landing surface.
- Prevention rule: separate blocked movement from failed timing. Walking into water should block; missed moving-lily timing may reset only inside a specific authored timing challenge.
- Verification: Phase 3A fixture coverage passed with `npm run tools:run-fixture -- level_three level_three_crocodile_actor --pretty` and `npm run tools:run-fixture -- level_three level_three_frog_lane_route --pretty`; Frog walking-water blocking does not increment `frogLaneResetCount`, and the manual lily-pad route still works.
- Follow-up: if Phase 2B adds moving lily pads, wire splash reset to explicit timing-miss detection rather than generic water collision.

## 2026-05-21 - Level Three Placeholder Identity Drift

- Status: fixed for Phase 1.5; prevention rule active.
- Scene: Level Three.
- Symptom/risk: generated lake-shell placeholders can look correct in screenshots but drift out of `render_game_to_text()`, the runtime Dev Editor, `/editor/`, level manifests, or smoke fixtures. Moving-looking placeholders such as lily pads, raft markers, and bridge destinations can also imply active collision/mechanics before those systems exist.
- Root cause: Phase 1 uses generated geometry instead of imported asset packs, so stable names, editor metadata, source references, and inactive-mechanic flags must be applied deliberately.
- Fix: Phase 1.5 added source-backed island marker data, runtime Dev Editor metadata for generated placeholders, `/editor/` records for Level Three shell objects, manifest/object-list entries, and render-text rows for shell IDs and inactive future state. The Love Letter Cliff zone marker and actual cliff placeholder now use distinct object IDs to avoid duplicate editor records.
- Prevention rule: every future Level Three placeholder that matters to gameplay planning needs a stable source ID, runtime mesh name, editor/catalog record, render-text row, and explicit inactive/visual-only status until its mechanic is implemented.
- Verification: Level Three scene smoke, fixture smoke, missing/float collider validators, manifest/object list, editor-sync validation, `/editor/` smoke, a focused Level Three runtime Dev Editor probe, and screenshot QA all identify the key shell objects. Editor-sync still reports non-blocking `LEVEL_THREE_PROPS` array-index source-reference warnings.
- Follow-up: when Phase 2 turns lily pads, green button presses, or raft states into mechanics, update this metadata rather than replacing it with parallel ad hoc state.

## 2026-05-21 - Level Three Shell Visual Contract Drift

- Status: fixed in the shell contract repair; prevention rule active.
- Scene: Level Three.
- Symptom/risk: the Phase 1 shell could teach the wrong spatial language before mechanics existed. Start Island arrival visually crossed water, lily pads read too close to or on land, generated cylinder buttons did not match the established KayKit button family, and sand path tiles looked like accidental or unfinished routes.
- Root cause: placeholder geometry and path tiles were used as authoring markers, but in-game visuals still communicate rules to the player even when mechanics are inactive.
- Fix: added a left-edge grass/shore connection to Start Island, removed unmotivated Level Three path tiles, moved the Frog lane/Totem Winch spacing apart, placed all lily pad centers on water tiles, extracted the established Level One lily pad visual for Level Three reuse, and replaced generated button cylinders with KayKit two-part button geometry. Green buttons use the same geometry with a controlled green material variant because no green button OBJ asset is present.
- Prevention rule: placeholder visuals must use the same visual grammar as implemented mechanics. Do not use sand tiles, generated cylinders, or near-land floating objects as future-mechanism markers if they teach the wrong traversal or interaction contract.
- Verification: build, Level Three manifest/object listing, scene smoke, fixture, missing/float collider validators, editor-sync validation, Tutorial/Home/Level One/Level Two regression smokes, and screenshot QA in `test-output/level-three-shell-contract-repair/` passed. Editor-sync still reports the known non-blocking `LEVEL_THREE_PROPS` array-index source-reference warnings.
- Follow-up: Phase 2 can build the opening Crocodile Totem puzzle on this repaired shell, but should keep Crocodile control, central bridge cycling, red-button behavior, cargo, elevators, and final Love Letter routing out of scope.

## 2026-05-19 - Refactor Lesson: Module Extraction With Pre-Init Call Sites

- Status: caught and fixed during 2026-05-19 debug editor extraction.
- Scene: n/a (refactor regression, not a gameplay bug).
- Symptom: game failed to load after moving `updateDevEditorPanel` out of `main.js` into `devEditor.js`. Two distinct failures:
  1. `ReferenceError: updateDevEditorPanel is not defined` — `updateHud` in `main.js` called it by name after the move but before the import was added.
  2. `TypeError: Cannot read properties of undefined (reading 'devEditorPanel')` — `updateHud` is called during `init()` before `initDevEditor()` runs, so `_hud` was still `undefined` inside the extracted module.
- Root cause: Two separate oversights compounded. First, a call site in `updateHud` was not updated when the function moved. Second, the module used lazy-init module-level refs (`_hud`, `_state`) set by `initDevEditor()`, but `updateHud` was called earlier in `init()` before that setup ran.
- Fix: exported `updateDevEditorPanel` from `devEditor.js`, added it to the import in `main.js`, and added a `!_hud` early-return guard at the top of the function so pre-init calls are no-ops.
- Prevention rule: when extracting a function that is called from `main.js`, grep every call site — not only the ones you moved. Functions like `updateHud` that are called early in `init()` may reference the extracted function before the setup entry point (`initDevEditor`) has run. Any exported function that uses lazy-init module refs needs a `!_ctx` / `!_hud` guard at the top.
- Verification: `npm run dev`, no console errors at boot, game renders correctly, Dev Editor panel opens via F2.

## 2026-05-19 - Refactor Lesson: Hidden Computed-Key Dependency

- Status: caught and corrected during 2026-05-19 maintenance pass; prevention rule added.
- Scene: n/a (refactor regression, not a gameplay bug).
- Symptom: game failed to load after `LEVEL_ONE_LOVE_LETTER_ID` was moved from `constants.js` to `levelOne.js`; `LOVE_LETTER_MESSAGES` in `constants.js` uses it as a computed object key (`[LEVEL_ONE_LOVE_LETTER_ID]: { ... }`), so removing the export from `constants.js` left that key as `undefined` at module evaluation time.
- Root cause: the constant was moved based on its name alone without checking whether it was also used as an object key inside the same file. Computed property keys are easy to miss with a visual scan because they are tucked inside a data structure rather than appearing as a top-level call.
- Fix: restored `LEVEL_ONE_LOVE_LETTER_ID` to `constants.js`. The correct future refactor is to move `LOVE_LETTER_MESSAGES` **and** all Love Letter IDs together into `src/content/loveLetters.js` — not to move the IDs independently.
- Prevention rule: before moving any exported constant, grep all usages in the **same file** first. Check whether the constant appears as an object key (`[CONSTANT]:`), inside a template literal, or as a default value in another export — not only as a named import elsewhere.
- Verification: run `npm run dev`, confirm no console errors, confirm Tutorial and Level One both load and Love Letter messages display correctly.
- Follow-up: move `LOVE_LETTER_MESSAGES` and all Love Letter IDs together to `src/content/loveLetters.js` in the next refactor slice. This is the first item in `backlog.md` under Refactor — Do Now.

## 2026-05-19 - Level Two Raised Platform Step-Off Stuck State

- Status: fixed in the 2026-05-19 Level Two blocker pass.
- Scene: Level Two.
- Symptom: the main character can walk up the blue ramp to the Elephant Cubeling Totem platform, but can get stuck after leaving the raised platform from an edge that is not the ramp.
- Root cause: actor surface state could drop after the character drifted just outside the Totem hill's valid top surface while their collision circle still overlapped the raised hill colliders. Once that happened, later moves could read as blocked in every direction.
- Fix: added a Level Two raised-surface transition guard. The Totem hill now has a smaller safe top-surface area, the blue ramp remains the valid transition/descent path, unsupported raised edges block before the character falls into collider overlap, and a small recovery clamp catches any edge-overlap state that slips through.
- Prevention rule: every raised terrain slice needs explicit tests for walking up, walking down, and attempting unsupported edge exits. If an edge is not a valid descent, block it cleanly before the actor partially clips/falls.
- Verification: `test-output/level-two-ramp-access/smoke.mjs` now checks walk-up, Totem pickup, unsupported edge probe, recovery movement, and walk-back-down. Scene smokes, Level Two validators, Frog/Totem smoke, and Home/Level One regression smoke pass.
- Follow-up: keep this smoke coverage before adding Elephant Echo, Elephant actor behavior, red buttons, elevators, Cubeling Recall, or new raised-platform mechanics.

## 2026-05-19 - Home House Collision Allows Partial Doorway Entry

- Status: open; medium-high priority.
- Scene: Home.
- Symptom: the player can partially step into or visually clip through the house doorway, then hit an invisible blocker deeper inside the house.
- Suspected root cause: house colliders cover the deeper body but leave too much visible doorway/interior entry space before the blocker. The door-note interaction zone and house body collision are not cleanly separated.
- Fix: pending.
- Prevention rule: building colliders should prevent visual entry into closed buildings while leaving an exterior interaction apron for notes, doors, or prompts.
- Verification needed: player cannot step into the doorway/interior, cannot walk through the house from front/side/rear, and can still trigger/read the door note from outside.
- Follow-up: add a clearer visual door note once collision is clean.

## 2026-05-19 - Level Two Blue Ramp Walkable Surface Looks Embedded

- Status: fixed for the current blocker; keep as low-priority visual polish if future screenshots still show clipping.
- Scene: Level Two.
- Symptom: the blue ramp is usable, but the main character can appear inside or swallowed by the ramp instead of walking clearly on top of it.
- Root cause: ramp visual mesh, walkable slope proxy, and actor Y/lift calculation were close enough to function but not giving enough visible clearance on the slope.
- Fix: increased ramp actor lift clearance and tightened the hill/ramp transition rules so the ramp behaves as the valid walkable route rather than a loose overlap with the hill collider.
- Prevention rule: visual ramp assets need a separate walkable slope contract: bottom contact, top contact, slope height function, side blocking, and actor visual clearance.
- Verification: inspected ramp screenshots and passed `test-output/level-two-ramp-access/smoke.mjs`.
- Follow-up: revisit only if human visual review still sees actor/ramp clipping after the next playtest.

## 2026-05-19 - Level Two Red Platform A Elephant Access Trap

- Status: fixed in the 2026-05-19 Red Platform A blocker pass; needs human visual/play review before Elevator B.
- Scene: Level Two.
- Symptom: Red Button A was centered on Red Platform A, the human had to approach too close to the middle of the elevator to possess Elephant, Red Platform A behaved like a one-time lowering platform, and Elephant could not reliably leave the platform after possession.
- Root cause: the first red assembly still used the earlier prototype assumptions: centered button/spawn, one-target held movement, and platform surface transitions that did not explicitly model aligned top/bottom exits.
- Fix: moved Red Button A and Elephant Echo/spawn toward the side edge of Red Platform A, added red continuous-cycle platform state with endpoint pauses, changed release behavior to finish the current travel direction and stop at the next endpoint, added a side possession lane, and added explicit Elephant platform-exit transition rules.
- Prevention rule: every dynamic elevator needs a written surface contract: button/spawn position, rider eligibility, top exit, bottom exit, release behavior, and a no-trap smoke test for leaving the platform.
- Verification: `test-output/level-two-red-prototype/smoke.mjs` now checks edge spawn, human/Frog ineligible activation, held cycling, release-to-endpoint behavior, side possession without human riding Red Platform A, and Elephant walking off the platform. Build, Level Two validators, Level Two Frog/Totem and ramp smokes, and all scene smokes pass.
- Follow-up: run human visual/play review before implementing Red Button / Elevator B.

## 2026-05-19 - Level Two Red Platform A Actor Grounding And Mountain Collision

- Status: fixed; needs human visual/play review before Elevator B.
- Scene: Level Two.
- Symptom: Red Platform A worked for Elephant's weight mechanic, but Human collision/grounding was inconsistent: the platform could pass through or ignore the Human, and the Human could not reliably stand on or ride the platform. Elephant could also enter central mountain cube footprints after leaving Red Platform A.
- Root cause: Red Platform A was still modeled as Elephant-only walkable terrain, and rider detection used footprint overlap rather than explicit actor surface state. Elephant mountain walkability was also too broad: being inside the elevated route footprint was enough to bypass central mountain colliders, even from ground level.
- Fix: Red Platform A now allows Human and Elephant rider surface state. Actor lift on Red Platform A only applies when the actor is actually attached to that moving platform surface. The platform shaft blocks entry while raised unless the actor already has a valid platform/top-route transition. Elephant mountain collider exceptions now require legitimate elevated route access and block higher-tier mountain cube overlaps.
- Prevention rule: dynamic platforms need explicit rider state, boarding rules, exit rules, and shaft-blocking rules. Raised terrain collider exceptions must check both footprint and current surface/route eligibility.
- Verification: `test-output/level-two-red-prototype/smoke.mjs` checks Human boarding the lowered platform, Human riding upward, Human exiting at ground alignment, and Elephant being blocked by central mountain cubes from ground level. Build, Level Two validators, Level Two shell/Frog/Totem/ramp smokes, Home/Level One smoke, and all scene smokes pass.
- Follow-up: human review Red Platform A before starting Elevator B.
