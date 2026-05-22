import { referenceTokenForAsset } from "./EditorNoteReferences.js";

export const EDITOR_REPLACEMENT_CANDIDATE_SCHEMA = "lumina3d.editor.replacementCandidate.v1";

function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}

export function replacementCandidateForAsset(asset = null) {
  if (!asset?.assetKey) return null;
  const sourceScope = asset.sourceScope || "in-project";
  return {
    schema: EDITOR_REPLACEMENT_CANDIDATE_SCHEMA,
    token: referenceTokenForAsset(asset),
    type: "asset",
    assetKey: asset.assetKey,
    label: asset.label || asset.assetKey,
    sourceScope,
    provider: stringOrEmpty(asset.provider),
    packName: stringOrEmpty(asset.packName),
    folderPath: stringOrEmpty(asset.folderPath),
    relativePath: stringOrEmpty(asset.relativePath),
    format: stringOrEmpty(asset.format || asset.type),
    source: stringOrEmpty(asset.source),
    preserveRole: true,
    referenceOnly: sourceScope === "external",
    importedIntoProject: sourceScope !== "external",
    placementEnabled: false,
    manualReview: sourceScope === "external"
  };
}

export function normalizeReplacementCandidate(candidate = null) {
  if (!candidate || typeof candidate !== "object" || !candidate.assetKey) return null;
  const sourceScope = candidate.sourceScope || "in-project";
  return {
    schema: candidate.schema || EDITOR_REPLACEMENT_CANDIDATE_SCHEMA,
    token: candidate.token || `#${candidate.assetKey}`,
    type: candidate.type || "asset",
    assetKey: candidate.assetKey,
    label: candidate.label || candidate.assetKey,
    sourceScope,
    provider: stringOrEmpty(candidate.provider),
    packName: stringOrEmpty(candidate.packName),
    folderPath: stringOrEmpty(candidate.folderPath),
    relativePath: stringOrEmpty(candidate.relativePath),
    format: stringOrEmpty(candidate.format),
    source: stringOrEmpty(candidate.source),
    preserveRole: candidate.preserveRole !== false,
    referenceOnly: Boolean(candidate.referenceOnly ?? sourceScope === "external"),
    importedIntoProject: Boolean(candidate.importedIntoProject ?? sourceScope !== "external"),
    placementEnabled: false,
    manualReview: Boolean(candidate.manualReview ?? sourceScope === "external")
  };
}

export function ensureReplacementNote(note = "", asset = null) {
  const source = String(note || "").trim();
  if (/@replace\b/.test(source)) return note || "";
  const token = asset?.assetKey ? referenceTokenForAsset(asset) : "#";
  const stub = `@replace replace with ${token}`;
  return source ? `${source}\n${stub}` : stub;
}
