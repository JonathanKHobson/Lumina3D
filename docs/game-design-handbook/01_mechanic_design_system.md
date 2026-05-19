# Mechanic Design System

## Core Loop

1. See a Love Letter, path, or obstacle.
2. Explore as the main character.
3. Use a Cubeling when the main character cannot solve the obstacle alone.
4. Trigger a mechanism or create access.
5. Return to the main character.
6. Collect the Love Letter.
7. Read the Love Letter message and complete the level.

## Main Character

Current role:

- walks and explores;
- reads notes and Love Letters;
- collects Love Letters;
- collects Cubeling Totems;
- transfers into Cubelings when near them;
- cannot solve every physical obstacle alone.

Rules:

- Important story collectibles are main-character-only.
- The main character must be physically near a Cubeling to transfer into it.
- The main character should not be able to collect while inside a Cubeling.
- The main character should remain the emotional focus of level completion.

Implementation implications:

- Story collectibles need actor-gated collection checks.
- Transfer radius should be more forgiving than actor collision radius.
- Dialogue should explain main-character-only collection when a Cubeling bumps into a story item.

## Frog Cubeling

Current status: introduced.

Role:

- jumping Cubeling;
- crosses barriers, gaps, water gaps, or ledges;
- presses standard blue buttons;
- creates access for the main character;
- cannot collect Love Letters or Cubeling Totems.

Behavior rules:

- Frog can press blue buttons.
- Frog cannot press future red weight buttons.
- Frog cannot swim; it jumps across intended water/gap crossings.
- Frog should have independent local patrol behavior, not follow the main character.
- Frog should stay reachable but should not cluster around the main character.

Level design use:

- Use Frog to teach reach, jump arcs, ledge/gap thinking, and alternate routes.
- Do not give Frog unrelated abilities in Level Two.
- Frog section in Level Two should reuse familiar jump + blue button behavior.

## Elephant Cubeling

Current status: planned for Level Two.

Role:

- heavy Cubeling;
- activates red weight buttons;
- moves slower than Frog;
- feels grounded and substantial;
- does not need a major special ability beyond weight activation for Level Two.

Behavior rules:

- Elephant activates red buttons.
- Frog and main character should not activate red buttons.
- Elephant should not wander like Frog when unpossessed.
- Elephant idle can be simple: body bob, settling shake, dust puff, or slow breathing.
- Elephant should be easy to transfer into when near it.

Design risk:

- If Elephant is too large, it blocks paths and camera readability.
- If Elephant is too small, red weight logic will not read.
- Its collision radius must be tuned with the red button radius.

## Cubeling Echo

Current status: introduced for Frog, planned for Elephant.

Definition:

A Cubeling Echo is a visible spawn/home-anchor point for a Cubeling.

Before unlock:

- appears as a transparent/ghost-like version of that Cubeling;
- is non-solid;
- is not controllable;
- may speak or label itself;
- points the player toward the relevant Cubeling Totem.

After unlock:

- becomes or produces the real Cubeling;
- remains important as that Cubeling's recall/home point.

Accessibility rule:

Do not rely only on color. Each Echo should eventually have an identifying name, silhouette, shape marker, outline, icon, or other non-color cue.

## Cubeling Totem

Definition:

A Cubeling Totem is the unlock collectible for a Cubeling.

Rules:

- only the main character can collect it;
- collecting it unlocks the relevant Cubeling;
- tutorial can restage Frog Totem pickup for learning;
- normal levels should treat Totems as persistent unlocks across save data.

Visual requirements:

- smaller and more collectible-like than an Echo;
- floating, shiny, glowing, bobbing, or spinning;
- visually distinct from the inactive Echo.

## Love Letter

Definition:

The Love Letter is the main level reward and story payoff.

Rules:

- only the main character can collect it;
- Cubelings should be blocked by it or unable to collect it;
- each Love Letter can have unique message text;
- Love Letter collection starts celebration, message popup, continue prompt, and completion menu.

Design role:

- The Love Letter should be visible early enough that the player understands what the puzzle is helping them reach.
- It can sparkle, bob, spin, or emit small hearts as a gentle attention cue.
- It should not be hidden like a secret unless the level is explicitly about secrets.

## Buttons And Mechanisms

Mechanisms need clear cause and effect. Buttons should not feel like arbitrary magic unless the story later justifies that.

Core rule:

- button color communicates mechanism type.
- button state should be visible.
- connected mechanism should visibly change in response.
- puzzle objects should expose collision and state in `render_game_to_text()`.

See `02_color_coded_buttons_and_mechanisms.md`.

