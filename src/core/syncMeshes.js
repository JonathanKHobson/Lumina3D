export function syncActorMeshPositions({
  actorMeshes,
  state,
  camera,
  surfaceY,
  frogJumpLift,
  frogSmallHopHeight,
  frogRevealSeconds,
  levelOneBridgeLiftAt,
  levelTwoActorLiftAt,
  directionToRotation,
  getCameraFacingDirection,
  playHumanAnimation,
  clamp
}) {
  if (!actorMeshes.human || !actorMeshes.frog) return;

  const humanSurfaceLift = levelOneBridgeLiftAt(state.human) + levelTwoActorLiftAt(state.human);
  actorMeshes.human.position.set(state.human.x, surfaceY + humanSurfaceLift, state.human.z);
  actorMeshes.human.rotation.y = state.celebration.active || state.celebration.modalVisible
    ? directionToRotation(getCameraFacingDirection(camera, state.human))
    : directionToRotation(state.human.facing);
  const humanWalking = state.active === "human" && state.inputMoving;
  if (!state.celebration.active && !state.celebration.modalVisible) {
    playHumanAnimation(humanWalking ? "Walk" : "Idle");
  }

  const frogSurfaceLift = levelOneBridgeLiftAt(state.frog) + levelTwoActorLiftAt(state.frog);
  actorMeshes.frog.position.set(state.frog.x, surfaceY + frogSurfaceLift, state.frog.z);
  actorMeshes.frog.rotation.y = directionToRotation(state.frog.facing);
  const jumpLift = state.frogJump ? Math.sin(clamp(state.frogJump.elapsed / state.frogJump.duration, 0, 1) * Math.PI) * frogJumpLift : 0;
  const aiHop = state.frogAi.hop > 0 ? Math.sin((1 - state.frogAi.hop / 0.32) * Math.PI) * 0.22 : 0;
  const playerHop = state.active === "frog" && state.inputMoving && !state.frogJump
    ? Math.abs(Math.sin(state.frogMoveHop)) * frogSmallHopHeight
    : 0;
  const revealDrop = state.frogReveal.active
    ? (1 - clamp(state.frogReveal.elapsed / frogRevealSeconds, 0, 1)) * 2.4
    : 0;
  actorMeshes.frog.position.y = surfaceY + frogSurfaceLift + jumpLift + aiHop + playerHop + revealDrop;

  if (actorMeshes.elephant) {
    const elephantSurfaceLift = levelTwoActorLiftAt(state.elephant);
    const revealDrop = state.levelTwo.elephantRevealActive
      ? (1 - clamp(state.levelTwo.elephantRevealElapsed / Math.max(0.001, state.levelTwo.elephantRevealSeconds || 0.7), 0, 1)) * 1.8
      : 0;
    const idleBob = state.levelTwo.elephantSpawned ? Math.sin(state.elapsed * 2.2) * (state.levelTwo.elephantIdleBob || 0.025) : 0;
    actorMeshes.elephant.position.set(
      state.elephant.x,
      surfaceY + elephantSurfaceLift + revealDrop + idleBob,
      state.elephant.z
    );
    actorMeshes.elephant.rotation.y = directionToRotation(state.elephant.facing);
  }

  if (actorMeshes.crocodile && state.crocodile) {
    const waterBob = state.active === "crocodile" && state.scene?.id === "level_three"
      ? Math.sin(state.elapsed * 2.6) * 0.018
      : 0;
    actorMeshes.crocodile.position.set(state.crocodile.x, surfaceY + waterBob, state.crocodile.z);
    actorMeshes.crocodile.rotation.y = directionToRotation(state.crocodile.facing);
  }
}

export function syncMarkerMeshes({
  markerMeshes,
  levelTwoInteractiveMeshes,
  state,
  surfaceY,
  buttonTopRestY,
  buttonTopPressedY,
  getActiveActor,
  sceneAllowsInput,
  levelOneBridgeLiftAt,
  levelTwoActorLiftAt,
  buttonPoint,
  syncButtonTopVisual,
  clamp
}) {
  const activeActor = getActiveActor();
  markerMeshes.active.visible = sceneAllowsInput() && !state.celebration.active && !state.celebration.modalVisible;
  const activeLift = levelOneBridgeLiftAt(activeActor) + levelTwoActorLiftAt(activeActor);
  markerMeshes.active.position.set(activeActor.x, surfaceY + 0.05 + activeLift, activeActor.z);
  if (markerMeshes.button) {
    const button = buttonPoint();
    markerMeshes.button.position.set(button.x, surfaceY, button.z);
  }
  syncButtonTopVisual(markerMeshes.buttonTop, state.buttonPressed, buttonTopRestY, buttonTopPressedY);
  syncButtonTopVisual(levelTwoInteractiveMeshes.blueButtonTop, state.levelTwo.blueButtonPressed, buttonTopRestY, buttonTopPressedY);
  Object.entries(levelTwoInteractiveMeshes.redButtonTops || {}).forEach(([id, buttonTop]) => {
    syncButtonTopVisual(buttonTop, Boolean(state.levelTwo.redButtons?.[id]?.active), buttonTopRestY, buttonTopPressedY);
  });
  const isJumping = Boolean(state.frogJump);
  markerMeshes.jumpShadow.visible = isJumping;
  markerMeshes.jumpShadow.position.set(state.frog.x, surfaceY + 0.035, state.frog.z);
  markerMeshes.jumpShadow.material.opacity = isJumping ? 0.18 : 0;
  const shadowScale = isJumping ? 0.75 + Math.sin(clamp(state.frogJump.elapsed / state.frogJump.duration, 0, 1) * Math.PI) * 0.28 : 1;
  markerMeshes.jumpShadow.scale.setScalar(shadowScale);
}
