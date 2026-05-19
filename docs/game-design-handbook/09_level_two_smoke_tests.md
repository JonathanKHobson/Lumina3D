# Level Two Smoke Test Checklist

## Test Standard

Every Level Two phase should have a smoke test that checks:

- browser boots with no new console errors;
- scene state in `render_game_to_text()`;
- visual screenshot state;
- controls and collision for the changed component;
- reset behavior for the current scene.

Use WebGL-safe Chromium flags already proven in this project:

```bash
--use-gl=egl --enable-unsafe-swiftshader --ignore-gpu-blocklist
```

## Phase 2 - Level Shell

- Can Level Two load directly via debug shortcut?
- Does `scene.id` report `level_two`?
- Does the Level Two title card appear in the Level Two scene?
- Does title card fade/clear before control starts?
- Does the main character enter and gain control?
- Is Frog available from start?
- Is the elevated Love Letter placeholder visible?
- Are terrain collision bounds correct?
- Does `R` reset Level Two without returning to tutorial?
- Screenshot: title card.
- Screenshot: start/play state.
- Screenshot: narrow viewport.

## Phase 3 - Frog Ledge + Blue Button

- Can player transfer into Frog near Frog?
- Can Frog jump onto the intended ledge?
- Does Frog land on top of the ledge, not inside it?
- Does jump work from the whole intended jump zone, not one pixel-perfect point?
- Does invalid jump attempt show feedback?
- Can Frog press the blue button?
- Does blue button depress/activate visually?
- Does the connected platform/elevator activate persistently?
- Can main character use the activated route?
- Screenshot: Frog before jump.
- Screenshot: Frog landing.
- Screenshot: blue platform active.

### Phase 3 Regression Addendum - Raised Terrain And Ramp

- Can main character walk up the blue ramp to the Elephant Totem hill?
- Can main character walk back down the blue ramp without clipping or getting stuck?
- If main character attempts to step off a raised platform edge that is not a valid descent, are they cleanly blocked before partial falling/clipping?
- If unsupported step-off is allowed, does the character land on ground with movement restored?
- Does the actor remain visually on top of the ramp, not embedded inside it?
- Does `R` remain unnecessary for recovering from ramp/platform movement?
- Screenshot: actor halfway up ramp with visible foot/body clearance.
- Screenshot: actor at Totem hill top contact.
- Screenshot: attempted non-ramp edge exit or clean descent behavior.

## Phase 4 - Elephant Echo + Totem

- Precondition: Phase 3 raised-terrain/ramp regression addendum passes.
- Is Elephant Echo visible before unlock?
- Is Echo transparent/muted and non-solid?
- Can main character walk through Echo?
- Is Elephant Totem visually distinct from Echo?
- Can only main character collect Elephant Totem?
- Does Frog fail to collect Elephant Totem with clear feedback?
- Does collecting Totem show "Elephant Cubeling Found!"?
- Does Echo convert to real Elephant?
- Screenshot: Echo.
- Screenshot: Totem.
- Screenshot: unlock moment.

## Phase 5 - Elephant + Red Button

- Can player transfer into Elephant when near it?
- Does Elephant move slower than Frog?
- Does Elephant collision feel solid but not path-blocking?
- Can Elephant activate red button?
- Can Frog fail to activate red button with clear feedback?
- Can main character fail to activate red button with clear feedback?
- Does red button release when Elephant leaves?
- Screenshot: Elephant on red button.
- Screenshot: Frog failed activation feedback.

## Phase 6 - Red Platform/Elevator

- Does red button move the intended platform/elevator?
- Does movement happen while Elephant holds the button?
- Does platform/elevator return when Elephant leaves?
- Is return slow/readable enough?
- Can the main character stand on and ride the platform if required?
- Can Elephant stand on and ride the platform if required?
- Does platform align at both endpoints?
- Screenshot: platform start.
- Screenshot: platform moving.
- Screenshot: platform aligned at endpoint.

## Phase 7 - Cubeling Recall

- Pressing `C` recalls Frog to Frog Echo.
- Pressing `C` recalls Elephant to Elephant Echo.
- Recall has cooldown.
- Recall does not move the main character.
- Recall does not uncollect Elephant Totem.
- Recall does not reset persistent blue button state.
- Recall handles red held-button release clearly if Elephant leaves a red button.
- Transfer still requires proximity after recall.
- Screenshot: before recall.
- Screenshot: after recall.

## Phase 8 - Full Route

- Player can complete the intended route from start to Love Letter.
- Frog section creates access to Elephant Totem.
- Main character collects Elephant Totem.
- Elephant section creates access to elevated Love Letter.
- Recall does not break the route.
- Cubelings cannot collect Love Letter.
- Main character collects Love Letter.
- Screenshot: elevated goal.
- Screenshot: Elephant route.
- Screenshot: Love Letter collection.

## Phase 9 - Completion

- Love Letter message opens with Level Two text.
- Continue button dismisses message.
- Input buffer prevents accidental menu skip.
- Continue prompt appears after popup.
- Completion menu appears after fresh key/click.
- Reset clears Level Two reward/celebration state.
- Coming-soon/next-level labels match current game state.
- Screenshot: message popup.
- Screenshot: completion menu.

## Regression Checks From Earlier Bugs

- Assets face the intended direction.
- Bridges/platforms are over the obstacle they solve.
- Large objects have collision.
- Scenery does not block paths.
- Dialogue does not retrigger every frame.
- Effects do not appear immediately unless intended.
- Cubelings do not block required paths when autonomous.
- `render_game_to_text()` exposes enough state for each new system.
