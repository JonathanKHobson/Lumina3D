export const EDITOR_OBJECT_FILTER_STORAGE_KEY = "lumina3d.editor.objectFilters.v1";

export const EDITOR_OBJECT_FILTERS = [
  { id: "all", label: "All" },
  { id: "dirty", label: "Changed" },
  { id: "noted", label: "Noted" },
  { id: "delete", label: "Delete" },
  { id: "replace", label: "Replace" },
  { id: "movable", label: "Movable" },
  { id: "locked", label: "Locked" },
  { id: "tiles", label: "Tiles" },
  { id: "elevated", label: "Elevated" },
  { id: "props", label: "Props" },
  { id: "buttons", label: "Buttons" },
  { id: "platforms", label: "Platforms" },
  { id: "colliders", label: "Colliders" }
];

const FILTER_IDS = new Set(EDITOR_OBJECT_FILTERS.map((filter) => filter.id));

export function defaultObjectFilterState() {
  return {
    query: "",
    activeFilter: "all",
    hideBaseGround: true
  };
}

export function normalizeObjectFilterState(state = {}) {
  const defaults = defaultObjectFilterState();
  const activeFilter = FILTER_IDS.has(state.activeFilter) ? state.activeFilter : defaults.activeFilter;
  return {
    query: typeof state.query === "string" ? state.query : defaults.query,
    activeFilter,
    hideBaseGround: state.hideBaseGround !== undefined ? Boolean(state.hideBaseGround) : defaults.hideBaseGround
  };
}

export function loadObjectFilterState(storage = window.localStorage) {
  try {
    const raw = storage.getItem(EDITOR_OBJECT_FILTER_STORAGE_KEY);
    if (!raw) return defaultObjectFilterState();
    return normalizeObjectFilterState(JSON.parse(raw));
  } catch {
    return defaultObjectFilterState();
  }
}

export function saveObjectFilterState(state, storage = window.localStorage) {
  try {
    storage.setItem(EDITOR_OBJECT_FILTER_STORAGE_KEY, JSON.stringify(normalizeObjectFilterState(state)));
    return true;
  } catch {
    return false;
  }
}

function normalizedText(value) {
  return String(value || "").toLowerCase();
}

function recordSearchHaystack(record, meta) {
  return [
    record.id,
    record.name,
    record.category,
    record.type,
    record.assetKey,
    record.tileKind,
    ...(Array.isArray(record.tags) ? record.tags : []),
    meta?.note || ""
  ].map(normalizedText).join(" ");
}

function splitSearchQuery(query) {
  return normalizedText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function tokenMatches(record, meta, dirtyIds, deleteIds, replaceIds, colliderOwnerIds, token) {
  const [rawKey, ...rawValue] = token.split(":");
  if (!rawValue.length) return recordSearchHaystack(record, meta).includes(token);
  const key = rawKey.trim();
  const value = rawValue.join(":").trim();
  const tags = Array.isArray(record.tags) ? record.tags : [];

  if (key === "id") return normalizedText(record.id) === value;
  if (key === "type") return normalizedText(record.type || record.category).includes(value);
  if (key === "tag") return tags.some((tag) => normalizedText(tag).includes(value));
  if (key === "asset") return normalizedText(record.assetKey).includes(value);
  if (key === "category") return normalizedText(record.category).includes(value);
  if (key === "state") {
    if (value === "dirty" || value === "changed") return dirtyIds.has(record.id);
    if (value === "noted") return Boolean(meta?.note?.trim());
    if (value === "collider" || value === "colliders") return colliderOwnerIds.has(record.id);
    return false;
  }
  if (key === "mark") {
    if (value === "delete") return deleteIds.has(record.id);
    if (value === "replace") return replaceIds.has(record.id);
    return false;
  }
  if (key === "movable") return String(Boolean(record.movable)) === value;
  if (key === "locked") return String(Boolean(record.locked)) === value;
  return recordSearchHaystack(record, meta).includes(token);
}

function filterMatches(record, meta, dirtyIds, deleteIds, replaceIds, colliderOwnerIds, activeFilter) {
  if (activeFilter === "all") return true;
  if (activeFilter === "dirty") return dirtyIds.has(record.id);
  if (activeFilter === "noted") return Boolean(meta?.note?.trim());
  if (activeFilter === "delete") return deleteIds.has(record.id);
  if (activeFilter === "replace") return replaceIds.has(record.id);
  if (activeFilter === "movable") return Boolean(record.movable);
  if (activeFilter === "locked") return Boolean(record.locked);
  if (activeFilter === "tiles") return record.type === "tile" || normalizedText(record.category).includes("terrain");
  if (activeFilter === "elevated") return record.tileKind === "elevated" || (record.tags || []).includes("elevated");
  if (activeFilter === "props") return record.type === "prop" || normalizedText(record.category).includes("prop");
  if (activeFilter === "buttons") return record.type === "button" || normalizedText(record.category).includes("button");
  if (activeFilter === "platforms") return record.type === "platform" || normalizedText(record.category).includes("platform") || normalizedText(record.category).includes("elevator");
  if (activeFilter === "colliders") return colliderOwnerIds.has(record.id) || normalizedText(record.category).includes("collider") || normalizedText(record.category).includes("trigger");
  return true;
}

function shouldHideAsBaseGround(record, state) {
  if (!state.hideBaseGround) return false;
  if (record.tileKind === "elevated") return false;
  if (record.movable) return false;
  return record.tileKind === "base" ||
    record.tileKind === "base_ground" ||
    record.tileKind === "base_path" ||
    (record.tags || []).includes("base");
}

export function filterEditorRecords({
  records,
  objectMeta,
  dirtyIds,
  deleteIds,
  replaceIds,
  colliderOwnerIds,
  state
}) {
  const normalizedState = normalizeObjectFilterState(state);
  const queryTokens = splitSearchQuery(normalizedState.query);
  const visibleRecords = records.filter((record) => {
    const meta = objectMeta[record.id] || {};
    if (shouldHideAsBaseGround(record, normalizedState)) return false;
    if (!filterMatches(record, meta, dirtyIds, deleteIds, replaceIds, colliderOwnerIds, normalizedState.activeFilter)) return false;
    return queryTokens.every((token) => tokenMatches(
      record,
      meta,
      dirtyIds,
      deleteIds,
      replaceIds,
      colliderOwnerIds,
      token
    ));
  });

  return {
    state: normalizedState,
    visibleRecords,
    visibleObjectCount: visibleRecords.length,
    totalObjectCount: records.length,
    hiddenObjectCount: Math.max(0, records.length - visibleRecords.length)
  };
}
