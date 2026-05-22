export function installTestHooks({
  windowRef = window,
  runtime,
  renderer,
  scene,
  camera,
  state,
  input,
  sceneIds,
  levelTwoRamp,
  levelTwoPoints,
  update,
  renderFrame,
  startLevelOne,
  startLevelTwo,
  startLevelThree,
  tutorialButton,
  tutorialStart,
  spellbook,
  levelOneButton,
  levelOneLoveLetterPoint,
  levelThreePoints,
  levelThreeGreenButtons = [],
  levelThreeRaftMarkers = [],
  levelThreeFrogLaneResetPoint,
  levelTwoRedPlatforms = [],
  levelTwoRedButtonSurfaceY,
  updateLevelTwoSurfaceState,
  resetLevelTwoRedMechanismState,
  syncAll,
  updateCamera,
  updateHud,
  clearSpeechQueue,
  directionName,
  setTutorialStep,
  renderGameToText
}) {
  windowRef.render_game_to_text = renderGameToText;

  const setLevelTwoRedPlatformState = (id, next = {}) => {
    const platformState = state.levelTwo.redPlatforms?.[id];
    if (!platformState) return null;
    const platform = levelTwoRedPlatforms.find((candidate) => candidate.id === id);
    if (Number.isFinite(next.progress)) platformState.progress = Number(next.progress);
    if (platform) platformState.lift = platformState.progress * platform.maxLift;
    if (Number.isFinite(next.lift)) platformState.lift = Number(next.lift);
    if (next.direction) platformState.direction = next.direction;
    if (Number.isFinite(next.pauseRemaining)) platformState.pauseRemaining = Number(next.pauseRemaining);
    if ("releaseTarget" in next) platformState.releaseTarget = next.releaseTarget;
    if (next.moving) platformState.moving = next.moving;
    if (typeof next.wasActive === "boolean") platformState.wasActive = next.wasActive;
    if (typeof next.hasActivated === "boolean") platformState.hasActivated = next.hasActivated;
    if ("heldBy" in next) platformState.heldBy = next.heldBy;
    return platformState;
  };

  windowRef.advanceTime = (ms = 16) => {
    const steps = Math.max(1, Math.round(Number(ms) / (1000 / 60)));
    runtime.manualAdvanceDepth += 1;
    for (let i = 0; i < steps; i++) update(1 / 60);
    runtime.manualAdvanceDepth -= 1;
    renderer.render(scene, camera);
    return true;
  };

  windowRef.set_game_test_pause = (paused = true) => {
    runtime.testPaused = Boolean(paused);
    renderer.setAnimationLoop(runtime.testPaused ? null : renderFrame);
    return runtime.testPaused;
  };

  windowRef.set_game_test_tutorial_selectability_ready = () => {
    state.scene.id = sceneIds.TUTORIAL;
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.scene.fadeVisible = false;
    state.tutorialSkipped = true;
    state.tutorialComplete = false;
    state.reveals = {
      ...state.reveals,
      rightFloor: true,
      frogEcho: true,
      frogTotem: true,
      frog: true,
      barrier: true,
      button: true,
      spellbook: true
    };
    state.cubelings.frog.unlocked = true;
    state.cubelings.frog.unlockedThisTutorial = true;
    state.active = "human";
    state.human.x = tutorialStart.human.x;
    state.human.z = tutorialStart.human.z;
    state.human.facing = { ...tutorialStart.human.facing };
    state.frog.x = tutorialButton.x - 4;
    state.frog.z = tutorialButton.z + 3;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.spellbookCollected = false;
    state.celebration.active = false;
    state.celebration.modalVisible = false;
    input.keys.clear();
    clearSpeechQueue();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_ramp_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantEchoPromptIndex = 0;
    state.levelTwo.lastElephantEchoPromptAt = -Infinity;
    state.levelTwo.elephantEchoSparkleTimer = 0.7;
    state.levelTwo.elephantTotemVisible = true;
    state.levelTwo.elephantTotemCollected = false;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = false;
    state.levelTwo.elephantSpawned = false;
    state.levelTwo.elephantSurfaceId = null;
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = 0;
    state.cubelings.elephant = { unlocked: false, unlockedPending: false, active: false, spawned: false };
    state.active = "human";
    state.human.x = levelTwoRamp.lowEnd.x - 0.55;
    state.human.z = levelTwoRamp.lowEnd.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_blue_ramp_dormant_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = false;
    state.levelTwo.blueRampActive = false;
    state.levelTwo.blueRampRevealActive = false;
    state.levelTwo.blueRampRevealElapsed = 0;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = true;
    state.levelTwo.elephantTotemCollected = false;
    state.levelTwo.elephantAwake = false;
    state.levelTwo.elephantSpawned = false;
    state.levelTwo.elephantSurfaceId = null;
    state.cubelings.elephant = { unlocked: false, unlockedPending: false, active: false, spawned: false };
    state.active = "human";
    state.human.x = levelTwoRamp.lowEnd.x - 0.55;
    state.human.z = levelTwoRamp.lowEnd.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_prototype_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantEchoPromptIndex = 0;
    state.levelTwo.lastElephantEchoPromptAt = -Infinity;
    state.levelTwo.elephantEchoSparkleTimer = 0.7;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = null;
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    state.levelTwo.lastElephantSpawnEffectY = Number.isFinite(levelTwoPoints.elephantEcho.y)
      ? levelTwoPoints.elephantEcho.y
      : state.levelTwo.lastElephantSpawnEffectY;
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: false, spawned: true };
    state.active = "human";
    state.elephant.x = levelTwoPoints.elephantEcho.x;
    state.elephant.z = levelTwoPoints.elephantEcho.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.human.x = levelTwoPoints.redElevatorA.x + 2.55;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_exit_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    setLevelTwoRedPlatformState("red-elevator-a", {
      progress: 1,
      direction: "down",
      pauseRemaining: 0,
      releaseTarget: 1,
      moving: "idle",
      wasActive: false,
      hasActivated: false,
      heldBy: ""
    });
    if (state.levelTwo.redElevatorAStartGate) {
      state.levelTwo.redElevatorAStartGate.released = true;
      state.levelTwo.redElevatorAStartGate.delayRemaining = 0;
      state.levelTwo.redElevatorAStartGate.waitingReason = "released";
    }
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: true, spawned: true };
    state.active = "elephant";
    state.elephant.x = levelTwoPoints.redElevatorA.x;
    state.elephant.z = levelTwoPoints.redElevatorA.z;
    state.elephant.facing = { x: -1, z: 0, name: "west" };
    state.human.x = levelTwoPoints.redElevatorA.x + 3.25;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: -1, z: 0, name: "west" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_human_exit_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "tier-3-elephant-route";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    setLevelTwoRedPlatformState("red-elevator-a", {
      progress: 1,
      direction: "down",
      pauseRemaining: 0,
      releaseTarget: 1,
      moving: "idle",
      wasActive: false,
      hasActivated: false,
      heldBy: ""
    });
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: false, spawned: true };
    state.active = "human";
    state.human.x = levelTwoPoints.redElevatorA.x;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: -1, z: 0, name: "west" };
    state.elephant.x = levelTwoPoints.redButtonB.x;
    state.elephant.z = levelTwoPoints.redButtonB.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = "red-elevator-a";
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_button_gate_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: false, spawned: true };
    state.active = "human";
    state.elephant.x = levelTwoPoints.redButtonA.x;
    state.elephant.z = levelTwoPoints.redButtonA.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.human.x = levelTwoPoints.humanStart.x;
    state.human.z = levelTwoPoints.humanStart.z;
    state.human.facing = { ...levelTwoPoints.humanStart.facing };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_elephant_bottom_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    setLevelTwoRedPlatformState("red-elevator-a", {
      progress: 0,
      direction: "down",
      pauseRemaining: 2.5,
      moving: "pause-bottom",
      wasActive: true,
      hasActivated: true,
      heldBy: "elephant"
    });
    if (state.levelTwo.redElevatorAStartGate) {
      state.levelTwo.redElevatorAStartGate.released = true;
      state.levelTwo.redElevatorAStartGate.delayRemaining = 0;
      state.levelTwo.redElevatorAStartGate.waitingReason = "released";
    }
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: true, spawned: true };
    state.active = "elephant";
    state.elephant.x = levelTwoPoints.redButtonA.x;
    state.elephant.z = levelTwoPoints.redButtonA.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.human.x = levelTwoPoints.redElevatorA.x + 2.55;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_release_ready = (scenario = "bottom") => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    const releaseScenarios = {
      bottom: { progress: 0, direction: "up", moving: "idle" },
      top: { progress: 1, direction: "down", moving: "idle" },
      descending: { progress: 0.56, direction: "down", moving: "down" },
      ascending: { progress: 0.44, direction: "up", moving: "up" }
    };
    const preset = releaseScenarios[scenario] || releaseScenarios.bottom;
    setLevelTwoRedPlatformState("red-elevator-a", {
      progress: preset.progress,
      direction: preset.direction,
      pauseRemaining: 0,
      releaseTarget: null,
      moving: preset.moving,
      wasActive: true,
      hasActivated: true,
      heldBy: ""
    });
    if (state.levelTwo.redElevatorAStartGate) {
      state.levelTwo.redElevatorAStartGate.released = true;
      state.levelTwo.redElevatorAStartGate.delayRemaining = 0;
      state.levelTwo.redElevatorAStartGate.waitingReason = "released";
    }
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: true, spawned: true };
    state.active = "elephant";
    state.elephant.x = levelTwoPoints.redElevatorA.x - 1.15;
    state.elephant.z = levelTwoPoints.redElevatorA.z + 1.35;
    state.elephant.facing = { x: 1, z: 0, name: "east" };
    state.human.x = levelTwoPoints.redElevatorA.x + 2.55;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_released_bottom_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    setLevelTwoRedPlatformState("red-elevator-a", {
      progress: 0,
      direction: "up",
      pauseRemaining: 0,
      releaseTarget: null,
      moving: "idle",
      wasActive: true,
      hasActivated: true,
      heldBy: ""
    });
    if (state.levelTwo.redElevatorAStartGate) {
      state.levelTwo.redElevatorAStartGate.released = true;
      state.levelTwo.redElevatorAStartGate.delayRemaining = 0;
      state.levelTwo.redElevatorAStartGate.waitingReason = "released";
    }
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: true, spawned: true };
    state.active = "elephant";
    state.elephant.x = levelTwoPoints.redElevatorA.x - 1.15;
    state.elephant.z = levelTwoPoints.redElevatorA.z + 1.35;
    state.elephant.facing = { x: 1, z: 0, name: "east" };
    state.human.x = levelTwoPoints.redElevatorA.x + 2.55;
    state.human.z = levelTwoPoints.redElevatorA.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_b_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantEchoPromptIndex = 0;
    state.levelTwo.lastElephantEchoPromptAt = -Infinity;
    state.levelTwo.elephantEchoSparkleTimer = 0.7;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantUnlockPending = false;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    state.levelTwo.elephantSurfaceId = "tier-3-elephant-route";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: false, spawned: true };
    state.active = "human";
    state.elephant.x = levelTwoPoints.redButtonB.x;
    state.elephant.z = levelTwoPoints.redButtonB.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.human.x = levelTwoPoints.redElevatorB.x;
    state.human.z = levelTwoPoints.redElevatorB.z;
    state.human.facing = { x: 0, z: -1, name: "north" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = "red-elevator-b";
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_love_letter_camera_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = false;
    state.levelTwo.elephantTotemCollected = true;
    state.levelTwo.elephantAwake = true;
    state.levelTwo.elephantSpawned = true;
    resetLevelTwoRedMechanismState?.();
    state.cubelings.elephant = { unlocked: true, unlockedPending: false, active: false, spawned: true };
    state.active = "human";
    state.human.x = levelTwoPoints.placeholderLoveLetter.x;
    state.human.z = levelTwoPoints.placeholderLoveLetter.z;
    state.human.facing = { x: 0, z: -1, name: "north" };
    state.frog.x = levelTwoPoints.frogStart.x;
    state.frog.z = levelTwoPoints.frogStart.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.elephant.x = levelTwoPoints.redButtonB.x;
    state.elephant.z = levelTwoPoints.redButtonB.z;
    state.elephant.facing = { x: 0, z: 1, name: "south" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = "level-two-love-letter-route";
    state.levelTwo.elephantSurfaceId = "tier-3-elephant-route";
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_ground_clearance_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantEchoVisible = true;
    state.levelTwo.elephantTotemVisible = true;
    state.levelTwo.elephantTotemCollected = false;
    state.levelTwo.elephantAwake = false;
    state.levelTwo.elephantSpawned = false;
    state.levelTwo.elephantSurfaceId = null;
    resetLevelTwoRedMechanismState?.();
    state.active = "human";
    state.human.x = 9;
    state.human.z = 1;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = 7;
    state.frog.z = 5;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_red_a_ground_clearance_probe = (actorKey = "human") => {
    let actor;
    if (actorKey === "frog") {
      state.active = "frog";
      state.human.x = 6;
      state.human.z = 5;
      state.human.facing = { x: 1, z: 0, name: "east" };
      state.frog.x = 9;
      state.frog.z = 1;
      state.frog.facing = { x: 1, z: 0, name: "east" };
      actor = state.frog;
    } else {
      state.active = "human";
      state.human.x = 9;
      state.human.z = 1;
      state.human.facing = { x: 1, z: 0, name: "east" };
      state.frog.x = 7;
      state.frog.z = 5;
      state.frog.facing = { x: 1, z: 0, name: "east" };
      actor = state.human;
    }
    state.levelTwo.frogSurfaceId = null;
    state.levelTwo.humanSurfaceId = null;
    updateLevelTwoSurfaceState();
    const before = { x: actor.x, z: actor.z };
    input.keys.clear();
    input.keys.add("KeyD");
    for (let i = 0; i < 90; i += 1) update(1 / 60);
    input.keys.clear();
    const after = { x: actor.x, z: actor.z };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    const payload = JSON.parse(renderGameToText());
    payload.probe = {
      actor: actorKey,
      before,
      after,
      moved: Math.hypot(after.x - before.x, after.z - before.z),
      inputMoving: state.inputMoving,
      levelTwoPhase: state.levelTwo.phase,
      ready: state.ready
    };
    return payload;
  };

  windowRef.set_game_test_tutorial_frog_stranded = () => {
    state.scene.id = sceneIds.TUTORIAL;
    state.scene.phase = "guided";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.active = "human";
    state.human.x = tutorialStart.human.x;
    state.human.z = tutorialStart.human.z;
    state.human.facing = { ...tutorialStart.human.facing };
    state.frog.x = tutorialButton.x - 1.45;
    state.frog.z = tutorialButton.z + 0.72;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.reveals = {
      rightFloor: true,
      frogEcho: false,
      frogTotem: false,
      frog: true,
      barrier: true,
      button: true,
      spellbook: true
    };
    state.cubelings.frog = { unlocked: true, unlockedThisTutorial: true };
    state.unlocks.frogCubeling = true;
    state.frogTotem.collected = true;
    state.buttonPressed = false;
    state.doorwayOpen = false;
    state.spellbookCollected = false;
    state.tutorialComplete = false;
    state.tutorialSkipped = false;
    state.frogJump = null;
    state.frogAi.timer = 0;
    state.frogAi.hop = 0;
    state.frogAi.target = { x: state.frog.x, z: state.frog.z };
    state.frogAi.mode = "patrol";
    state.frogAi.currentSide = "right";
    state.frogAi.targetSource = "patrol";
    state.frogAi.usesHumanAsTarget = false;
    state.frogAi.celebrationPerch = null;
    state.tutorialRecovery = {
      stranded: true,
      startedAt: state.elapsed,
      lastPromptAt: -Infinity,
      resetPromptShown: false,
      characterLineShown: false
    };
    setTutorialStep?.("press_button");
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_one_unpossessed_frog_button_ready = () => {
    startLevelOne?.({ showTitle: false });
    state.scene.phase = "play";
    state.levelOne.phase = "play";
    state.active = "human";
    state.reveals.frog = true;
    state.reveals.button = true;
    state.buttonPressed = false;
    state.levelOne.bridgeComplete = false;
    state.levelOne.bridgeAsset = "blue-bloom-crossing-held";
    state.levelOne.waterBlocked = true;
    state.levelOne.blueBloomReleased = false;
    state.levelOne.blueBloomRevealActive = false;
    state.levelOne.blueBloomRevealElapsed = 0;
    state.levelOne.blueBloomDocked = false;
    state.levelOne.loveLetterSurfaced = false;
    state.reveals.spellbook = false;
    state.frog.x = levelOneButton.x;
    state.frog.z = levelOneButton.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.frogAi.timer = 999;
    state.frogAi.target = { x: state.frog.x, z: state.frog.z };
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_one_love_letter_ready = () => {
    startLevelOne?.({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelOne.phase = "play";
    state.active = "human";
    state.reveals.frog = true;
    state.reveals.button = true;
    state.reveals.spellbook = true;
    state.buttonPressed = true;
    state.spellbookCollected = false;
    state.levelOne.bridgeComplete = true;
    state.levelOne.waterBlocked = false;
    state.levelOne.bridgeAsset = "blue-bloom-crossing-docked";
    state.levelOne.bridgeRevealActive = false;
    state.levelOne.bridgeRevealElapsed = 0;
    state.levelOne.blueBloomReleased = true;
    state.levelOne.blueBloomRevealActive = false;
    state.levelOne.blueBloomRevealElapsed = 4.8;
    state.levelOne.blueBloomDocked = true;
    state.levelOne.loveLetterSurfaced = true;
    if (state.levelOne.blueBloomMats?.left) state.levelOne.blueBloomMats.left.walkable = true;
    if (state.levelOne.blueBloomMats?.right) state.levelOne.blueBloomMats.right.walkable = true;
    state.human.x = (levelOneLoveLetterPoint?.x || spellbook?.x || 0) - 1.1;
    state.human.z = levelOneLoveLetterPoint?.z || spellbook?.z || 0;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelOneButton.x;
    state.frog.z = levelOneButton.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.frogAi.timer = 999;
    state.frogAi.target = { x: state.frog.x, z: state.frog.z };
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    syncAll();
    updateCamera(1);
    updateHud();
    update(1 / 60);
    syncAll();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_two_unpossessed_frog_blue_button_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.levelTwo.phase = "play";
    state.active = "human";
    state.levelTwo.blueButtonPressed = false;
    state.levelTwo.blueRampActive = false;
    state.frog.x = levelTwoPoints.blueButton.x;
    state.frog.z = levelTwoPoints.blueButton.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = "blue-button-ledge";
    state.frogAi.timer = 999;
    state.frogAi.target = { x: state.frog.x, z: state.frog.z };
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_three_opening_ready = () => {
    startLevelThree?.({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelThree.phase = "play";
    state.active = "frog";
    state.reveals.frog = true;
    state.cubelings.frog = { unlocked: true, unlockedThisTutorial: false };
    state.cubelings.crocodile = { unlocked: false, unlockedPending: false, active: false, spawned: false, controllable: false };
    state.levelThree.frogLaneSurfaceId = null;
    state.levelThree.frogLaneResetCount = 0;
    state.levelThree.lastFrogLaneResetAt = -Infinity;
    state.levelThree.totemGreenButtonPresses = 0;
    state.levelThree.openingGreenPressCount = 0;
    state.levelThree.totemGreenButtonPressed = false;
    state.levelThree.totemGreenButtonHeld = false;
    state.levelThree.totemGreenButtonWasHeld = false;
    state.levelThree.totemGreenButtonHeldActor = "";
    state.levelThree.totemRaftState = 0;
    state.levelThree.totemRaftDocked = false;
    state.levelThree.crocodileTotemCollected = false;
    state.levelThree.crocodileUnlocked = false;
    state.levelThree.crocodileEchoAwake = false;
    state.levelThree.crocodileControlAvailable = false;
    state.human.x = levelThreePoints?.humanStart?.x ?? state.human.x;
    state.human.z = levelThreePoints?.humanStart?.z ?? state.human.z;
    state.human.facing = { ...(levelThreePoints?.humanStart?.facing || { x: 1, z: 0, name: "east" }) };
    state.frog.x = levelThreeFrogLaneResetPoint?.x ?? levelThreePoints?.frogStart?.x ?? state.frog.x;
    state.frog.z = levelThreeFrogLaneResetPoint?.z ?? levelThreePoints?.frogStart?.z ?? state.frog.z;
    state.frog.facing = { ...(levelThreeFrogLaneResetPoint?.facing || { x: 1, z: 0, name: "east" }) };
    state.frogAi.timer = 999;
    state.frogAi.target = { x: state.frog.x, z: state.frog.z };
    input.keys.clear();
    clearSpeechQueue();
    state.speech = { text: "", anchor: "", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_three_frog_at_totem_button = () => {
    const button = levelThreeGreenButtons.find((item) => item.id === "level3TotemGreenButton") || levelThreeGreenButtons[0];
    if (!button) return null;
    state.active = "frog";
    state.frog.x = button.position.x;
    state.frog.z = button.position.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelThree.frogLaneSurfaceId = null;
    state.levelThree.totemGreenButtonWasHeld = false;
    input.keys.clear();
    clearSpeechQueue();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_three_frog_off_totem_button = () => {
    const button = levelThreeGreenButtons.find((item) => item.id === "level3TotemGreenButton") || levelThreeGreenButtons[0];
    if (!button) return null;
    state.active = "frog";
    state.frog.x = button.position.x + 1.65;
    state.frog.z = button.position.z;
    state.frog.facing = { x: -1, z: 0, name: "west" };
    input.keys.clear();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_level_three_actor_at_totem_raft = (actorKey = "human") => {
    const marker = levelThreeRaftMarkers[Math.min(Math.max(state.levelThree.totemRaftState || 0, 0), Math.max(0, levelThreeRaftMarkers.length - 1))] || levelThreeRaftMarkers[levelThreeRaftMarkers.length - 1];
    if (!marker) return null;
    const actor = actorKey === "frog" ? state.frog : state.human;
    state.active = actorKey === "frog" ? "frog" : "human";
    actor.x = marker.position.x;
    actor.z = marker.position.z;
    actor.facing = { x: 1, z: 0, name: "east" };
    input.keys.clear();
    clearSpeechQueue();
    update(1 / 60);
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };

  windowRef.set_game_test_actor_position = (payload = {}) => {
    const actor = payload.actor === "frog" ? state.frog : payload.actor === "elephant" ? state.elephant : state.human;
    if (Number.isFinite(payload.x)) actor.x = Number(payload.x);
    if (Number.isFinite(payload.z)) actor.z = Number(payload.z);
    if (payload.facing && typeof payload.facing === "object") actor.facing = directionName(payload.facing);
    if (payload.active === "frog" || payload.active === "human" || payload.active === "elephant") state.active = payload.active;
    if (state.scene.id === sceneIds.LEVEL_TWO && payload.actor === "frog") {
      state.levelTwo.frogSurfaceId = payload.frogSurfaceId || null;
    }
    if (state.scene.id === sceneIds.LEVEL_TWO && payload.actor === "human") {
      state.levelTwo.humanSurfaceId = payload.humanSurfaceId || null;
    }
    if (state.scene.id === sceneIds.LEVEL_TWO && payload.actor === "elephant") {
      state.levelTwo.elephantSurfaceId = payload.elephantSurfaceId || state.levelTwo.elephantSurfaceId || null;
    }
    input.keys.clear();
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };
}
