import { registeredSceneForDebugKey, LEVEL_REGISTRY } from "../config/levelRegistry.js";

export const DEBUG_SCENE_SHORTCUTS = Object.fromEntries(
  LEVEL_REGISTRY.map((entry) => [entry.debugKey, entry.sceneId])
);

export function debugSceneForCode(code) {
  return registeredSceneForDebugKey(code);
}
