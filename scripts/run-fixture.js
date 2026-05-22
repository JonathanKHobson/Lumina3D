import {
  formatJson,
  launchGameBrowser,
  readState,
  waitForScenePlayPhase,
  waitForState,
  setPaused,
  advance,
  tap,
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

async function runLevelThreeStart(page) {
  const checks = [];
  await setPaused(page, true);
  const initialState = await waitForScenePlayPhase(page, "level_three", { timeoutMs: 120000 });
  checks.push({ name: "loaded_level_three", ok: initialState.scene?.id === "level_three", details: `phase=${initialState.scene?.phase}` });
  checks.push({
    name: "level_three_title_during_arrival",
    ok: initialState.scene?.phase === "arrival" && initialState.scene?.titleCardText === "Level Three",
    details: `phase=${initialState.scene?.phase}, title=${initialState.scene?.titleCardText || ""}`
  });

  await advance(page, 2200);
  const state = await readState(page);
  checks.push({
    name: "level_three_placeholder_visible",
    ok: Boolean(state.levelThree?.placeholderLoveLetterVisible),
    details: `placeholderLoveLetterVisible=${Boolean(state.levelThree?.placeholderLoveLetterVisible)}`
  });
  checks.push({
    name: "level_three_placeholder_not_collectable",
    ok: !state.levelThree?.placeholderLoveLetterCollectable && !state.levelThree?.complete,
    details: `collectable=${Boolean(state.levelThree?.placeholderLoveLetterCollectable)}, complete=${Boolean(state.levelThree?.complete)}`
  });
  checks.push({
    name: "level_three_frog_available",
    ok: Boolean(state.levelThree?.frogAvailableFromStart),
    details: `frogAvailableFromStart=${Boolean(state.levelThree?.frogAvailableFromStart)}`
  });
  checks.push({
    name: "level_three_water_shell_present",
    ok: Number(state.levelThree?.waterTileCount || 0) > 0,
    details: `waterTileCount=${state.levelThree?.waterTileCount || 0}`
  });
  checks.push({
    name: "level_three_mostly_water_island_map",
    ok: Boolean(state.levelThree?.mostlyWater) &&
      Number(state.levelThree?.islandCount || 0) >= 11,
    details: `water=${state.levelThree?.waterTileCount || 0}, land=${state.levelThree?.landTileCount || 0}, islands=${state.levelThree?.islandCount || 0}`
  });
  checks.push({
    name: "level_three_start_island_edge_connected",
    ok: state.levelThree?.startIslandEdgeConnection?.connectedToLeftEdge === true,
    details: `edgeTiles=${(state.levelThree?.startIslandEdgeConnection?.tiles || []).map((tile) => `${tile.x},${tile.y}`).join(";")}`
  });
  checks.push({
    name: "level_three_lily_pad_centers_on_water",
    ok: Array.isArray(state.levelThree?.lilyPadLane) &&
      state.levelThree.lilyPadLane.length === 3 &&
      state.levelThree.lilyPadLane.every((pad) => pad.centerTileIsWater === true),
    details: `lilyPadTiles=${(state.levelThree?.lilyPadLane || []).map((pad) => `${pad.id}:${pad.tileX},${pad.tileY}:${pad.centerTileIsWater}`).join(",")}`
  });
  checks.push({
    name: "level_three_required_zone_ids_present",
    ok: [
      "level3StartIsland",
      "level3FrogLaneStart",
      "level3TotemWinchIsland",
      "level3CenterHub",
      "level3GreenButtonIsland",
      "level3ElephantIsland",
      "level3RedButtonAIsland",
      "level3PlatformDockIsland",
      "level3WeightCacheIsland",
      "level3RedButtonBIsland",
      "level3LoveLetterCliff"
    ].every((id) => state.levelThree?.islands?.some((island) => island.id === id)),
    details: `islands=${(state.levelThree?.islands || []).map((island) => island.id).join(",")}`
  });
  checks.push({
    name: "level_three_opening_and_bridge_green_buttons_distinct",
    ok: state.levelThree?.greenButtons?.some((button) => button.id === "level3TotemGreenButton" && button.futureMechanism === "crocodile-totem-raft-winch") &&
      state.levelThree?.greenButtons?.some((button) => button.id === "level3BridgeGreenButton" && button.futureMechanism === "central-bridge-cycle"),
    details: `greenButtons=${(state.levelThree?.greenButtons || []).map((button) => `${button.id}:${button.futureMechanism}`).join(",")}`
  });
  checks.push({
    name: "level_three_buttons_use_established_visual_family",
    ok: Array.isArray(state.levelThree?.greenButtons) &&
      state.levelThree.greenButtons.every((button) => button.visualAsset === "kaykit-platformer-button-green-material-variant") &&
      Array.isArray(state.levelThree?.redButtonPlaceholders) &&
      state.levelThree.redButtonPlaceholders.every((button) => button.visualAsset === "kaykit-platformer-button-red-placeholder"),
    details: `greenAssets=${(state.levelThree?.greenButtons || []).map((button) => button.visualAsset).join(",")}; redAssets=${(state.levelThree?.redButtonPlaceholders || []).map((button) => button.visualAsset).join(",")}`
  });
  checks.push({
    name: "level_three_phase_2a_opening_mechanics_declared",
    ok: state.levelThree?.phase2AState?.implemented === true &&
      state.levelThree?.greenButtons?.some((button) => button.id === "level3TotemGreenButton" && button.behaviorImplemented === true) &&
      state.levelThree?.greenButtons?.some((button) => button.id === "level3BridgeGreenButton" && button.behaviorImplemented === false),
    details: JSON.stringify({
      phase2A: state.levelThree?.phase2AState || {},
      greenButtons: state.levelThree?.greenButtons || []
    })
  });
  checks.push({
    name: "level_three_neutral_future_state_fields",
    ok: state.levelThree?.neutralFutureState?.level3TotemRaftState === 0 &&
      state.levelThree?.neutralFutureState?.level3TotemRaftDocked === false &&
      state.levelThree?.neutralFutureState?.level3CrocodileUnlocked === false &&
      state.levelThree?.neutralFutureState?.level3BridgeState === 0,
    details: JSON.stringify(state.levelThree?.neutralFutureState || {})
  });
  checks.push({
    name: "level_three_editor_selectable_ids_present",
    ok: ["level3StartIsland", "level3FrogLaneStart", "level3TotemGreenButton", "level3TotemRaft", "level3CrocodileEcho", "level3BridgeGreenButton", "level3LoveLetterCliff"]
      .every((id) => state.levelThree?.editorSelectableIds?.includes(id)),
    details: `editorSelectableIds=${(state.levelThree?.editorSelectableIds || []).join(",")}`
  });
  checks.push({
    name: "level_three_authoring_contract_spatial_repair",
    ok: String(state.levelThree?.authoringContract || "").includes("Spatial contract repair") &&
      state.levelThree?.spatialContractRepairState?.implemented === true,
    details: state.levelThree?.authoringContract || ""
  });
  checks.push({
    name: "level_three_lily_pads_enlarged_for_frog",
    ok: Array.isArray(state.levelThree?.lilyPadLane) &&
      state.levelThree.lilyPadLane.every((pad) => Number(pad.radius || 0) >= 0.9),
    details: `radii=${(state.levelThree?.lilyPadLane || []).map((pad) => `${pad.id}:${pad.radius}`).join(",")}`
  });
  return { checks, state };
}

async function runLevelThreeCrocodileTotemOpening(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_three_opening_ready !== "function") return null;
    return window.set_game_test_level_three_opening_ready();
  });
  checks.push({ name: "seeded_level_three_opening", ok: Boolean(readyState), details: `scene=${readyState?.scene?.id || "missing"}` });
  checks.push({
    name: "human_and_frog_available",
    ok: readyState?.activeActor === "frog" &&
      Boolean(readyState?.levelThree?.frogAvailableFromStart) &&
      readyState?.cubelings?.frog?.unlocked === true,
    details: `active=${readyState?.activeActor || ""}, frogAvailable=${Boolean(readyState?.levelThree?.frogAvailableFromStart)}`
  });
  checks.push({
    name: "crocodile_control_starts_unavailable",
    ok: readyState?.cubelings?.crocodile?.controllable === false &&
      readyState?.levelThree?.phase2AState?.crocodileControlAvailable === false,
    details: JSON.stringify(readyState?.cubelings?.crocodile || {})
  });

  let state = readyState;
  for (let index = 1; index <= 3; index += 1) {
    state = await page.evaluate(() => window.set_game_test_level_three_frog_at_totem_button?.());
    const driftState = state?.levelThree?.phase2AState || {};
    checks.push({
      name: `totem_green_press_${index}_starts_raft_drift`,
      ok: driftState.totemGreenButtonPresses === index &&
        driftState.totemRaftState === index - 1 &&
        driftState.totemRaftTargetState === index &&
        driftState.totemRaftDrifting === true,
      details: `presses=${driftState.totemGreenButtonPresses}, raftState=${driftState.totemRaftState}, target=${driftState.totemRaftTargetState}, drifting=${Boolean(driftState.totemRaftDrifting)}`
    });
    const driftPressState = await page.evaluate(() => window.set_game_test_level_three_frog_at_totem_button?.());
    checks.push({
      name: `totem_green_press_${index}_ignored_while_drifting`,
      ok: driftPressState?.levelThree?.phase2AState?.totemGreenButtonPresses === index &&
        driftPressState?.levelThree?.phase2AState?.totemRaftTargetState === index,
      details: `presses=${driftPressState?.levelThree?.phase2AState?.totemGreenButtonPresses}, target=${driftPressState?.levelThree?.phase2AState?.totemRaftTargetState}`
    });
    await advance(page, 1900);
    state = await readState(page);
    const landedState = state?.levelThree?.phase2AState || {};
    checks.push({
      name: `totem_raft_drift_${index}_reaches_resting_marker`,
      ok: landedState.totemRaftState === Math.min(index, 3) &&
        landedState.totemRaftDrifting === false,
      details: `raftState=${landedState.totemRaftState}, drifting=${Boolean(landedState.totemRaftDrifting)}, progress=${landedState.totemRaftDriftProgress}`
    });
    if (index < 3) {
      state = await page.evaluate(() => window.set_game_test_level_three_frog_off_totem_button?.());
      checks.push({
        name: `totem_green_press_${index}_released_for_repeat`,
        ok: state?.levelThree?.phase2AState?.totemGreenButtonPressed === false,
        details: `pressed=${Boolean(state?.levelThree?.phase2AState?.totemGreenButtonPressed)}`
      });
    }
  }

  checks.push({
    name: "totem_raft_docked_after_three_presses",
    ok: state?.levelThree?.phase2AState?.totemRaftDocked === true &&
      state?.levelThree?.totemRaft?.collectable === true,
    details: `docked=${Boolean(state?.levelThree?.phase2AState?.totemRaftDocked)}, collectable=${Boolean(state?.levelThree?.totemRaft?.collectable)}`
  });

  const frogTouchState = await page.evaluate(() => window.set_game_test_level_three_actor_at_totem_raft?.("frog"));
  checks.push({
    name: "frog_cannot_collect_crocodile_totem",
    ok: frogTouchState?.levelThree?.phase2AState?.crocodileTotemCollected === false &&
      frogTouchState?.levelThree?.phase2AState?.crocodileEchoAwake === false,
    details: `collected=${Boolean(frogTouchState?.levelThree?.phase2AState?.crocodileTotemCollected)}, echoAwake=${Boolean(frogTouchState?.levelThree?.phase2AState?.crocodileEchoAwake)}`
  });

  const humanCollectState = await page.evaluate(() => window.set_game_test_level_three_actor_at_totem_raft?.("human"));
  checks.push({
    name: "human_collects_crocodile_totem",
    ok: humanCollectState?.levelThree?.phase2AState?.crocodileTotemCollected === true &&
      humanCollectState?.levelThree?.phase2AState?.crocodileUnlocked === true,
    details: `collected=${Boolean(humanCollectState?.levelThree?.phase2AState?.crocodileTotemCollected)}, unlocked=${Boolean(humanCollectState?.levelThree?.phase2AState?.crocodileUnlocked)}`
  });
  checks.push({
    name: "crocodile_echo_wakes_and_control_becomes_available",
    ok: humanCollectState?.levelThree?.phase2AState?.crocodileEchoAwake === true &&
      humanCollectState?.levelThree?.phase2AState?.crocodileControlAvailable === true &&
      humanCollectState?.levelThree?.phase2AState?.crocodileSpawned === true &&
      humanCollectState?.cubelings?.crocodile?.controllable === true,
    details: JSON.stringify({
      phase2A: humanCollectState?.levelThree?.phase2AState || {},
      crocodile: humanCollectState?.cubelings?.crocodile || {}
    })
  });
  return { checks, state: humanCollectState };
}

async function runLevelThreeSpatialContract(page) {
  const checks = [];
  await setPaused(page, true);
  let state = await page.evaluate(() => {
    if (typeof window.set_game_test_level_three_opening_ready !== "function") return null;
    return window.set_game_test_level_three_opening_ready();
  });
  checks.push({
    name: "seeded_level_three_spatial_contract",
    ok: state?.scene?.id === "level_three",
    details: `scene=${state?.scene?.id || "missing"}`
  });

  const lilyContract = state?.levelThree?.lilyPadSpatialContract || {};
  checks.push({
    name: "lily_pad_centers_and_tracks_are_over_water",
    ok: lilyContract.allCentersOnWater === true && lilyContract.allTrackEndpointsOnWater === true,
    details: JSON.stringify(lilyContract.trackEndpointChecks || [])
  });
  checks.push({
    name: "lily_pad_spacing_reserves_future_motion_corridors",
    ok: lilyContract.futureMotionCorridorsReserved === true &&
      Number(lilyContract.nearestPadEdgeGap || 0) >= Number(lilyContract.minPadEdgeGap || 0),
    details: JSON.stringify({
      nearestPadEdgeGap: lilyContract.nearestPadEdgeGap,
      minPadEdgeGap: lilyContract.minPadEdgeGap,
      padEdgeGaps: lilyContract.padEdgeGaps
    })
  });
  checks.push({
    name: "lily_pad_three_has_gap_to_totem_winch_island",
    ok: Number(lilyContract.pad3ToTotemWinchIslandGap || 0) >= Number(lilyContract.minPadToIslandGap || 0),
    details: `gap=${lilyContract.pad3ToTotemWinchIslandGap}, min=${lilyContract.minPadToIslandGap}`
  });

  const islands = state?.levelThree?.islands || [];
  const islandCount = (id) => islands.find((island) => island.id === id)?.tileCount || 999;
  checks.push({
    name: "non_start_islands_have_small_puzzle_footprints",
    ok: islandCount("level3TotemWinchIsland") <= 5 &&
      islandCount("level3CenterHub") <= 1 &&
      islandCount("level3ElephantIsland") <= 5 &&
      islandCount("level3RedButtonAIsland") <= 5 &&
      islandCount("level3PlatformDockIsland") <= 5,
    details: JSON.stringify({
      totemWinch: islandCount("level3TotemWinchIsland"),
      centerHub: islandCount("level3CenterHub"),
      elephant: islandCount("level3ElephantIsland"),
      redA: islandCount("level3RedButtonAIsland"),
      platformDock: islandCount("level3PlatformDockIsland")
    })
  });

  const bridge = state?.levelThree?.bridgePlaceholders || {};
  checks.push({
    name: "center_hub_is_small_artificial_pivot",
    ok: bridge.pivot?.role === "rotating-bridge-pivot" &&
      bridge.pivot?.artificial === true &&
      Number(bridge.pivot?.footprintTiles || 0) === 1 &&
      bridge.cycleImplemented === false,
    details: JSON.stringify(bridge.pivot || {})
  });
  checks.push({
    name: "bridge_destinations_form_ring_and_red_a_is_distant",
    ok: Array.isArray(bridge.destinationRing) &&
      bridge.destinationRing.length >= 4 &&
      bridge.redButtonAMeaningfullyDistant === true,
    details: JSON.stringify({
      redButtonADistanceFromPivot: bridge.redButtonADistanceFromPivot,
      destinationRing: bridge.destinationRing
    })
  });

  const raftBefore = state?.levelThree?.totemRaft || {};
  state = await page.evaluate(() => window.set_game_test_level_three_frog_at_totem_button?.());
  const raftStarted = state?.levelThree?.totemRaft || {};
  await advance(page, 450);
  const raftMidState = await readState(page);
  const raftMid = raftMidState?.levelThree?.totemRaft || {};
  checks.push({
    name: "raft_drift_changes_position_over_multiple_frames",
    ok: raftStarted.drifting === true &&
      raftMid.drifting === true &&
      raftMid.stateIndex === raftBefore.stateIndex &&
      (Number(raftMid.x) !== Number(raftStarted.x) || Number(raftMid.z) !== Number(raftStarted.z)),
    details: JSON.stringify({
      before: { x: raftBefore.x, z: raftBefore.z, state: raftBefore.stateIndex },
      started: { x: raftStarted.x, z: raftStarted.z, state: raftStarted.stateIndex, progress: raftStarted.driftProgress },
      mid: { x: raftMid.x, z: raftMid.z, state: raftMid.stateIndex, progress: raftMid.driftProgress }
    })
  });
  const repeatDuringDrift = await page.evaluate(() => window.set_game_test_level_three_frog_at_totem_button?.());
  checks.push({
    name: "button_press_while_raft_drifts_does_not_skip_state",
    ok: repeatDuringDrift?.levelThree?.phase2AState?.totemGreenButtonPresses === 1 &&
      repeatDuringDrift?.levelThree?.phase2AState?.totemRaftTargetState === 1,
    details: JSON.stringify(repeatDuringDrift?.levelThree?.phase2AState || {})
  });
  await advance(page, 1600);
  state = await readState(page);
  checks.push({
    name: "raft_reaches_first_resting_marker_after_drift",
    ok: state?.levelThree?.phase2AState?.totemRaftState === 1 &&
      state?.levelThree?.phase2AState?.totemRaftDrifting === false,
    details: JSON.stringify(state?.levelThree?.phase2AState || {})
  });

  for (let index = 2; index <= 3; index += 1) {
    await page.evaluate(() => window.set_game_test_level_three_frog_off_totem_button?.());
    state = await page.evaluate(() => window.set_game_test_level_three_frog_at_totem_button?.());
    await advance(page, 1900);
    state = await readState(page);
    checks.push({
      name: `raft_drift_gate_${index}_reaches_expected_state`,
      ok: state?.levelThree?.phase2AState?.totemRaftState === index &&
        state?.levelThree?.phase2AState?.totemRaftDrifting === false,
      details: `raftState=${state?.levelThree?.phase2AState?.totemRaftState}, docked=${Boolean(state?.levelThree?.phase2AState?.totemRaftDocked)}`
    });
  }

  checks.push({
    name: "dock_marker_remains_fixed_and_distinct_from_moving_raft",
    ok: state?.levelThree?.totemRaft?.dockMarkerFixed === true &&
      state?.levelThree?.totemRaft?.fixedDockMarkerId === "level3TotemDockMarker" &&
      state?.levelThree?.totemRaft?.movingObjectId === "level3TotemRaft",
    details: JSON.stringify({
      dockMarkerFixed: state?.levelThree?.totemRaft?.dockMarkerFixed,
      fixedDockMarkerId: state?.levelThree?.totemRaft?.fixedDockMarkerId,
      movingObjectId: state?.levelThree?.totemRaft?.movingObjectId
    })
  });
  checks.push({
    name: "raft_path_stays_in_water_until_fixed_dock",
    ok: state?.levelThree?.totemRaft?.pathContract?.avoidsLand === true &&
      state?.levelThree?.totemRaft?.pathContract?.dockMarkerInsideLand === false,
    details: JSON.stringify(state?.levelThree?.totemRaft?.pathContract || {})
  });

  const frogTouchState = await page.evaluate(() => window.set_game_test_level_three_actor_at_totem_raft?.("frog"));
  const humanCollectState = await page.evaluate(() => window.set_game_test_level_three_actor_at_totem_raft?.("human"));
  checks.push({
    name: "phase2a_totem_collection_still_human_only",
    ok: frogTouchState?.levelThree?.phase2AState?.crocodileTotemCollected === false &&
      humanCollectState?.levelThree?.phase2AState?.crocodileTotemCollected === true &&
      humanCollectState?.levelThree?.phase2AState?.crocodileEchoAwake === true,
    details: JSON.stringify({
      frogCollected: frogTouchState?.levelThree?.phase2AState?.crocodileTotemCollected,
      humanCollected: humanCollectState?.levelThree?.phase2AState?.crocodileTotemCollected,
      echoAwake: humanCollectState?.levelThree?.phase2AState?.crocodileEchoAwake
    })
  });

  return { checks, state: humanCollectState };
}

async function runLevelThreeFrogLaneRoute(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_three_opening_ready !== "function") return null;
    return window.set_game_test_level_three_opening_ready();
  });
  checks.push({
    name: "seeded_level_three_frog_lane",
    ok: readyState?.scene?.id === "level_three" && readyState?.activeActor === "frog",
    details: `scene=${readyState?.scene?.id || "missing"}, active=${readyState?.activeActor || "missing"}`
  });

  const expectedSurfaces = [
    "level3MovingLilyPad1",
    "level3MovingLilyPad2",
    "level3MovingLilyPad3",
    ""
  ];
  let state = readyState;
  for (let index = 0; index < expectedSurfaces.length; index += 1) {
    await tap(page, "Space", 70, 35);
    await advance(page, 700);
    state = await readState(page);
    const expected = expectedSurfaces[index];
    const actual = state?.levelThree?.phase2AState?.frogLaneSurfaceId || "";
    checks.push({
      name: `frog_lane_manual_jump_${index + 1}`,
      ok: actual === expected,
      details: `expectedSurface=${expected || "totem-winch-island"}, actualSurface=${actual || "totem-winch-island"}, frog=(${state?.frog?.x},${state?.frog?.z})`
    });
  }

  checks.push({
    name: "frog_lane_ends_on_totem_winch_island",
    ok: Number(state?.levelThree?.totemGreenButtonReachability?.frogDistance) <= 3.8,
    details: `frogDistanceToButton=${state?.levelThree?.totemGreenButtonReachability?.frogDistance}; Frog lands on the island edge and can walk to the button.`
  });
  checks.push({
    name: "frog_lane_route_does_not_unlock_crocodile",
    ok: state?.levelThree?.phase2AState?.crocodileUnlocked === false &&
      state?.cubelings?.crocodile?.controllable === false,
    details: JSON.stringify({
      phase2A: state?.levelThree?.phase2AState || {},
      crocodile: state?.cubelings?.crocodile || {}
    })
  });

  return { checks, state };
}

async function runLevelThreeCrocodileActor(page) {
  const checks = [];
  await setPaused(page, true);
  const readyState = await page.evaluate(() => {
    if (typeof window.set_game_test_level_three_crocodile_ready !== "function") return null;
    return window.set_game_test_level_three_crocodile_ready();
  });
  checks.push({
    name: "seeded_level_three_crocodile_ready",
    ok: readyState?.scene?.id === "level_three" &&
      readyState?.levelThree?.phase3AState?.crocodileSpawned === true &&
      readyState?.cubelings?.crocodile?.controllable === true,
    details: JSON.stringify({
      scene: readyState?.scene?.id || "",
      phase3A: readyState?.levelThree?.phase3AState || {},
      crocodile: readyState?.cubelings?.crocodile || {}
    })
  });

  await tap(page, "Shift", 80, 60);
  let state = await readState(page);
  checks.push({
    name: "human_transfers_into_crocodile",
    ok: state?.activeActor === "crocodile" &&
      state?.levelThree?.crocodileCubeling?.active === true,
    details: `active=${state?.activeActor || ""}, crocodileActive=${Boolean(state?.levelThree?.crocodileCubeling?.active)}`
  });

  const laneStart = state?.levelThreePoints ? state.levelThreePoints : null;
  const frogLaneReset = state?.levelThreeFrogLaneResetPoint || null;
  const startX = frogLaneReset?.x ?? -13;
  const startZ = frogLaneReset?.z ?? -7;
  await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "human",
    x: x - 3.8,
    z: z + 2.6
  }), { x: startX, z: startZ });
  await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "frog",
    x: x - 2.2,
    z: z - 2.2
  }), { x: startX, z: startZ });
  state = await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "crocodile",
    active: "crocodile",
    x,
    z,
    crocodileSurfaceId: "level3IslandLand",
    facing: { x: 1, z: 0 }
  }), { x: startX, z: startZ });
  const crocodileLandX = Number(state?.crocodile?.x || startX);
  await hold(page, "KeyD", 1650, 180);
  const crocodileWaterState = await readState(page);
  checks.push({
    name: "crocodile_moves_from_land_into_water",
    ok: crocodileWaterState?.activeActor === "crocodile" &&
      crocodileWaterState?.levelThree?.crocodileCubeling?.surfaceId === "level3LakeWater" &&
      Number(crocodileWaterState?.crocodile?.x || 0) > crocodileLandX + 1.2,
    details: `surface=${crocodileWaterState?.levelThree?.crocodileCubeling?.surfaceId || ""}, beforeX=${crocodileLandX}, afterX=${crocodileWaterState?.crocodile?.x}`
  });

  state = await page.evaluate(() => window.set_game_test_actor_position?.({
    actor: "crocodile",
    active: "crocodile",
    x: -15,
    z: -7,
    crocodileSurfaceId: "level3LakeWater",
    facing: { x: 0, z: 1 }
  }));
  const crocodileWaterZ = Number(state?.crocodile?.z || -7);
  await hold(page, "KeyS", 2300, 180);
  const crocodileLandState = await readState(page);
  checks.push({
    name: "crocodile_moves_from_water_back_to_land",
    ok: crocodileLandState?.activeActor === "crocodile" &&
      crocodileLandState?.levelThree?.crocodileCubeling?.surfaceId === "level3IslandLand" &&
      Number(crocodileLandState?.crocodile?.z || 0) > crocodileWaterZ + 1.2,
    details: `surface=${crocodileLandState?.levelThree?.crocodileCubeling?.surfaceId || ""}, waterZ=${crocodileWaterZ}, landZ=${crocodileLandState?.crocodile?.z}`
  });

  await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "crocodile",
    x: x - 4.2,
    z: z + 2.8,
    crocodileSurfaceId: "level3IslandLand"
  }), { x: startX, z: startZ });
  state = await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "human",
    active: "human",
    x,
    z,
    facing: { x: 1, z: 0 }
  }), { x: startX, z: startZ });
  const humanBeforeX = Number(state?.human?.x || startX);
  await hold(page, "KeyD", 900, 120);
  const humanBlockedState = await readState(page);
  checks.push({
    name: "human_still_blocked_by_level_three_water",
    ok: Number(humanBlockedState?.human?.x || 0) < humanBeforeX + 0.9 &&
      humanBlockedState?.activeActor === "human",
    details: `beforeX=${humanBeforeX}, afterX=${humanBlockedState?.human?.x}, prompt=${humanBlockedState?.speech?.text || ""}`
  });

  await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "human",
    x: x - 3.8,
    z: z + 2.6
  }), { x: startX, z: startZ });
  state = await page.evaluate(({ x, z }) => window.set_game_test_actor_position?.({
    actor: "frog",
    active: "frog",
    x,
    z,
    facing: { x: 1, z: 0 }
  }), { x: startX, z: startZ });
  const frogBeforeX = Number(state?.frog?.x || startX);
  const resetCountBefore = Number(state?.levelThree?.phase2AState?.frogLaneResetCount || 0);
  const blockCountBefore = Number(state?.levelThree?.phase2AState?.frogWaterBlockedCount || 0);
  await hold(page, "KeyD", 900, 120);
  const frogBlockedState = await readState(page);
  checks.push({
    name: "frog_walks_into_water_blocked_without_reset",
    ok: Number(frogBlockedState?.frog?.x || 0) < frogBeforeX + 0.9 &&
      Number(frogBlockedState?.levelThree?.phase2AState?.frogLaneResetCount || 0) === resetCountBefore &&
      Number(frogBlockedState?.levelThree?.phase2AState?.frogWaterBlockedCount || 0) > blockCountBefore,
    details: `beforeX=${frogBeforeX}, afterX=${frogBlockedState?.frog?.x}, resetBefore=${resetCountBefore}, resetAfter=${frogBlockedState?.levelThree?.phase2AState?.frogLaneResetCount}, blockBefore=${blockCountBefore}, blockAfter=${frogBlockedState?.levelThree?.phase2AState?.frogWaterBlockedCount}`
  });

  const loveLetterState = await page.evaluate(() => window.set_game_test_level_three_actor_at_love_letter?.("crocodile"));
  checks.push({
    name: "crocodile_cannot_collect_love_letter_placeholder",
    ok: loveLetterState?.activeActor === "crocodile" &&
      loveLetterState?.levelThree?.complete === false &&
      loveLetterState?.levelThree?.placeholderLoveLetterCollectable === false &&
      loveLetterState?.reward?.collected === false,
    details: `active=${loveLetterState?.activeActor || ""}, complete=${Boolean(loveLetterState?.levelThree?.complete)}, collected=${Boolean(loveLetterState?.reward?.collected)}`
  });

  checks.push({
    name: "bridge_green_button_remains_inactive",
    ok: loveLetterState?.levelThree?.greenButtons?.some((button) =>
      button.id === "level3BridgeGreenButton" &&
      button.behaviorImplemented === false &&
      button.linkedMechanismActive === false &&
      button.activeForCrocodileThisSlice === false
    ),
    details: JSON.stringify((loveLetterState?.levelThree?.greenButtons || []).find((button) => button.id === "level3BridgeGreenButton") || {})
  });

  const routeReadyState = await page.evaluate(() => window.set_game_test_level_three_opening_ready?.());
  let routeState = routeReadyState;
  const expectedSurfaces = ["level3MovingLilyPad1", "level3MovingLilyPad2", "level3MovingLilyPad3", ""];
  const routeResults = [];
  for (const expected of expectedSurfaces) {
    await tap(page, "Space", 70, 35);
    await advance(page, 700);
    routeState = await readState(page);
    routeResults.push({
      expected,
      actual: routeState?.levelThree?.phase2AState?.frogLaneSurfaceId || ""
    });
  }
  checks.push({
    name: "frog_lily_pad_route_still_sequences_manually",
    ok: routeResults.every((result) => result.actual === result.expected),
    details: JSON.stringify(routeResults)
  });

  return { checks, state: routeState };
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

  await hold(page, "KeyA", 3200, 130);
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
    name: "red_elevator_a_starts_up_from_bottom",
    ok: readyState?.activeActor === "human" &&
      Boolean(readyState?.levelTwo?.redElevatorAStartGate?.released) &&
      Number(readyElevatorA?.progress ?? 1) <= 0.03 &&
      readyElevatorA?.moving === "up",
    details: `active=${readyState?.activeActor || ""}, gateReason=${readyState?.levelTwo?.redElevatorAStartGate?.waitingReason || ""}, progress=${readyElevatorA?.progress}, moving=${readyElevatorA?.moving || ""}`
  });

  await advance(page, 600);
  const movingState = await readState(page);
  const movingElevatorA = movingState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
  checks.push({
    name: "red_elevator_a_continues_up_without_bottom_delay",
    ok: Boolean(movingState?.levelTwo?.redElevatorAStartGate?.released) &&
      Number(movingElevatorA?.progress || 0) > Number(readyElevatorA?.progress || 0),
    details: `released=${Boolean(movingState?.levelTwo?.redElevatorAStartGate?.released)}, progress=${movingElevatorA?.progress}, moving=${movingElevatorA?.moving || ""}`
  });
  checks.push({
    name: "red_elevator_a_rises_without_human_approach",
    ok: ["up", "pause-top"].includes(movingElevatorA?.moving || "") ||
      Number(movingElevatorA?.progress || 0) > Number(readyElevatorA?.progress || 0),
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

async function runLevelTwoRedAReleaseEndpointLatch(page) {
  const checks = [];
  await setPaused(page, true);

  const runScenario = async (scenario, expectedProgress, settleMs, holdMs) => {
    const readyState = await page.evaluate((nextScenario) => {
      if (typeof window.set_game_test_level_two_red_a_release_ready !== "function") return null;
      return window.set_game_test_level_two_red_a_release_ready(nextScenario);
    }, scenario);
    const readyElevatorA = readyState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
    const buttonA = readyState?.levelTwo?.redButtons?.find((button) => button.id === "red-button-a");
    checks.push({
      name: `seeded_release_${scenario}`,
      ok: Boolean(readyState) && !buttonA?.active,
      details: `scene=${readyState?.scene?.id || "missing"}, progress=${readyElevatorA?.progress}, moving=${readyElevatorA?.moving || ""}, button=${Boolean(buttonA?.active)}`
    });

    await advance(page, settleMs);
    const endpointState = await readState(page);
    const endpointElevatorA = endpointState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
    checks.push({
      name: `release_${scenario}_finishes_expected_endpoint`,
      ok: Math.abs(Number(endpointElevatorA?.progress || 0) - expectedProgress) <= 0.02,
      details: `progress=${endpointElevatorA?.progress}, moving=${endpointElevatorA?.moving || ""}, releaseTarget=${endpointElevatorA?.releaseTarget}`
    });

    await advance(page, holdMs);
    const latchedState = await readState(page);
    const latchedElevatorA = latchedState?.levelTwo?.redPlatforms?.find((platform) => platform.id === "red-elevator-a");
    checks.push({
      name: `release_${scenario}_stays_latched`,
      ok: Math.abs(Number(latchedElevatorA?.progress || 0) - expectedProgress) <= 0.02 &&
        latchedElevatorA?.moving === "idle",
      details: `progress=${latchedElevatorA?.progress}, moving=${latchedElevatorA?.moving || ""}, releaseTarget=${latchedElevatorA?.releaseTarget}`
    });
    return latchedState;
  };

  await runScenario("top", 1, 900, 1400);
  await runScenario("descending", 0, 3600, 1400);
  const finalState = await runScenario("ascending", 1, 4300, 1400);
  return { checks, state: finalState };
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
  await advance(page, 6200);
  const pressedState = await readState(page);
  checks.push({
    name: "unpossessed_frog_presses_level_one_button",
    ok: Boolean(pressedState?.button?.pressed),
    details: `button=${Boolean(pressedState?.button?.pressed)}`
  });
  checks.push({
    name: "level_one_blue_blooms_release",
    ok: Boolean(pressedState?.levelOne?.blueBloomReleased),
    details: `blueBloomReleased=${Boolean(pressedState?.levelOne?.blueBloomReleased)}`
  });
  checks.push({
    name: "level_one_blue_blooms_dock",
    ok: Boolean(pressedState?.levelOne?.blueBloomDocked),
    details: `blueBloomDocked=${Boolean(pressedState?.levelOne?.blueBloomDocked)}, bridgeCompleteCompat=${Boolean(pressedState?.levelOne?.bridgeComplete)}`
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
  level_two_red_a_release_endpoint_latch: runLevelTwoRedAReleaseEndpointLatch,
  level_two_red_a_elephant_exit_route: runLevelTwoRedAElephantExitRoute,
  level_two_red_a_human_exit_route: runLevelTwoRedAHumanExitRoute,
  level_two_love_letter_camera_visibility: runLevelTwoLoveLetterCameraVisibility,
  level_two_red_a_ground_clearance: runLevelTwoRedAGroundClearance,
  level_two_red_b_route: runLevelTwoRedBRoute,
  level_two_unpossessed_frog_blue_button_activation: runLevelTwoUnpossessedFrogBlueButtonActivation,
  level_three_start: runLevelThreeStart,
  level_three_crocodile_totem_opening: runLevelThreeCrocodileTotemOpening,
  level_three_frog_lane_route: runLevelThreeFrogLaneRoute,
  level_three_crocodile_actor: runLevelThreeCrocodileActor,
  level_three_spatial_contract: runLevelThreeSpatialContract
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
