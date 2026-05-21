import { SCENES } from "./scenes.js";

export const LEVEL_REGISTRY = [
  {
    sceneId: SCENES.TUTORIAL,
    displayName: "Tutorial",
    debugKey: "Digit1",
    catalogId: "tutorial",
    smokeId: "tutorial",
    editorSupported: true,
    sourceFiles: [
      "src/levels/tutorialLevel.js",
      "src/scenes/tutorialScene.js",
      "src/scenes/tutorialFlow.js",
      "scripts/lib/levelCatalog.js"
    ]
  },
  {
    sceneId: SCENES.HOME,
    displayName: "Home Intro",
    debugKey: "Digit2",
    catalogId: "home_intro",
    smokeId: "home_intro",
    editorSupported: true,
    sourceFiles: [
      "src/levels/homeIntroLevel.js",
      "src/scenes/homeIntroScene.js",
      "src/scenes/homeIntroFlow.js",
      "scripts/lib/levelCatalog.js"
    ]
  },
  {
    sceneId: SCENES.LEVEL_ONE,
    displayName: "Level One",
    debugKey: "Digit3",
    catalogId: "level_one",
    smokeId: "level_one",
    editorSupported: true,
    sourceFiles: [
      "src/levels/levelOne.js",
      "src/scenes/levelOneScene.js",
      "src/scenes/levelOneFlow.js",
      "scripts/lib/levelCatalog.js"
    ]
  },
  {
    sceneId: SCENES.LEVEL_TWO,
    displayName: "Level Two",
    debugKey: "Digit4",
    catalogId: "level_two",
    smokeId: "level_two",
    editorSupported: true,
    sourceFiles: [
      "src/levels/levelTwo.js",
      "src/scenes/levelTwoScene.js",
      "src/scenes/levelTwoFlow.js",
      "scripts/lib/levelCatalog.js"
    ]
  },
  {
    sceneId: SCENES.LEVEL_THREE,
    displayName: "Level Three",
    debugKey: "Digit5",
    catalogId: "level_three",
    smokeId: "level_three",
    editorSupported: true,
    sourceFiles: [
      "src/levels/levelThree.js",
      "src/scenes/levelThreeScene.js",
      "src/scenes/levelThreeFlow.js",
      "scripts/lib/levelCatalog.js"
    ]
  }
];

export const LEVEL_REGISTRY_BY_SCENE = Object.fromEntries(
  LEVEL_REGISTRY.map((entry) => [entry.sceneId, entry])
);

export const LEVEL_REGISTRY_BY_DEBUG_KEY = Object.fromEntries(
  LEVEL_REGISTRY.map((entry) => [entry.debugKey, entry.sceneId])
);

export function listRegisteredLevels() {
  return LEVEL_REGISTRY.map((entry) => ({ ...entry, sourceFiles: [...entry.sourceFiles] }));
}

export function registeredLevelForScene(sceneId) {
  return LEVEL_REGISTRY_BY_SCENE[sceneId] || null;
}

export function registeredSceneForDebugKey(debugKey) {
  return LEVEL_REGISTRY_BY_DEBUG_KEY[debugKey] || "";
}

export function debugKeyForScene(sceneId) {
  return registeredLevelForScene(sceneId)?.debugKey || "";
}

export function displayNameForScene(sceneId) {
  return registeredLevelForScene(sceneId)?.displayName || sceneId;
}
