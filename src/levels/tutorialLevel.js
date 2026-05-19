import {
  BARRIER_COLUMN_HALF_TARGET,
  DOOR_ROW,
  FLOOR_TARGET,
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  TILE,
  WALL_COLUMN
} from "../config/constants.js";
import { gridPoint } from "../core/grid.js";

export const START = {
  human: { ...gridPoint(1.4, 5.6, LEVEL_WIDTH, LEVEL_HEIGHT, TILE), facing: { x: 1, z: 0, name: "east" } },
  frog: { ...gridPoint(4.2, 4.6, LEVEL_WIDTH, LEVEL_HEIGHT, TILE), facing: { x: 1, z: 0, name: "east" } }
};

export const FROG_TOTEM = gridPoint(1.6, 1.6, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
export const TUTORIAL_BUTTON = gridPoint(9.2, 3.0, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
export const SPELLBOOK = gridPoint(11.5, 5.5, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);

export const DOORWAY_CLEAR_HALF_X = TILE * 1.15;
export const DOORWAY_CLEAR_HALF_Z = TILE * 0.82;
export const DOORWAY_CLEAR_TARGET_OFFSET = TILE * 1.75;
export const BARRIER_TOP_HEIGHT = 0.72;
export const FROG_REVEAL_SECONDS = 0.78;
export const RIGHT_FLOOR_REVEAL_SECONDS = 0.72;
export const BARRIER_REVEAL_FLOOR_LEAD = 0.42;
export const BARRIER_REVEAL_SECONDS = 1.28;
export const BARRIER_REVEAL_STAGGER = 0.07;
export const LOVE_LETTER_BARRIER_REVEAL_DISTANCE = 3.35;
export const FROG_ECHO_RADIUS = 1.35;
export const FROG_TOTEM_RADIUS = 0.7;
export const FROG_TOTEM_REVEAL_DELAY = 1.35;
export const FROG_TOTEM_REVEAL_SECONDS = 0.9;
export const FROG_ECHO_SPEECH_COOLDOWN = 1.9;
export const FROG_TOTEM_SPEECH_COOLDOWN = 1.8;
export const FROG_ECHO_TINT = 0xd1d5d1;
export const FROG_ECHO_OPACITY = 0.36;
export const FROG_ECHO_SPARKLE = 0xc7d1c9;
export const FROG_TOTEM_SPARKLE = 0xffe486;
export const FROG_TOTEM_VISUAL_SCALE = 0.38;

export const FLOOR_EDGE_MIN_Z = gridPoint(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).z - FLOOR_TARGET * 0.5;
export const FLOOR_EDGE_MAX_Z = gridPoint(0, LEVEL_HEIGHT - 1, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).z + FLOOR_TARGET * 0.5;
export const BARRIER_END_CAP_COLUMN_EDGE_OFFSET = BARRIER_COLUMN_HALF_TARGET * 0.5;

export const TUTORIAL_LEVEL = {
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  wallColumn: WALL_COLUMN,
  doorRow: DOOR_ROW,
  start: START,
  frogTotem: FROG_TOTEM,
  button: TUTORIAL_BUTTON,
  loveLetter: SPELLBOOK
};

export const STEP_IDS = [
  "move_up",
  "move_down",
  "move_horizontal",
  "rotate_camera",
  "inspect_frog_echo",
  "collect_frog_totem",
  "approach_frog",
  "possess_frog",
  "frog_move",
  "return_human",
  "possess_frog_again",
  "jump_wall",
  "press_button",
  "return_after_button",
  "collect_love_letter",
  "complete"
];

export const GUIDED_STEP_COUNT = STEP_IDS.length - 1;

export const TUTORIAL_STEPS = {
  move_up: "Move up with W or ↑.",
  move_down: "Good. Now move down with S or ↓.",
  move_horizontal: "Move left or right with A/D or ←/→.",
  rotate_camera: "Rotate the camera with Q or E.",
  inspect_frog_echo: "Walk to the Frog Echo.",
  collect_frog_totem: "Collect the Frog Cubeling Totem to awaken the Frog Cubeling.",
  approach_frog: "Walk close to the Frog Cubeling.",
  possess_frog: "Press Shift to become the Frog Cubeling.",
  frog_move: "Move around as the Frog Cubeling.",
  return_human: "Press Shift to return to your character.",
  possess_frog_again: "Become the Frog Cubeling again, then move near the barrier.",
  jump_wall: "Face the barrier and press Space to jump over it.",
  press_button: "Step on the blue button.",
  return_after_button: "Press Shift to return to your character.",
  collect_love_letter: "Walk through the doorway and collect the Love Letter.",
  complete: "Love Letter collected. Tutorial complete."
};

export const FREE_PLAY_PROMPT = "Explore freely: unlock the Frog Cubeling, hop the barrier, press the button, collect the Love Letter.";

export const SPEECH_STEPS = {
  move_up: { anchor: "human", text: "I can move. Try W or ↑." },
  move_down: { anchor: "human", text: "Now guide me back down." },
  move_horizontal: { anchor: "human", text: "A or D moves me sideways." },
  rotate_camera: { anchor: "human", text: "Q and E turn the view." },
  inspect_frog_echo: { anchor: "frogEcho", text: "Frog Echo. Something is missing here." },
  collect_frog_totem: { anchor: "frogTotem", text: "Collect my Totem to awaken the Frog Cubeling." },
  approach_frog: { anchor: "frog", text: "The Frog Cubeling is awake. Come close." },
  possess_frog: { anchor: "frog", text: "Press Shift beside the Frog Cubeling." },
  frog_move: { anchor: "frog", text: "Hop the Frog Cubeling around a little." },
  return_human: { anchor: "human", text: "Shift brings you back here." },
  possess_frog_again: { anchor: "frog", text: "Take over the Frog Cubeling again and head to the barrier." },
  jump_wall: { anchor: "frog", text: "Space makes this Cubeling jump count." },
  press_button: { anchor: "button", text: "Step on the blue button." },
  return_after_button: { anchor: "human", text: "Shift back, then walk through." },
  collect_love_letter: { anchor: "loveLetter", text: "The Love Letter is for your character." },
  complete: { anchor: "human", text: "Tutorial complete." }
};
