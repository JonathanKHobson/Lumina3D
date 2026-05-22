import {
  formatJson,
  launchGameBrowser,
  readState,
  waitForScenePlayPhase,
  setPaused,
  advance,
  waitForState
} from "./lib/cli-utils.js";
import { getDebugShortcut, getLevel } from "./lib/levelCatalog.js";
import { jumpToLevel } from "./lib/cli-utils.js";

const USAGE_TEXT = "node scripts/run-scene-smoke.js [<level_id>] [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:run-scene-smoke -- level_two\n  npm run tools:run-scene-smoke -- tutorial --pretty --no-headless\n  npm run tools:run-scene-smoke`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function getPositional(args) {
  return args.filter((arg) => !arg.startsWith("--") && !arg.startsWith("-"));
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
  const positional = getPositional(args);
  return {
    levelId: positional[0] || "tutorial",
    pretty: args.includes("--pretty"),
    headless: !args.includes("--no-headless")
  };
}

function normalizedId(levelId) {
  const level = getLevel(levelId);
  if (!level) return "";
  return level.id;
}

function buildInvariantChecks(state, targetLevel) {
  const checks = [
    {
      name: "render_ready",
      pass: Boolean(state?.ready),
      details: state?.ready ? "render_game_to_text ready" : "render hook not ready"
    },
    {
      name: "scene_id",
      pass: state?.scene?.id === targetLevel,
      details: `${state?.scene?.id || "missing"} / expected ${targetLevel}`
    },
    {
      name: "scene_phase",
      pass: Boolean(state?.scene?.phase) && state.scene.phase !== "inactive",
      details: `phase=${state?.scene?.phase || "missing"}`
    }
  ];

  if (targetLevel === "home_intro") {
    checks.push({
      name: "home_phase",
      pass: Boolean(state?.home && state.home.phase && state.home.phase !== "inactive"),
      details: state?.home?.phase ? `home.phase=${state.home.phase}` : "missing home phase"
    });
  }

  if (targetLevel === "level_one") {
    checks.push({
      name: "level_one_blue_bloom_start",
      pass: state?.levelOne?.bridgeAsset === "blue-bloom-crossing-held" &&
        state?.levelOne?.blueBloomDocked === false &&
        state?.levelOne?.loveLetterVisibleFromStart === false,
      details: `asset=${state?.levelOne?.bridgeAsset || "missing"}, docked=${Boolean(state?.levelOne?.blueBloomDocked)}, loveLetterVisibleFromStart=${Boolean(state?.levelOne?.loveLetterVisibleFromStart)}`
    });
  }

  if (targetLevel === "level_two") {
    checks.push({
      name: "level_two_placeholder_visible",
      pass: Boolean(state?.levelTwo?.placeholderLoveLetterVisible),
      details: `placeholderLoveLetterVisible=${Boolean(state?.levelTwo?.placeholderLoveLetterVisible)}`
    });
  }

  if (targetLevel === "level_three") {
    checks.push({
      name: "level_three_placeholder_visible",
      pass: Boolean(state?.levelThree?.placeholderLoveLetterVisible),
      details: `placeholderLoveLetterVisible=${Boolean(state?.levelThree?.placeholderLoveLetterVisible)}`
    });
    checks.push({
      name: "level_three_mostly_water_lake_shell",
      pass: Boolean(state?.levelThree?.mostlyWater) &&
        String(state?.levelThree?.mapShape || "").includes("lake-islands"),
      details: `mapShape=${state?.levelThree?.mapShape || "missing"}, water=${state?.levelThree?.waterTileCount || 0}, land=${state?.levelThree?.landTileCount || 0}`
    });
    checks.push({
      name: "level_three_start_island_edge_connected",
      pass: state?.levelThree?.startIslandEdgeConnection?.connectedToLeftEdge === true,
      details: `edgeTiles=${(state?.levelThree?.startIslandEdgeConnection?.tiles || []).map((tile) => `${tile.x},${tile.y}`).join(";")}`
    });
    checks.push({
      name: "level_three_lily_pad_centers_on_water",
      pass: Array.isArray(state?.levelThree?.lilyPadLane) &&
        state.levelThree.lilyPadLane.length === 3 &&
        state.levelThree.lilyPadLane.every((pad) => pad.centerTileIsWater === true),
      details: `lilyPadTiles=${(state?.levelThree?.lilyPadLane || []).map((pad) => `${pad.id}:${pad.tileX},${pad.tileY}:${pad.centerTileIsWater}`).join(",")}`
    });
    checks.push({
      name: "level_three_phase_one_placeholders_present",
      pass: Array.isArray(state?.levelThree?.placeholders) &&
        ["level3StartIsland", "level3TotemGreenButton", "level3BridgeGreenButton", "level3TotemRaft", "level3CrocodileEcho", "level3LoveLetterCliff"].every((id) =>
          state.levelThree.placeholders.includes(id) ||
          state.levelThree.islands?.some((island) => island.id === id)
        ),
      details: `placeholderCount=${state?.levelThree?.placeholders?.length || 0}, islandCount=${state?.levelThree?.islandCount || 0}`
    });
    checks.push({
      name: "level_three_green_buttons_distinct_phase_2a",
      pass: Array.isArray(state?.levelThree?.greenButtons) &&
        state.levelThree.greenButtons.some((button) => button.id === "level3TotemGreenButton" && button.behaviorImplemented === true) &&
        state.levelThree.greenButtons.some((button) => button.id === "level3BridgeGreenButton" && button.behaviorImplemented === false),
      details: `greenButtons=${(state?.levelThree?.greenButtons || []).map((button) => `${button.id}:${button.behaviorImplemented}`).join(",")}`
    });
    checks.push({
      name: "level_three_crocodile_control_unavailable_phase_2a",
      pass: state?.levelThree?.phase2AState?.implemented === true &&
        state?.levelThree?.phase2AState?.crocodileControlAvailable === false &&
        state?.cubelings?.crocodile?.controllable === false,
      details: JSON.stringify({
        phase2A: state?.levelThree?.phase2AState || {},
        crocodile: state?.cubelings?.crocodile || {}
      })
    });
    checks.push({
      name: "level_three_buttons_use_established_visual_family",
      pass: Array.isArray(state?.levelThree?.greenButtons) &&
        state.levelThree.greenButtons.every((button) => button.visualAsset === "kaykit-platformer-button-green-material-variant") &&
        Array.isArray(state?.levelThree?.redButtonPlaceholders) &&
        state.levelThree.redButtonPlaceholders.every((button) => button.visualAsset === "kaykit-platformer-button-red-placeholder"),
      details: `greenAssets=${(state?.levelThree?.greenButtons || []).map((button) => button.visualAsset).join(",")}; redAssets=${(state?.levelThree?.redButtonPlaceholders || []).map((button) => button.visualAsset).join(",")}`
    });
    checks.push({
      name: "level_three_editor_marker_debug_output",
      pass: Array.isArray(state?.levelThree?.islandMarkers) &&
        state.levelThree.islandMarkers.some((marker) => marker.id === "level3StartIsland" && marker.editorSelectable === true) &&
        Array.isArray(state?.levelThree?.editorSelectableIds) &&
        state.levelThree.editorSelectableIds.includes("level3TotemGreenButton") &&
        state.levelThree.editorSelectableIds.includes("level3LoveLetterCliff"),
      details: `editorIds=${(state?.levelThree?.editorSelectableIds || []).length}, islandMarkers=${(state?.levelThree?.islandMarkers || []).length}`
    });
  }

  if (targetLevel === "tutorial") {
    checks.push({
      name: "tutorial_progress_present",
      pass: Boolean(state?.tutorial && state.tutorial.stepId),
      details: state?.tutorial?.stepId ? `tutorial.stepId=${state.tutorial.stepId}` : "missing tutorial stepId"
    });
  }

  return checks;
}

function buildTitleChecks(initialState, finalState, targetLevel) {
  const titleByLevel = {
    level_one: "Level One",
    level_two: "Level Two",
    level_three: "Level Three"
  };
  const expectedTitle = titleByLevel[targetLevel];
  if (!expectedTitle) return [];
  const visibleTitle = initialState?.scene?.titleCardVisible ? initialState?.scene?.titleCardText || "" : "";
  return [
    {
      name: `${targetLevel}_title_during_arrival`,
      pass: initialState?.scene?.phase === "arrival" && visibleTitle === expectedTitle,
      details: `phase=${initialState?.scene?.phase || "missing"} title=${visibleTitle || "hidden"}`
    },
    {
      name: `${targetLevel}_title_never_level_one_fallback`,
      pass: targetLevel === "level_one" || (
        initialState?.scene?.titleCardText !== "Level One" &&
        finalState?.scene?.titleCardText !== "Level One"
      ),
      details: `initial=${initialState?.scene?.titleCardText || ""} final=${finalState?.scene?.titleCardText || ""}`
    }
  ];
}

async function jumpDirect(page, targetLevel) {
  if (targetLevel === "tutorial") {
    const baselineState = await waitForState(page, (state) => state?.scene?.id === targetLevel, { label: "scene.id === tutorial", timeoutMs: 120000 });
    return baselineState;
  }

  const debugKey = getDebugShortcut(targetLevel);
  if (!debugKey) {
    throw new Error(`No debug key for ${targetLevel}`);
  }

  await jumpToLevel(page, debugKey, targetLevel);
  await setPaused(page, true);
  await advance(page, 120);
  return waitForScenePlayPhase(page, targetLevel, {
    timeoutMs: 120000,
    allowTitle: true
  });
}

async function ensureAtLeastPlay(page, targetLevel) {
  if (targetLevel === "tutorial") {
    return waitForState(
      page,
      (state) => state?.scene?.id === targetLevel && state?.scene?.phase !== "inactive",
      { label: "scene is active" }
    );
  }

  return waitForScenePlayPhase(page, targetLevel, { timeoutMs: 120000, allowTitle: true });
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
  const level = getLevel(parsed.levelId);
  if (!level) {
    throw new Error(`Unknown level id: ${parsed.levelId}`);
  }

  const target = normalizedId(parsed.levelId);
  const { browser, page } = await launchGameBrowser({ headless: parsed.headless });

  try {
    const waitReady = await waitForState(page, (state) => Boolean(state?.ready), { label: "render_game_to_text ready", timeoutMs: 120000 });
    await setPaused(page, true);
    await advance(page, 120);

    const initialState = await jumpDirect(page, target);
    const state = await ensureAtLeastPlay(page, target);

    // Let title timing and arrival motion settle enough to catch fade-frame title regressions.
    for (let i = 0; i < 16; i++) await advance(page, 120);

    const finalState = await readState(page);
    const checks = [
      ...buildInvariantChecks(finalState, target),
      ...buildTitleChecks(initialState, finalState, target)
    ];
    const failed = checks.find((check) => !check.pass);

    const payload = {
      ok: !failed,
      command: "run-scene-smoke",
      levelId: target,
      checks,
      diagnostics: {
        targetSceneFile: level.sceneFile,
        hasSmoke: level.smokeAvailable,
        readyState: {
          preRunReady: Boolean(waitReady?.ready),
          finalPhase: finalState?.scene?.phase
        }
      },
      state: {
        scene: finalState?.scene,
        activeActor: finalState?.activeActor,
        visibleAssets: finalState?.level?.visibleAssets?.length || 0
      }
    };

    const pretty = parsed.pretty;
    console.log(pretty ? formatJson(payload) : JSON.stringify(payload));
    if (!payload.ok) process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "run-scene-smoke",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
