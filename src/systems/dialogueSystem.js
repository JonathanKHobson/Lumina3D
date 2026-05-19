export function emptySpeech(anchor = "") {
  return { text: "", anchor, until: 0 };
}

export function clearSpeechQueue(state) {
  state.speechQueue = [];
  state.speechSequenceActive = false;
}

export function setSpeech(state, elapsed, anchor, text, seconds = 1.4) {
  state.speech = { anchor, text, until: elapsed + seconds };
}

export function showSpeech(state, elapsed, anchor, text, seconds = 1.4) {
  clearSpeechQueue(state);
  setSpeech(state, elapsed, anchor, text, seconds);
}

export function showSecondarySpeech(state, elapsed, anchor, text, seconds = 1.4) {
  state.secondarySpeech = { anchor, text, until: elapsed + seconds };
}

export function queueSpeech(state, elapsed, items) {
  state.speechQueue = items.map((item) => ({ ...item }));
  state.speechSequenceActive = true;
  state.secondarySpeech = emptySpeech();
  state.speech = emptySpeech();
  updateSpeechQueue(state, elapsed);
}

export function updateSpeechQueue(state, elapsed) {
  if (!state.speechSequenceActive) return;
  if (state.speech.until && elapsed < state.speech.until) return;
  if (!state.speechQueue.length) {
    state.speechSequenceActive = false;
    state.speech = emptySpeech();
    return;
  }
  const next = state.speechQueue.shift();
  setSpeech(state, elapsed, next.anchor, next.text, next.seconds || 1.4);
}

export function getSpeechBubble(state, elapsed) {
  if (state.celebration.active || state.celebration.modalVisible) return null;
  if (state.skipModal.visible && state.speech.text) return state.speech;
  if (state.speech.text && elapsed < state.speech.until) return state.speech;
  return null;
}

export function getSecondarySpeechBubble(state, elapsed) {
  if (state.celebration.active || state.celebration.modalVisible || state.skipModal.visible) return null;
  if (state.secondarySpeech.text && elapsed < state.secondarySpeech.until) return state.secondarySpeech;
  return null;
}
