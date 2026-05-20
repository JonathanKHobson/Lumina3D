export function createHudRefs(root = document) {
  return {
    root: root.querySelector("#hud"),
    active: root.querySelector("#activeActor"),
    goal: root.querySelector("#goalState"),
    step: root.querySelector("#stepState"),
    prompt: root.querySelector("#prompt"),
    speech: root.querySelector("#speechBubble"),
    speechSecondary: root.querySelector("#speechBubbleSecondary"),
    skipModal: root.querySelector("#skipModal"),
    skipReason: root.querySelector("#skipReason"),
    skipYes: root.querySelector("#skipYes"),
    skipNo: root.querySelector("#skipNo"),
    controlsToggle: root.querySelector("#controlsToggle"),
    controlsPanel: root.querySelector("#controlsPanel"),
    devEditorToggle: root.querySelector("#devEditorToggle"),
    devEditorPanel: root.querySelector("#devEditorPanel"),
    devEditorSelectionSummary: root.querySelector("#devEditorSelectionSummary"),
    devEditorObjectList: root.querySelector("#devEditorObjectList"),
    devEditorSnapToggle: root.querySelector("#devEditorSnapToggle"),
    devEditorColliderToggle: root.querySelector("#devEditorColliderToggle"),
    devEditorExportLayout: root.querySelector("#devEditorExportLayout"),
    devEditorCopySelectionDelta: root.querySelector("#devEditorCopySelectionDelta"),
    devEditorCopyAiContext: root.querySelector("#devEditorCopyAiContext"),
    devEditorExportPatchDraft: root.querySelector("#devEditorExportPatchDraft"),
    levelCompleteModal: root.querySelector("#levelCompleteModal"),
    loveLetterModal: root.querySelector("#loveLetterModal"),
    loveLetterTitle: root.querySelector("#loveLetterTitle"),
    loveLetterMessage: root.querySelector("#loveLetterMessage"),
    loveLetterContinue: root.querySelector("#loveLetterContinue"),
    continueFreeMode: root.querySelector("#continueFreeMode"),
    resetTutorialLevel: root.querySelector("#resetTutorialLevel"),
    continuePrompt: root.querySelector("#continuePrompt"),
    nextLevel: root.querySelector("#nextLevel"),
    completeEyebrow: root.querySelector("#completeEyebrow"),
    completeTitle: root.querySelector("#completeTitle"),
    completeDescription: root.querySelector("#completeDescription"),
    titleCard: root.querySelector("#titleCard"),
    titleCardText: root.querySelector("#titleCardText"),
    doorNotePanel: root.querySelector("#doorNotePanel"),
    doorNoteText: root.querySelector("#doorNoteText"),
    exitArrow: root.querySelector("#exitArrow"),
    fadeOverlay: root.querySelector("#fadeOverlay"),
    exitConfirmModal: root.querySelector("#exitConfirmModal"),
    exitContinue: root.querySelector("#exitContinue"),
    exitStay: root.querySelector("#exitStay")
  };
}

export function renderSkipModal(hud, skipModal) {
  if (!hud.skipModal) return;
  hud.skipModal.classList.toggle("is-open", skipModal.visible);
  hud.skipModal.setAttribute("aria-hidden", skipModal.visible ? "false" : "true");
  if (hud.skipReason) hud.skipReason.textContent = skipModal.reason || "You are trying an action before the guide reaches it.";
}

export function renderControlsPanel(hud, open) {
  if (!hud.controlsToggle || !hud.controlsPanel) return;
  hud.controlsToggle.setAttribute("aria-expanded", open ? "true" : "false");
  hud.controlsPanel.hidden = !open;
  hud.controlsPanel.classList.toggle("is-open", open);
}

export function renderLevelCompleteModal(hud, { open, isTutorial, levelName = "Level One" }) {
  if (!hud.levelCompleteModal) return;
  hud.levelCompleteModal.classList.toggle("is-open", open);
  hud.levelCompleteModal.setAttribute("aria-hidden", open ? "false" : "true");
  if (hud.completeEyebrow) hud.completeEyebrow.textContent = isTutorial ? "Tutorial Complete" : `${levelName} Complete`;
  if (hud.completeTitle) hud.completeTitle.textContent = "Love Letter Found!";
  if (hud.completeDescription) {
    hud.completeDescription.textContent = isTutorial
      ? "The tutorial is complete. You can keep testing this room, restart it, or continue to Level One."
      : `${levelName} is complete. You can keep testing this room or reset the level.`;
  }
  if (hud.nextLevel) {
    hud.nextLevel.disabled = !isTutorial;
    hud.nextLevel.textContent = "Next Level";
  }
  if (hud.resetTutorialLevel) hud.resetTutorialLevel.textContent = isTutorial ? "Reset Tutorial Level" : "Reset Level";
}

export function renderLoveLetterMessageModal(hud, loveLetterMessage) {
  if (!hud.loveLetterModal) return;
  const open = loveLetterMessage.visible;
  hud.loveLetterModal.hidden = !open;
  hud.loveLetterModal.classList.toggle("is-open", open);
  hud.loveLetterModal.setAttribute("aria-hidden", open ? "false" : "true");
  if (hud.loveLetterTitle) hud.loveLetterTitle.textContent = loveLetterMessage.title;
  if (hud.loveLetterMessage) hud.loveLetterMessage.textContent = loveLetterMessage.text;
}

export function renderContinuePrompt(hud, visible) {
  if (!hud.continuePrompt) return;
  hud.continuePrompt.hidden = !visible;
  hud.continuePrompt.classList.toggle("is-visible", visible);
}

export function getHudPrompt(state, stepId, { sceneIds, tutorialSteps, freePlayPrompt }) {
  if (state.scene.id === sceneIds.HOME) {
    if (state.home.phase === "leaving") return "";
    if (state.home.phase === "arrival") return "";
    if (state.home.exitConfirmVisible) return "Choose whether to continue to Level One.";
    if (state.home.noteVisible) return "Read the note on the door.";
    if (state.home.noteRead) return state.overridePrompt?.text || "Follow the trail away from home.";
    return state.overridePrompt?.text || "Look around the house.";
  }
  if (state.scene.id === sceneIds.LEVEL_ONE) {
    if (state.levelOne.phase === "title") return "";
    if (state.levelOne.phase === "arrival") return "";
    if (state.celebration.active) return "Love Letter found.";
    if (state.celebration.modalVisible) return "Level One Complete.";
    if (state.levelOne.bridgeComplete) return state.overridePrompt?.text || "Cross the completed bridge and collect the Love Letter.";
    return state.overridePrompt?.text || "Find a way across the water to the Love Letter.";
  }
  if (state.scene.id === sceneIds.LEVEL_TWO) {
    if (state.levelTwo.phase === "title") return "";
    if (state.levelTwo.phase === "arrival") return "";
    if (state.celebration.active) return "Love Letter found.";
    if (state.celebration.modalVisible) return "Level Two Complete.";
    if (state.levelTwo.placeholderLoveLetterCollectable) return state.overridePrompt?.text || "Collect the elevated Love Letter.";
    return state.overridePrompt?.text || "Use Frog and Elephant to reach the elevated Love Letter.";
  }
  if (state.celebration.active) return "Love Letter found.";
  if (state.celebration.modalVisible) return "Tutorial Complete.";
  if (state.tutorialComplete && state.celebration.freeMode) return "Free Mode: explore the tutorial level.";
  if (state.tutorialSkipped && !state.tutorialComplete) return state.overridePrompt?.text || freePlayPrompt;
  return state.overridePrompt?.text || tutorialSteps[stepId] || "";
}

export function getHudGoalLabel(state, sceneIds) {
  if (state.scene.id === sceneIds.HOME) {
    if (state.home.phase === "leaving") return "Leaving home";
    if (state.home.phase === "arrival") return "Arriving home";
    return state.home.noteRead ? "Follow trail" : "Read note";
  }
  if (state.scene.id === sceneIds.LEVEL_ONE) {
    if (state.levelOne.phase === "title") return "Level One";
    if (state.spellbookCollected) return "Complete";
    return state.levelOne.bridgeComplete ? "Cross bridge" : "Reach Love Letter";
  }
  if (state.scene.id === sceneIds.LEVEL_TWO) {
    if (state.levelTwo.phase === "title") return "Level Two";
    if (state.spellbookCollected || state.levelTwo.complete) return "Complete";
    if (state.levelTwo.placeholderLoveLetterCollectable) return "Collect Love Letter";
    if (state.levelTwo.elephantSpawned) return "Use Elephant";
    return state.levelTwo.blueRampActive ? "Find Elephant Totem" : "Reach Love Letter";
  }
  return state.tutorialComplete ? "Complete" : state.doorwayOpen ? "Door open" : state.cubelings.frog.unlocked ? "Frog unlocked" : "Learn controls";
}

export function getHudStepLabel(state, sceneIds, guidedStepCount) {
  if (state.scene.id === sceneIds.HOME) return state.home.phase === "play" ? "Home" : "";
  if (state.scene.id === sceneIds.LEVEL_ONE) return state.levelOne.phase === "play" ? "Level One" : "";
  if (state.scene.id === sceneIds.LEVEL_TWO) return state.levelTwo.phase === "play" ? "Level Two" : "";
  return state.tutorialSkipped
    ? "Objective"
    : state.tutorialComplete
      ? "Done"
      : `Step ${Math.min(state.tutorialIndex + 1, guidedStepCount)} / ${guidedStepCount}`;
}

export function renderHudBase(hud, { activeLabel, goalLabel, stepLabel, prompt }) {
  if (hud.active) hud.active.textContent = activeLabel;
  if (hud.goal) hud.goal.textContent = goalLabel;
  if (hud.step) hud.step.textContent = stepLabel;
  if (hud.prompt) hud.prompt.textContent = prompt;
}

export function renderSceneOverlays(hud, { state, sceneIds, doorNoteText, updateExitArrowPosition }) {
  if (hud.root) {
    const cinematic = state.scene.id === sceneIds.HOME && state.home.phase !== "play" ||
      state.scene.id === sceneIds.LEVEL_ONE && state.levelOne.phase !== "play" ||
      state.scene.id === sceneIds.LEVEL_TWO && state.levelTwo.phase !== "play";
    hud.root.classList.toggle("is-hidden", cinematic);
  }
  if (hud.titleCard) {
    const visible = state.scene.titleCardVisible;
    hud.titleCard.hidden = !visible;
    hud.titleCard.classList.toggle("is-visible", visible);
    if (hud.titleCardText) hud.titleCardText.textContent = state.scene.titleCardText || "Level One";
  }
  if (hud.doorNotePanel) {
    const visible = state.scene.id === sceneIds.HOME && state.home.noteVisible;
    hud.doorNotePanel.hidden = !visible;
    if (hud.doorNoteText) hud.doorNoteText.textContent = doorNoteText;
  }
  if (hud.exitArrow) {
    const visible = state.scene.id === sceneIds.HOME && state.home.phase === "play" && state.home.arrowVisible;
    hud.exitArrow.hidden = !visible;
    if (visible) updateExitArrowPosition();
  }
  if (hud.exitConfirmModal) {
    const visible = state.scene.id === sceneIds.HOME && state.home.exitConfirmVisible;
    hud.exitConfirmModal.classList.toggle("is-open", visible);
    hud.exitConfirmModal.setAttribute("aria-hidden", visible ? "false" : "true");
  }
  if (hud.fadeOverlay) {
    const visible = state.scene.fadeVisible;
    hud.fadeOverlay.hidden = !visible;
    hud.fadeOverlay.classList.toggle("is-visible", visible);
  }
}

export function renderSpeechBubbleElement(element, speech, { offset = { x: 0, y: 0 }, worldToScreen, getAnchorPoint }) {
  if (!element) return;
  if (!speech) {
    element.hidden = true;
    return;
  }
  const screenPoint = worldToScreen(getAnchorPoint(speech.anchor));
  element.hidden = false;
  element.textContent = speech.text;
  element.style.transform = `translate(${Math.round(screenPoint.x + (offset.x || 0))}px, ${Math.round(screenPoint.y + (offset.y || 0))}px) translate(-50%, -100%)`;
}
