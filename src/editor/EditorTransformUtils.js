export function transformTargetForRecord(record) {
  return record?.transformTarget || record?.object || null;
}

export function applySnapshotTransform(object, transform) {
  if (!object || !transform) return;

  if (transform.position) {
    object.position.set(
      transform.position.x ?? object.position.x,
      transform.position.y ?? object.position.y,
      transform.position.z ?? object.position.z
    );
  }

  if (transform.rotation) {
    object.rotation.set(
      transform.rotation.x ?? object.rotation.x,
      transform.rotation.y ?? object.rotation.y,
      transform.rotation.z ?? object.rotation.z
    );
  }

  if (transform.scale) {
    object.scale.set(
      transform.scale.x ?? object.scale.x,
      transform.scale.y ?? object.scale.y,
      transform.scale.z ?? object.scale.z
    );
  }

  object.updateMatrixWorld(true);
}
