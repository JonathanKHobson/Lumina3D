export function gridPoint(x, y, width = 14, height = 9, tile = 2.0) {
  return {
    x: (x - (width - 1) / 2) * tile,
    z: (y - (height - 1) / 2) * tile
  };
}

export function sceneGridPoint(width, height, x, y, tile = 2.0) {
  return {
    x: (x - (width - 1) / 2) * tile,
    z: (y - (height - 1) / 2) * tile
  };
}

export function boundsForGrid(width, height, tile = 2.0) {
  return {
    minX: -width * tile * 0.5,
    maxX: width * tile * 0.5,
    minZ: -height * tile * 0.5,
    maxZ: height * tile * 0.5
  };
}
