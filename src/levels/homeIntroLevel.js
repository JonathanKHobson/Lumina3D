import {
  TILE
} from "../config/constants.js";
import { boundsForGrid, sceneGridPoint } from "../core/grid.js";

export const HOME_WIDTH = 18;
export const HOME_HEIGHT = 9;
export const HOME_BOUNDS = boundsForGrid(HOME_WIDTH, HOME_HEIGHT, TILE);
export const HOME_POINTS = {
  entry: { x: HOME_BOUNDS.minX - 1.35, z: sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, 1, 5, TILE).z },
  arrival: sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, 2.2, 5, TILE),
  house: sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, 6.2, 3.1, TILE),
  note: sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, 6.2, 4.55, TILE),
  exit: sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, 15.2, 5, TILE)
};

export const HOME_NOTE_RADIUS = 1.5;
export const HOME_NOTE_EXIT_RADIUS = HOME_NOTE_RADIUS + 0.36;
export const HOME_EXIT_RADIUS = 1.85;
export const HOME_CINEMATIC_SPEED = 2.0;
export const HOME_TITLE_SECONDS = 1.65;
export const HOME_EXIT_FADE_SECONDS = 0.42;
export const HOME_TRAIL_HINT_SECONDS = 5.5;
export const HOME_ARROW_HINT_SECONDS = 11.0;
export const HOME_EXIT_CONFIRM_COOLDOWN = 1.2;

export const HOME_DOOR_NOTE_TEXT = `My love,

I went exploring.

I left little pieces of my heart along the trail.

Come find me when you\u2019re ready.

\u2014 Yours`;

export const HOME_WRONG_WAY_LINES = ["Not that way.", "I already came from there.", "The trail goes the other way."];
export const HOME_TRAIL_LINES = ["I'll follow the trail.", "I'm coming, love.", "Okay... I'll find you."];

export const HOME_PROPS = [
  ["forestTreeA", 0.5, 1.1, 0.95],
  ["forestTreeB", 15.6, 1.3, 0.9],
  ["forestTreeA", 4.0, 7.55, 0.72],
  ["forestTreeB", 17.0, 2.25, 0.78],
  ["forestBush", 1.1, 7.2, 0.9],
  ["forestBush", 14.4, 7.1, 0.85],
  ["forestBush", 8.8, 1.0, 0.72],
  ["forestBush", 16.4, 7.25, 0.68],
  ["forestRock", 3.2, 1.1, 0.78],
  ["forestRock", 12.2, 6.7, 0.7],
  ["forestRock", 5.0, 7.25, 0.58],
  ["forestRock", 13.4, 1.2, 0.58],
  ["forestGrass", 2.9, 6.6, 0.75],
  ["forestGrass", 11.2, 2.2, 0.72],
  ["forestGrass", 0.9, 3.4, 0.58],
  ["forestGrass", 9.8, 7.4, 0.55],
  ["forestGrass", 16.1, 3.7, 0.52],
  ["forestGrass", 12.9, 7.6, 0.5]
];
