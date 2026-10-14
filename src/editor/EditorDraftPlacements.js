import * as THREE from "three";

import { FLOOR_TARGET } from "../config/constants.js";
import { createProceduralEditorAsset } from "./EditorProceduralAssets.js";
import {
  applyEditorRecordUserData,
  normalizeEditorRecordSpec
} from "./EditorRecordMetadata.js";
import { snapshotTransform } from "./EditorPatchExporter.js";
import { referenceTokenForAsset } from "./EditorNoteReferences.js";

export const EDITOR_DRAFT_PLACEMENT_SCHEMA = "lumina3d.editor.draftPlacement.v1";
export const EDITOR_DRAFT_PLACEMENT_STORAGE_PREFIX = "lumina3d.editor.draftPlacements.v1";

const GHOST_COLOR = 0x84e1d5;
const EXTERNAL_MARKER_COLOR = 0xf4ca64;

function storageKey(levelId) {
  return `${EDITOR_DRAFT_PLACEMENT_STORAGE_PREFIX}:${levelId || "unknown"}`;
}

function round(value) {
  return Number(Number(value || 0).toFixed(6));
}

function axisSnapshot(vectorLike = {}) {
  return {
    x: round(vectorLike.x),
    y: round(vectorLike.y),
    z: round(vectorLike.z)
  };
}

function transformSnapshot(object) {
  return {
    position: axisSnapshot(object.position),
    rotation: axisSnapshot(object.rotation),
    scale: axisSnapshot(object.scale)
  };
}

function safeSlug(value) {
  return String(value || "asset")
    .trim()
    .toLowerCase()
    .replace(/^external\./, "external.")
    .replace(/[^a-z0-9.]+/g, "_")
    .replace(/^_+|_+$/g, "") || "asset";
}

function vectorFromSnapshot(value = {}, fallback = {}) {
  return {
    x: Number.isFinite(Number(value.x)) ? Number(value.x) : Number(fallback.x || 0),
    y: Number.isFinite(Number(value.y)) ? Number(value.y) : Number(fallback.y || 0),
    z: Number.isFinite(Number(value.z)) ? Number(value.z) : Number(fallback.z || 0)
  };
}

function createLabelSprite(text, color = "#f4ca64") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(16, 24, 22, 0.82)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = "#f5f1df";
  context.font = "28px ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "middle";
  const label = String(text || "draft placement").slice(0, 46);
  context.fillText(label, 24, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.2, 1.05, 1);
  sprite.position.set(0, 2.2, 0);
  sprite.userData.disposeTexture = texture;
  return sprite;
}

function setGhostMaterial(object) {
  object.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = materials.map((material) => {
      const next = material.clone();
      next.transparent = false;
      next.opacity = 1;
      next.depthWrite = true;
      if (next.color) next.color.lerp(new THREE.Color(GHOST_COLOR), 0.14);
      return next;
    });
    child.material = Array.isArray(child.material) ? cloned : cloned[0];
  });
}

function createExternalMarker(asset) {
  const group = new THREE.Group();
  const footprint = Number(asset?.targetFootprint || 1.2);
  const height = Number(asset?.targetHeight || 1.4);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.5, footprint), Math.max(0.14, height), Math.max(0.5, footprint)),
    new THREE.MeshBasicMaterial({
      color: EXTERNAL_MARKER_COLOR,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  );
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(box.geometry),
    new THREE.LineBasicMaterial({
      color: EXTERNAL_MARKER_COLOR,
      transparent: true,
      opacity: 0.88
    })
  );
  box.position.y = Math.max(0.14, height) * 0.5;
  edges.position.copy(box.position);
  group.add(box, edges, createLabelSprite(referenceTokenForAsset(asset), "#f4ca64"));
  return group;
}

export function createDraftPlacement({
  levelId,
  asset,
  position,
  rotation = { x: 0, y: 0, z: 0 },
  scale = { x: 1, y: 1, z: 1 },
  index = 1
}) {
  if (!asset?.assetKey) return null;
  const slug = safeSlug(asset.assetKey);
  const draftId = `${levelId || "level"}.draft.${slug}.${String(index).padStart(3, "0")}`;
  const sourceScope = asset.sourceScope || "in-project";
  const referenceOnly = sourceScope === "external";
  const previewType = sourceScope === "procedural"
    ? "procedural-model"
    : referenceOnly ? "marker" : "ghost-model";
  return {
    schema: EDITOR_DRAFT_PLACEMENT_SCHEMA,
    draftId,
    levelId: levelId || "",
    assetKey: asset.assetKey,
    label: asset.label || asset.assetKey,
    referenceToken: referenceTokenForAsset(asset),
    sourceScope,
    provider: asset.provider || "",
    packName: asset.packName || "",
    folderPath: asset.folderPath || "",
    relativePath: asset.relativePath || "",
    format: asset.format || asset.type || "",
    source: asset.source || "",
    previewType,
    actionIntent: "add",
    proposedObjectId: `${levelId || "level"}.draft.${slug}.${String(index).padStart(3, "0")}`,
    transform: {
      position: vectorFromSnapshot(position, { y: FLOOR_TARGET }),
      rotation: vectorFromSnapshot(rotation),
      scale: vectorFromSnapshot(scale, { x: 1, y: 1, z: 1 })
    },
    note: `@spawn place ${referenceTokenForAsset(asset)} here`,
    referenceOnly,
    importedIntoProject: sourceScope === "in-project",
    manualReview: sourceScope !== "in-project"
  };
}

export function normalizeDraftPlacement(draft = {}) {
  if (!draft?.draftId || !draft.assetKey) return null;
  const sourceScope = draft.sourceScope || "in-project";
  const referenceOnly = Boolean(draft.referenceOnly ?? sourceScope === "external");
  const previewType = draft.previewType || (
    sourceScope === "procedural" ? "procedural-model" : referenceOnly ? "marker" : "ghost-model"
  );
  return {
    schema: draft.schema || EDITOR_DRAFT_PLACEMENT_SCHEMA,
    draftId: draft.draftId,
    levelId: draft.levelId || "",
    assetKey: draft.assetKey,
    label: draft.label || draft.assetKey,
    referenceToken: draft.referenceToken || `#${draft.assetKey}`,
    sourceScope,
    provider: draft.provider || "",
    packName: draft.packName || "",
    folderPath: draft.folderPath || "",
    relativePath: draft.relativePath || "",
    format: draft.format || "",
    source: draft.source || "",
    previewType,
    actionIntent: "add",
    proposedObjectId: draft.proposedObjectId || draft.draftId,
    transform: {
      position: vectorFromSnapshot(draft.transform?.position, { y: FLOOR_TARGET }),
      rotation: vectorFromSnapshot(draft.transform?.rotation),
      scale: vectorFromSnapshot(draft.transform?.scale, { x: 1, y: 1, z: 1 })
    },
    note: typeof draft.note === "string" ? draft.note : "",
    referenceOnly,
    importedIntoProject: Boolean(draft.importedIntoProject ?? sourceScope === "in-project"),
    manualReview: Boolean(draft.manualReview ?? sourceScope !== "in-project")
  };
}

export function loadEditorDraftPlacements(levelId, storage = window.localStorage) {
  try {
    const raw = storage.getItem(storageKey(levelId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDraftPlacement).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveEditorDraftPlacements(levelId, drafts = [], storage = window.localStorage) {
  try {
    const normalized = drafts.map(normalizeDraftPlacement).filter(Boolean);
    if (normalized.length > 0) {
      storage.setItem(storageKey(levelId), JSON.stringify(normalized));
    } else {
      storage.removeItem(storageKey(levelId));
    }
    return true;
  } catch {
    return false;
  }
}

export function clearEditorDraftPlacements(levelId, storage = window.localStorage) {
  try {
    storage.removeItem(storageKey(levelId));
    return true;
  } catch {
    return false;
  }
}

export function createDraftPlacementObject({ draft, asset, cloneAsset }) {
  const normalized = normalizeDraftPlacement(draft);
  if (!normalized) return null;
  let object = null;
  if (normalized.sourceScope === "procedural") {
    object = createProceduralEditorAsset(normalized.assetKey);
  } else if (normalized.sourceScope !== "external" && typeof cloneAsset === "function") {
    try {
      object = cloneAsset(normalized.assetKey);
      setGhostMaterial(object);
    } catch {
      object = null;
    }
  }
  if (!object) object = createExternalMarker(asset || normalized);
  object.name = `Draft ${normalized.assetKey}`;
  object.position.set(
    normalized.transform.position.x,
    normalized.transform.position.y,
    normalized.transform.position.z
  );
  object.rotation.set(
    normalized.transform.rotation.x,
    normalized.transform.rotation.y,
    normalized.transform.rotation.z
  );
  object.scale.set(
    normalized.transform.scale.x,
    normalized.transform.scale.y,
    normalized.transform.scale.z
  );
  object.userData.editorDraftPlacement = true;
  return object;
}

export function makeDraftPlacementRecord(draft, object) {
  const normalized = normalizeDraftPlacement(draft);
  if (!normalized || !object) return null;
  const metadata = normalizeEditorRecordSpec({
    id: normalized.draftId,
    name: `Draft ${normalized.label}`,
    category: "draft_placement",
    assetKey: normalized.assetKey,
    generated: true,
    sourceBacked: false,
    movable: true,
    locked: false,
    transformLocked: false,
    tags: ["draft", "placement", normalized.sourceScope, normalized.previewType]
  });
  const record = {
    id: normalized.draftId,
    name: `Draft ${normalized.label}`,
    category: metadata.category,
    assetKey: normalized.assetKey,
    sourceRef: null,
    ...metadata,
    draftPlacement: true,
    draftPlacementData: normalized,
    object,
    transformTarget: object,
    originalTransform: snapshotTransform(object)
  };
  applyEditorRecordUserData(object, record);
  object.userData.editorDraftPlacement = true;
  return record;
}

export function draftPlacementExportFromRecord(record, meta = {}) {
  if (!record?.draftPlacement) return null;
  const base = normalizeDraftPlacement(record.draftPlacementData);
  if (!base) return null;
  const currentTransform = transformSnapshot(record.transformTarget || record.object);
  return {
    ...base,
    transform: currentTransform,
    note: typeof meta.note === "string" && meta.note.trim() ? meta.note : base.note,
    noteTags: meta.noteTags || []
  };
}
