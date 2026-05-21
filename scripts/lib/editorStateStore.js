import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_EDITOR_STATE_PATH,
  PROJECT_ROOT,
  isInsideProject,
  projectRelativePath,
  resolveProjectPath
} from "./projectPaths.js";

function editorStatePath() {
  const configured = process.env.LUMINA3D_EDITOR_STATE_PATH;
  if (!configured) return DEFAULT_EDITOR_STATE_PATH;
  const resolved = path.resolve(PROJECT_ROOT, configured);
  if (!isInsideProject(resolved)) {
    throw new Error("LUMINA3D_EDITOR_STATE_PATH must stay inside the project root.");
  }
  return resolved;
}

function objectId(objectExport) {
  return objectExport?.objectId || objectExport?.id || "";
}

function hasNote(objectExport) {
  return Boolean(String(objectExport?.note || "").trim());
}

function summarizeObject(objectExport) {
  if (!objectExport) return null;
  return {
    objectId: objectId(objectExport),
    name: objectExport.name || "",
    category: objectExport.category || "",
    assetKey: objectExport.assetKey || "",
    sourceRef: objectExport.sourceRef || null,
    changeCount: Array.isArray(objectExport.changes) ? objectExport.changes.length : 0,
    note: objectExport.note || "",
    noteTags: Array.isArray(objectExport.noteTags) ? objectExport.noteTags : [],
    markedForDelete: Boolean(objectExport.markedForDelete),
    markedForReplace: Boolean(objectExport.markedForReplace),
    actionIntent: objectExport.actionIntent || "none"
  };
}

export function summarizeEditorState(state) {
  const objects = Array.isArray(state?.objects) ? state.objects : [];
  const selectedId = state?.selectedId || state?.selectedObjectId || null;
  const selectedObject = selectedId ? objects.find((entry) => objectId(entry) === selectedId) : null;
  const transformChangeCount = Number.isFinite(state?.transformChangeCount)
    ? state.transformChangeCount
    : objects.reduce((sum, entry) => sum + (Array.isArray(entry.changes) ? entry.changes.length : 0), 0);

  return {
    schema: state?.schema || state?.schemaVersion || state?.exportType || "unknown",
    levelId: state?.levelId || null,
    selectedId,
    exportedAt: state?.exportedAt || null,
    source: state?.source || "file",
    counts: {
      affectedObjects: Number.isFinite(state?.affectedObjectCount) ? state.affectedObjectCount : objects.length,
      transformChanges: transformChangeCount,
      notedObjects: Number.isFinite(state?.noteCount) ? state.noteCount : objects.filter(hasNote).length,
      markedDeleteObjects: Number.isFinite(state?.deleteCount)
        ? state.deleteCount
        : objects.filter((entry) => entry.markedForDelete).length,
      markedReplaceObjects: Number.isFinite(state?.replaceCount)
        ? state.replaceCount
        : objects.filter((entry) => entry.markedForReplace).length
    },
    selectedObject: summarizeObject(selectedObject),
    affectedObjects: objects.slice(0, 20).map(summarizeObject),
    affectedObjectsTruncated: objects.length > 20
  };
}

export function getCurrentEditorState({ detail = "summary" } = {}) {
  const statePath = editorStatePath();
  const relativePath = projectRelativePath(statePath);
  if (!fs.existsSync(statePath)) {
    return {
      ok: false,
      status: "missing",
      summary: "No editor state has been published yet.",
      path: relativePath,
      hint: "Use the future Export to MCP bridge, or save a state export at tmp/editor-state/current.json."
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    return {
      ok: false,
      status: "invalid_json",
      summary: "Editor state file exists but could not be parsed.",
      path: relativePath,
      error: error?.message || String(error)
    };
  }

  const summary = summarizeEditorState(parsed);
  return {
    ok: true,
    status: "ready",
    summary: `Editor state for ${summary.levelId || "unknown level"} loaded.`,
    path: relativePath,
    state: detail === "full" ? parsed : summary
  };
}

export function readEditorStatePath(inputPath) {
  return resolveProjectPath(inputPath);
}
