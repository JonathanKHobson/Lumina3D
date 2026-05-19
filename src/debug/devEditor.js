import * as THREE from "three";
import { SCENES } from "../config/scenes.js";

const DEG_15 = Math.PI / 12;
const COLLISION_COLORS = { default: 0x34a4c4, selected: 0x55ff99 };
const colliderHelpers = new Map();
let selectedMesh = null;
let selectionHelper = null;

// Set by initDevEditor — holds all external references
let _state, _scene, _hud, _getSceneMeshes, _sceneNav, _onUpdateHud, _onShowPrompt;

function normalizeAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function directionName(vector) {
  if (Math.abs(vector.x) > Math.abs(vector.z)) {
    return vector.x > 0 ? { x: 1, z: 0, name: "east" } : { x: -1, z: 0, name: "west" };
  }
  return vector.z > 0 ? { x: 0, z: 1, name: "south" } : { x: 0, z: -1, name: "north" };
}

function applyGridSnap(value, step) {
  if (!_state.devEditor.snapToGrid) return Number(value.toFixed(4));
  return Number((Math.round(value / step) * step).toFixed(4));
}

export function initDevEditor({ state, scene, hud, getSceneMeshes, sceneNav, onUpdateHud, onShowPrompt }) {
  _state = state;
  _scene = scene;
  _hud = hud;
  _getSceneMeshes = getSceneMeshes;
  _sceneNav = sceneNav;
  _onUpdateHud = onUpdateHud;
  _onShowPrompt = onShowPrompt;

  hud.devEditorToggle?.addEventListener("click", toggleDevEditorPanel);
  hud.devEditorSnapToggle?.addEventListener("click", toggleDevEditorSnap);
  hud.devEditorColliderToggle?.addEventListener("click", toggleDevEditorColliders);
  hud.devEditorExportLayout?.addEventListener("click", handleExportClick);
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
    if (selectionHelper) {
      _scene.remove(selectionHelper);
      selectionHelper.geometry?.dispose();
      selectionHelper.material?.dispose();
      selectionHelper = null;
    }
    clearColliderHelpers();
  } else {
    _state.devEditor.rows = collectEditableObjects();
    syncColliderHelpers();
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
      asset: row.asset,
      position: row.position,
      rotationY: row.rotationY,
      scale: row.scale,
      collisionExpected: row.collisionExpected
    }))
  };
  const compactJson = JSON.stringify(snapshot);
  console.log(compactJson);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(compactJson)
      .then(() => { _onShowPrompt("Dev layout copied to clipboard.", 1.4); })
      .catch(() => { _onShowPrompt("Copy blocked. Layout in console.", 1.5); });
    return;
  }
  _onShowPrompt("Clipboard unavailable. Layout in console.", 1.5);
}

function selectById(objectId) {
  _state.devEditor.selectedObjectId = objectId || "";
  syncSelectionToScene();
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
      updateDevEditorPanel();
    }
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
  }
  if (_hud.devEditorColliderToggle) {
    _hud.devEditorColliderToggle.textContent = `Colliders: ${_state.devEditor.showColliders ? "On" : "Off"}`;
    _hud.devEditorColliderToggle.classList.toggle("is-on", _state.devEditor.showColliders);
  }
  if (_hud.devEditorSelectionSummary) {
    const currentRows = collectEditableObjects();
    const selected = currentRows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;
    _state.devEditor.rows = currentRows;

    if (!selected) { _state.devEditor.selectedObjectId = ""; selectedMesh = null; }
    if (selected) {
      selectedMesh = selected.mesh;
      _hud.devEditorSelectionSummary.textContent =
        `${selected.name} (${selected.id}) • ${selected.category} • ${selected.asset || "asset-missing"} • ` +
        `x:${selected.position.x.toFixed(2)} y:${selected.position.y.toFixed(2)} z:${selected.position.z.toFixed(2)} • ` +
        `rotY:${selected.rotationY.toFixed(2)}rad • collision:${selected.collisionExpected ? "yes" : "no"}`;
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
            <strong>Asset:</strong> ${row.asset || "n/a"}<br />
            <strong>Pos:</strong> (${row.position.x.toFixed(2)}, ${row.position.y.toFixed(2)}, ${row.position.z.toFixed(2)}) •
            <strong>rotY:</strong> ${row.rotationY.toFixed(2)}rad •
            <strong>Collision:</strong> ${row.collisionExpected ? "yes" : "no"}
          </span>
        `;
        _hud.devEditorObjectList.appendChild(item);
      });
    }
  }
}

function inferAsset(mesh, scenePrefix) {
  return mesh.userData.devEditorAsset ||
    mesh.userData.homeAsset ||
    mesh.userData.levelOneAsset ||
    mesh.userData.levelTwoAsset ||
    mesh.userData.levelTwoTier ||
    mesh.userData.levelTwoZone ||
    (typeof mesh.userData[`${scenePrefix}Asset`] === "string" ? mesh.userData[`${scenePrefix}Asset`] : "");
}

function inferCategory(mesh, asset) {
  if (mesh.userData.devEditorCategory) return mesh.userData.devEditorCategory;
  if (mesh.userData.homeAsset?.startsWith("home") || /house|home/i.test(asset)) return "house";
  if (/button/i.test(asset)) return "button";
  if (asset?.includes("bridge")) return "bridge";
  if (/tree/i.test(asset)) return "tree";
  if (/rock/i.test(asset)) return "rock";
  if (/bush/i.test(asset)) return "bush";
  if (/love|spellbook/i.test(asset)) return "love_letter";
  return "prop";
}

function inferCollisionExpected(mesh, category, asset) {
  if (mesh.userData.devEditorCollisionExpected !== undefined) return Boolean(mesh.userData.devEditorCollisionExpected);
  if (category === "button" || category === "bridge" || category === "house" || category === "tree" || category === "rock" || category === "bush" || /love|spellbook/i.test(asset || "")) return true;
  if (/human|frog/.test(category)) return true;
  return false;
}

function collectEditableObjects() {
  const sceneId = _state.scene.id;
  const scenePrefix = sceneId === SCENES.HOME ? "home" : sceneId === SCENES.LEVEL_ONE ? "levelOne" : sceneId === SCENES.LEVEL_TWO ? "levelTwo" : "tutorial";
  const seen = new Set();
  const counters = {};
  const rows = [];

  const makeId = (category, mesh) => {
    const existing = mesh.userData.devEditorId;
    if (existing && !seen.has(`id:${existing}`)) { seen.add(`id:${existing}`); return existing; }
    const base = `${sceneId}-${category}`;
    counters[base] = (counters[base] || 0) + 1;
    const next = `${base}-${counters[base]}`;
    if (seen.has(`id:${next}`)) return `${next}-${mesh.uuid}`;
    seen.add(`id:${next}`);
    return next;
  };

  const push = (mesh, category, fallbackName, asset, collisionExpected) => {
    if (!mesh) return;
    if (mesh.userData.homeTile || mesh.userData.levelOneTile || mesh.userData.levelTwoTile || mesh.userData.levelOneWater) return;
    const resolvedCategory = category || inferCategory(mesh, asset);
    const objectId = makeId(resolvedCategory, mesh);
    rows.push({
      id: objectId,
      mesh,
      name: fallbackName || mesh.name || objectId,
      category: resolvedCategory,
      asset,
      collisionExpected: collisionExpected === undefined
        ? inferCollisionExpected(mesh, resolvedCategory, asset)
        : Boolean(collisionExpected),
      position: { x: Number(mesh.position.x.toFixed(2)), y: Number(mesh.position.y.toFixed(2)), z: Number(mesh.position.z.toFixed(2)) },
      rotationY: Number(normalizeAngle(mesh.rotation.y).toFixed(2)),
      scale: { x: Number(mesh.scale.x.toFixed(2)), y: Number(mesh.scale.y.toFixed(2)), z: Number(mesh.scale.z.toFixed(2)) }
    });
    seen.add(`mesh:${mesh.uuid}`);
    if (!mesh.userData.devEditorId) mesh.userData.devEditorId = objectId;
  };

  const { actorMeshes: actors, markers, arrays } = _getSceneMeshes();

  if (actors?.human) push(actors.human, "character", "Human Character", inferAsset(actors.human, scenePrefix), true);
  if (actors?.frog) push(actors.frog, "frog", "Frog Cubeling", inferAsset(actors.frog, scenePrefix), true);
  markers?.forEach((mesh) => {
    if (!mesh) return;
    const asset = inferAsset(mesh, scenePrefix);
    const cat = inferCategory(mesh, asset);
    push(mesh, cat, mesh.userData.devEditorName || mesh.name || cat, asset, inferCollisionExpected(mesh, cat, asset));
  });
  arrays.forEach((collection) => {
    collection.forEach((mesh) => {
      const asset = inferAsset(mesh, scenePrefix);
      if (!asset && !mesh.userData.devEditorCategory) return;
      const cat = inferCategory(mesh, asset || mesh.userData.devEditorCategory || "prop");
      push(mesh, cat, mesh.name || cat, asset || cat);
    });
  });

  return rows;
}

export function syncDevEditorSelectionToScene() {
  if (!_state.devEditor.open) return;
  if (_state.devEditor.rows.length === 0) _state.devEditor.rows = collectEditableObjects();
  const selected = _state.devEditor.rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;

  if (!selected) {
    selectedMesh = null;
    if (selectionHelper) { _scene.remove(selectionHelper); selectionHelper = null; }
    return;
  }

  selectedMesh = selected.mesh;
  if (!selectedMesh) return;
  if (selectionHelper?.parent !== _scene) {
    if (selectionHelper) _scene.remove(selectionHelper);
    selectionHelper = new THREE.BoxHelper(selectedMesh, COLLISION_COLORS.selected);
    selectionHelper.userData = { type: "selection", objectId: selected.id };
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
    if (!row.mesh || !row.collisionExpected) return;
    want.add(row.id);
    const existing = colliderHelpers.get(row.mesh);
    const helper = existing || new THREE.BoxHelper(row.mesh, COLLISION_COLORS.default);
    helper.material.color.setHex(row.mesh === selectedMesh ? COLLISION_COLORS.selected : COLLISION_COLORS.default);
    helper.setFromObject(row.mesh);
    helper.visible = true;
    if (!existing) { colliderHelpers.set(row.mesh, helper); _scene.add(helper); }
  });

  colliderHelpers.forEach((helper, mesh) => {
    if (!helper.userData) helper.userData = {};
    const row = _state.devEditor.rows.find((c) => c.mesh === mesh);
    if (!row || !row.collisionExpected || !want.has(row.id)) {
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

function getSelectedRow() {
  return _state.devEditor.rows.find((r) => r.id === _state.devEditor.selectedObjectId) || null;
}

function moveSelected(axis, delta) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  row.mesh.position[axis] += delta;
  if (_state.devEditor.snapToGrid) row.mesh.position[axis] = applyGridSnap(row.mesh.position[axis], _state.devEditor.nudgeStep);
  const { actorMeshes } = _getSceneMeshes();
  if (row.mesh === actorMeshes?.human) {
    if (axis === "x") _state.human.x = row.mesh.position.x;
    if (axis === "z") _state.human.z = row.mesh.position.z;
  }
  if (row.mesh === actorMeshes?.frog) {
    if (axis === "x") _state.frog.x = row.mesh.position.x;
    if (axis === "z") _state.frog.z = row.mesh.position.z;
  }
  _state.devEditor.rows = collectEditableObjects();
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
}

function rotateSelected(deltaRadians) {
  const row = getSelectedRow();
  if (!row || !row.mesh) return;
  row.mesh.rotation.y = normalizeAngle(row.mesh.rotation.y + deltaRadians);
  const { actorMeshes } = _getSceneMeshes();
  if (row.mesh === actorMeshes?.human) _state.human.facing = directionName({ x: Math.sin(row.mesh.rotation.y), z: Math.cos(row.mesh.rotation.y) });
  if (row.mesh === actorMeshes?.frog) _state.frog.facing = directionName({ x: Math.sin(row.mesh.rotation.y), z: Math.cos(row.mesh.rotation.y) });
  syncDevEditorSelectionToScene();
  syncDevEditorColliderHelpers();
  updateDevEditorPanel();
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
