# Prompting Glossary and Space Language

## Purpose

This document helps convert design ideas into the same language used in design reviews, code, and implementation requests.

Use it when:

- you want the map layout change to land clearly,
- you are giving fix/correction prompts with spatial intent,
- you need dev-facing phrasing that keeps intent and implementation aligned.

Think of it as:

- `What I mean` (plain language)
- `What to ask` (dev prompt)
- `Where it lives in game language` (code/design term)

---

## Core conversion: plain word → design term → dev phrasing

### 1) Player and helper characters

- `Main character`
  - Meaning: the controllable player avatar in human form.
  - Dev wording: `human` / `main character`.

- `Animal / companion / helper`
  - Meaning: a Cubeling you can transfer into.
  - Dev wording: `Cubeling`, e.g. `Frog`, `Elephant`, `Axolotl`.

- `Switch into X` / `become X`
  - Meaning: transfer into a Cubeling to use its movement ability.
  - Dev wording: `possess`, `Shift`, `activeCubeling`.

- `Leave X`
  - Meaning: return to human control.
  - Dev wording: `depossess`, `Shift back`.

### 2) Progress anchors on the map

- `Where the level starts`
  - Meaning: player/human initial spot.
  - Dev wording: `START.human`.

- `Near where we can first see/collect X`
  - Meaning: initial player access point for an object.
  - Dev wording: `spawn`, `starting approach`, `accessibility`.

- `Main-path route`
  - Meaning: the sequence needed to finish the level.
  - Dev wording: `required route`, `critical path`, `completion route`.

- `Optional side path` / `bonus route`
  - Meaning: a route that does not block completion.
  - Dev wording: `optional branch`, `replay route`, `deferred collectible lane`.

- `Replay target / return lane`
  - Meaning: something that becomes reachable after future unlock.
  - Dev wording: `deferred Cubeling pattern`, `Echo-first lane`.

### 3) Terrain and placement language

- `Start side`
  - Meaning: the half of a split area where the human can begin.
  - Dev wording: `start bank / entry-side`.

- `Far side` / `opposite side`
  - Meaning: the other side across a river/gap/bridge.
  - Dev wording: `target bank`, `far node`, `opposite platform`.

- `Near center`, `left edge`, `right edge`, `front of`, `behind`
  - Meaning: relative position within the same scene.
  - Dev wording: use landmarks first (e.g., `near the broken bridge`, `by the second button`, `between river and island`).

- `Expanded area`
  - Meaning: you intentionally made room for a new behavior.
  - Dev wording: `tweak map geometry`, `layout expansion`, `tile/obstacle add/remove`.

### Level Two vocabulary anchors

Use these fixed names when you are describing spatial edits in Level Two:

- `central mountain`
- `Love Letter peak`
- `Frog button ledge`
- `practice ledge`
- `Elephant Totem hill`
- `blue ramp`
- `Elephant Echo terrace`
- `reserved elevator terrace`
- `main entry bank`
- `river approach`

### 4) Mechanism language

- `Open bridge`
  - Meaning: bridge becomes solid and walkable.
  - Dev wording: `activate`, `complete`, `persistent platform`.

- `Door / gate`
  - Meaning: barrier that blocks a required route.
  - Dev wording: `obstacle`, `blocking mechanism`, sometimes `barrier` in Level One.

- `Button effect`
  - Meaning: what pressing changes.
  - Dev wording: `activation mapping`, `mechanism binding`.

- `Blue / Red / Yellow / Green button`
  - Meaning: persistent, weight hold, timed, or repeatable/cycle behavior.
  - Dev wording: `color grammar` in `02_color_coded_buttons_and_mechanisms.md`.

### 5) Love Letter flow

- `Main goal` / `completion item`
  - Meaning: level reward target.
  - Dev wording: `Love Letter`.

- `Message popup`
  - Meaning: player reads narrative text once collected.
  - Dev wording: `love letter modal`, `message reveal`.

- `Main flow should stay simple`
  - Meaning: avoid forced detours in first pass.
  - Dev wording: `keep primary path unblocked`, `minimize mandatory branches`.

### 6) Cubeling-related map terms

- `Unlockable`
  - Meaning: appears as a totem and enables a Cubeling.
  - Dev wording: `Cubeling totem` + `unlocked`.

- `Sleeping / not awake`
  - Meaning: appears as visual cue but cannot be possessed.
  - Dev wording: `dormant echo`.

- `Active now`
  - Meaning: can be possessed and moved.
  - Dev wording: `awake echo`.

## Map phrasing you can use in prompts

Use one sentence per intent:

- `What / why`: What should the player learn in this area.
- `Where`: Use one or two landmarks.
- `Which actor`: Who does the action.
- `Trigger`: What causes change.
- `Expected result`: What state changes.
- `Keep this out of scope`: Explicitly name what not to touch.

Template:

> In [LEVEL], on the [LANDMARK], place a [MAP OBJECT] on the [SIDE] of [OBSTACLE].
> It should [ACTION] when the player [TRIGGER] and then [RESULT].
> Keep [OTHER FEATURE] unchanged to avoid scope drift.

Example:

> In Level One, on the river entry side, put a blue crate near the original blue button.
> When Frog steps the blue button, the crate drops the Axolotl Cubeling Totem.
> Keep the current Frog jump path unchanged and still required for the first progression read.

## Spatial correction shorthand

Use these instead of vague directions:

- `adjacent to` (share an edge/nearby immediate area)
- `offset left/right from`
- `between X and Y`
- `behind the bridge`
- `before the island`
- `just past the first obstacle`
- `on same side as`
- `off the critical path`

Each phrase should be anchored to one named object.

## Source of truth checklist for a request

Before sending a fix/correction prompt, include:

1. `Level + location` (e.g., Level One, river section).
2. `Landmarks` (what is it next to).
3. `Actor` (human, Frog, Elephant, etc.).
4. `Mechanic` (blue button / bridge completion / totem / echo).
5. `Success condition` (what must happen when fixed).
6. `Scope limit` (what should not change).

## File and folder reference language

### Why this section exists

Use this when the ask is "where this should live" as much as "what should change."

### Core folder map

- `src/main.js` → game orchestration: scene flow, system registration, and top-level state updates.
- `src/scenes/` → scene composition and flow assembly (`tutorialScene.js`, `homeIntroScene.js`, `levelOneScene.js`, `levelTwoScene.js`).
- `src/levels/` → map constants and static anchors (`START`, totems, buttons, objectives, terrain blocks).
- `src/systems/` → behavior logic (input, camera, collisions, dialog, frog AI, buttons, particles).
- `src/core/` → low-level infrastructure (grid math, loader, renderer, actor primitives).
- `src/state/` → persistence and saved progression model.
- `src/config/` → shared constants and scene/catalog configuration.
- `src/content/` → narrative copies and Cubeling dialogue.
- `public/assets/` → mesh and texture files used by the level map.
- `docs/` → planning system and reference docs.
- `refactor-plan`/`backlog`/`bug_report`/`progress` in repo root → scheduling, scope, and known risk tracking.

### Reference rules in prompts

- For **map layout changes**: start with `src/levels/levelOne.js` or `src/levels/levelTwo.js`.
- For **behavior/mechanic changes**: list `src/systems/...` first, then `src/main.js` if scene/system wiring is needed.
- For **scene transitions / title timing / cinematic flow**: use `src/scenes/...` and `src/main.js`.
- For **asset swaps**: use `public/assets/...` and `src/config/assets.js`.
- For **wording changes**: use `src/content/...`.
- For **design language clarifications**: use `docs/game-design-handbook/`.

### Prompt template for location + file

Use this compact form:

> In `src/levels/<level>.js` (or `<system file>`), at `<LANDMARK>`, change `<ELEMENT>` so that `<RESULT>`, without touching `<SCOPE LIMIT>`.

---

## Quick conversion cheat-sheet

- `I want this thing to be closer`
  - → `Reduce spatial distance between X and Y to improve immediate readability / reduce traversal strain.`

- `Make this more readable`
  - → `Increase affordance clarity for [mechanism], including a clear cause→effect anchor with named landmarks.`

- `Keep this for later`
  - → `Mark as deferred behavior; preserve main path continuity in current slice.`

- `Where exactly should it go?`
  - → `Define with two anchors + one relationship`
    (`near`, `between`, or `inside`).
