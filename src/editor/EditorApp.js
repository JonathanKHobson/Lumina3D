import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import { ASSETS } from "../config/assets.js";
import { cloneLoadedAsset, loadAssetRegistry, placeLoadedAsset } from "../core/assetLoader.js";
import { createGameRenderer, setupSceneLights } from "../core/renderer.js";
import {
  buildEditorPatch,
  dirtyRecords,
  snapshotTransform,
  summarizeEditorPatch
} from "./EditorPatchExporter.js";
import {
  buildEditorStateExport,
  loadEditorObjectMeta,
  normalizeObjectMeta,
  saveEditorObjectMeta,
  summarizeEditorStateExport
} from "./EditorStateExporter.js";
import { EditorCameraController } from "./EditorCameraController.js";
import { buildLevelTwoEditorScene } from "./levelTwoAdapter.js";

const VIEW_HEIGHT = 42;
const CAMERA_OFFSET = new THREE.Vector3(28, 30, 28);
const TRANSLATE_SNAP = 0.25;
const ROTATION_SNAP = Math.PI / 12;
const NOTE_CHIPS = [
  "@move",
  "@rotate",
  "@fade",
  "@appear",
  "@disappear",
  "@spawn",
  "@trigger",
  "@button",
  "@platform",
  "@loop"
];

export class EditorApp {
  constructor({ root, canvas }) {
    this.root = root;
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-20, 20, 14, -14, 0.1, 240);
    this.cameraController = null;
    this.renderer = null;
    this.assetCache = new Map();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.level = null;
    this.records = [];
    this.objectMeta = {};
    this.selectedId = "";
    this.outputMode = "patch";
    this.transformControls = null;
    this.transformHelper = null;
    this.selectionBox = null;
    this.axesHelper = null;
    this.isDraggingTransform = false;
    this.cameraNavigationTimer = 0;
    this.isReady = false;
    this.status = "Loading";
    this.dom = {};
  }

  async init() {
    if (!this.root || !this.canvas) return;
    this.cacheDom();
    this.renderer = createGameRenderer(this.canvas);
    this.scene.background = new THREE.Color(0x1b2320);
    setupSceneLights(this.scene);
    this.setupCamera(new THREE.Vector3(0, 0, 0));
    this.setupHelpers();
    this.setupTransformControls();
    this.bindEvents();
    this.resize();

    try {
      await loadAssetRegistry({
        assets: ASSETS,
        scene: this.scene,
        assetCache: this.assetCache
      });
      this.loadLevel("level_two");
      this.isReady = true;
      this.setStatus("Ready");
    } catch (error) {
      console.error(error);
      this.setStatus("Load failed");
      this.dom.patchOutput.value = String(error);
    }

    window.render_editor_to_text = () => JSON.stringify(this.renderEditorToText());
    window.__luminaEditorApp = this;
    this.updateUi();
    this.renderer.setAnimationLoop(() => this.render());
  }

  cacheDom() {
    this.dom = {
      levelSelect: this.root.querySelector("#levelSelect"),
      editorStatus: this.root.querySelector("#editorStatus"),
      objectCount: this.root.querySelector("#objectCount"),
      objectList: this.root.querySelector("#objectList"),
      dirtyCount: this.root.querySelector("#dirtyCount"),
      playInGame: this.root.querySelector("#playInGame"),
      translateMode: this.root.querySelector("#translateMode"),
      rotateMode: this.root.querySelector("#rotateMode"),
      frameSelected: this.root.querySelector("#frameSelected"),
      zoomOutCamera: this.root.querySelector("#zoomOutCamera"),
      zoomInCamera: this.root.querySelector("#zoomInCamera"),
      pitchDownCamera: this.root.querySelector("#pitchDownCamera"),
      pitchUpCamera: this.root.querySelector("#pitchUpCamera"),
      resetCamera: this.root.querySelector("#resetCamera"),
      cameraReadout: this.root.querySelector("#cameraReadout"),
      snapToggle: this.root.querySelector("#snapToggle"),
      resetSelected: this.root.querySelector("#resetSelected"),
      markDelete: this.root.querySelector("#markDelete"),
      objectNote: this.root.querySelector("#objectNote"),
      noteChipRow: this.root.querySelector("#noteChipRow"),
      selectionSummary: this.root.querySelector("#selectionSummary"),
      transformReadout: this.root.querySelector("#transformReadout"),
      patchOutput: this.root.querySelector("#patchOutput"),
      copyPatch: this.root.querySelector("#copyPatch"),
      copyState: this.root.querySelector("#copyState"),
      viewportBadge: this.root.querySelector("#viewportBadge"),
      toast: this.root.querySelector("#editorToast")
    };
  }

  setupCamera(target) {
    if (!this.cameraController) {
      this.cameraController = new EditorCameraController({
        camera: this.camera,
        offset: CAMERA_OFFSET,
        target
      });
      return;
    }
    this.cameraController.frameTarget(target);
  }

  setupHelpers() {
    const grid = new THREE.GridHelper(46, 46, 0xa8b7a6, 0x43514b);
    grid.name = "Editor Grid";
    grid.position.y = 0.015;
    this.scene.add(grid);
  }

  setupTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.setMode("translate");
    this.transformControls.setTranslationSnap(TRANSLATE_SNAP);
    this.transformControls.setRotationSnap(ROTATION_SNAP);
    this.transformControls.addEventListener("dragging-changed", (event) => {
      this.isDraggingTransform = event.value;
      this.updateUi();
    });
    this.transformControls.addEventListener("objectChange", () => {
      this.updateSelectionHelpers();
      this.updateUi();
    });
    this.transformHelper = this.transformControls.getHelper();
    this.scene.add(this.transformHelper);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    this.canvas.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.canvas.addEventListener("wheel", (event) => this.handleWheel(event), { passive: false });
    this.dom.objectList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-editor-object-id]");
      if (!row) return;
      this.selectObject(row.dataset.editorObjectId);
    });
    this.dom.translateMode.addEventListener("click", () => this.setTransformMode("translate"));
    this.dom.rotateMode.addEventListener("click", () => this.setTransformMode("rotate"));
    this.dom.frameSelected.addEventListener("click", () => this.frameSelected());
    this.dom.zoomOutCamera.addEventListener("click", () => this.zoomCamera("out"));
    this.dom.zoomInCamera.addEventListener("click", () => this.zoomCamera("in"));
    this.dom.pitchDownCamera.addEventListener("click", () => this.tiltCamera("down"));
    this.dom.pitchUpCamera.addEventListener("click", () => this.tiltCamera("up"));
    this.dom.resetCamera.addEventListener("click", () => this.resetCamera());
    this.dom.snapToggle.addEventListener("change", () => this.updateSnap());
    this.dom.resetSelected.addEventListener("click", () => this.resetSelectedObject());
    this.dom.markDelete.addEventListener("click", () => this.toggleDeleteMark());
    this.dom.objectNote.addEventListener("input", () => this.updateSelectedNote(this.dom.objectNote.value));
    this.dom.noteChipRow.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-note-chip]");
      if (!chip) return;
      this.insertNoteChip(chip.dataset.noteChip);
    });
    this.dom.copyPatch.addEventListener("click", () => this.copyPatch());
    this.dom.copyState.addEventListener("click", () => this.copyEditorState());
    this.dom.playInGame.addEventListener("click", () => this.playInGame());
    this.dom.levelSelect.addEventListener("change", () => this.loadLevel(this.dom.levelSelect.value));
  }

  loadLevel(levelId) {
    this.clearSelection();
    if (this.level?.group) this.scene.remove(this.level.group);

    if (levelId !== "level_two") {
      this.setStatus("Unsupported level");
      return;
    }

    this.level = buildLevelTwoEditorScene({
      cloneAsset: (key) => cloneLoadedAsset(this.assetCache, key),
      placeAsset: (group, key, point, options) => placeLoadedAsset(this.assetCache, group, key, point, options)
    });
    this.scene.add(this.level.group);
    this.records = this.level.editableObjects;
    this.objectMeta = loadEditorObjectMeta(levelId);
    this.dom.viewportBadge.textContent = this.level.name;
    this.selectObject("level_two.blue_ramp");
    this.setStatus("Ready");
    this.updateUi();
  }

  resize() {
    if (!this.renderer) return;
    const frame = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, Math.floor(frame.width));
    const height = Math.max(240, Math.floor(frame.height));
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.left = -VIEW_HEIGHT * aspect * 0.5;
    this.camera.right = VIEW_HEIGHT * aspect * 0.5;
    this.camera.top = VIEW_HEIGHT * 0.5;
    this.camera.bottom = -VIEW_HEIGHT * 0.5;
    if (this.cameraController) {
      this.cameraController.apply();
    } else {
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  handlePointerDown(event) {
    if (!this.isReady || this.isDraggingTransform || event.button !== 0) return;
    this.canvas.focus({ preventScroll: true });
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const roots = this.records.map((record) => record.object);
    const hit = this.raycaster.intersectObjects(roots, true)
      .map((intersection) => this.findEditorRoot(intersection.object))
      .find(Boolean);
    if (hit) this.selectObject(hit.userData.editorId);
  }

  handleWheel(event) {
    if (!this.isReady || this.isDraggingTransform || !this.cameraController) return;
    event.preventDefault();
    this.cameraController.wheelZoom(event.deltaY);
    this.markCameraNavigating();
    this.updateUi();
  }

  handleKeyDown(event) {
    const tag = event.target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;
    const handled = this.handleCameraKeyDown(event) || this.handleTransformKeyDown(event);
    if (handled) event.preventDefault();
  }

  handleCameraKeyDown(event) {
    if (!this.isReady || this.isDraggingTransform || !this.cameraController) return false;
    const multiplier = event.shiftKey ? 2.5 : 1;
    const keyMap = {
      KeyW: () => this.cameraController.pan({ forward: 1, multiplier }),
      KeyS: () => this.cameraController.pan({ forward: -1, multiplier }),
      KeyA: () => this.cameraController.pan({ right: -1, multiplier }),
      KeyD: () => this.cameraController.pan({ right: 1, multiplier }),
      KeyQ: () => this.cameraController.rotateYaw(-1, multiplier),
      KeyE: () => this.cameraController.rotateYaw(1, multiplier),
      BracketLeft: () => this.cameraController.tiltPitch(-1, multiplier),
      BracketRight: () => this.cameraController.tiltPitch(1, multiplier),
      Equal: () => this.cameraController.zoomIn(),
      NumpadAdd: () => this.cameraController.zoomIn(),
      Minus: () => this.cameraController.zoomOut(),
      NumpadSubtract: () => this.cameraController.zoomOut()
    };
    const action = keyMap[event.code];
    if (!action) return false;
    action();
    this.markCameraNavigating();
    this.updateSelectionHelpers();
    this.updateUi();
    return true;
  }

  handleTransformKeyDown(event) {
    if (event.code === "KeyT") {
      this.setTransformMode("translate");
      return true;
    }
    if (event.code === "KeyR") {
      this.setTransformMode("rotate");
      return true;
    }
    if (event.code === "KeyF") {
      this.frameSelected();
      return true;
    }
    if (event.code === "Escape") {
      this.clearSelection();
      return true;
    }
    return false;
  }

  findEditorRoot(object) {
    let current = object;
    while (current) {
      if (current.userData?.editorId) return current;
      current = current.parent;
    }
    return null;
  }

  selectObject(objectId) {
    const record = this.records.find((item) => item.id === objectId);
    if (!record) return;
    this.selectedId = objectId;
    this.transformControls.attach(record.object);
    this.updateSelectionHelpers();
    this.updateUi();
  }

  clearSelection() {
    this.selectedId = "";
    if (this.transformControls) this.transformControls.detach();
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.geometry?.dispose();
      this.selectionBox.material?.dispose();
      this.selectionBox = null;
    }
    if (this.axesHelper?.parent) this.axesHelper.parent.remove(this.axesHelper);
    this.updateUi();
  }

  selectedRecord() {
    return this.records.find((record) => record.id === this.selectedId) || null;
  }

  updateSelectionHelpers() {
    const record = this.selectedRecord();
    if (!record) return;
    if (!this.selectionBox) {
      this.selectionBox = new THREE.BoxHelper(record.object, 0xf7cf6b);
      this.scene.add(this.selectionBox);
    }
    this.selectionBox.setFromObject(record.object);
    if (!this.axesHelper) this.axesHelper = new THREE.AxesHelper(1.8);
    if (this.axesHelper.parent !== record.object) {
      if (this.axesHelper.parent) this.axesHelper.parent.remove(this.axesHelper);
      record.object.add(this.axesHelper);
    }
  }

  setTransformMode(mode) {
    this.transformControls.setMode(mode);
    this.dom.translateMode.classList.toggle("is-active", mode === "translate");
    this.dom.rotateMode.classList.toggle("is-active", mode === "rotate");
    this.updateSnap();
  }

  updateSnap() {
    const snap = Boolean(this.dom.snapToggle.checked);
    this.transformControls.setTranslationSnap(snap ? TRANSLATE_SNAP : null);
    this.transformControls.setRotationSnap(snap ? ROTATION_SNAP : null);
  }

  resetSelectedObject() {
    const record = this.selectedRecord();
    if (!record) return;
    const transform = record.originalTransform;
    record.object.position.set(transform.position.x, transform.position.y, transform.position.z);
    record.object.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
    record.object.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
    record.object.updateMatrixWorld(true);
    this.updateSelectionHelpers();
    this.updateUi();
  }

  selectedMeta() {
    if (!this.selectedId) return normalizeObjectMeta();
    return normalizeObjectMeta(this.objectMeta[this.selectedId]);
  }

  setObjectMeta(objectId, updates) {
    if (!objectId) return;
    const nextMeta = normalizeObjectMeta({
      ...this.objectMeta[objectId],
      ...updates,
      updatedAt: new Date().toISOString()
    });
    const hasContent = nextMeta.note.trim() || nextMeta.markedForDelete;
    if (hasContent) {
      this.objectMeta = {
        ...this.objectMeta,
        [objectId]: nextMeta
      };
    } else {
      const nextObjectMeta = { ...this.objectMeta };
      delete nextObjectMeta[objectId];
      this.objectMeta = nextObjectMeta;
    }
    saveEditorObjectMeta(this.level?.id || "level_two", this.objectMeta);
    this.outputMode = "state";
    this.updateUi();
  }

  updateSelectedNote(note) {
    if (!this.selectedId) return;
    this.setObjectMeta(this.selectedId, { note });
  }

  insertNoteChip(chip) {
    if (!this.selectedId || !NOTE_CHIPS.includes(chip)) return;
    const noteInput = this.dom.objectNote;
    const current = noteInput.value;
    const start = noteInput.selectionStart ?? current.length;
    const end = noteInput.selectionEnd ?? current.length;
    const prefix = current.slice(0, start);
    const suffix = current.slice(end);
    const needsLeadingSpace = prefix.length > 0 && !/\s$/.test(prefix);
    const needsTrailingSpace = suffix.length > 0 && !/^\s/.test(suffix);
    const insertion = `${needsLeadingSpace ? " " : ""}${chip}${needsTrailingSpace ? " " : ""}`;
    const nextValue = `${prefix}${insertion}${suffix}`;
    noteInput.value = nextValue;
    const cursor = prefix.length + insertion.length;
    noteInput.focus({ preventScroll: true });
    noteInput.setSelectionRange(cursor, cursor);
    this.updateSelectedNote(nextValue);
  }

  toggleDeleteMark() {
    if (!this.selectedId) return;
    const meta = this.selectedMeta();
    this.setObjectMeta(this.selectedId, { markedForDelete: !meta.markedForDelete });
  }

  zoomCamera(direction) {
    if (!this.cameraController) return;
    if (direction === "in") this.cameraController.zoomIn();
    if (direction === "out") this.cameraController.zoomOut();
    this.markCameraNavigating();
    this.updateUi();
  }

  tiltCamera(direction) {
    if (!this.cameraController) return;
    this.cameraController.tiltPitch(direction === "up" ? 1 : -1);
    this.markCameraNavigating();
    this.updateSelectionHelpers();
    this.updateUi();
  }

  resetCamera() {
    if (!this.cameraController) return;
    this.cameraController.reset(new THREE.Vector3(0, 0, 0));
    this.markCameraNavigating();
    this.updateSelectionHelpers();
    this.updateUi();
  }

  markCameraNavigating() {
    if (!this.cameraController) return;
    this.cameraController.setNavigating(true);
    window.clearTimeout(this.cameraNavigationTimer);
    this.cameraNavigationTimer = window.setTimeout(() => {
      this.cameraController.setNavigating(false);
      this.updateUi();
    }, 140);
  }

  frameSelected() {
    const record = this.selectedRecord();
    if (!record) return;
    const box = new THREE.Box3().setFromObject(record.object);
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.setupCamera(center);
    this.updateSelectionHelpers();
    this.updateUi();
  }

  canvasPointForObject(objectId) {
    const record = this.records.find((item) => item.id === objectId);
    if (!record) return null;
    const box = new THREE.Box3().setFromObject(record.object);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const projected = center.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((projected.x + 1) / 2) * rect.width,
      y: ((1 - projected.y) / 2) * rect.height
    };
  }

  currentPatch() {
    return buildEditorPatch({
      levelId: this.level?.id || "level_two",
      records: this.records,
      selectedId: this.selectedId
    });
  }

  currentStateExport() {
    return buildEditorStateExport({
      levelId: this.level?.id || "level_two",
      records: this.records,
      selectedId: this.selectedId,
      objectMeta: this.objectMeta
    });
  }

  updateUi() {
    if (!this.dom.objectList) return;
    const dirty = dirtyRecords(this.records);
    const dirtyIds = new Set(dirty.map((record) => record.id));
    const notedIds = new Set(Object.entries(this.objectMeta)
      .filter(([, meta]) => normalizeObjectMeta(meta).note.trim())
      .map(([objectId]) => objectId));
    const deleteIds = new Set(Object.entries(this.objectMeta)
      .filter(([, meta]) => normalizeObjectMeta(meta).markedForDelete)
      .map(([objectId]) => objectId));
    const selected = this.selectedRecord();
    const patch = this.currentPatch();
    const stateExport = this.currentStateExport();
    const selectedMeta = this.selectedMeta();

    this.dom.objectCount.textContent = String(this.records.length);
    this.dom.dirtyCount.textContent = `${stateExport.affectedObjectCount} affected`;
    this.dom.editorStatus.textContent = this.status;
    this.dom.editorStatus.classList.toggle("is-ready", this.status === "Ready");
    this.dom.editorStatus.classList.toggle("is-error", /failed|unsupported/i.test(this.status));

    this.dom.objectList.innerHTML = "";
    this.records.forEach((record) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = [
        "editor-object-row",
        record.id === this.selectedId ? "is-selected" : "",
        dirtyIds.has(record.id) ? "is-dirty" : "",
        notedIds.has(record.id) ? "is-noted" : "",
        deleteIds.has(record.id) ? "is-delete" : ""
      ].filter(Boolean).join(" ");
      const metaFlags = [
        dirtyIds.has(record.id) ? "changed" : "",
        notedIds.has(record.id) ? "note" : "",
        deleteIds.has(record.id) ? "delete" : ""
      ].filter(Boolean).join(" / ");
      row.dataset.editorObjectId = record.id;
      row.innerHTML = `
        <span class="object-name">${record.name}</span>
        <span class="object-meta">${record.category} / ${record.assetKey || "generated"}${metaFlags ? ` / ${metaFlags}` : ""}</span>
      `;
      this.dom.objectList.appendChild(row);
    });

    if (!selected) {
      this.dom.selectionSummary.textContent = "No selection";
      this.dom.transformReadout.innerHTML = "";
      this.dom.resetSelected.disabled = true;
      this.dom.markDelete.disabled = true;
      this.dom.markDelete.classList.remove("is-active");
      this.dom.markDelete.textContent = "Mark Delete";
      this.dom.objectNote.value = "";
      this.dom.objectNote.disabled = true;
      this.dom.noteChipRow.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });
    } else {
      const transform = snapshotTransform(selected.object);
      this.dom.selectionSummary.textContent = `${selected.name} / ${selected.id}`;
      this.dom.transformReadout.innerHTML = `
        <div><span>Position</span><code>${this.formatAxes(transform.position)}</code></div>
        <div><span>Rotation</span><code>${this.formatAxes(transform.rotation)}</code></div>
        <div><span>Scale</span><code>${this.formatAxes(transform.scale)}</code></div>
        <div><span>Source</span><code>${selected.sourceRef.exportName}:${selected.sourceRef.path}</code></div>
      `;
      this.dom.resetSelected.disabled = false;
      this.dom.markDelete.disabled = false;
      this.dom.markDelete.classList.toggle("is-active", selectedMeta.markedForDelete);
      this.dom.markDelete.textContent = selectedMeta.markedForDelete ? "Unmark Delete" : "Mark Delete";
      this.dom.objectNote.disabled = false;
      if (document.activeElement !== this.dom.objectNote || this.dom.objectNote.value !== selectedMeta.note) {
        this.dom.objectNote.value = selectedMeta.note;
      }
      this.dom.noteChipRow.querySelectorAll("button").forEach((button) => {
        button.disabled = false;
      });
    }

    this.dom.patchOutput.value = JSON.stringify(this.outputMode === "state" ? stateExport : patch, null, 2);
    this.updateCameraReadout();
  }

  formatAxes(values) {
    return `x ${values.x.toFixed(3)} / y ${values.y.toFixed(3)} / z ${values.z.toFixed(3)}`;
  }

  setStatus(status) {
    this.status = status;
    if (this.dom.editorStatus) this.dom.editorStatus.textContent = status;
  }

  updateCameraReadout() {
    if (!this.dom.cameraReadout || !this.cameraController) return;
    const camera = this.cameraController.state();
    this.dom.cameraReadout.textContent = `zoom ${camera.zoom.toFixed(2)} / yaw ${camera.yaw.toFixed(2)} / pitch ${camera.pitch.toFixed(2)}`;
  }

  async copyPatch() {
    const patchText = JSON.stringify(this.currentPatch(), null, 2);
    this.outputMode = "patch";
    this.dom.patchOutput.value = patchText;
    if (!navigator.clipboard?.writeText) {
      this.showToast("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(patchText);
      this.showToast("Patch copied");
    } catch {
      this.showToast("Copy blocked");
    }
  }

  async copyEditorState() {
    const stateText = JSON.stringify(this.currentStateExport(), null, 2);
    this.outputMode = "state";
    this.dom.patchOutput.value = stateText;
    if (!navigator.clipboard?.writeText) {
      this.showToast("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(stateText);
      this.showToast("State copied");
    } catch {
      this.showToast("Copy blocked");
    }
  }

  playInGame() {
    const target = new URL("/", window.location.href);
    target.searchParams.set("debugScene", "level_two");
    const opened = window.open(target.href, "_blank");
    if (opened) {
      opened.opener = null;
      return;
    }
    this.showToast("Popup blocked");
  }

  showToast(message) {
    this.dom.toast.textContent = message;
    this.dom.toast.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.dom.toast.hidden = true;
    }, 1600);
  }

  renderEditorToText() {
    const patch = this.currentPatch();
    const stateExport = this.currentStateExport();
    return {
      mode: "level-editor",
      ready: this.isReady,
      status: this.status,
      levelId: this.level?.id || null,
      objectCount: this.records.length,
      selectedId: this.selectedId || null,
      dirtyCount: patch.objects.length,
      affectedCount: stateExport.affectedObjectCount,
      selectedMeta: this.selectedId ? this.selectedMeta() : null,
      camera: this.cameraController?.state() || null,
      patch: summarizeEditorPatch(patch),
      stateExport: summarizeEditorStateExport(stateExport)
    };
  }
}
