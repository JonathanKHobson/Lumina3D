# Prompt: Level Two Next Slice — Red Button B + Elevator B + Complete Loop

We are ready for the next Level Two slice.

This slice should complete the full Level Two game loop if implemented correctly.

## Current intended Level Two state

Level Two already has or should have:

- The central mountain.
- The Love Letter peak.
- Frog available from the start.
- Frog button ledge.
- Blue button / blue ramp path to Elephant Cubeling Totem.
- Elephant Cubeling Totem.
- Elephant Echo / Elephant Cubeling unlock.
- Platform/Elevator A with Red Button A.
- Elephant spawns on/above Red Button A.
- Red Button A / Elevator A lets Elephant come down to human-accessible level.
- Human can possess Elephant when nearby.
- Elephant can ride/use Elevator A back up to the mountain route.

Before implementing, inspect the current local branch and confirm what already exists. The public GitHub `main` may be slightly behind the latest local/dev work.

## Core design goal

Add Red Button B and Elevator B.

Red Button B should be directly opposite Platform/Elevator A / Red Button A on the other side of the central mountain.

Red Button B should be on the same vertical tier/level that Elevator A reaches when it returns/rises to the mountain route.

Elevator B should be placed to the side of Red Button B.

The puzzle goal is:

> Elephant reaches Red Button B, stands on it, and while Elephant holds the red button, Elevator B continuously cycles up and down. The player shifts back to the human, waits for Elevator B at ground level, boards it, rides upward, exits near the Love Letter route, and collects the Love Letter.

## Critical transfer constraint

The human/main character can only possess a Cubeling when near that Cubeling.

Do not solve this by placing Elevator B beside Elevator A.

Do not rely on Elephant autonomous AI.

Do not require remote possession.

The intended solution is:

1. Player possesses Elephant while Elephant is accessible after Elevator A.
2. Elephant rides/uses Elevator A back up to the mountain route.
3. Elephant walks across the mountain route to Red Button B.
4. Elephant stands on Red Button B and stays there.
5. Player shifts back from Elephant to human.
6. Elephant remains on Red Button B while unpossessed.
7. Elevator B cycles up/down while Red Button B is held.
8. Human walks to Elevator B at ground level.
9. Human boards Elevator B when it cycles down.
10. Human rides Elevator B up.
11. Human exits toward the Love Letter route.
12. Human collects the Love Letter.

This preserves the existing rule:

- Human -> Cubeling requires proximity.
- Cubeling -> human is allowed as the return/depossess action.

## Red button behavior update

Red buttons should be continuous-cycle weight buttons.

Expected red behavior:

- Red buttons require Elephant weight.
- Human should not activate red buttons.
- Frog should not activate red buttons.
- Elephant activates red buttons by standing on them.
- While Elephant remains on a red button, the linked mechanism continuously operates.
- For an elevator, this means the elevator cycles between its endpoints while the red button is held.
- When Elephant leaves the red button, the linked mechanism stops cycling or returns to its rest/default state, whichever is safest for the current implementation.

For this slice, prioritize:

> Elephant standing on Red Button B causes Elevator B to cycle between ground level and the upper Love Letter access level.

Button color grammar reminder:

- Blue = press once, persistent/simple activation.
- Red = heavy hold, continuously cycles while held.
- Green = repeatable click, toggles/cycles one step per press.
- Yellow = timed activation, timer expires then resets/snaps back.

If the docs still say red only reverses slowly when weight leaves, update the docs/backlog note after this implementation to reflect the new continuous-cycle red rule.

## Placement requirements

### Red Button B

Place Red Button B:

- On the opposite side of the central mountain from Platform/Elevator A / Red Button A.
- On the same vertical tier/level that Elevator A reaches when Elephant returns/rides up to the mountain route.
- On an Elephant-accessible terrace or route.
- Near enough to the mountain route that Elephant can walk to it after exiting Elevator A.
- Not on the Love Letter peak.
- Not on the Elephant Totem hill.
- Not on ground level unless the current terrain design specifically requires it.

Use Level Two vocabulary anchors:

- central mountain
- Love Letter peak
- Elephant Echo terrace
- reserved elevator terrace
- Elephant Totem hill
- Frog button ledge
- blue ramp

If the existing `upper-red-button-station` reserved terrace is in the correct position, use it for Red Button B.

If it is not in the correct position, update `src/levels/levelTwo.js` by adding a clearer named terrace/anchor, such as:

- `red-button-b-terrace`
- `human-elevator-b-ground-dock`
- `human-elevator-b-upper-stop`

### Elevator B

Place Elevator B:

- To the side of Red Button B.
- Visually connected to Red Button B through red color/mechanism language.
- With a ground-level stop reachable by the human/main character.
- With an upper stop that connects to the Love Letter route.
- Not overlapping the central mountain geometry.
- Not clipping into terrain.
- Not starting adjacent to Elevator A unless the map layout independently demands it. The design does not require Elevator A and Elevator B to be adjacent.

Elevator B should start at ground level or have ground level as one endpoint in its cycle.

When Red Button B is held by Elephant, Elevator B should continuously cycle:

- ground stop -> upper stop -> ground stop -> upper stop

The human should be able to board when it reaches ground level and ride to the upper stop.

## Intended player flow for this slice

1. Human enters Level Two.
2. Human finds Frog.
3. Frog uses Frog button ledge and blue button.
4. Blue ramp opens.
5. Human collects Elephant Cubeling Totem.
6. Elephant awakens/spawns at the Elephant Echo / Red Button A / Elevator A area.
7. Red Button A / Elevator A makes Elephant accessible.
8. Human possesses Elephant.
9. Elephant uses Elevator A to reach the elevated mountain route.
10. Elephant exits Elevator A at the mountain route.
11. Elephant crosses to Red Button B on the opposite side of the central mountain.
12. Elephant stands on Red Button B.
13. Elevator B starts cycling between ground and upper stop.
14. Player shifts back to human.
15. Human walks to Elevator B's ground stop.
16. Human boards Elevator B when it cycles down.
17. Human rides Elevator B upward.
18. Human exits at the upper stop.
19. Human reaches the Love Letter.
20. Human collects the Love Letter.
21. Level Two completion flow triggers.

## Love Letter route

This slice should complete the Level Two loop.

After Elevator B reaches the upper stop, human should have a clear, walkable path to the Love Letter or a clear placeholder completion route that lets the human collect the Love Letter.

Only the human/main character can collect the Love Letter.

Frog and Elephant should not collect the Love Letter.

Use a Level Two Love Letter ID/message if one exists. If it does not, add the minimal Level Two Love Letter content needed for completion flow, using the established Love Letter modal/celebration pattern.

Suggested placeholder text:

> My love,
>
> Some paths need a leap.
>
> Some need a bridge.
>
> And some need a very gentle giant.
>
> I left this one high up because I knew you'd find a way.
>
> — Yours

## Technical implementation notes

Suggested files to inspect/update:

- `src/levels/levelTwo.js` — add/update Red Button B and Elevator B anchors, platform endpoints, terrace IDs, and route geometry.
- `src/scenes/levelTwoScene.js` — place Red Button B, Elevator B, and any required red platform visuals.
- `src/systems/buttonSystem.js` — update red button behavior if needed so red buttons support continuous-cycle behavior while held.
- `src/main.js` — wire Level Two interactions, actor/platform movement, human riding Elevator B, Love Letter collection, and render text state if not extracted elsewhere.
- `src/config/assets.js` — register red button/red platform assets if available. If exact red assets are not present in repo yet, use clearly labeled temporary generated red meshes and document the asset review need.
- `src/content/loveLetters.js` — add Level Two Love Letter ID/message if not already present.
- `docs/game-design-handbook/02_color_coded_buttons_and_mechanisms.md` — update red button wording to continuous-cycle if changed.
- `docs/game-design-handbook/09_level_two_smoke_tests.md` — add smoke tests for this slice.

## Asset guidance

The public GitHub asset registry currently clearly has blue button and blue ramp entries. If red assets already exist locally, use them. If they do not, create temporary generated red button/platform visuals for this slice and add a backlog note to replace them with final assets.

Required visuals:

- Red Button B: clearly red, visually different from blue button.
- Elevator B: red-coded platform/elevator or red-highlighted placeholder.
- Elevator B path/endpoints: visually readable enough that the human can see where to board.

## Behavior requirements

### Red Button B

- Visible as part of the level layout.
- Activates only when Elephant is on it.
- Does not activate for human.
- Does not activate for Frog.
- Keeps Elevator B cycling while Elephant remains on it.
- Stops or returns safely when Elephant leaves.

### Elevator B

- Has a ground stop the human can reach.
- Has an upper stop aligned with the Love Letter route.
- Cycles while Red Button B is held.
- Carries the human upward without clipping/falling/sticking.
- Allows human to exit at the upper stop.
- Does not require human to be near Elephant after the human boards; Elephant is already holding Red Button B.

### Elephant idle behavior on Red Button B

When the player shifts from Elephant back to human, Elephant should remain where it is.

Elephant should not wander off Red Button B.

This is critical. If Elephant walks off Red Button B, the human elevator stops and the puzzle breaks.

## Scope limits

Do not implement Cubeling Recall in this slice unless absolutely required to recover a broken state.

Do not add Mouse/Axolotl/Mole/other Cubelings.

Do not rework the tutorial or Level One.

Do not refactor collision/surface systems broadly while adding this mechanic.

Do not make a large architecture rewrite.

## Success criteria

This slice is successful when:

- Elephant can reach Red Button B from Elevator A's upper mountain route.
- Red Button B is directly opposite Platform/Elevator A / Red Button A on the other side of the central mountain.
- Red Button B is on the same level/tier as Elevator A's upper endpoint.
- Elevator B is placed to the side of Red Button B.
- Elephant standing on Red Button B causes Elevator B to continuously cycle.
- Player can shift back to human while Elephant remains on Red Button B.
- Human can board Elevator B from ground level.
- Human can ride Elevator B upward.
- Human can exit at the upper stop.
- Human can collect the Level Two Love Letter.
- Level Two completion flow triggers.
- No prior Level Two Frog/blue ramp/Elephant Totem behavior regresses.
