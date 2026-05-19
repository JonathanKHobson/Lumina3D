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
      name: "level_one_bridge_asset",
      pass: state?.levelOne?.bridgeAsset === "partial-bridge",
      details: state?.levelOne?.bridgeAsset || "missing bridge asset"
    });
  }

  if (targetLevel === "level_two") {
    checks.push({
      name: "level_two_placeholder_visible",
      pass: Boolean(state?.levelTwo?.placeholderLoveLetterVisible),
      details: `placeholderLoveLetterVisible=${Boolean(state?.levelTwo?.placeholderLoveLetterVisible)}`
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

    await jumpDirect(page, target);
    const state = await ensureAtLeastPlay(page, target);

    // Let physics settle briefly for deterministic smoke reads.
    for (let i = 0; i < 6; i++) await advance(page, 120);

    const finalState = await readState(page);
    const checks = buildInvariantChecks(finalState, target);
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
