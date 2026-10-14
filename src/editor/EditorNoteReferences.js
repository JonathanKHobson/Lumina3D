import { assetContext } from "./EditorAssetCatalog.js";
import { diffTransform, snapshotTransform } from "./EditorPatchExporter.js";
import { editorRecordContext } from "./EditorRecordMetadata.js";
import { transformTargetForRecord } from "./EditorTransformUtils.js";

const NOTE_REFERENCE_PATTERN = /#[a-zA-Z0-9_.:-]+/g;

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueByToken(items) {
  const seen = new Set();
  const unique = [];
  items.forEach((item) => {
    if (!item?.token || seen.has(item.token)) return;
    seen.add(item.token);
    unique.push(item);
  });
  return unique;
}

function normalizeReferenceToken(token = "") {
  const trimmed = String(token || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function referenceTokenForObject(record = {}) {
  return record?.id ? `#${record.id}` : "";
}

export function referenceTokenForAsset(record = {}) {
  return record?.assetKey ? `#${record.assetKey}` : "";
}

function sourceRefText(sourceRef = null) {
  if (!sourceRef) return "";
  return [
    sourceRef.file,
    sourceRef.exportName,
    sourceRef.path
  ].filter(Boolean).join(" ");
}

function objectSearchText(record = {}, meta = {}) {
  return [
    referenceTokenForObject(record),
    record.id,
    record.name,
    record.category,
    record.type,
    record.assetKey,
    record.tileKind,
    sourceRefText(record.sourceRef),
    meta.note,
    ...(Array.isArray(record.tags) ? record.tags : [])
  ].map(normalizedText).join(" ");
}

function assetSearchText(record = {}) {
  return [
    referenceTokenForAsset(record),
    record.assetKey,
    record.label,
    record.type,
    record.category,
    record.sourceScope,
    record.provider,
    record.packName,
    record.folderPath,
    record.relativePath,
    record.format,
    record.source,
    ...(Array.isArray(record.tags) ? record.tags : [])
  ].map(normalizedText).join(" ");
}

function matchesQuery(searchText, query) {
  const normalized = normalizedText(query).replace(/^#/, "");
  if (!normalized) return true;
  return normalized.split(/\s+/).every((token) => searchText.includes(token));
}

function suggestionScore(suggestion, query) {
  const normalized = normalizedText(query).replace(/^#/, "");
  if (!normalized) return suggestion.source === "visible" ? 1 : 0;

  const token = normalizedText(suggestion.token).replace(/^#/, "");
  const target = normalizedText(suggestion.targetId || suggestion.assetKey);
  const label = normalizedText(suggestion.label);
  const assetKey = normalizedText(suggestion.assetKey);
  const category = normalizedText(suggestion.category);
  const recordType = normalizedText(suggestion.recordType);
  let score = suggestion.source === "visible" ? 1000 : 0;

  if (token === normalized || target === normalized || assetKey === normalized) score += 100;
  if (label === normalized) score += 90;
  if (label.startsWith(normalized)) score += 70;
  if (assetKey.startsWith(normalized)) score += 65;
  if (target.includes(normalized)) score += 40;
  if (token.includes(normalized)) score += 30;
  if (suggestion.type === "object" && recordType !== "tile" && !category.includes("terrain")) score += 25;
  if (suggestion.type === "asset") score += 15;
  if (recordType === "tile" || category.includes("terrain")) score -= 15;
  return score;
}

function objectSuggestion(record = {}, objectMeta = {}, source = "all") {
  const sourceLabel = record.sourceRef
    ? `${record.sourceRef.exportName || "source"}:${record.sourceRef.path || "record"}`
    : "manual-review";
  const status = record.locked
    ? "locked"
    : record.movable
      ? "movable"
      : record.readOnly
        ? "read-only"
        : "editable";
  return {
    kind: "reference",
    trigger: "#",
    type: "object",
    token: referenceTokenForObject(record),
    targetId: record.id,
    label: record.name || record.id,
    category: record.category || "",
    recordType: record.type || "",
    assetKey: record.assetKey || "",
    summary: `${record.category || record.type || "object"} / ${record.assetKey || "generated"}`,
    detail: `${sourceLabel} / ${status}`,
    source,
    resolved: true,
    searchText: objectSearchText(record, objectMeta)
  };
}

function assetSuggestion(record = {}, source = "all") {
  const dimensions = record.targetFootprint
    ? `footprint ${Number(record.targetFootprint).toFixed(2)}`
    : record.targetHeight
      ? `height ${Number(record.targetHeight).toFixed(2)}`
      : "dimensions unknown";
  const scope = record.sourceScope === "external" ? "external" : "in-project";
  const pack = record.packName || (scope === "external" ? "External assets" : "Lumina3D project");
  return {
    kind: "reference",
    trigger: "#",
    type: "asset",
    token: referenceTokenForAsset(record),
    targetId: record.assetKey,
    assetKey: record.assetKey,
    label: record.label || record.assetKey,
    category: record.category || "",
    assetType: record.type || "",
    sourceScope: scope,
    packName: pack,
    folderPath: record.folderPath || "",
    relativePath: record.relativePath || "",
    format: record.format || record.type || "",
    summary: `${scope} / ${record.category || "asset"} / ${record.format || record.type || "unknown"}`,
    detail: `${pack} / ${record.folderPath || record.source || "source unknown"} / ${dimensions}`,
    source,
    resolved: true,
    searchText: assetSearchText(record)
  };
}

export function findReferenceSuggestions({
  query = "",
  activePanelTab = "objects",
  visibleObjects = [],
  objects = [],
  visibleAssets = [],
  assets = [],
  objectMeta = {}
} = {}) {
  const showingAssets = activePanelTab === "assets";
  const suggestions = showingAssets
    ? [
      ...visibleAssets.map((record) => assetSuggestion(record, "visible")),
      ...assets.map((record) => assetSuggestion(record, "all"))
    ]
    : [
      ...visibleObjects.map((record) => objectSuggestion(record, objectMeta[record.id], "visible")),
      ...objects.map((record) => objectSuggestion(record, objectMeta[record.id], "all"))
    ];

  return uniqueByToken(suggestions)
    .filter((suggestion) => matchesQuery(suggestion.searchText, query))
    .map((suggestion) => ({
      ...suggestion,
      score: suggestionScore(suggestion, query)
    }))
    .sort((a, b) => b.score - a.score || a.token.localeCompare(b.token))
    .slice(0, 12)
    .map(({ searchText, score, ...suggestion }) => suggestion);
}

export function extractNoteReferenceTokens(note = "") {
  const matches = String(note || "").match(NOTE_REFERENCE_PATTERN) || [];
  return [...new Set(matches.map(normalizeReferenceToken).filter(Boolean))];
}

function objectReferenceContext(record, { getColliderProxiesForObject = null } = {}) {
  const target = transformTargetForRecord(record);
  const currentTransform = target ? snapshotTransform(target) : null;
  const originalTransform = record.originalTransform || null;
  const changes = originalTransform && currentTransform
    ? diffTransform(originalTransform, currentTransform)
    : [];
  const recordContext = editorRecordContext(record);
  return {
    token: referenceTokenForObject(record),
    type: "object",
    targetId: record.id,
    label: record.name || record.id,
    resolved: true,
    objectId: record.id,
    name: record.name,
    category: record.category,
    assetKey: record.assetKey || "",
    recordType: recordContext.type,
    tags: recordContext.tags,
    tileKind: recordContext.tileKind,
    movable: recordContext.movable,
    locked: recordContext.locked,
    lockReason: recordContext.lockReason,
    sourceBacked: recordContext.sourceBacked,
    generated: recordContext.generated,
    readOnly: recordContext.readOnly,
    transformLocked: recordContext.transformLocked,
    sourceRef: record.sourceRef || null,
    originalTransform,
    currentTransform,
    changes,
    colliderProxies: typeof getColliderProxiesForObject === "function"
      ? getColliderProxiesForObject(record.id)
      : []
  };
}

function assetReferenceContext(record) {
  const context = assetContext(record);
  return {
    token: referenceTokenForAsset(record),
    type: "asset",
    targetId: record.assetKey,
    label: record.label || record.assetKey,
    resolved: true,
    assetKey: context.assetKey,
    assetType: context.type,
    category: context.category,
    sourceScope: context.sourceScope,
    provider: context.provider,
    packName: context.packName,
    folderPath: context.folderPath,
    relativePath: context.relativePath,
    format: context.format,
    source: context.source,
    tags: context.tags,
    targetFootprint: context.targetFootprint,
    targetHeight: context.targetHeight,
    allowedLevels: context.allowedLevels,
    usageNotes: context.usageNotes,
    referenceOnly: context.sourceScope === "external",
    importedIntoProject: context.sourceScope !== "external",
    placementEnabled: context.placementEnabled,
    draftPlacementEnabled: context.draftPlacementEnabled
  };
}

export function resolveNoteReferences(noteOrTokens = "", {
  records = [],
  assetCatalog = null,
  getColliderProxiesForObject = null,
  expanded = false
} = {}) {
  const tokens = Array.isArray(noteOrTokens)
    ? noteOrTokens.map(normalizeReferenceToken).filter(Boolean)
    : extractNoteReferenceTokens(noteOrTokens);
  const assets = assetCatalog?.records || [];

  return [...new Set(tokens)].map((token) => {
    const target = token.slice(1);
    const objectRecord = records.find((record) => record.id === target);
    if (objectRecord) {
      const context = objectReferenceContext(objectRecord, { getColliderProxiesForObject });
      return expanded ? context : {
        token,
        type: "object",
        targetId: objectRecord.id,
        label: objectRecord.name || objectRecord.id,
        resolved: true
      };
    }

    const assetRecord = assets.find((record) => record.assetKey === target);
    if (assetRecord) {
      const context = assetReferenceContext(assetRecord);
      return expanded ? context : {
        token,
        type: "asset",
        targetId: assetRecord.assetKey,
        label: assetRecord.label || assetRecord.assetKey,
        resolved: true
      };
    }

    return {
      token,
      type: "unknown",
      targetId: target,
      label: target,
      resolved: false
    };
  });
}

function collectReferenceTokens(value, tokens) {
  if (!value) return;
  if (typeof value === "string") {
    extractNoteReferenceTokens(value).forEach((token) => tokens.add(token));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferenceTokens(item, tokens));
    return;
  }
  if (typeof value === "object") {
    if (typeof value.token === "string") tokens.add(normalizeReferenceToken(value.token));
    if (typeof value.note === "string") collectReferenceTokens(value.note, tokens);
    if (typeof value.levelNote === "string") collectReferenceTokens(value.levelNote, tokens);
    if (Array.isArray(value.noteReferences)) collectReferenceTokens(value.noteReferences, tokens);
    if (Array.isArray(value.levelNoteReferences)) collectReferenceTokens(value.levelNoteReferences, tokens);
  }
}

export function buildReferenceGlossary(input = [], context = {}) {
  const tokens = new Set();
  collectReferenceTokens(input, tokens);
  return Array.from(tokens)
    .sort()
    .reduce((glossary, token) => {
      glossary[token] = resolveNoteReferences([token], {
        ...context,
        expanded: true
      })[0];
      return glossary;
    }, {});
}
