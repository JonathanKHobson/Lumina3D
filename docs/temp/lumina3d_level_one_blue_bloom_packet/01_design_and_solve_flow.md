# Level One Design Spec — Blue Bloom Crossing

## One-sentence pitch

The Frog Cubeling uses a central lily pad to reach a blue button; the button releases blue flower mats that dock against the lily pad, creating a human-safe crossing and revealing the Love Letter.

## Player-facing flow

1. Enter Level One and see the river, Frog, central lily pad, blue button, and held blue-flower mats.
2. Human cannot cross the river.
3. Transfer into Frog.
4. Frog jumps left bank → lily pad.
5. Frog jumps lily pad → right-bank button nook.
6. Frog presses blue button.
7. Blue flower latch opens; flower mats drift in.
8. Flower mats dock against the lily pad and become walkable.
9. Love Letter rises from the right-side mat.
10. Switch back to human.
11. Human crosses left bloom mat → lily pad → right bloom mat.
12. Human collects Love Letter.

## Visual language

Blue button controls blue-marked mechanism:
- blue button;
- blue latch/gate;
- blue flower accents on mats;
- blue dock markers/glow.

Avoid dominant red flowers so future red buttons retain clear meaning.

## Tone

Cozy, magical, small realization. No heavy tutorialing. The level should feel like:

> “Oh, the lily pad was not just for the Frog jump — it is also the anchor for the flower crossing.”

## Suggested dialogue

Use one-shot flags and cooldowns.

- Start: `Find the Love Letter.`
- Frog blocked by water: `I need to jump, not swim.`
- Frog first lands on lily pad: `This leaf can hold my hops!`
- Blue button press: `The blue blooms are drifting in!`
- Human returns after crossing is ready: `Now I can cross.`
- Frog near Love Letter: `I brought it closer, but you pick it up.`

## Important non-goals

- No Axolotl.
- No Crocodile.
- No Totem.
- No green button.
- No carrying.
- No logs/dam.
- No physics-driven floating objects.
- No broad architecture rewrite.
