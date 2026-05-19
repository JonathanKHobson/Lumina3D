# Level Two Design Scope

## One-Sentence Concept

Level Two introduces Elephant Cubeling, red weight buttons, elevation, and Cubeling Recall through a small vertical forest puzzle where Frog helps the main character unlock Elephant, and Elephant's weight helps create the route to an elevated Love Letter.

## Design Promise

Level Two should feel like:

- "I already understand Frog, but now height matters."
- "This new Echo needs a Totem."
- "Elephant is not just another animal; weight changes mechanisms."
- "Recall lets me recover Cubelings without resetting the level."

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
- Cubeling Recall with `C`;
- elevated Love Letter;
- Love Letter message and completion flow.

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
14. Elephant uses red weight buttons.
15. Red buttons move platforms/elevators.
16. `C` recalls active Cubelings to their Echoes.
17. Elephant helps create or align a route for the main character.
18. Main character reaches the elevated Love Letter.
19. Main character collects the Love Letter.
20. Love Letter message appears.
21. Level Two completion menu appears.

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

- one primary red button/platform relationship at first;
- slow return behavior if the button releases;
- short route from Elephant unlock to useful red button.

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

