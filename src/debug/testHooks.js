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
  startLevelTwo,
  updateLevelTwoSurfaceState,
  syncAll,
  updateCamera,
  updateHud,
  clearSpeechQueue,
  directionName,
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

  windowRef.set_game_test_level_two_ramp_ready = () => {
    startLevelTwo({ showTitle: false });
    state.scene.phase = "play";
    state.scene.titleCardVisible = false;
    state.scene.titleCardText = "";
    state.levelTwo.phase = "play";
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.elephantTotemVisible = true;
    state.levelTwo.elephantTotemCollected = false;
    state.levelTwo.elephantUnlockPending = false;
    state.cubelings.elephant = { unlocked: false, unlockedPending: false, active: false };
    state.active = "human";
    state.human.x = levelTwoRamp.lowEnd.x - 0.55;
    state.human.z = levelTwoRamp.lowEnd.z;
    state.human.facing = { x: 1, z: 0, name: "east" };
    state.frog.x = levelTwoPoints.blueButton.x;
    state.frog.z = levelTwoPoints.blueButton.z;
    state.frog.facing = { x: 1, z: 0, name: "east" };
    state.levelTwo.frogSurfaceId = "blue-button-ledge";
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

  windowRef.set_game_test_actor_position = (payload = {}) => {
    const actor = payload.actor === "frog" ? state.frog : state.human;
    if (Number.isFinite(payload.x)) actor.x = Number(payload.x);
    if (Number.isFinite(payload.z)) actor.z = Number(payload.z);
    if (payload.facing && typeof payload.facing === "object") actor.facing = directionName(payload.facing);
    if (payload.active === "frog" || payload.active === "human") state.active = payload.active;
    if (state.scene.id === sceneIds.LEVEL_TWO && payload.actor === "frog") {
      state.levelTwo.frogSurfaceId = payload.frogSurfaceId || null;
    }
    if (state.scene.id === sceneIds.LEVEL_TWO && payload.actor === "human") {
      state.levelTwo.humanSurfaceId = payload.humanSurfaceId || null;
    }
    input.keys.clear();
    updateLevelTwoSurfaceState();
    syncAll();
    updateCamera(1);
    updateHud();
    return JSON.parse(renderGameToText());
  };
}
