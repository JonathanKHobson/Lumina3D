# Implementation Guardrails

## Preserve scope

This handoff is a small Level Two placement/readability slice plus one Blue Ramp visual-mechanism improvement.

Do not turn it into a broad Level Two redesign.

## Safe edit order

1. Inspect current source and usages.
2. Apply pure transform data edits in `src/levels/levelTwo.js`.
3. Build and run object/manifest tools to confirm source-backed values.
4. Implement the Blue Ramp dormant platform visual in the smallest stable runtime path.
5. Inspect/update only the colliders or transition zones that are actually affected.
6. Run required validation.

## Collision/source rules

- Treat collider proxies from the editor export as visual handoff context.
- Update collider source only when source inspection proves the collider is separate from object position, or the Blue Ramp visual requires a deliberate collider contract change.
- Red Elevator A transition zones have separate source refs; inspect whether their centers should remain as-is or follow platform movement. Do not move them just because the platform moved.
- Props with visual proxy hints still need collision/readability verification, especially if a physical prop collider is separate from the visual transform.

## Gameplay/narrative tone

- The Blue Ramp visual should be gentle and readable, not flashy or noisy.
- The player should understand the mechanism through color, placement, and motion.
- Avoid punishing failure states. If something is inactive, it should communicate “not yet” rather than “you did something wrong.”

## Editor separation

- Do not make browser/editor code directly rewrite gameplay source files.
- Keep `/editor/` tooling separate from the playable game at `/`.
- Do not rely on editor-only objects at runtime unless they are already part of the gameplay pipeline.
