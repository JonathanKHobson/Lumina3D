import * as THREE from "three";
import { BUTTON_TOP_REST_Y, FLOOR_TARGET, TILE } from "../../config/constants.js";
import { gridPoint, sceneGridPoint } from "../../core/grid.js";
import {
  applyEditorRecordUserData,
  normalizeEditorRecordSpec
} from "../EditorRecordMetadata.js";
import { snapshotTransform } from "../EditorPatchExporter.js";

export const EDITOR_SURFACE_Y = FLOOR_TARGET;

export function sourceRef(file, exportName, path, extra = {}) {
  return {
    file,
    exportName,
    path,
    ...extra
  };
}

export function tagEditorRoot(root, spec) {
  const metadata = normalizeEditorRecordSpec(spec);
  const transformTarget = spec.transformTarget || root;
  const record = {
    id: spec.id,
    name: spec.name,
    category: metadata.category,
    assetKey: spec.assetKey || null,
    sourceRef: spec.sourceRef || null,
    ...metadata,
    object: root,
    transformTarget,
    originalTransform: snapshotTransform(transformTarget)
  };
  applyEditorRecordUserData(root, record);
  return record;
}

function addTerrainRecord({
  editableObjects,
  tile,
  id,
  name,
  category = "terrain_tile",
  assetKey,
  sourceRef: tileSourceRef = null,
  readOnly = true,
  transformLocked = true,
  generated = true,
  tags = [],
  tileKind = "base",
  movable = false,
  locked = true,
  lockReason = "",
  sourceBacked = false
}) {
  if (!editableObjects || !tile || !id) return null;
  const record = tagEditorRoot(tile, {
    id,
    name,
    category,
    assetKey,
    sourceRef: tileSourceRef,
    readOnly,
    transformLocked,
    generated,
    tags,
    tileKind,
    movable,
    locked,
    lockReason,
    sourceBacked
  });
  editableObjects.push(record);
  return record;
}

export function addGridPlane({
  group,
  cloneAsset,
  width,
  height,
  assetKey = "groundTile",
  yPosition = 0,
  editableObjects = null,
  idPrefix = "",
  namePrefix = "Ground Tile",
  category = "terrain_tile",
  sourceRefForTile = null,
  readOnly = true,
  transformLocked = true,
  tags = [],
  tileKind = "base",
  lockReason = "Generated base terrain is selectable for notes, but transform editing is disabled in this slice."
}) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = cloneAsset(assetKey);
      if (!tile) continue;
      const point = gridPoint(x, y, width, height, TILE);
      tile.position.set(point.x, yPosition, point.z);
      group.add(tile);
      addTerrainRecord({
        editableObjects,
        tile,
        id: idPrefix ? `${idPrefix}.${x}.${y}` : "",
        name: `${namePrefix} ${x},${y}`,
        category,
        assetKey,
        sourceRef: typeof sourceRefForTile === "function" ? sourceRefForTile({ x, y, assetKey }) : null,
        readOnly,
        transformLocked,
        generated: true,
        tags,
        tileKind,
        movable: false,
        locked: true,
        lockReason,
        sourceBacked: false
      });
    }
  }
}

export function addSceneGridTile({
  group,
  cloneAsset,
  width,
  height,
  x,
  y,
  assetKey = "groundTile",
  yPosition = 0,
  editableObjects = null,
  id = "",
  name = "",
  category = "terrain_tile",
  sourceRef: tileSourceRef = null,
  readOnly = true,
  transformLocked = true,
  generated = true,
  tags = [],
  tileKind = "base",
  movable = false,
  locked = true,
  lockReason = "Generated terrain preview is selectable for notes, but transform editing is disabled in this slice.",
  sourceBacked = false
}) {
  const tile = cloneAsset(assetKey);
  if (!tile) return null;
  const point = sceneGridPoint(width, height, x, y, TILE);
  tile.position.set(point.x, yPosition, point.z);
  group.add(tile);
  addTerrainRecord({
    editableObjects,
    tile,
    id,
    name: name || `${assetKey} ${x},${y}`,
    category,
    assetKey,
    sourceRef: tileSourceRef,
    readOnly,
    transformLocked,
    generated,
    tags,
    tileKind,
    movable,
    locked,
    lockReason,
    sourceBacked
  });
  return tile;
}

export function createButtonGroup({ cloneAsset, baseAsset = "buttonBaseBlue", topAsset = "buttonTopBlue" }) {
  const root = new THREE.Group();
  const base = cloneAsset(baseAsset);
  const top = cloneAsset(topAsset);

  if (base) {
    base.position.y = 0;
    root.add(base);
  }
  if (top) {
    top.position.y = BUTTON_TOP_REST_Y;
    root.add(top);
  }

  return root;
}

export function createBoxMarker({
  name,
  color = 0xffd166,
  size = [0.7, 0.16, 0.7],
  opacity = 0.82
}) {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75,
    metalness: 0.05,
    transparent: opacity < 1,
    opacity
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createDiscMarker({ name, color = 0x7bdff2, radius = 0.48 }) {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.08, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    transparent: true,
    opacity: 0.86
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function setPointPosition(object, point, y = EDITOR_SURFACE_Y) {
  object.position.set(point.x, y, point.z);
  return object;
}

export function createReadOnlyBounds(width, height, color = 0xffffff) {
  const geometry = new THREE.BoxGeometry(width * TILE, 0.06, height * TILE);
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16 })
  );
  lines.position.y = EDITOR_SURFACE_Y + 0.03;
  return lines;
}

export function makeObjectColliderProxy(record, overrides = {}) {
  return {
    id: `${record.id}.visual_proxy`,
    label: `${record.name} visual bounds`,
    ownerId: record.id,
    category: record.category,
    source: "visual-proxy",
    sourceRef: record.sourceRef || null,
    deriveFromObject: true,
    active: true,
    generated: true,
    ...overrides
  };
}

export function makeObjectColliderProxies(records, options = {}) {
  return records.map((record) => makeObjectColliderProxy(record, {
    source: record.readOnly ? "manual-review" : options.source || "visual-proxy",
    generated: options.generated ?? true
  }));
}

export function makeFixedBoxColliderProxy({
  id,
  label,
  center,
  halfExtents,
  category = "collider_proxy",
  source = "source-hint",
  sourceRef = null,
  active = true,
  generated = false,
  ownerId = null,
  offset = null,
  rotationY = 0,
  rotationYFromOwner = false,
  metadata = null
}) {
  return {
    id,
    label,
    ownerId,
    category,
    source,
    sourceRef,
    center,
    offset,
    halfExtents,
    rotationY,
    rotationYFromOwner,
    active,
    generated,
    metadata
  };
}

export function makeTileColliderProxy({
  id,
  label,
  tile,
  levelWidth,
  levelHeight,
  sourceRef: tileSourceRef,
  category = "terrain",
  source = "source-hint"
}) {
  const point = sceneGridPoint(levelWidth, levelHeight, tile.x, tile.y, TILE);
  const bottomY = Number.isFinite(tile.bottomY) ? tile.bottomY : 0;
  const topY = Number.isFinite(tile.topY) ? tile.topY : EDITOR_SURFACE_Y;
  const height = Math.max(0.08, topY - bottomY);
  return makeFixedBoxColliderProxy({
    id,
    label,
    category,
    source,
    sourceRef: tileSourceRef,
    center: {
      x: point.x,
      y: bottomY + height * 0.5,
      z: point.z
    },
    halfExtents: {
      x: TILE * 0.5,
      y: height * 0.5,
      z: TILE * 0.5
    }
  });
}
