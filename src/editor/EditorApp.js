import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import { ASSETS } from "../config/assets.js";
import { cloneLoadedAsset, loadAssetRegistry, placeLoadedAsset } from "../core/assetLoader.js";
import { createGameRenderer, setupSceneLights } from "../core/renderer.js";
import { loadEditorHandoff } from "../debug/devEditorHandoff.js";
import {
  buildEditorPatch,
  dirtyRecords,
  snapshotTransform,
  summarizeEditorPatch
} from "./EditorPatchExporter.js";
import { buildEditorAiPrompt } from "./EditorAiPromptExporter.js";
import {
  EDITOR_ASSET_FILTERS,
  EDITOR_ASSET_SOURCE_FILTERS,
  assetFolderOptions,
  assetPackOptions,
  buildEditorAssetCatalog,
  filterEditorAssets,
  normalizeAssetFilterState,
  summarizeEditorAssetCatalog
} from "./EditorAssetCatalog.js";
import { EditorColliderOverlay } from "./EditorColliderOverlay.js";
import { findIntentSuggestions } from "./EditorNoteIntents.js";
import {
  extractNoteReferenceTokens,
  findReferenceSuggestions,
  referenceTokenForAsset,
  referenceTokenForObject
} from "./EditorNoteReferences.js";
import { getActiveNoteQuery, insertNoteToken } from "./EditorNoteTypeahead.js";
import {
  EDITOR_OBJECT_FILTERS,
  filterEditorRecords,
  loadObjectFilterState,
  normalizeObjectFilterState,
  saveObjectFilterState
} from "./EditorObjectFilters.js";
import {
  buildEditorStateExport,
  loadEditorLevelMeta,
  loadEditorObjectMeta,
  normalizeLevelMeta,
  normalizeObjectMeta,
  saveEditorLevelMeta,
  saveEditorObjectMeta,
  summarizeEditorStateExport
} from "./EditorStateExporter.js";
import { applySnapshotTransform, transformTargetForRecord } from "./EditorTransformUtils.js";
import { EditorCameraController } from "./EditorCameraController.js";
import { createEmptyEditorTimeline, summarizeEditorTimeline } from "./timeline/EditorTimelineModel.js";
import {
  getDefaultLevelEditorAdapter,
  getLevelEditorAdapter,
  getSupportedLevelIds,
  LEVEL_EDITOR_ADAPTERS
} from "./levels/index.js";

const VIEW_HEIGHT = 42;
const CAMERA_OFFSET = new THREE.Vector3(28, 30, 28);
const TRANSLATE_SNAP = 0.25;
const ROTATION_SNAP = Math.PI / 12;

export class EditorApp {
  constructor({ root, canvas }) {
    this.root = root;
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-20, 20, 14, -14, 0.1, 240);
    this.cameraController = null;
    this.colliderOverlay = new EditorColliderOverlay({ scene: this.scene });
    this.renderer = null;
    this.assetCache = new Map();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.level = null;
    this.adapters = LEVEL_EDITOR_ADAPTERS;
    this.activeAdapter = null;
    this.records = [];
    this.visibleRecords = [];
    this.objectFilterState = loadObjectFilterState();
    this.objectMeta = {};
    this.levelMeta = normalizeLevelMeta();
    this.timeline = createEmptyEditorTimeline("level_two");
    this.assetCatalog = buildEditorAssetCatalog(ASSETS);
    this.activePanelTab = "objects";
    this.assetFilterState = normalizeAssetFilterState();
    this.selectedAssetKey = "";
    this.selectedId = "";
    this.selectionMode = "level";
    this.outputMode = "patch";
    this.promptText = "";
    this.transformControls = null;
    this.transformHelper = null;
    this.selectionBox = null;
    this.axesHelper = null;
    this.isDraggingTransform = false;
    this.cameraNavigationTimer = 0;
    this.isReady = false;
    this.status = "Loading";
    this.handoff = null;
    this.handoffRequest = null;
    this.handoffMessage = "";
    this.handoffMatchedId = "";
    this.noteTypeahead = {
      query: null,
      suggestions: [],
      trigger: "",
      activeIndex: 0,
      open: false
    };
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
    this.populateLevelSelect();
    this.resize();

    try {
      await loadAssetRegistry({
        assets: ASSETS,
        scene: this.scene,
        assetCache: this.assetCache
      });
      const defaultAdapter = getDefaultLevelEditorAdapter();
      this.loadLevel(defaultAdapter?.id || "level_two");
      this.applyInitialHandoff();
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
      objectsTab: this.root.querySelector("#objectsTab"),
      assetsTab: this.root.querySelector("#assetsTab"),
      objectsPane: this.root.querySelector("#objectsPane"),
      assetsPane: this.root.querySelector("#assetsPane"),
      objectCount: this.root.querySelector("#objectCount"),
      objectSearch: this.root.querySelector("#objectSearch"),
      objectFilterDisclosure: this.root.querySelector("#objectFilterDisclosure"),
      objectFilterSummary: this.root.querySelector("#objectFilterSummary"),
      objectQuickFilters: this.root.querySelector("#objectQuickFilters"),
      hideBaseGround: this.root.querySelector("#hideBaseGround"),
      objectFilterNotice: this.root.querySelector("#objectFilterNotice"),
      revealSelectedObject: this.root.querySelector("#revealSelectedObject"),
      clearObjectFilters: this.root.querySelector("#clearObjectFilters"),
      objectList: this.root.querySelector("#objectList"),
      assetCount: this.root.querySelector("#assetCount"),
      assetSearch: this.root.querySelector("#assetSearch"),
      assetFilterDisclosure: this.root.querySelector("#assetFilterDisclosure"),
      assetFilterSummary: this.root.querySelector("#assetFilterSummary"),
      assetSourceScope: this.root.querySelector("#assetSourceScope"),
      assetPackFilter: this.root.querySelector("#assetPackFilter"),
      assetFolderFilter: this.root.querySelector("#assetFolderFilter"),
      assetQuickFilters: this.root.querySelector("#assetQuickFilters"),
      assetList: this.root.querySelector("#assetList"),
      assetDetail: this.root.querySelector("#assetDetail"),
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
      showColliders: this.root.querySelector("#showColliders"),
      colliderReadout: this.root.querySelector("#colliderReadout"),
      snapToggle: this.root.querySelector("#snapToggle"),
      resetSelected: this.root.querySelector("#resetSelected"),
      resetLevel: this.root.querySelector("#resetLevel"),
      markDelete: this.root.querySelector("#markDelete"),
      markReplace: this.root.querySelector("#markReplace"),
      noteLabel: this.root.querySelector("#noteLabel"),
      objectNote: this.root.querySelector("#objectNote"),
      noteIntentSuggestions: this.root.querySelector("#noteIntentSuggestions"),
      saveNote: this.root.querySelector("#saveNote"),
      copyNote: this.root.querySelector("#copyNote"),
      clearNote: this.root.querySelector("#clearNote"),
      handoffPanel: this.root.querySelector("#handoffPanel"),
      handoffSummary: this.root.querySelector("#handoffSummary"),
      copyHandoff: this.root.querySelector("#copyHandoff"),
      selectionSummary: this.root.querySelector("#selectionSummary"),
      transformReadout: this.root.querySelector("#transformReadout"),
      patchOutput: this.root.querySelector("#patchOutput"),
      copyPatch: this.root.querySelector("#copyPatch"),
      copyState: this.root.querySelector("#copyState"),
      copyPrompt: this.root.querySelector("#copyPrompt"),
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
      this.syncColliderOverlay();
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
    this.dom.objectsTab?.addEventListener("click", () => this.setPanelTab("objects"));
    this.dom.assetsTab?.addEventListener("click", () => this.setPanelTab("assets"));
    this.dom.objectList.addEventListener("click", (event) => {
      const levelRow = event.target.closest("[data-editor-level-note]");
      if (levelRow) {
        this.clearSelection();
        return;
      }
      const row = event.target.closest("[data-editor-object-id]");
      if (!row) return;
      this.selectObject(row.dataset.editorObjectId);
    });
    this.dom.assetList?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-editor-asset-key]");
      if (!row) return;
      this.selectAsset(row.dataset.editorAssetKey);
    });
    this.dom.objectSearch?.addEventListener("input", () => {
      this.updateObjectFilters({ query: this.dom.objectSearch.value });
    });
    this.dom.objectQuickFilters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-object-filter]");
      if (!button) return;
      this.updateObjectFilters({ activeFilter: button.dataset.objectFilter });
    });
    this.dom.hideBaseGround?.addEventListener("change", () => {
      this.updateObjectFilters({ hideBaseGround: this.dom.hideBaseGround.checked });
    });
    this.dom.revealSelectedObject?.addEventListener("click", () => {
      this.revealSelectedInObjectList();
    });
    this.dom.clearObjectFilters?.addEventListener("click", () => {
      this.updateObjectFilters({ query: "", activeFilter: "all", hideBaseGround: false });
    });
    this.dom.assetSearch?.addEventListener("input", () => {
      this.updateAssetFilters({ query: this.dom.assetSearch.value });
    });
    this.dom.assetQuickFilters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-asset-filter]");
      if (!button) return;
      this.updateAssetFilters({ activeFilter: button.dataset.assetFilter });
    });
    this.dom.assetSourceScope?.addEventListener("change", () => {
      this.updateAssetFilters({
        sourceScope: this.dom.assetSourceScope.value,
        packName: "all",
        folderPath: "all"
      });
    });
    this.dom.assetPackFilter?.addEventListener("change", () => {
      this.updateAssetFilters({
        packName: this.dom.assetPackFilter.value,
        folderPath: "all"
      });
    });
    this.dom.assetFolderFilter?.addEventListener("change", () => {
      this.updateAssetFilters({ folderPath: this.dom.assetFolderFilter.value });
    });
    this.dom.translateMode.addEventListener("click", () => this.setTransformMode("translate"));
    this.dom.rotateMode.addEventListener("click", () => this.setTransformMode("rotate"));
    this.dom.frameSelected.addEventListener("click", () => this.frameSelected());
    this.dom.zoomOutCamera.addEventListener("click", () => this.zoomCamera("out"));
    this.dom.zoomInCamera.addEventListener("click", () => this.zoomCamera("in"));
    this.dom.pitchDownCamera.addEventListener("click", () => this.tiltCamera("down"));
    this.dom.pitchUpCamera.addEventListener("click", () => this.tiltCamera("up"));
    this.dom.resetCamera.addEventListener("click", () => this.resetCamera());
    this.dom.showColliders.addEventListener("change", () => this.setColliderOverlayVisible(this.dom.showColliders.checked));
    this.dom.snapToggle.addEventListener("change", () => this.updateSnap());
    this.dom.resetSelected.addEventListener("click", () => this.resetSelectedObject());
    this.dom.resetLevel.addEventListener("click", () => this.resetLevelState());
    this.dom.markDelete.addEventListener("click", () => this.toggleDeleteMark());
    this.dom.markReplace.addEventListener("click", () => this.toggleReplaceMark());
    this.dom.objectNote.addEventListener("input", () => {
      this.updateSelectedNote(this.dom.objectNote.value);
      this.updateNoteTypeahead();
    });
    this.dom.objectNote.addEventListener("keydown", (event) => this.handleNoteKeyDown(event));
    this.dom.objectNote.addEventListener("keyup", () => this.updateNoteTypeahead());
    this.dom.objectNote.addEventListener("click", () => this.updateNoteTypeahead());
    this.dom.objectNote.addEventListener("blur", () => {
      window.setTimeout(() => this.closeNoteTypeahead(), 120);
    });
    this.dom.noteIntentSuggestions?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      const option = event.target.closest("[data-note-token], [data-intent-tag]");
      if (!option) return;
      this.insertNoteSuggestion(option.dataset.noteToken || option.dataset.intentTag);
    });
    this.dom.saveNote.addEventListener("click", () => this.saveSelectedNote());
    this.dom.copyNote.addEventListener("click", () => this.copySelectedNote());
    this.dom.clearNote.addEventListener("click", () => this.clearSelectedNote());
    this.dom.copyPatch.addEventListener("click", () => this.copyPatch());
    this.dom.copyState.addEventListener("click", () => this.copyEditorState());
    this.dom.copyPrompt.addEventListener("click", () => this.copyAiPrompt());
    this.dom.copyHandoff?.addEventListener("click", () => this.copyRuntimeHandoff());
    this.dom.playInGame.addEventListener("click", () => this.playInGame());
    this.dom.levelSelect.addEventListener("change", () => this.loadLevel(this.dom.levelSelect.value));
  }

  populateLevelSelect() {
    if (!this.dom.levelSelect) return;
    this.dom.levelSelect.innerHTML = "";
    this.adapters.forEach((adapter) => {
      const option = document.createElement("option");
      option.value = adapter.id;
      option.textContent = adapter.name;
      this.dom.levelSelect.appendChild(option);
    });
  }

  loadLevel(levelId) {
    this.clearSelection();
    if (this.level?.group) this.scene.remove(this.level.group);

    const adapter = getLevelEditorAdapter(levelId);
    if (!adapter) {
      this.setStatus("Unsupported level");
      return;
    }

    this.activeAdapter = adapter;
    this.level = adapter.buildEditorScene({
      cloneAsset: (key) => cloneLoadedAsset(this.assetCache, key),
      placeAsset: (group, key, point, options) => placeLoadedAsset(this.assetCache, group, key, point, options)
    });
    this.scene.add(this.level.group);
    this.records = this.level.editableObjects;
    this.visibleRecords = this.records;
    this.objectMeta = loadEditorObjectMeta(levelId);
    this.levelMeta = loadEditorLevelMeta(levelId);
    this.timeline = createEmptyEditorTimeline(levelId);
    this.assetCatalog = buildEditorAssetCatalog(ASSETS, { levelId });
    if (!this.assetCatalog.records.some((record) => record.assetKey === this.selectedAssetKey)) {
      this.selectedAssetKey = this.assetCatalog.records[0]?.assetKey || "";
    }
    this.colliderOverlay.rebuild({
      records: this.records,
      proxies: this.level.colliderProxies || []
    });
    this.colliderOverlay.setVisible(Boolean(this.dom.showColliders?.checked));
    this.handoffMatchedId = "";
    this.handoffMessage = "";
    if (this.dom.levelSelect.value !== levelId) this.dom.levelSelect.value = levelId;
    this.dom.viewportBadge.textContent = this.level.name;
    this.selectObject(adapter.defaultSelectedId || this.records[0]?.id || "");
    this.setStatus("Ready");
    this.updateUi();
  }

  updateObjectFilters(updates) {
    this.objectFilterState = normalizeObjectFilterState({
      ...this.objectFilterState,
      ...updates
    });
    saveObjectFilterState(this.objectFilterState);
    this.updateUi();
  }

  setPanelTab(tabId) {
    this.activePanelTab = tabId === "assets" ? "assets" : "objects";
    this.updateUi();
  }

  updateAssetFilters(updates) {
    this.assetFilterState = normalizeAssetFilterState({
      ...this.assetFilterState,
      ...updates
    });
    const packOptions = assetPackOptions(this.assetCatalog, this.assetFilterState);
    if (this.assetFilterState.packName !== "all" && !packOptions.includes(this.assetFilterState.packName)) {
      this.assetFilterState = normalizeAssetFilterState({ ...this.assetFilterState, packName: "all", folderPath: "all" });
    }
    const folderOptions = assetFolderOptions(this.assetCatalog, this.assetFilterState);
    if (this.assetFilterState.folderPath !== "all" && !folderOptions.includes(this.assetFilterState.folderPath)) {
      this.assetFilterState = normalizeAssetFilterState({ ...this.assetFilterState, folderPath: "all" });
    }
    const filterData = this.currentAssetFilterData();
    const selectedVisible = filterData.visibleRecords.some((record) => record.assetKey === this.selectedAssetKey);
    if (!selectedVisible && filterData.visibleRecords.length > 0) {
      this.selectedAssetKey = filterData.visibleRecords[0].assetKey;
    }
    this.updateUi();
  }

  selectedAsset() {
    return this.assetCatalog.records.find((record) => record.assetKey === this.selectedAssetKey) || null;
  }

  selectAsset(assetKey) {
    const record = this.assetCatalog.records.find((item) => item.assetKey === assetKey);
    if (!record) return;
    this.selectedAssetKey = assetKey;
    this.activePanelTab = "assets";
    this.outputMode = "state";
    this.updateUi();
  }

  revealSelectedInObjectList() {
    if (!this.selectedId) return;
    const selected = this.selectedRecord();
    const isBase = selected?.tileKind === "base" ||
      selected?.tileKind === "base_ground" ||
      selected?.tileKind === "base_path" ||
      (selected?.tags || []).includes("base");
    this.updateObjectFilters({
      query: "",
      activeFilter: "all",
      hideBaseGround: isBase ? false : this.objectFilterState.hideBaseGround
    });
  }

  readHandoffRequest() {
    const params = new URLSearchParams(window.location.search);
    const handoffId = params.get("handoff") || "";
    const sceneId = params.get("scene") || "";
    const entityId = params.get("entity") || "";
    if (!handoffId && !sceneId && !entityId) return null;
    return { handoffId, sceneId, entityId };
  }

  applyInitialHandoff() {
    this.handoffRequest = this.readHandoffRequest();
    if (!this.handoffRequest) return;

    this.handoff = this.handoffRequest.handoffId
      ? loadEditorHandoff(this.handoffRequest.handoffId)
      : null;
    const requestedScene = this.handoff?.sceneId || this.handoff?.scene?.id || this.handoffRequest.sceneId || "";
    const requestedEntity = this.handoff?.selectedEntityId || this.handoff?.selection?.id || this.handoffRequest.entityId || "";

    if (!this.handoff && this.handoffRequest.handoffId) {
      this.handoffMessage = `Handoff ${this.handoffRequest.handoffId} was not found or expired.`;
      this.updateUi();
      return;
    }

    if (requestedScene && requestedScene !== this.level?.id) {
      const adapter = getLevelEditorAdapter(requestedScene);
      if (!adapter) {
        this.handoffMessage = `Runtime handoff loaded for ${requestedScene}, but no editor adapter is registered for that scene.`;
        this.updateUi();
        return;
      }
      this.loadLevel(requestedScene);
    }

    const match = this.findRecordForHandoff(requestedEntity, this.handoff);
    if (match) {
      this.handoffMatchedId = match.id;
      this.selectObject(match.id);
      this.frameSelected();
      this.handoffMessage = `Runtime handoff matched ${match.name}.`;
      this.updateUi();
      return;
    }

    this.handoffMessage = requestedEntity
      ? `Runtime handoff loaded, but ${requestedEntity} is not editable in this route.`
      : "Runtime handoff loaded without a selected editable object.";
    this.updateUi();
  }

  normalizedHandoffText(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
  }

  uniqueRecordMatch(predicate) {
    const matches = this.records.filter(predicate);
    return matches.length === 1 ? matches[0] : null;
  }

  findRecordForHandoff(requestedEntity, handoff) {
    if (requestedEntity) {
      const exact = this.records.find((record) => record.id === requestedEntity);
      if (exact) return exact;
    }

    const selection = handoff?.selection || {};
    const selectedName = this.normalizedHandoffText(selection.displayName || selection.name);
    if (selectedName) {
      const byName = this.uniqueRecordMatch((record) => this.normalizedHandoffText(record.name) === selectedName);
      if (byName) return byName;
    }

    const selectedAsset = selection.asset?.key || selection.assetKey || "";
    if (selectedAsset) {
      const byAsset = this.uniqueRecordMatch((record) => record.assetKey === selectedAsset);
      if (byAsset) return byAsset;
    }

    const sourceHint = selection.sourceFileHint || handoff?.sourceHints?.selected || "";
    if (sourceHint) {
      const bySource = this.uniqueRecordMatch((record) => (
        sourceHint.includes(record.sourceRef?.exportName || "__missing__") ||
        sourceHint.includes(record.sourceRef?.path || "__missing__")
      ));
      if (bySource) return bySource;
    }

    return null;
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
    if (hit) {
      this.selectObject(hit.userData.editorId);
    } else {
      this.clearSelection();
    }
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
    this.selectionMode = "object";
    if (this.recordAllowsTransform(record)) {
      this.transformControls.attach(transformTargetForRecord(record));
    } else {
      this.transformControls.detach();
    }
    this.updateSelectionHelpers();
    this.syncColliderOverlay();
    this.updateUi();
  }

  clearSelection() {
    this.selectedId = "";
    this.selectionMode = "level";
    if (this.transformControls) this.transformControls.detach();
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.geometry?.dispose();
      this.selectionBox.material?.dispose();
      this.selectionBox = null;
    }
    if (this.axesHelper?.parent) this.axesHelper.parent.remove(this.axesHelper);
    this.syncColliderOverlay();
    this.updateUi();
  }

  selectedRecord() {
    return this.records.find((record) => record.id === this.selectedId) || null;
  }

  recordAllowsTransform(record) {
    return Boolean(record && record.movable && !record.locked && !record.readOnly && !record.transformLocked && transformTargetForRecord(record));
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
    const target = transformTargetForRecord(record);
    if (this.axesHelper.parent !== target) {
      if (this.axesHelper.parent) this.axesHelper.parent.remove(this.axesHelper);
      target.add(this.axesHelper);
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

  setColliderOverlayVisible(visible) {
    this.colliderOverlay?.setVisible(visible);
    this.syncColliderOverlay();
    this.outputMode = "state";
    this.updateUi();
  }

  syncColliderOverlay() {
    this.colliderOverlay?.sync(this.selectedId);
  }

  resetSelectedObject() {
    const record = this.selectedRecord();
    if (!this.recordAllowsTransform(record)) return;
    applySnapshotTransform(transformTargetForRecord(record), record.originalTransform);
    this.updateSelectionHelpers();
    this.syncColliderOverlay();
    this.updateUi();
    this.showToast("Selected reset");
  }

  resetLevelState() {
    if (!this.level) return;
    const confirmed = window.confirm("Reset this editor level to its original loaded state and clear all notes/delete/replace marks?");
    if (!confirmed) return;

    this.records.forEach((record) => applySnapshotTransform(transformTargetForRecord(record), record.originalTransform));
    this.objectMeta = {};
    this.levelMeta = normalizeLevelMeta();
    saveEditorObjectMeta(this.level.id, this.objectMeta);
    saveEditorLevelMeta(this.level.id, this.levelMeta);
    this.clearSelection();
    const defaultId = this.activeAdapter?.defaultSelectedId || this.records[0]?.id || "";
    if (defaultId) this.selectObject(defaultId);
    this.outputMode = "state";
    this.updateSelectionHelpers();
    this.syncColliderOverlay();
    this.updateUi();
    this.showToast("Level reset");
  }

  selectedMeta() {
    if (!this.selectedId) return normalizeObjectMeta();
    return normalizeObjectMeta(this.objectMeta[this.selectedId]);
  }

  selectedLevelMeta() {
    return normalizeLevelMeta(this.levelMeta);
  }

  activeNoteMeta() {
    return this.selectedId ? this.selectedMeta() : this.selectedLevelMeta();
  }

  setObjectMeta(objectId, updates) {
    if (!objectId) return;
    const mergedUpdates = { ...updates };
    if (mergedUpdates.markedForDelete) mergedUpdates.markedForReplace = false;
    if (mergedUpdates.markedForReplace) mergedUpdates.markedForDelete = false;
    const nextMeta = normalizeObjectMeta({
      ...this.objectMeta[objectId],
      ...mergedUpdates,
      updatedAt: new Date().toISOString()
    });
    const hasContent = nextMeta.note.trim() || nextMeta.markedForDelete || nextMeta.markedForReplace;
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

  setLevelMeta(updates) {
    const nextMeta = normalizeLevelMeta({
      ...this.levelMeta,
      ...updates,
      updatedAt: new Date().toISOString()
    });
    this.levelMeta = nextMeta.note.trim() ? nextMeta : normalizeLevelMeta();
    saveEditorLevelMeta(this.level?.id || "level_two", this.levelMeta);
    this.outputMode = "state";
    this.updateUi();
  }

  updateSelectedNote(note) {
    if (this.selectedId) {
      this.setObjectMeta(this.selectedId, { note });
      return;
    }
    this.setLevelMeta({ note });
  }

  toggleDeleteMark() {
    if (!this.selectedId) return;
    const meta = this.selectedMeta();
    this.setObjectMeta(this.selectedId, {
      markedForDelete: !meta.markedForDelete,
      markedForReplace: false
    });
  }

  toggleReplaceMark() {
    if (!this.selectedId) return;
    const meta = this.selectedMeta();
    this.setObjectMeta(this.selectedId, {
      markedForReplace: !meta.markedForReplace,
      markedForDelete: false
    });
  }

  saveSelectedNote() {
    this.updateSelectedNote(this.dom.objectNote.value);
    this.showToast("Note saved");
  }

  async copySelectedNote() {
    const meta = this.activeNoteMeta();
    if (!meta.note.trim()) {
      this.showToast("No note to copy");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      this.showToast("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(meta.note);
      this.showToast("Note copied");
    } catch {
      this.showToast("Copy blocked");
    }
  }

  clearSelectedNote() {
    this.dom.objectNote.value = "";
    this.closeNoteTypeahead();
    this.updateSelectedNote("");
    this.showToast("Note cleared");
  }

  updateNoteTypeahead() {
    if (!this.dom.objectNote || this.dom.objectNote.disabled) {
      this.closeNoteTypeahead();
      return;
    }
    const query = getActiveNoteQuery(this.dom.objectNote);
    if (!query) {
      this.closeNoteTypeahead();
      return;
    }
    const suggestions = query.trigger === "@"
      ? findIntentSuggestions(query.query).map((intent) => ({
        ...intent,
        kind: "intent",
        trigger: "@",
        token: intent.tag,
        detail: intent.usage || intent.aiInstruction || ""
      }))
      : findReferenceSuggestions({
        query: query.query,
        activePanelTab: this.activePanelTab,
        visibleObjects: this.currentObjectFilterData().visibleRecords,
        objects: this.records,
        visibleAssets: this.currentAssetFilterData().visibleRecords,
        assets: this.assetCatalog?.records || [],
        objectMeta: this.objectMeta
      });
    this.noteTypeahead = {
      query,
      suggestions,
      trigger: query.trigger,
      activeIndex: Math.min(this.noteTypeahead.activeIndex, Math.max(0, suggestions.length - 1)),
      open: suggestions.length > 0
    };
    this.renderNoteTypeahead();
  }

  closeNoteTypeahead() {
    this.noteTypeahead = {
      query: null,
      suggestions: [],
      trigger: "",
      activeIndex: 0,
      open: false
    };
    this.renderNoteTypeahead();
  }

  handleNoteKeyDown(event) {
    if (!this.noteTypeahead.open) {
      if (event.key === "Escape") this.closeNoteTypeahead();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.noteTypeahead.activeIndex = (this.noteTypeahead.activeIndex + 1) % this.noteTypeahead.suggestions.length;
      this.renderNoteTypeahead();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.noteTypeahead.activeIndex =
        (this.noteTypeahead.activeIndex - 1 + this.noteTypeahead.suggestions.length) % this.noteTypeahead.suggestions.length;
      this.renderNoteTypeahead();
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const active = this.noteTypeahead.suggestions[this.noteTypeahead.activeIndex];
      if (active) this.insertNoteSuggestion(active.token || active.tag);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeNoteTypeahead();
    }
  }

  insertNoteSuggestion(token) {
    const nextValue = insertNoteToken(this.dom.objectNote, this.noteTypeahead.query, token);
    if (nextValue !== null) {
      this.updateSelectedNote(nextValue);
      this.closeNoteTypeahead();
    }
  }

  insertIntentSuggestion(tag) {
    this.insertNoteSuggestion(tag);
  }

  renderNoteTypeahead() {
    const list = this.dom.noteIntentSuggestions;
    if (!list) return;

    const open = this.noteTypeahead.open && this.noteTypeahead.suggestions.length > 0;
    list.hidden = !open;
    this.dom.objectNote?.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      list.innerHTML = "";
      this.dom.objectNote?.removeAttribute("aria-activedescendant");
      return;
    }

    list.innerHTML = "";
    this.noteTypeahead.suggestions.forEach((suggestion, index) => {
      const token = suggestion.token || suggestion.tag;
      const isIntent = suggestion.kind === "intent" || suggestion.trigger === "@";
      const option = document.createElement("button");
      option.type = "button";
      option.id = `note-intent-option-${index}`;
      option.className = [
        "note-intent-option",
        isIntent ? "is-intent" : "is-reference",
        index === this.noteTypeahead.activeIndex ? "is-active" : ""
      ].filter(Boolean).join(" ");
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", index === this.noteTypeahead.activeIndex ? "true" : "false");
      option.dataset.noteToken = token;
      if (isIntent) option.dataset.intentTag = token;
      const detail = suggestion.detail || suggestion.usage || suggestion.example || "";
      option.title = detail || suggestion.summary || token;
      option.setAttribute("aria-label", `${token}: ${suggestion.summary || suggestion.label || ""}${detail ? `. ${detail}` : ""}`);
      option.innerHTML = `
        <span class="intent-tag">${this.escapeHtml(token)}</span>
        <span class="intent-copy">
          <span class="intent-summary">${this.escapeHtml(suggestion.summary || suggestion.label || "")}</span>
          ${detail ? `<span class="intent-detail">${this.escapeHtml(detail)}</span>` : ""}
          ${suggestion.example ? `<span class="intent-example">${this.escapeHtml(suggestion.example)}</span>` : ""}
        </span>
      `;
      list.appendChild(option);
    });

    this.dom.objectNote?.setAttribute(
      "aria-activedescendant",
      `note-intent-option-${this.noteTypeahead.activeIndex}`
    );
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
    this.syncColliderOverlay();
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
    this.syncColliderOverlay();
    return buildEditorStateExport({
      levelId: this.level?.id || "level_two",
      records: this.records,
      selectedId: this.selectedId,
      objectMeta: this.objectMeta,
      levelMeta: this.levelMeta,
      camera: this.cameraController?.state() || null,
      supportedLevelIds: getSupportedLevelIds(),
      colliderOverlay: this.colliderOverlay?.summary(this.selectedId) || null,
      getColliderProxiesForObject: (objectId) => this.colliderOverlay?.proxySummariesForObject(objectId) || [],
      objectFilter: this.currentObjectFilterSummary(),
      timeline: summarizeEditorTimeline(this.timeline),
      assetCatalog: summarizeEditorAssetCatalog(this.assetCatalog, {
        selectedAsset: this.selectedAsset(),
        filter: this.currentAssetFilterSummary()
      }),
      referenceAssetCatalog: this.assetCatalog
    });
  }

  handoffSummaryText() {
    if (!this.handoffRequest && !this.handoff) return "";
    const selection = this.handoff?.selection || {};
    const annotation = selection.annotation || this.handoff?.annotations?.selected || null;
    return [
      this.handoffMessage || "Runtime handoff loaded.",
      `Scene: ${this.handoff?.sceneId || this.handoffRequest?.sceneId || "unknown"}`,
      `Entity: ${this.handoff?.selectedEntityId || this.handoffRequest?.entityId || "none"}`,
      `Matched: ${this.handoffMatchedId || "read-only summary"}`,
      annotation?.notes ? `Notes: ${annotation.notes}` : "",
      annotation?.flags?.deleteCandidate ? "Flag: delete candidate" : "",
      annotation?.flags?.replaceCandidate ? `Flag: replace candidate${annotation.replacement?.assetKey ? ` with ${annotation.replacement.assetKey}` : ""}` : ""
    ].filter(Boolean).join("\n");
  }

  updateHandoffUi() {
    if (!this.dom.handoffPanel) return;
    const hasHandoff = Boolean(this.handoffRequest || this.handoff || this.handoffMessage);
    this.dom.handoffPanel.hidden = !hasHandoff;
    if (this.dom.handoffSummary) {
      this.dom.handoffSummary.textContent = this.handoffSummaryText();
    }
    if (this.dom.copyHandoff) {
      this.dom.copyHandoff.disabled = !this.handoff;
    }
  }

  objectMetaSets() {
    const entries = Object.entries(this.objectMeta);
    return {
      notedIds: new Set(entries
        .filter(([, meta]) => normalizeObjectMeta(meta).note.trim())
        .map(([objectId]) => objectId)),
      deleteIds: new Set(entries
        .filter(([, meta]) => normalizeObjectMeta(meta).markedForDelete)
        .map(([objectId]) => objectId)),
      replaceIds: new Set(entries
        .filter(([, meta]) => normalizeObjectMeta(meta).markedForReplace)
        .map(([objectId]) => objectId))
    };
  }

  colliderOwnerIds() {
    return new Set((this.level?.colliderProxies || [])
      .map((proxy) => proxy.ownerId)
      .filter(Boolean));
  }

  currentObjectFilterData(dirtyIds = null, metaSets = null) {
    const sets = metaSets || this.objectMetaSets();
    const activeDirtyIds = dirtyIds || new Set(dirtyRecords(this.records).map((record) => record.id));
    const filterResult = filterEditorRecords({
      records: this.records,
      objectMeta: this.objectMeta,
      dirtyIds: activeDirtyIds,
      deleteIds: sets.deleteIds,
      replaceIds: sets.replaceIds,
      colliderOwnerIds: this.colliderOwnerIds(),
      state: this.objectFilterState
    });
    const visibleIds = new Set(filterResult.visibleRecords.map((record) => record.id));
    return {
      ...filterResult,
      selectedHidden: Boolean(this.selectedId && !visibleIds.has(this.selectedId))
    };
  }

  currentObjectFilterSummary(filterData = null) {
    const data = filterData || this.currentObjectFilterData();
    return {
      query: data.state.query,
      activeFilter: data.state.activeFilter,
      hideBaseGround: data.state.hideBaseGround,
      visibleObjectCount: data.visibleObjectCount,
      totalObjectCount: data.totalObjectCount,
      hiddenObjectCount: data.hiddenObjectCount,
      selectedHidden: data.selectedHidden
    };
  }

  currentAssetFilterData() {
    return filterEditorAssets({
      catalog: this.assetCatalog,
      state: this.assetFilterState
    });
  }

  currentAssetFilterSummary(filterData = null) {
    const data = filterData || this.currentAssetFilterData();
    return {
      query: data.state.query,
      activeFilter: data.state.activeFilter,
      sourceScope: data.state.sourceScope,
      packName: data.state.packName,
      folderPath: data.state.folderPath,
      visibleAssetCount: data.visibleAssetCount,
      totalAssetCount: data.totalAssetCount,
      hiddenAssetCount: data.hiddenAssetCount,
      visibleExternalAssetCount: data.visibleExternalAssetCount,
      totalExternalAssetCount: data.totalExternalAssetCount,
      visibleProjectAssetCount: data.visibleProjectAssetCount,
      totalProjectAssetCount: data.totalProjectAssetCount,
      placementEnabled: false
    };
  }

  objectFilterSummaryLabel(state) {
    const filter = EDITOR_OBJECT_FILTERS.find((entry) => entry.id === state.activeFilter);
    const parts = [
      filter?.label || "All",
      state.hideBaseGround ? "Hide base ground" : ""
    ].filter(Boolean);
    return parts.join(" + ");
  }

  assetFilterSummaryLabel(state) {
    const category = EDITOR_ASSET_FILTERS.find((entry) => entry.id === state.activeFilter)?.label || "All";
    const source = EDITOR_ASSET_SOURCE_FILTERS.find((entry) => entry.id === state.sourceScope)?.label || "All";
    const parts = [
      category === "All" ? "All assets" : category,
      source !== "All" ? source : "",
      state.packName !== "all" ? state.packName.replace(/^Kaykits \/ /, "").replace(/^Cubeling Pack \/ /, "") : "",
      state.folderPath !== "all" ? state.folderPath.split("/").slice(-2).join("/") : ""
    ].filter(Boolean);
    return parts.join(" + ") || "All assets";
  }

  syncSelectOptions(select, options, selectedValue, allLabel) {
    if (!select) return;
    const values = ["all", ...options];
    const currentValues = [...select.options].map((option) => option.value);
    const needsRender = values.length !== currentValues.length ||
      values.some((value, index) => value !== currentValues[index]);
    if (needsRender) {
      select.innerHTML = "";
      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value === "all" ? allLabel : value;
        select.appendChild(option);
      });
    }
    select.value = values.includes(selectedValue) ? selectedValue : "all";
  }

  renderObjectFilterControls(filterData) {
    if (this.dom.objectSearch && this.dom.objectSearch.value !== filterData.state.query) {
      this.dom.objectSearch.value = filterData.state.query;
    }
    if (this.dom.objectFilterSummary) {
      this.dom.objectFilterSummary.textContent = this.objectFilterSummaryLabel(filterData.state);
    }
    if (this.dom.hideBaseGround) this.dom.hideBaseGround.checked = filterData.state.hideBaseGround;
    if (this.dom.objectQuickFilters && !this.dom.objectQuickFilters.children.length) {
      EDITOR_OBJECT_FILTERS.forEach((filter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "object-filter-chip";
        button.dataset.objectFilter = filter.id;
        button.textContent = filter.label;
        this.dom.objectQuickFilters.appendChild(button);
      });
    }
    this.dom.objectQuickFilters?.querySelectorAll("[data-object-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.objectFilter === filterData.state.activeFilter);
    });
    if (this.dom.objectFilterNotice) {
      this.dom.objectFilterNotice.hidden = !filterData.selectedHidden;
    }
  }

  renderAssetFilterControls(filterData) {
    if (this.dom.assetSearch && this.dom.assetSearch.value !== filterData.state.query) {
      this.dom.assetSearch.value = filterData.state.query;
    }
    if (this.dom.assetFilterSummary) {
      this.dom.assetFilterSummary.textContent = this.assetFilterSummaryLabel(filterData.state);
    }
    this.syncSelectOptions(
      this.dom.assetSourceScope,
      EDITOR_ASSET_SOURCE_FILTERS.filter((entry) => entry.id !== "all").map((entry) => entry.id),
      filterData.state.sourceScope,
      "All sources"
    );
    if (this.dom.assetSourceScope) {
      [...this.dom.assetSourceScope.options].forEach((option) => {
        const label = EDITOR_ASSET_SOURCE_FILTERS.find((entry) => entry.id === option.value)?.label;
        if (label) option.textContent = label;
      });
    }
    this.syncSelectOptions(
      this.dom.assetPackFilter,
      assetPackOptions(this.assetCatalog, filterData.state),
      filterData.state.packName,
      "All packs"
    );
    this.syncSelectOptions(
      this.dom.assetFolderFilter,
      assetFolderOptions(this.assetCatalog, filterData.state),
      filterData.state.folderPath,
      "All folders"
    );
    if (this.dom.assetQuickFilters && !this.dom.assetQuickFilters.children.length) {
      EDITOR_ASSET_FILTERS.forEach((filter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "object-filter-chip";
        button.dataset.assetFilter = filter.id;
        button.textContent = filter.label;
        this.dom.assetQuickFilters.appendChild(button);
      });
    }
    this.dom.assetQuickFilters?.querySelectorAll("[data-asset-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.assetFilter === filterData.state.activeFilter);
    });
  }

  renderLeftPanelTabs() {
    const showingAssets = this.activePanelTab === "assets";
    if (this.dom.objectsPane) this.dom.objectsPane.hidden = showingAssets;
    if (this.dom.assetsPane) this.dom.assetsPane.hidden = !showingAssets;
    if (this.dom.objectsTab) {
      this.dom.objectsTab.classList.toggle("is-active", !showingAssets);
      this.dom.objectsTab.setAttribute("aria-selected", showingAssets ? "false" : "true");
    }
    if (this.dom.assetsTab) {
      this.dom.assetsTab.classList.toggle("is-active", showingAssets);
      this.dom.assetsTab.setAttribute("aria-selected", showingAssets ? "true" : "false");
    }
  }

  renderAssetList(filterData) {
    if (!this.dom.assetList) return;
    this.renderAssetFilterControls(filterData);
    if (this.dom.assetCount) {
      this.dom.assetCount.textContent = `${filterData.visibleAssetCount} / ${filterData.totalAssetCount}`;
    }
    this.dom.assetList.innerHTML = "";
    filterData.visibleRecords.forEach((record) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = [
        "editor-object-row",
        "editor-asset-row",
        record.sourceScope === "external" ? "is-external" : "is-project",
        record.assetKey === this.selectedAssetKey ? "is-selected" : ""
      ].filter(Boolean).join(" ");
      row.dataset.editorAssetKey = record.assetKey;
      const dimensions = record.targetFootprint
        ? `footprint ${Number(record.targetFootprint).toFixed(2)}`
        : record.targetHeight
          ? `height ${Number(record.targetHeight).toFixed(2)}`
          : "dimensions unknown";
      row.innerHTML = `
        <span class="object-name">${this.escapeHtml(record.label)}</span>
        <span class="object-meta">${this.escapeHtml(record.sourceScope || "in-project")} / ${this.escapeHtml(record.packName || "catalog")} / ${this.escapeHtml(record.category)} / ${this.escapeHtml(record.format || record.type)} / ${this.escapeHtml(dimensions)}</span>
      `;
      this.dom.assetList.appendChild(row);
    });

    if (filterData.visibleRecords.length === 0) {
      const empty = document.createElement("div");
      empty.className = "editor-object-empty";
      empty.textContent = "No assets match the current filters.";
      this.dom.assetList.appendChild(empty);
    }

    this.renderAssetDetail();
  }

  renderAssetDetail() {
    if (!this.dom.assetDetail) return;
    const selected = this.selectedAsset();
    if (!selected) {
      this.dom.assetDetail.innerHTML = `
        <div><span>Selection</span><code>No asset selected</code></div>
        <div><span>Placement</span><code>Disabled for this slice</code></div>
      `;
      return;
    }
    const footprint = selected.targetFootprint !== null && selected.targetFootprint !== undefined
      ? Number(selected.targetFootprint).toFixed(3)
      : "unknown";
    const height = selected.targetHeight !== null && selected.targetHeight !== undefined
      ? Number(selected.targetHeight).toFixed(3)
      : "unknown";
    const sourceDisplay = selected.sourceScope === "external"
      ? selected.relativePath || selected.source || "unknown"
      : selected.source || "unknown";
    this.dom.assetDetail.innerHTML = `
      <div><span>Asset</span><code>${this.escapeHtml(selected.assetKey)}</code></div>
      <div><span>Token</span><code>${this.escapeHtml(referenceTokenForAsset(selected))}</code></div>
      <div><span>Scope</span><code>${this.escapeHtml(selected.sourceScope || "in-project")} / ${this.escapeHtml(selected.packName || "catalog")}</code></div>
      <div><span>Category</span><code>${this.escapeHtml(selected.category)} / ${this.escapeHtml(selected.format || selected.type)}</code></div>
      <div><span>Folder</span><code>${this.escapeHtml(selected.folderPath || "project asset registry")}</code></div>
      <div><span>Source</span><code title="${this.escapeHtml(selected.source || "unknown")}">${this.escapeHtml(sourceDisplay)}</code></div>
      <div><span>Bounds</span><code>footprint ${this.escapeHtml(footprint)} / height ${this.escapeHtml(height)}</code></div>
      <div><span>Tags</span><code>${this.escapeHtml((selected.tags || []).join(", ") || "none")}</code></div>
      <div><span>Placement</span><code>${selected.sourceScope === "external" ? "External reference only; not imported or placeable" : "Read-only catalog; placement is future scope"}</code></div>
    `;
  }

  updateUi() {
    if (!this.dom.objectList) return;
    this.syncColliderOverlay();
    const dirty = dirtyRecords(this.records);
    const dirtyIds = new Set(dirty.map((record) => record.id));
    const metaSets = this.objectMetaSets();
    const { notedIds, deleteIds, replaceIds } = metaSets;
    const filterData = this.currentObjectFilterData(dirtyIds, metaSets);
    const assetFilterData = this.currentAssetFilterData();
    this.visibleRecords = filterData.visibleRecords;
    this.renderLeftPanelTabs();
    this.renderObjectFilterControls(filterData);
    this.renderAssetList(assetFilterData);
    const selected = this.selectedRecord();
    const patch = this.currentPatch();
    const stateExport = this.currentStateExport();
    const selectedMeta = this.selectedMeta();
    const levelMeta = this.selectedLevelMeta();
    const colliderSummary = this.colliderOverlay?.summary(this.selectedId) || {
      visible: false,
      proxyCount: 0,
      selectedProxyCount: 0,
      selectedColliderLabels: []
    };

    this.dom.objectCount.textContent = `${filterData.visibleObjectCount} / ${filterData.totalObjectCount}`;
    this.dom.dirtyCount.textContent = `${stateExport.affectedItemCount ?? stateExport.affectedObjectCount} affected`;
    this.dom.editorStatus.textContent = this.status;
    this.dom.editorStatus.classList.toggle("is-ready", this.status === "Ready");
    this.dom.editorStatus.classList.toggle("is-error", /failed|unsupported/i.test(this.status));
    if (this.dom.showColliders) this.dom.showColliders.checked = colliderSummary.visible;
    this.updateHandoffUi();

    this.dom.objectList.innerHTML = "";
    const levelRow = document.createElement("button");
    levelRow.type = "button";
    levelRow.className = [
      "editor-object-row",
      "editor-level-note-row",
      !this.selectedId ? "is-selected" : "",
      levelMeta.note.trim() ? "is-noted" : ""
    ].filter(Boolean).join(" ");
    levelRow.dataset.editorLevelNote = "true";
    levelRow.innerHTML = `
      <span class="object-name">Map Notes</span>
      <span class="object-meta">${this.level?.name || "Level"} / overall level${levelMeta.note.trim() ? " / note" : ""}</span>
    `;
    this.dom.objectList.appendChild(levelRow);

    this.visibleRecords.forEach((record) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = [
        "editor-object-row",
        record.id === this.selectedId ? "is-selected" : "",
        dirtyIds.has(record.id) ? "is-dirty" : "",
        notedIds.has(record.id) ? "is-noted" : "",
        deleteIds.has(record.id) ? "is-delete" : "",
        replaceIds.has(record.id) ? "is-replace" : "",
        record.readOnly ? "is-readonly" : "",
        record.locked ? "is-locked" : "",
        record.movable ? "is-movable" : "",
        record.tileKind ? `is-tile-${record.tileKind}` : ""
      ].filter(Boolean).join(" ");
      const metaFlags = [
        dirtyIds.has(record.id) ? "changed" : "",
        notedIds.has(record.id) ? "note" : "",
        deleteIds.has(record.id) ? "delete" : "",
        replaceIds.has(record.id) ? "replace" : "",
        record.movable ? "movable" : "",
        record.locked ? "locked" : "",
        record.readOnly && !record.locked ? "read-only" : ""
      ].filter(Boolean).join(" / ");
      row.dataset.editorObjectId = record.id;
      row.innerHTML = `
        <span class="object-name">${record.name}</span>
        <span class="object-meta">${record.category} / ${record.assetKey || "generated"}${record.tileKind ? ` / ${record.tileKind}` : ""}${metaFlags ? ` / ${metaFlags}` : ""}</span>
      `;
      this.dom.objectList.appendChild(row);
    });

    if (this.visibleRecords.length === 0) {
      const empty = document.createElement("div");
      empty.className = "editor-object-empty";
      empty.textContent = "No objects match the current filters.";
      this.dom.objectList.appendChild(empty);
    }

    if (!selected) {
      this.dom.selectionSummary.textContent = `Map Notes / ${this.level?.name || this.level?.id || "Level"}`;
      this.dom.transformReadout.innerHTML = `
        <div><span>Selection</span><code>Overall level</code></div>
        <div><span>Transforms</span><code>No object selected</code></div>
      `;
      this.dom.resetSelected.disabled = true;
      this.dom.resetLevel.disabled = !this.level;
      this.dom.markDelete.disabled = true;
      this.dom.markDelete.classList.remove("is-active");
      this.dom.markDelete.textContent = "Mark Delete";
      this.dom.markReplace.disabled = true;
      this.dom.markReplace.classList.remove("is-active");
      this.dom.markReplace.textContent = "Mark Replace";
      if (this.dom.noteLabel) this.dom.noteLabel.textContent = "Level Note";
      this.dom.objectNote.disabled = false;
      this.dom.objectNote.placeholder = "Type @ for map intents or # for references";
      if (document.activeElement !== this.dom.objectNote || this.dom.objectNote.value !== levelMeta.note) {
        this.dom.objectNote.value = levelMeta.note;
      }
      this.dom.saveNote.disabled = false;
      this.dom.copyNote.disabled = !levelMeta.note.trim();
      this.dom.clearNote.disabled = !levelMeta.note.trim();
      this.renderColliderReadout(null, colliderSummary);
    } else {
      const transform = snapshotTransform(transformTargetForRecord(selected));
      this.dom.selectionSummary.textContent = `${selected.name} / ${selected.id}`;
      const sourceLabel = selected.sourceRef
        ? `${selected.sourceRef.exportName}:${selected.sourceRef.path}`
        : "manual review";
      const statusLabel = selected.locked
        ? `locked: ${selected.lockReason || "movement disabled"}`
        : selected.movable
          ? "movable transform target"
          : selected.readOnly
            ? "read-only handoff target"
            : "editable transform target";
      this.dom.transformReadout.innerHTML = `
        <div><span>Position</span><code>${this.formatAxes(transform.position)}</code></div>
        <div><span>Rotation</span><code>${this.formatAxes(transform.rotation)}</code></div>
        <div><span>Scale</span><code>${this.formatAxes(transform.scale)}</code></div>
        <div><span>Source</span><code>${sourceLabel}</code></div>
        <div><span>Status</span><code>${statusLabel}</code></div>
        <div><span>Tags</span><code>${(selected.tags || []).join(", ") || "none"}</code></div>
      `;
      this.dom.resetSelected.disabled = !this.recordAllowsTransform(selected);
      this.dom.resetLevel.disabled = false;
      this.dom.markDelete.disabled = false;
      this.dom.markDelete.classList.toggle("is-active", selectedMeta.markedForDelete);
      this.dom.markDelete.textContent = selectedMeta.markedForDelete ? "Unmark Delete" : "Mark Delete";
      this.dom.markReplace.disabled = false;
      this.dom.markReplace.classList.toggle("is-active", selectedMeta.markedForReplace);
      this.dom.markReplace.textContent = selectedMeta.markedForReplace ? "Unmark Replace" : "Mark Replace";
      if (this.dom.noteLabel) this.dom.noteLabel.textContent = "Object Note";
      this.dom.objectNote.disabled = false;
      this.dom.objectNote.placeholder = "Type @ for intents or # for references";
      if (document.activeElement !== this.dom.objectNote || this.dom.objectNote.value !== selectedMeta.note) {
        this.dom.objectNote.value = selectedMeta.note;
      }
      this.dom.saveNote.disabled = false;
      this.dom.copyNote.disabled = !selectedMeta.note.trim();
      this.dom.clearNote.disabled = !selectedMeta.note.trim();
      this.renderColliderReadout(selected, colliderSummary);
    }

    if (this.outputMode === "prompt") this.promptText = buildEditorAiPrompt(stateExport);
    const output =
      this.outputMode === "state"
        ? JSON.stringify(stateExport, null, 2)
        : this.outputMode === "prompt"
          ? this.promptText
          : JSON.stringify(patch, null, 2);
    this.dom.patchOutput.value = output;
    this.updateCameraReadout();
  }

  formatAxes(values) {
    return `x ${values.x.toFixed(3)} / y ${values.y.toFixed(3)} / z ${values.z.toFixed(3)}`;
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  renderColliderReadout(selected, colliderSummary) {
    if (!this.dom.colliderReadout) return;
    const levelCount = colliderSummary?.proxyCount || 0;
    if (!selected) {
      this.dom.colliderReadout.innerHTML = `
        <div><span>Level proxies</span><code>${levelCount}</code></div>
        <div><span>Selected</span><code>No selection</code></div>
      `;
      return;
    }

    const proxies = this.colliderOverlay?.proxySummariesForObject(selected.id) || [];
    const details = proxies.length > 0
      ? proxies.map((proxy) => {
        const review = proxy.manualReview ? " / manual review" : "";
        return `
          <div>
            <span>${this.escapeHtml(proxy.source)}</span>
            <code>${this.escapeHtml(proxy.label)}${review} / half ${this.formatAxes(proxy.halfExtents)}</code>
          </div>
        `;
      }).join("")
      : `<div><span>Selected</span><code>No collider proxy</code></div>`;

    this.dom.colliderReadout.innerHTML = `
      <div><span>Level proxies</span><code>${levelCount}</code></div>
      <div><span>Selected</span><code>${proxies.length}</code></div>
      ${details}
    `;
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

  async copyAiPrompt() {
    const promptText = buildEditorAiPrompt(this.currentStateExport());
    this.outputMode = "prompt";
    this.promptText = promptText;
    this.dom.patchOutput.value = promptText;
    if (!navigator.clipboard?.writeText) {
      this.showToast("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
      this.showToast("AI prompt copied");
    } catch {
      this.showToast("Copy blocked");
    }
  }

  async copyRuntimeHandoff() {
    const payload = this.handoff || {
      request: this.handoffRequest,
      message: this.handoffMessage
    };
    const handoffText = JSON.stringify(payload, null, 2);
    console.log(handoffText);
    this.dom.patchOutput.value = handoffText;
    if (!navigator.clipboard?.writeText) {
      this.showToast("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(handoffText);
      this.showToast("Handoff copied");
    } catch {
      this.showToast("Copy blocked");
    }
  }

  playInGame() {
    const target = new URL("/", window.location.href);
    target.searchParams.set("debugScene", this.activeAdapter?.playDebugScene || this.level?.id || "level_two");
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
    const colliderSummary = this.colliderOverlay?.summary(this.selectedId) || {
      visible: false,
      proxyCount: 0,
      selectedProxyCount: 0,
      selectedColliderLabels: []
    };
    const levelMeta = this.selectedLevelMeta();
    const activeMeta = this.activeNoteMeta();
    const activeNoteReferences = extractNoteReferenceTokens(activeMeta.note);
    const terrainSelectableCount = this.records.filter((record) => record.category?.startsWith("terrain")).length;
    const filterData = this.currentObjectFilterData();
    const assetFilterData = this.currentAssetFilterData();
    const selected = this.selectedRecord();
    return {
      mode: "level-editor",
      ready: this.isReady,
      status: this.status,
      levelId: this.level?.id || null,
      supportedLevelIds: getSupportedLevelIds(),
      objectCount: this.records.length,
      visibleObjectCount: filterData.visibleObjectCount,
      hiddenObjectCount: filterData.hiddenObjectCount,
      objectFilter: this.currentObjectFilterSummary(filterData),
      activePanelTab: this.activePanelTab,
      visibleAssetCount: assetFilterData.visibleAssetCount,
      totalAssetCount: assetFilterData.totalAssetCount,
      visibleExternalAssetCount: assetFilterData.visibleExternalAssetCount,
      totalExternalAssetCount: assetFilterData.totalExternalAssetCount,
      visibleProjectAssetCount: assetFilterData.visibleProjectAssetCount,
      totalProjectAssetCount: assetFilterData.totalProjectAssetCount,
      selectedAssetKey: this.selectedAssetKey || null,
      selectedAssetSourceScope: this.selectedAsset()?.sourceScope || null,
      selectedExternalAssetToken: this.selectedAsset()?.sourceScope === "external" ? referenceTokenForAsset(this.selectedAsset()) : null,
      selectedObjectReferenceToken: selected ? referenceTokenForObject(selected) : null,
      selectedAssetReferenceToken: this.selectedAsset() ? referenceTokenForAsset(this.selectedAsset()) : null,
      assetSourceScope: assetFilterData.state.sourceScope,
      selectedPackFilter: assetFilterData.state.packName,
      selectedFolderFilter: assetFilterData.state.folderPath,
      placementEnabled: false,
      assetFilter: this.currentAssetFilterSummary(assetFilterData),
      terrainSelectableCount,
      elevatedTileCount: this.records.filter((record) => record.tileKind === "elevated").length,
      movableTileCount: this.records.filter((record) => record.type === "tile" && record.movable).length,
      lockedTileCount: this.records.filter((record) => record.type === "tile" && record.locked).length,
      selectionMode: this.selectedId ? "object" : this.selectionMode,
      selectedId: this.selectedId || null,
      dirtyCount: patch.objects.length,
      affectedCount: stateExport.affectedObjectCount,
      affectedItemCount: stateExport.affectedItemCount,
      notedCount: stateExport.noteCount,
      levelNoteCount: stateExport.levelNoteCount,
      totalNoteCount: stateExport.totalNoteCount,
      levelNoteAvailable: true,
      levelNoteTags: levelMeta.noteTags,
      levelNoteReferences: stateExport.levelNoteReferences || [],
      levelNotePresent: Boolean(levelMeta.note.trim()),
      deleteCount: stateExport.deleteCount,
      replaceCount: stateExport.replaceCount,
      activeNoteTags: activeMeta.noteTags,
      activeNoteReferences,
      noteReferenceTypeaheadAvailable: Boolean(this.dom.noteIntentSuggestions),
      activeNoteTypeahead: this.noteTypeahead.open
        ? {
          trigger: this.noteTypeahead.trigger || this.noteTypeahead.query?.trigger || "",
          query: this.noteTypeahead.query?.query || "",
          suggestionCount: this.noteTypeahead.suggestions.length,
          activeToken: this.noteTypeahead.suggestions[this.noteTypeahead.activeIndex]?.token ||
            this.noteTypeahead.suggestions[this.noteTypeahead.activeIndex]?.tag ||
            null
        }
        : null,
      noteReferenceCount: stateExport.referenceCount || 0,
      objectNoteReferenceCount: stateExport.objectNoteReferenceCount || 0,
      levelNoteReferenceCount: stateExport.levelNoteReferenceCount || 0,
      typeaheadAvailable: Boolean(this.dom.noteIntentSuggestions),
      exportTooltipsAvailable: Boolean(
        this.dom.copyPatch?.dataset.tooltip &&
        this.dom.copyState?.dataset.tooltip &&
        this.dom.copyPrompt?.dataset.tooltip
      ),
      collidersVisible: colliderSummary.visible,
      colliderProxyCount: colliderSummary.proxyCount,
      selectedColliderProxyCount: colliderSummary.selectedProxyCount,
      selectedColliderLabels: colliderSummary.selectedColliderLabels,
      selectedMeta: this.selectedId ? this.selectedMeta() : null,
      selectedReadOnly: selected?.readOnly || false,
      selectedMovable: selected?.movable || false,
      selectedLocked: selected?.locked || false,
      selectedLockReason: selected?.lockReason || "",
      selectedTileKind: selected?.tileKind || "",
      selectedHiddenByFilters: filterData.selectedHidden,
      transformControlsAttached: Boolean(this.transformControls?.object),
      handoff: {
        requested: Boolean(this.handoffRequest),
        loaded: Boolean(this.handoff),
        sceneId: this.handoff?.sceneId || this.handoffRequest?.sceneId || null,
        selectedEntityId: this.handoff?.selectedEntityId || this.handoffRequest?.entityId || null,
        matchedId: this.handoffMatchedId || null,
        message: this.handoffMessage || ""
      },
      camera: this.cameraController?.state() || null,
      timeline: summarizeEditorTimeline(this.timeline),
      assetCatalog: summarizeEditorAssetCatalog(this.assetCatalog, {
        selectedAsset: this.selectedAsset(),
        filter: this.currentAssetFilterSummary(assetFilterData)
      }),
      patch: summarizeEditorPatch(patch),
      stateExport: summarizeEditorStateExport(stateExport)
    };
  }
}
