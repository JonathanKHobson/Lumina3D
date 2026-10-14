# Level Two Component Breakdown

Each component should be buildable and smoke-testable on its own. Do not merge all of these into one implementation pass.

## 1. Level Shell / Terrain

Purpose:

- establish Level Two as a readable elevated forest map.

Needed assets:

- ground tiles;
- raised/elevated blocks or placeholder stacked terrain;
- path tiles;
- sparse forest props;
- placeholder elevated Love Letter.

State variables:

- `scene.id = "level_two"`;
- `levelTwo.phase`;
- `levelTwo.bounds`;
- `levelTwo.floorAsset`;
- `levelTwo.elevatedGoalVisible`.

Risks:

- height not readable from camera;
- collision bounds mismatched to visuals;
- path blocked by scenery.

Independent smoke test:

- load Level Two directly;
- move main character around;
- verify visible Love Letter placeholder;
- verify no scenery blocks required path.

## 2. Frog Ledge Jump Component

Purpose:

- let Frog use familiar jump behavior on a raised ledge.

Needed assets:

- ledge or raised terrain;
- Frog start/Echo;
- landing marker if needed.

State variables:

- `levelTwo.frogJumpZone`;
- `levelTwo.frogLedgeReached`;
- `frogJump.kind = "level_two_ledge"`.

Risks:

- Frog clips through ledge;
- landing not aligned;
- jump works only from an overly precise point.

Independent smoke test:

- transfer to Frog;
- jump from multiple valid positions in ledge zone;
- land on ledge without clipping;
- fail gracefully outside ledge zone.

## 3. Blue Button Elevator/Platform Component

Purpose:

- reuse blue = press once/persistent activation.

Needed assets:

- existing blue button;
- platform/elevator or placeholder deck.

State variables:

- `levelTwo.blueButtonPressed`;
- `levelTwo.bluePlatformActive`;
- `levelTwo.bluePlatformProgress`.

Risks:

- button too hidden;
- platform movement unclear;
- platform not walkable after activation.

Independent smoke test:

- Frog presses blue button;
- platform moves/activates;
- main character can use the result;
- button stays pressed.

## 4. Elephant Echo Component

Purpose:

- introduce inactive Elephant home-anchor.

Needed assets:

- Elephant model candidate;
- transparent/ghost material treatment;
- ground ring and sparkle treatment.

State variables:

- `reveals.elephantEcho`;
- `elephantEcho.visible`;
- `elephantEcho.solid = false`;
- `elephantEcho.promptIndex`.

Risks:

- Echo looks too much like real Elephant;
- Echo blocks player;
- Echo identity unclear.

Independent smoke test:

- Echo is visible before unlock;
- player can walk through it;
- Echo dialogue/prompt triggers with cooldown.

## 5. Elephant Cubeling Totem Component

Purpose:

- unlock Elephant.

Needed assets:

- small Elephant charm/totem visual;
- glow/sparkle/bob effect.

State variables:

- `elephantTotem.visible`;
- `elephantTotem.collected`;
- `cubelings.elephant.unlocked`;
- persistent unlock hook later.

Risks:

- Totem too similar to Echo;
- Frog collects it by mistake;
- pickup trigger too large or too small.

Independent smoke test:

- main character collects Totem;
- Frog cannot collect Totem;
- unlock message appears;
- Echo converts to Elephant.

## 6. Elephant Cubeling Component

Purpose:

- provide a heavy controllable Cubeling.

Needed assets:

- Elephant model;
- simple idle/move animation or procedural bob;
- dust/settle effect if simple.

State variables:

- `state.elephant`;
- `cubelings.elephant.unlocked`;
- `activeActor = "elephant"`;
- `elephant.radius`;
- `elephant.speed`.

Risks:

- too large for paths;
- collision blocks transfer;
- movement feels identical to Frog.

Independent smoke test:

- transfer into Elephant when near;
- Elephant moves slower than Frog;
- Elephant collision works against scenery and actors.

## 7. Red Weight Button Component

Purpose:

- establish red = heavy/held pressure.

Needed assets:

- red button variant;
- red mechanism visual token.

State variables:

- `redButton.active`;
- `redButton.heldBy`;
- `redButton.requires = "heavy"`;
- `redButton.releaseProgress`.

Risks:

- Frog/main character accidentally activate it;
- activation radius feels unfair;
- release spam/flicker.

Independent smoke test:

- Elephant activates red button;
- Frog and main character fail with feedback;
- button releases when Elephant steps off.

## 8. Elevator/Platform Component

Purpose:

- move actors between elevations.
- support the current two-elevator Level Two route: Elevator A for Elephant, Elevator B for the main character.

Needed assets:

- platform/elevator deck;
- optional direction marker.

State variables:

- `platform.position`;
- `platform.targetPosition`;
- `platform.progress`;
- `platform.occupants`;
- `platform.walkableSurface`.

Risks:

- actors do not ride with platform;
- platform clips terrain;
- platform not aligned with ledge;
- floating visual with no collision.

Independent smoke test:

- platform moves;
- main character stays on platform;
- Elephant stays on platform if needed;
- platform aligns with both endpoints.

Implemented split:

- Red Elevator A starts raised and cycles while Elephant holds Red Button A so Elephant can access the tier-3 route.
- Red Elevator B starts at ground level, is human-only, cycles while Elephant holds Red Button B, and aligns with the Love Letter route at the top.

## 8b. Red Button B / Elevator B Route Component

Purpose:

- let Elephant complete a remote route for the main character.

Needed assets:

- `buttonBaseRed`;
- `buttonTopRed`;
- `redPlatform4x4`;
- existing west-side tier-3 mountain grass under Red Button B;
- restored ground-level Elevator B dock;
- straight tier-4 human Love Letter route.

State variables:

- `levelTwo.redButtons["red-button-b"]`;
- `levelTwo.redPlatforms["red-elevator-b"]`;
- `levelTwo.humanSurfaceId`;
- `levelTwo.elephantSurfaceId`;
- `levelTwo.complete`.

Risks:

- Elephant not truly on the elevated Button B surface;
- human falling through Elevator B;
- Elevator B top stop not aligned with the Love Letter route;
- Love Letter collectable before Elevator B.

Independent smoke test:

- seed Elephant on Red Button B and human on Elevator B;
- confirm Button B is held by Elephant;
- confirm Elevator B reaches top with human as rider;
- walk human from Elevator B onto the Love Letter route;
- collect Level Two Love Letter;
- confirm Level Two completion.

## 9. Cubeling Recall Component

Purpose:

- recover Cubelings to their Echoes.

Needed assets:

- small recall sparkle/poof effect.

State variables:

- `recall.cooldownUntil`;
- `recall.count`;
- each Cubeling Echo/spawn position.

Risks:

- recall resets solved state accidentally;
- Cubeling returns to wrong Echo;
- recall allows remote possession confusion.

Independent smoke test:

- press `C`;
- Frog returns to Frog Echo;
- Elephant returns to Elephant Echo;
- solved buttons/platforms persist unless explicitly held/released.

## 10. Love Letter Completion Component

Purpose:

- complete Level Two with the existing reward flow.

Needed assets:

- Love Letter closed/open model;
- heart/confetti effects;
- unique Level Two message.

State variables:

- `levelTwo.loveLetterId`;
- `spellbookCollected` or future `loveLetter.collected`;
- `loveLetterMessage.id`;
- `celebration.active`.

Risks:

- Cubeling collects it;
- popup appears too early/late;
- celebration objects persist into another scene.

Independent smoke test:

- only main character collects;
- message appears;
- completion menu opens;
- reset clears reward objects.
