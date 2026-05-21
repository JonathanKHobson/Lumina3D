const TERRAIN_CATEGORY_RE = /terrain|ground|water|barrier|tile/i;

function uniqueStrings(values) {
  return [...new Set(values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase()))];
}

export function inferEditorRecordType({ category = "", assetKey = "" } = {}) {
  if (TERRAIN_CATEGORY_RE.test(category) || /tile/i.test(assetKey)) return "tile";
  if (/button/i.test(category) || /button/i.test(assetKey)) return "button";
  if (/platform|elevator/i.test(category) || /platform/i.test(assetKey)) return "platform";
  if (/collider|trigger/i.test(category)) return "collider";
  if (/prop|tree|rock|bush|grass/i.test(category) || /forest/i.test(assetKey)) return "prop";
  if (/ramp/i.test(category) || /ramp/i.test(assetKey)) return "ramp";
  if (/goal|letter|spellbook/i.test(category) || /spellbook|heart/i.test(assetKey)) return "goal";
  return category || "object";
}

export function normalizeEditorRecordSpec(spec = {}) {
  const category = spec.category || "object";
  const assetKey = spec.assetKey || "";
  const type = spec.type || inferEditorRecordType({ category, assetKey });
  const readOnly = Boolean(spec.readOnly);
  const transformLocked = Boolean(spec.transformLocked ?? readOnly);
  const sourceBacked = Boolean(spec.sourceBacked ?? (spec.sourceRef && !spec.sourceRef.generated));
  const movable = Boolean(spec.movable ?? (!readOnly && !transformLocked));
  const locked = Boolean(spec.locked ?? (!movable || transformLocked || readOnly));
  const generated = Boolean(spec.generated || spec.sourceRef?.generated);
  const lockReason = locked
    ? (spec.lockReason || spec.sourceRef?.note || (generated
      ? "Generated editor preview; use notes/AI handoff before changing its source."
      : "Transform editing is disabled for this editor record."))
    : "";
  const tags = uniqueStrings([
    type,
    category,
    assetKey,
    spec.tileKind,
    sourceBacked ? "source-backed" : "",
    generated ? "generated" : "",
    movable ? "movable" : "locked",
    locked ? "locked" : "",
    ...(Array.isArray(spec.tags) ? spec.tags : [])
  ]);

  return {
    type,
    category,
    assetKey,
    readOnly,
    transformLocked,
    generated,
    movable,
    locked,
    lockReason,
    sourceBacked,
    tileKind: spec.tileKind || "",
    tags
  };
}

export function applyEditorRecordUserData(root, record) {
  if (!root || !record) return;
  root.name = record.name;
  root.userData.editorId = record.id;
  root.userData.editorName = record.name;
  root.userData.editorCategory = record.category;
  root.userData.editorAsset = record.assetKey || "";
  root.userData.editorAssetKey = record.assetKey || null;
  root.userData.editorSourceRef = record.sourceRef || null;
  root.userData.sourceRef = record.sourceRef || null;
  root.userData.editorReadOnly = record.readOnly;
  root.userData.editorTransformLocked = record.transformLocked;
  root.userData.editorMovable = record.movable;
  root.userData.editorLocked = record.locked;
  root.userData.editorLockReason = record.lockReason;
  root.userData.editorType = record.type;
  root.userData.editorTags = record.tags;
  root.traverse((child) => {
    child.userData.editorRootId = record.id;
  });
}

export function editorRecordContext(record = {}) {
  return {
    type: record.type || inferEditorRecordType(record),
    tags: Array.isArray(record.tags) ? record.tags : [],
    tileKind: record.tileKind || "",
    movable: Boolean(record.movable ?? (!record.readOnly && !record.transformLocked)),
    locked: Boolean(record.locked ?? (record.readOnly || record.transformLocked)),
    lockReason: record.lockReason || "",
    sourceBacked: Boolean(record.sourceBacked ?? (record.sourceRef && !record.sourceRef.generated)),
    generated: Boolean(record.generated || record.sourceRef?.generated),
    readOnly: Boolean(record.readOnly),
    transformLocked: Boolean(record.transformLocked)
  };
}
