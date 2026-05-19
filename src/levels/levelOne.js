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
export const LEVEL_ONE_WATER_COLUMNS = [6, 7];
export const LEVEL_ONE_BRIDGE_ROW = DOOR_ROW;
export const LEVEL_ONE_BRIDGE_Z = gridPoint(0, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).z;
export const LEVEL_ONE_PARTIAL_BRIDGE = gridPoint(5.65, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
export const LEVEL_ONE_COMPLETE_BRIDGE_A = gridPoint(6.55, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
export const LEVEL_ONE_COMPLETE_BRIDGE_B = gridPoint(7.35, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
export const LEVEL_ONE_PARTIAL_BRIDGE_MIN_X = gridPoint(4.9, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
export const LEVEL_ONE_PARTIAL_BRIDGE_MAX_X = gridPoint(6.35, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
export const LEVEL_ONE_COMPLETE_BRIDGE_MIN_X = LEVEL_ONE_PARTIAL_BRIDGE_MIN_X;
export const LEVEL_ONE_COMPLETE_BRIDGE_MAX_X = gridPoint(8.1, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
export const LEVEL_ONE_BRIDGE_HALF_Z = 0.92;
export const LEVEL_ONE_BRIDGE_VISUAL_Y = SURFACE_Y - 0.16;
export const LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y = 0.24;
export const LEVEL_ONE_BRIDGE_DECK_Y = SURFACE_Y + 0.11;
export const LEVEL_ONE_BRIDGE_DECK_HEIGHT = 0.16;
export const LEVEL_ONE_BRIDGE_ACTOR_LIFT = 0.22;
export const LEVEL_ONE_JUMP_ZONE = {
  x: LEVEL_ONE_PARTIAL_BRIDGE.x,
  z: LEVEL_ONE_BRIDGE_Z,
  radius: 2.55
};
export const LEVEL_ONE_LANDING = gridPoint(8.25, LEVEL_ONE_BRIDGE_ROW, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
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
  bridgeRow: LEVEL_ONE_BRIDGE_ROW,
  bridgeZ: LEVEL_ONE_BRIDGE_Z,
  button: LEVEL_ONE_BUTTON
};
