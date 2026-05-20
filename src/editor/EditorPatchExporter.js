const TRANSFORM_EPSILON = 0.0001;

function rounded(value) {
  return Number(Number(value).toFixed(6));
}

function axisSnapshot(vectorLike) {
  return {
    x: rounded(vectorLike.x),
    y: rounded(vectorLike.y),
    z: rounded(vectorLike.z)
  };
}

export function snapshotTransform(object) {
  return {
    position: axisSnapshot(object.position),
    rotation: axisSnapshot(object.rotation),
    scale: axisSnapshot(object.scale)
  };
}

export function diffTransform(original, current, epsilon = TRANSFORM_EPSILON) {
  const changes = [];
  ["position", "rotation", "scale"].forEach((group) => {
    ["x", "y", "z"].forEach((axis) => {
      const oldValue = rounded(original[group][axis]);
      const newValue = rounded(current[group][axis]);
      if (Math.abs(oldValue - newValue) <= epsilon) return;
      changes.push({
        path: `transform.${group}.${axis}`,
        oldValue,
        newValue
      });
    });
  });
  return changes;
}

export function dirtyRecords(records) {
  return records
    .map((record) => ({
      ...record,
      changes: diffTransform(record.originalTransform, snapshotTransform(record.object))
    }))
    .filter((record) => record.changes.length > 0);
}

export function buildEditorPatch({ levelId, records, selectedId }) {
  const dirty = dirtyRecords(records);
  const selectedDirty = dirty.find((record) => record.id === selectedId) || dirty[0] || null;
  const selectedRecord = records.find((record) => record.id === selectedId) || null;
  const primary = selectedDirty || selectedRecord;
  return {
    patchType: "lumina3d.editor.transformPatch",
    levelId,
    objectId: primary?.id || selectedId || null,
    sourceRef: primary?.sourceRef || null,
    changes: selectedDirty?.changes || [],
    objects: dirty.map((record) => ({
      objectId: record.id,
      name: record.name,
      category: record.category,
      sourceRef: record.sourceRef,
      changes: record.changes
    }))
  };
}

export function summarizeEditorPatch(patch) {
  return {
    patchType: patch.patchType,
    levelId: patch.levelId,
    objectId: patch.objectId,
    dirtyObjectCount: patch.objects.length,
    changeCount: patch.objects.reduce((sum, objectPatch) => sum + objectPatch.changes.length, 0)
  };
}
