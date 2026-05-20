# Backlog And Future Alignment

## Immediate Level Two Planning

Completed by this documentation pass:

- design handbook;
- mechanic design system;
- button/color mechanism direction;
- Cubeling/Echo/Totem terminology;
- Cubeling Recall rules;
- Level Two scope;
- Level Two component breakdown;
- Level Two asset plan;
- Level Two smoke checklist;
- bug report library;
- recommended next implementation slice.

## Level Two Implementation Backlog

Build in this order:

1. Level Two shell. Completed.
2. Frog ledge section. Completed as first slice; polish remains.
3. Blue button/ramp/Totem access test. Functionally present.
4. Fix raised-terrain step-off stuck state and ramp visual/collision alignment. Completed 2026-05-19.
5. Elephant Echo.
6. Elephant Cubeling Totem visual refinement.
7. Elephant unlock/spawn from Echo.
8. Elephant movement/idle.
9. Red weight button.
10. Red platform/elevator movement.
11. Cubeling Recall.
12. First playable Level Two route.
13. Love Letter completion flow.
14. Level Two polish and screenshot QA.

## Current Bug Priority

Fixed before new Level Two mechanics:

- main character stuck after leaving raised Totem platform away from the ramp;
- blue ramp walkable-surface/visual alignment;

Still open:

- Home house collision/doorway clipping.
- Frog tall-ledge failure dialogue regression (priority: Low-Medium, backlog).
  - Level Two currently no longer plays the intended “too high” Frog response when jumping at non-jumpable tall ledges/tiers or Elephant Totem hill.
  - Expected lines include: “That’s too high for me.” / “I can’t jump that high.” / “Too tall for this hop.”
  - Do not fix this during the red elevator correction pass unless it is a very easy win.

Backlog/polish after blockers:

- clearer visible Home door note;
- Home hint dialogue if player tries to leave before reading the note;
- smaller Frog low-ledge hop animation;
- less visibly snapped Frog ledge landing;
- grass tile actor-floating check;
- Level Two Frog spawn placement refinement;
- later title-card pacing polish.

## Future Alignment Backlog

Do not implement these now:

- Align tutorial barrier with blue mechanism visuals.
- Align Level One bridge with blue mechanism visuals.
- Consider a future Level One expansion that introduces Axolotl in a bounded water segment:
  - keep Frog jump-to-blue-button solution as baseline,
  - add blue crate -> Axolotl Totem release,
  - add a small river island + secondary blue button,
  - Axolotl swim to complete bridge before Love Letter pickup.
- Make button-to-mechanism connections more physically readable.
- Decide yellow button behavior.
- Explore yellow = timed versus yellow = powered.
- Add visual tokens for connected buttons/platforms/barriers.
- Add a real level select/start-flow router.
- Move debug reset out of player-facing controls.
- Build Love Letter archive/journal.
- Add additional Cubelings.

## Bug Prevention Backlog

Known recurring issues to prevent:

- asset orientation wrong;
- asset scale mismatch;
- asset not aligned to tile/obstacle;
- no collision on large props;
- collision blocks intended path;
- dialogue loops every update frame;
- visual effects spam or appear too early;
- autonomous Cubelings block required path;
- scene transition/title timing fires in the wrong scene.

See `11_bug_report_library.md` and root `bug_report.md`.

## Roadmap Shape

### Now

Documentation and planning reset.

### Next

Either clean up Home house doorway collision or proceed to the next Level Two feature slice if staying strictly in Level Two.

### Then

Elephant Echo + Elephant Cubeling Totem unlock/spawn slice.

### Later

Elephant unlock, red weight buttons, platform/elevator movement, Cubeling Recall, complete Level Two route.

## Shipping Rule

Each implementation pass should end with:

- `npm run build`;
- relevant smoke script;
- screenshot inspection;
- quality gates;
- progress update;
- bug report update if any bug was found or prevented.
