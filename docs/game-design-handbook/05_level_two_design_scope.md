# Level Two Design Scope

## One-Sentence Concept

Level Two introduces Elephant Cubeling, red weight buttons, elevation, and a future Cubeling Recall hook through a small vertical forest puzzle where Frog helps the main character unlock Elephant, and Elephant's weight helps create the route to an elevated Love Letter.

## Design Promise

Level Two should feel like:

- "I already understand Frog, but now height matters."
- "This new Echo needs a Totem."
- "Elephant is not just another animal; weight changes mechanisms."
- "Elephant can solve a route for the main character from somewhere else."
- Future: "Recall lets me recover Cubelings without resetting the level."

## Setting

Stay in the grass/forest/nature visual family, but add a stronger vertical feeling.

Use:

- elevated natural terrain;
- raised ledges;
- cliffs, hills, or stacked blocks;
- simple platform/elevator pieces;
- sparse forest/nature decoration;
- clear paths and open camera sightlines.

Avoid:

- dense trees that hide the route;
- clutter around buttons;
- tall props in front of the elevated Love Letter;
- complex multi-animal routing beyond Frog + Elephant.

## Required Objects

Level Two should include:

- Level Two title card;
- main character start;
- Frog Cubeling available from start;
- Frog Echo/spawn point;
- Frog side path;
- blue button for familiar Frog interaction;
- Elephant Echo;
- Elephant Cubeling Totem;
- Elephant Cubeling unlock;
- Elephant Cubeling;
- red weight buttons;
- elevator/platform components;
- elevated Love Letter;
- Love Letter message and completion flow.

Future required object:

- Cubeling Recall with `C`.

## Intended Player Flow

1. Level Two begins.
2. Main character enters.
3. Love Letter is visible high up or clearly elevated.
4. Elephant Echo is visible before Elephant is unlocked.
5. Elephant Cubeling Totem is visible/discoverable but not directly reachable by the main character at first.
6. Frog is already available.
7. Frog jumps to a raised ledge or side platform.
8. Frog presses a blue button.
9. Blue button activates/lowers/raises a platform or elevator that lets the main character reach the Elephant Cubeling Totem.
10. Main character collects the Elephant Cubeling Totem.
11. Show: "Elephant Cubeling Found!"
12. Elephant Echo becomes the real Elephant Cubeling.
13. Player transfers into Elephant when nearby.
14. Elephant uses Red Button A / Elevator A to reach the tier-3 Elephant route.
15. Elephant crosses to Red Button B on the existing west-side tier-3 mountain grass.
16. Main character stands on Red Elevator B at the ground dock.
17. Elephant holds Red Button B.
18. Red Elevator B cycles upward while Button B is held.
19. Main character rides Red Elevator B to the Love Letter route.
20. Main character reaches the elevated Love Letter.
21. Main character collects the Love Letter.
22. Level Two Love Letter message appears.
23. Level Two completion menu appears.

Future flow addition:

- `C` recalls active Cubelings to their Echoes once recall is in scope.

## Frog Section

Purpose:

- reuse familiar Frog behavior;
- introduce height/ledge jumping;
- let Frog help unlock Elephant;
- avoid adding a new Frog ability.

Keep it short:

- one clear ledge/gap;
- one blue button;
- one visible result for the main character.

## Elephant Section

Purpose:

- introduce heavy Cubeling identity;
- teach red = weight/held pressure;
- use platforms/elevators to reach the elevated Love Letter.

Keep it readable:

- Elevator A is Elephant's elevator and teaches red continuous cycling.
- Red Button B is reached by Elephant on the existing tier-3 route, without a separate button-only terrace.
- Elevator B is the main character/human elevator.
- Elevator B cycles while Red Button B is held and carries the main character from restored ground to the straight Love Letter route.
- Human and Frog do not activate red buttons.

## Optional Frog Blocker

Planning only for now.

An optional blocker could teach recall if technically useful:

- Elephant reaches a blocker it cannot solve.
- Player returns to main character.
- Player presses `C` to recall Cubelings.
- Frog is used again to press a blue button/open blocker.

Do not implement this unless the simpler route is too flat.

## Out Of Scope For First Level Two Slice

- Duck Cubeling.
- Yellow buttons.
- Full save menu.
- Full level select.
- Full mechanism refactor.
- Retrofitting tutorial/Level One visuals to the color system.
- Complex multi-stage recall puzzles.
