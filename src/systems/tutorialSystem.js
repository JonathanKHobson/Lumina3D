export function currentTutorialStepId(state, stepIds) {
  return stepIds[state.tutorialIndex] || "complete";
}

export function tutorialStepBefore(state, stepIds, stepId) {
  return stepIds.indexOf(currentTutorialStepId(state, stepIds)) < stepIds.indexOf(stepId);
}

export function tutorialHasLearned(state, stepIds, stepId) {
  const index = stepIds.indexOf(stepId);
  return state.tutorialSkipped || state.tutorialComplete || index >= 0 && state.maxTutorialIndexReached >= index;
}

export function shouldRequestTutorialSkip(state, sceneIds, stepIds, stepId) {
  if (state.scene.id !== sceneIds.TUTORIAL) return false;
  if (state.tutorialSkipped || state.tutorialComplete || state.celebration.freeMode) return false;
  return tutorialStepBefore(state, stepIds, stepId) && !tutorialHasLearned(state, stepIds, stepId);
}

export function recordTutorialNudgeState(state, elapsed, id, repeatWindow) {
  const sameAction = state.skipNudge.id === id && elapsed - state.skipNudge.lastAt <= repeatWindow;
  state.skipNudge = {
    id,
    count: sameAction ? state.skipNudge.count + 1 : 1,
    lastAt: elapsed
  };
  return state.skipNudge.count;
}

export function frogUnlockStepForState(state) {
  if (state.reveals.frog) return "frog_cubeling_available";
  if (state.frogTotem.collected) return "frog_totem_collected";
  if (state.reveals.frogTotem) return "collect_frog_cubeling_totem";
  if (state.reveals.frogEcho) return "inspect_frog_echo";
  return "not_started";
}
