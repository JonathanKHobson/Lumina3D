import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { registeredLevelForScene } from "../config/levelRegistry.js";
import { SCENES } from "../config/scenes.js";
import {
  collectDevEntities,
  entityDistance2D,
  findDevEntityById,
  findDevEntityForObject,
  normalizeDevEntity
} from "./devEntityRegistry.js";
import {
  annotationBadgeParts,
  annotationHasContent,
  annotationStorageKey,
  clearAnnotation,
  compactAnnotation,
  emptyAnnotation,
  getAnnotation,
  listAnnotations,
  normalizeAnnotation,
  setAnnotation
} from "./devObjectAnnotations.js";
import {
  editorHandoffUrl,
  normalizeEditorHandoffPayload,
  saveEditorHandoff
} from "./devEditorHandoff.js";

const DEG_15 = Math.PI / 12;
const AI_CONTEXT_SCHEMA = "lumina3d.dev.aiContext.v1";
const AUTHORING_PACKET_SCHEMA = "lumina3d.dev.levelAuthoringPacket.v1";
const SCENE_PATCH_SCHEMA = "lumina3d.dev.scenePatch.v1";
const SELECTION_DELTA_SCHEMA = "lumina3d.dev.selectionDelta.v1";
const SELECTION_BOUND_COLOR = 0xffd166;
const COLLISION_COLORS = { default: 0x26d6ff, selected: 0xff4f8b, inactive: 0x7d8991 };
const COLLIDER_MIN_VISIBLE_SIZE_Y = 0.1;
const SCALE_SNAP = 0.05;
const NEARBY_ENTITY_LIMIT = 10;
const NEARBY_ENTITY_RADIUS = 8;
const TRANSFORM_UNDO_LIMIT = 40;

const colliderHelpers = new Map();
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const pickBox = new THREE.Box3();
const pickCenter = new THREE.Vector3();

let selectedMesh = null;
let selectionHelper = null;
let transformControls = null;
let transformHelper = null;
let selectionBaseline = null;
let rowsCache = [];
let rowsCacheSceneId = "";
let rowsCacheVersion = 0;
let objectListSignature = "";
let colliderSyncSignature = "";
let annotationFormEntityKey = "";
let annotationFormSyncing = false;
let annotationsVersion = 0;
let activeTransformDragSnapshot = null;
const transformUndoStack = [];

// Set by initDevEditor - holds all external references.
let _state;
let _scene;
let _hud;
let _camera;
let _renderer;
let _getSceneMeshes;
let _getSceneColliderDebugEntries;
let _getRuntimeSnapshot;
let _sceneNav;
let _onUpdateHud;
let _onOpenChange;
let _onShowPrompt;

function normalizeAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function directionName(vector) {
  if (Math.abs(vector.x) > Math.abs(vector.z)) {
    return vector.x > 0 ? { x: 1, z: 0, name: "east" } : { x: -1, z: 0, name: "west" };
  }
  return vector.z > 0 ? { x: 0, z: 1, name: "south" } : { x: 0, z: -1, name: "north" };
}

function applyGridSnap(value, step) {
  if (!_state.devEditor.snapToGrid) return round(value, 4);
  return round(Math.round(value / step) * step, 4);
}

function invalidateEditableRows() {
  rowsCache = [];
  rowsCacheSceneId = "";
  rowsCacheVersion += 1;
  objectListSignature = "";
  colliderSyncSignature = "";
}

function collectEditableObjects({ force = false } = {}) {
  const sceneId = _state?.scene?.id || "";
  if (!force && rowsCacheSceneId === sceneId && rowsCache.length > 0) {
    _state.devEditor.rows = rowsCache;
    return rowsCache;
  }
  rowsCache = collectDevEntities({
    state: _state,
    getSceneMeshes: _getSceneMeshes,
    getSceneColliderDebugEntries: _getSceneColliderDebugEntries
  });
  rowsCacheSceneId = sceneId;
  _state.devEditor.rows = rowsCache;
  return rowsCache;
}

function objectListFilterText() {
  return String(_state?.devEditor?.objectFilter || "").trim().toLowerCase();
}

function isTerrainTileEntity(entity) {
  return entity?.category === "terrain_tile";
}

function entityMatchesFilter(entity, filterText = objectListFilterText()) {
  if (!filterText) return true;
  return [
    entity.id,
    entity.name,
    entity.displayName,
    entity.category,
    entity.asset?.key
  ].some((value) => String(value || "").toLowerCase().includes(filterText));
}

function rowsForObjectList(rows) {
  const filterText = objectListFilterText();
  const showTiles = Boolean(_state?.devEditor?.showTiles);
  const selectedId = _state?.devEditor?.selectedObjectId || "";
  const visibleRows = (rows || []).filter((row) => {
    if (filterText && !entityMatchesFilter(row, filterText)) return false;
    if (row.id === selectedId) return true;
    if (isTerrainTileEntity(row) && !showTiles && !filterText) return false;
    return true;
  });
  return visibleRows.sort((a, b) => {
    if (a.id === selectedId) return -1;
    if (b.id === selectedId) return 1;
    return 0;
  });
}

function currentTransformMode() {
  return _state.devEditor.transformMode || "translate";
}

function cloneArray(values, fallback = []) {
  const source = Array.isArray(values) ? values : fallback;
  return source.map((value, index) => Number.isFinite(Number(value)) ? Number(value) : Number(fallback[index] || 0));
}

function cloneLocalTransform(local = {}) {
  return {
    position: cloneArray(local.position, [0, 0, 0]),
    rotationEuler: cloneArray(local.rotationEuler, [0, 0, 0]),
    rotationY: Number.isFinite(Number(local.rotationY)) ? Number(local.rotationY) : Number(local.rotationEuler?.[1] || 0),
    scale: cloneArray(local.scale, [1, 1, 1])
  };
}

function localTransformFromMesh(mesh, fallback = {}) {
  if (!mesh) return cloneLocalTransform(fallback);
  return {
    position: [mesh.position.x, mesh.position.y, mesh.position.z],
    rotationEuler: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
    rotationY: mesh.rotation.y,
    scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z]
  };
}

function transformSnapshot(entity) {
  if (!entity) return null;
  return {
    entityId: entity.id,
    sceneId: entity.sceneId || currentSceneId(),
    displayName: entity.displayName || entity.name || "",
    sourceFileHint: entity.sourceFileHint || entity.notes?.sourceFileHint || "",
    local: cloneLocalTransform(localTransformFromMesh(entity.mesh, entity.transform?.local))
  };
}

function serializableEntities(rows) {
  return rows.map((entity) => normalizeDevEntity(entity));
}

function canvasPointForEntity(objectId) {
  const entity = findDevEntityById(collectEditableObjects({ force: true }), objectId);
  if (!entity?.mesh || !_camera || !_renderer?.domElement) return null;
  const box = new THREE.Box3().setFromObject(entity.mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  if (entity.category !== "terrain_tile" && Number.isFinite(box.max.y)) {
    center.y = box.max.y - Math.min(0.05, Math.max(0, box.max.y - box.min.y) * 0.15);
  }
  const projected = center.project(_camera);
  const rect = _renderer.domElement.getBoundingClientRect();
  return {
    x: ((projected.x + 1) / 2) * rect.width + rect.left,
    y: ((1 - projected.y) / 2) * rect.height + rect.top,
    entityId: entity.id,
    displayName: entity.displayName || entity.name || "",
    visible: isVisibleInHierarchy(entity.mesh)
  };
}

function writeClipboardOrConsole(payload, successMessage, blockedMessage) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  console.log(text);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text)
      .then(() => { _onShowPrompt(successMessage, 1.4); })
      .catch(() => { _onShowPrompt(blockedMessage, 1.5); });
    return text;
  }
  _onShowPrompt("Clipboard unavailable. Export logged in console.", 1.5);
  return text;
}

function getSelectedRow() {
  return _state.devEditor.rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;
}

function currentSceneId() {
  return _state?.scene?.id || "";
}

function annotationForEntity(entity) {
  if (!entity) return emptyAnnotation(currentSceneId(), "");
  return getAnnotation(entity.sceneId || currentSceneId(), entity.id);
}

function compactAnnotationForEntity(entity) {
  return compactAnnotation(annotationForEntity(entity));
}

function annotatedEntitiesForScene(rows) {
  return (rows || [])
    .map((entity) => {
      const annotation = compactAnnotationForEntity(entity);
      if (!annotation) return null;
      return {
        entityId: entity.id,
        displayName: entity.displayName || entity.name || "",
        annotation
      };
    })
    .filter(Boolean);
}

function annotationSummaryText(annotation) {
  const parts = annotationBadgeParts(annotation);
  if (!parts.length) return "annotation:none";
  return `annotation:${parts.join("/")}`;
}

function annotationFields() {
  return [
    _hud.devEditorAnnotationNotes,
    _hud.devEditorAnnotationDeleteCandidate,
    _hud.devEditorAnnotationReplaceCandidate,
    _hud.devEditorAnnotationCollisionIssue,
    _hud.devEditorAnnotationOrientationIssue,
    _hud.devEditorAnnotationPositioningIssue,
    _hud.devEditorAnnotationPriority,
    _hud.devEditorAnnotationReplacementAsset,
    _hud.devEditorAnnotationReplacementReason,
    _hud.devEditorAnnotationClear
  ].filter(Boolean);
}

function annotationFieldHasFocus() {
  return annotationFields().some((field) => document.activeElement === field);
}

function isTextEditingTarget(target) {
  return Boolean(target?.matches?.("input, textarea, select, [contenteditable='true']"));
}

function setAnnotationFieldsDisabled(disabled) {
  annotationFields().forEach((field) => {
    field.disabled = disabled;
  });
}

function setAnnotationFieldValues(annotation) {
  annotationFormSyncing = true;
  if (_hud.devEditorAnnotationNotes) _hud.devEditorAnnotationNotes.value = annotation.notes;
  if (_hud.devEditorAnnotationDeleteCandidate) _hud.devEditorAnnotationDeleteCandidate.checked = annotation.flags.deleteCandidate;
  if (_hud.devEditorAnnotationReplaceCandidate) _hud.devEditorAnnotationReplaceCandidate.checked = annotation.flags.replaceCandidate;
  if (_hud.devEditorAnnotationCollisionIssue) _hud.devEditorAnnotationCollisionIssue.checked = annotation.flags.collisionIssue;
  if (_hud.devEditorAnnotationOrientationIssue) _hud.devEditorAnnotationOrientationIssue.checked = annotation.flags.orientationIssue;
  if (_hud.devEditorAnnotationPositioningIssue) _hud.devEditorAnnotationPositioningIssue.checked = annotation.flags.positioningIssue;
  if (_hud.devEditorAnnotationPriority) _hud.devEditorAnnotationPriority.value = annotation.priority;
  if (_hud.devEditorAnnotationReplacementAsset) _hud.devEditorAnnotationReplacementAsset.value = annotation.replacement.assetKey;
  if (_hud.devEditorAnnotationReplacementReason) _hud.devEditorAnnotationReplacementReason.value = annotation.replacement.reason;
  annotationFormSyncing = false;
}

function syncAnnotationForm(selected) {
  if (!_hud) return;
  if (!selected) {
    annotationFormEntityKey = "";
    setAnnotationFieldsDisabled(true);
    setAnnotationFieldValues(emptyAnnotation(currentSceneId(), ""));
    return;
  }

  setAnnotationFieldsDisabled(false);
  const key = annotationStorageKey(selected.sceneId || currentSceneId(), selected.id);
  if (annotationFormEntityKey === key && annotationFieldHasFocus()) return;
  annotationFormEntityKey = key;
  setAnnotationFieldValues(annotationForEntity(selected));
}

function readAnnotationForm() {
  return normalizeAnnotation({
    notes: _hud.devEditorAnnotationNotes?.value || "",
    flags: {
      deleteCandidate: Boolean(_hud.devEditorAnnotationDeleteCandidate?.checked),
      replaceCandidate: Boolean(_hud.devEditorAnnotationReplaceCandidate?.checked),
      collisionIssue: Boolean(_hud.devEditorAnnotationCollisionIssue?.checked),
      orientationIssue: Boolean(_hud.devEditorAnnotationOrientationIssue?.checked),
      positioningIssue: Boolean(_hud.devEditorAnnotationPositioningIssue?.checked)
    },
    replacement: {
      assetKey: _hud.devEditorAnnotationReplacementAsset?.value || "",
      reason: _hud.devEditorAnnotationReplacementReason?.value || ""
    },
    priority: _hud.devEditorAnnotationPriority?.value || "normal"
  }, currentSceneId(), _state.devEditor.selectedObjectId || "");
}

function handleAnnotationChange() {
  if (annotationFormSyncing) return;
  const selected = getSelectedRow();
  if (!selected) return;
  setAnnotation(selected.sceneId || currentSceneId(), selected.id, readAnnotationForm());
  annotationsVersion += 1;
  objectListSignature = "";
  updateDevEditorPanel();
}

function handleAnnotationClear() {
  const selected = getSelectedRow();
  if (!selected) return;
  clearAnnotation(selected.sceneId || currentSceneId(), selected.id);
  annotationFormEntityKey = "";
  annotationsVersion += 1;
  objectListSignature = "";
  syncAnnotationForm(selected);
  updateDevEditorPanel();
  _onShowPrompt("Annotation cleared.", 1.2);
}

function bindAnnotationEvents() {
  [
    _hud.devEditorAnnotationNotes,
    _hud.devEditorAnnotationReplacementAsset,
    _hud.devEditorAnnotationReplacementReason
  ].filter(Boolean).forEach((field) => {
    field.addEventListener("input", handleAnnotationChange);
  });
  [
    _hud.devEditorAnnotationDeleteCandidate,
    _hud.devEditorAnnotationReplaceCandidate,
    _hud.devEditorAnnotationCollisionIssue,
    _hud.devEditorAnnotationOrientationIssue,
    _hud.devEditorAnnotationPositioningIssue,
    _hud.devEditorAnnotationPriority
  ].filter(Boolean).forEach((field) => {
    field.addEventListener("change", handleAnnotationChange);
  });
  _hud.devEditorAnnotationClear?.addEventListener("click", handleAnnotationClear);
}

function getActorKeyForMesh(mesh) {
  const { actorMeshes } = _getSceneMeshes();
  if (mesh === actorMeshes?.human) return "human";
  if (mesh === actorMeshes?.frog) return "frog";
  if (mesh === actorMeshes?.elephant) return "elephant";
  return "";
}

function syncActorStateFromMesh(mesh) {
  const actorKey = getActorKeyForMesh(mesh);
  if (!actorKey || !_state[actorKey]) return;
  _state[actorKey].x = mesh.position.x;
  _state[actorKey].z = mesh.position.z;
  _state[actorKey].facing = directionName({ x: Math.sin(mesh.rotation.y), z: Math.cos(mesh.rotation.y) });
}

function colliderKey(collider, index) {
  return String(collider?.id || collider?.label || `runtime-collider-${index}`);
}

function colliderCenter(collider) {
  const center = Array.isArray(collider?.center)
    ? collider.center
    : [collider?.x, collider?.y || 0, collider?.z];
  return {
    x: Number(center[0]),
    y: Number(center[1]),
    z: Number(center[2])
  };
}

function colliderSize(collider) {
  const halfExtents = Array.isArray(collider?.halfExtents)
    ? collider.halfExtents
    : [collider?.halfX, collider?.halfY || 0, collider?.halfZ];
  const x = Math.max(0.02, Math.abs(Number(halfExtents[0]) || 0) * 2);
  const y = Math.max(COLLIDER_MIN_VISIBLE_SIZE_Y, Math.abs(Number(halfExtents[1]) || 0) * 2);
  const z = Math.max(0.02, Math.abs(Number(halfExtents[2]) || 0) * 2);
  return { x, y, z };
}

function colliderSignature(value) {
  return String(value || "").trim().toLowerCase();
}

function selectedColliderSignatures(selected) {
  const signatures = new Set();
  (selected?.collision?.colliders || []).forEach((collider) => {
    const id = colliderSignature(collider.id);
    const label = colliderSignature(collider.label);
    if (id) signatures.add(id);
    if (label) signatures.add(label);
  });
  return signatures;
}

function colliderIsSelected(collider, signatures) {
  if (!signatures.size) return false;
  return signatures.has(colliderSignature(collider?.id)) || signatures.has(colliderSignature(collider?.label));
}

function createActualColliderHelper(key) {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const geometry = new THREE.EdgesGeometry(box);
  box.dispose();
  const material = new THREE.LineBasicMaterial({
    color: COLLISION_COLORS.default,
    transparent: true,
    opacity: 0.78,
    depthTest: false,
    depthWrite: false
  });
  const helper = new THREE.LineSegments(geometry, material);
  helper.name = `Dev Actual Collider: ${key}`;
  helper.renderOrder = 1000;
  markDevHelper(helper);
  return helper;
}

function updateActualColliderHelper(helper, collider, selected) {
  const center = colliderCenter(collider);
  const size = colliderSize(collider);
  helper.position.set(center.x, center.y, center.z);
  helper.scale.set(size.x, size.y, size.z);
  if (Array.isArray(collider?.rotationEuler)) {
    helper.rotation.set(
      Number(collider.rotationEuler[0]) || 0,
      Number(collider.rotationEuler[1]) || 0,
      Number(collider.rotationEuler[2]) || 0
    );
  } else {
    helper.rotation.set(0, 0, 0);
  }
  helper.visible = true;
  helper.userData.colliderId = collider?.id || "";
  helper.userData.colliderLabel = collider?.label || "";
  helper.userData.colliderSource = collider?.source || "";
  helper.userData.type = "actualCollider";
  helper.material.color.setHex(selected ? COLLISION_COLORS.selected : collider?.active === false ? COLLISION_COLORS.inactive : COLLISION_COLORS.default);
  helper.material.opacity = selected ? 0.95 : collider?.active === false ? 0.38 : 0.72;
}

function markDevHelper(object) {
  if (!object) return;
  object.userData.devEditorHelper = true;
  object.traverse?.((child) => {
    child.userData.devEditorHelper = true;
  });
}

function isDevHelper(object) {
  let current = object;
  while (current) {
    if (current.userData?.devEditorHelper) return true;
    current = current.parent;
  }
  return false;
}

function hitsActiveTransformPicker() {
  const picker = transformControls?._gizmo?.picker?.[currentTransformMode()];
  if (!picker) return false;
  return raycaster.intersectObject(picker, true).some((hit) => hit.object?.visible);
}

function isVisibleInHierarchy(object) {
  let current = object;
  while (current) {
    if (current.visible === false) return false;
    current = current.parent;
  }
  return true;
}

function setupTransformControls() {
  if (transformControls || !_camera || !_renderer?.domElement) return;
  transformControls = new TransformControls(_camera, _renderer.domElement);
  transformControls.setSize(0.72);
  transformControls.addEventListener("objectChange", handleTransformObjectChange);
  transformControls.addEventListener("dragging-changed", (event) => {
    const dragging = Boolean(event.value);
    _state.devEditor.transformDragging = dragging;
    if (dragging) {
      activeTransformDragSnapshot = transformSnapshot(getSelectedRow());
      return;
    }
    if (!activeTransformDragSnapshot) return;
    const rows = collectEditableObjects({ force: true });
    const transformed = findDevEntityById(rows, activeTransformDragSnapshot.entityId) || getSelectedRow();
    pushTransformUndo(transformed, activeTransformDragSnapshot, `transform-control:${currentTransformMode()}`);
    activeTransformDragSnapshot = null;
    updateDevEditorPanel();
  });
  transformHelper = transformControls.getHelper();
  transformHelper.visible = false;
  markDevHelper(transformHelper);
  _scene.add(transformHelper);
}

function configureTransformControls() {
  if (!transformControls) return;
  transformControls.setMode(currentTransformMode());
  transformControls.setTranslationSnap(_state.devEditor.snapToGrid ? _state.devEditor.nudgeStep : null);
  transformControls.setRotationSnap(_state.devEditor.snapToGrid ? DEG_15 : null);
  transformControls.setScaleSnap(_state.devEditor.snapToGrid ? SCALE_SNAP : null);
}

function attachTransformControls(mesh) {
  setupTransformControls();
  if (!transformControls || !transformHelper) return;
  configureTransformControls();
  if (mesh) {
    transformControls.attach(mesh);
    transformHelper.visible = _state.devEditor.open;
  } else {
    transformControls.detach();
    transformHelper.visible = false;
  }
}

function detachTransformControls() {
  if (!transformControls || !transformHelper) return;
  transformControls.detach();
  transformHelper.visible = false;
}

function handleTransformObjectChange() {
  if (!selectedMesh) return;
  syncActorStateFromMesh(selectedMesh);
  _state.devEditor.rows = collectEditableObjects({ force: true });
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

export function initDevEditor({
  state,
  scene,
  hud,
  camera,
  renderer,
  getSceneMeshes,
  getSceneColliderDebugEntries,
  getRuntimeSnapshot,
  sceneNav,
  onUpdateHud,
  onOpenChange,
  onShowPrompt
}) {
  _state = state;
  _scene = scene;
  _hud = hud;
  _camera = camera;
  _renderer = renderer;
  _getSceneMeshes = getSceneMeshes;
  _getSceneColliderDebugEntries = getSceneColliderDebugEntries;
  _getRuntimeSnapshot = getRuntimeSnapshot;
  _sceneNav = sceneNav;
  _onUpdateHud = onUpdateHud;
  _onOpenChange = onOpenChange || (() => {});
  _onShowPrompt = onShowPrompt;
  _state.devEditor.transformMode = _state.devEditor.transformMode || "translate";
  _state.devEditor.showTiles = Boolean(_state.devEditor.showTiles);
  _state.devEditor.objectFilter = _state.devEditor.objectFilter || "";

  setupTransformControls();
  hud.devEditorToggle?.addEventListener("click", toggleDevEditorPanel);
  hud.devEditorSnapToggle?.addEventListener("click", toggleDevEditorSnap);
  hud.devEditorColliderToggle?.addEventListener("click", toggleDevEditorColliders);
  hud.devEditorShowTilesToggle?.addEventListener("click", toggleDevEditorShowTiles);
  hud.devEditorObjectFilter?.addEventListener("input", handleObjectFilterInput);
  hud.devEditorExportLayout?.addEventListener("click", handleExportClick);
  hud.devEditorCopySelectionDelta?.addEventListener("click", handleCopySelectionDelta);
  hud.devEditorUndoTransform?.addEventListener("click", () => undoLastTransform());
  hud.devEditorCopyAiContext?.addEventListener("click", handleCopyAiContext);
  hud.devEditorCopyAuthoringJson?.addEventListener("click", handleCopyAuthoringJson);
  hud.devEditorCopyAuthoringMarkdown?.addEventListener("click", handleCopyAuthoringMarkdown);
  hud.devEditorExportPatchDraft?.addEventListener("click", handleExportPatchDraft);
  hud.devEditorOpenLevelEditor?.addEventListener("click", handleOpenLevelEditor);
  hud.devEditorPanel?.addEventListener("click", handlePanelClick);
  bindAnnotationEvents();
  installDevEditorTestHooks();
}

export function toggleDevEditorPanel() {
  setDevEditorOpen(!_state.devEditor.open);
}

function setDevEditorOpen(open) {
  _state.devEditor.open = Boolean(open);
  if (_hud.devEditorToggle) {
    _hud.devEditorToggle.classList.toggle("is-open", _state.devEditor.open);
    _hud.devEditorToggle.setAttribute("aria-expanded", _state.devEditor.open ? "true" : "false");
  }
  if (_hud.devEditorPanel) {
    _hud.devEditorPanel.hidden = !_state.devEditor.open;
    _hud.devEditorPanel.classList.toggle("is-open", _state.devEditor.open);
  }
  _hud.root?.classList.toggle("dev-editor-active", _state.devEditor.open);
  if (!_state.devEditor.open) {
    _state.devEditor.selectedObjectId = "";
    _state.devEditor.transformDragging = false;
    selectedMesh = null;
    selectionBaseline = null;
    activeTransformDragSnapshot = null;
    invalidateEditableRows();
    if (selectionHelper) {
      _scene.remove(selectionHelper);
      selectionHelper.geometry?.dispose();
      selectionHelper.material?.dispose();
      selectionHelper = null;
    }
    detachTransformControls();
    clearColliderHelpers();
  } else {
    _state.devEditor.rows = collectEditableObjects({ force: true });
    syncColliderHelpers();
    attachTransformControls(selectedMesh);
  }
  _onOpenChange(_state.devEditor.open);
  updateDevEditorPanel();
  _onUpdateHud();
}

function clearColliderHelpers() {
  colliderHelpers.forEach((helper) => {
    _scene.remove(helper);
    helper.geometry?.dispose();
    helper.material?.dispose();
  });
  colliderHelpers.clear();
  colliderSyncSignature = "";
}

function toggleDevEditorSnap() {
  _state.devEditor.snapToGrid = !_state.devEditor.snapToGrid;
  configureTransformControls();
  updateDevEditorPanel();
}

function toggleDevEditorColliders() {
  _state.devEditor.showColliders = !_state.devEditor.showColliders;
  syncColliderHelpers();
  updateDevEditorPanel();
}

function toggleDevEditorShowTiles() {
  _state.devEditor.showTiles = !Boolean(_state.devEditor.showTiles);
  objectListSignature = "";
  updateDevEditorPanel();
}

function handleObjectFilterInput(event) {
  _state.devEditor.objectFilter = event?.target?.value || "";
  objectListSignature = "";
  updateDevEditorPanel();
}

function handleExportClick() {
  const rows = collectEditableObjects({ force: true });
  const snapshot = {
    levelId: _state.scene.id,
    objects: rows.map((row) => ({
      objectId: row.id,
      objectName: row.name,
      displayName: row.displayName || row.name,
      category: row.category,
      asset: row.asset?.key || "",
      position: {
        x: row.transform.local.position[0],
        y: row.transform.local.position[1],
        z: row.transform.local.position[2]
      },
      rotationY: row.transform.local.rotationY,
      scale: {
        x: row.transform.local.scale[0],
        y: row.transform.local.scale[1],
        z: row.transform.local.scale[2]
      },
      collisionExpected: row.collision.expected,
      sourceFileHint: row.sourceFileHint,
      annotation: compactAnnotationForEntity(row)
    })),
    annotations: {
      schema: "lumina3d.dev.objectAnnotations.v1",
      annotatedEntities: annotatedEntitiesForScene(rows)
    }
  };
  writeClipboardOrConsole(snapshot, "Layout snapshot copied to clipboard.", "Copy blocked. Layout snapshot logged in console.");
}

function cameraSnapshot() {
  if (!_camera) return null;
  return {
    position: [_camera.position.x, _camera.position.y, _camera.position.z].map((value) => round(value)),
    quaternion: [_camera.quaternion.x, _camera.quaternion.y, _camera.quaternion.z, _camera.quaternion.w].map((value) => round(value, 4)),
    zoom: round(_camera.zoom),
    devEditor: _state.devEditor.debugCamera ? {
      active: Boolean(_state.devEditor.debugCamera.active),
      target: _state.devEditor.debugCamera.target || null,
      yaw: round(_state.devEditor.debugCamera.yaw),
      pitch: round(_state.devEditor.debugCamera.pitch)
    } : null
  };
}

function actorSnapshot(actor) {
  if (!actor) return null;
  return {
    x: round(actor.x),
    z: round(actor.z),
    radius: round(actor.radius),
    speed: round(actor.speed),
    facing: actor.facing ? { ...actor.facing } : null
  };
}

function getNearbyEntities(rows, selected) {
  if (!selected) return [];
  return rows
    .filter((entity) => entity.id !== selected.id)
    .map((entity) => ({
      ...entity,
      distance2D: round(entityDistance2D(selected, entity))
    }))
    .filter((entity) => entity.distance2D <= NEARBY_ENTITY_RADIUS)
    .sort((a, b) => a.distance2D - b.distance2D)
    .slice(0, NEARBY_ENTITY_LIMIT)
    .map((entity) => {
      const normalized = normalizeDevEntity(entity);
      normalized.distance2D = entity.distance2D;
      return normalized;
    });
}

function buildAiContextPayload() {
  const rows = collectEditableObjects({ force: true });
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const runtimeSnapshot = typeof _getRuntimeSnapshot === "function" ? _getRuntimeSnapshot() : null;
  const selectedAnnotation = compactAnnotationForEntity(selected);
  return {
    schema: AI_CONTEXT_SCHEMA,
    capturedAt: new Date().toISOString(),
    project: {
      name: "Lumina3D",
      stack: "Vite + Three.js",
      lane: "AI feedback/debug system",
      sourceSaving: "browser-export-only"
    },
    coordinateConventions: {
      worldUp: "+Y",
      movementPlane: "X/Z",
      sourceRotationUnits: "radians",
      uiMayDisplayDegrees: true
    },
    scene: {
      id: _state.scene.id,
      phase: _state.scene.phase,
      titleCardVisible: Boolean(_state.scene.titleCardVisible)
    },
    selection: selected ? {
      ...normalizeDevEntity(selected),
      annotation: selectedAnnotation
    } : null,
    nearbyEntities: getNearbyEntities(rows, selected),
    entities: {
      count: rows.length,
      ids: rows.map((entity) => entity.id)
    },
    annotations: {
      selected: selectedAnnotation,
      annotatedEntities: annotatedEntitiesForScene(rows)
    },
    colliders: typeof _getSceneColliderDebugEntries === "function" ? _getSceneColliderDebugEntries() : [],
    camera: cameraSnapshot(),
    actors: {
      active: _state.active,
      human: actorSnapshot(_state.human),
      frog: actorSnapshot(_state.frog),
      elephant: actorSnapshot(_state.elephant)
    },
    runtime: runtimeSnapshot,
    issueTemplate: {
      observed: "",
      expected: "",
      notes: ""
    },
    patchTargets: {
      selectedEntityId: selected?.id || "",
      sourceFileHint: selected?.sourceFileHint || selected?.notes?.sourceFileHint || "",
      browserMayWriteSourceFiles: false
    }
  };
}

function handleCopyAiContext() {
  writeClipboardOrConsole(
    buildAiContextPayload(),
    "AI context copied to clipboard.",
    "Copy blocked. AI context logged in console."
  );
}

function inferOptionalExpectation(row, pattern) {
  const haystack = [
    row?.id,
    row?.name,
    row?.displayName,
    row?.category,
    row?.asset?.key
  ].join(" ");
  return pattern.test(haystack) ? true : undefined;
}

function colliderLabelGuess(row) {
  if (!row) return "";
  if (row.collision?.labels?.length) return row.collision.labels[0];
  const id = String(row.id || "").replace(/\./g, "-").replace(/_/g, "-");
  if (id.includes("water")) return id.replace("level-three-terrain-water", "level-three-water");
  if (id.includes("prop")) return id.replace(/\.prop\./g, "-");
  return row.collision?.expected ? id : "";
}

function authoringObjectRow(row) {
  return {
    id: row.id,
    name: row.displayName || row.name,
    category: row.category,
    asset: row.asset?.key || "",
    position: {
      x: row.transform.local.position[0],
      y: row.transform.local.position[1],
      z: row.transform.local.position[2]
    },
    rotationY: row.transform.local.rotationY,
    scale: {
      x: row.transform.local.scale[0],
      y: row.transform.local.scale[1],
      z: row.transform.local.scale[2]
    },
    collisionExpected: Boolean(row.collision?.expected),
    triggerExpected: inferOptionalExpectation(row, /button|trigger|zone/i),
    collectibleExpected: inferOptionalExpectation(row, /love|letter|totem|collect/i),
    walkableExpected: inferOptionalExpectation(row, /ground|path|bridge|ramp|platform|ledge/i),
    colliderLabelGuess: colliderLabelGuess(row),
    sourceFileHint: row.sourceFileHint || row.notes?.sourceFileHint || "",
    annotation: compactAnnotationForEntity(row)
  };
}

function annotatedNotes(rows, predicate) {
  return annotatedEntitiesForScene(rows)
    .filter((entry) => predicate(findDevEntityById(rows, entry.entityId)))
    .map((entry) => ({
      objectId: entry.entityId,
      notes: entry.annotation?.notes || "",
      flags: entry.annotation?.flags || {},
      priority: entry.annotation?.priority || "normal"
    }));
}

function buildAuthoringPacketPayload() {
  const rows = collectEditableObjects({ force: true });
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const registryEntry = registeredLevelForScene(_state.scene.id);
  const colliders = typeof _getSceneColliderDebugEntries === "function" ? _getSceneColliderDebugEntries() : [];
  return {
    schema: AUTHORING_PACKET_SCHEMA,
    capturedAt: new Date().toISOString(),
    levelId: registryEntry?.catalogId || _state.scene.id,
    sceneId: _state.scene.id,
    displayName: registryEntry?.displayName || _state.scene.id,
    sourceFiles: registryEntry?.sourceFiles || [
      selected?.sourceFileHint || "",
      "scripts/lib/levelCatalog.js"
    ].filter(Boolean),
    selectedEntityId: selected?.id || "",
    objects: rows.map(authoringObjectRow),
    terrainNotes: annotatedNotes(rows, (row) => /terrain|water|ground|path/i.test(row?.category || row?.id || "")),
    mechanismNotes: annotatedNotes(rows, (row) => /button|ramp|platform|bridge|mechanism/i.test(row?.category || row?.id || "")),
    collisionNotes: {
      colliderCount: colliders.length,
      colliderLabels: colliders.map((collider) => collider.label || collider.id || ""),
      annotatedIssues: annotatedNotes(rows, (row) => {
        const annotation = compactAnnotationForEntity(row);
        return Boolean(annotation?.flags?.collisionIssue);
      })
    },
    authorInstructions: "Apply these layout changes only. Do not invent new mechanics.",
    browserMayWriteSourceFiles: false
  };
}

function buildAuthoringMarkdownPacket() {
  const packet = buildAuthoringPacketPayload();
  const sourceFiles = packet.sourceFiles.map((file) => `- ${file}`).join("\n");
  const selected = packet.selectedEntityId ? `\n\nSelected entity: \`${packet.selectedEntityId}\`` : "";
  return `# Lumina3D Level Authoring Packet

Level: ${packet.displayName} (\`${packet.levelId}\`)
Scene: \`${packet.sceneId}\`${selected}

## Author Instructions

${packet.authorInstructions}

Do not make the browser/editor write source files directly. Apply changes in source after review, then run the validation commands.

## Likely Source Files

${sourceFiles}

## Validation Commands

- npm run build
- npm run tools:run-scene-smoke -- ${packet.sceneId} --pretty
- npm run tools:validate-level-registry -- --pretty

## Packet JSON

\`\`\`json
${JSON.stringify(packet, null, 2)}
\`\`\`
`;
}

function handleCopyAuthoringJson() {
  writeClipboardOrConsole(
    buildAuthoringPacketPayload(),
    "Authoring JSON copied to clipboard.",
    "Copy blocked. Authoring JSON logged in console."
  );
}

function handleCopyAuthoringMarkdown() {
  writeClipboardOrConsole(
    buildAuthoringMarkdownPacket(),
    "Codex Markdown packet copied to clipboard.",
    "Copy blocked. Codex Markdown packet logged in console."
  );
}

function valuesDiffer(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function transformsDiffer(a, b) {
  if (!a || !b) return false;
  return valuesDiffer(a.position, b.position) ||
    valuesDiffer(a.rotationEuler, b.rotationEuler) ||
    valuesDiffer(a.scale, b.scale);
}

function deltaArray(oldValue = [], newValue = [], digits = 3) {
  return newValue.map((value, index) => round(Number(value) - Number(oldValue[index] || 0), digits));
}

function localTransformForDelta(entity) {
  return {
    position: entity?.transform?.local?.position || [0, 0, 0],
    rotationEuler: entity?.transform?.local?.rotationEuler || [0, 0, 0],
    rotationY: entity?.transform?.local?.rotationY || 0,
    scale: entity?.transform?.local?.scale || [1, 1, 1]
  };
}

function baselineForSelected(selected) {
  if (!selected) return null;
  if (selectionBaseline?.entityId === selected.id) return selectionBaseline.local;
  return localTransformForDelta(selected);
}

function pushTransformUndo(entity, beforeSnapshot, action = "transform") {
  if (!entity || !entity.mesh || !beforeSnapshot?.local) return false;
  const afterSnapshot = transformSnapshot(entity);
  if (!afterSnapshot || !transformsDiffer(beforeSnapshot.local, afterSnapshot.local)) return false;
  transformUndoStack.push({
    entityId: entity.id,
    sceneId: entity.sceneId || currentSceneId(),
    displayName: entity.displayName || entity.name || beforeSnapshot.displayName || entity.id,
    sourceFileHint: entity.sourceFileHint || entity.notes?.sourceFileHint || beforeSnapshot.sourceFileHint || "",
    action,
    createdAt: new Date().toISOString(),
    before: cloneLocalTransform(beforeSnapshot.local),
    after: cloneLocalTransform(afterSnapshot.local)
  });
  if (transformUndoStack.length > TRANSFORM_UNDO_LIMIT) {
    transformUndoStack.splice(0, transformUndoStack.length - TRANSFORM_UNDO_LIMIT);
  }
  return true;
}

function undoableTransformEntry(rows = collectEditableObjects()) {
  const sceneId = currentSceneId();
  for (let i = transformUndoStack.length - 1; i >= 0; i -= 1) {
    const entry = transformUndoStack[i];
    if (entry.sceneId && entry.sceneId !== sceneId) continue;
    if (findDevEntityById(rows, entry.entityId)?.mesh) return { entry, index: i };
  }
  return null;
}

function applyLocalTransform(mesh, local) {
  const next = cloneLocalTransform(local);
  mesh.position.set(next.position[0], next.position[1], next.position[2]);
  mesh.rotation.set(next.rotationEuler[0], next.rotationEuler[1], next.rotationEuler[2]);
  mesh.scale.set(next.scale[0], next.scale[1], next.scale[2]);
  mesh.updateMatrixWorld(true);
}

function refreshAfterTransformChange({ forceRows = true } = {}) {
  if (forceRows) _state.devEditor.rows = collectEditableObjects({ force: true });
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

function undoLastTransform({ showPrompt = true } = {}) {
  let rows = collectEditableObjects({ force: true });
  while (transformUndoStack.length > 0) {
    const undoable = undoableTransformEntry(rows);
    if (!undoable) {
      transformUndoStack.length = 0;
      break;
    }
    const [entry] = transformUndoStack.splice(undoable.index, 1);
    const entity = findDevEntityById(rows, entry.entityId);
    if (!entity?.mesh) {
      rows = collectEditableObjects({ force: true });
      continue;
    }
    applyLocalTransform(entity.mesh, entry.before);
    syncActorStateFromMesh(entity.mesh);
    _state.devEditor.selectedObjectId = entity.id;
    selectedMesh = entity.mesh;
    rows = collectEditableObjects({ force: true });
    refreshAfterTransformChange({ forceRows: false });
    if (showPrompt) _onShowPrompt(`Undid transform: ${entry.displayName || entry.entityId}.`, 1.2);
    return true;
  }
  updateDevEditorPanel();
  if (showPrompt) _onShowPrompt("No Dev Editor transform to undo.", 1.2);
  return false;
}

function transformUndoState() {
  const rows = collectEditableObjects();
  const undoable = undoableTransformEntry(rows);
  return {
    count: transformUndoStack.length,
    canUndo: Boolean(undoable),
    latest: undoable ? {
      entityId: undoable.entry.entityId,
      sceneId: undoable.entry.sceneId,
      displayName: undoable.entry.displayName,
      action: undoable.entry.action,
      createdAt: undoable.entry.createdAt
    } : null
  };
}

function buildSelectionDeltaPayload() {
  const rows = collectEditableObjects({ force: true });
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const original = baselineForSelected(selected);
  const current = selected ? localTransformForDelta(selected) : null;
  const changed = Boolean(selected && original && current && (
    valuesDiffer(original.position, current.position) ||
    valuesDiffer(original.rotationEuler, current.rotationEuler) ||
    valuesDiffer(original.scale, current.scale)
  ));

  return {
    schema: SELECTION_DELTA_SCHEMA,
    capturedAt: new Date().toISOString(),
    sceneId: _state.scene.id,
    selectedEntityId: selected?.id || "",
    displayName: selected?.displayName || selected?.name || "",
    name: selected?.name || "",
    category: selected?.category || "",
    asset: selected?.asset || null,
    sourceFileHint: selected?.sourceFileHint || selected?.notes?.sourceFileHint || "",
    annotation: compactAnnotationForEntity(selected),
    changed,
    original,
    current,
    delta: selected && original && current ? {
      position: deltaArray(original.position, current.position),
      rotationEuler: deltaArray(original.rotationEuler, current.rotationEuler),
      rotationY: round((current.rotationY || 0) - (original.rotationY || 0)),
      scale: deltaArray(original.scale, current.scale)
    } : null,
    browserMayWriteSourceFiles: false
  };
}

function buildTransformDeltaPayload() {
  return buildSelectionDeltaPayload();
}

function handleCopySelectionDelta() {
  writeClipboardOrConsole(
    buildTransformDeltaPayload(),
    "Transform delta copied to clipboard.",
    "Copy blocked. Transform delta logged in console."
  );
}

function buildPatchChanges(selected) {
  if (!selected) return [];
  const sourceFileHint = selected.sourceFileHint || selected.notes?.sourceFileHint || "";
  const oldLocal = baselineForSelected(selected);
  const newLocal = localTransformForDelta(selected);
  const fields = [
    ["transform.local.position", oldLocal.position, newLocal.position],
    ["transform.local.rotationEuler", oldLocal.rotationEuler, newLocal.rotationEuler],
    ["transform.local.scale", oldLocal.scale, newLocal.scale]
  ];
  return fields
    .filter(([, oldValue, newValue]) => valuesDiffer(oldValue, newValue))
    .map(([path, oldValue, newValue]) => ({
      path,
      oldValue,
      newValue,
      sourceFileHint,
      reason: ""
    }));
}

function buildPatchDraftPayload() {
  const rows = collectEditableObjects({ force: true });
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const selectedAnnotation = compactAnnotationForEntity(selected);
  return {
    schema: SCENE_PATCH_SCHEMA,
    patchId: `scene-patch-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    sceneId: _state.scene.id,
    issueType: "",
    selectedEntityId: selected?.id || "",
    changes: buildPatchChanges(selected),
    annotationIntent: {
      selected: selectedAnnotation,
      deleteCandidate: Boolean(selectedAnnotation?.flags?.deleteCandidate),
      replaceCandidate: Boolean(selectedAnnotation?.flags?.replaceCandidate),
      replacement: selectedAnnotation?.replacement || null,
      browserMayDeleteOrReplaceObjects: false
    },
    validationCommands: [
      "npm run build",
      `npm run tools:run-scene-smoke -- ${_state.scene.id} --pretty`,
      "npm run tools:validate-missing-colliders -- level_two --pretty",
      "npm run tools:validate-float-colliders -- level_two --pretty"
    ],
    manualChecks: [
      "Open Dev Editor with F2 and reselect the changed entity.",
      "Confirm visual bounds and actual colliders still match the intended object.",
      "Confirm normal player behavior is unchanged when Dev Editor is closed."
    ]
  };
}

function handleExportPatchDraft() {
  writeClipboardOrConsole(
    buildPatchDraftPayload(),
    "Patch draft copied to clipboard.",
    "Copy blocked. Patch draft logged in console."
  );
}

function buildEditorHandoffPayload() {
  const rows = collectEditableObjects({ force: true });
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const selectedAnnotation = compactAnnotationForEntity(selected);
  return normalizeEditorHandoffPayload({
    sceneId: _state.scene.id,
    scene: {
      id: _state.scene.id,
      phase: _state.scene.phase,
      titleCardVisible: Boolean(_state.scene.titleCardVisible)
    },
    selectedEntityId: selected?.id || "",
    selection: selected ? {
      ...normalizeDevEntity(selected),
      annotation: selectedAnnotation
    } : null,
    transformDelta: buildTransformDeltaPayload(),
    aiContext: buildAiContextPayload(),
    annotations: {
      selected: selectedAnnotation,
      annotatedEntities: annotatedEntitiesForScene(rows)
    },
    colliders: typeof _getSceneColliderDebugEntries === "function" ? _getSceneColliderDebugEntries() : [],
    camera: cameraSnapshot(),
    actors: {
      active: _state.active,
      human: actorSnapshot(_state.human),
      frog: actorSnapshot(_state.frog),
      elephant: actorSnapshot(_state.elephant)
    },
    sourceHints: {
      selected: selected?.sourceFileHint || selected?.notes?.sourceFileHint || "",
      browserMayWriteSourceFiles: false,
      deleteOrReplaceIsAnnotationOnly: true
    }
  });
}

function handleOpenLevelEditor() {
  const selected = getSelectedRow();
  if (!selected) {
    _onShowPrompt("Select an object before opening it in the level editor.", 1.5);
    return;
  }
  const { handoff, saved } = saveEditorHandoff(buildEditorHandoffPayload());
  const targetUrl = editorHandoffUrl(handoff, window.location.href);
  if (!saved) {
    writeClipboardOrConsole(
      handoff,
      "Editor handoff copied to clipboard.",
      "Copy blocked. Editor handoff logged in console."
    );
    return;
  }
  const opened = window.open(targetUrl, "_blank", "noopener");
  if (opened) {
    _onShowPrompt("Opened selected object in Level Editor.", 1.3);
    return;
  }
  writeClipboardOrConsole(
    handoff,
    "Popup blocked. Editor handoff copied to clipboard.",
    "Popup and clipboard blocked. Editor handoff logged in console."
  );
}

function selectById(objectId) {
  _state.devEditor.selectedObjectId = objectId || "";
  _state.devEditor.rows = collectEditableObjects({ force: true });
  const selected = getSelectedRow();
  selectionBaseline = transformSnapshot(selected);
  annotationFormEntityKey = "";
  syncDevEditorSelectionToScene();
  updateDevEditorPanel();
}

function installDevEditorTestHooks() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  window.__luminaDevEditor = {
    buildAiContextPayload,
    buildAuthoringMarkdownPacket,
    buildAuthoringPacketPayload,
    buildPatchDraftPayload,
    buildSelectionDeltaPayload,
    buildTransformDeltaPayload,
    buildEditorHandoffPayload,
    listEntities: () => serializableEntities(collectEditableObjects({ force: true })),
    canvasPointForEntity,
    selectEntityById: (objectId) => {
      selectById(objectId);
      return normalizeDevEntity(getSelectedRow());
    },
    undoLastTransform: () => undoLastTransform({ showPrompt: false }),
    getTransformUndoState: () => transformUndoState(),
    getAnnotations: () => listAnnotations(),
    getAnnotationForSelected: () => {
      const selected = getSelectedRow();
      return selected ? annotationForEntity(selected) : null;
    },
    setAnnotationForSelected: (updates = {}) => {
      const selected = getSelectedRow();
      if (!selected) return null;
      const next = setAnnotation(selected.sceneId || currentSceneId(), selected.id, updates);
      annotationsVersion += 1;
      objectListSignature = "";
      updateDevEditorPanel();
      return next;
    }
  };
}

function handlePanelClick(event) {
  const row = event.target.closest(".dev-editor-row");
  if (row && _hud.devEditorObjectList?.contains(row)) {
    event.preventDefault();
    selectById(row.dataset.devObjectId || "");
    return;
  }

  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.devScene) {
    const targetScene = button.dataset.devScene;
    invalidateEditableRows();
    _state.devEditor.selectedObjectId = "";
    selectedMesh = null;
    selectionBaseline = null;
    activeTransformDragSnapshot = null;
    transformUndoStack.length = 0;
    attachTransformControls(null);
    if (targetScene === SCENES.TUTORIAL) _sceneNav.tutorial();
    if (targetScene === SCENES.HOME) _sceneNav.home();
    if (targetScene === SCENES.LEVEL_ONE) _sceneNav.levelOne();
    if (targetScene === SCENES.LEVEL_TWO) _sceneNav.levelTwo();
    if (targetScene === SCENES.LEVEL_THREE) _sceneNav.levelThree();
    return;
  }
  if (button.dataset.devStep) {
    event.preventDefault();
    const next = Number(button.dataset.devStep);
    if (Number.isFinite(next) && next > 0) {
      _state.devEditor.nudgeStep = next;
      configureTransformControls();
      updateDevEditorPanel();
    }
    return;
  }
  if (button.dataset.devTransformMode) {
    event.preventDefault();
    _state.devEditor.transformMode = button.dataset.devTransformMode;
    configureTransformControls();
    updateDevEditorPanel();
    return;
  }
  if (button.dataset.devMove) {
    event.preventDefault();
    if (!button.dataset.devDelta) return;
    const axis = button.dataset.devMove;
    const deltaSign = Number(button.dataset.devDelta);
    if (!_state.devEditor.selectedObjectId) { _onShowPrompt("Select an object first.", 1.2); return; }
    if (Number.isFinite(deltaSign) && ["x", "y", "z"].includes(axis)) {
      moveSelected(axis, deltaSign * _state.devEditor.nudgeStep);
    }
    return;
  }
  if (button.dataset.devRotate) {
    event.preventDefault();
    if (!_state.devEditor.selectedObjectId) { _onShowPrompt("Select an object first.", 1.2); return; }
    const deg = Number(button.dataset.devRotate);
    if (Number.isFinite(deg)) rotateSelected(deg * (Math.PI / 180));
  }
}

function formatVec(values, digits = 2) {
  return `(${(values || []).map((value) => Number(value || 0).toFixed(digits)).join(", ")})`;
}

function selectionDeltaSummary(selected) {
  const original = baselineForSelected(selected);
  const current = selected ? localTransformForDelta(selected) : null;
  if (!selected || !original || !current) return "";
  const positionDelta = deltaArray(original.position, current.position, 3);
  const rotationDelta = deltaArray(original.rotationEuler, current.rotationEuler, 3);
  const scaleDelta = deltaArray(original.scale, current.scale, 3);
  const changed = valuesDiffer(original.position, current.position) ||
    valuesDiffer(original.rotationEuler, current.rotationEuler) ||
    valuesDiffer(original.scale, current.scale);
  if (!changed) return "Delta: none yet";
  return `Start ${formatVec(original.position)} -> Now ${formatVec(current.position)} | dPos ${formatVec(positionDelta, 3)} | dRot ${formatVec(rotationDelta, 3)} | dScale ${formatVec(scaleDelta, 3)}`;
}

function annotationBadgesMarkup(annotation) {
  const badges = annotationBadgeParts(annotation);
  if (!badges.length) return "";
  return `<span class="dev-editor-badges">${badges.map((badge) => (
    `<span class="dev-editor-badge dev-editor-badge-${badge}">${badge}</span>`
  )).join("")}</span>`;
}

function objectListCacheSignature(rows) {
  return [
    _state.scene.id,
    _state.devEditor.selectedObjectId,
    _state.devEditor.showTiles ? "tiles-on" : "tiles-off",
    objectListFilterText(),
    rowsCacheVersion,
    annotationsVersion,
    rows.map((row) => {
      const annotation = annotationForEntity(row);
      return `${row.id}:${row.displayName || row.name}:${row.category}:${annotationBadgeParts(annotation).join(",")}`;
    }).join("|")
  ].join("::");
}

export function updateDevEditorPanel() {
  if (!_hud || !_hud.devEditorPanel || !_hud.devEditorToggle) return;
  const open = _state.devEditor.open;
  _hud.devEditorPanel.hidden = !open;
  _hud.devEditorPanel.classList.toggle("is-open", open);
  _hud.devEditorToggle.classList.toggle("is-open", open);
  _hud.devEditorToggle.setAttribute("aria-expanded", open ? "true" : "false");
  _hud.root?.classList.toggle("dev-editor-active", open);

  if (_hud.devEditorSnapToggle) {
    _hud.devEditorSnapToggle.textContent = _state.devEditor.snapToGrid ? "Snap Grid: On" : "Snap Grid: Off";
    _hud.devEditorSnapToggle.classList.toggle("is-on", _state.devEditor.snapToGrid);
  }
  if (_hud.devEditorUndoTransform) {
    if (open) {
      const undoState = transformUndoState();
      _hud.devEditorUndoTransform.disabled = !undoState.canUndo;
      _hud.devEditorUndoTransform.title = undoState.latest
        ? `Undo last Dev Editor transform: ${undoState.latest.displayName || undoState.latest.entityId}`
        : "Undo the last Dev Editor transform";
    } else {
      _hud.devEditorUndoTransform.disabled = true;
      _hud.devEditorUndoTransform.title = "Undo the last Dev Editor transform";
    }
  }
  if (_hud.devEditorPanel) {
    const stepButtons = _hud.devEditorPanel.querySelectorAll(".dev-editor-step");
    stepButtons.forEach((btn) => {
      const value = Number(btn.dataset.devStep);
      btn.classList.toggle("is-on", Number.isFinite(value) && value === _state.devEditor.nudgeStep);
      btn.classList.toggle("dev-editor-step-off", !(Number.isFinite(value) && value === _state.devEditor.nudgeStep));
    });
    const modeButtons = _hud.devEditorPanel.querySelectorAll("[data-dev-transform-mode]");
    modeButtons.forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.devTransformMode === currentTransformMode());
    });
  }
  if (_hud.devEditorColliderToggle) {
    _hud.devEditorColliderToggle.textContent = `Colliders: ${_state.devEditor.showColliders ? "On" : "Off"}`;
    _hud.devEditorColliderToggle.classList.toggle("is-on", _state.devEditor.showColliders);
  }
  if (_hud.devEditorShowTilesToggle) {
    _hud.devEditorShowTilesToggle.textContent = `Show Tiles: ${_state.devEditor.showTiles ? "On" : "Off"}`;
    _hud.devEditorShowTilesToggle.classList.toggle("is-on", Boolean(_state.devEditor.showTiles));
  }
  if (_hud.devEditorObjectFilter && _hud.devEditorObjectFilter.value !== (_state.devEditor.objectFilter || "")) {
    _hud.devEditorObjectFilter.value = _state.devEditor.objectFilter || "";
  }
  if (!open) return;
  if (_hud.devEditorSelectionSummary) {
    const currentRows = collectEditableObjects();
    const selected = currentRows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;
    _state.devEditor.rows = currentRows;

    if (!selected) {
      _state.devEditor.selectedObjectId = "";
      selectedMesh = null;
      selectionBaseline = null;
      attachTransformControls(null);
    }
    if (selected) {
      selectedMesh = selected.mesh;
      attachTransformControls(selectedMesh);
      const selectedAnnotation = annotationForEntity(selected);
      _hud.devEditorSelectionSummary.textContent =
        `${selected.displayName || selected.name} (${selected.id}) | ${selected.category} | ${selected.asset?.key || "asset-missing"} | ` +
        `x:${selected.transform.local.position[0].toFixed(2)} y:${selected.transform.local.position[1].toFixed(2)} z:${selected.transform.local.position[2].toFixed(2)} | ` +
        `rotY:${selected.transform.local.rotationY.toFixed(2)}rad | collision:${selected.collision.expected ? "yes" : "no"} | ` +
        `${annotationSummaryText(selectedAnnotation)} | ` +
        selectionDeltaSummary(selected);
    } else {
      _hud.devEditorSelectionSummary.textContent = "No object selected.";
    }
    syncAnnotationForm(selected);
    if (_hud.devEditorOpenLevelEditor) {
      _hud.devEditorOpenLevelEditor.disabled = !selected;
    }

    if (_hud.devEditorObjectList) {
      const signature = objectListCacheSignature(currentRows);
      if (signature === objectListSignature) return;
      objectListSignature = signature;
      _hud.devEditorObjectList.innerHTML = "";
      rowsForObjectList(currentRows).forEach((row) => {
        const annotation = annotationForEntity(row);
        const hasAnnotation = annotationHasContent(annotation);
        const item = document.createElement("button");
        item.type = "button";
        item.className = [
          "dev-editor-row",
          row.id === _state.devEditor.selectedObjectId ? "is-selected" : "",
          hasAnnotation ? "is-annotated" : "",
          annotation.flags.deleteCandidate ? "is-delete-candidate" : ""
        ].filter(Boolean).join(" ");
        item.dataset.devObjectId = row.id;
        item.innerHTML = `
          <span class="dev-editor-row-name">${row.displayName || row.name}</span>
          <span class="dev-editor-row-meta">
            <strong>ID:</strong> ${row.id}<br />
            <strong>Type:</strong> ${row.category}<br />
            <strong>Asset:</strong> ${row.asset?.key || "n/a"}<br />
            <strong>Collision:</strong> ${row.collision.expected ? "yes" : "no"}
          </span>
          ${annotationBadgesMarkup(annotation)}
        `;
        _hud.devEditorObjectList.appendChild(item);
      });
    }
  }
}

export function syncDevEditorSelectionToScene() {
  if (!_state.devEditor.open) return;
  const rows = collectEditableObjects();
  const selected = rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;

  if (!selected) {
    selectedMesh = null;
    attachTransformControls(null);
    if (selectionHelper) { _scene.remove(selectionHelper); selectionHelper = null; }
    return;
  }

  selectedMesh = selected.mesh;
  if (!selectedMesh) return;
  attachTransformControls(selectedMesh);
  if (selectionHelper?.parent !== _scene) {
    if (selectionHelper) _scene.remove(selectionHelper);
    selectionHelper = new THREE.BoxHelper(selectedMesh, SELECTION_BOUND_COLOR);
    selectionHelper.userData = { devEditorHelper: true, type: "selection", objectId: selected.id };
    markDevHelper(selectionHelper);
    _scene.add(selectionHelper);
  } else {
    selectionHelper.update();
    selectionHelper.material.color.setHex(SELECTION_BOUND_COLOR);
  }
  if (selectionHelper) selectionHelper.setFromObject(selectedMesh);
}

export function syncDevEditorColliderHelpers() {
  if (!_state.devEditor.open || !_state.devEditor.showColliders) {
    clearColliderHelpers();
    if (selectedMesh) syncDevEditorSelectionToScene();
    return;
  }

  _state.devEditor.rows = collectEditableObjects();
  const selected = findDevEntityById(_state.devEditor.rows, _state.devEditor.selectedObjectId);
  const selectedSignatures = selectedColliderSignatures(selected);
  const entries = typeof _getSceneColliderDebugEntries === "function" ? _getSceneColliderDebugEntries() : [];
  const nextSignature = [
    _state.scene.id,
    _state.devEditor.selectedObjectId,
    [...selectedSignatures].sort().join(","),
    entries.map((entry, index) => {
      const key = colliderKey(entry, index);
      const center = colliderCenter(entry);
      const size = colliderSize(entry);
      return `${key}:${entry?.active !== false}:${center.x},${center.y},${center.z}:${size.x},${size.y},${size.z}`;
    }).join("|")
  ].join("::");
  if (nextSignature === colliderSyncSignature && colliderHelpers.size > 0) {
    syncDevEditorSelectionToScene();
    return;
  }
  colliderSyncSignature = nextSignature;
  const want = new Set();
  entries.forEach((entry, index) => {
    const center = colliderCenter(entry);
    const size = colliderSize(entry);
    if (![center.x, center.y, center.z, size.x, size.y, size.z].every(Number.isFinite)) return;
    const key = colliderKey(entry, index);
    want.add(key);
    let helper = colliderHelpers.get(key);
    if (!helper) {
      helper = createActualColliderHelper(key);
      colliderHelpers.set(key, helper);
      _scene.add(helper);
    }
    updateActualColliderHelper(helper, entry, colliderIsSelected(entry, selectedSignatures));
  });

  colliderHelpers.forEach((helper, key) => {
    if (!want.has(key)) {
      _scene.remove(helper);
      helper.geometry?.dispose();
      helper.material?.dispose();
      colliderHelpers.delete(key);
      return;
    }
  });

  syncDevEditorSelectionToScene();
}

function syncColliderHelpers() {
  syncDevEditorColliderHelpers();
}

function moveSelected(axis, delta) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  const before = transformSnapshot(row);
  row.mesh.position[axis] += delta;
  if (_state.devEditor.snapToGrid) row.mesh.position[axis] = applyGridSnap(row.mesh.position[axis], _state.devEditor.nudgeStep);
  syncActorStateFromMesh(row.mesh);
  pushTransformUndo(row, before, `nudge:${axis}`);
  _state.devEditor.rows = collectEditableObjects({ force: true });
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

function rotateSelected(deltaRadians) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  const before = transformSnapshot(row);
  row.mesh.rotation.y = normalizeAngle(row.mesh.rotation.y + deltaRadians);
  syncActorStateFromMesh(row.mesh);
  pushTransformUndo(row, before, "rotate-y");
  _state.devEditor.rows = collectEditableObjects({ force: true });
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

function getPointerNdc(event) {
  const rect = _renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return pointerNdc;
}

function screenDistanceToEntity(entity, event) {
  if (!entity?.mesh) return Infinity;
  pickBox.setFromObject(entity.mesh);
  pickBox.getCenter(pickCenter);
  if (entity.category !== "terrain_tile" && Number.isFinite(pickBox.max.y)) {
    pickCenter.y = pickBox.max.y - Math.min(0.05, Math.max(0, pickBox.max.y - pickBox.min.y) * 0.15);
  }
  pickCenter.project(_camera);
  const rect = _renderer.domElement.getBoundingClientRect();
  const x = ((pickCenter.x + 1) / 2) * rect.width + rect.left;
  const y = ((1 - pickCenter.y) / 2) * rect.height + rect.top;
  return Math.hypot(x - event.clientX, y - event.clientY);
}

function nearestScreenEntity(rows, event, { excludeTiles = false, maxDistance = 28 } = {}) {
  const candidates = (rows || [])
    .filter((entity) => entity?.mesh && isVisibleInHierarchy(entity.mesh))
    .filter((entity) => !(excludeTiles && isTerrainTileEntity(entity)))
    .map((entity) => ({
      entity,
      screenDistance: screenDistanceToEntity(entity, event)
    }))
    .filter((candidate) => Number.isFinite(candidate.screenDistance) && candidate.screenDistance <= maxDistance)
    .sort((a, b) => a.screenDistance - b.screenDistance);
  return candidates[0] || null;
}

function resolveDevEntityHit(hits, rows, event) {
  const candidates = [];
  const seen = new Set();
  hits.forEach((hit) => {
    if (isDevHelper(hit.object) || !isVisibleInHierarchy(hit.object)) return;
    const entity = findDevEntityForObject(hit.object, rows);
    if (!entity || seen.has(entity.id)) return;
    seen.add(entity.id);
    candidates.push({
      entity,
      hitDistance: hit.distance,
      screenDistance: screenDistanceToEntity(entity, event)
    });
  });
  candidates.sort((a, b) => a.screenDistance - b.screenDistance || a.hitDistance - b.hitDistance);
  const best = candidates[0] || null;
  const nearestNonTile = nearestScreenEntity(rows, event, { excludeTiles: true, maxDistance: 30 });
  if (nearestNonTile && (!best || best.entity.category === "terrain_tile" || nearestNonTile.screenDistance + 4 < best.screenDistance)) {
    return nearestNonTile.entity;
  }
  return best?.entity || null;
}

export function handleDevEditorPointerDown(event) {
  if (!_state?.devEditor?.open || !_renderer?.domElement || !_camera) return false;
  if (event.target !== _renderer.domElement) return false;

  const pointer = getPointerNdc(event);
  raycaster.setFromCamera(pointer, _camera);

  if (_state.devEditor.transformDragging) {
    event.preventDefault();
    return true;
  }
  if (transformHelper?.visible && hitsActiveTransformPicker()) return true;

  const rows = collectEditableObjects();
  const roots = rows.map((row) => row.mesh).filter((mesh) => mesh && isVisibleInHierarchy(mesh));
  const hits = raycaster.intersectObjects(roots, true);
  const entity = resolveDevEntityHit(hits, rows, event);
  if (!entity) {
    event.preventDefault();
    return true;
  }

  event.preventDefault();
  selectById(entity.id);
  _onShowPrompt(`Selected ${entity.displayName || entity.name}.`, 1);
  return true;
}

export function handleDevEditorKeyDown(event) {
  if (event.code === "Escape") { event.preventDefault(); setDevEditorOpen(false); return true; }
  if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.code === "KeyZ" && !isTextEditingTarget(event.target)) {
    event.preventDefault();
    undoLastTransform();
    return true;
  }

  const move = (() => {
    if (event.code === "ArrowLeft" || event.code === "KeyJ") return { axis: "x", sign: -1 };
    if (event.code === "ArrowRight" || event.code === "KeyL") return { axis: "x", sign: 1 };
    if (event.code === "ArrowUp" || event.code === "KeyI") return { axis: "z", sign: -1 };
    if (event.code === "ArrowDown" || event.code === "KeyK") return { axis: "z", sign: 1 };
    return null;
  })();
  if (!move) return false;
  event.preventDefault();
  if (!event.repeat) moveSelected(move.axis, move.sign * _state.devEditor.nudgeStep);
  return true;
}
