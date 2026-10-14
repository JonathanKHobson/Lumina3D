import { runAllowedCommand } from "./commandRunner.js";

const SUITE_COMMANDS = {
  basic: ["getLevelManifest", "listLevelObjects", "runSceneSmoke"],
  collider: ["validateMissingColliders", "validateFloatColliders"],
  editor_patch: ["runEditorSmoke"],
  full: [
    "build",
    "getLevelManifest",
    "listLevelObjects",
    "runSceneSmoke",
    "validateMissingColliders",
    "validateFloatColliders",
    "runEditorSmoke"
  ]
};

export function listValidationSuites() {
  return Object.keys(SUITE_COMMANDS);
}

function commandParamsFor(commandId, { levelId, patchPath }) {
  if (commandId === "explainEditorPatch") return { patchPath };
  if (commandId === "build" || commandId === "runEditorSmoke") return {};
  return { levelId };
}

export async function runBuild({ mode = "summary" } = {}) {
  const previewChars = mode === "full" ? 8000 : 3000;
  return runAllowedCommand("build", {}, { previewChars });
}

export async function runLevelValidationSuite({
  levelId,
  suite = "basic",
  patchPath = ""
} = {}) {
  if (!levelId || typeof levelId !== "string") {
    throw new Error("levelId is required.");
  }
  if (!SUITE_COMMANDS[suite]) {
    throw new Error(`Unknown validation suite: ${suite}`);
  }

  const commandIds = [...SUITE_COMMANDS[suite]];
  const skipped = [];
  if (suite === "editor_patch" && patchPath) {
    commandIds.push("explainEditorPatch");
  } else if (suite === "editor_patch") {
    skipped.push({
      commandId: "explainEditorPatch",
      reason: "No patchPath supplied."
    });
  }

  const results = [];
  for (const commandId of commandIds) {
    const result = await runAllowedCommand(commandId, commandParamsFor(commandId, { levelId, patchPath }));
    results.push(result);
    if (!result.ok) break;
  }

  const failed = results.filter((result) => !result.ok);
  return {
    ok: failed.length === 0,
    levelId,
    suite,
    commandCount: results.length,
    passedCount: results.filter((result) => result.ok).length,
    failedCount: failed.length,
    skipped,
    summary: failed.length
      ? `${suite} validation failed at ${failed[0].commandId}.`
      : `${suite} validation passed.`,
    results
  };
}
