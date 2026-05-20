import { formatJson, launchGameBrowser, waitForGameReady } from "./lib/cli-utils.js";

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
    const pitchCheck = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      const before = app.cameraController.state().pitch;
      app.cameraController.tiltPitch(1);
      app.updateSelectionHelpers();
      app.updateUi();
      return { before, after: app.cameraController.state().pitch };
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
      window.localStorage.removeItem(`lumina3d.editor.objectMeta.v1:${app.level.id}`);
      app.objectMeta = {};

      const ramp = app.records.find((item) => item.id === "level_two.blue_ramp");
      app.selectObject(ramp.id);
      ramp.object.position.x = ramp.originalTransform.position.x + 0.25;
      ramp.object.rotation.y = ramp.originalTransform.rotation.y + 0.1;
      app.updateSelectionHelpers();
      app.updateUi();

      app.selectObject("level_two.blue_button");
      app.updateSelectedNote("@move Lower this button after @trigger.");

      app.selectObject("level_two.red-button-a");
      app.toggleDeleteMark();

      const resetRecord = app.records.find((item) => item.id === "level_two.elephant_echo");
      app.selectObject(resetRecord.id);
      resetRecord.object.position.x += 0.4;
      app.resetSelectedObject();
      const stateExport = app.currentStateExport();
      const resetObject = stateExport.objects.find((objectExport) => objectExport.objectId === resetRecord.id);
      return {
        stateExport,
        resetObjectId: resetRecord.id,
        resetClean: !resetObject
      };
    });
    const copiedState = await page.evaluate(async () => {
      const app = window.__luminaEditorApp;
      await app.copyEditorState();
      return JSON.parse(app.dom.patchOutput.value);
    });
    const movedState = await readEditorState(page);
    await page.reload({ waitUntil: "networkidle" });
    await waitForEditorReady(page);
    const persistedMeta = await page.evaluate(() => {
      const app = window.__luminaEditorApp;
      app.selectObject("level_two.blue_button");
      const blueButtonMeta = JSON.parse(window.render_editor_to_text()).selectedMeta;
      app.selectObject("level_two.red-button-a");
      const redButtonMeta = JSON.parse(window.render_editor_to_text()).selectedMeta;
      return { blueButtonMeta, redButtonMeta };
    });
    const [gamePage] = await Promise.all([
      page.context().waitForEvent("page"),
      page.click("#playInGame")
    ]);
    await gamePage.waitForLoadState("networkidle");
    const gameState = await waitForGameReady(gamePage);
    await gamePage.close();
    const dirtyObject = patchAfterMove?.objects?.find((objectPatch) => objectPatch.changes?.length > 0) || null;
    const stateObjects = stateExportAfterEdits?.stateExport?.objects || [];
    const stateRamp = stateObjects.find((objectExport) => objectExport.objectId === "level_two.blue_ramp");
    const stateNote = stateObjects.find((objectExport) => objectExport.objectId === "level_two.blue_button");
    const stateDelete = stateObjects.find((objectExport) => objectExport.objectId === "level_two.red-button-a");
    const checks = [
      check("render_hook", Boolean(initialState), "window.render_editor_to_text() returned JSON"),
      check("mode", initialState?.mode === "level-editor", `mode=${initialState?.mode || "missing"}`),
      check("object_count", initialState?.objectCount > 0, `objectCount=${initialState?.objectCount ?? "missing"}`),
      check("default_selection", Boolean(initialState?.selectedId), `selectedId=${initialState?.selectedId || "missing"}`),
      check("patch_schema", patchAfterMove?.patchType === "lumina3d.editor.transformPatch.v1", `patchType=${patchAfterMove?.patchType || "missing"}`),
      check("dirty_patch", Boolean(dirtyObject), `dirtyObject=${dirtyObject?.objectId || "missing"}`),
      check("source_ref", Boolean(patchAfterMove?.sourceRef?.file || dirtyObject?.sourceRef?.file), "dirty patch includes source reference"),
      check("camera_pitch", pitchCheck.after !== pitchCheck.before, `pitch=${pitchCheck.before} -> ${pitchCheck.after}`),
      check("state_export_schema", stateExportAfterEdits?.stateExport?.schema === "lumina3d.editor.stateExport.v1", `schema=${stateExportAfterEdits?.stateExport?.schema || "missing"}`),
      check("state_export_transform", Boolean(stateRamp?.changes?.length), `rampChanges=${stateRamp?.changes?.length || 0}`),
      check("state_export_note", stateNote?.noteTags?.includes("@move") && stateNote?.noteTags?.includes("@trigger"), `noteTags=${stateNote?.noteTags?.join(",") || "missing"}`),
      check("state_export_delete", stateDelete?.markedForDelete === true, `markedForDelete=${stateDelete?.markedForDelete || false}`),
      check("reset_selected", stateExportAfterEdits?.resetClean === true, `resetObject=${stateExportAfterEdits?.resetObjectId || "missing"}`),
      check("copy_state_panel", copiedState?.schema === "lumina3d.editor.stateExport.v1", `schema=${copiedState?.schema || "missing"}`),
      check("note_persistence", persistedMeta?.blueButtonMeta?.noteTags?.includes("@move"), `noteTags=${persistedMeta?.blueButtonMeta?.noteTags?.join(",") || "missing"}`),
      check("delete_persistence", persistedMeta?.redButtonMeta?.markedForDelete === true, `markedForDelete=${persistedMeta?.redButtonMeta?.markedForDelete || false}`),
      check("play_in_game", gameState?.scene?.id === "level_two", `scene=${gameState?.scene?.id || "missing"}`)
    ];
    const failed = checks.find((entry) => !entry.pass);
    const payload = {
      ok: !failed,
      command: "run-editor-smoke",
      url: DEFAULT_EDITOR_URL,
      checks,
      state: {
        initial: initialState,
        afterMove: movedState
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
        transformChangeCount: stateExportAfterEdits?.stateExport?.transformChangeCount || 0,
        noteCount: stateExportAfterEdits?.stateExport?.noteCount || 0,
        deleteCount: stateExportAfterEdits?.stateExport?.deleteCount || 0
      },
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
