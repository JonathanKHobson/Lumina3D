export const EDITOR_HANDOFF_SCHEMA = "lumina3d.dev.editorHandoff.v1";
export const EDITOR_HANDOFF_STORAGE_PREFIX = "lumina3d.editorHandoff.";
export const EDITOR_HANDOFF_LATEST_KEY = "lumina3d.editorHandoff.latest";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function storageOrNull(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

function nowIso() {
  return new Date().toISOString();
}

export function createEditorHandoffId() {
  const randomPart = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `handoff-${Date.now().toString(36)}-${randomPart}`;
}

export function editorHandoffStorageKey(handoffId) {
  return `${EDITOR_HANDOFF_STORAGE_PREFIX}${handoffId}`;
}

export function normalizeEditorHandoffPayload(payload = {}, ttlMs = DEFAULT_TTL_MS) {
  const createdAt = payload.createdAt || nowIso();
  const expiresAt = payload.expiresAt || new Date(Date.parse(createdAt) + ttlMs).toISOString();
  const handoffId = payload.handoffId || createEditorHandoffId();
  return {
    ...payload,
    schema: EDITOR_HANDOFF_SCHEMA,
    handoffId,
    createdAt,
    expiresAt,
    browserMayWriteSourceFiles: false
  };
}

export function cleanupExpiredEditorHandoffs(storage) {
  const localStorageRef = storageOrNull(storage);
  if (!localStorageRef) return 0;
  const now = Date.now();
  const keys = [];
  for (let index = 0; index < localStorageRef.length; index += 1) {
    const key = localStorageRef.key(index);
    if (key?.startsWith(EDITOR_HANDOFF_STORAGE_PREFIX)) keys.push(key);
  }
  let removed = 0;
  keys.forEach((key) => {
    try {
      const parsed = JSON.parse(localStorageRef.getItem(key) || "{}");
      const expiresAt = Date.parse(parsed.expiresAt || "");
      if (Number.isFinite(expiresAt) && expiresAt < now) {
        localStorageRef.removeItem(key);
        removed += 1;
      }
    } catch {
      localStorageRef.removeItem(key);
      removed += 1;
    }
  });
  return removed;
}

export function saveEditorHandoff(payload, storage) {
  const localStorageRef = storageOrNull(storage);
  const handoff = normalizeEditorHandoffPayload(payload);
  if (!localStorageRef) return { handoff, saved: false };
  cleanupExpiredEditorHandoffs(localStorageRef);
  try {
    localStorageRef.setItem(editorHandoffStorageKey(handoff.handoffId), JSON.stringify(handoff));
    localStorageRef.setItem(EDITOR_HANDOFF_LATEST_KEY, handoff.handoffId);
    return { handoff, saved: true };
  } catch {
    return { handoff, saved: false };
  }
}

export function loadEditorHandoff(handoffId, storage) {
  const localStorageRef = storageOrNull(storage);
  if (!localStorageRef || !handoffId) return null;
  try {
    const raw = localStorageRef.getItem(editorHandoffStorageKey(handoffId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== EDITOR_HANDOFF_SCHEMA) return null;
    const expiresAt = Date.parse(parsed.expiresAt || "");
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      localStorageRef.removeItem(editorHandoffStorageKey(handoffId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function editorHandoffUrl(handoff, baseHref) {
  const base = baseHref || (typeof window !== "undefined" ? window.location.href : "http://127.0.0.1:5179/");
  const url = new URL("/editor/", base);
  if (handoff?.handoffId) url.searchParams.set("handoff", handoff.handoffId);
  if (handoff?.scene?.id || handoff?.sceneId) url.searchParams.set("scene", handoff.scene?.id || handoff.sceneId);
  if (handoff?.selection?.id || handoff?.selectedEntityId) url.searchParams.set("entity", handoff.selection?.id || handoff.selectedEntityId);
  return url.href;
}
