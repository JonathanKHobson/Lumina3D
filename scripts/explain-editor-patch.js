import fs from "node:fs";
import path from "node:path";

const EXPECTED_PATCH_TYPE = "lumina3d.editor.transformPatch.v1";
const LEGACY_PATCH_TYPE = "lumina3d.editor.transformPatch";
const LEVEL_TWO_WIDTH = 20;
const LEVEL_TWO_HEIGHT = 20;
const TILE = 2;
const USAGE_TEXT = "node scripts/explain-editor-patch.js <patch.json>";
const HELP_TEXT = `Usage: ${USAGE_TEXT}

Examples:
  npm run tools:explain-editor-patch -- docs/tooling/fixtures/editor-transform-patch-example.json`;

const VALIDATION_COMMANDS = [
  "npm run build",
  "npm run tools:get-level-manifest -- level_two --pretty",
  "npm run tools:list-level-objects -- level_two --pretty",
  "npm run tools:run-scene-smoke -- level_two --pretty",
  "npm run tools:validate-missing-colliders -- level_two --pretty",
  "npm run tools:validate-float-colliders -- level_two --pretty"
];

const POINT_ALIASES = {
  LEVEL_TWO_BLUE_RAMP: {
    position: "blueRamp"
  },
  LEVEL_TWO_RED_BUTTONS: {
    "red-button-a": "redButtonA"
  },
  LEVEL_TWO_RED_PLATFORMS: {
    "red-elevator-a": "redElevatorA"
  }
};

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function hasUnexpectedFlag(args) {
  const knownFlags = new Set(["--help", "-h"]);
  return args.some((arg) => arg.startsWith("--") && !knownFlags.has(arg));
}

function hasUnknownShortFlag(args) {
  return args.some((arg) => /^-[^-]$/.test(arg) && arg !== "-h");
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function formatValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
  return Number(value.toFixed(6)).toString();
}

function gridAxisFromWorld(axis, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (axis === "x") return value / TILE + (LEVEL_TWO_WIDTH - 1) / 2;
  if (axis === "z") return value / TILE + (LEVEL_TWO_HEIGHT - 1) / 2;
  return null;
}

function parsePropIndex(sourcePath) {
  const match = String(sourcePath || "").match(/^\[(\d+)\]$/);
  return match ? Number(match[1]) : null;
}

function parseTransformPath(changePath) {
  const match = String(changePath || "").match(/^transform\.(position|rotation|scale)\.(x|y|z)$/);
  if (!match) return null;
  return {
    group: match[1],
    axis: match[2]
  };
}

function readPatch(filePath) {
  const absolutePath = path.resolve(filePath);
  let raw;
  try {
    raw = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    fail(`Could not read patch file: ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in patch file: ${error.message}`);
  }
}

function validateSourceRef(sourceRef, objectId) {
  if (!sourceRef || typeof sourceRef !== "object") {
    fail(`Malformed patch: ${objectId || "object"} is missing sourceRef.`);
  }
  ["file", "exportName", "path"].forEach((field) => {
    if (typeof sourceRef[field] !== "string" || sourceRef[field].length === 0) {
      fail(`Malformed patch: ${objectId || "object"} has invalid sourceRef.${field}.`);
    }
  });
}

function collectDirtyObjects(patch) {
  if (patch.objects !== undefined && !Array.isArray(patch.objects)) {
    fail("Malformed patch: objects must be an array when present.");
  }
  if (patch.changes !== undefined && !Array.isArray(patch.changes)) {
    fail("Malformed patch: changes must be an array when present.");
  }

  const objects = Array.isArray(patch.objects) ? patch.objects : [];
  const dirtyObjects = objects.filter((objectPatch) => {
    if (!Array.isArray(objectPatch.changes)) {
      fail(`Malformed patch: ${objectPatch.objectId || "object"} changes must be an array.`);
    }
    return objectPatch.changes.length > 0;
  });

  if (dirtyObjects.length > 0) return dirtyObjects;
  if (Array.isArray(patch.changes) && patch.changes.length > 0) {
    return [{
      objectId: patch.objectId || "unknown-object",
      name: patch.objectId || "Selected object",
      category: "unknown",
      sourceRef: patch.sourceRef,
      changes: patch.changes
    }];
  }
  return [];
}

function validatePatch(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    fail("Malformed patch: root value must be an object.");
  }
  const patchType = patch.patchType || patch.schema;
  if (patchType !== EXPECTED_PATCH_TYPE && patchType !== LEGACY_PATCH_TYPE) {
    fail(`Unsupported patchType: expected ${EXPECTED_PATCH_TYPE}, got ${patchType || "missing"}.`);
  }
  if (typeof patch.levelId !== "string" || patch.levelId.length === 0) {
    fail("Malformed patch: levelId is required.");
  }

  const dirtyObjects = collectDirtyObjects(patch);
  dirtyObjects.forEach((objectPatch) => {
    validateSourceRef(objectPatch.sourceRef, objectPatch.objectId);
    objectPatch.changes.forEach((change) => {
      if (!change || typeof change !== "object") {
        fail(`Malformed patch: ${objectPatch.objectId} contains a non-object change.`);
      }
      if (typeof change.path !== "string") {
        fail(`Malformed patch: ${objectPatch.objectId} change is missing path.`);
      }
      if (!("oldValue" in change) || !("newValue" in change)) {
        fail(`Malformed patch: ${objectPatch.objectId} change ${change.path} needs oldValue and newValue.`);
      }
    });
  });
  return dirtyObjects;
}

function pointAliasFor(sourceRef) {
  return POINT_ALIASES[sourceRef.exportName]?.[sourceRef.path] || null;
}

function explainPosition(sourceRef, axis, change) {
  const exportName = sourceRef.exportName;
  const sourcePath = sourceRef.path;
  const next = formatValue(change.newValue);
  const gridValue = gridAxisFromWorld(axis, change.newValue);
  const gridSuffix = gridValue === null ? "" : `; sceneGridPoint ${axis} argument ~= ${formatValue(gridValue)}`;

  if (axis === "y") {
    return `Manual review: ${exportName}.${sourcePath} visual Y -> ${next}. Level Two Y is often derived from SURFACE_Y, tile height, baseY, or platform progress.`;
  }

  if (exportName === "LEVEL_TWO_POINTS") {
    return `Set LEVEL_TWO_POINTS.${sourcePath}.${axis} to ${next}${gridSuffix}.`;
  }

  if (exportName === "LEVEL_TWO_BLUE_RAMP" && sourcePath === "position") {
    return `Set LEVEL_TWO_BLUE_RAMP.position.${axis} to ${next}; source currently aliases LEVEL_TWO_POINTS.blueRamp${gridSuffix}.`;
  }

  if (exportName === "LEVEL_TWO_RED_BUTTONS") {
    const pointAlias = pointAliasFor(sourceRef);
    const aliasNote = pointAlias ? `; source position currently aliases LEVEL_TWO_POINTS.${pointAlias}` : "";
    return `Set LEVEL_TWO_RED_BUTTONS[id=${sourcePath}].position.${axis} to ${next}${aliasNote}${gridSuffix}.`;
  }

  if (exportName === "LEVEL_TWO_RED_PLATFORMS") {
    const pointAlias = pointAliasFor(sourceRef);
    const aliasNote = pointAlias ? `; source position currently aliases LEVEL_TWO_POINTS.${pointAlias}` : "";
    return `Set LEVEL_TWO_RED_PLATFORMS[id=${sourcePath}].position.${axis} to ${next}${aliasNote}${gridSuffix}.`;
  }

  if (exportName === "LEVEL_TWO_PROPS") {
    const index = parsePropIndex(sourcePath);
    if (index === null) return `Manual review: unsupported LEVEL_TWO_PROPS path ${sourcePath}.`;
    const tupleIndex = axis === "x" ? 1 : 2;
    const gridDisplay = gridValue === null ? next : formatValue(gridValue);
    return `Set LEVEL_TWO_PROPS[${index}][${tupleIndex}] to ${gridDisplay} (${axis} grid coordinate derived from world ${next}).`;
  }

  return `Manual review: map ${exportName}.${sourcePath}.${axis} to ${next}.`;
}

function explainRotation(sourceRef, axis, change) {
  const next = formatValue(change.newValue);
  if (axis !== "y") {
    return `Manual review: only rotation.y currently maps cleanly; saw rotation.${axis} -> ${next}.`;
  }
  if (sourceRef.exportName === "LEVEL_TWO_BLUE_RAMP") {
    return `Set LEVEL_TWO_BLUE_RAMP.rotationY to ${next}.`;
  }
  return `Manual review: ${sourceRef.exportName}.${sourceRef.path} has no known rotationY source field.`;
}

function explainScale(sourceRef, axis, change) {
  const next = formatValue(change.newValue);
  if (sourceRef.exportName === "LEVEL_TWO_BLUE_RAMP") {
    return `Set LEVEL_TWO_BLUE_RAMP.visualScale.${axis} to ${next}.`;
  }
  if (sourceRef.exportName === "LEVEL_TWO_PROPS") {
    const index = parsePropIndex(sourceRef.path);
    if (index === null) return `Manual review: unsupported LEVEL_TWO_PROPS path ${sourceRef.path}.`;
    return `Set LEVEL_TWO_PROPS[${index}][3] to ${next} only if the intended prop scale remains uniform.`;
  }
  return `Manual review: ${sourceRef.exportName}.${sourceRef.path} has no known visual scale source field.`;
}

function explainChange(sourceRef, change) {
  const parsed = parseTransformPath(change.path);
  if (!parsed) return `Manual review: unsupported change path ${change.path}.`;
  if (parsed.group === "position") return explainPosition(sourceRef, parsed.axis, change);
  if (parsed.group === "rotation") return explainRotation(sourceRef, parsed.axis, change);
  if (parsed.group === "scale") return explainScale(sourceRef, parsed.axis, change);
  return `Manual review: unsupported transform group ${parsed.group}.`;
}

function printPatch(patch, dirtyObjects) {
  const totalChanges = dirtyObjects.reduce((sum, objectPatch) => sum + objectPatch.changes.length, 0);
  console.log("Lumina3D editor patch dry run");
  console.log(`Patch type: ${patch.patchType || patch.schema}`);
  if (patch.legacyPatchType) console.log(`Legacy patch type: ${patch.legacyPatchType}`);
  console.log(`Level: ${patch.levelId}`);
  console.log(`Dirty objects: ${dirtyObjects.length}`);
  console.log(`Total changes: ${totalChanges}`);
  console.log("");

  if (dirtyObjects.length === 0) {
    console.log("No transform changes found.");
    return;
  }

  dirtyObjects.forEach((objectPatch, index) => {
    const sourceRef = objectPatch.sourceRef;
    console.log(`Object ${index + 1}: ${objectPatch.objectId || "unknown-object"}`);
    if (objectPatch.name) console.log(`Name: ${objectPatch.name}`);
    if (objectPatch.category) console.log(`Category: ${objectPatch.category}`);
    console.log(`Source: ${sourceRef.file}`);
    console.log(`Export: ${sourceRef.exportName}`);
    console.log(`Source path: ${sourceRef.path}`);
    console.log("Suggested edits:");
    objectPatch.changes.forEach((change) => {
      console.log(`- ${change.path}: ${formatValue(change.oldValue)} -> ${formatValue(change.newValue)}`);
      console.log(`  ${explainChange(sourceRef, change)}`);
    });
    console.log("");
  });

  console.log("Validation after applying:");
  VALIDATION_COMMANDS.forEach((command) => {
    console.log(`- ${command}`);
  });
}

function run() {
  const args = process.argv.slice(2);
  if (isHelp(args)) {
    console.log(HELP_TEXT);
    return;
  }
  if (hasUnexpectedFlag(args) || hasUnknownShortFlag(args)) {
    fail(`Unexpected flag. Usage: ${USAGE_TEXT}`);
  }
  if (args.length !== 1) {
    fail(`Missing patch file. Usage: ${USAGE_TEXT}`);
  }

  const patch = readPatch(args[0]);
  const dirtyObjects = validatePatch(patch);
  printPatch(patch, dirtyObjects);
}

run();
