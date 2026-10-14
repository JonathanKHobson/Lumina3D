# Button Color Grammar v2

## Purpose

This is the current handbook for button semantics in Lumina3D. It documents what is locked, what is likely, and what is still exploratory so we can keep coding and narrative scope aligned.

## Current Button Grammar

| Color | Status | Mental model | Core behavior |
|---|---|---|---|
| Blue | `LOCKED / CURRENT DIRECTION` | `Press once.` | Ordinary one-and-done activation. |
| Red | `LOCKED / CURRENT DIRECTION` | `Hold with weight; mechanism cycles.` | Heavy held activation that continuously cycles the connected mechanism while held. |
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
- Future alignment note (future scope, not current implementation):
  - Level One can be expanded so a blue button opens a blue crate (on main-character side),
    and that crate releases the Axolotl Cubeling Totem.
  - That keeps blue behavior as one-time, persistent activation while adding a cleaner
    mechanism cue for bridge completion.

### Red button — Heavy continuous cycle activation

Status: `LOCKED / CURRENT DIRECTION`

Player model: `Red = Hold with weight; mechanism cycles.`

Behavior:

- Red buttons require weight.
- Elephant is the first Cubeling that can activate red buttons.
- Main character and Frog should not activate red buttons.
- Red buttons stay active only while required weight is present.
- While Elephant remains on a red button, the connected mechanism continuously cycles through its movement.
- For an elevator, that means it can rise to the top, lower to the bottom, then rise again while Elephant keeps holding the button.
- When Elephant leaves, the mechanism stops cycling or returns to its default/rest state.
- For early levels, prefer a readable return to default/rest unless a specific puzzle needs stop-in-place behavior.
- Red buttons are not one-time buttons and are not latch buttons.

Design examples:

- Elephant stands on red button -> elevator begins cycling up and down.
- Elephant stays on red button -> elevator keeps cycling between endpoints.
- Elephant steps off -> elevator stops or returns to its default/rest position.
- Elephant stands on red button -> human elevator cycles so the main character can board when it returns to ground level.

Notes:

- Source/Confidence: `Direct user clarification`, `Locked current direction`, `Needs playtest validation`.
- Current plan: Level Two introduction only.
- Level Two implementation note: Red Elevator A currently teaches Elephant weight and access. Before building Elevator B or the final route, update the red mechanism prototype so at least one red button/elevator proves the continuous-cycle behavior end to end.

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
- `Direct user clarification`: Red buttons are heavy continuous-cycle buttons, not latch or one-shot buttons.
- `Shared brainstorm`: Yellow as timed activation (timing strategy), red release/default behavior per mechanism.
- `Locked current direction`: all four colors are now in the handbook with Green held as "documented but not yet implemented."
- `Exploratory`: Yellow=power/energy retained for history only.
