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
export const LEVEL_THREE_MAP_SHAPE = "mostly-water-lake-islands-phase-1-shell";
export const LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y = SURFACE_Y + 2.15;
export const LEVEL_THREE_CLIFF_TOP_Y = SURFACE_Y + 1.42;

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

export const LEVEL_THREE_ISLANDS = [
  {
    id: "level3StartIsland",
    name: "Start Island",
    purpose: "Human spawn, Frog start, Crocodile Echo tease, and future Crocodile Totem dock.",
    role: "start",
    tiles: uniqueTiles([
      ...rectTiles(1, 5, 8, 13),
      ...rectTiles(2, 4, 7, 7),
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
      tile(5, 7),
      tile(6, 7)
    ])
  },
  {
    id: "level3TotemWinchIsland",
    name: "Totem Winch Island",
    purpose: "Future Frog-reachable island with the opening green button for the Crocodile Totem raft.",
    role: "opening-green-button",
    tiles: uniqueTiles([
      ...rectTiles(6, 8, 3, 5),
      tile(7, 6)
    ])
  },
  {
    id: "level3CenterHub",
    name: "Center Hub Island",
    purpose: "Main staging island for the future rotating bridge puzzle.",
    role: "center-hub",
    tiles: uniqueTiles([
      ...rectTiles(11, 15, 8, 12),
      tile(10, 10),
      tile(16, 10),
      tile(13, 7),
      tile(13, 13)
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
      ...rectTiles(11, 14, 2, 4),
      tile(13, 5)
    ])
  },
  {
    id: "level3RedButtonAIsland",
    name: "Red Button A Island",
    purpose: "Future Elephant-held Red Button A island and rotating bridge destination.",
    role: "bridge-destination",
    bridgeState: 2,
    tiles: uniqueTiles([
      ...rectTiles(18, 21, 10, 12),
      tile(17, 11)
    ])
  },
  {
    id: "level3PlatformDockIsland",
    name: "Platform Dock Island",
    purpose: "Future rotating bridge destination leading toward the final platform route.",
    role: "bridge-destination",
    bridgeState: 3,
    tiles: uniqueTiles([
      ...rectTiles(12, 15, 16, 18),
      tile(13, 15)
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
export const LEVEL_THREE_PATH_TILES = uniqueTiles([
  ...rectTiles(2, 5, 10, 10),
  tile(3, 11),
  tile(5, 7),
  tile(6, 7),
  tile(7, 4),
  ...rectTiles(12, 14, 10, 10),
  tile(13, 8),
  tile(13, 12),
  tile(19, 6),
  tile(12, 3),
  tile(19, 11),
  tile(14, 17),
  tile(5, 17),
  tile(22, 17),
  tile(23, 3)
]);
export const LEVEL_THREE_WATER_TILES = allWaterTiles(LEVEL_THREE_LAND_TILES);

export const LEVEL_THREE_LILY_PAD_PLACEHOLDERS = [
  {
    id: "level3MovingLilyPad1",
    name: "Moving Lily Pad 1",
    position: point(6.75, 6.55),
    trackStart: point(6.35, 6.55),
    trackEnd: point(7.15, 6.55),
    radius: 0.48
  },
  {
    id: "level3MovingLilyPad2",
    name: "Moving Lily Pad 2",
    position: point(7.0, 5.9),
    trackStart: point(6.45, 5.9),
    trackEnd: point(7.55, 5.9),
    radius: 0.46
  },
  {
    id: "level3MovingLilyPad3",
    name: "Moving Lily Pad 3",
    position: point(7.25, 5.25),
    trackStart: point(6.75, 5.25),
    trackEnd: point(7.75, 5.25),
    radius: 0.44
  }
];

export const LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS = [
  {
    id: "level3TotemGreenButton",
    name: "Opening Totem Green Button",
    purpose: "Future repeatable button that winches the Crocodile Totem raft toward Start Island.",
    position: point(7.35, 4.2),
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
    position: point(3.6, 5.15)
  },
  {
    id: "level3TotemRaftMarker2",
    name: "Totem Raft Near Marker",
    stateIndex: 2,
    position: point(4.8, 7.0)
  },
  {
    id: "level3TotemDockMarker",
    name: "Start Island Totem Dock Marker",
    stateIndex: 3,
    position: point(6.2, 10.55)
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
    position: point(6.2, 10.2),
    islandId: "level3StartIsland"
  },
  {
    id: "level3BridgeDestinationElephant",
    name: "Bridge Destination Elephant Island",
    stateIndex: 1,
    position: point(13.0, 5.0),
    islandId: "level3ElephantIsland"
  },
  {
    id: "level3BridgeDestinationRedA",
    name: "Bridge Destination Red Button A Island",
    stateIndex: 2,
    position: point(17.2, 11.0),
    islandId: "level3RedButtonAIsland"
  },
  {
    id: "level3BridgeDestinationPlatformDock",
    name: "Bridge Destination Platform Dock Island",
    stateIndex: 3,
    position: point(13.0, 15.2),
    islandId: "level3PlatformDockIsland"
  }
];

export const LEVEL_THREE_RED_BUTTON_PLACEHOLDERS = [
  {
    id: "level3RedButtonA",
    name: "Red Button A Placeholder",
    islandId: "level3RedButtonAIsland",
    position: point(19.5, 11.2),
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
    position: point(8.05, 5.45)
  }
];

export const LEVEL_THREE_PROPS = [
  ["forestTreeA", 1.2, 8.15, 0.7],
  ["forestBush", 4.65, 13.15, 0.7],
  ["forestRock", 5.85, 7.4, 0.56],
  ["forestGrass", 6.4, 3.5, 0.55],
  ["forestRock", 14.8, 8.2, 0.62],
  ["forestGrass", 11.5, 12.15, 0.52],
  ["forestTreeB", 11.2, 2.35, 0.68],
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
