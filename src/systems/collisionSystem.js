export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pointInBounds(point, bounds) {
  return point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.z >= bounds.minZ &&
    point.z <= bounds.maxZ;
}

export function circleIntersectsAabb(x, z, radius, box) {
  const closestX = clamp(x, box.x - box.halfX, box.x + box.halfX);
  const closestZ = clamp(z, box.z - box.halfZ, box.z + box.halfZ);
  return Math.hypot(x - closestX, z - closestZ) < radius;
}

export function clampZoneToBoundsForRadius(rawZone, bounds, radius) {
  return {
    ...rawZone,
    minX: clamp(rawZone.minX, bounds.minX + radius, bounds.maxX - radius),
    maxX: clamp(rawZone.maxX, bounds.minX + radius, bounds.maxX - radius),
    minZ: clamp(rawZone.minZ, bounds.minZ + radius, bounds.maxZ - radius),
    maxZ: clamp(rawZone.maxZ, bounds.minZ + radius, bounds.maxZ - radius)
  };
}
