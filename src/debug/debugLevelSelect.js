import { SCENES } from "../config/scenes.js";

export const DEBUG_SCENE_SHORTCUTS = {
  Digit1: SCENES.TUTORIAL,
  Digit2: SCENES.HOME,
  Digit3: SCENES.LEVEL_ONE,
  Digit4: SCENES.LEVEL_TWO
};

export function debugSceneForCode(code) {
  return DEBUG_SCENE_SHORTCUTS[code] || "";
}
