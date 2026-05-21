export function applySceneRevealVisibility({
  state,
  sceneIds,
  sceneGroups,
  floorMeshes,
  actorMeshes,
  markerMeshes,
  barrierMeshes,
  barrierEndCapMeshes,
  levelOneBridgeMeshes,
  levelOneBridgeDeckMeshes,
  levelTwoInteractiveMeshes,
  surfaceY,
  doorRow,
  levelOneBridgeVisualY,
  levelOneBridgeDeckY,
  levelTwoBlueRamp,
  rightFloorProgress,
  barrierSegmentProgress,
  easeOutCubic,
  clamp
}) {
  sceneGroups.tutorial.visible = state.scene.id === sceneIds.TUTORIAL;
  sceneGroups.home.visible = state.scene.id === sceneIds.HOME;
  sceneGroups.levelOne.visible = state.scene.id === sceneIds.LEVEL_ONE;
  sceneGroups.levelTwo.visible = state.scene.id === sceneIds.LEVEL_TWO;
  floorMeshes.forEach((mesh) => {
    const column = mesh.userData.column;
    const row = mesh.userData.row;
    const progress = state.scene.id === sceneIds.TUTORIAL ? rightFloorProgress(column, row) : 0;
    mesh.visible = progress > 0.001;
    mesh.position.y = (1 - progress) * 2.35;
  });
  if (actorMeshes.frog) actorMeshes.frog.visible = state.scene.id !== sceneIds.HOME && state.reveals.frog;
  if (actorMeshes.elephant) actorMeshes.elephant.visible = state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.elephantSpawned;
  if (markerMeshes.frogEcho) markerMeshes.frogEcho.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.frogEcho && !state.reveals.frog;
  if (markerMeshes.frogEchoCircle) markerMeshes.frogEchoCircle.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.frogEcho && !state.reveals.frog;
  if (markerMeshes.frogTotem) markerMeshes.frogTotem.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.frogTotem && !state.frogTotem.collected;
  if (markerMeshes.frogTotemGlow) markerMeshes.frogTotemGlow.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.frogTotem && !state.frogTotem.collected;
  barrierMeshes.forEach((mesh, row) => {
    const progress = barrierSegmentProgress(row);
    mesh.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.barrier && progress > 0.001 && !(state.doorwayOpen && row === doorRow);
    mesh.position.y = surfaceY + (1 - progress) * 2.2;
  });
  barrierEndCapMeshes.forEach((mesh) => {
    const progress = barrierSegmentProgress(mesh.userData.revealIndex);
    mesh.visible = state.scene.id === sceneIds.TUTORIAL && state.reveals.barrier && progress > 0.001;
    mesh.position.y = surfaceY + (1 - progress) * 2.2;
  });
  levelOneBridgeMeshes.complete.forEach((mesh, index) => {
    mesh.visible = state.scene.id === sceneIds.LEVEL_ONE && state.levelOne.bridgeComplete;
    if (state.levelOne.bridgeRevealActive) {
      const progress = easeOutCubic(clamp(state.levelOne.bridgeRevealElapsed / 0.85 - index * 0.08, 0, 1));
      mesh.position.y = levelOneBridgeVisualY + (1 - progress) * 1.2;
    } else {
      mesh.position.y = levelOneBridgeVisualY;
    }
  });
  levelOneBridgeDeckMeshes.partial.forEach((deck) => {
    deck.visible = state.scene.id === sceneIds.LEVEL_ONE;
  });
  levelOneBridgeDeckMeshes.complete.forEach((deck, index) => {
    deck.visible = state.scene.id === sceneIds.LEVEL_ONE && state.levelOne.bridgeComplete;
    if (state.levelOne.bridgeRevealActive) {
      const progress = easeOutCubic(clamp(state.levelOne.bridgeRevealElapsed / 0.85 - index * 0.08, 0, 1));
      deck.position.y = levelOneBridgeDeckY + (1 - progress) * 1.2;
    } else {
      deck.position.y = levelOneBridgeDeckY;
    }
  });
  if (markerMeshes.button) markerMeshes.button.visible = state.scene.id !== sceneIds.HOME && state.reveals.button;
  if (markerMeshes.rewardGlow) markerMeshes.rewardGlow.visible = state.scene.id !== sceneIds.HOME && state.reveals.spellbook && !state.spellbookCollected;
  if (levelTwoInteractiveMeshes.blueButton) {
    levelTwoInteractiveMeshes.blueButton.visible = state.scene.id === sceneIds.LEVEL_TWO;
  }
  const isLevelTwo = state.scene.id === sceneIds.LEVEL_TWO;
  const blueRampRevealSeconds = levelTwoBlueRamp?.revealSeconds || 0.72;
  const blueRampRevealProgress = state.levelTwo.blueRampRevealActive
    ? easeOutCubic(clamp((state.levelTwo.blueRampRevealElapsed || 0) / blueRampRevealSeconds, 0, 1))
    : 1;
  if (levelTwoInteractiveMeshes.blueRampDormantPanel) {
    const panel = levelTwoInteractiveMeshes.blueRampDormantPanel;
    panel.visible = isLevelTwo && (!state.levelTwo.blueRampActive || state.levelTwo.blueRampRevealActive);
    const material = panel.material;
    if (material && material.opacity !== undefined) {
      const baseOpacity = panel.userData.baseOpacity ?? material.opacity;
      material.opacity = state.levelTwo.blueRampRevealActive
        ? baseOpacity * (1 - blueRampRevealProgress * 0.45)
        : baseOpacity;
    }
  }
  if (levelTwoInteractiveMeshes.blueRamp) {
    const blueRamp = levelTwoInteractiveMeshes.blueRamp;
    blueRamp.visible = isLevelTwo && state.levelTwo.blueRampActive;
    const baseY = blueRamp.userData.basePositionY ?? surfaceY;
    const baseScale = blueRamp.userData.baseScale;
    if (baseScale) {
      const revealProgress = state.levelTwo.blueRampRevealActive ? blueRampRevealProgress : 1;
      const revealStartYOffset = levelTwoBlueRamp?.revealStartYOffset ?? -0.34;
      blueRamp.position.y = baseY + (1 - revealProgress) * revealStartYOffset;
      blueRamp.scale.set(
        baseScale.x,
        baseScale.y * (0.18 + revealProgress * 0.82),
        baseScale.z
      );
    } else {
      blueRamp.position.y = baseY;
    }
  }
  if (levelTwoInteractiveMeshes.elephantEcho) {
    levelTwoInteractiveMeshes.elephantEcho.visible = state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.elephantEchoVisible && !state.levelTwo.elephantAwake;
  }
  if (levelTwoInteractiveMeshes.elephantEchoRing) {
    levelTwoInteractiveMeshes.elephantEchoRing.visible = state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.elephantEchoVisible;
  }
  if (levelTwoInteractiveMeshes.elephantTotem) {
    levelTwoInteractiveMeshes.elephantTotem.visible = state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected;
  }
  if (levelTwoInteractiveMeshes.elephantTotemGlow) {
    levelTwoInteractiveMeshes.elephantTotemGlow.visible = state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected;
  }
  Object.values(levelTwoInteractiveMeshes.redButtons || {}).forEach((mesh) => {
    mesh.visible = state.scene.id === sceneIds.LEVEL_TWO;
  });
  Object.values(levelTwoInteractiveMeshes.redPlatforms || {}).forEach((mesh) => {
    mesh.visible = state.scene.id === sceneIds.LEVEL_TWO;
  });
}
