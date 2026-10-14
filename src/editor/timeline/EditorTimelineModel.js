export const EDITOR_TIMELINE_SCHEMA = "lumina3d.editor.solutionTimeline.v1";

export function createEmptyEditorTimeline(levelId = "") {
  return {
    schema: EDITOR_TIMELINE_SCHEMA,
    levelId,
    mode: "inactive",
    currentTime: 0,
    duration: 0,
    tracks: [],
    events: []
  };
}

export function summarizeEditorTimeline(timeline = null) {
  const source = timeline || createEmptyEditorTimeline();
  return {
    schema: source.schema || EDITOR_TIMELINE_SCHEMA,
    levelId: source.levelId || null,
    mode: source.mode || "inactive",
    active: source.mode && source.mode !== "inactive",
    currentTime: Number(source.currentTime || 0),
    duration: Number(source.duration || 0),
    trackCount: Array.isArray(source.tracks) ? source.tracks.length : 0,
    eventCount: Array.isArray(source.events) ? source.events.length : 0
  };
}
