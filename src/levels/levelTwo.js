import {
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { boundsForGrid, sceneGridPoint } from "../core/grid.js";

export const LEVEL_TWO_WIDTH = 20;
export const LEVEL_TWO_HEIGHT = 20;
export const LEVEL_TWO_BOUNDS = boundsForGrid(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, TILE);
export const LEVEL_TWO_TITLE_SECONDS = 1.65;
export const LEVEL_TWO_CINEMATIC_SPEED = 2.0;
export const LEVEL_TWO_MOUNTAIN_LAYER_COUNT = 4;
export const LEVEL_TWO_TIER_BASE_Y = SURFACE_Y - 0.04;
export const LEVEL_TWO_TIER_STEP_Y = 2.58;
export const LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT = 0.72;
export const LEVEL_TWO_BUTTON_LEDGE_HEIGHT = 0.72;
export const LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT = 1.85;
export const LEVEL_TWO_LOVE_LETTER_CLEARANCE = 0.72;
export const LEVEL_TWO_ELEPHANT_TOTEM_RADIUS = 0.82;

function tierBottomY(tier) {
  return LEVEL_TWO_TIER_BASE_Y + (tier - 1) * LEVEL_TWO_TIER_STEP_Y;
}

function rectTiles(minX, maxX, minY, maxY, tier, zone, asset = "groundTile") {
  const tiles = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      tiles.push({ x, y, tier, zone, asset });
    }
  }
  return tiles;
}

export const LEVEL_TWO_POINTS = {
  entry: {
    x: LEVEL_TWO_BOUNDS.minX - 1.1,
    z: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 1.7, 12.25, TILE).z,
    facing: { x: 1, z: 0, name: "east" }
  },
  humanStart: {
    ...sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 1.7, 12.25, TILE),
    facing: { x: 1, z: 0, name: "east" }
  },
  frogStart: {
    ...sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 3.0, 3.4, TILE),
    facing: { x: 1, z: 0, name: "east" }
  },
  placeholderLoveLetter: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 9.5, 9.5, TILE),
  blueButton: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 16.85, 16.0, TILE),
  elephantTotem: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 17.0, 3.0, TILE),
  blueRamp: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 14.1, 3.05, TILE)
};

export const LEVEL_TWO_PATH_TILES = [
  ...rectTiles(0, 5, 12, 12, 0, "trail", "pathTile"),
  ...rectTiles(2, 2, 4, 12, 0, "trail", "pathTile"),
  ...rectTiles(2, 5, 4, 4, 0, "frog-start-trail", "pathTile"),
  ...rectTiles(5, 5, 10, 14, 0, "trail", "pathTile"),
  ...rectTiles(5, 14, 14, 14, 0, "trail", "pathTile"),
  ...rectTiles(14, 14, 10, 14, 0, "trail", "pathTile"),
  ...rectTiles(14, 14, 3, 10, 0, "totem-hill-trail", "pathTile"),
  ...rectTiles(12, 18, 3, 3, 0, "totem-ramp-approach", "pathTile"),
  ...rectTiles(14, 18, 10, 10, 0, "trail", "pathTile"),
  ...rectTiles(3, 5, 10, 10, 0, "frog-side-trail", "pathTile"),
  ...rectTiles(14, 17, 12, 12, 0, "elephant-terrace-trail", "pathTile"),
  ...rectTiles(14, 17, 18, 18, 0, "button-ledge-trail", "pathTile")
];

export const LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS = [
  {
    id: "tier-1-low-ledge",
    name: "Tier 1 low ledge",
    tier: 1,
    bottomY: tierBottomY(1),
    topY: tierBottomY(1) + SURFACE_Y,
    frogJumpable: false,
    tiles: rectTiles(6, 13, 6, 13, 1, "central_mountain")
  },
  {
    id: "tier-2-elephant-unlock-terrace",
    name: "Tier 2 Elephant unlock terrace",
    tier: 2,
    bottomY: tierBottomY(2),
    topY: tierBottomY(2) + SURFACE_Y,
    frogJumpable: false,
    tiles: rectTiles(7, 12, 7, 12, 2, "central_mountain")
  },
  {
    id: "tier-3-elephant-traverse-terrace",
    name: "Tier 3 Elephant traversal terrace",
    tier: 3,
    bottomY: tierBottomY(3),
    topY: tierBottomY(3) + SURFACE_Y,
    frogJumpable: false,
    tiles: rectTiles(8, 11, 8, 11, 3, "central_mountain")
  },
  {
    id: "tier-4-love-letter-plateau",
    name: "Tier 4 Love Letter plateau",
    tier: 4,
    bottomY: tierBottomY(4),
    topY: tierBottomY(4) + SURFACE_Y,
    frogJumpable: false,
    tiles: rectTiles(9, 10, 9, 10, 4, "central_mountain")
  }
];

export const LEVEL_TWO_CENTRAL_MOUNTAIN_TILES = LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.flatMap((tier) =>
  tier.tiles.map((tile) => ({
    ...tile,
    asset: "groundTile",
    bottomY: tier.bottomY,
    topY: tier.topY,
    tierId: tier.id,
    frogJumpable: false
  }))
);

export const LEVEL_TWO_FROG_SIDE_LEDGE_TILES = rectTiles(3, 5, 7, 9, 1, "frog_side_ledge")
  .map((tile) => ({
    ...tile,
    asset: "groundTile",
    bottomY: LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT,
    topY: LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT + SURFACE_Y,
    tierId: "practice-ledge",
    ledgeId: "practice-ledge",
    frogJumpable: true
  }));

export const LEVEL_TWO_BUTTON_LEDGE_TILES = rectTiles(15, 17, 15, 17, 1, "button_ledge")
  .map((tile) => ({
    ...tile,
    asset: "groundTile",
    bottomY: LEVEL_TWO_BUTTON_LEDGE_HEIGHT,
    topY: LEVEL_TWO_BUTTON_LEDGE_HEIGHT + SURFACE_Y,
    tierId: "blue-button-ledge",
    ledgeId: "blue-button-ledge",
    frogJumpable: true
  }));

export const LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES = rectTiles(16, 18, 2, 4, 1, "elephant_totem_hill")
  .map((tile) => ({
    ...tile,
    asset: "pathTile",
    bottomY: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT,
    topY: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT + SURFACE_Y,
    tierId: "elephant-totem-hill",
    frogJumpable: false
  }));

export const LEVEL_TWO_FROG_JUMPABLE_LEDGES = [
  {
    id: "practice-ledge",
    label: "Practice low ledge",
    frogJumpable: true,
    tiles: LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
    heightAboveGround: LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT,
    landingPoint: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 4.0, 8.0, TILE),
    approachZone: {
      ...sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 4.0, 10.1, TILE),
      radius: 3.15
    }
  },
  {
    id: "blue-button-ledge",
    label: "Blue button low ledge",
    frogJumpable: true,
    tiles: LEVEL_TWO_BUTTON_LEDGE_TILES,
    heightAboveGround: LEVEL_TWO_BUTTON_LEDGE_HEIGHT,
    landingPoint: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 15.25, 16.0, TILE),
    approachZone: {
      ...sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 14.15, 16.0, TILE),
      radius: 3.35
    }
  }
];

export const LEVEL_TWO_NON_JUMPABLE_HEIGHT_TARGETS = [
  {
    id: "central-mountain",
    label: "Central mountain",
    tiles: LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
    frogJumpable: false,
    approachRadius: 2.2
  },
  {
    id: "elephant-totem-hill",
    label: "Elephant Totem hill",
    tiles: LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
    frogJumpable: false,
    approachRadius: 2.6
  }
];

export const LEVEL_TWO_BLUE_RAMP = {
  id: "blue-ramp-to-elephant-totem",
  asset: "blueRamp",
  position: LEVEL_TWO_POINTS.blueRamp,
  rotationY: -Math.PI / 2,
  visualScale: { x: 0.36, y: 0.48, z: 0.92 },
  lowEnd: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.35, 3.05, TILE),
  highEnd: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 15.95, 3.05, TILE),
  minX: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 3.05, TILE).x,
  maxX: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 16.45, 3.05, TILE).x,
  minZ: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 2.35, TILE).z,
  maxZ: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 3.75, TILE).z,
  targetLift: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT,
  actorLiftClearance: 0.38,
  groundExitProgress: 0.18
};

export const LEVEL_TWO_ELEPHANT_TOTEM_HILL = {
  id: "elephant-totem-hill",
  heightAboveGround: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT,
  topY: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT + SURFACE_Y,
  tiles: LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
  position: LEVEL_TWO_POINTS.elephantTotem,
  radius: LEVEL_TWO_ELEPHANT_TOTEM_RADIUS,
  frogJumpable: false
};

export const LEVEL_TWO_RESERVED_TERRACE_GROUPS = [
  {
    id: "lower-elephant-elevator-bay",
    role: "future partial Elephant elevator drop-off",
    tier: 1,
    tiles: rectTiles(8, 11, 14, 15, 1, "reserved_elevator_terrace", "pathTile")
  },
  {
    id: "elephant-echo-start-terrace",
    role: "future Elephant Echo and start area",
    tier: 1,
    tiles: rectTiles(14, 16, 9, 11, 1, "reserved_elephant_terrace", "pathTile")
  },
  {
    id: "middle-elephant-platform-station",
    role: "future Elephant platform station",
    tier: 2,
    tiles: rectTiles(5, 6, 7, 8, 2, "reserved_elevator_terrace", "pathTile")
  },
  {
    id: "upper-red-button-station",
    role: "future red-button platform station",
    tier: 3,
    tiles: rectTiles(8, 11, 6, 6, 3, "reserved_elevator_terrace", "pathTile")
  }
];

export const LEVEL_TWO_RESERVED_TERRACE_TILES = LEVEL_TWO_RESERVED_TERRACE_GROUPS.flatMap((group) =>
  group.tiles.map((tile) => ({
    ...tile,
    bottomY: tierBottomY(tile.tier),
    topY: tierBottomY(tile.tier) + SURFACE_Y,
    stationId: group.id,
    role: group.role
  }))
);

export const LEVEL_TWO_MOUNTAIN_PEAK_Y = LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS[LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.length - 1].topY;
export const LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y = LEVEL_TWO_MOUNTAIN_PEAK_Y + LEVEL_TWO_LOVE_LETTER_CLEARANCE;

export const LEVEL_TWO_PROPS = [
  ["forestTreeA", 0.8, 1.1, 0.88],
  ["forestTreeB", 18.6, 1.5, 0.82],
  ["forestTreeA", 18.4, 17.8, 0.82],
  ["forestTreeB", 1.0, 18.2, 0.78],
  ["forestBush", 1.1, 7.4, 0.72],
  ["forestBush", 17.8, 6.3, 0.66],
  ["forestBush", 4.0, 17.0, 0.62],
  ["forestRock", 3.1, 3.0, 0.58],
  ["forestRock", 16.7, 15.4, 0.58],
  ["forestRock", 11.2, 1.0, 0.5],
  ["forestGrass", 3.0, 13.4, 0.5],
  ["forestGrass", 6.8, 17.1, 0.48],
  ["forestGrass", 16.4, 12.9, 0.5],
  ["forestGrass", 2.4, 5.6, 0.45]
];

export const LEVEL_TWO = {
  width: LEVEL_TWO_WIDTH,
  height: LEVEL_TWO_HEIGHT,
  bounds: LEVEL_TWO_BOUNDS,
  start: LEVEL_TWO_POINTS.humanStart,
  frogStart: LEVEL_TWO_POINTS.frogStart,
  placeholderLoveLetter: LEVEL_TWO_POINTS.placeholderLoveLetter,
  blueButton: LEVEL_TWO_POINTS.blueButton,
  elephantTotem: LEVEL_TWO_POINTS.elephantTotem,
  mapShape: "square",
  mountain: {
    layerCount: LEVEL_TWO_MOUNTAIN_LAYER_COUNT,
    peakY: LEVEL_TWO_MOUNTAIN_PEAK_Y
  },
  frogJumpableLedges: LEVEL_TWO_FROG_JUMPABLE_LEDGES,
  elephantTotemHill: LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  blueRamp: LEVEL_TWO_BLUE_RAMP
};
