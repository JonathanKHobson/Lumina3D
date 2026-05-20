import { diffTransform, snapshotTransform } from "./EditorPatchExporter.js";

export const EDITOR_STATE_EXPORT_SCHEMA = "lumina3d.editor.stateExport.v1";
export const EDITOR_OBJECT_META_STORAGE_PREFIX = "lumina3d.editor.objectMeta.v1";

const NOTE_TAG_PATTERN = /@[a-zA-Z0-9_-]+/g;

export function editorObjectMetaStorageKey(levelId) {
  return `${EDITOR_OBJECT_META_STORAGE_PREFIX}:${levelId || "unknown"}`;
}

export function extractNoteTags(note = "") {
  const matches = String(note).match(NOTE_TAG_PATTERN) || [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
}

export function normalizeObjectMeta(meta = {}) {
  const note = typeof meta.note === "string" ? meta.note : "";
  const markedForDelete = Boolean(meta.markedForDelete);
  return {
    note,
    noteTags: extractNoteTags(note),
    markedForDelete,
    updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : ""
  };
}

export function loadEditorObjectMeta(levelId, storage = window.localStorage) {
  try {
    const raw = storage.getItem(editorObjectMetaStorageKey(levelId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([objectId, meta]) => [objectId, normalizeObjectMeta(meta)])
    );
  } catch {
    return {};
  }
}

export function saveEditorObjectMeta(levelId, objectMeta, storage = window.localStorage) {
  try {
    storage.setItem(editorObjectMetaStorageKey(levelId), JSON.stringify(objectMeta || {}));
    return true;
  } catch {
    return false;
  }
}

function metaHasContent(meta) {
  return Boolean(meta.markedForDelete || meta.note.trim());
}

function changedRecordToExport(record, meta) {
  const currentTransform = snapshotTransform(record.object);
  const changes = diffTransform(record.originalTransform, currentTransform);
  const normalizedMeta = normalizeObjectMeta(meta);
  if (changes.length === 0 && !metaHasContent(normalizedMeta)) return null;
  return {
    objectId: record.id,
    name: record.name,
    category: record.category,
    assetKey: record.assetKey || "",
    sourceRef: record.sourceRef,
    originalTransform: record.originalTransform,
    currentTransform,
    changes,
    note: normalizedMeta.note,
    noteTags: normalizedMeta.noteTags,
    markedForDelete: normalizedMeta.markedForDelete
  };
}

export function buildEditorStateExport({
  levelId,
  records,
  selectedId,
  objectMeta = {}
}) {
  const objects = records
    .map((record) => changedRecordToExport(record, objectMeta[record.id]))
    .filter(Boolean);
  return {
    schema: EDITOR_STATE_EXPORT_SCHEMA,
    exportType: EDITOR_STATE_EXPORT_SCHEMA,
    levelId,
    selectedId: selectedId || null,
    exportedAt: new Date().toISOString(),
    affectedObjectCount: objects.length,
    transformChangeCount: objects.reduce((sum, objectExport) => sum + objectExport.changes.length, 0),
    noteCount: objects.filter((objectExport) => objectExport.note.trim()).length,
    deleteCount: objects.filter((objectExport) => objectExport.markedForDelete).length,
    objects
  };
}

export function summarizeEditorStateExport(stateExport) {
  return {
    schema: stateExport.schema,
    levelId: stateExport.levelId,
    selectedId: stateExport.selectedId,
    affectedObjectCount: stateExport.affectedObjectCount,
    transformChangeCount: stateExport.transformChangeCount,
    noteCount: stateExport.noteCount,
    deleteCount: stateExport.deleteCount
  };
}
