export const OBJECT_ANNOTATIONS_SCHEMA = "lumina3d.dev.objectAnnotations.v1";
export const OBJECT_ANNOTATIONS_STORAGE_KEY = OBJECT_ANNOTATIONS_SCHEMA;

const PRIORITIES = new Set(["low", "normal", "high"]);

function storageOrNull(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

function nowIso() {
  return new Date().toISOString();
}

export function annotationStorageKey(sceneId, entityId) {
  return `${sceneId || "unknown"}::${entityId || "unknown"}`;
}

export function emptyAnnotation(sceneId = "", entityId = "") {
  return {
    schema: OBJECT_ANNOTATIONS_SCHEMA,
    sceneId,
    entityId,
    notes: "",
    flags: {
      deleteCandidate: false,
      replaceCandidate: false,
      collisionIssue: false,
      orientationIssue: false,
      positioningIssue: false
    },
    replacement: {
      assetKey: "",
      reason: ""
    },
    priority: "normal",
    createdAt: "",
    updatedAt: ""
  };
}

export function normalizeAnnotation(annotation = {}, sceneId = "", entityId = "") {
  const flags = annotation.flags || {};
  const replacement = annotation.replacement || {};
  const priority = PRIORITIES.has(annotation.priority) ? annotation.priority : "normal";
  return {
    ...emptyAnnotation(sceneId, entityId),
    notes: typeof annotation.notes === "string" ? annotation.notes : "",
    flags: {
      deleteCandidate: Boolean(flags.deleteCandidate),
      replaceCandidate: Boolean(flags.replaceCandidate),
      collisionIssue: Boolean(flags.collisionIssue),
      orientationIssue: Boolean(flags.orientationIssue),
      positioningIssue: Boolean(flags.positioningIssue)
    },
    replacement: {
      assetKey: typeof replacement.assetKey === "string" ? replacement.assetKey : "",
      reason: typeof replacement.reason === "string" ? replacement.reason : ""
    },
    priority,
    createdAt: typeof annotation.createdAt === "string" ? annotation.createdAt : "",
    updatedAt: typeof annotation.updatedAt === "string" ? annotation.updatedAt : ""
  };
}

export function annotationHasContent(annotation) {
  const normalized = normalizeAnnotation(annotation);
  return Boolean(
    normalized.notes.trim() ||
    normalized.priority !== "normal" ||
    normalized.flags.deleteCandidate ||
    normalized.flags.replaceCandidate ||
    normalized.flags.collisionIssue ||
    normalized.flags.orientationIssue ||
    normalized.flags.positioningIssue ||
    normalized.replacement.assetKey.trim() ||
    normalized.replacement.reason.trim()
  );
}

function emptyStore() {
  return {
    schema: OBJECT_ANNOTATIONS_SCHEMA,
    updatedAt: "",
    annotations: {}
  };
}

export function loadAnnotationStore(storage) {
  const localStorageRef = storageOrNull(storage);
  if (!localStorageRef) return emptyStore();
  try {
    const raw = localStorageRef.getItem(OBJECT_ANNOTATIONS_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyStore();
    const annotations = parsed.annotations && typeof parsed.annotations === "object" && !Array.isArray(parsed.annotations)
      ? parsed.annotations
      : {};
    return {
      schema: OBJECT_ANNOTATIONS_SCHEMA,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      annotations: Object.fromEntries(
        Object.entries(annotations).map(([key, value]) => {
          const [sceneId = "", entityId = ""] = key.split("::");
          return [key, normalizeAnnotation(value, sceneId, entityId)];
        })
      )
    };
  } catch {
    return emptyStore();
  }
}

function saveAnnotationStore(store, storage) {
  const localStorageRef = storageOrNull(storage);
  if (!localStorageRef) return false;
  try {
    localStorageRef.setItem(OBJECT_ANNOTATIONS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function listAnnotations(storage) {
  return loadAnnotationStore(storage).annotations;
}

export function getAnnotation(sceneId, entityId, storage) {
  const key = annotationStorageKey(sceneId, entityId);
  const annotation = loadAnnotationStore(storage).annotations[key];
  return normalizeAnnotation(annotation, sceneId, entityId);
}

export function setAnnotation(sceneId, entityId, updates = {}, storage) {
  if (!sceneId || !entityId) return emptyAnnotation(sceneId, entityId);
  const store = loadAnnotationStore(storage);
  const key = annotationStorageKey(sceneId, entityId);
  const existing = normalizeAnnotation(store.annotations[key], sceneId, entityId);
  const timestamp = nowIso();
  const next = normalizeAnnotation({
    ...existing,
    ...updates,
    flags: {
      ...existing.flags,
      ...(updates.flags || {})
    },
    replacement: {
      ...existing.replacement,
      ...(updates.replacement || {})
    },
    createdAt: existing.createdAt || timestamp,
    updatedAt: timestamp
  }, sceneId, entityId);

  if (annotationHasContent(next)) {
    store.annotations[key] = next;
  } else {
    delete store.annotations[key];
  }
  store.updatedAt = timestamp;
  saveAnnotationStore(store, storage);
  return getAnnotation(sceneId, entityId, storage);
}

export function clearAnnotation(sceneId, entityId, storage) {
  const store = loadAnnotationStore(storage);
  const key = annotationStorageKey(sceneId, entityId);
  delete store.annotations[key];
  store.updatedAt = nowIso();
  saveAnnotationStore(store, storage);
  return emptyAnnotation(sceneId, entityId);
}

export function compactAnnotation(annotation) {
  const normalized = normalizeAnnotation(annotation, annotation?.sceneId || "", annotation?.entityId || "");
  if (!annotationHasContent(normalized)) return null;
  return normalized;
}

export function annotationBadgeParts(annotation) {
  const normalized = normalizeAnnotation(annotation);
  const badges = [];
  if (normalized.notes.trim()) badges.push("note");
  if (normalized.flags.deleteCandidate) badges.push("delete");
  if (normalized.flags.replaceCandidate) badges.push("replace");
  if (normalized.flags.collisionIssue) badges.push("collision");
  if (normalized.flags.orientationIssue) badges.push("orientation");
  if (normalized.flags.positioningIssue) badges.push("position");
  if (normalized.priority === "high") badges.push("high");
  if (normalized.priority === "low") badges.push("low");
  return badges;
}
