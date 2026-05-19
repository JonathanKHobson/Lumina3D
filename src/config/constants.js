import { boundsForGrid } from "../core/grid.js";

export const TILE = 2.0;
export const FLOOR_TARGET = TILE * 1.04;
export const SURFACE_Y = FLOOR_TARGET;
export const LEVEL_WIDTH = 14;
export const LEVEL_HEIGHT = 9;
export const WALL_COLUMN = 7;
export const DOOR_ROW = 4;
export const POSSESSION_RADIUS = 1.85;
export const TRANSFER_INPUT_GRACE_RADIUS = 0.35;
export const BUTTON_RADIUS = 0.78;
export const SPELLBOOK_RADIUS = 0.85;
export const LOVE_LETTER_BLOCK_RADIUS = 0.66;
export const LOVE_LETTER_APPROACH_RADIUS = 2.65;
export const LOVE_LETTER_LESSON_COOLDOWN = 1.25;
export const NUDGE_REPEAT_WINDOW = 3.4;
export const FROG_PATROL_SPEED = 0.86;
export const FROG_DOORWAY_CLEAR_SPEED = 1.18;
export const FROG_PATROL_PAUSE_MIN = 0.75;
export const FROG_PATROL_PAUSE_MAX = 1.55;
export const FROG_CELEBRATION_SPEED = 0.9;
export const FROG_CELEBRATION_MIN_DISTANCE = 2.35;
export const FROG_CELEBRATION_PERCH_RADIUS = 0.36;
export const BUTTON_TOP_REST_Y = 0.14;
export const BUTTON_TOP_PRESSED_Y = 0.055;
export const JUMP_DURATION = 0.78;
export const CAMERA_ROTATE_STEP = Math.PI / 4;
export const CAMERA_FOLLOW_EASE = 0.001;
export const CAMERA_YAW_EASE = 0.0007;
export const ACTOR_BLOCK_PADDING = 0.1;
export const FROG_SMALL_HOP_HEIGHT = 0.22;
export const FROG_JUMP_LIFT = 2.35;
export const BARRIER_COLUMN_HALF_TARGET = TILE * 0.62;
export const SPEECH_SECONDS = 2.2;
export const CELEBRATION_MIN_SECONDS = 2.15;
export const CELEBRATION_HEART_INTERVAL = 0.82;
export const LOVE_LETTER_REVEAL_SECONDS = 1.65;
export const LOVE_LETTER_ATTENTION_BOUNCE_SECONDS = 0.58;
export const LOVE_LETTER_SPARKLE_INTERVAL = 4.2;
export const LOVE_LETTER_HEART_INTERVAL = 6.4;
export const LOVE_LETTER_BOUNCE_INTERVAL = 5.2;
export const LOVE_LETTER_REMINDER_SECONDS = 8.4;
export const LOVE_LETTER_MESSAGE_DELAY_SECONDS = 1.2;
export const LOVE_LETTER_MESSAGE_INPUT_BUFFER_SECONDS = 0.3;
export const UNLOCK_STORAGE_KEY = "lumina3d.cubelingUnlocks.v1";

export const WORLD_BOUNDS = boundsForGrid(LEVEL_WIDTH, LEVEL_HEIGHT, TILE);

export const MOVE_KEYS = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right"
};
