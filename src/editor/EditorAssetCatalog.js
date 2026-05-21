import {
  EDITOR_EXTERNAL_ASSET_INDEX_META,
  EDITOR_EXTERNAL_ASSET_RECORDS
} from "./EditorExternalAssetCatalog.generated.js";
import { EDITOR_PROCEDURAL_ASSET_RECORDS } from "./EditorProceduralAssets.js";

export const EDITOR_ASSET_FILTERS = [
  { id: "all", label: "All" },
  { id: "terrain", label: "Terrain" },
  { id: "prop", label: "Props" },
  { id: "platform", label: "Platforms" },
  { id: "button", label: "Buttons" },
  { id: "character", label: "Characters" },
  { id: "goal", label: "Goals" },
  { id: "bridge", label: "Bridges" },
  { id: "external", label: "Other" }
];

export const EDITOR_ASSET_SOURCE_FILTERS = [
  { id: "all", label: "All" },
  { id: "in-project", label: "In project" },
  { id: "external", label: "External" },
  { id: "procedural", label: "Procedural" }
];

function inferAssetCategory(assetKey, asset) {
  const text = `${assetKey} ${asset?.base || ""} ${asset?.url || ""}`.toLowerCase();
  if (text.includes("button")) return "button";
  if (text.includes("bridge")) return "bridge";
  if (text.includes("barrier")) return "barrier";
  if (text.includes("tile") || text.includes("blockbits") || text.includes("water")) return "terrain";
  if (text.includes("tree") || text.includes("rock") || text.includes("bush") || text.includes("grass") || text.includes("forest")) return "prop";
  if (text.includes("frog") || text.includes("elephant") || text.includes("character")) return "character";
  if (text.includes("spellbook") || text.includes("heart")) return "goal";
  if (text.includes("ramp") || text.includes("platform")) return "platform";
  return asset?.type || "asset";
}

function assetSource(asset) {
  if (asset?.url) return asset.url;
  if (asset?.base && asset?.stem) return `${asset.base}${asset.stem}`;
  return asset?.base || "";
}

function projectAssetRecord(assetKey, asset, levelId) {
  const category = inferAssetCategory(assetKey, asset);
  const source = assetSource(asset);
  return {
    assetKey,
    label: assetKey,
    type: asset?.type || "unknown",
    category,
    sourceScope: "in-project",
    provider: "Lumina3D",
    packName: "Lumina3D project",
    folderPath: asset?.base || "",
    relativePath: source,
    format: asset?.type || "unknown",
    source,
    tags: [...new Set([
      "in-project",
      category,
      asset?.type,
      assetKey
    ].filter(Boolean).map((tag) => String(tag).toLowerCase()))],
    targetFootprint: asset?.targetFootprint ?? null,
    targetHeight: asset?.targetHeight ?? null,
    allowedLevels: [],
    usageNotes: levelId
      ? `In-project catalog context for ${levelId}; draft ghost placement is editor-only until Codex materializes source.`
      : "In-project catalog context; draft ghost placement is editor-only until Codex materializes source.",
    placementEnabled: false,
    draftPlacementEnabled: true
  };
}

function normalizeExternalAssetRecord(record = {}, levelId = "") {
  const usageNotes = record.usageNotes && !record.usageNotes.includes("not placeable in this editor slice")
    ? record.usageNotes
    : (
      levelId
        ? `External reference available while editing ${levelId}; draft markers are allowed, but the asset is not imported into Lumina3D.`
        : "External reference available for draft markers; not imported into Lumina3D."
    );
  return {
    assetKey: record.assetKey,
    label: record.label || record.assetKey,
    type: record.type || record.format || "unknown",
    category: record.category || "external",
    sourceScope: "external",
    provider: record.provider || "",
    packName: record.packName || "External assets",
    folderPath: record.folderPath || "",
    relativePath: record.relativePath || "",
    format: record.format || record.type || "unknown",
    source: record.source || "",
    tags: [...new Set([...(record.tags || []), "external"].filter(Boolean).map((tag) => String(tag).toLowerCase()))],
    targetFootprint: record.targetFootprint ?? null,
    targetHeight: record.targetHeight ?? null,
    allowedLevels: record.allowedLevels || [],
    usageNotes,
    placementEnabled: false,
    draftPlacementEnabled: true
  };
}

function normalizeProceduralAssetRecord(record = {}, levelId = "") {
  return {
    assetKey: record.assetKey,
    label: record.label || record.assetKey,
    type: record.type || "procedural",
    category: record.category || "terrain",
    sourceScope: "procedural",
    provider: record.provider || "Lumina3D editor",
    packName: record.packName || "Editor procedural assets",
    folderPath: record.folderPath || "src/editor",
    relativePath: record.relativePath || "",
    format: record.format || "threejs-procedural",
    source: record.source || "src/editor/EditorProceduralAssets.js",
    tags: [...new Set([...(record.tags || []), "procedural"].filter(Boolean).map((tag) => String(tag).toLowerCase()))],
    targetFootprint: record.targetFootprint ?? null,
    targetHeight: record.targetHeight ?? null,
    allowedLevels: record.allowedLevels || [],
    usageNotes: record.usageNotes || (
      levelId
        ? `Procedural editor asset available while editing ${levelId}; draft placement exports an AI handoff and does not write runtime source.`
        : "Procedural editor asset; draft placement exports an AI handoff and does not write runtime source."
    ),
    placementEnabled: false,
    draftPlacementEnabled: true
  };
}

export function buildEditorAssetCatalog(assets = {}, { levelId = "" } = {}) {
  const projectRecords = Object.entries(assets)
    .map(([assetKey, asset]) => projectAssetRecord(assetKey, asset, levelId));
  const externalRecords = EDITOR_EXTERNAL_ASSET_RECORDS
    .map((record) => normalizeExternalAssetRecord(record, levelId));
  const proceduralRecords = EDITOR_PROCEDURAL_ASSET_RECORDS
    .map((record) => normalizeProceduralAssetRecord(record, levelId));
  const records = [...projectRecords, ...proceduralRecords, ...externalRecords]
    .sort((a, b) => {
      const sourceOrder = { "in-project": 0, procedural: 1, external: 2 };
      if (a.sourceScope !== b.sourceScope) {
        return (sourceOrder[a.sourceScope] ?? 9) - (sourceOrder[b.sourceScope] ?? 9);
      }
      return a.assetKey.localeCompare(b.assetKey);
    });

  return {
    schema: "lumina3d.editor.assetCatalog.v1",
    levelId: levelId || null,
    placementEnabled: false,
    draftPlacementEnabled: true,
    externalIndex: EDITOR_EXTERNAL_ASSET_INDEX_META,
    records
  };
}

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function searchableAssetText(record = {}) {
  return [
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
    ...(record.tags || [])
  ].map(normalizedText).join(" ");
}

export function normalizeAssetFilterState(state = {}) {
  const activeFilter = EDITOR_ASSET_FILTERS.some((filter) => filter.id === state.activeFilter)
    ? state.activeFilter
    : "all";
  const sourceScope = EDITOR_ASSET_SOURCE_FILTERS.some((filter) => filter.id === state.sourceScope)
    ? state.sourceScope
    : "all";
  return {
    query: typeof state.query === "string" ? state.query : "",
    activeFilter,
    sourceScope,
    packName: typeof state.packName === "string" && state.packName.trim() ? state.packName : "all",
    folderPath: typeof state.folderPath === "string" && state.folderPath.trim() ? state.folderPath : "all"
  };
}

export function filterEditorAssets({ catalog = null, state = {} } = {}) {
  const normalizedState = normalizeAssetFilterState(state);
  const query = normalizedText(normalizedState.query);
  const records = catalog?.records || [];
  const visibleRecords = records.filter((record) => {
    if (normalizedState.activeFilter !== "all" && record.category !== normalizedState.activeFilter) return false;
    if (normalizedState.sourceScope !== "all" && record.sourceScope !== normalizedState.sourceScope) return false;
    if (normalizedState.packName !== "all" && record.packName !== normalizedState.packName) return false;
    if (normalizedState.folderPath !== "all" && record.folderPath !== normalizedState.folderPath) return false;
    if (!query) return true;
    return query.split(/\s+/).every((token) => searchableAssetText(record).includes(token));
  });
  return {
    state: normalizedState,
    visibleRecords,
    visibleAssetCount: visibleRecords.length,
    totalAssetCount: records.length,
    hiddenAssetCount: Math.max(0, records.length - visibleRecords.length),
    visibleExternalAssetCount: visibleRecords.filter((record) => record.sourceScope === "external").length,
    totalExternalAssetCount: records.filter((record) => record.sourceScope === "external").length,
    visibleProjectAssetCount: visibleRecords.filter((record) => record.sourceScope === "in-project").length,
    totalProjectAssetCount: records.filter((record) => record.sourceScope === "in-project").length,
    visibleProceduralAssetCount: visibleRecords.filter((record) => record.sourceScope === "procedural").length,
    totalProceduralAssetCount: records.filter((record) => record.sourceScope === "procedural").length
  };
}

export function assetPackOptions(catalog = null, state = {}) {
  const normalizedState = normalizeAssetFilterState(state);
  const records = catalog?.records || [];
  return records
    .filter((record) => normalizedState.sourceScope === "all" || record.sourceScope === normalizedState.sourceScope)
    .map((record) => record.packName)
    .filter(Boolean)
    .filter((packName, index, values) => values.indexOf(packName) === index)
    .sort((a, b) => a.localeCompare(b));
}

export function assetFolderOptions(catalog = null, state = {}) {
  const normalizedState = normalizeAssetFilterState(state);
  if (normalizedState.packName === "all") return [];
  const records = catalog?.records || [];
  return records
    .filter((record) => normalizedState.sourceScope === "all" || record.sourceScope === normalizedState.sourceScope)
    .filter((record) => normalizedState.packName === "all" || record.packName === normalizedState.packName)
    .map((record) => record.folderPath)
    .filter(Boolean)
    .filter((folderPath, index, values) => values.indexOf(folderPath) === index)
    .sort((a, b) => a.localeCompare(b));
}

export function assetContext(record = null) {
  if (!record) return null;
  return {
    assetKey: record.assetKey,
    label: record.label,
    type: record.type,
    category: record.category,
    sourceScope: record.sourceScope || "in-project",
    provider: record.provider || "",
    packName: record.packName || "",
    folderPath: record.folderPath || "",
    relativePath: record.relativePath || "",
    format: record.format || record.type || "",
    source: record.source,
    sourceScopeDetail: record.sourceScope === "procedural" ? "editor procedural" : record.sourceScope || "in-project",
    tags: record.tags || [],
    targetFootprint: record.targetFootprint ?? null,
    targetHeight: record.targetHeight ?? null,
    allowedLevels: record.allowedLevels || [],
    usageNotes: record.usageNotes || "",
    placementEnabled: false,
    draftPlacementEnabled: true
  };
}

export function summarizeEditorAssetCatalog(catalog = null, { selectedAsset = null, filter = null } = {}) {
  const records = catalog?.records || [];
  const categories = [...new Set(records.map((record) => record.category).filter(Boolean))].sort();
  const sourceScopes = [...new Set(records.map((record) => record.sourceScope).filter(Boolean))].sort();
  return {
    schema: catalog?.schema || "lumina3d.editor.assetCatalog.v1",
    levelId: catalog?.levelId || null,
    placementEnabled: false,
    draftPlacementEnabled: true,
    assetCount: records.length,
    projectAssetCount: records.filter((record) => record.sourceScope === "in-project").length,
    externalAssetCount: records.filter((record) => record.sourceScope === "external").length,
    proceduralAssetCount: records.filter((record) => record.sourceScope === "procedural").length,
    sourceScopes,
    categories,
    externalIndex: catalog?.externalIndex || null,
    selectedAsset: assetContext(selectedAsset),
    filter: filter || null
  };
}
