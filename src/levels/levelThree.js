import {
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { boundsForGrid, sceneGridPoint } from "../core/grid.js";

export const LEVEL_THREE_WIDTH = 26;
export const LEVEL_THREE_HEIGHT = 22;
export const LEVEL_THREE_BOUNDS = boundsForGrid(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, TILE);
export const LEVEL_THREE_TITLE_SECONDS = 1.65;
export const LEVEL_THREE_CINEMATIC_SPEED = 2.0;
export const LEVEL_THREE_MAP_SHAPE = "mostly-water-lake-islands-spatial-contract-repair";
export const LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y = SURFACE_Y + 2.15;
export const LEVEL_THREE_CLIFF_TOP_Y = SURFACE_Y + 1.42;
export const LEVEL_THREE_TOTEM_GREEN_BUTTON_RADIUS = 1.05;
export const LEVEL_THREE_TOTEM_COLLECTION_RADIUS = 1.1;
export const LEVEL_THREE_FROG_LILY_PAD_SURFACE_PADDING = 0.12;
export const LEVEL_THREE_FROG_LANE_RESET_COOLDOWN = 0.45;
export const LEVEL_THREE_FROG_WATER_BLOCK_COOLDOWN = 1.15;
export const LEVEL_THREE_CROCODILE_RADIUS = 0.62;
export const LEVEL_THREE_CROCODILE_SPEED = 3.4;
export const LEVEL_THREE_TOTEM_RAFT_DRIFT_SECONDS = 1.65;
export const LEVEL_THREE_LILY_PAD_MIN_EDGE_GAP = 1.1;
export const LEVEL_THREE_LILY_PAD_MIN_ISLAND_GAP = 1.45;
export const LEVEL_THREE_CROCODILE_SPAWN = {
  ...point(5.85, 8.65),
  facing: { x: 1, z: -0.1, name: "east" }
};

export const LEVEL_THREE_POINTS = {
  entry: {
    x: LEVEL_THREE_BOUNDS.minX - 1.1,
    z: point(2.0, 10.5).z,
    facing: { x: 1, z: 0, name: "east" }
  },
  humanStart: {
    ...point(2.8, 10.5),
    facing: { x: 1, z: 0, name: "east" }
  },
  frogStart: {
    ...point(4.2, 12.35),
    facing: { x: 1, z: 0, name: "east" }
  },
  placeholderLoveLetter: point(23.5, 3.0),
  futureWaterCubelingReserve: point(18.8, 6.0)
};

export const LEVEL_THREE_START_EDGE_CONNECTION_TILES = uniqueTiles([
  tile(0, 10),
  tile(0, 11),
  tile(1, 10),
  tile(1, 11)
]);

export const LEVEL_THREE_ISLANDS = [
  {
    id: "level3StartIsland",
    name: "Start Island",
    purpose: "Human spawn, Frog start, Crocodile Echo tease, and future Crocodile Totem dock.",
    role: "start",
    tiles: uniqueTiles([
      ...LEVEL_THREE_START_EDGE_CONNECTION_TILES,
      ...rectTiles(1, 5, 8, 13),
      ...rectTiles(2, 4, 7, 7),
      tile(6, 8),
      tile(7, 8),
      tile(6, 10),
      tile(6, 11)
    ])
  },
  {
    id: "level3FrogLaneStart",
    name: "Frog Lane Start Perch",
    purpose: "Future Frog timing lane reset perch; layout marker only in Phase 1.",
    role: "frog-lane-start",
    tiles: uniqueTiles([
      tile(8, 7),
      tile(8, 8)
    ])
  },
  {
    id: "level3TotemWinchIsland",
    name: "Totem Winch Island",
    purpose: "Future Frog-reachable island with the opening green button for the Crocodile Totem raft.",
    role: "opening-green-button",
    tiles: uniqueTiles([
      tile(18, 0),
      tile(19, 0),
      tile(18, 1),
      tile(19, 1),
      tile(20, 1)
    ])
  },
  {
    id: "level3CenterHub",
    name: "Rotating Bridge Pivot",
    purpose: "Small artificial turntable for the future rotating bridge assembly.",
    role: "rotating-bridge-pivot",
    visualIntent: "small artificial pivot / turntable, not a natural island",
    futureMechanic: "rotating bridge assembly",
    tiles: uniqueTiles([
      tile(13, 10)
    ])
  },
  {
    id: "level3GreenButtonIsland",
    name: "Green Button Island",
    purpose: "Future Crocodile-accessible bridge-control green button; not connected by the rotating bridge.",
    role: "bridge-green-button",
    tiles: uniqueTiles([
      ...rectTiles(18, 20, 5, 7),
      tile(19, 8)
    ])
  },
  {
    id: "level3ElephantIsland",
    name: "Elephant Island",
    purpose: "Future Elephant access island and rotating bridge destination.",
    role: "bridge-destination",
    bridgeState: 1,
    tiles: uniqueTiles([
      tile(15, 6),
      tile(16, 6),
      tile(15, 7),
      tile(16, 7),
      tile(15, 8)
    ])
  },
  {
    id: "level3RedButtonAIsland",
    name: "Red Button A Island",
    purpose: "Future Elephant-held Red Button A island and rotating bridge destination.",
    role: "bridge-destination",
    bridgeState: 2,
    tiles: uniqueTiles([
      tile(20, 9),
      tile(21, 9),
      tile(20, 10),
      tile(21, 10),
      tile(19, 10)
    ])
  },
  {
    id: "level3PlatformDockIsland",
    name: "Platform Dock Island",
    purpose: "Future rotating bridge destination leading toward the final platform route.",
    role: "bridge-destination",
    bridgeState: 3,
    tiles: uniqueTiles([
      tile(12, 16),
      tile(13, 16),
      tile(14, 16),
      tile(13, 17),
      tile(14, 17)
    ])
  },
  {
    id: "level3WeightCacheIsland",
    name: "Weight Cache Island",
    purpose: "Future Crocodile cargo source with small anchor stones.",
    role: "crocodile-water-route",
    tiles: uniqueTiles([
      ...rectTiles(4, 6, 16, 18),
      tile(5, 15)
    ])
  },
  {
    id: "level3RedButtonBIsland",
    name: "Red Button B Island",
    purpose: "Future Crocodile cargo destination where anchor stones hold Red Button B.",
    role: "crocodile-water-route",
    tiles: uniqueTiles([
      ...rectTiles(21, 23, 16, 18),
      tile(22, 15)
    ])
  },
  {
    id: "level3LoveLetterCliff",
    name: "Love Letter Cliff",
    purpose: "Raised final reward area; visible but unreachable in Phase 1.",
    role: "final-reward",
    tiles: uniqueTiles([
      ...rectTiles(22, 24, 2, 4),
      tile(23, 5)
    ])
  }
].map((island) => ({
  ...island,
  position: centerOfTiles(island.tiles),
  tileCount: island.tiles.length
}));

export const LEVEL_THREE_ISLAND_MARKERS = LEVEL_THREE_ISLANDS.map((island) => ({
  id: island.id,
  objectId: island.id === "level3LoveLetterCliff" ? "level3LoveLetterCliffIslandMarker" : island.id,
  name: island.name,
  role: island.role,
  purpose: island.purpose,
  position: island.position,
  islandId: island.id,
  editorMovable: true,
  phaseOneMarker: true
}));

export const LEVEL_THREE_LAND_TILES = uniqueTiles(LEVEL_THREE_ISLANDS.flatMap((island) => island.tiles));
export const LEVEL_THREE_PATH_TILES = uniqueTiles([]);
export const LEVEL_THREE_WATER_TILES = allWaterTiles(LEVEL_THREE_LAND_TILES);

export const LEVEL_THREE_LILY_PAD_PLACEHOLDERS = [
  {
    id: "level3MovingLilyPad1",
    name: "Moving Lily Pad 1",
    tile: tile(10, 6),
    position: point(10.1, 6.3),
    trackStart: point(9.35, 6.85),
    trackEnd: point(10.65, 5.85),
    trackStartTile: tile(9, 7),
    trackEndTile: tile(11, 6),
    radius: 0.98
  },
  {
    id: "level3MovingLilyPad2",
    name: "Moving Lily Pad 2",
    tile: tile(13, 5),
    position: point(12.8, 4.65),
    trackStart: point(12.05, 4.05),
    trackEnd: point(13.45, 4.95),
    trackStartTile: tile(12, 4),
    trackEndTile: tile(13, 5),
    radius: 0.96
  },
  {
    id: "level3MovingLilyPad3",
    name: "Moving Lily Pad 3",
    tile: tile(16, 3),
    position: point(15.8, 3.1),
    trackStart: point(15.1, 3.65),
    trackEnd: point(16.5, 2.55),
    trackStartTile: tile(15, 4),
    trackEndTile: tile(17, 3),
    radius: 0.94
  }
];

export const LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS = [
  {
    id: "level3TotemGreenButton",
    name: "Opening Totem Green Button",
    purpose: "Future repeatable button that winches the Crocodile Totem raft toward Start Island.",
    position: point(18.8, 0.85),
    islandId: "level3TotemWinchIsland",
    futureMechanism: "crocodile-totem-raft-winch"
  },
  {
    id: "level3BridgeGreenButton",
    name: "Bridge Control Green Button",
    purpose: "Future repeatable button for the central rotating bridge.",
    position: point(19.2, 6.1),
    islandId: "level3GreenButtonIsland",
    futureMechanism: "central-bridge-cycle"
  }
];

export const LEVEL_THREE_RAFT_MARKERS = [
  {
    id: "level3TotemRaftMarker0",
    name: "Totem Raft Far Shrine Marker",
    stateIndex: 0,
    position: point(2.7, 3.1)
  },
  {
    id: "level3TotemRaftMarker1",
    name: "Totem Raft Middle Marker",
    stateIndex: 1,
    position: point(5.1, 4.7)
  },
  {
    id: "level3TotemRaftMarker2",
    name: "Totem Raft Near Marker",
    stateIndex: 2,
    position: point(9.7, 6.25)
  },
  {
    id: "level3TotemDockMarker",
    name: "Start Island Totem Dock Marker",
    stateIndex: 3,
    position: point(8.75, 8.25)
  }
];

export const LEVEL_THREE_TOTEM_RAFT_GATES = [
  {
    id: "level3TotemRaftGate1",
    name: "Totem Raft Floating Reed Latch 1",
    gateIndex: 1,
    fromState: 0,
    toState: 1,
    position: midpoint(LEVEL_THREE_RAFT_MARKERS[0].position, LEVEL_THREE_RAFT_MARKERS[1].position),
    visual: "floating-reed-latch",
    waterOnly: true,
    blocksRaftOnly: true
  },
  {
    id: "level3TotemRaftGate2",
    name: "Totem Raft Floating Reed Latch 2",
    gateIndex: 2,
    fromState: 1,
    toState: 2,
    position: midpoint(LEVEL_THREE_RAFT_MARKERS[1].position, LEVEL_THREE_RAFT_MARKERS[2].position),
    visual: "floating-reed-latch",
    waterOnly: true,
    blocksRaftOnly: true
  },
  {
    id: "level3TotemRaftGate3",
    name: "Totem Raft Floating Reed Latch 3",
    gateIndex: 3,
    fromState: 2,
    toState: 3,
    position: midpoint(LEVEL_THREE_RAFT_MARKERS[2].position, LEVEL_THREE_RAFT_MARKERS[3].position),
    visual: "floating-reed-latch",
    waterOnly: true,
    blocksRaftOnly: true
  }
];

export const LEVEL_THREE_TOTEM_RAFT = {
  id: "level3TotemRaft",
  name: "Crocodile Totem Raft",
  position: LEVEL_THREE_RAFT_MARKERS[0].position,
  collectibleBy: "human-later",
  phaseOneCollectable: false
};

export const LEVEL_THREE_CROCODILE_ECHO = {
  id: "level3CrocodileEcho",
  name: "Dormant Crocodile Echo",
  position: point(5.45, 9.1),
  radius: 0.92,
  active: false,
  solid: false
};

export const LEVEL_THREE_BRIDGE_DESTINATION_MARKERS = [
  {
    id: "level3BridgeDestinationStart",
    name: "Bridge Destination Start Island",
    stateIndex: 0,
    position: point(8.2, 10.2),
    islandId: "level3StartIsland"
  },
  {
    id: "level3BridgeDestinationElephant",
    name: "Bridge Destination Elephant Island",
    stateIndex: 1,
    position: point(15.8, 7.0),
    islandId: "level3ElephantIsland"
  },
  {
    id: "level3BridgeDestinationRedA",
    name: "Bridge Destination Red Button A Island",
    stateIndex: 2,
    position: point(19.2, 10.0),
    islandId: "level3RedButtonAIsland"
  },
  {
    id: "level3BridgeDestinationPlatformDock",
    name: "Bridge Destination Platform Dock Island",
    stateIndex: 3,
    position: point(13.4, 15.6),
    islandId: "level3PlatformDockIsland"
  }
];

export const LEVEL_THREE_BRIDGE_PIVOT = {
  id: "level3CenterHub",
  name: "Rotating Bridge Pivot",
  role: "rotating-bridge-pivot",
  position: LEVEL_THREE_ISLANDS.find((island) => island.id === "level3CenterHub")?.position || point(13, 10),
  footprintTiles: 1,
  artificial: true,
  bridgeRotationImplemented: false,
  armLength: 4.6,
  destinationRadius: 9.4
};

export const LEVEL_THREE_BRIDGE_STATE_METADATA = LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.map((marker) => ({
  id: marker.id,
  name: marker.name,
  stateIndex: marker.stateIndex,
  markerId: marker.id,
  islandId: marker.islandId,
  angleRadians: Math.atan2(marker.position.z - LEVEL_THREE_BRIDGE_PIVOT.position.z, marker.position.x - LEVEL_THREE_BRIDGE_PIVOT.position.x),
  distanceFromPivot: distanceBetween(marker.position, LEVEL_THREE_BRIDGE_PIVOT.position)
}));

export const LEVEL_THREE_RED_BUTTON_PLACEHOLDERS = [
  {
    id: "level3RedButtonA",
    name: "Red Button A Placeholder",
    islandId: "level3RedButtonAIsland",
    position: point(20.7, 9.75),
    futureRequirement: "elephant-held-weight"
  },
  {
    id: "level3RedButtonB",
    name: "Red Button B Placeholder",
    islandId: "level3RedButtonBIsland",
    position: point(22.0, 16.9),
    futureRequirement: "anchor-stone-summed-weight"
  }
];

export const LEVEL_THREE_ANCHOR_STONES = [
  {
    id: "level3AnchorStone1",
    name: "Anchor Stone 1",
    position: point(4.75, 16.75)
  },
  {
    id: "level3AnchorStone2",
    name: "Anchor Stone 2",
    position: point(5.55, 17.45)
  },
  {
    id: "level3AnchorStone3",
    name: "Anchor Stone 3",
    position: point(5.25, 16.05)
  }
];

export const LEVEL_THREE_RESET_PERCH_PLACEHOLDERS = [
  {
    id: "level3TotemWinchResetPerch",
    name: "Totem Winch Reset Rock",
    position: point(19.6, 1.35)
  }
];

export const LEVEL_THREE_FROG_LANE_RESET_POINT = {
  ...point(8.1, 7.05),
  facing: { x: 1, z: -0.2, name: "east" }
};

export const LEVEL_THREE_FROG_LANE_WATER_RESET_ZONE = {
  minX: point(8, 7).x - 0.4,
  maxX: point(19, 1).x + 1.0,
  minZ: point(19, 1).z - 1.2,
  maxZ: point(8, 7).z + 0.8
};

export const LEVEL_THREE_FROG_LANE_JUMPS = [
  {
    id: "level3JumpFrogLaneStartToPad1",
    fromId: "level3FrogLaneStart",
    toId: "level3MovingLilyPad1",
    from: LEVEL_THREE_FROG_LANE_RESET_POINT,
    to: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[0].position,
    fromRadius: 2.35,
    destinationSurface: "level3MovingLilyPad1",
    overWater: true
  },
  {
    id: "level3JumpPad1ToPad2",
    fromId: "level3MovingLilyPad1",
    toId: "level3MovingLilyPad2",
    from: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[0].position,
    to: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[1].position,
    fromRadius: 1.35,
    destinationSurface: "level3MovingLilyPad2",
    overWater: true
  },
  {
    id: "level3JumpPad2ToPad3",
    fromId: "level3MovingLilyPad2",
    toId: "level3MovingLilyPad3",
    from: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[1].position,
    to: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[2].position,
    fromRadius: 1.35,
    destinationSurface: "level3MovingLilyPad3",
    overWater: true
  },
  {
    id: "level3JumpPad3ToTotemWinchIsland",
    fromId: "level3MovingLilyPad3",
    toId: "level3TotemWinchIsland",
    from: LEVEL_THREE_LILY_PAD_PLACEHOLDERS[2].position,
    to: point(18, 1),
    fromRadius: 1.35,
    destinationSurface: "level3TotemWinchIsland",
    overWater: true
  }
];

export const LEVEL_THREE_PROPS = [
  ["forestTreeA", 1.2, 8.15, 0.7],
  ["forestBush", 4.65, 13.15, 0.7],
  ["forestRock", 4.4, 8.45, 0.56],
  ["forestGrass", 19.35, 1.3, 0.44],
  ["forestRock", 14.8, 8.2, 0.62],
  ["forestGrass", 11.5, 12.15, 0.52],
  ["forestTreeB", 2.1, 12.75, 0.62],
  ["forestBush", 20.1, 5.25, 0.62],
  ["forestRock", 12.4, 18.1, 0.58],
  ["forestGrass", 21.8, 18.15, 0.52],
  ["forestBush", 24.0, 4.55, 0.58]
];

export const LEVEL_THREE_RESERVED_ZONES = [
  ...LEVEL_THREE_ISLANDS.map((island) => ({
    id: island.id,
    name: island.name,
    purpose: island.purpose,
    position: island.position,
    radius: island.id === "level3CenterHub" ? 3.8 : 2.2
  })),
  {
    id: "level3CrocodileEcho",
    name: LEVEL_THREE_CROCODILE_ECHO.name,
    purpose: "Dormant Crocodile Echo tease only; no unlock or control in Phase 1.",
    position: LEVEL_THREE_CROCODILE_ECHO.position,
    radius: LEVEL_THREE_CROCODILE_ECHO.radius
  },
  {
    id: "level3TotemRaft",
    name: LEVEL_THREE_TOTEM_RAFT.name,
    purpose: "Future moving Crocodile Totem raft; static and unreachable in Phase 1.",
    position: LEVEL_THREE_TOTEM_RAFT.position,
    radius: 1.1
  }
];

export const LEVEL_THREE_PLACEHOLDER_IDS = [
  ...LEVEL_THREE_LILY_PAD_PLACEHOLDERS.map((item) => item.id),
  ...LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.map((item) => item.id),
  LEVEL_THREE_TOTEM_RAFT.id,
  ...LEVEL_THREE_RAFT_MARKERS.map((item) => item.id),
  ...LEVEL_THREE_TOTEM_RAFT_GATES.map((item) => item.id),
  LEVEL_THREE_CROCODILE_ECHO.id,
  ...LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.map((item) => item.id),
  ...LEVEL_THREE_RED_BUTTON_PLACEHOLDERS.map((item) => item.id),
  ...LEVEL_THREE_ANCHOR_STONES.map((item) => item.id),
  ...LEVEL_THREE_RESET_PERCH_PLACEHOLDERS.map((item) => item.id),
  "level3LoveLetterCliff"
];

export const LEVEL_THREE = {
  width: LEVEL_THREE_WIDTH,
  height: LEVEL_THREE_HEIGHT,
  bounds: LEVEL_THREE_BOUNDS,
  mapShape: LEVEL_THREE_MAP_SHAPE,
  waterTiles: LEVEL_THREE_WATER_TILES,
  landTiles: LEVEL_THREE_LAND_TILES,
  pathTiles: LEVEL_THREE_PATH_TILES,
  islands: LEVEL_THREE_ISLANDS,
  reservedZones: LEVEL_THREE_RESERVED_ZONES,
  placeholders: LEVEL_THREE_PLACEHOLDER_IDS
};

function point(x, y) {
  return sceneGridPoint(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, x, y, TILE);
}

function tile(x, y) {
  return { x, y };
}

function rectTiles(minX, maxX, minY, maxY) {
  const tiles = [];
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      tiles.push(tile(x, y));
    }
  }
  return tiles;
}

function uniqueTiles(tiles) {
  const seen = new Set();
  return tiles.filter((tileItem) => {
    const key = `${tileItem.x},${tileItem.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function allWaterTiles(landTiles) {
  const land = new Set(landTiles.map((tileItem) => `${tileItem.x},${tileItem.y}`));
  const water = [];
  for (let y = 0; y < LEVEL_THREE_HEIGHT; y += 1) {
    for (let x = 0; x < LEVEL_THREE_WIDTH; x += 1) {
      if (!land.has(`${x},${y}`)) water.push(tile(x, y));
    }
  }
  return water;
}

function centerOfTiles(tiles) {
  const sum = tiles.reduce((acc, tileItem) => {
    acc.x += tileItem.x;
    acc.y += tileItem.y;
    return acc;
  }, { x: 0, y: 0 });
  return point(sum.x / tiles.length, sum.y / tiles.length);
}

function midpoint(a, b) {
  return {
    x: Number(((a.x + b.x) * 0.5).toFixed(2)),
    z: Number(((a.z + b.z) * 0.5).toFixed(2))
  };
}

function distanceBetween(a, b) {
  return Number(Math.hypot(a.x - b.x, a.z - b.z).toFixed(2));
}
