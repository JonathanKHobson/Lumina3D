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
  tutorialButton,
  tutorialStart,
  levelOneButton,
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
    state.levelTwo.elephantSurfaceId = "red-elevator-a";
    state.levelTwo.elephantRevealActive = false;
    state.levelTwo.elephantRevealElapsed = 0;
    state.levelTwo.elephantSpawnCount = Math.max(1, state.levelTwo.elephantSpawnCount || 0);
    resetLevelTwoRedMechanismState?.();
    state.levelTwo.lastElephantSpawnEffectY = Number.isFinite(levelTwoRedButtonSurfaceY?.({ platformId: "red-elevator-a" }))
      ? levelTwoRedButtonSurfaceY({ platformId: "red-elevator-a" })
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
    const redAState = state.levelTwo.redPlatforms?.["red-elevator-a"];
    if (redAState) {
      redAState.progress = 1;
      redAState.lift = redAState.lift || 0;
      redAState.direction = "down";
      redAState.pauseRemaining = 0;
      redAState.releaseTarget = null;
      redAState.moving = "idle";
      redAState.wasActive = false;
      redAState.hasActivated = false;
    }
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
    const redAState = state.levelTwo.redPlatforms?.["red-elevator-a"];
    if (redAState) {
      redAState.progress = 0;
      redAState.lift = 0;
      redAState.direction = "down";
      redAState.pauseRemaining = 2.5;
      redAState.moving = "pause-bottom";
      redAState.wasActive = true;
      redAState.hasActivated = true;
      redAState.heldBy = "elephant";
    }
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
    const redAState = state.levelTwo.redPlatforms?.["red-elevator-a"];
    if (redAState) {
      redAState.progress = 0;
      redAState.lift = 0;
      redAState.direction = "up";
      redAState.pauseRemaining = 0;
      redAState.releaseTarget = null;
      redAState.moving = "idle";
      redAState.wasActive = true;
      redAState.hasActivated = true;
      redAState.heldBy = "";
    }
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
    state.levelOne.waterBlocked = true;
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
