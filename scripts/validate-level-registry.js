import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCENES } from "../src/config/scenes.js";
import { LEVEL_REGISTRY } from "../src/config/levelRegistry.js";
import { getSupportedLevelIds } from "../src/editor/levels/index.js";
import { formatJson } from "./lib/cli-utils.js";
import { getDebugShortcut, getLevel } from "./lib/levelCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const USAGE_TEXT = "node scripts/validate-level-registry.js [--pretty]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:validate-level-registry\n  npm run tools:validate-level-registry -- --pretty`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function hasUnexpectedFlag(args) {
  const knownFlags = new Set(["--pretty", "--help", "-h"]);
  return args.some((arg) => arg.startsWith("--") && !knownFlags.has(arg));
}

function hasUnknownShortFlag(args) {
  return args.some((arg) => /^-[^-]$/.test(arg) && arg !== "-h");
}

function sourceFileExists(sourceFile) {
  return fs.existsSync(path.join(REPO_ROOT, sourceFile.replace(/^\/+/, "")));
}

function duplicateValues(entries, key) {
  const seen = new Map();
  const duplicates = [];
  entries.forEach((entry) => {
    const value = entry[key];
    if (!value) return;
    if (seen.has(value)) {
      duplicates.push({ key, value, first: seen.get(value), second: entry.sceneId });
      return;
    }
    seen.set(value, entry.sceneId);
  });
  return duplicates;
}

function runValidation() {
  const issues = [];
  const warnings = [];
  const supportedEditorIds = new Set(getSupportedLevelIds());
  const registryScenes = new Set(LEVEL_REGISTRY.map((entry) => entry.sceneId));

  Object.values(SCENES).forEach((sceneId) => {
    if (!registryScenes.has(sceneId)) {
      issues.push({
        type: "missing_registry_entry",
        sceneId,
        message: `${sceneId} exists in SCENES but not LEVEL_REGISTRY.`
      });
    }
  });

  duplicateValues(LEVEL_REGISTRY, "sceneId")
    .concat(duplicateValues(LEVEL_REGISTRY, "debugKey"))
    .concat(duplicateValues(LEVEL_REGISTRY, "catalogId"))
    .concat(duplicateValues(LEVEL_REGISTRY, "smokeId"))
    .forEach((duplicate) => {
      issues.push({
        type: "duplicate_registry_value",
        ...duplicate
      });
    });

  LEVEL_REGISTRY.forEach((entry) => {
    const sceneKnown = Object.values(SCENES).includes(entry.sceneId);
    if (!sceneKnown) {
      issues.push({
        type: "unknown_scene_id",
        sceneId: entry.sceneId,
        message: `${entry.sceneId} is in LEVEL_REGISTRY but not SCENES.`
      });
    }

    const catalog = getLevel(entry.catalogId || entry.sceneId);
    if (!catalog) {
      issues.push({
        type: "missing_catalog_entry",
        sceneId: entry.sceneId,
        catalogId: entry.catalogId
      });
    } else {
      if (catalog.sceneId !== entry.sceneId) {
        issues.push({
          type: "catalog_scene_mismatch",
          sceneId: entry.sceneId,
          catalogSceneId: catalog.sceneId,
          catalogId: entry.catalogId
        });
      }
      if (entry.smokeId && !catalog.smokeAvailable) {
        issues.push({
          type: "missing_smoke_coverage",
          sceneId: entry.sceneId,
          smokeId: entry.smokeId
        });
      }
    }

    const catalogDebugKey = getDebugShortcut(entry.catalogId || entry.sceneId);
    if (catalogDebugKey !== entry.debugKey) {
      issues.push({
        type: "debug_key_mismatch",
        sceneId: entry.sceneId,
        registryDebugKey: entry.debugKey,
        catalogDebugKey
      });
    }

    if (entry.editorSupported && !supportedEditorIds.has(entry.sceneId)) {
      issues.push({
        type: "missing_editor_adapter",
        sceneId: entry.sceneId
      });
    }

    (entry.sourceFiles || []).forEach((sourceFile) => {
      if (!sourceFileExists(sourceFile)) {
        issues.push({
          type: "missing_source_file",
          sceneId: entry.sceneId,
          sourceFile
        });
      }
    });

    if (!entry.smokeId) {
      warnings.push({
        type: "no_smoke_id",
        sceneId: entry.sceneId
      });
    }
  });

  return {
    ok: issues.length === 0,
    command: "validate-level-registry",
    sceneCount: Object.values(SCENES).length,
    registryCount: LEVEL_REGISTRY.length,
    editorSupportedIds: [...supportedEditorIds],
    issues,
    warnings,
    entries: LEVEL_REGISTRY.map((entry) => ({
      sceneId: entry.sceneId,
      displayName: entry.displayName,
      debugKey: entry.debugKey,
      catalogId: entry.catalogId,
      smokeId: entry.smokeId,
      editorSupported: entry.editorSupported
    }))
  };
}

async function run() {
  const args = process.argv.slice(2);
  if (isHelp(args)) {
    console.log(HELP_TEXT);
    return;
  }
  if (hasUnexpectedFlag(args) || hasUnknownShortFlag(args)) {
    throw new Error(`Unexpected flag. Usage: ${USAGE_TEXT}`);
  }
  const pretty = args.includes("--pretty");
  const payload = runValidation();
  console.log(pretty ? formatJson(payload) : JSON.stringify(payload));
  if (!payload.ok) process.exit(1);
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "validate-level-registry",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
