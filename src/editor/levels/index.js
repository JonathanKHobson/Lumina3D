import { levelEditorAdapter as homeIntroAdapter } from "./homeIntroAdapter.js";
import { levelEditorAdapter as levelOneAdapter } from "./levelOneAdapter.js";
import { levelEditorAdapter as tutorialAdapter } from "./tutorialAdapter.js";
import { levelEditorAdapter as levelTwoAdapter } from "../levelTwoAdapter.js";

export const LEVEL_EDITOR_ADAPTERS = [
  tutorialAdapter,
  homeIntroAdapter,
  levelOneAdapter,
  levelTwoAdapter
].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const DEFAULT_LEVEL_EDITOR_ID = "level_two";

export function getLevelEditorAdapter(levelId) {
  return LEVEL_EDITOR_ADAPTERS.find((adapter) => adapter.id === levelId) || null;
}

export function getDefaultLevelEditorAdapter() {
  return getLevelEditorAdapter(DEFAULT_LEVEL_EDITOR_ID) || LEVEL_EDITOR_ADAPTERS[0] || null;
}

export function getSupportedLevelIds() {
  return LEVEL_EDITOR_ADAPTERS.map((adapter) => adapter.id);
}
