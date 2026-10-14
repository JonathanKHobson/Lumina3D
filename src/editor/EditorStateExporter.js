import { diffTransform, snapshotTransform } from "./EditorPatchExporter.js";
import { editorRecordContext } from "./EditorRecordMetadata.js";
import {
  buildIntentGlossary,
  extractNoteTags,
  resolveNoteIntents
} from "./EditorNoteIntents.js";
import {
  buildReferenceGlossary,
  extractNoteReferenceTokens,
  resolveNoteReferences
} from "./EditorNoteReferences.js";
import { normalizeReplacementCandidate } from "./EditorReplacementIntent.js";
import { transformTargetForRecord } from "./EditorTransformUtils.js";

export const EDITOR_STATE_EXPORT_SCHEMA = "lumina3d.editor.stateExport.v1";
export const EDITOR_OBJECT_META_STORAGE_PREFIX = "lumina3d.editor.objectMeta.v1";
export const EDITOR_LEVEL_META_STORAGE_PREFIX = "lumina3d.editor.levelMeta.v1";

export function editorObjectMetaStorageKey(levelId) {
  return `${EDITOR_OBJECT_META_STORAGE_PREFIX}:${levelId || "unknown"}`;
}

export function editorLevelMetaStorageKey(levelId) {
  return `${EDITOR_LEVEL_META_STORAGE_PREFIX}:${levelId || "unknown"}`;
}

export function normalizeObjectMeta(meta = {}) {
  const note = typeof meta.note === "string" ? meta.note : "";
  const markedForDelete = Boolean(meta.markedForDelete);
  const markedForReplace = Boolean(meta.markedForReplace);
  const replacementCandidate = markedForReplace
    ? normalizeReplacementCandidate(meta.replacementCandidate)
    : null;
  return {
    note,
    noteTags: extractNoteTags(note),
    markedForDelete,
    markedForReplace,
    replacementCandidate,
    updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : ""
  };
}

export function normalizeLevelMeta(meta = {}) {
  const note = typeof meta.note === "string" ? meta.note : "";
  return {
    note,
    noteTags: extractNoteTags(note),
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

export function loadEditorLevelMeta(levelId, storage = window.localStorage) {
  try {
    const raw = storage.getItem(editorLevelMetaStorageKey(levelId));
    if (!raw) return normalizeLevelMeta();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return normalizeLevelMeta();
    return normalizeLevelMeta(parsed);
  } catch {
    return normalizeLevelMeta();
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

export function saveEditorLevelMeta(levelId, levelMeta, storage = window.localStorage) {
  try {
    const normalized = normalizeLevelMeta(levelMeta);
    if (normalized.note.trim()) {
      storage.setItem(editorLevelMetaStorageKey(levelId), JSON.stringify(normalized));
    } else {
      storage.removeItem(editorLevelMetaStorageKey(levelId));
    }
    return true;
  } catch {
    return false;
  }
}

function metaHasContent(meta) {
  return Boolean(meta.markedForDelete || meta.markedForReplace || meta.replacementCandidate || meta.note.trim());
}

function actionIntent(meta) {
  if (meta.markedForDelete) return "delete";
  if (meta.markedForReplace) return "replace";
  return "none";
}

function changedRecordToExport(record, meta, getColliderProxiesForObject, referenceContext) {
  if (record?.draftPlacement) return null;
  const currentTransform = snapshotTransform(transformTargetForRecord(record));
  const changes = diffTransform(record.originalTransform, currentTransform);
  const normalizedMeta = normalizeObjectMeta(meta);
  if (changes.length === 0 && !metaHasContent(normalizedMeta)) return null;
  const colliderProxies = typeof getColliderProxiesForObject === "function"
    ? getColliderProxiesForObject(record.id)
    : [];
  return {
    objectId: record.id,
    name: record.name,
    category: record.category,
    assetKey: record.assetKey || "",
    ...editorRecordContext(record),
    sourceRef: record.sourceRef,
    originalTransform: record.originalTransform,
    currentTransform,
    changes,
    note: normalizedMeta.note,
    noteTags: normalizedMeta.noteTags,
    noteIntents: resolveNoteIntents(normalizedMeta.noteTags),
    noteReferences: resolveNoteReferences(normalizedMeta.note, referenceContext),
    markedForDelete: normalizedMeta.markedForDelete,
    markedForReplace: normalizedMeta.markedForReplace,
    actionIntent: actionIntent(normalizedMeta),
    replacementCandidate: normalizedMeta.markedForReplace ? normalizedMeta.replacementCandidate : null,
    colliderProxies
  };
}

function selectedRecordToContext(record, getColliderProxiesForObject) {
  if (!record) return null;
  const currentTransform = snapshotTransform(transformTargetForRecord(record));
  const colliderProxies = typeof getColliderProxiesForObject === "function"
    ? getColliderProxiesForObject(record.id)
    : [];
  return {
    objectId: record.id,
    name: record.name,
    category: record.category,
    assetKey: record.assetKey || "",
    ...editorRecordContext(record),
    sourceRef: record.sourceRef || null,
    originalTransform: record.originalTransform,
    currentTransform,
    changes: diffTransform(record.originalTransform, currentTransform),
    colliderProxies
  };
}

export function buildEditorStateExport({
  levelId,
  records,
  selectedId,
  objectMeta = {},
  levelMeta = {},
  camera = null,
  supportedLevelIds = [],
  colliderOverlay = null,
  getColliderProxiesForObject = null,
  objectFilter = null,
  timeline = null,
  assetCatalog = null,
  referenceAssetCatalog = null,
  draftPlacements = [],
  colliderDiagnostics = null
}) {
  const normalizedLevelMeta = normalizeLevelMeta(levelMeta);
  const hasLevelNote = Boolean(normalizedLevelMeta.note.trim());
  const referenceContext = {
    records,
    assetCatalog: referenceAssetCatalog,
    getColliderProxiesForObject
  };
  const objects = records
    .map((record) => changedRecordToExport(record, objectMeta[record.id], getColliderProxiesForObject, referenceContext))
    .filter(Boolean);
  const intentGlossary = buildIntentGlossary([...objects, normalizedLevelMeta, ...draftPlacements]);
  const levelNoteReferences = resolveNoteReferences(normalizedLevelMeta.note, referenceContext);
  const referenceGlossary = buildReferenceGlossary([...objects, normalizedLevelMeta, ...draftPlacements], referenceContext);
  const selectedColliderProxies = selectedId && typeof getColliderProxiesForObject === "function"
    ? getColliderProxiesForObject(selectedId)
    : [];
  const selectedRecord = records.find((record) => record.id === selectedId) || null;
  const objectNoteCount = objects.filter((objectExport) => objectExport.note.trim()).length;
  return {
    schema: EDITOR_STATE_EXPORT_SCHEMA,
    exportType: EDITOR_STATE_EXPORT_SCHEMA,
    levelId,
    selectedId: selectedId || null,
    supportedLevelIds,
    camera,
    levelNote: normalizedLevelMeta.note,
    levelNoteTags: normalizedLevelMeta.noteTags,
    levelNoteIntents: resolveNoteIntents(normalizedLevelMeta.noteTags),
    levelNoteReferences,
    levelNoteUpdatedAt: normalizedLevelMeta.updatedAt || null,
    levelNotePresent: hasLevelNote,
    colliderOverlay,
    selectedColliderProxies,
    selectedObjectContext: selectedRecordToContext(selectedRecord, getColliderProxiesForObject),
    objectFilter,
    timeline,
    assetCatalog,
    draftPlacements,
    draftPlacementCount: draftPlacements.length,
    colliderDiagnostics,
    exportedAt: new Date().toISOString(),
    affectedObjectCount: objects.length,
    affectedItemCount: objects.length + (hasLevelNote ? 1 : 0),
    transformChangeCount: objects.reduce((sum, objectExport) => sum + objectExport.changes.length, 0),
    noteCount: objectNoteCount,
    levelNoteCount: hasLevelNote ? 1 : 0,
    totalNoteCount: objectNoteCount + (hasLevelNote ? 1 : 0),
    deleteCount: objects.filter((objectExport) => objectExport.markedForDelete).length,
    replaceCount: objects.filter((objectExport) => objectExport.markedForReplace).length,
    replacementCandidateCount: objects.filter((objectExport) => objectExport.replacementCandidate).length,
    lockedAffectedObjectCount: objects.filter((objectExport) => objectExport.locked).length,
    movableAffectedObjectCount: objects.filter((objectExport) => objectExport.movable).length,
    intentGlossary,
    referenceGlossary,
    referenceCount: Object.keys(referenceGlossary).length,
    levelNoteReferenceCount: extractNoteReferenceTokens(normalizedLevelMeta.note).length,
    objectNoteReferenceCount: objects.reduce((sum, objectExport) => sum + (objectExport.noteReferences?.length || 0), 0),
    objects
  };
}

export function summarizeEditorStateExport(stateExport) {
  return {
    schema: stateExport.schema,
    levelId: stateExport.levelId,
    selectedId: stateExport.selectedId,
    affectedObjectCount: stateExport.affectedObjectCount,
    affectedItemCount: stateExport.affectedItemCount,
    transformChangeCount: stateExport.transformChangeCount,
    noteCount: stateExport.noteCount,
    levelNoteCount: stateExport.levelNoteCount,
    totalNoteCount: stateExport.totalNoteCount,
    referenceCount: stateExport.referenceCount || 0,
    levelNoteReferenceCount: stateExport.levelNoteReferenceCount || 0,
    objectNoteReferenceCount: stateExport.objectNoteReferenceCount || 0,
    deleteCount: stateExport.deleteCount,
    replaceCount: stateExport.replaceCount,
    replacementCandidateCount: stateExport.replacementCandidateCount || 0,
    draftPlacementCount: stateExport.draftPlacementCount || 0,
    colliderProxyCount: stateExport.colliderOverlay?.proxyCount || 0,
    visibleColliderProxyCount: stateExport.colliderOverlay?.visibleProxyCount || 0,
    selectedColliderProxyCount: stateExport.colliderOverlay?.selectedProxyCount || 0,
    problemWarningCount: stateExport.colliderDiagnostics?.problemWarningCount || 0,
    selectedLocked: Boolean(stateExport.selectedObjectContext?.locked),
    selectedMovable: Boolean(stateExport.selectedObjectContext?.movable),
    visibleObjectCount: stateExport.objectFilter?.visibleObjectCount ?? null,
    selectedAssetKey: stateExport.assetCatalog?.selectedAsset?.assetKey || null,
    selectedAssetSourceScope: stateExport.assetCatalog?.selectedAsset?.sourceScope || null,
    selectedExternalAssetToken: stateExport.assetCatalog?.selectedAsset?.sourceScope === "external"
      ? `#${stateExport.assetCatalog.selectedAsset.assetKey}`
      : null,
    visibleAssetCount: stateExport.assetCatalog?.filter?.visibleAssetCount ?? null,
    visibleExternalAssetCount: stateExport.assetCatalog?.filter?.visibleExternalAssetCount ?? null
  };
}
