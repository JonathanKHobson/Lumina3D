import {
  formatJson,
  launchGameBrowser,
  readState,
  waitForScenePlayPhase,
  waitForState,
  setPaused,
  advance,
  hold,
  jumpToLevel
} from "./lib/cli-utils.js";
import { getFixture, getLevel, getDebugShortcut } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/run-fixture.js <level_id> <fixture_id> [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nCommon fixture flow:\n  npm run tools:run-fixture -- level_two level_two_start --pretty\n  npm run tools:run-fixture -- level_two level_two_love_letter_ready`;

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
    levelId: positional[0] || "level_two",
    fixtureId: positional[1] || "",
    pretty: args.includes("--pretty"),
    headless: !args.includes("--no-headless")
  };
}

function fixtureOutput(level, fixture, state) {
  return {
    ok: fixture.status !== "unsupported",
    status: fixture.status,
    command: "run-fixture",
    levelId: level.id,
    fixtureId: fixture.id,
    fixtureState: {
      scene: state.scene,
      phase: state.scene?.phase,
      levelOnePhase: state.levelOne?.phase,
      levelTwoPhase: state.levelTwo?.phase,
      visibleAssets: state.level?.visibleAssets?.length || 0
    },
    reason: fixture.reason || null,
    migrationHint: fixture.migrationHint || null
  };
}

function validateArgs(rawLevel, rawFixture) {
  if (!rawLevel || !rawFixture) {
    return {
      ok: false,
      error: USAGE_TEXT
    };
  }
  const level = getLevel(rawLevel);
  const fixture = getFixture(rawLevel, rawFixture);
  if (!level) {
    return { ok: false, error: `Unknown level id: ${rawLevel}` };
  }
  if (!fixture) {
    return { ok: false, error: `Unknown fixture '${rawFixture}' for level '${rawLevel}'` };
  }
  return { ok: true, level, fixture };
}

async function ensureLevelLoaded(page, levelId) {
  const shortcut = getDebugShortcut(levelId);
  if (!shortcut) {
    const state = await waitForState(page, (next) => next?.scene?.id === levelId, { timeoutMs: 120000, label: "scene id" });
    return state;
  }
  await jumpToLevel(page, shortcut, levelId);
  await setPaused(page, true);
  await advance(page, 160);
  return waitForScenePlayPhase(page, levelId, { timeoutMs: 120000 });
}

async function runLevelTwoStart(page) {
  const checks = [];
  await setPaused(page, true);
  const state = await waitForScenePlayPhase(page, "level_two", { timeoutMs: 120000 });
  checks.push({ name: "loaded_level_two", ok: state.scene?.id === "level_two", details: `phase=${state.scene?.phase}` });
  checks.push({ name: "has_human_start", ok: Boolean(state.human), details: `x=${state.human?.x}, z=${state.human?.z}` });
  return { checks, state };
}

async function runLevelTwoLoveLetterReady(page) {
  const checks = [];
  const state = await waitForScenePlayPhase(page, "level_two", { timeoutMs: 120000 });
  checks.push({ name: "loaded_level_two", ok: state.scene?.id === "level_two", details: `phase=${state.scene?.phase}` });

  const readyState = await waitForState(page, (next) => Boolean(next?.levelTwo?.placeholderLoveLetterVisible), {
    timeoutMs: 120000,
    label: "placeholder love letter visibility"
  });
  checks.push({
    name: "love_letter_placeholder_visible",
    ok: Boolean(readyState.levelTwo?.placeholderLoveLetterVisible),
    details: `placeholderLoveLetterVisible=${Boolean(readyState.levelTwo?.placeholderLoveLetterVisible)}`
  });
  return { checks, state: readyState };
}

async function runLevelTwoRedBRoute(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_b_ready !== "function") return null;
    return window.set_game_test_level_two_red_b_ready();
  });
  checks.push({ name: "seeded_red_b_route", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({ name: "loaded_level_two", ok: readyState?.scene?.id === "level_two", details: `phase=${readyState?.scene?.phase}` });
  checks.push({
    name: "red_button_b_pressed_by_elephant",
    ok: Boolean(readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-b")?.active),
    details: `heldBy=${readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-b")?.heldActor || ""}`
  });
  checks.push({
    name: "human_boarded_elevator_b",
    ok: readyState?.levelTwo?.humanSurfaceId === "red-elevator-b",
    details: `humanSurfaceId=${readyState?.levelTwo?.humanSurfaceId || ""}`
  });

  await advance(page, 5900);
  const topState = await readState(page);
  const elevatorB = topState.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-b");
  checks.push({
    name: "elevator_b_reaches_top",
    ok: Number(elevatorB?.progress || 0) >= 0.92,
    details: `progress=${elevatorB?.progress}, moving=${elevatorB?.moving || ""}`
  });
  checks.push({
    name: "human_rides_elevator_b",
    ok: Boolean(elevatorB?.riderActors?.includes("human")),
    details: `riders=${(elevatorB?.riderActors || []).join(",")}`
  });

  await hold(page, "KeyW", 2550, 130);
  await hold(page, "KeyD", 420, 105);
  await advance(page, 160);
  const completeState = await readState(page);
  checks.push({
    name: "human_walked_love_letter_route",
    ok: Boolean(completeState?.levelTwo?.complete) ||
      completeState?.levelTwo?.humanSurfaceId === "level-two-love-letter-route",
    details: `humanSurfaceId=${completeState?.levelTwo?.humanSurfaceId || ""}, human=(${completeState?.human?.x},${completeState?.human?.z})`
  });
  checks.push({
    name: "level_two_love_letter_collects",
    ok: Boolean(completeState?.reward?.collected),
    details: `collected=${Boolean(completeState?.reward?.collected)}`
  });
  checks.push({
    name: "level_two_complete",
    ok: Boolean(completeState?.levelTwo?.complete),
    details: `complete=${Boolean(completeState?.levelTwo?.complete)}`
  });
  checks.push({
    name: "level_two_love_letter_message",
    ok: completeState?.loveLetterMessage?.id === "level_two_love_letter_01",
    details: `messageId=${completeState?.loveLetterMessage?.id || ""}`
  });
  return { checks, state: completeState };
}

const IMPLEMENTED_FIXTURES = {
  level_two_start: runLevelTwoStart,
  level_two_love_letter_ready: runLevelTwoLoveLetterReady,
  level_two_red_b_route: runLevelTwoRedBRoute
};

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
  const validation = validateArgs(parsed.levelId, parsed.fixtureId);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const { level, fixture } = validation;
  const unsupported = fixture.status === "unsupported";
  const unsupportedPayload = {
    ok: true,
    command: "run-fixture",
    status: "unsupported",
    levelId: level.id,
    fixtureId: fixture.id,
    reason: fixture.reason,
    migrationHint: fixture.migrationHint,
    fixtureState: {
      scene: { id: level.sceneId, phase: "not_run" },
      phase: "not_run",
      levelOnePhase: null,
      levelTwoPhase: null
    },
    stepResults: []
  };

  if (unsupported) {
    console.log(parsed.pretty ? formatJson(unsupportedPayload) : JSON.stringify(unsupportedPayload));
    return;
  }

  const handler = IMPLEMENTED_FIXTURES[fixture.id];
  if (!handler) {
    throw new Error(`No executor for implemented fixture '${fixture.id}'`);
  }

  const browserResult = await launchGameBrowser({ headless: parsed.headless });
  const { browser, page } = browserResult;
  try {
    await ensureLevelLoaded(page, level.id);
    const { checks, state } = await handler(page);
    const success = checks.every((check) => check.ok);
    const payload = fixtureOutput(level, fixture, state);
    payload.ok = success;
    payload.stepResults = checks;

    console.log(parsed.pretty ? formatJson(payload) : JSON.stringify(payload));
    if (!success) process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "run-fixture",
    error: { message: error?.message || String(error), usage: USAGE_TEXT }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
