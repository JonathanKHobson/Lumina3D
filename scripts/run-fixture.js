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
  if (levelId === "tutorial") {
    return waitForState(page, (state) => state?.scene?.id === levelId, {
      label: `scene.id === ${levelId}`,
      timeoutMs: 120000
    });
  }
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

  await advance(page, 3200);
  const ridingState = await readState(page);
  const ridingElevatorB = ridingState.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-b");
  checks.push({
    name: "human_rides_elevator_b",
    ok: Boolean(ridingElevatorB?.riderActors?.includes("human")),
    details: `riders=${(ridingElevatorB?.riderActors || []).join(",")}`
  });

  await page.keyboard.down("KeyW");
  await advance(page, 5650);
  const topState = await readState(page);
  const elevatorB = topState.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-b");
  checks.push({
    name: "elevator_b_reaches_top",
    ok: Number(elevatorB?.progress || 0) >= 0.92,
    details: `progress=${elevatorB?.progress}, moving=${elevatorB?.moving || ""}`
  });

  await advance(page, 2900);
  await page.keyboard.up("KeyW");
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

async function runLevelTwoRedAElephantExitRoute(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_exit_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_exit_ready();
  });
  checks.push({ name: "seeded_red_a_exit_route", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "elephant_starts_on_elevator_a",
    ok: readyState?.activeActor === "elephant" && readyState?.levelTwo?.elephantCubeling?.surfaceId === "red-elevator-a",
    details: `active=${readyState?.activeActor || ""}, elephantSurfaceId=${readyState?.levelTwo?.elephantCubeling?.surfaceId || ""}`
  });
  const elevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "elevator_a_top_aligned",
    ok: Number(elevatorA?.progress || 0) >= 0.92,
    details: `progress=${elevatorA?.progress}`
  });

  await hold(page, "KeyA", 1900, 130);
  await advance(page, 180);
  const exitState = await readState(page);
  checks.push({
    name: "elephant_walks_off_elevator_a",
    ok: exitState?.levelTwo?.elephantCubeling?.surfaceId === "tier-3-elephant-route" &&
      Number(exitState?.elephant?.x || 0) < 9.5,
    details: `elephantSurfaceId=${exitState?.levelTwo?.elephantCubeling?.surfaceId || ""}, elephant=(${exitState?.elephant?.x},${exitState?.elephant?.z})`
  });
  return { checks, state: exitState };
}

async function runLevelTwoRedAHumanExitRoute(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_human_exit_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_human_exit_ready();
  });
  checks.push({ name: "seeded_red_a_human_exit_route", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "human_starts_on_elevator_a",
    ok: readyState?.activeActor === "human" && readyState?.levelTwo?.humanSurfaceId === "red-elevator-a",
    details: `active=${readyState?.activeActor || ""}, humanSurfaceId=${readyState?.levelTwo?.humanSurfaceId || ""}`
  });
  const elevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "elevator_a_top_aligned_for_human",
    ok: Number(elevatorA?.progress || 0) >= 0.92,
    details: `progress=${elevatorA?.progress}`
  });

  await hold(page, "KeyA", 1900, 130);
  await advance(page, 180);
  const exitState = await readState(page);
  checks.push({
    name: "human_walks_off_elevator_a",
    ok: exitState?.levelTwo?.humanSurfaceId === "tier-3-elephant-route" &&
      Number(exitState?.human?.x || 0) < 9.5,
    details: `humanSurfaceId=${exitState?.levelTwo?.humanSurfaceId || ""}, human=(${exitState?.human?.x},${exitState?.human?.z})`
  });
  return { checks, state: exitState };
}

async function runLevelTwoRedAButtonStartsElevator(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_button_gate_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_button_gate_ready();
  });
  const readyElevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  const readyButtonA = readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-a");
  checks.push({ name: "seeded_red_a_button_gate", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "red_button_a_pressed_by_elephant",
    ok: Boolean(readyButtonA?.active) && readyButtonA?.heldActor === "elephant",
    details: `active=${Boolean(readyButtonA?.active)}, heldBy=${readyButtonA?.heldActor || ""}`
  });
  checks.push({
    name: "red_elevator_a_starts_immediately",
    ok: readyState?.activeActor === "human" &&
      Boolean(readyState?.levelTwo?.redElevatorAStartGate?.released) &&
      readyElevatorA?.moving === "down",
    details: `active=${readyState?.activeActor || ""}, gateReason=${readyState?.levelTwo?.redElevatorAStartGate?.waitingReason || ""}, progress=${readyElevatorA?.progress}, moving=${readyElevatorA?.moving || ""}`
  });

  await advance(page, 600);
  const movingState = await readState(page);
  const movingElevatorA = movingState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "red_elevator_a_continues_down_without_top_delay",
    ok: Boolean(movingState?.levelTwo?.redElevatorAStartGate?.released) &&
      Number(movingElevatorA?.progress || 1) < 0.98,
    details: `released=${Boolean(movingState?.levelTwo?.redElevatorAStartGate?.released)}, progress=${movingElevatorA?.progress}, moving=${movingElevatorA?.moving || ""}`
  });
  checks.push({
    name: "red_elevator_a_descends_without_human_approach",
    ok: ["down", "pause-bottom"].includes(movingElevatorA?.moving || "") ||
      Number(movingElevatorA?.progress || 1) < 0.98,
    details: `progress=${movingElevatorA?.progress}, moving=${movingElevatorA?.moving || ""}`
  });
  return { checks, state: movingState };
}

async function runLevelTwoRedAElephantBottomPause(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_elephant_bottom_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_elephant_bottom_ready();
  });
  const elevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  const buttonA = readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-a");
  checks.push({ name: "seeded_elephant_bottom_control", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "elephant_controls_elevator_a",
    ok: readyState?.activeActor === "elephant" &&
      readyState?.levelTwo?.elephantCubeling?.surfaceId === "red-elevator-a" &&
      Boolean(buttonA?.active),
    details: `active=${readyState?.activeActor || ""}, surface=${readyState?.levelTwo?.elephantCubeling?.surfaceId || ""}, button=${Boolean(buttonA?.active)}`
  });
  checks.push({
    name: "bottom_pause_kept_when_elephant_active",
    ok: elevatorA?.moving === "pause-bottom" &&
      Number(elevatorA?.pauseRemaining || 0) > 1.5,
    details: `progress=${elevatorA?.progress}, moving=${elevatorA?.moving || ""}, direction=${elevatorA?.direction || ""}, pause=${elevatorA?.pauseRemaining}`
  });

  await advance(page, 2700);
  const risingState = await readState(page);
  const risingElevatorA = risingState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "red_elevator_a_rises_after_bottom_pause",
    ok: Number(risingElevatorA?.progress || 0) > Number(elevatorA?.progress || 0),
    details: `start=${elevatorA?.progress}, after=${risingElevatorA?.progress}, moving=${risingElevatorA?.moving || ""}`
  });
  return { checks, state: risingState };
}

async function runLevelTwoRedAReleasedBottomStays(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_released_bottom_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_released_bottom_ready();
  });
  const elevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  const buttonA = readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-a");
  checks.push({ name: "seeded_released_bottom", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "red_button_a_not_held",
    ok: !buttonA?.active,
    details: `active=${Boolean(buttonA?.active)}, heldBy=${buttonA?.heldActor || ""}`
  });
  checks.push({
    name: "red_elevator_a_starts_bottom_idle",
    ok: Number(elevatorA?.progress || 0) <= 0.001 &&
      ["idle", "pause-bottom"].includes(elevatorA?.moving || ""),
    details: `progress=${elevatorA?.progress}, moving=${elevatorA?.moving || ""}, releaseTarget=${elevatorA?.releaseTarget}`
  });

  await advance(page, 3600);
  const heldState = await readState(page);
  const heldElevatorA = heldState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "red_elevator_a_stays_bottom_after_release",
    ok: Number(heldElevatorA?.progress || 0) <= 0.001 &&
      ["idle", "pause-bottom"].includes(heldElevatorA?.moving || ""),
    details: `progress=${heldElevatorA?.progress}, moving=${heldElevatorA?.moving || ""}, releaseTarget=${heldElevatorA?.releaseTarget}`
  });
  return { checks, state: heldState };
}

async function runLevelTwoLoveLetterCameraVisibility(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_love_letter_camera_ready !== "function") return null;
    return window.set_game_test_level_two_love_letter_camera_ready();
  });
  checks.push({ name: "seeded_love_letter_camera_visibility", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "human_on_high_love_letter_route",
    ok: readyState?.activeActor === "human" &&
      readyState?.levelTwo?.humanSurfaceId === "level-two-love-letter-route" &&
      Number(readyState?.camera?.activeSurfaceLift || 0) >= 8,
    details: `active=${readyState?.activeActor || ""}, surface=${readyState?.levelTwo?.humanSurfaceId || ""}, lift=${readyState?.camera?.activeSurfaceLift}`
  });
  checks.push({
    name: "camera_zoomed_out_for_height",
    ok: Boolean(readyState?.camera?.highElevationZoomActive) && Number(readyState?.camera?.zoom || 1) <= 0.78,
    details: `zoom=${readyState?.camera?.zoom}, high=${Boolean(readyState?.camera?.highElevationZoomActive)}`
  });
  checks.push({
    name: "camera_targets_high_actor",
    ok: Number(readyState?.camera?.targetY || 0) > 6,
    details: `targetY=${readyState?.camera?.targetY}`
  });
  return { checks, state: readyState };
}

async function runLevelTwoRedAGroundClearance(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_red_a_ground_clearance_ready !== "function") return null;
    return window.set_game_test_level_two_red_a_ground_clearance_ready();
  });
  checks.push({ name: "seeded_red_a_ground_clearance", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "ground_clearance_tiles_exposed",
    ok: Number(readyState?.levelTwo?.redElevatorAGroundClearance?.tileCount || 0) === 4,
    details: `tileCount=${readyState?.levelTwo?.redElevatorAGroundClearance?.tileCount}`
  });

  const humanState = await page.evaluate(() => window.set_game_test_level_two_red_a_ground_clearance_probe?.("human"));
  checks.push({
    name: "human_crosses_red_a_ground_corridor",
    ok: Number(humanState?.human?.x || 0) > 11.2,
    details: `human=(${humanState?.human?.x},${humanState?.human?.z}), surface=${humanState?.levelTwo?.humanSurfaceId || ""}, probe=${formatJson(humanState?.probe || {})}`
  });

  const frogState = await page.evaluate(() => window.set_game_test_level_two_red_a_ground_clearance_probe?.("frog"));
  checks.push({
    name: "frog_crosses_red_a_ground_corridor",
    ok: Number(frogState?.frog?.x || 0) > 11.2,
    details: `frog=(${frogState?.frog?.x},${frogState?.frog?.z}), surface=${frogState?.levelTwo?.frogSurfaceId || ""}, probe=${formatJson(frogState?.probe || {})}`
  });
  return { checks, state: frogState };
}

async function runTutorialFrogStrandedResetLesson(page) {
  const checks = [];
  await setPaused(page, true);
  const seededState = await page.evaluate(() => {
    if (typeof window.set_game_test_tutorial_frog_stranded !== "function") return null;
    return window.set_game_test_tutorial_frog_stranded();
  });
  checks.push({ name: "seeded_tutorial_stranded", ok: Boolean(seededState), details: `scene=${seededState?.scene?.id || "missing"}` });
  checks.push({
    name: "stranded_recovery_detected",
    ok: Boolean(seededState?.tutorial?.recovery?.stranded),
    details: `phase=${seededState?.tutorial?.recovery?.phase || ""}`
  });
  checks.push({
    name: "reset_prompt_visible",
    ok: String(seededState?.tutorial?.prompt || "").includes("Press R to reset"),
    details: `prompt=${seededState?.tutorial?.prompt || ""}`
  });
  checks.push({
    name: "character_stranded_line_visible",
    ok: seededState?.speech?.anchor === "human" &&
      seededState?.speech?.text === "Oh no. How am I gonna reach the Love Letter now?" &&
      Boolean(seededState?.tutorial?.recovery?.characterLineShown),
    details: `anchor=${seededState?.speech?.anchor || ""}, speech=${seededState?.speech?.text || ""}`
  });
  checks.push({
    name: "button_not_immediately_pressed",
    ok: !seededState?.button?.pressed && !seededState?.doorway?.open,
    details: `button=${Boolean(seededState?.button?.pressed)}, doorway=${Boolean(seededState?.doorway?.open)}`
  });

  await advance(page, 2500);
  const delayState = await readState(page);
  checks.push({
    name: "button_still_delayed_during_reset_lesson",
    ok: !delayState?.button?.pressed && delayState?.tutorial?.recovery?.phase === "reset_lesson",
    details: `button=${Boolean(delayState?.button?.pressed)}, phase=${delayState?.tutorial?.recovery?.phase || ""}`
  });

  await page.keyboard.press("KeyR");
  await advance(page, 180);
  const resetState = await readState(page);
  checks.push({
    name: "reset_returns_to_tutorial_start",
    ok: resetState?.tutorial?.stepId === "move_up" && !resetState?.tutorial?.recovery?.stranded,
    details: `step=${resetState?.tutorial?.stepId || ""}, recovery=${Boolean(resetState?.tutorial?.recovery?.stranded)}`
  });
  checks.push({
    name: "reset_clears_button_and_doorway",
    ok: !resetState?.button?.pressed && !resetState?.doorway?.open,
    details: `button=${Boolean(resetState?.button?.pressed)}, doorway=${Boolean(resetState?.doorway?.open)}`
  });
  return { checks, state: resetState };
}

async function runTutorialUnpossessedFrogButtonRescue(page) {
  const checks = [];
  await setPaused(page, true);
  const seededState = await page.evaluate(() => {
    if (typeof window.set_game_test_tutorial_frog_stranded !== "function") return null;
    return window.set_game_test_tutorial_frog_stranded();
  });
  checks.push({ name: "seeded_tutorial_stranded", ok: Boolean(seededState), details: `scene=${seededState?.scene?.id || "missing"}` });
  checks.push({
    name: "starts_with_button_delayed",
    ok: !seededState?.button?.pressed && seededState?.tutorial?.recovery?.phase === "reset_lesson",
    details: `button=${Boolean(seededState?.button?.pressed)}, phase=${seededState?.tutorial?.recovery?.phase || ""}`
  });

  await advance(page, 2500);
  const earlyState = await readState(page);
  checks.push({
    name: "early_window_does_not_autosolve",
    ok: !earlyState?.button?.pressed && !earlyState?.doorway?.open,
    details: `button=${Boolean(earlyState?.button?.pressed)}, doorway=${Boolean(earlyState?.doorway?.open)}`
  });

  await advance(page, 12500);
  const rescuedState = await readState(page);
  checks.push({
    name: "unpossessed_frog_presses_button_after_delay",
    ok: Boolean(rescuedState?.button?.pressed),
    details: `button=${Boolean(rescuedState?.button?.pressed)}, frogToButton=${rescuedState?.distances?.frogToButton}`
  });
  checks.push({
    name: "doorway_opens_after_rescue",
    ok: Boolean(rescuedState?.doorway?.open),
    details: `doorway=${Boolean(rescuedState?.doorway?.open)}`
  });
  checks.push({
    name: "recovery_clears_after_button",
    ok: !rescuedState?.tutorial?.recovery?.stranded,
    details: `phase=${rescuedState?.tutorial?.recovery?.phase || ""}`
  });
  return { checks, state: rescuedState };
}

async function runLevelOneUnpossessedFrogButtonActivation(page) {
  const checks = [];
  await setPaused(page, true);
  const seededState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_one_unpossessed_frog_button_ready !== "function") return null;
    return window.set_game_test_level_one_unpossessed_frog_button_ready();
  });
  checks.push({ name: "seeded_level_one_button", ok: Boolean(seededState), details: `scene=${seededState?.scene?.id || "missing"}` });
  checks.push({
    name: "human_active_before_press",
    ok: seededState?.activeActor === "human" && !seededState?.button?.pressed,
    details: `active=${seededState?.activeActor || ""}, button=${Boolean(seededState?.button?.pressed)}`
  });
  await advance(page, 180);
  const pressedState = await readState(page);
  checks.push({
    name: "unpossessed_frog_presses_level_one_button",
    ok: Boolean(pressedState?.button?.pressed),
    details: `button=${Boolean(pressedState?.button?.pressed)}`
  });
  checks.push({
    name: "level_one_bridge_activates",
    ok: Boolean(pressedState?.levelOne?.bridgeComplete),
    details: `bridgeComplete=${Boolean(pressedState?.levelOne?.bridgeComplete)}`
  });
  return { checks, state: pressedState };
}

async function runLevelTwoUnpossessedFrogBlueButtonActivation(page) {
  const checks = [];
  await setPaused(page, true);
  const seededState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_two_unpossessed_frog_blue_button_ready !== "function") return null;
    return window.set_game_test_level_two_unpossessed_frog_blue_button_ready();
  });
  checks.push({ name: "seeded_level_two_blue_button", ok: Boolean(seededState), details: `scene=${seededState?.scene?.id || "missing"}` });
  checks.push({
    name: "human_active_before_press",
    ok: seededState?.activeActor === "human" && !seededState?.levelTwo?.blueButton?.pressed,
    details: `active=${seededState?.activeActor || ""}, button=${Boolean(seededState?.levelTwo?.blueButton?.pressed)}`
  });
  await advance(page, 180);
  const pressedState = await readState(page);
  checks.push({
    name: "unpossessed_frog_presses_level_two_blue_button",
    ok: Boolean(pressedState?.levelTwo?.blueButton?.pressed),
    details: `button=${Boolean(pressedState?.levelTwo?.blueButton?.pressed)}`
  });
  checks.push({
    name: "level_two_blue_ramp_activates",
    ok: Boolean(pressedState?.levelTwo?.blueRamp?.active),
    details: `blueRamp=${Boolean(pressedState?.levelTwo?.blueRamp?.active)}`
  });
  return { checks, state: pressedState };
}

const IMPLEMENTED_FIXTURES = {
  tutorial_frog_stranded_reset_lesson: runTutorialFrogStrandedResetLesson,
  tutorial_unpossessed_frog_button_rescue: runTutorialUnpossessedFrogButtonRescue,
  level_one_unpossessed_frog_button_activation: runLevelOneUnpossessedFrogButtonActivation,
  level_two_start: runLevelTwoStart,
  level_two_love_letter_ready: runLevelTwoLoveLetterReady,
  level_two_red_a_button_starts_elevator: runLevelTwoRedAButtonStartsElevator,
  level_two_red_a_elephant_bottom_pause: runLevelTwoRedAElephantBottomPause,
  level_two_red_a_released_bottom_stays: runLevelTwoRedAReleasedBottomStays,
  level_two_red_a_elephant_exit_route: runLevelTwoRedAElephantExitRoute,
  level_two_red_a_human_exit_route: runLevelTwoRedAHumanExitRoute,
  level_two_love_letter_camera_visibility: runLevelTwoLoveLetterCameraVisibility,
  level_two_red_a_ground_clearance: runLevelTwoRedAGroundClearance,
  level_two_red_b_route: runLevelTwoRedBRoute,
  level_two_unpossessed_frog_blue_button_activation: runLevelTwoUnpossessedFrogBlueButtonActivation
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
