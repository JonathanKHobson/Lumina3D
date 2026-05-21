import {
  advance,
  formatJson,
  launchGameBrowser,
  setPaused,
  waitForGameReady
} from "./lib/cli-utils.js";

const USAGE_TEXT = "node scripts/run-dev-editor-selectability-smoke.js [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  LUMINA3D_URL=http://127.0.0.1:5179/ npm run tools:run-dev-editor-selectability-smoke -- --pretty`;

const REQUIRED_ENTITIES = [
  { id: "tutorial.ground_tile.0.0", category: "terrain_tile", label: "tutorial ground tile" },
  { id: "tutorial.terrain.barrier.7.0", category: "terrain_barrier", label: "tutorial barrier" },
  { id: "tutorial.terrain.barrier_cap.start", category: "terrain_barrier", label: "tutorial barrier end cap" },
  { id: "tutorial.love_letter.closed", category: "love_letter", label: "tutorial closed love letter" },
  { id: "tutorial.button", category: "button", label: "tutorial blue button" },
  { id: "tutorial.human", category: "character", label: "human actor" },
  { id: "tutorial.frog", category: "frog", label: "frog cubeling" }
];

const CLICK_CATEGORIES = [
  { category: "terrain_tile", label: "visible terrain tile" },
  { category: "terrain_barrier", label: "visible barrier" },
  { category: "button", label: "visible button" },
  { category: "character", label: "human actor" },
  { category: "frog", label: "frog cubeling" }
];

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

function check(name, pass, details) {
  return { name, pass: Boolean(pass), details };
}

async function readDevEntities(page) {
  return page.evaluate(() => window.__luminaDevEditor?.listEntities?.() || []);
}

async function selectedEntityId(page) {
  return page.evaluate(() => window.__luminaDevEditor?.buildAiContextPayload?.()?.selection?.id || "");
}

async function entityLocalPosition(page, id) {
  return page.evaluate((entityId) => {
    const entity = window.__luminaDevEditor?.listEntities?.().find((item) => item.id === entityId);
    return entity?.transform?.local?.position || null;
  }, id);
}

function samePosition(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((value, index) => Math.abs(Number(value) - Number(b[index])) < 0.001);
}

function sameXZ(a, b) {
  return samePosition([a?.[0], a?.[2]], [b?.[0], b?.[2]]);
}

async function findClickableEntity(page, category) {
  return page.evaluate((targetCategory) => {
    const hooks = window.__luminaDevEditor;
    if (!hooks) return null;
    const entities = hooks.listEntities();
    const candidates = entities.filter((entity) => entity.category === targetCategory);
    for (const entity of candidates) {
      const point = hooks.canvasPointForEntity(entity.id);
      if (!point?.visible) continue;
      if (point.x < 2 || point.y < 2 || point.x > window.innerWidth - 2 || point.y > window.innerHeight - 2) continue;
      if (document.elementFromPoint(point.x, point.y)?.id !== "game-canvas") continue;
      return { id: entity.id, displayName: entity.displayName, point };
    }
    return null;
  }, category);
}

async function clickEntity(page, entity) {
  await page.mouse.click(entity.point.x, entity.point.y);
  await advance(page, 80);
  return selectedEntityId(page);
}

async function panDebugCameraAwayFromPanel(page) {
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.down("KeyD");
    await advance(page, 220);
    await page.keyboard.up("KeyD");
    await advance(page, 80);
  }
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
  const { browser, page } = await launchGameBrowser({ headless: parsed.headless });

  try {
    await waitForGameReady(page);
    await setPaused(page, true);
    await page.evaluate(() => window.set_game_test_tutorial_selectability_ready?.());
    await advance(page, 120);
    await page.keyboard.press("F2");
    await advance(page, 120);

    const entities = await readDevEntities(page);
    const byId = new Map(entities.map((entity) => [entity.id, entity]));
    const checks = [];

    REQUIRED_ENTITIES.forEach((required) => {
      const entity = byId.get(required.id);
      checks.push(check(
        `entity_registered:${required.label}`,
        Boolean(entity) && entity.category === required.category,
        entity ? `${entity.id} category=${entity.category} display=${entity.displayName}` : `${required.id} missing`
      ));
    });

    const selectionResults = [];
    for (const required of REQUIRED_ENTITIES) {
      const selected = await page.evaluate((id) => window.__luminaDevEditor.selectEntityById(id), required.id);
      selectionResults.push({
        id: required.id,
        selectedId: selected?.id || "",
        category: selected?.category || ""
      });
    }
    selectionResults.forEach((result) => {
      checks.push(check(
        `select_by_id:${result.id}`,
        result.selectedId === result.id,
        result.selectedId ? `selected ${result.selectedId}` : "no selection"
      ));
    });

    await page.evaluate(() => window.__luminaDevEditor.selectEntityById("tutorial.human"));
    const listBefore = await page.evaluate(() => ({
      text: document.querySelector("#devEditorShowTilesToggle")?.textContent || "",
      rows: [...document.querySelectorAll("#devEditorObjectList .dev-editor-row")].map((row) => row.dataset.devObjectId || "")
    }));
    await page.click("#devEditorShowTilesToggle");
    await advance(page, 80);
    const listAfter = await page.evaluate(() => ({
      text: document.querySelector("#devEditorShowTilesToggle")?.textContent || "",
      rows: [...document.querySelectorAll("#devEditorObjectList .dev-editor-row")].map((row) => row.dataset.devObjectId || "")
    }));
    await page.fill("#devEditorObjectFilter", "ground tile 0,0");
    await advance(page, 80);
    const filteredRows = await page.evaluate(() => (
      [...document.querySelectorAll("#devEditorObjectList .dev-editor-row")].map((row) => row.dataset.devObjectId || "")
    ));

    checks.push(check(
      "tiles_hidden_by_default",
      !listBefore.rows.some((id) => id.startsWith("tutorial.ground_tile.")),
      `${listBefore.rows.filter((id) => id.startsWith("tutorial.ground_tile.")).length} tile rows before toggle`
    ));
    checks.push(check(
      "show_tiles_toggle_reveals_tiles",
      listAfter.rows.some((id) => id.startsWith("tutorial.ground_tile.")),
      `${listAfter.rows.filter((id) => id.startsWith("tutorial.ground_tile.")).length} tile rows after toggle`
    ));
    checks.push(check(
      "object_filter_finds_tile",
      filteredRows.includes("tutorial.ground_tile.0.0"),
      filteredRows.join(", ") || "no filtered rows"
    ));

    await page.fill("#devEditorObjectFilter", "");
    await advance(page, 80);
    await panDebugCameraAwayFromPanel(page);

    const clickResults = [];
    for (const target of CLICK_CATEGORIES) {
      const entity = await findClickableEntity(page, target.category);
      if (!entity) {
        clickResults.push({ category: target.category, label: target.label, entityId: "", selectedId: "" });
        continue;
      }
      const selectedId = await clickEntity(page, entity);
      clickResults.push({ category: target.category, label: target.label, entityId: entity.id, selectedId });
    }
    clickResults.forEach((result) => {
      checks.push(check(
        `canvas_click_selects:${result.label}`,
        Boolean(result.entityId) && result.selectedId === result.entityId,
        result.entityId ? `${result.entityId} -> ${result.selectedId}` : "no clickable entity found"
      ));
    });

    checks.push(check(
      "helpers_not_registered",
      !entities.some((entity) => /helper|collider/i.test(`${entity.id} ${entity.name} ${entity.category}`)),
      `${entities.length} editable entities`
    ));

    await page.evaluate(() => window.set_game_test_level_two_red_prototype_ready?.());
    await advance(page, 140);
    const elephantSelection = await page.evaluate(() => window.__luminaDevEditor.selectEntityById("level_two.elephant"));
    const elephantBefore = await entityLocalPosition(page, "level_two.elephant");
    await page.evaluate(() => document.querySelector('[data-dev-move="x"][data-dev-delta="1"]')?.click());
    await advance(page, 100);
    const elephantMoved = await entityLocalPosition(page, "level_two.elephant");
    const undoStateAfterMove = await page.evaluate(() => window.__luminaDevEditor.getTransformUndoState?.());
    const undoResult = await page.evaluate(() => window.__luminaDevEditor.undoLastTransform?.());
    await advance(page, 100);
    const elephantAfterUndo = await entityLocalPosition(page, "level_two.elephant");
    const selectedAfterUndo = await selectedEntityId(page);

    checks.push(check(
      "transform_undo_selects_elephant",
      elephantSelection?.id === "level_two.elephant",
      elephantSelection?.id || "elephant not selectable"
    ));
    checks.push(check(
      "transform_undo_records_nudge",
      Boolean(undoStateAfterMove?.canUndo) && !samePosition(elephantBefore, elephantMoved),
      `before=${JSON.stringify(elephantBefore)} moved=${JSON.stringify(elephantMoved)} undo=${JSON.stringify(undoStateAfterMove)}`
    ));
    checks.push(check(
      "transform_undo_restores_elephant",
      undoResult === true && sameXZ(elephantBefore, elephantAfterUndo),
      `before=${JSON.stringify(elephantBefore)} afterUndo=${JSON.stringify(elephantAfterUndo)} undoResult=${undoResult}`
    ));
    checks.push(check(
      "transform_undo_keeps_selection",
      selectedAfterUndo === "level_two.elephant",
      selectedAfterUndo || "no selected entity"
    ));

    const failed = checks.find((item) => !item.pass);
    const payload = {
      ok: !failed,
      command: "run-dev-editor-selectability-smoke",
      checks,
      diagnostics: {
        entityCount: entities.length,
        clickResults
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
    command: "run-dev-editor-selectability-smoke",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
