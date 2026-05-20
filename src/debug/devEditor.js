import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { SCENES } from "../config/scenes.js";
import {
  collectDevEntities,
  entityDistance2D,
  findDevEntityById,
  findDevEntityForObject,
  normalizeDevEntity
} from "./devEntityRegistry.js";

const DEG_15 = Math.PI / 12;
const COLLISION_COLORS = { default: 0x34a4c4, selected: 0x55ff99 };
const SCALE_SNAP = 0.05;
const NEARBY_ENTITY_LIMIT = 10;
const NEARBY_ENTITY_RADIUS = 8;

const colliderHelpers = new Map();
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

let selectedMesh = null;
let selectionHelper = null;
let transformControls = null;
let transformHelper = null;
let selectionBaseline = null;

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

function collectEditableObjects() {
  return collectDevEntities({
    state: _state,
    getSceneMeshes: _getSceneMeshes,
    getSceneColliderDebugEntries: _getSceneColliderDebugEntries
  });
}

function currentTransformMode() {
  return _state.devEditor.transformMode || "translate";
}

function transformSnapshot(entity) {
  if (!entity) return null;
  return {
    entityId: entity.id,
    sourceFileHint: entity.sourceFileHint || entity.notes?.sourceFileHint || "",
    local: {
      position: entity.transform.local.position,
      rotationEuler: entity.transform.local.rotationEuler,
      rotationY: entity.transform.local.rotationY,
      scale: entity.transform.local.scale
    }
  };
}

function serializableEntities(rows) {
  return rows.map((entity) => normalizeDevEntity(entity));
}

function writeClipboardOrConsole(payload, successMessage, blockedMessage) {
  const json = JSON.stringify(payload, null, 2);
  console.log(json);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(json)
      .then(() => { _onShowPrompt(successMessage, 1.4); })
      .catch(() => { _onShowPrompt(blockedMessage, 1.5); });
    return json;
  }
  _onShowPrompt("Clipboard unavailable. JSON logged in console.", 1.5);
  return json;
}

function getSelectedRow() {
  return _state.devEditor.rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;
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

function setupTransformControls() {
  if (transformControls || !_camera || !_renderer?.domElement) return;
  transformControls = new TransformControls(_camera, _renderer.domElement);
  transformControls.setSize(0.72);
  transformControls.addEventListener("objectChange", handleTransformObjectChange);
  transformControls.addEventListener("dragging-changed", (event) => {
    _state.devEditor.transformDragging = Boolean(event.value);
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
  _state.devEditor.rows = collectEditableObjects();
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
  _onShowPrompt = onShowPrompt;
  _state.devEditor.transformMode = _state.devEditor.transformMode || "translate";

  setupTransformControls();
  hud.devEditorToggle?.addEventListener("click", toggleDevEditorPanel);
  hud.devEditorSnapToggle?.addEventListener("click", toggleDevEditorSnap);
  hud.devEditorColliderToggle?.addEventListener("click", toggleDevEditorColliders);
  hud.devEditorExportLayout?.addEventListener("click", handleExportClick);
  hud.devEditorCopyAiContext?.addEventListener("click", handleCopyAiContext);
  hud.devEditorExportPatchDraft?.addEventListener("click", handleExportPatchDraft);
  hud.devEditorPanel?.addEventListener("click", handlePanelClick);
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
  if (!_state.devEditor.open) {
    _state.devEditor.selectedObjectId = "";
    selectedMesh = null;
    selectionBaseline = null;
    if (selectionHelper) {
      _scene.remove(selectionHelper);
      selectionHelper.geometry?.dispose();
      selectionHelper.material?.dispose();
      selectionHelper = null;
    }
    detachTransformControls();
    clearColliderHelpers();
  } else {
    _state.devEditor.rows = collectEditableObjects();
    syncColliderHelpers();
    attachTransformControls(selectedMesh);
  }
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

function handleExportClick() {
  const rows = collectEditableObjects();
  const snapshot = {
    levelId: _state.scene.id,
    objects: rows.map((row) => ({
      objectId: row.id,
      objectName: row.name,
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
      sourceFileHint: row.sourceFileHint
    }))
  };
  writeClipboardOrConsole(snapshot, "Dev layout copied to clipboard.", "Copy blocked. Layout logged in console.");
}

function cameraSnapshot() {
  if (!_camera) return null;
  return {
    position: [_camera.position.x, _camera.position.y, _camera.position.z].map((value) => round(value)),
    quaternion: [_camera.quaternion.x, _camera.quaternion.y, _camera.quaternion.z, _camera.quaternion.w].map((value) => round(value, 4)),
    zoom: round(_camera.zoom)
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
  const rows = collectEditableObjects();
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  const runtimeSnapshot = typeof _getRuntimeSnapshot === "function" ? _getRuntimeSnapshot() : null;
  return {
    schema: "lumina.dev.aiContext.v1",
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
    selection: selected ? normalizeDevEntity(selected) : null,
    nearbyEntities: getNearbyEntities(rows, selected),
    entities: {
      count: rows.length,
      ids: rows.map((entity) => entity.id)
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

function valuesDiffer(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function buildPatchChanges(selected) {
  if (!selected) return [];
  const sourceFileHint = selected.sourceFileHint || selected.notes?.sourceFileHint || "";
  const oldLocal = selectionBaseline?.entityId === selected.id ? selectionBaseline.local : selected.transform.local;
  const newLocal = selected.transform.local;
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
  const rows = collectEditableObjects();
  const selected = findDevEntityById(rows, _state.devEditor.selectedObjectId);
  return {
    schema: "lumina.dev.scenePatch.v1",
    patchId: `scene-patch-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    sceneId: _state.scene.id,
    issueType: "",
    selectedEntityId: selected?.id || "",
    changes: buildPatchChanges(selected),
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

function selectById(objectId) {
  _state.devEditor.selectedObjectId = objectId || "";
  _state.devEditor.rows = collectEditableObjects();
  const selected = getSelectedRow();
  selectionBaseline = transformSnapshot(selected);
  syncDevEditorSelectionToScene();
  updateDevEditorPanel();
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
    if (targetScene === SCENES.TUTORIAL) _sceneNav.tutorial();
    if (targetScene === SCENES.HOME) _sceneNav.home();
    if (targetScene === SCENES.LEVEL_ONE) _sceneNav.levelOne();
    if (targetScene === SCENES.LEVEL_TWO) _sceneNav.levelTwo();
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

export function updateDevEditorPanel() {
  if (!_hud || !_hud.devEditorPanel || !_hud.devEditorToggle) return;
  const open = _state.devEditor.open;
  _hud.devEditorPanel.hidden = !open;
  _hud.devEditorPanel.classList.toggle("is-open", open);
  _hud.devEditorToggle.classList.toggle("is-open", open);
  _hud.devEditorToggle.setAttribute("aria-expanded", open ? "true" : "false");

  if (_hud.devEditorSnapToggle) {
    _hud.devEditorSnapToggle.textContent = _state.devEditor.snapToGrid ? "Snap Grid: On" : "Snap Grid: Off";
    _hud.devEditorSnapToggle.classList.toggle("is-on", _state.devEditor.snapToGrid);
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
      _hud.devEditorSelectionSummary.textContent =
        `${selected.name} (${selected.id}) | ${selected.category} | ${selected.asset?.key || "asset-missing"} | ` +
        `x:${selected.transform.local.position[0].toFixed(2)} y:${selected.transform.local.position[1].toFixed(2)} z:${selected.transform.local.position[2].toFixed(2)} | ` +
        `rotY:${selected.transform.local.rotationY.toFixed(2)}rad | collision:${selected.collision.expected ? "yes" : "no"}`;
    } else {
      _hud.devEditorSelectionSummary.textContent = "No object selected.";
    }

    if (_hud.devEditorObjectList) {
      _hud.devEditorObjectList.innerHTML = "";
      currentRows.forEach((row) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `dev-editor-row${row.id === _state.devEditor.selectedObjectId ? " is-selected" : ""}`;
        item.dataset.devObjectId = row.id;
        item.innerHTML = `
          <span class="dev-editor-row-name">${row.name}</span>
          <span class="dev-editor-row-meta">
            <strong>ID:</strong> ${row.id}<br />
            <strong>Type:</strong> ${row.category}<br />
            <strong>Asset:</strong> ${row.asset?.key || "n/a"}<br />
            <strong>Pos:</strong> (${row.transform.local.position[0].toFixed(2)}, ${row.transform.local.position[1].toFixed(2)}, ${row.transform.local.position[2].toFixed(2)}) |
            <strong>rotY:</strong> ${row.transform.local.rotationY.toFixed(2)}rad |
            <strong>Collision:</strong> ${row.collision.expected ? "yes" : "no"}
          </span>
        `;
        _hud.devEditorObjectList.appendChild(item);
      });
    }
  }
}

export function syncDevEditorSelectionToScene() {
  if (!_state.devEditor.open) return;
  if (_state.devEditor.rows.length === 0) _state.devEditor.rows = collectEditableObjects();
  const selected = _state.devEditor.rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;

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
    selectionHelper = new THREE.BoxHelper(selectedMesh, COLLISION_COLORS.selected);
    selectionHelper.userData = { devEditorHelper: true, type: "selection", objectId: selected.id };
    markDevHelper(selectionHelper);
    _scene.add(selectionHelper);
  } else {
    selectionHelper.update();
    selectionHelper.material.color.setHex(COLLISION_COLORS.selected);
  }
  if (selectionHelper) selectionHelper.setFromObject(selectedMesh);
}

export function syncDevEditorColliderHelpers() {
  if (!_state.devEditor.open || !_state.devEditor.showColliders) {
    clearColliderHelpers();
    if (selectedMesh) syncDevEditorSelectionToScene();
    return;
  }

  if (_state.devEditor.rows.length === 0) _state.devEditor.rows = collectEditableObjects();
  const want = new Set();
  _state.devEditor.rows.forEach((row) => {
    if (!row.mesh || !row.collision.expected) return;
    want.add(row.id);
    const existing = colliderHelpers.get(row.mesh);
    const helper = existing || new THREE.BoxHelper(row.mesh, COLLISION_COLORS.default);
    helper.userData = { devEditorHelper: true, type: "collider", objectId: row.id };
    markDevHelper(helper);
    helper.material.color.setHex(row.mesh === selectedMesh ? COLLISION_COLORS.selected : COLLISION_COLORS.default);
    helper.setFromObject(row.mesh);
    helper.visible = true;
    if (!existing) { colliderHelpers.set(row.mesh, helper); _scene.add(helper); }
  });

  colliderHelpers.forEach((helper, mesh) => {
    const row = _state.devEditor.rows.find((c) => c.mesh === mesh);
    if (!row || !row.collision.expected || !want.has(row.id)) {
      _scene.remove(helper);
      helper.geometry?.dispose();
      helper.material?.dispose();
      colliderHelpers.delete(mesh);
      return;
    }
    helper.material.color.setHex(row.mesh === selectedMesh ? COLLISION_COLORS.selected : COLLISION_COLORS.default);
  });

  syncDevEditorSelectionToScene();
}

function syncColliderHelpers() {
  syncDevEditorColliderHelpers();
}

function moveSelected(axis, delta) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  row.mesh.position[axis] += delta;
  if (_state.devEditor.snapToGrid) row.mesh.position[axis] = applyGridSnap(row.mesh.position[axis], _state.devEditor.nudgeStep);
  syncActorStateFromMesh(row.mesh);
  _state.devEditor.rows = collectEditableObjects();
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

function rotateSelected(deltaRadians) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  row.mesh.rotation.y = normalizeAngle(row.mesh.rotation.y + deltaRadians);
  syncActorStateFromMesh(row.mesh);
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

export function handleDevEditorPointerDown(event) {
  if (!_state?.devEditor?.open || !_renderer?.domElement || !_camera) return false;
  if (event.target !== _renderer.domElement) return false;

  const pointer = getPointerNdc(event);
  raycaster.setFromCamera(pointer, _camera);

  if (transformHelper?.visible) {
    const helperHits = raycaster.intersectObject(transformHelper, true);
    if (helperHits.length > 0) {
      event.preventDefault();
      return true;
    }
  }

  const rows = collectEditableObjects();
  const roots = rows.map((row) => row.mesh).filter(Boolean);
  const hits = raycaster.intersectObjects(roots, true);
  const hit = hits.find((candidate) => !isDevHelper(candidate.object));
  const entity = hit ? findDevEntityForObject(hit.object, rows) : null;
  if (!entity) return false;

  event.preventDefault();
  selectById(entity.id);
  _onShowPrompt(`Selected ${entity.name}.`, 1);
  return true;
}

export function handleDevEditorKeyDown(event) {
  if (event.code === "Escape") { event.preventDefault(); setDevEditorOpen(false); return true; }
  if (event.code === "KeyQ") { event.preventDefault(); if (!event.repeat) rotateSelected(-DEG_15 * 6); return true; }
  if (event.code === "KeyE") { event.preventDefault(); if (!event.repeat) rotateSelected(DEG_15 * 6); return true; }

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
