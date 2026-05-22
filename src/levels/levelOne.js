import {
  DOOR_ROW,
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  SURFACE_Y,
  TILE,
  WORLD_BOUNDS
} from "../config/constants.js";
import { gridPoint } from "../core/grid.js";

export const LEVEL_ONE_WIDTH = LEVEL_WIDTH;
export const LEVEL_ONE_HEIGHT = LEVEL_HEIGHT;
export const LEVEL_ONE_BOUNDS = WORLD_BOUNDS;
export const LEVEL_ONE_TITLE_SECONDS = 1.65;
export const LEVEL_ONE_CINEMATIC_SPEED = 2.0;
export const LEVEL_ONE_WATER_COLUMNS = [5, 6, 7, 8];
export const LEVEL_ONE_CROSSING_ROW = DOOR_ROW;
export const LEVEL_ONE_CROSSING_Z = gridPoint(0, LEVEL_ONE_CROSSING_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).z;
export const LEVEL_ONE_LILY_PAD = {
  id: "level-one-lily-pad",
  position: {
    ...gridPoint(6.55, LEVEL_ONE_CROSSING_ROW + 0.18, LEVEL_WIDTH, LEVEL_HEIGHT, TILE),
    y: SURFACE_Y + 0.04
  },
  visualScale: { x: 2.6, y: 6.9, z: 2.6 },
  halfX: 1.55,
  halfZ: 1.26,
  radius: TILE * 0.34,
  rotationY: -Math.PI / 5,
  actorLift: 0.18
};
export const LEVEL_ONE_BLUE_BLOOM_MATS = {
  left: {
    id: "left",
    label: "left-blue-bloom-mat",
    held: { ...gridPoint(5.45, 1.18, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE), y: SURFACE_Y + 0.12 },
    docked: { ...gridPoint(5.26, LEVEL_ONE_CROSSING_ROW + 0.08, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE), y: SURFACE_Y + 0.16 },
    halfX: 1.48,
    halfZ: 0.78,
    rotationY: 0.02
  },
  right: {
    id: "right",
    label: "right-blue-bloom-mat",
    held: { ...gridPoint(7.62, 1.18, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE), y: SURFACE_Y + 0.12 },
    docked: { ...gridPoint(7.74, LEVEL_ONE_CROSSING_ROW + 0.08, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE), y: SURFACE_Y + 0.16 },
    halfX: 1.48,
    halfZ: 0.78,
    rotationY: -0.02
  }
};
export const LEVEL_ONE_BLUE_BLOOM_LATCH = {
  position: {
    ...gridPoint(6.55, 1.0, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE),
    y: SURFACE_Y + 0.16
  },
  halfX: 2.15,
  halfZ: 0.26,
  rotationY: 0
};
export const LEVEL_ONE_LOVE_LETTER_POINT = {
  ...gridPoint(8.05, LEVEL_ONE_CROSSING_ROW + 0.22, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE),
  y: SURFACE_Y + LEVEL_ONE_LILY_PAD.actorLift
};
export const LEVEL_ONE_LEFT_APPROACH = {
  ...gridPoint(4.15, LEVEL_ONE_CROSSING_ROW + 0.08, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE),
  radius: 2.05
};
export const LEVEL_ONE_RIGHT_APPROACH = {
  ...gridPoint(9.25, LEVEL_ONE_CROSSING_ROW + 0.02, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE),
  radius: 2.45
};
export const LEVEL_ONE_BUTTON_NOOK_LANDING = gridPoint(9.78, 2.25, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE);
export const LEVEL_ONE_RIGHT_BANK_LANDING = gridPoint(9, LEVEL_ONE_CROSSING_ROW, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE);
export const LEVEL_ONE_CROSSING_ACTOR_LIFT = LEVEL_ONE_LILY_PAD.actorLift;
export const LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS = 4.8;
export const LEVEL_ONE_BLUE_BLOOM_TIMING = {
  latchOpenAt: 0.2,
  driftStartAt: 0.5,
  loveLetterSurfaceAt: 0.65,
  loveLetterRiseSeconds: 1.25,
  dockStartAt: 4.15,
  dockedAt: LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS
};
export const LEVEL_ONE_BRIDGE_ROW = LEVEL_ONE_CROSSING_ROW;
export const LEVEL_ONE_BRIDGE_Z = LEVEL_ONE_CROSSING_Z;
export const LEVEL_ONE_BRIDGE_HALF_Z = LEVEL_ONE_BLUE_BLOOM_MATS.left.halfZ;
export const LEVEL_ONE_BRIDGE_ACTOR_LIFT = LEVEL_ONE_CROSSING_ACTOR_LIFT;
export const LEVEL_ONE_BRIDGE_VISUAL_Y = SURFACE_Y - 0.16;
export const LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y = 0.24;
export const LEVEL_ONE_BRIDGE_DECK_Y = SURFACE_Y + 0.11;
export const LEVEL_ONE_BRIDGE_DECK_HEIGHT = 0.16;
export const LEVEL_ONE_PARTIAL_BRIDGE = LEVEL_ONE_LEFT_APPROACH;
export const LEVEL_ONE_COMPLETE_BRIDGE_A = LEVEL_ONE_BLUE_BLOOM_MATS.left.docked;
export const LEVEL_ONE_COMPLETE_BRIDGE_B = LEVEL_ONE_BLUE_BLOOM_MATS.right.docked;
export const LEVEL_ONE_PARTIAL_BRIDGE_MIN_X = gridPoint(4.4, LEVEL_ONE_CROSSING_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
export const LEVEL_ONE_PARTIAL_BRIDGE_MAX_X = LEVEL_ONE_LILY_PAD.position.x;
export const LEVEL_ONE_COMPLETE_BRIDGE_MIN_X = LEVEL_ONE_PARTIAL_BRIDGE_MIN_X;
export const LEVEL_ONE_COMPLETE_BRIDGE_MAX_X = gridPoint(8.95, LEVEL_ONE_CROSSING_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
export const LEVEL_ONE_JUMP_ZONE = {
  x: LEVEL_ONE_LEFT_APPROACH.x,
  z: LEVEL_ONE_LEFT_APPROACH.z,
  radius: LEVEL_ONE_LEFT_APPROACH.radius
};
export const LEVEL_ONE_LANDING = LEVEL_ONE_RIGHT_BANK_LANDING;
export const LEVEL_ONE_FROG_WATER_SPEECH_COOLDOWN = 1.6;
export const LEVEL_ONE_HINT_SECONDS = 7.0;
export const LEVEL_ONE_BUTTON = gridPoint(10.8, 2.15, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);

export const LEVEL_ONE_PROPS = [
  ["forestTreeA", 0.6, 1.2, 0.95],
  ["forestTreeB", 12.1, 1.2, 0.95],
  ["forestTreeB", 12.2, 7.6, 0.85],
  ["forestBush", 2.0, 7.2, 0.9],
  ["forestBush", 10.5, 6.8, 0.8],
  ["forestRock", 3.0, 1.2, 0.75],
  ["forestRock", 11.5, 2.1, 0.72],
  ["forestGrass", 4.2, 6.6, 0.72],
  ["forestGrass", 9.0, 1.55, 0.68]
];

export const LEVEL_ONE = {
  width: LEVEL_ONE_WIDTH,
  height: LEVEL_ONE_HEIGHT,
  waterColumns: LEVEL_ONE_WATER_COLUMNS,
  crossingRow: LEVEL_ONE_CROSSING_ROW,
  crossingZ: LEVEL_ONE_CROSSING_Z,
  lilyPad: LEVEL_ONE_LILY_PAD,
  blueBloomMats: LEVEL_ONE_BLUE_BLOOM_MATS,
  blueBloomLatch: LEVEL_ONE_BLUE_BLOOM_LATCH,
  loveLetter: LEVEL_ONE_LOVE_LETTER_POINT,
  button: LEVEL_ONE_BUTTON
};
