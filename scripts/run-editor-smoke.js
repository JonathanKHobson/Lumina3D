import { formatJson, launchGameBrowser, waitForGameReady, waitForScenePlayPhase } from "./lib/cli-utils.js";

const DEFAULT_EDITOR_URL = process.env.LUMINA3D_EDITOR_URL ||
  (process.env.LUMINA3D_URL ? new URL("/editor/", process.env.LUMINA3D_URL).href : "http://127.0.0.1:5178/editor/");
const USAGE_TEXT = "node scripts/run-editor-smoke.js [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:run-editor-smoke -- --pretty\n  LUMINA3D_EDITOR_URL=http://127.0.0.1:5179/editor/ npm run tools:run-editor-smoke -- --pretty`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function hasUnexpectedFlag(args) {
  const knownFlags = new Set(["--pretty", "--no-headless", "--help", "-h"]);
  return args.some((arg) => arg.startsWith("--") && !knownFlags.has(arg));
}

function hasUnknownShortFlag(args) {
  return args.some((arg) => /^-[^-]$/.test(arg) && arg !== "-h");
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    pretty: args.includes("--pretty"),
    headless: !args.includes("--no-headless")
  };
}

async function readEditorState(page) {
  return page.evaluate(() => {
    if (typeof window.render_editor_to_text !== "function") return null;
    try {
      return JSON.parse(window.render_editor_to_text());
    } catch {
      return null;
    }
  });
}

async function waitForEditorReady(page, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const state = await readEditorState(page);
    if (state?.ready) return state;
    await page.waitForTimeout(100);
  }
  throw new Error("Timed out waiting for render_editor_to_text().ready");
}

function check(name, pass, details) {
  return { name, pass: Boolean(pass), details };
}

async function run() {
  const args = process.argv.slice(2);
  if (isHelp(args)) {
    console.log(HELP_TEXT);
    return;
  }
  if (hasUnexpectedFlag(args) || hasUnknownShortFlag(args)) {
    throw new Error(`Unexpected flag. Usage: ${USAGE_TEXT}`);
  }

  const parsed = parseArgs();
  const { browser, page } = await launchGameBrowser({
    headless: parsed.headless,
    url: DEFAULT_EDITOR_URL
  });

  try {
    const initialState = await waitForEditorReady(page);
    const baselineLevelIds = ["tutorial", "home_intro", "level_one", "level_two"];
    const expectedLevelIds = [...new Set([
      ...baselineLevelIds,
      ...(Array.isArray(initialState?.supportedLevelIds) ? initialState.supportedLevelIds : [])
    ])];
    await page.evaluate(() => {
      Object.keys(window.localStorage)
        .filter((key) => (
          key.startsWith("lumina3d.editor.objectMeta.v1:") ||
          key.startsWith("lumina3d.editor.levelMeta.v1:") ||
          key.startsWith("lumina3d.editor.draftPlacements.v1:") ||
          key === "lumina3d.editor.objectFilters.v1"
        ))
        .forEach((key) => window.localStorage.removeItem(key));
      const app = window.__luminaEditorApp;
      app.objectMeta = {};
      app.levelMeta = { note: "", noteTags: [], updatedAt: "" };
      app.draftPlacements = [];
      app.rebuildDraftPlacementRecords();
      app.records = [...app.sourceRecords, ...app.draftRecords];
      app.rebuildColliderOverlay();
      app.objectFilterState = { query: "", activeFilter: "all", hideBaseGround: true };
      app.updateUi();
    });
    const levelOptions = await page.$$eval("#levelSelect option", (options) => (
      options.map((option) => option.value)
    ));
    const levelSwitchResults = await page.evaluate((levelIds) => {
      const app = window.__luminaEditorApp;
      return levelIds.map((levelId) => {
        app.loadLevel(levelId);
        return {
          levelId,
          loadedLevelId: app.level?.id || null,
          objectCount: app.records.length,
          selectedId: app.selectedId || null
        };
      });
    }, expectedLevelIds);
    const tutorialBarrierParity = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("tutorial");
      const barrier = app.records.find((record) => (
        record.id.startsWith("tutorial.terrain.barrier.") &&
        !record.id.includes("barrier_cap") &&
        !record.tags?.includes("button-gated")
      ));
      const doorBarrier = app.records.find((record) => (
        record.id.startsWith("tutorial.terrain.barrier.") &&
        record.tags?.includes("button-gated")
      ));
      const endCaps = app.records.filter((record) => record.id.startsWith("tutorial.terrain.barrier_cap."));
      if (barrier) app.selectObject(barrier.id);
      const fixedProxy = app.level?.colliderProxies?.find((proxy) => proxy.ownerId === barrier?.id && proxy.rotationYFromOwner);
      const selectedId = app.selectedId || "";
      const selectedReadOnly = barrier?.readOnly === true;
      const transformControlsAttached = Boolean(app.transformControls?.object);
      if (doorBarrier) app.selectObject(doorBarrier.id);
      const doorProxy = app.level?.colliderProxies?.find((proxy) => (
        proxy.ownerId === doorBarrier?.id &&
        proxy.rotationYFromOwner &&
        proxy.metadata?.clearedBy === "tutorial.blue_button"
      ));
      return {
        barrierId: barrier?.id || "",
        barrierRotationY: barrier?.object?.rotation?.y || 0,
        selectedId,
        selectedReadOnly,
        transformControlsAttached,
        doorBarrierId: doorBarrier?.id || "",
        doorBarrierName: doorBarrier?.name || "",
        doorBarrierRotationY: doorBarrier?.object?.rotation?.y || 0,
        doorBarrierVisible: doorBarrier?.object?.visible === true,
        doorBarrierReadOnly: doorBarrier?.readOnly === true,
        doorBarrierLocked: doorBarrier?.locked === true,
        doorBarrierSelectedId: app.selectedId || "",
        doorBarrierTransformControlsAttached: Boolean(app.transformControls?.object),
        doorBarrierProxy: Boolean(doorProxy),
        doorBarrierClearedBy: doorProxy?.metadata?.clearedBy || "",
        endCapCount: endCaps.length,
        endCapRotationYs: endCaps.map((record) => record.object.rotation.y),
        rotationAwareProxy: Boolean(fixedProxy)
      };
    });
    const levelOneCrossingParity = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_one");
      const lilyPadRecord = app.records.find((record) => record.id === "level_one.lily_pad");
      const leftMatRecord = app.records.find((record) => record.id === "level_one.blue_bloom_mat.left");
      const rightMatRecord = app.records.find((record) => record.id === "level_one.blue_bloom_mat.right");
      const latchRecord = app.records.find((record) => record.id === "level_one.blue_bloom_latch");
      const oldBridgeRecords = app.records.filter((record) => record.id.includes("partial_bridge") || record.id.includes("complete_bridge"));
      const pathRecords = app.records.filter((record) => record.id.startsWith("level_one.terrain.path."));
      const representativePathRecord = app.records.find((record) => record.id === "level_one.terrain.path.0.4") ||
        app.records.find((record) => record.id === "level_one.terrain.path.3.5") ||
        pathRecords[0] ||
        null;
      const loveLetterRecord = app.records.find((record) => record.id === "level_one.love_letter_spellbook");
      if (lilyPadRecord) app.selectObject(lilyPadRecord.id);
      const lilyPadSelectedState = JSON.parse(window.render_editor_to_text());
      if (representativePathRecord) app.selectObject(representativePathRecord.id);
      const pathSelectedState = JSON.parse(window.render_editor_to_text());
      if (loveLetterRecord) app.selectObject(loveLetterRecord.id);
      const loveLetterSelectedState = JSON.parse(window.render_editor_to_text());
      return {
        oldBridgeRecordCount: oldBridgeRecords.length,
        lilyPadRecordId: lilyPadRecord?.id || "",
        lilyPadAssetKey: lilyPadRecord?.assetKey || "",
        lilyPadCategory: lilyPadRecord?.category || "",
        lilyPadLocked: lilyPadRecord?.locked === true,
        lilyPadReadOnly: lilyPadRecord?.readOnly === true,
        lilyPadSelected: lilyPadSelectedState?.selectedId === lilyPadRecord?.id,
        lilyPadTransformControlsAttached: lilyPadSelectedState?.transformControlsAttached === true,
        lilyPadSourceExport: lilyPadRecord?.sourceRef?.exportName || "",
        leftMatRecordId: leftMatRecord?.id || "",
        leftMatSourceExport: leftMatRecord?.sourceRef?.exportName || "",
        leftMatSourcePath: leftMatRecord?.sourceRef?.path || "",
        rightMatRecordId: rightMatRecord?.id || "",
        rightMatSourceExport: rightMatRecord?.sourceRef?.exportName || "",
        rightMatSourcePath: rightMatRecord?.sourceRef?.path || "",
        latchRecordId: latchRecord?.id || "",
        latchSourceExport: latchRecord?.sourceRef?.exportName || "",
        pathRecordCount: pathRecords.length,
        pathRecordIds: pathRecords.map((record) => record.id),
        representativePathId: representativePathRecord?.id || "",
        representativePathAssetKey: representativePathRecord?.assetKey || "",
        representativePathCategory: representativePathRecord?.category || "",
        representativePathTileKind: representativePathRecord?.tileKind || "",
        representativePathLocked: representativePathRecord?.locked === true,
        representativePathReadOnly: representativePathRecord?.readOnly === true,
        representativePathSelected: pathSelectedState?.selectedId === representativePathRecord?.id,
        representativePathTransformControlsAttached: pathSelectedState?.transformControlsAttached === true,
        loveLetterRecordId: loveLetterRecord?.id || "",
        loveLetterAssetKey: loveLetterRecord?.assetKey || "",
        loveLetterCategory: loveLetterRecord?.category || "",
        loveLetterLocked: loveLetterRecord?.locked === true,
        loveLetterReadOnly: loveLetterRecord?.readOnly === true,
        loveLetterSelected: loveLetterSelectedState?.selectedId === loveLetterRecord?.id,
        loveLetterTransformControlsAttached: loveLetterSelectedState?.transformControlsAttached === true,
        loveLetterSourceFile: loveLetterRecord?.sourceRef?.file || "",
        loveLetterSourceExport: loveLetterRecord?.sourceRef?.exportName || ""
      };
    });
    await page.evaluate(() => window.__luminaEditorApp.loadLevel("level_two"));
    await waitForEditorReady(page);
    const objectFilterCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const elevated = app.records.find((record) => record.tileKind === "elevated" && record.movable);
      const base = app.records.find((record) => record.tileKind === "base_ground" || record.tileKind === "base_path");
      const prop = app.records.find((record) => record.type === "prop");
      app.updateObjectFilters({ query: "", activeFilter: "all", hideBaseGround: true });
      const defaultState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: elevated?.id ? `id:${elevated.id}` : "", activeFilter: "all", hideBaseGround: true });
      const idSearchState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "tag:elevated", activeFilter: "all", hideBaseGround: true });
      const tagSearchState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "movable", hideBaseGround: true });
      const movableFilterState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "locked", hideBaseGround: false });
      const lockedFilterState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "props", hideBaseGround: true });
      const propsFilterState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "elevated", hideBaseGround: true });
      const elevatedFilterState = JSON.parse(window.render_editor_to_text());
      if (base) app.selectObject(base.id);
      app.updateObjectFilters({ query: "", activeFilter: "all", hideBaseGround: true });
      const selectedHiddenState = JSON.parse(window.render_editor_to_text());
      app.revealSelectedInObjectList();
      const revealState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "all", hideBaseGround: true });
      return {
        elevatedId: elevated?.id || "",
        baseId: base?.id || "",
        propId: prop?.id || "",
        defaultState,
        idSearchState,
        tagSearchState,
        movableFilterState,
        lockedFilterState,
        propsFilterState,
        elevatedFilterState,
        selectedHiddenState,
        revealState
      };
    });
    const levelThreePrepCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_three");
      const requiredIds = [
        "level_three.level3StartIsland",
        "level_three.level3FrogLaneStart",
        "level_three.level3TotemWinchIsland",
        "level_three.level3CenterHub",
        "level_three.level3TotemGreenButton",
        "level_three.level3TotemRaft",
        "level_three.level3CrocodileEcho",
        "level_three.level3BridgeGreenButton",
        "level_three.level3AnchorStone1",
        "level_three.level3RedButtonB",
        "level_three.level3LoveLetterCliff",
        "level_three.love_letter.placeholder"
      ];
      const records = requiredIds.map((id) => app.records.find((record) => record.id === id) || null);
      const movableRecords = records.filter(Boolean).filter((record) => record.id !== "level_three.love_letter.placeholder");
      const selectedId = "level_three.level3TotemGreenButton";
      app.selectObject(selectedId);
      const selectedState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "tag:level-three", activeFilter: "movable", hideBaseGround: true });
      const movableFilterState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "level3CrocodileEcho", activeFilter: "all", hideBaseGround: true });
      const searchState = JSON.parse(window.render_editor_to_text());
      app.updateObjectFilters({ query: "", activeFilter: "all", hideBaseGround: true });
      return {
        requiredIds,
        foundIds: records.filter(Boolean).map((record) => record.id),
        missingIds: requiredIds.filter((id, index) => !records[index]),
        movableIds: movableRecords.filter((record) => record.movable === true && record.locked === false).map((record) => record.id),
        sourceBackedIds: movableRecords.filter((record) => record.sourceBacked === true).map((record) => record.id),
        selectedId,
        selectedState,
        movableFilterState,
        searchState
      };
    });
    const assetCatalogCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.selectObject("level_two.blue_ramp");
      app.setPanelTab("assets");
      app.updateAssetFilters({ query: "ramp", activeFilter: "all" });
      const rampState = JSON.parse(window.render_editor_to_text());
      const rampAssets = app.currentAssetFilterData().visibleRecords.map((record) => record.assetKey);
      app.updateAssetFilters({ query: "", activeFilter: "button" });
      const buttonState = JSON.parse(window.render_editor_to_text());
      const buttonAssets = app.currentAssetFilterData().visibleRecords.map((record) => record.assetKey);
      app.updateAssetFilters({ query: "", activeFilter: "terrain" });
      const terrainState = JSON.parse(window.render_editor_to_text());
      const terrainAssets = app.currentAssetFilterData().visibleRecords.map((record) => record.assetKey);
      app.updateAssetFilters({
        query: "lily",
        activeFilter: "all",
        sourceScope: "procedural",
        packName: "all",
        folderPath: "all"
      });
      const proceduralState = JSON.parse(window.render_editor_to_text());
      const proceduralAssets = app.currentAssetFilterData().visibleRecords.map((record) => record.assetKey);
      app.updateAssetFilters({ query: "", activeFilter: "all" });
      app.selectAsset("blueRamp");
      const selectedAssetWithObject = JSON.parse(window.render_editor_to_text());
      const stateExportWithAsset = app.currentStateExport();
      app.clearSelection();
      app.selectAsset("buttonBaseBlue");
      const selectedAssetWithoutObject = JSON.parse(window.render_editor_to_text());
      return {
        rampState,
        rampAssets,
        buttonState,
        buttonAssets,
        terrainState,
        terrainAssets,
        proceduralState,
        proceduralAssets,
        selectedAssetWithObject,
        selectedAssetWithoutObject,
        stateExportWithAsset
      };
    });
    const externalAssetCatalogCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.setPanelTab("assets");
      const filtersCollapsed = {
        object: document.querySelector("#objectFilterDisclosure")?.open === false,
        asset: document.querySelector("#assetFilterDisclosure")?.open === false
      };
      app.updateAssetFilters({
        query: "bridge",
        activeFilter: "all",
        sourceScope: "external",
        packName: "all",
        folderPath: "all"
      });
      const bridgeState = JSON.parse(window.render_editor_to_text());
      const bridgeRecords = app.currentAssetFilterData().visibleRecords;
      const bridgeAsset = bridgeRecords.find((record) => record.assetKey.includes("bridge")) || bridgeRecords[0] || null;
      const kaykitBridgePack = bridgeAsset?.packName || app.assetCatalog.records.find((record) => (
        record.sourceScope === "external" &&
        record.provider === "Kaykits" &&
        record.packName?.includes("Kaykits /")
      ))?.packName || "all";
      app.updateAssetFilters({
        query: "",
        activeFilter: "all",
        sourceScope: "external",
        packName: kaykitBridgePack,
        folderPath: "all"
      });
      const packState = JSON.parse(window.render_editor_to_text());
      const folder = app.currentAssetFilterData().visibleRecords.find((record) => record.folderPath)?.folderPath || "all";
      app.updateAssetFilters({ folderPath: folder });
      const folderState = JSON.parse(window.render_editor_to_text());
      app.updateAssetFilters({
        query: "",
        activeFilter: "all",
        sourceScope: "external",
        packName: "Cubeling Pack / Animals",
        folderPath: "all"
      });
      const cubelingState = JSON.parse(window.render_editor_to_text());
      app.updateAssetFilters({
        query: "bridge",
        activeFilter: "all",
        sourceScope: "external",
        packName: "all",
        folderPath: "all"
      });
      if (bridgeAsset) app.selectAsset(bridgeAsset.assetKey);
      app.clearSelection();
      app.setPanelTab("assets");
      app.dom.objectNote.value = "#bridge";
      app.dom.objectNote.focus();
      app.dom.objectNote.setSelectionRange(app.dom.objectNote.value.length, app.dom.objectNote.value.length);
      app.updateSelectedNote(app.dom.objectNote.value);
      app.updateNoteTypeahead();
      return {
        filtersCollapsed,
        bridgeState,
        bridgeAssets: bridgeRecords.slice(0, 6).map((record) => ({
          assetKey: record.assetKey,
          sourceScope: record.sourceScope,
          packName: record.packName,
          folderPath: record.folderPath
        })),
        selectedExternalAssetKey: bridgeAsset?.assetKey || "",
        selectedExternalAssetToken: bridgeAsset ? `#${bridgeAsset.assetKey}` : "",
        packState,
        folder,
        folderState,
        cubelingState,
        typeahead: {
          open: app.noteTypeahead.open,
          trigger: app.noteTypeahead.trigger,
          activeToken: app.noteTypeahead.suggestions[app.noteTypeahead.activeIndex]?.token || "",
          tokens: app.noteTypeahead.suggestions.map((suggestion) => suggestion.token)
        },
        renderState: JSON.parse(window.render_editor_to_text())
      };
    });
    await page.keyboard.press("Enter");
    const externalAssetReferenceInsertCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const stateExport = app.currentStateExport();
      app.outputMode = "prompt";
      app.updateUi();
      const prompt = app.dom.patchOutput.value;
      const externalToken = Object.keys(stateExport.referenceGlossary || {})
        .find((token) => token.startsWith("#external."));
      return {
        note: app.selectedLevelMeta().note,
        externalToken,
        reference: externalToken ? stateExport.referenceGlossary[externalToken] : null,
        renderState: JSON.parse(window.render_editor_to_text()),
        promptIncludesExternalInstruction: prompt.includes("External asset references are metadata-only")
      };
    });
    const editorBuildIntentCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.setPanelTab("assets");
      app.selectAsset("blueRamp");
      const patchBeforeDraft = app.currentPatch();
      app.placeSelectedAssetGhost();
      const ghostRecord = app.selectedRecord();
      if (ghostRecord) {
        ghostRecord.object.position.x += 0.75;
        app.updateSelectionHelpers();
        app.updateUi();
      }
      const ghostState = JSON.parse(window.render_editor_to_text());
      const ghostStateExport = app.currentStateExport();
      const ghostDraft = ghostStateExport.draftPlacements?.find((draft) => draft.assetKey === "blueRamp") || null;
      const externalAsset = app.assetCatalog.records.find((record) => (
        record.sourceScope === "external" &&
        String(record.assetKey || "").includes("bridge")
      )) || app.assetCatalog.records.find((record) => record.sourceScope === "external") || null;
      if (externalAsset) {
        app.selectAsset(externalAsset.assetKey);
        app.placeSelectedAssetGhost();
      }
      const externalStateExport = app.currentStateExport();
      const externalDraft = externalAsset
        ? externalStateExport.draftPlacements?.find((draft) => draft.assetKey === externalAsset.assetKey) || null
        : null;
      app.selectAsset("procedural.lilyPad.tile");
      app.placeSelectedAssetGhost();
      const proceduralState = JSON.parse(window.render_editor_to_text());
      const proceduralStateExport = app.currentStateExport();
      const proceduralDraft = proceduralStateExport.draftPlacements?.find((draft) => (
        draft.assetKey === "procedural.lilyPad.tile"
      )) || null;
      const patchAfterDrafts = app.currentPatch();
      const draftCountBeforeRemove = app.currentStateExport().draftPlacementCount;
      app.selectAsset("buttonBaseBlue");
      app.placeSelectedAssetGhost();
      const removableDraft = app.selectedRecord();
      app.updateSelectedNote("@spawn temporary draft removal check");
      const removableDraftState = JSON.parse(window.render_editor_to_text());
      const removeDraftButtonEnabled = document.querySelector("#removeDraft")?.disabled === false;
      const removeDraftResult = app.removeSelectedDraftPlacement();
      const afterRemoveExport = app.currentStateExport();
      const afterRemoveState = JSON.parse(window.render_editor_to_text());
      const removedDraftStillExists = app.records.some((record) => record.id === removableDraft?.id) ||
        app.draftPlacements.some((draft) => draft.draftId === removableDraft?.id);
      const removedDraftMetaExists = Boolean(app.objectMeta[removableDraft?.id]);

      app.selectObject("level_two.red-elevator-b");
      app.setPanelTab("assets");
      app.selectAsset("blueRamp");
      app.useSelectedAssetAsReplacement();
      const replacementMeta = app.selectedMeta();
      const replacementStateExport = app.currentStateExport();
      const replacementObject = replacementStateExport.objects.find((objectExport) => (
        objectExport.objectId === "level_two.red-elevator-b"
      ));

      app.selectObject("level_two.red-button-b");
      app.setPanelTab("assets");
      app.selectAsset("buttonBaseBlue");
      app.toggleReplaceMark();
      const markReplaceMeta = app.selectedMeta();
      const markReplaceStateExport = app.currentStateExport();
      const markReplaceObject = markReplaceStateExport.objects.find((objectExport) => (
        objectExport.objectId === "level_two.red-button-b"
      ));

      app.outputMode = "prompt";
      app.updateUi();
      const prompt = app.dom.patchOutput.value;

      return {
        patchBeforeDraftCount: patchBeforeDraft.objects.length,
        patchAfterDraftCount: patchAfterDrafts.objects.length,
        ghostState,
        ghostDraft,
        externalAssetKey: externalAsset?.assetKey || "",
        externalDraft,
        proceduralState,
        proceduralDraft,
        removableDraftId: removableDraft?.id || "",
        removableDraftState,
        removeDraftButtonEnabled,
        removeDraftResult,
        draftCountBeforeRemove,
        draftCountAfterRemove: afterRemoveExport.draftPlacementCount,
        afterRemoveState,
        removedDraftStillExists,
        removedDraftMetaExists,
        finalDraftCount: markReplaceStateExport.draftPlacementCount,
        replacementMeta,
        replacementObject,
        markReplaceMeta,
        markReplaceObject,
        promptIncludesDrafts: prompt.includes("draftPlacements"),
        promptIncludesReplacementCandidate: prompt.includes("replacementCandidate")
      };
    });
    const elevatedTileMoveCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const elevated = app.records.find((record) => record.tileKind === "elevated" && record.movable);
      const base = app.records.find((record) => record.tileKind === "base_ground" || record.tileKind === "base_path");
      if (!elevated || !base) return { found: false };
      app.selectObject(elevated.id);
      const elevatedSelectedState = JSON.parse(window.render_editor_to_text());
      const target = elevated.transformTarget || elevated.object;
      target.position.x += 0.25;
      app.updateSelectionHelpers();
      app.updateUi();
      const movedStateExport = app.currentStateExport();
      const movedObject = movedStateExport.objects.find((objectExport) => objectExport.objectId === elevated.id);
      const movedPatchObject = app.currentPatch().objects.find((objectPatch) => objectPatch.objectId === elevated.id);
      target.position.x = elevated.originalTransform.position.x;
      target.position.y = elevated.originalTransform.position.y;
      target.position.z = elevated.originalTransform.position.z;
      target.rotation.x = elevated.originalTransform.rotation.x;
      target.rotation.y = elevated.originalTransform.rotation.y;
      target.rotation.z = elevated.originalTransform.rotation.z;
      target.scale.x = elevated.originalTransform.scale.x;
      target.scale.y = elevated.originalTransform.scale.y;
      target.scale.z = elevated.originalTransform.scale.z;
      app.selectObject(base.id);
      const baseSelectedState = JSON.parse(window.render_editor_to_text());
      return {
        found: true,
        elevatedId: elevated.id,
        elevatedMovable: elevated.movable,
        elevatedLocked: elevated.locked,
        elevatedSelectedState,
        movedObject,
        movedPatchObject,
        baseId: base.id,
        baseMovable: base.movable,
        baseLocked: base.locked,
        baseLockReason: base.lockReason,
        baseSelectedState
      };
    });
    const colliderModeCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.selectObject("level_two.blue_ramp");
      app.setColliderViewMode("walkable");
      const walkableState = JSON.parse(window.render_editor_to_text());
      app.setColliderViewMode("blocking");
      const blockingState = JSON.parse(window.render_editor_to_text());
      app.setColliderViewMode("triggers");
      const triggerState = JSON.parse(window.render_editor_to_text());
      app.setColliderViewMode("problems");
      const problemsState = JSON.parse(window.render_editor_to_text());
      const problemsExport = app.currentStateExport();
      return {
        walkableState,
        blockingState,
        triggerState,
        problemsState,
        diagnostics: problemsExport.colliderDiagnostics
      };
    });
    const terrainSelectionSetup = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const rect = app.canvas.getBoundingClientRect();
      const terrainCandidates = app.records.filter((record) => record.category?.startsWith("terrain"));
      const terrain = terrainCandidates.find((record) => {
        const point = app.canvasPointForObject(record.id);
        if (!point) return false;
        app.pointer.x = (point.x / rect.width) * 2 - 1;
        app.pointer.y = -(point.y / rect.height) * 2 + 1;
        app.raycaster.setFromCamera(app.pointer, app.camera);
        const roots = app.records.map((item) => item.object);
        const hit = app.raycaster.intersectObjects(roots, true)
          .map((intersection) => app.findEditorRoot(intersection.object))
          .find(Boolean);
        return hit?.userData?.editorId === record.id;
      }) || terrainCandidates[0];
      if (!terrain) return { found: false };
      app.selectObject(terrain.id);
      const listSelectionState = JSON.parse(window.render_editor_to_text());
      const point = app.canvasPointForObject(terrain.id);
      app.clearSelection();
      return {
        found: true,
        terrainId: terrain.id,
        readOnly: terrain.readOnly,
        listSelectedId: listSelectionState.selectedId,
        listSelectedReadOnly: listSelectionState.selectedReadOnly,
        transformControlsAttached: listSelectionState.transformControlsAttached,
        clickPoint: point ? { x: rect.left + point.x, y: rect.top + point.y } : null,
        emptyPoint: { x: rect.left + 12, y: rect.bottom - 12 }
      };
    });
    if (terrainSelectionSetup.clickPoint) {
      await page.mouse.click(terrainSelectionSetup.clickPoint.x, terrainSelectionSetup.clickPoint.y);
    }
    const terrainViewportState = await readEditorState(page);
    if (terrainSelectionSetup.emptyPoint) {
      await page.mouse.click(terrainSelectionSetup.emptyPoint.x, terrainSelectionSetup.emptyPoint.y);
    }
    const emptyClickState = await readEditorState(page);
    const levelNoteState = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.dom.objectNote.value = "@collision floor tiles near the ramp feel unclear";
      app.updateSelectedNote(app.dom.objectNote.value);
      app.updateNoteTypeahead();
      const stateExport = app.currentStateExport();
      return {
        renderState: JSON.parse(window.render_editor_to_text()),
        stateExport
      };
    });
    await page.evaluate(() => window.__luminaEditorApp.selectObject("level_two.blue_ramp"));
    await page.check("#showColliders");
    const colliderAfterToggle = await readEditorState(page);
    const colliderMoveCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.selectObject("level_two.blue_ramp");
      const ramp = app.records.find((item) => item.id === "level_two.blue_ramp");
      const beforeProxy = app.colliderOverlay.proxySummariesForObject(ramp.id)[0];
      ramp.object.position.x += 0.5;
      app.updateSelectionHelpers();
      app.updateUi();
      const afterProxy = app.colliderOverlay.proxySummariesForObject(ramp.id)[0];
      ramp.object.position.x = ramp.originalTransform.position.x;
      ramp.object.position.y = ramp.originalTransform.position.y;
      ramp.object.position.z = ramp.originalTransform.position.z;
      ramp.object.rotation.y = ramp.originalTransform.rotation.y;
      app.updateSelectionHelpers();
      app.updateUi();
      app.loadLevel("level_one");
      app.setColliderOverlayVisible(true);
      const levelOneState = JSON.parse(window.render_editor_to_text());
      app.loadLevel("level_two");
      app.setColliderOverlayVisible(true);
      return {
        beforeProxy,
        afterProxy,
        levelOneState,
        restoredState: JSON.parse(window.render_editor_to_text())
      };
    });

    const pitchCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const before = app.cameraController.state().pitch;
      app.cameraController.tiltPitch(1);
      app.updateSelectionHelpers();
      app.updateUi();
      return { before, after: app.cameraController.state().pitch };
    });
    await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.selectObject("level_two.blue_button");
      app.dom.objectNote.value = "@m";
      app.updateSelectedNote("@m");
      app.updateNoteTypeahead();
      app.dom.objectNote.focus();
    });
    const typeaheadBeforeInsert = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      return {
        open: app.noteTypeahead.open,
        suggestions: app.noteTypeahead.suggestions.map((intent) => intent.tag)
      };
    });
    await page.keyboard.press("Enter");
    const typeaheadAfterInsert = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      return {
        note: app.selectedMeta().note,
        noteTags: app.selectedMeta().noteTags,
        open: app.noteTypeahead.open
      };
    });
    const referenceTypeaheadCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.setPanelTab("objects");
      app.selectObject("level_two.blue_button");
      app.dom.objectNote.value = `${app.selectedMeta().note || ""} #blue`.trim();
      app.dom.objectNote.focus();
      app.dom.objectNote.setSelectionRange(app.dom.objectNote.value.length, app.dom.objectNote.value.length);
      app.updateSelectedNote(app.dom.objectNote.value);
      app.updateNoteTypeahead();
      return {
        open: app.noteTypeahead.open,
        trigger: app.noteTypeahead.trigger,
        activeToken: app.noteTypeahead.suggestions[app.noteTypeahead.activeIndex]?.token || "",
        tokens: app.noteTypeahead.suggestions.map((suggestion) => suggestion.token),
        summaries: app.noteTypeahead.suggestions.map((suggestion) => suggestion.summary)
      };
    });
    await page.keyboard.press("Enter");
    const objectReferenceInsertCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const stateExport = app.currentStateExport();
      const objectExport = stateExport.objects.find((item) => item.objectId === "level_two.blue_button");
      return {
        note: app.selectedMeta().note,
        activeNoteReferences: JSON.parse(window.render_editor_to_text()).activeNoteReferences,
        noteReferences: objectExport?.noteReferences || [],
        referenceGlossaryKeys: Object.keys(stateExport.referenceGlossary || {})
      };
    });
    const assetReferenceTypeaheadCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.clearSelection();
      app.setPanelTab("assets");
      app.selectAsset("blueRamp");
      app.dom.objectNote.value = `${app.selectedLevelMeta().note || ""} #ramp`.trim();
      app.dom.objectNote.focus();
      app.dom.objectNote.setSelectionRange(app.dom.objectNote.value.length, app.dom.objectNote.value.length);
      app.updateSelectedNote(app.dom.objectNote.value);
      app.updateNoteTypeahead();
      return {
        open: app.noteTypeahead.open,
        trigger: app.noteTypeahead.trigger,
        activeToken: app.noteTypeahead.suggestions[app.noteTypeahead.activeIndex]?.token || "",
        tokens: app.noteTypeahead.suggestions.map((suggestion) => suggestion.token),
        summaries: app.noteTypeahead.suggestions.map((suggestion) => suggestion.summary)
      };
    });
    await page.keyboard.press("Enter");
    const assetReferenceInsertCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const stateExport = app.currentStateExport();
      app.outputMode = "prompt";
      app.updateUi();
      const prompt = app.dom.patchOutput.value;
      return {
        note: app.selectedLevelMeta().note,
        levelNoteReferences: stateExport.levelNoteReferences || [],
        referenceGlossaryKeys: Object.keys(stateExport.referenceGlossary || {}),
        assetReference: stateExport.referenceGlossary?.["#blueRamp"] || null,
        renderState: JSON.parse(window.render_editor_to_text()),
        promptIncludesReferenceInstruction: prompt.includes("Interpret #... tokens")
      };
    });
    const typeaheadHelpCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.selectObject("level_two.blue_button");
      app.dom.objectNote.value = "@m";
      app.dom.objectNote.focus();
      app.dom.objectNote.setSelectionRange(app.dom.objectNote.value.length, app.dom.objectNote.value.length);
      app.updateNoteTypeahead();
      const option = document.querySelector("#noteIntentSuggestions [data-note-token='@move']");
      return {
        open: app.noteTypeahead.open,
        moveUsage: app.noteTypeahead.suggestions.find((suggestion) => suggestion.token === "@move")?.usage || "",
        moveExample: app.noteTypeahead.suggestions.find((suggestion) => suggestion.token === "@move")?.example || "",
        optionText: option?.textContent || "",
        optionTitle: option?.getAttribute("title") || ""
      };
    });
    const exportTooltipCheck = await page.evaluate(() => ({
      patchTooltip: document.querySelector("#copyPatch")?.dataset.tooltip || "",
      stateTooltip: document.querySelector("#copyState")?.dataset.tooltip || "",
      promptTooltip: document.querySelector("#copyPrompt")?.dataset.tooltip || "",
      renderState: JSON.parse(window.render_editor_to_text())
    }));
    const resizeModeCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.loadLevel("level_two");
      app.selectObject("level_two.blue_ramp");
      document.querySelector("#scaleMode")?.click();
      const record = app.selectedRecord();
      const target = record?.transformTarget || record?.object;
      if (!record || !target) return { found: false };
      const originalScale = {
        x: target.scale.x,
        y: target.scale.y,
        z: target.scale.z
      };
      target.scale.set(originalScale.x + 0.15, originalScale.y + 0.15, originalScale.z + 0.15);
      target.updateMatrixWorld(true);
      app.updateSelectionHelpers();
      app.updateUi();
      const patchObject = app.currentPatch().objects.find((objectPatch) => objectPatch.objectId === record.id);
      const stateObject = app.currentStateExport().objects.find((objectExport) => objectExport.objectId === record.id);
      const renderState = JSON.parse(window.render_editor_to_text());
      const scaleButtonActive = document.querySelector("#scaleMode")?.classList.contains("is-active") === true;
      target.scale.set(originalScale.x, originalScale.y, originalScale.z);
      target.updateMatrixWorld(true);
      app.updateSelectionHelpers();
      app.setTransformMode("translate");
      app.updateUi();
      return {
        found: true,
        objectId: record.id,
        transformMode: renderState.transformMode,
        scaleButtonActive,
        transformControlsAttached: renderState.transformControlsAttached,
        patchScalePaths: patchObject?.changes?.map((change) => change.path).filter((path) => path.startsWith("transform.scale.")) || [],
        stateScalePaths: stateObject?.changes?.map((change) => change.path).filter((path) => path.startsWith("transform.scale.")) || []
      };
    });

    const patchAfterMove = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      if (!app?.records?.length) return null;
      const record = app.records.find((item) => item.id === "level_two.blue_ramp") || app.records[0];
      app.selectObject(record.id);
      record.object.position.x += 0.25;
      record.object.rotation.y += 0.1;
      app.updateSelectionHelpers();
      app.updateUi();
      return app.currentPatch();
    });
    const stateExportAfterEdits = await page.evaluate(() => {
      const app = window.__luminaEditorApp;

      const ramp = app.records.find((item) => item.id === "level_two.blue_ramp");
      app.selectObject(ramp.id);
      ramp.object.position.x = ramp.originalTransform.position.x + 0.25;
      ramp.object.rotation.y = ramp.originalTransform.rotation.y + 0.1;
      app.updateSelectionHelpers();
      app.updateUi();

      app.selectObject("level_two.blue_button");
      app.updateSelectedNote(`${app.selectedMeta().note} Lower this button after @trigger.`);

      app.selectObject("level_two.red-button-a");
      app.toggleDeleteMark();

      app.selectObject("level_two.red-elevator-a");
      app.toggleReplaceMark();

      app.selectObject("level_two.red-button-b");
      app.toggleDeleteMark();
      const deleteThenReplaceMeta = app.selectedMeta();
      app.toggleReplaceMark();
      const replaceAfterDeleteMeta = app.selectedMeta();

      const resetRecord = app.records.find((item) => item.id === "level_two.elephant_echo");
      app.selectObject(resetRecord.id);
      resetRecord.object.position.x += 0.4;
      app.resetSelectedObject();
      const stateExport = app.currentStateExport();
      const resetObject = stateExport.objects.find((objectExport) => objectExport.objectId === resetRecord.id);
      return {
        stateExport,
        resetObjectId: resetRecord.id,
        resetClean: !resetObject,
        deleteThenReplaceMeta,
        replaceAfterDeleteMeta
      };
    });
    const copiedState = await page.evaluate(async () => {
      const app = window.__luminaEditorApp;
      await app.copyEditorState();
      return JSON.parse(app.dom.patchOutput.value);
    });
    const copiedPrompt = await page.evaluate(async () => {
      const app = window.__luminaEditorApp;
      await app.copyAiPrompt();
      return app.dom.patchOutput.value;
    });
    const movedState = await readEditorState(page);
    await page.reload({ waitUntil: "networkidle" });
    await waitForEditorReady(page);
    const persistedMeta = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const levelState = JSON.parse(window.render_editor_to_text());
      app.selectObject("level_two.blue_button");
      const blueButtonMeta = JSON.parse(window.render_editor_to_text()).selectedMeta;
      app.selectObject("level_two.red-button-a");
      const redButtonMeta = JSON.parse(window.render_editor_to_text()).selectedMeta;
      app.selectObject("level_two.red-elevator-a");
      const redElevatorMeta = JSON.parse(window.render_editor_to_text()).selectedMeta;
      return { levelState, blueButtonMeta, redButtonMeta, redElevatorMeta };
    });
    page.once("dialog", (dialog) => dialog.accept());
    const resetLevelCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.selectObject("level_two.blue_ramp");
      const ramp = app.records.find((item) => item.id === "level_two.blue_ramp");
      ramp.object.position.x += 1;
      app.updateSelectedNote("@move temporary reset check");
      app.toggleDeleteMark();
      app.clearSelection();
      app.updateSelectedNote("@collision temporary level note reset check");
      app.resetLevelState();
      const stateExport = app.currentStateExport();
      return {
        selectedId: app.selectedId,
        metaCount: Object.keys(app.objectMeta).length,
        levelNote: app.levelMeta.note,
        affectedObjectCount: stateExport.affectedObjectCount,
        affectedItemCount: stateExport.affectedItemCount,
        dirtyCount: app.currentPatch().objects.length,
        noteCount: stateExport.noteCount,
        levelNoteCount: stateExport.levelNoteCount,
        deleteCount: stateExport.deleteCount,
        replaceCount: stateExport.replaceCount,
        draftPlacementCount: stateExport.draftPlacementCount,
        replacementCandidateCount: stateExport.replacementCandidateCount,
        problemWarningCount: stateExport.colliderDiagnostics?.problemWarningCount || 0
      };
    });
    await page.evaluate(() => window.__luminaEditorApp.loadLevel("level_one"));
    const [gamePage] = await Promise.all([
      page.context().waitForEvent("page"),
      page.click("#playInGame")
    ]);
    await waitForGameReady(gamePage);
    const gameState = await waitForScenePlayPhase(gamePage, "level_one");
    await gamePage.close();
    const dirtyObject = patchAfterMove?.objects?.find((objectPatch) => objectPatch.changes?.length > 0) || null;
    const stateObjects = stateExportAfterEdits?.stateExport?.objects || [];
    const stateRamp = stateObjects.find((objectExport) => objectExport.objectId === "level_two.blue_ramp");
    const stateNote = stateObjects.find((objectExport) => objectExport.objectId === "level_two.blue_button");
    const stateDelete = stateObjects.find((objectExport) => objectExport.objectId === "level_two.red-button-a");
    const stateReplace = stateObjects.find((objectExport) => objectExport.objectId === "level_two.red-elevator-a");
    const stateMutualReplace = stateObjects.find((objectExport) => objectExport.objectId === "level_two.red-button-b");
    const levelNoteExport = levelNoteState?.stateExport || {};
    const checks = [
      check("render_hook", Boolean(initialState), "window.render_editor_to_text() returned JSON"),
      check("mode", initialState?.mode === "level-editor", `mode=${initialState?.mode || "missing"}`),
      check("level_picker_options", expectedLevelIds.every((id) => levelOptions.includes(id)), `options=${levelOptions.join(",")}`),
      check("supported_level_ids", baselineLevelIds.every((id) => initialState?.supportedLevelIds?.includes(id)), `supported=${initialState?.supportedLevelIds?.join(",") || "missing"}`),
      check("level_switching", levelSwitchResults.every((entry) => entry.loadedLevelId === entry.levelId && entry.objectCount > 0), formatJson(levelSwitchResults)),
      check(
        "tutorial_barrier_rotation_parity",
        Math.abs((tutorialBarrierParity?.barrierRotationY || 0) - (Math.PI / 2)) < 0.001,
        `id=${tutorialBarrierParity?.barrierId || "missing"} rotationY=${tutorialBarrierParity?.barrierRotationY}`
      ),
      check(
        "tutorial_barrier_end_caps",
        tutorialBarrierParity?.endCapCount === 2 &&
          tutorialBarrierParity?.endCapRotationYs?.some((rotationY) => Math.abs(rotationY - (Math.PI / 2)) < 0.001) &&
          tutorialBarrierParity?.endCapRotationYs?.some((rotationY) => Math.abs(rotationY + (Math.PI / 2)) < 0.001),
        formatJson(tutorialBarrierParity || {})
      ),
      check(
        "tutorial_barrier_read_only_selection",
        tutorialBarrierParity?.selectedId === tutorialBarrierParity?.barrierId &&
          tutorialBarrierParity?.selectedReadOnly === true &&
          tutorialBarrierParity?.transformControlsAttached === false &&
          tutorialBarrierParity?.rotationAwareProxy === true,
        formatJson(tutorialBarrierParity || {})
      ),
      check(
        "tutorial_button_gated_barrier_present",
        tutorialBarrierParity?.doorBarrierId &&
          tutorialBarrierParity?.doorBarrierName?.includes("Button-Gated") &&
          tutorialBarrierParity?.doorBarrierVisible === true &&
          Math.abs((tutorialBarrierParity?.doorBarrierRotationY || 0) - (Math.PI / 2)) < 0.001,
        formatJson(tutorialBarrierParity || {})
      ),
      check(
        "tutorial_button_gated_barrier_read_only_selection",
        tutorialBarrierParity?.doorBarrierSelectedId === tutorialBarrierParity?.doorBarrierId &&
          tutorialBarrierParity?.doorBarrierReadOnly === true &&
          tutorialBarrierParity?.doorBarrierLocked === true &&
          tutorialBarrierParity?.doorBarrierTransformControlsAttached === false &&
          tutorialBarrierParity?.doorBarrierProxy === true &&
          tutorialBarrierParity?.doorBarrierClearedBy === "tutorial.blue_button",
        formatJson(tutorialBarrierParity || {})
      ),
      check(
        "level_one_old_bridge_records_removed",
        levelOneCrossingParity?.oldBridgeRecordCount === 0,
        formatJson(levelOneCrossingParity || {})
      ),
      check(
        "level_one_blue_bloom_crossing_preview_records",
        levelOneCrossingParity?.lilyPadRecordId === "level_one.lily_pad" &&
          levelOneCrossingParity?.lilyPadAssetKey === "generatedLilyPad" &&
          levelOneCrossingParity?.lilyPadCategory === "crossing_surface" &&
          levelOneCrossingParity?.lilyPadSelected === true &&
          levelOneCrossingParity?.lilyPadReadOnly === true &&
          levelOneCrossingParity?.lilyPadLocked === true &&
          levelOneCrossingParity?.lilyPadTransformControlsAttached === false &&
          levelOneCrossingParity?.lilyPadSourceExport === "LEVEL_ONE_LILY_PAD",
        formatJson(levelOneCrossingParity || {})
      ),
      check(
        "level_one_blue_bloom_mat_latch_records",
        levelOneCrossingParity?.leftMatRecordId === "level_one.blue_bloom_mat.left" &&
          levelOneCrossingParity?.rightMatRecordId === "level_one.blue_bloom_mat.right" &&
          levelOneCrossingParity?.leftMatSourceExport === "LEVEL_ONE_BLUE_BLOOM_MATS" &&
          levelOneCrossingParity?.rightMatSourceExport === "LEVEL_ONE_BLUE_BLOOM_MATS" &&
          levelOneCrossingParity?.leftMatSourcePath === "left.docked" &&
          levelOneCrossingParity?.rightMatSourcePath === "right.docked" &&
          levelOneCrossingParity?.latchRecordId === "level_one.blue_bloom_latch" &&
          levelOneCrossingParity?.latchSourceExport === "LEVEL_ONE_BLUE_BLOOM_LATCH",
        formatJson(levelOneCrossingParity || {})
      ),
      check(
        "level_one_path_tiles_visible_selectable_locked",
        levelOneCrossingParity?.pathRecordCount === 14 &&
          (levelOneCrossingParity?.pathRecordIds || []).includes("level_one.terrain.path.0.4") &&
          (levelOneCrossingParity?.pathRecordIds || []).includes("level_one.terrain.path.13.4") &&
          (levelOneCrossingParity?.pathRecordIds || []).includes("level_one.terrain.path.3.5") &&
          !(levelOneCrossingParity?.pathRecordIds || []).includes("level_one.terrain.path.5.4") &&
          levelOneCrossingParity?.representativePathAssetKey === "pathTile" &&
          levelOneCrossingParity?.representativePathCategory === "terrain_path" &&
          levelOneCrossingParity?.representativePathTileKind === "base_path" &&
          levelOneCrossingParity?.representativePathSelected === true &&
          levelOneCrossingParity?.representativePathReadOnly === true &&
          levelOneCrossingParity?.representativePathLocked === true &&
          levelOneCrossingParity?.representativePathTransformControlsAttached === false,
        formatJson(levelOneCrossingParity || {})
      ),
      check(
        "level_one_love_letter_visible_selectable_locked",
        levelOneCrossingParity?.loveLetterRecordId === "level_one.love_letter_spellbook" &&
          levelOneCrossingParity?.loveLetterAssetKey === "spellbookClosed" &&
          levelOneCrossingParity?.loveLetterCategory === "love_letter" &&
          levelOneCrossingParity?.loveLetterSelected === true &&
          levelOneCrossingParity?.loveLetterReadOnly === true &&
          levelOneCrossingParity?.loveLetterLocked === true &&
          levelOneCrossingParity?.loveLetterTransformControlsAttached === false &&
          levelOneCrossingParity?.loveLetterSourceFile === "src/levels/levelOne.js" &&
          levelOneCrossingParity?.loveLetterSourceExport === "LEVEL_ONE_LOVE_LETTER_POINT",
        formatJson(levelOneCrossingParity || {})
      ),
      check("object_count", initialState?.objectCount > 0, `objectCount=${initialState?.objectCount ?? "missing"}`),
      check("terrain_selectable_count", initialState?.terrainSelectableCount > 0, `terrainSelectableCount=${initialState?.terrainSelectableCount || 0}`),
      check("object_filter_default_hides_base", objectFilterCheck?.defaultState?.visibleObjectCount < objectFilterCheck?.defaultState?.objectCount, `visible=${objectFilterCheck?.defaultState?.visibleObjectCount} total=${objectFilterCheck?.defaultState?.objectCount}`),
      check("object_filter_search_id", objectFilterCheck?.idSearchState?.visibleObjectCount === 1 && objectFilterCheck?.idSearchState?.objectFilter?.query === `id:${objectFilterCheck?.elevatedId}`, formatJson(objectFilterCheck?.idSearchState?.objectFilter || {})),
      check("object_filter_search_tag", objectFilterCheck?.tagSearchState?.visibleObjectCount > 0 && objectFilterCheck?.tagSearchState?.objectFilter?.query === "tag:elevated", formatJson(objectFilterCheck?.tagSearchState?.objectFilter || {})),
      check("object_filter_movable", objectFilterCheck?.movableFilterState?.visibleObjectCount > 0 && objectFilterCheck?.movableFilterState?.objectFilter?.activeFilter === "movable", formatJson(objectFilterCheck?.movableFilterState?.objectFilter || {})),
      check("object_filter_locked", objectFilterCheck?.lockedFilterState?.visibleObjectCount > 0 && objectFilterCheck?.lockedFilterState?.objectFilter?.activeFilter === "locked", formatJson(objectFilterCheck?.lockedFilterState?.objectFilter || {})),
      check("object_filter_props", objectFilterCheck?.propsFilterState?.visibleObjectCount > 0 && objectFilterCheck?.propsFilterState?.objectFilter?.activeFilter === "props", formatJson(objectFilterCheck?.propsFilterState?.objectFilter || {})),
      check("object_filter_elevated", objectFilterCheck?.elevatedFilterState?.visibleObjectCount > 0 && objectFilterCheck?.elevatedFilterState?.objectFilter?.activeFilter === "elevated", formatJson(objectFilterCheck?.elevatedFilterState?.objectFilter || {})),
      check("object_filter_selected_hidden", objectFilterCheck?.selectedHiddenState?.selectedHiddenByFilters === true, `selectedHidden=${objectFilterCheck?.selectedHiddenState?.selectedHiddenByFilters || false}`),
      check("object_filter_reveal_selected", objectFilterCheck?.revealState?.selectedHiddenByFilters === false && objectFilterCheck?.revealState?.objectFilter?.hideBaseGround === false, formatJson(objectFilterCheck?.revealState?.objectFilter || {})),
      check(
        "level_three_editor_placeholders_present",
        levelThreePrepCheck?.missingIds?.length === 0,
        formatJson({
          missingIds: levelThreePrepCheck?.missingIds,
          foundIds: levelThreePrepCheck?.foundIds
        })
      ),
      check(
        "level_three_editor_placeholders_movable",
        levelThreePrepCheck?.movableIds?.includes("level_three.level3StartIsland") &&
          levelThreePrepCheck?.movableIds?.includes("level_three.level3TotemGreenButton") &&
          levelThreePrepCheck?.movableIds?.includes("level_three.level3BridgeGreenButton") &&
          levelThreePrepCheck?.movableIds?.includes("level_three.level3LoveLetterCliff") &&
          levelThreePrepCheck?.sourceBackedIds?.includes("level_three.level3CrocodileEcho"),
        formatJson({
          movableIds: levelThreePrepCheck?.movableIds,
          sourceBackedIds: levelThreePrepCheck?.sourceBackedIds
        })
      ),
      check(
        "level_three_editor_placeholder_selection",
        levelThreePrepCheck?.selectedState?.selectedId === "level_three.level3TotemGreenButton" &&
          levelThreePrepCheck?.selectedState?.transformControlsAttached === true,
        formatJson({
          selectedId: levelThreePrepCheck?.selectedState?.selectedId,
          transformControlsAttached: levelThreePrepCheck?.selectedState?.transformControlsAttached
        })
      ),
      check(
        "level_three_editor_filter_finds_placeholders",
        levelThreePrepCheck?.movableFilterState?.visibleObjectCount > 0 &&
          levelThreePrepCheck?.searchState?.visibleObjectCount === 1,
        formatJson({
          movableFilter: levelThreePrepCheck?.movableFilterState?.objectFilter,
          searchFilter: levelThreePrepCheck?.searchState?.objectFilter,
          searchVisibleCount: levelThreePrepCheck?.searchState?.visibleObjectCount
        })
      ),
      check(
        "asset_tab_search_ramp",
        assetCatalogCheck?.rampState?.activePanelTab === "assets" &&
          assetCatalogCheck?.rampAssets?.includes("blueRamp") &&
          assetCatalogCheck?.rampState?.assetFilter?.query === "ramp",
        formatJson({
          activePanelTab: assetCatalogCheck?.rampState?.activePanelTab,
          query: assetCatalogCheck?.rampState?.assetFilter?.query,
          rampAssets: assetCatalogCheck?.rampAssets
        })
      ),
      check(
        "asset_tab_filter_buttons",
        assetCatalogCheck?.buttonState?.assetFilter?.activeFilter === "button" &&
          assetCatalogCheck?.buttonAssets?.some((assetKey) => assetKey.toLowerCase().includes("button")),
        formatJson({
          filter: assetCatalogCheck?.buttonState?.assetFilter,
          buttonAssets: assetCatalogCheck?.buttonAssets
        })
      ),
      check(
        "asset_tab_filter_terrain",
        assetCatalogCheck?.terrainState?.assetFilter?.activeFilter === "terrain" &&
          assetCatalogCheck?.terrainAssets?.some((assetKey) => assetKey.toLowerCase().includes("tile")),
        formatJson({
          filter: assetCatalogCheck?.terrainState?.assetFilter,
          terrainAssets: assetCatalogCheck?.terrainAssets
        })
      ),
      check(
        "procedural_asset_source_filter",
        assetCatalogCheck?.proceduralState?.assetSourceScope === "procedural" &&
          assetCatalogCheck?.proceduralState?.visibleProceduralAssetCount > 0 &&
          assetCatalogCheck?.proceduralAssets?.includes("procedural.lilyPad.tile"),
        formatJson({
          assetSourceScope: assetCatalogCheck?.proceduralState?.assetSourceScope,
          visibleProceduralAssetCount: assetCatalogCheck?.proceduralState?.visibleProceduralAssetCount,
          proceduralAssets: assetCatalogCheck?.proceduralAssets
        })
      ),
      check(
        "asset_selection_preserves_object",
        assetCatalogCheck?.selectedAssetWithObject?.selectedId === "level_two.blue_ramp" &&
          assetCatalogCheck?.selectedAssetWithObject?.selectedAssetKey === "blueRamp" &&
          assetCatalogCheck?.selectedAssetWithObject?.transformControlsAttached === true,
        formatJson(assetCatalogCheck?.selectedAssetWithObject || {})
      ),
      check(
        "asset_selection_no_transform_without_object",
        !assetCatalogCheck?.selectedAssetWithoutObject?.selectedId &&
          assetCatalogCheck?.selectedAssetWithoutObject?.selectedAssetKey === "buttonBaseBlue" &&
          assetCatalogCheck?.selectedAssetWithoutObject?.transformControlsAttached === false,
        formatJson(assetCatalogCheck?.selectedAssetWithoutObject || {})
      ),
      check(
        "state_export_selected_asset_context",
        assetCatalogCheck?.stateExportWithAsset?.assetCatalog?.selectedAsset?.assetKey === "blueRamp" &&
          assetCatalogCheck?.stateExportWithAsset?.assetCatalog?.placementEnabled === false &&
          assetCatalogCheck?.stateExportWithAsset?.assetCatalog?.draftPlacementEnabled === true &&
          !Array.isArray(assetCatalogCheck?.stateExportWithAsset?.assetCatalog?.records),
        formatJson(assetCatalogCheck?.stateExportWithAsset?.assetCatalog || {})
      ),
      check(
        "asset_filters_collapsed",
        externalAssetCatalogCheck?.filtersCollapsed?.object === true &&
          externalAssetCatalogCheck?.filtersCollapsed?.asset === true,
        formatJson(externalAssetCatalogCheck?.filtersCollapsed || {})
      ),
      check(
        "external_asset_source_filter",
        externalAssetCatalogCheck?.bridgeState?.assetSourceScope === "external" &&
          externalAssetCatalogCheck?.bridgeState?.visibleExternalAssetCount > 0 &&
          externalAssetCatalogCheck?.bridgeAssets?.every((record) => record.sourceScope === "external"),
        formatJson({
          assetSourceScope: externalAssetCatalogCheck?.bridgeState?.assetSourceScope,
          visibleExternalAssetCount: externalAssetCatalogCheck?.bridgeState?.visibleExternalAssetCount,
          bridgeAssets: externalAssetCatalogCheck?.bridgeAssets
        })
      ),
      check(
        "external_asset_pack_filter",
        externalAssetCatalogCheck?.packState?.assetFilter?.sourceScope === "external" &&
          externalAssetCatalogCheck?.packState?.assetFilter?.packName !== "all" &&
          externalAssetCatalogCheck?.packState?.visibleExternalAssetCount > 0,
        formatJson(externalAssetCatalogCheck?.packState?.assetFilter || {})
      ),
      check(
        "external_asset_folder_filter",
        externalAssetCatalogCheck?.folder &&
          externalAssetCatalogCheck?.folder !== "all" &&
          externalAssetCatalogCheck?.folderState?.assetFilter?.folderPath === externalAssetCatalogCheck?.folder &&
          externalAssetCatalogCheck?.folderState?.visibleExternalAssetCount > 0,
        formatJson({
          folder: externalAssetCatalogCheck?.folder,
          filter: externalAssetCatalogCheck?.folderState?.assetFilter
        })
      ),
      check(
        "cubeling_animal_pack_filter",
        externalAssetCatalogCheck?.cubelingState?.assetFilter?.packName === "Cubeling Pack / Animals" &&
          externalAssetCatalogCheck?.cubelingState?.visibleExternalAssetCount > 0,
        formatJson(externalAssetCatalogCheck?.cubelingState?.assetFilter || {})
      ),
      check(
        "external_asset_reference_typeahead",
        externalAssetCatalogCheck?.typeahead?.open === true &&
          externalAssetCatalogCheck?.typeahead?.trigger === "#" &&
          externalAssetCatalogCheck?.typeahead?.tokens?.some((token) => token.startsWith("#external.")),
        formatJson(externalAssetCatalogCheck?.typeahead || {})
      ),
      check(
        "external_asset_reference_insert",
        externalAssetReferenceInsertCheck?.externalToken?.startsWith("#external.") &&
        externalAssetReferenceInsertCheck?.reference?.type === "asset" &&
          externalAssetReferenceInsertCheck?.reference?.sourceScope === "external" &&
          externalAssetReferenceInsertCheck?.reference?.placementEnabled === false &&
          externalAssetReferenceInsertCheck?.reference?.draftPlacementEnabled === true &&
          externalAssetReferenceInsertCheck?.reference?.referenceOnly === true,
        formatJson(externalAssetReferenceInsertCheck || {})
      ),
      check(
        "external_asset_prompt_instruction",
        externalAssetReferenceInsertCheck?.promptIncludesExternalInstruction === true &&
          externalAssetReferenceInsertCheck?.renderState?.placementEnabled === false &&
          externalAssetReferenceInsertCheck?.renderState?.selectedExternalAssetToken?.startsWith("#external."),
        formatJson(externalAssetReferenceInsertCheck?.renderState || {})
      ),
      check(
        "draft_ghost_export",
        editorBuildIntentCheck?.ghostState?.selectedId?.startsWith("level_two.draft.") &&
          editorBuildIntentCheck?.ghostState?.transformControlsAttached === true &&
          editorBuildIntentCheck?.ghostDraft?.assetKey === "blueRamp" &&
          editorBuildIntentCheck?.ghostDraft?.sourceScope === "in-project" &&
          editorBuildIntentCheck?.ghostDraft?.previewType === "ghost-model" &&
          editorBuildIntentCheck?.ghostDraft?.manualReview === false,
        formatJson({
          selectedId: editorBuildIntentCheck?.ghostState?.selectedId,
          draft: editorBuildIntentCheck?.ghostDraft
        })
      ),
      check(
        "draft_external_marker_export",
        !editorBuildIntentCheck?.externalAssetKey ||
          (
            editorBuildIntentCheck?.externalDraft?.assetKey === editorBuildIntentCheck?.externalAssetKey &&
            editorBuildIntentCheck?.externalDraft?.sourceScope === "external" &&
            editorBuildIntentCheck?.externalDraft?.previewType === "marker" &&
            editorBuildIntentCheck?.externalDraft?.referenceOnly === true &&
            editorBuildIntentCheck?.externalDraft?.manualReview === true
          ),
        formatJson({
          externalAssetKey: editorBuildIntentCheck?.externalAssetKey,
          externalDraft: editorBuildIntentCheck?.externalDraft
        })
      ),
      check(
        "draft_procedural_lily_pad_export",
        editorBuildIntentCheck?.proceduralState?.selectedId?.includes("procedural.lilypad.tile") &&
          editorBuildIntentCheck?.proceduralState?.transformControlsAttached === true &&
          editorBuildIntentCheck?.proceduralDraft?.assetKey === "procedural.lilyPad.tile" &&
          editorBuildIntentCheck?.proceduralDraft?.sourceScope === "procedural" &&
          editorBuildIntentCheck?.proceduralDraft?.previewType === "procedural-model" &&
          editorBuildIntentCheck?.proceduralDraft?.referenceOnly === false &&
          editorBuildIntentCheck?.proceduralDraft?.manualReview === true,
        formatJson({
          selectedId: editorBuildIntentCheck?.proceduralState?.selectedId,
          draft: editorBuildIntentCheck?.proceduralDraft
        })
      ),
      check(
        "draft_patch_boundary",
        editorBuildIntentCheck?.patchBeforeDraftCount === 0 &&
          editorBuildIntentCheck?.patchAfterDraftCount === 0 &&
          editorBuildIntentCheck?.finalDraftCount >= 1,
        formatJson({
          patchBeforeDraftCount: editorBuildIntentCheck?.patchBeforeDraftCount,
          patchAfterDraftCount: editorBuildIntentCheck?.patchAfterDraftCount,
          finalDraftCount: editorBuildIntentCheck?.finalDraftCount
        })
      ),
      check(
        "draft_remove_button_available",
        editorBuildIntentCheck?.removableDraftState?.selectedDraftPlacement === true &&
          editorBuildIntentCheck?.removableDraftState?.canRemoveSelectedDraft === true &&
          editorBuildIntentCheck?.removeDraftButtonEnabled === true,
        formatJson({
          removableDraftId: editorBuildIntentCheck?.removableDraftId,
          removableDraftState: editorBuildIntentCheck?.removableDraftState,
          removeDraftButtonEnabled: editorBuildIntentCheck?.removeDraftButtonEnabled
        })
      ),
      check(
        "draft_remove_deletes_marker",
        editorBuildIntentCheck?.removeDraftResult === true &&
          editorBuildIntentCheck?.draftCountAfterRemove === editorBuildIntentCheck?.draftCountBeforeRemove &&
          editorBuildIntentCheck?.afterRemoveState?.selectionMode === "level" &&
          !editorBuildIntentCheck?.afterRemoveState?.selectedId &&
          editorBuildIntentCheck?.removedDraftStillExists === false &&
          editorBuildIntentCheck?.removedDraftMetaExists === false,
        formatJson({
          removableDraftId: editorBuildIntentCheck?.removableDraftId,
          draftCountBeforeRemove: editorBuildIntentCheck?.draftCountBeforeRemove,
          draftCountAfterRemove: editorBuildIntentCheck?.draftCountAfterRemove,
          afterRemoveState: editorBuildIntentCheck?.afterRemoveState,
          removedDraftStillExists: editorBuildIntentCheck?.removedDraftStillExists,
          removedDraftMetaExists: editorBuildIntentCheck?.removedDraftMetaExists
        })
      ),
      check(
        "replacement_candidate_use_asset",
        editorBuildIntentCheck?.replacementMeta?.markedForReplace === true &&
          editorBuildIntentCheck?.replacementMeta?.markedForDelete === false &&
          editorBuildIntentCheck?.replacementMeta?.note?.includes("@replace") &&
          editorBuildIntentCheck?.replacementMeta?.note?.includes("#blueRamp") &&
          editorBuildIntentCheck?.replacementObject?.replacementCandidate?.assetKey === "blueRamp" &&
          editorBuildIntentCheck?.replacementObject?.replacementCandidate?.preserveRole === true,
        formatJson({
          meta: editorBuildIntentCheck?.replacementMeta,
          object: editorBuildIntentCheck?.replacementObject
        })
      ),
      check(
        "replace_mark_autofills_selected_asset",
        editorBuildIntentCheck?.markReplaceMeta?.markedForReplace === true &&
          editorBuildIntentCheck?.markReplaceMeta?.markedForDelete === false &&
          editorBuildIntentCheck?.markReplaceMeta?.note?.includes("@replace") &&
          editorBuildIntentCheck?.markReplaceMeta?.note?.includes("#buttonBaseBlue") &&
          editorBuildIntentCheck?.markReplaceObject?.replacementCandidate?.assetKey === "buttonBaseBlue",
        formatJson({
          meta: editorBuildIntentCheck?.markReplaceMeta,
          object: editorBuildIntentCheck?.markReplaceObject
        })
      ),
      check(
        "copy_prompt_build_intent_context",
        editorBuildIntentCheck?.promptIncludesDrafts === true &&
          editorBuildIntentCheck?.promptIncludesReplacementCandidate === true,
        formatJson({
          promptIncludesDrafts: editorBuildIntentCheck?.promptIncludesDrafts,
          promptIncludesReplacementCandidate: editorBuildIntentCheck?.promptIncludesReplacementCandidate
        })
      ),
      check(
        "elevated_tile_movable",
        elevatedTileMoveCheck?.found &&
          elevatedTileMoveCheck?.elevatedMovable === true &&
          elevatedTileMoveCheck?.elevatedLocked === false &&
          elevatedTileMoveCheck?.elevatedSelectedState?.transformControlsAttached === true,
        formatJson(elevatedTileMoveCheck || {})
      ),
      check(
        "elevated_tile_export_metadata",
        elevatedTileMoveCheck?.movedObject?.movable === true &&
          elevatedTileMoveCheck?.movedObject?.locked === false &&
          elevatedTileMoveCheck?.movedObject?.tileKind === "elevated" &&
          elevatedTileMoveCheck?.movedObject?.changes?.length > 0 &&
          elevatedTileMoveCheck?.movedPatchObject?.movable === true,
        formatJson(elevatedTileMoveCheck?.movedObject || {})
      ),
      check(
        "base_ground_locked",
        elevatedTileMoveCheck?.baseMovable === false &&
          elevatedTileMoveCheck?.baseLocked === true &&
          Boolean(elevatedTileMoveCheck?.baseLockReason) &&
          elevatedTileMoveCheck?.baseSelectedState?.transformControlsAttached === false,
        formatJson({
          baseId: elevatedTileMoveCheck?.baseId,
          baseLockReason: elevatedTileMoveCheck?.baseLockReason,
          transformControlsAttached: elevatedTileMoveCheck?.baseSelectedState?.transformControlsAttached
        })
      ),
      check("default_selection", Boolean(initialState?.selectedId), `selectedId=${initialState?.selectedId || "missing"}`),
      check(
        "terrain_list_selection",
        terrainSelectionSetup.found &&
          terrainSelectionSetup.listSelectedId === terrainSelectionSetup.terrainId &&
          terrainSelectionSetup.listSelectedReadOnly === true &&
          terrainSelectionSetup.transformControlsAttached === false,
        formatJson(terrainSelectionSetup)
      ),
      check(
        "terrain_viewport_selection",
        terrainViewportState?.selectedId?.startsWith("level_two.terrain.") &&
          terrainViewportState?.selectedReadOnly === true &&
          terrainViewportState?.transformControlsAttached === false,
        `selectedId=${terrainViewportState?.selectedId || "missing"} readOnly=${terrainViewportState?.selectedReadOnly || false}`
      ),
      check(
        "empty_click_level_mode",
        emptyClickState?.selectionMode === "level" && !emptyClickState?.selectedId && emptyClickState?.levelNoteAvailable === true,
        `selectionMode=${emptyClickState?.selectionMode || "missing"} selectedId=${emptyClickState?.selectedId || "none"}`
      ),
      check(
        "level_note_export",
        levelNoteExport.levelNoteTags?.includes("@collision") &&
          levelNoteExport.levelNoteIntents?.some((intent) => intent.tag === "@collision") &&
          Boolean(levelNoteExport.intentGlossary?.["@collision"]),
        `levelNoteTags=${levelNoteExport.levelNoteTags?.join(",") || "missing"}`
      ),
      check("patch_schema", patchAfterMove?.patchType === "lumina3d.editor.transformPatch.v1", `patchType=${patchAfterMove?.patchType || "missing"}`),
      check("dirty_patch", Boolean(dirtyObject), `dirtyObject=${dirtyObject?.objectId || "missing"}`),
      check("source_ref", Boolean(patchAfterMove?.sourceRef?.file || dirtyObject?.sourceRef?.file), "dirty patch includes source reference"),
      check("camera_pitch", pitchCheck.after !== pitchCheck.before, `pitch=${pitchCheck.before} -> ${pitchCheck.after}`),
      check("collider_toggle_visible", colliderAfterToggle?.collidersVisible === true, `visible=${colliderAfterToggle?.collidersVisible || false}`),
      check("collider_proxy_count", colliderAfterToggle?.colliderProxyCount > 0, `count=${colliderAfterToggle?.colliderProxyCount || 0}`),
      check("selected_collider_proxy", colliderAfterToggle?.selectedColliderProxyCount > 0, `selectedCount=${colliderAfterToggle?.selectedColliderProxyCount || 0}`),
      check(
        "selected_collider_source_hint",
        colliderAfterToggle?.selectedColliderLabels?.some((label) => label.includes("Blue Ramp source walkable envelope")),
        `labels=${colliderAfterToggle?.selectedColliderLabels?.join(",") || "missing"}`
      ),
      check(
        "collider_proxy_follows_move",
        colliderMoveCheck?.beforeProxy?.center?.x !== colliderMoveCheck?.afterProxy?.center?.x,
        `x=${colliderMoveCheck?.beforeProxy?.center?.x} -> ${colliderMoveCheck?.afterProxy?.center?.x}`
      ),
      check(
        "collider_level_switch_rebuilds",
        colliderMoveCheck?.levelOneState?.levelId === "level_one" &&
          colliderMoveCheck?.levelOneState?.colliderProxyCount > 0 &&
          !String(colliderMoveCheck?.levelOneState?.selectedColliderLabels?.join(",") || "").includes("Blue Ramp"),
        `levelOne=${formatJson(colliderMoveCheck?.levelOneState || {})}`
      ),
      check(
        "collider_view_walkable",
        colliderModeCheck?.walkableState?.colliderViewMode === "walkable" &&
          colliderModeCheck?.walkableState?.collidersVisible === true &&
          colliderModeCheck?.walkableState?.visibleColliderProxyCount > 0,
        formatJson(colliderModeCheck?.walkableState || {})
      ),
      check(
        "collider_view_triggers",
        colliderModeCheck?.triggerState?.colliderViewMode === "triggers" &&
          colliderModeCheck?.triggerState?.collidersVisible === true &&
          colliderModeCheck?.triggerState?.visibleColliderProxyCount > 0,
        formatJson(colliderModeCheck?.triggerState || {})
      ),
      check(
        "collider_view_problems_diagnostics",
        colliderModeCheck?.problemsState?.colliderViewMode === "problems" &&
          colliderModeCheck?.problemsState?.collidersVisible === true &&
          Number.isFinite(colliderModeCheck?.problemsState?.problemWarningCount) &&
          colliderModeCheck?.diagnostics?.schema === "lumina3d.editor.colliderDiagnostics.v1",
        formatJson({
          problemsState: colliderModeCheck?.problemsState,
          diagnostics: colliderModeCheck?.diagnostics
        })
      ),
      check(
        "collider_actor_walkability_matrix",
        colliderModeCheck?.diagnostics?.actorWalkability?.length === 3 &&
          colliderModeCheck?.diagnostics?.actorWalkability?.some((entry) => entry.actor === "human") &&
          colliderModeCheck?.diagnostics?.actorWalkability?.some((entry) => entry.actor === "frog") &&
          colliderModeCheck?.diagnostics?.actorWalkability?.some((entry) => entry.actor === "elephant"),
        formatJson(colliderModeCheck?.diagnostics?.actorWalkability || [])
      ),
      check("note_typeahead_suggests_move", typeaheadBeforeInsert.open && typeaheadBeforeInsert.suggestions.includes("@move"), `suggestions=${typeaheadBeforeInsert.suggestions.join(",")}`),
      check("note_typeahead_inserts_move", typeaheadAfterInsert.note.includes("@move") && typeaheadAfterInsert.noteTags.includes("@move"), `note=${typeaheadAfterInsert.note}`),
      check(
        "object_reference_typeahead_suggests_blue_ramp",
        referenceTypeaheadCheck.open &&
          referenceTypeaheadCheck.trigger === "#" &&
          referenceTypeaheadCheck.tokens.includes("#level_two.blue_ramp"),
        formatJson(referenceTypeaheadCheck)
      ),
      check(
        "object_reference_typeahead_inserts_blue_ramp",
        objectReferenceInsertCheck.note.includes("#level_two.blue_ramp") &&
          objectReferenceInsertCheck.noteReferences.some((reference) => reference.token === "#level_two.blue_ramp" && reference.type === "object") &&
          objectReferenceInsertCheck.referenceGlossaryKeys.includes("#level_two.blue_ramp"),
        formatJson(objectReferenceInsertCheck)
      ),
      check(
        "asset_reference_typeahead_suggests_blue_ramp",
        assetReferenceTypeaheadCheck.open &&
          assetReferenceTypeaheadCheck.trigger === "#" &&
          assetReferenceTypeaheadCheck.tokens.includes("#blueRamp"),
        formatJson(assetReferenceTypeaheadCheck)
      ),
      check(
        "asset_reference_typeahead_inserts_blue_ramp",
        assetReferenceInsertCheck.note.includes("#blueRamp") &&
          assetReferenceInsertCheck.levelNoteReferences.some((reference) => reference.token === "#blueRamp" && reference.type === "asset") &&
          assetReferenceInsertCheck.referenceGlossaryKeys.includes("#blueRamp") &&
          assetReferenceInsertCheck.assetReference?.placementEnabled === false,
        formatJson(assetReferenceInsertCheck)
      ),
      check(
        "note_intent_help_details",
        typeaheadHelpCheck.moveUsage.includes("starting position") &&
          typeaheadHelpCheck.moveExample.includes("@move") &&
          typeaheadHelpCheck.optionText.includes("starting position"),
        formatJson(typeaheadHelpCheck)
      ),
      check(
        "export_button_tooltips",
        exportTooltipCheck.patchTooltip.toLowerCase().includes("delta") &&
          exportTooltipCheck.stateTooltip.includes("references") &&
          exportTooltipCheck.promptTooltip.includes("reference glossary") &&
          exportTooltipCheck.renderState.exportTooltipsAvailable === true,
        formatJson(exportTooltipCheck)
      ),
      check("state_export_schema", stateExportAfterEdits?.stateExport?.schema === "lumina3d.editor.stateExport.v1", `schema=${stateExportAfterEdits?.stateExport?.schema || "missing"}`),
      check("state_export_transform", Boolean(stateRamp?.changes?.length), `rampChanges=${stateRamp?.changes?.length || 0}`),
      check("state_export_note", stateNote?.noteTags?.includes("@move") && stateNote?.noteTags?.includes("@trigger"), `noteTags=${stateNote?.noteTags?.join(",") || "missing"}`),
      check("state_export_note_intents", stateNote?.noteIntents?.some((intent) => intent.tag === "@move"), `noteIntents=${stateNote?.noteIntents?.map((intent) => intent.tag).join(",") || "missing"}`),
      check("state_export_intent_glossary", Boolean(stateExportAfterEdits?.stateExport?.intentGlossary?.["@move"]), "intentGlossary contains @move"),
      check("state_export_collider_overlay", stateExportAfterEdits?.stateExport?.colliderOverlay?.proxyCount > 0, `proxyCount=${stateExportAfterEdits?.stateExport?.colliderOverlay?.proxyCount || 0}`),
      check("state_export_object_colliders", stateRamp?.colliderProxies?.length > 0, `rampProxies=${stateRamp?.colliderProxies?.length || 0}`),
      check(
        "state_export_source_backed_colliders",
        stateRamp?.colliderProxies?.some((proxy) => proxy.source === "source-hint" && proxy.label?.includes("Blue Ramp source")),
        formatJson(stateRamp?.colliderProxies || [])
      ),
      check("state_export_selected_colliders", stateExportAfterEdits?.stateExport?.selectedColliderProxies?.length > 0, `selectedProxies=${stateExportAfterEdits?.stateExport?.selectedColliderProxies?.length || 0}`),
      check("state_export_selected_context", Boolean(stateExportAfterEdits?.stateExport?.selectedObjectContext?.objectId), `selected=${stateExportAfterEdits?.stateExport?.selectedObjectContext?.objectId || "missing"}`),
      check("state_export_filter_summary", Number.isFinite(stateExportAfterEdits?.stateExport?.objectFilter?.visibleObjectCount), formatJson(stateExportAfterEdits?.stateExport?.objectFilter || {})),
      check(
        "resize_mode_available",
        resizeModeCheck?.found &&
          resizeModeCheck?.transformMode === "scale" &&
          resizeModeCheck?.scaleButtonActive === true &&
          resizeModeCheck?.transformControlsAttached === true,
        formatJson(resizeModeCheck || {})
      ),
      check(
        "resize_scale_export",
        resizeModeCheck?.patchScalePaths?.includes("transform.scale.x") &&
          resizeModeCheck?.patchScalePaths?.includes("transform.scale.y") &&
          resizeModeCheck?.patchScalePaths?.includes("transform.scale.z") &&
          resizeModeCheck?.stateScalePaths?.includes("transform.scale.x"),
        formatJson(resizeModeCheck || {})
      ),
      check("state_export_delete", stateDelete?.markedForDelete === true, `markedForDelete=${stateDelete?.markedForDelete || false}`),
      check("state_export_replace", stateReplace?.markedForReplace === true, `markedForReplace=${stateReplace?.markedForReplace || false}`),
      check(
        "delete_replace_mutual_exclusive",
        stateMutualReplace?.markedForReplace === true && stateMutualReplace?.markedForDelete === false,
        `deleteThen=${formatJson(stateExportAfterEdits?.deleteThenReplaceMeta || {})} replaceAfter=${formatJson(stateExportAfterEdits?.replaceAfterDeleteMeta || {})}`
      ),
      check("reset_selected", stateExportAfterEdits?.resetClean === true, `resetObject=${stateExportAfterEdits?.resetObjectId || "missing"}`),
      check("copy_state_panel", copiedState?.schema === "lumina3d.editor.stateExport.v1", `schema=${copiedState?.schema || "missing"}`),
      check("copy_prompt_markdown", copiedPrompt.includes("```json") && copiedPrompt.includes("local Lumina3D project files"), "prompt includes fenced JSON and local-first wording"),
      check("copy_prompt_collider_context", copiedPrompt.includes("colliderProxies") && copiedPrompt.includes("visual handoff context"), "prompt includes collider context guidance"),
      check("copy_prompt_level_note_context", copiedPrompt.includes("levelNote") && copiedPrompt.includes("whole map"), "prompt includes map-level note guidance"),
      check("copy_prompt_reference_context", assetReferenceInsertCheck.promptIncludesReferenceInstruction && copiedPrompt.includes("referenceGlossary"), "prompt includes reference instructions and glossary"),
      check("level_note_persistence", persistedMeta?.levelState?.levelNoteTags?.includes("@collision"), `levelNoteTags=${persistedMeta?.levelState?.levelNoteTags?.join(",") || "missing"}`),
      check("note_persistence", persistedMeta?.blueButtonMeta?.noteTags?.includes("@move"), `noteTags=${persistedMeta?.blueButtonMeta?.noteTags?.join(",") || "missing"}`),
      check("delete_persistence", persistedMeta?.redButtonMeta?.markedForDelete === true, `markedForDelete=${persistedMeta?.redButtonMeta?.markedForDelete || false}`),
      check("replace_persistence", persistedMeta?.redElevatorMeta?.markedForReplace === true, `markedForReplace=${persistedMeta?.redElevatorMeta?.markedForReplace || false}`),
      check(
        "reset_level",
        resetLevelCheck.affectedObjectCount === 0 &&
          resetLevelCheck.affectedItemCount === 0 &&
          resetLevelCheck.metaCount === 0 &&
          resetLevelCheck.dirtyCount === 0 &&
          resetLevelCheck.draftPlacementCount === 0 &&
          resetLevelCheck.replacementCandidateCount === 0 &&
          resetLevelCheck.levelNoteCount === 0 &&
          !resetLevelCheck.levelNote,
        formatJson(resetLevelCheck)
      ),
      check("play_in_game", gameState?.scene?.id === "level_one", `scene=${gameState?.scene?.id || "missing"}`)
    ];
    const failed = checks.find((entry) => !entry.pass);
    const payload = {
      ok: !failed,
      command: "run-editor-smoke",
      url: DEFAULT_EDITOR_URL,
      checks,
      state: {
        initial: initialState,
        afterMove: movedState,
        levelSwitchResults
      },
      patch: {
        patchType: patchAfterMove?.patchType || null,
        objectId: patchAfterMove?.objectId || null,
        changeCount: patchAfterMove?.objects?.reduce((sum, objectPatch) => sum + (objectPatch.changes?.length || 0), 0) || 0,
        sourceRef: patchAfterMove?.sourceRef || dirtyObject?.sourceRef || null
      },
      stateExport: {
        schema: stateExportAfterEdits?.stateExport?.schema || null,
        affectedObjectCount: stateExportAfterEdits?.stateExport?.affectedObjectCount || 0,
        affectedItemCount: stateExportAfterEdits?.stateExport?.affectedItemCount || 0,
        transformChangeCount: stateExportAfterEdits?.stateExport?.transformChangeCount || 0,
        noteCount: stateExportAfterEdits?.stateExport?.noteCount || 0,
        levelNoteCount: stateExportAfterEdits?.stateExport?.levelNoteCount || 0,
        totalNoteCount: stateExportAfterEdits?.stateExport?.totalNoteCount || 0,
        deleteCount: stateExportAfterEdits?.stateExport?.deleteCount || 0,
        replaceCount: stateExportAfterEdits?.stateExport?.replaceCount || 0,
        replacementCandidateCount: stateExportAfterEdits?.stateExport?.replacementCandidateCount || 0,
        draftPlacementCount: stateExportAfterEdits?.stateExport?.draftPlacementCount || 0,
        problemWarningCount: stateExportAfterEdits?.stateExport?.colliderDiagnostics?.problemWarningCount || 0,
        intentGlossaryTags: Object.keys(stateExportAfterEdits?.stateExport?.intentGlossary || {}),
        selectedAssetKey: assetCatalogCheck?.stateExportWithAsset?.assetCatalog?.selectedAsset?.assetKey || null
      },
      resize: resizeModeCheck,
      playInGame: {
        sceneId: gameState?.scene?.id || null,
        phase: gameState?.scene?.phase || null
      }
    };

    console.log(parsed.pretty ? formatJson(payload) : JSON.stringify(payload));
    if (!payload.ok) process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "run-editor-smoke",
    url: DEFAULT_EDITOR_URL,
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
