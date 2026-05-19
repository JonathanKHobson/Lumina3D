# Button Color Grammar v2

## Purpose

This is the current handbook for button semantics in Lumina3D. It documents what is locked, what is likely, and what is still exploratory so we can keep coding and narrative scope aligned.

## Current Button Grammar

| Color | Status | Mental model | Core behavior |
|---|---|---|---|
| Blue | `LOCKED / CURRENT DIRECTION` | `Press once.` | Ordinary one-and-done activation. |
| Red | `LOCKED / CURRENT DIRECTION` | `Hold with weight.` | Held-pressure/weight activation with slow reverse when the weight leaves. |
| Yellow | `STRONG CANDIDATE` | `Press and hurry.` | Timed activation with quick snap/reset at timer end. |
| Green | `LOCKED / CURRENT DIRECTION FOR DESIGN SYSTEM, not implemented` | `Press again to switch/cycle.` | Repeatable or cycle-based activation. |

## Color Rules

### Blue button — Standard / one-and-done activation

Status: `LOCKED / CURRENT DIRECTION`

Player model: `Blue = Press once.`

Behavior:

- Blue buttons are ordinary/simpler buttons.
- They are pressed once.
- Once pressed, the mechanism activates and generally stays active (persistent/sold-state).
- The button does not need to be held.
- Blue buttons usually cannot be pressed again to cycle states.
- If a blue action needs reversal, the reversal should come from another button/mechanism or a full-level reset.

Design examples:

- Press blue button -> blue gate opens.
- Press blue button -> bridge/platform activates.
- Press blue button -> simple obstacle is solved.

Notes:

- Source/Confidence: `Direct user idea`, `Locked current direction`, `Needs playtest validation`.
- Already used in tutorial and Level One context.

### Red button — Weight / held pressure activation

Status: `LOCKED / CURRENT DIRECTION`

Player model: `Red = Hold with weight.`

Behavior:

- Red buttons require weight.
- Elephant is the first Cubeling that can activate red buttons.
- Main character and Frog should not activate red buttons.
- Red buttons stay active while required weight is present.
- When weight leaves, connected mechanisms reverse in a readable slow direction.
- Reversal should begin shortly after weight leaves (no instant snap).
- If connected to elevators/platforms, platform movement reverses/backtracks while the button is releasing.

Design examples:

- Elephant stands on red button -> elevator lowers.
- Elephant steps off -> elevator slowly rises back.
- Elephant stands on red button -> heavy platform aligns.
- Elephant leaves -> mechanism slowly returns.

Notes:

- Source/Confidence: `Direct user clarification`, `Locked current direction`, `Needs playtest validation`.
- Current plan: Level Two introduction only.

### Yellow button — Timed activation

Status: `STRONG CANDIDATE`

Player model: `Yellow = Press and hurry.`

Behavior:

- Yellow buttons are timed.
- Press once -> mechanism activates.
- A visible countdown begins.
- On timer end, mechanism snaps back/reset quickly.
- Yellow’s active timer should be longer than red release timing, but its reverse/settle should be quick.

Design examples:

- Press yellow button -> gate opens for 8 seconds.
- Press yellow button -> temporary bridge appears.
- Timer ends -> bridge/gate disappears quickly/reset.

Legacy option (kept as exploratory only):

- `Yellow = power/energy` remains an older brainstorm and is `EXPLORATORY / BACKLOG` only.

Notes:

- Source/Confidence: `Shared brainstorm`, `Direct user direction`, `Strong candidate`, `Needs playtest validation`.

### Green button — Repeatable / multi-state activation

Status: `LOCKED / CURRENT DIRECTION FOR DESIGN SYSTEM` (design lock, implementation later)

Player model: `Green = Press again to switch/cycle.`

Behavior:

- Green buttons remain interactable after first press.
- They can be pressed multiple times.
- They can toggle mechanisms between states, reverse previous action, cycle through multi-states, or trigger additional connected actions.
- They are the primary way to model puzzle controls that need explicit state memory in the room.

Design examples:

- Press once -> bridge moves left.
- Press again -> bridge moves right.
- Press once -> gate A opens and gate B closes.
- Press again -> gate A closes and gate B opens.
- Press repeatedly -> platform cycles low / mid / high.
- Press repeatedly -> rotating bridge cycles orientations.

Notes:

- Source/Confidence: `Direct user clarification`, `Locked current direction`, `Needs prototype validation`.
- Implementation status: `not implemented in current pass`.

## Mechanism readability requirements

For each button+mechanism pairing, the level must communicate:

- what activates it
- who can activate it
- whether it is temporary or persistent
- whether it reverses
- and when the reversal begins/finishes

## Source mapping (compact)

- `Direct user idea`: Blue, Red, Yellow=timed, Green behavior.
- `Shared brainstorm`: Yellow as timed activation (timing strategy), red slow reverse pacing.
- `Locked current direction`: all four colors are now in the handbook with Green held as "documented but not yet implemented."
- `Exploratory`: Yellow=power/energy retained for history only.
