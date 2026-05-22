# Upgrade Scope — Level Editor Rounding Phase

## Why this phase matters

The level editor is moving from “debug transform tool” toward “level design + AI handoff environment.” Before creating Level 3, the editor needs to support three practical workflows:

1. **Refine existing levels** — adjust Tutorial, Level One, and Level Two with visual precision.
2. **Reduce object-list overload** — search/filter objects when tile records flood the editor list.
3. **Prepare for authored level sequences** — eventually scrub the intended solution/animation timeline.
4. **Prepare for asset-based level construction** — eventually browse and place known game assets.

## Recommended implementation order

### Now

1. Fix tile editability and clear locked/movable states.
2. Add object list search/filter UI.
3. Preserve and extend export metadata.

### Next

4. Add read-only asset library catalog.
5. Add timeline data model/skeleton.
6. Add timeline preview for moving platforms/buttons.

### Later

7. Add asset placement/spawning.
8. Add collider/proxy visualization and editing.
9. Add source patch apply/dry-run workflow.
10. Add full Level 3 creation workflow.

## Non-goals right now

- Full asset placement.
- Full timeline editor.
- Collider editing.
- Runtime physics simulation in editor.
- Engine migration.
- Browser editor rewriting source files.

## Design principle

Every editor interaction should produce machine-readable state that can be handed to AI.

The editor is not only for humans moving objects; it is also a **state-to-prompt compiler**.
