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
export const LEVEL_TWO_TIER_STEP_Y = 2.9;
export const LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT = 0.72;
export const LEVEL_TWO_BUTTON_LEDGE_HEIGHT = 0.72;
export const LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT = 1.85;
export const LEVEL_TWO_LOVE_LETTER_CLEARANCE = 0.72;
export const LEVEL_TWO_ELEPHANT_TOTEM_RADIUS = 0.82;
export const LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE = 0.38;
export const LEVEL_TWO_ELEPHANT_ECHO_RADIUS = 1.35;
export const LEVEL_TWO_ELEPHANT_ECHO_TINT = 0xd1d5d1;
export const LEVEL_TWO_ELEPHANT_ECHO_OPACITY = 0.36;
export const LEVEL_TWO_ELEPHANT_ECHO_SPARKLE = 0xc7d1c9;
export const LEVEL_TWO_ELEPHANT_ECHO_SPEECH_COOLDOWN = 2.1;
export const LEVEL_TWO_ELEPHANT_RADIUS = 0.68;
export const LEVEL_TWO_ELEPHANT_SPEED = 2.25;
export const LEVEL_TWO_ELEPHANT_REVEAL_SECONDS = 0.7;
export const LEVEL_TWO_ELEPHANT_IDLE_BOB = 0.025;
export const LEVEL_TWO_RED_BUTTON_RADIUS = 0.92;
export const LEVEL_TWO_RED_BUTTON_INVALID_COOLDOWN = 1.5;
export const LEVEL_TWO_RED_PLATFORM_UP_SPEED = 0.16;
export const LEVEL_TWO_RED_PLATFORM_DOWN_SPEED = 0.2;
export const LEVEL_TWO_RED_PLATFORM_ENDPOINT_PAUSE_SECONDS = 1.25;
export const LEVEL_TWO_RED_PLATFORM_BOTTOM_PAUSE_SECONDS = 2.5;
export const LEVEL_TWO_RED_ELEVATOR_A_START_DELAY_SECONDS = 2.5;
export const LEVEL_TWO_RED_PLATFORM_VISUAL_HEIGHT = 1.18;
export const LEVEL_TWO_RED_PLATFORM_SURFACE_OFFSET = 0.16;
export const LEVEL_TWO_RED_PLATFORM_B_SURFACE_OFFSET = 0.42;
export const LEVEL_TWO_RED_BUTTON_SURFACE_CLEARANCE = 0.08;
export const LEVEL_TWO_RED_PLATFORM_VISUAL_FOOTPRINT = TILE * 2.35;
export const LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X = LEVEL_TWO_RED_PLATFORM_VISUAL_FOOTPRINT * 0.5 - 0.12;
export const LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z = LEVEL_TWO_RED_PLATFORM_VISUAL_FOOTPRINT * 0.5 - 0.12;

export const LEVEL_TWO_TIER_BOTTOM_Y = {
  1: LEVEL_TWO_TIER_BASE_Y,
  2: LEVEL_TWO_TIER_BASE_Y + SURFACE_Y - 0.04,
  3: LEVEL_TWO_TIER_BASE_Y + SURFACE_Y * 2 + 1.14,
  4: LEVEL_TWO_TIER_BASE_Y + SURFACE_Y * 3 + 2.44
};

function tierBottomY(tier) {
  return LEVEL_TWO_TIER_BOTTOM_Y[tier] ?? LEVEL_TWO_TIER_BASE_Y + (tier - 1) * LEVEL_TWO_TIER_STEP_Y;
}

export const LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TIER = 3;
export const LEVEL_TWO_ELEPHANT_ECHO_TOP_Y = tierBottomY(LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TIER) + SURFACE_Y;
export const LEVEL_TWO_ELEPHANT_ECHO_HEIGHT = LEVEL_TWO_ELEPHANT_ECHO_TOP_Y - SURFACE_Y;
export const LEVEL_TWO_RED_PLATFORM_MAX_LIFT = LEVEL_TWO_ELEPHANT_ECHO_HEIGHT - LEVEL_TWO_RED_PLATFORM_SURFACE_OFFSET;
export const LEVEL_TWO_RED_PLATFORM_B_MAX_LIFT = LEVEL_TWO_MOUNTAIN_LAYER_COUNT >= 4
  ? tierBottomY(4) - LEVEL_TWO_RED_PLATFORM_B_SURFACE_OFFSET
  : LEVEL_TWO_RED_PLATFORM_MAX_LIFT;
export const LEVEL_TWO_RED_PLATFORM_BASE_Y = SURFACE_Y - LEVEL_TWO_RED_PLATFORM_VISUAL_HEIGHT + LEVEL_TWO_RED_PLATFORM_SURFACE_OFFSET;
export const LEVEL_TWO_RED_PLATFORM_B_BASE_Y = SURFACE_Y - LEVEL_TWO_RED_PLATFORM_VISUAL_HEIGHT + LEVEL_TWO_RED_PLATFORM_B_SURFACE_OFFSET;
export const LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID = "level-two-love-letter-route";

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
  blueButton: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 17.125, 16.125, TILE),
  elephantTotem: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 17.0, 3.0, TILE),
  elephantEcho: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 16.375, 8.75, TILE),
  blueRamp: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 14.1, 3.05, TILE),
  redElevatorA: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 15.625, 9.5, TILE),
  redButtonA: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 16.375, 8.75, TILE),
  redElevatorB: { x: -0.75, z: 12.25 },
  redButtonB: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 8.0, 11.0, TILE)
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

export const LEVEL_TWO_RED_ELEVATOR_A_GROUND_CLEARANCE_TILES = [
  { x: 14, y: 10, tier: 0, zone: "red_elevator_a_ground_clearance", asset: "pathTile" },
  { x: 15, y: 10, tier: 0, zone: "red_elevator_a_ground_clearance", asset: "pathTile" },
  { x: 16, y: 10, tier: 0, zone: "red_elevator_a_ground_clearance", asset: "pathTile" },
  { x: 15, y: 11, tier: 0, zone: "red_elevator_a_ground_clearance", asset: "pathTile" }
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

export const LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES = LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS
  .filter((tier) => tier.tier >= 3)
  .flatMap((tier) =>
    tier.tiles.map((tile) => ({
      ...tile,
      asset: "groundTile",
      bottomY: tier.bottomY - SURFACE_Y + 0.04,
      topY: tier.bottomY + 0.04,
      tierId: `${tier.id}-support`,
      supportForTierId: tier.id,
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

export const LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES = rectTiles(12, 14, 9, 10, 3, "red_elevator_a_top_connector", "pathTile")
  .map((tile) => ({
    ...tile,
    asset: "pathTile",
    bottomY: tierBottomY(LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TIER),
    topY: LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
    tierId: "tier-3-elephant-route",
    stationId: "red-elevator-a-top-connector",
    role: "walkable top connection from Red Elevator A to the tier-3 Elephant route",
    frogJumpable: false
  }));

export const LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE = {
  id: "red-elevator-a-top-exit-zone",
  minX: LEVEL_TWO_POINTS.redElevatorA.x - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X - 1.1,
  maxX: LEVEL_TWO_POINTS.redElevatorA.x - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X + 1.35,
  minZ: LEVEL_TWO_POINTS.redElevatorA.z - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
  maxZ: LEVEL_TWO_POINTS.redElevatorA.z + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
  surfaceId: "tier-3-elephant-route",
  visual: "logical transition only; no extra dock mesh"
};

export const LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES = [];

export const LEVEL_TWO_RED_ELEVATOR_B_SHAFT_TILES = [];

export const LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES = rectTiles(9, 9, 11, 14, 4, "human_love_letter_route", "pathTile")
  .map((tile) => ({
  ...tile,
  asset: "pathTile",
  bottomY: tierBottomY(4),
  topY: tierBottomY(4) + SURFACE_Y,
  tierId: LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID,
  stationId: "human-elevator-b-upper-stop",
  role: "human upper route from Red Elevator B to the Love Letter plateau",
  frogJumpable: false
}));

export const LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE = {
  id: "red-elevator-a-side-approach-zone",
  minX: LEVEL_TWO_POINTS.redElevatorA.x + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X + 0.08,
  maxX: LEVEL_TWO_POINTS.redElevatorA.x + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X + 1.9,
  minZ: LEVEL_TWO_POINTS.redElevatorA.z - 1.35,
  maxZ: LEVEL_TWO_POINTS.redElevatorA.z + 1.35,
  purpose: "human side possession lane beside Red Elevator A"
};

export const LEVEL_TWO_ELEPHANT_ROUTE_TILES = [
  ...LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES,
  ...LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS
    .find((tier) => tier.id === "tier-3-elephant-traverse-terrace")
    .tiles.map((tile) => ({
      ...tile,
      asset: "groundTile",
      bottomY: tierBottomY(3),
      topY: tierBottomY(3) + SURFACE_Y,
      tierId: "tier-3-elephant-route",
      frogJumpable: false
    }))
];

export const LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TILES = LEVEL_TWO_ELEPHANT_ROUTE_TILES;

const LEVEL_TWO_BLUE_RAMP_MIN_X = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 3.05, TILE).x;
const LEVEL_TWO_BLUE_RAMP_MAX_X = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 16.45, 3.05, TILE).x;
const LEVEL_TWO_BLUE_RAMP_MIN_Z = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 2.35, TILE).z;
const LEVEL_TWO_BLUE_RAMP_MAX_Z = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.25, 3.75, TILE).z;

export const LEVEL_TWO_BLUE_RAMP = {
  id: "blue-ramp-to-elephant-totem",
  asset: "blueRamp",
  position: LEVEL_TWO_POINTS.blueRamp,
  rotationY: -Math.PI / 2,
  visualScale: { x: 0.36, y: 0.48, z: 0.92 },
  lowEnd: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 12.35, 3.05, TILE),
  highEnd: sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, 15.95, 3.05, TILE),
  minX: LEVEL_TWO_BLUE_RAMP_MIN_X,
  maxX: LEVEL_TWO_BLUE_RAMP_MAX_X,
  minZ: LEVEL_TWO_BLUE_RAMP_MIN_Z,
  maxZ: LEVEL_TWO_BLUE_RAMP_MAX_Z,
  targetLift: LEVEL_TWO_ELEPHANT_TOTEM_HILL_HEIGHT,
  actorLiftClearance: 0.38,
  groundExitProgress: 0.18,
  revealSeconds: 0.72,
  revealStartYOffset: -0.34,
  dormantPanel: {
    id: "blue-ramp-dormant-panel",
    label: "Blue Ramp dormant ground panel",
    position: {
      x: (LEVEL_TWO_BLUE_RAMP_MIN_X + LEVEL_TWO_BLUE_RAMP_MAX_X) * 0.5,
      z: (LEVEL_TWO_BLUE_RAMP_MIN_Z + LEVEL_TWO_BLUE_RAMP_MAX_Z) * 0.5
    },
    y: SURFACE_Y + 0.035,
    width: LEVEL_TWO_BLUE_RAMP_MAX_X - LEVEL_TWO_BLUE_RAMP_MIN_X,
    depth: LEVEL_TWO_BLUE_RAMP_MAX_Z - LEVEL_TWO_BLUE_RAMP_MIN_Z,
    height: 0.08,
    color: 0x4da8ff,
    opacity: 0.7,
    visualOnly: true,
    walkableBy: []
  }
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

export const LEVEL_TWO_RESERVED_TERRACE_GROUPS = [];

export const LEVEL_TWO_RESERVED_TERRACE_TILES = [];

export const LEVEL_TWO_MOUNTAIN_PEAK_Y = LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS[LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.length - 1].topY;
export const LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y = LEVEL_TWO_MOUNTAIN_PEAK_Y + LEVEL_TWO_LOVE_LETTER_CLEARANCE;
export const LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT = LEVEL_TWO_MOUNTAIN_PEAK_Y - SURFACE_Y;

export const LEVEL_TWO_PROPS = [
  ["forestTreeA", 0.8, 1.1, 0.88],
  ["forestTreeB", 18.6, 0.125, 0.82],
  ["forestTreeA", 18.4, 17.8, 0.82],
  ["forestTreeB", 1.0, 18.2, 0.78],
  ["forestBush", 1.1, 7.4, 0.72],
  ["forestBush", 17.8, 6.3, 0.66],
  ["forestBush", 4.0, 17.0, 0.62],
  ["forestRock", 3.1, 3.0, 0.58],
  ["forestRock", 15.875, 15.0, 0.58],
  ["forestRock", 11.2, 1.0, 0.5],
  ["forestGrass", 3.0, 13.4, 0.5],
  ["forestGrass", 6.8, 17.1, 0.48],
  ["forestGrass", 16.4, 12.9, 0.5],
  ["forestGrass", 2.4, 5.6, 0.45]
];

export const LEVEL_TWO_RED_BUTTONS = [
  {
    id: "red-button-a",
    asset: "buttonBaseRed",
    topAsset: "buttonTopRed",
    position: LEVEL_TWO_POINTS.redButtonA,
    surfaceId: "red-elevator-a",
    platformId: "red-elevator-a",
    surfaceTopY: SURFACE_Y + LEVEL_TWO_RED_PLATFORM_MAX_LIFT,
    radius: LEVEL_TWO_RED_BUTTON_RADIUS,
    surfaceClearance: LEVEL_TWO_RED_BUTTON_SURFACE_CLEARANCE,
    requiredActor: "elephant",
    activationType: "held-weight",
    linkedPlatformId: "red-elevator-a",
    visibleFromStart: true
  },
  {
    id: "red-button-b",
    asset: "buttonBaseRed",
    topAsset: "buttonTopRed",
    position: LEVEL_TWO_POINTS.redButtonB,
    surfaceId: "tier-3-elephant-route",
    platformId: null,
    surfaceTopY: LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
    radius: LEVEL_TWO_RED_BUTTON_RADIUS,
    surfaceClearance: LEVEL_TWO_RED_BUTTON_SURFACE_CLEARANCE,
    requiredActor: "elephant",
    activationType: "held-weight",
    linkedPlatformId: "red-elevator-b",
    visibleFromStart: true
  }
];

export const LEVEL_TWO_RED_PLATFORMS = [
  {
    id: "red-elevator-a",
    asset: "redPlatform4x4",
    position: LEVEL_TWO_POINTS.redElevatorA,
    baseY: LEVEL_TWO_RED_PLATFORM_BASE_Y,
    minX: LEVEL_TWO_POINTS.redElevatorA.x - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X,
    maxX: LEVEL_TWO_POINTS.redElevatorA.x + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X,
    minZ: LEVEL_TWO_POINTS.redElevatorA.z - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
    maxZ: LEVEL_TWO_POINTS.redElevatorA.z + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
    maxLift: LEVEL_TWO_RED_PLATFORM_MAX_LIFT,
    surfaceOffset: LEVEL_TWO_RED_PLATFORM_SURFACE_OFFSET,
    visualHalfFootprint: LEVEL_TWO_RED_PLATFORM_VISUAL_FOOTPRINT * 0.5,
    upSpeed: LEVEL_TWO_RED_PLATFORM_UP_SPEED,
    downSpeed: LEVEL_TWO_RED_PLATFORM_DOWN_SPEED,
    endpointPauseSeconds: LEVEL_TWO_RED_PLATFORM_ENDPOINT_PAUSE_SECONDS,
    topPauseSeconds: LEVEL_TWO_RED_PLATFORM_ENDPOINT_PAUSE_SECONDS,
    bottomPauseSeconds: LEVEL_TWO_RED_PLATFORM_BOTTOM_PAUSE_SECONDS,
    initialProgress: 1,
    inactiveProgress: 1,
    activeProgress: 0,
    initialDirection: "down",
    releaseBehavior: "return-to-bottom",
    movementRule: "cycle-while-held",
    walkableBy: ["human", "elephant"],
    linkedButtonId: "red-button-a",
    visibleFromStart: true
  },
  {
    id: "red-elevator-b",
    asset: "redPlatform4x4",
    position: LEVEL_TWO_POINTS.redElevatorB,
    baseY: 1,
    minX: LEVEL_TWO_POINTS.redElevatorB.x - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X,
    maxX: LEVEL_TWO_POINTS.redElevatorB.x + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_X,
    minZ: LEVEL_TWO_POINTS.redElevatorB.z - LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
    maxZ: LEVEL_TWO_POINTS.redElevatorB.z + LEVEL_TWO_RED_PLATFORM_WALKABLE_HALF_Z,
    maxLift: LEVEL_TWO_RED_PLATFORM_B_MAX_LIFT,
    surfaceOffset: LEVEL_TWO_RED_PLATFORM_B_SURFACE_OFFSET,
    visualHalfFootprint: LEVEL_TWO_RED_PLATFORM_VISUAL_FOOTPRINT * 0.5,
    upSpeed: LEVEL_TWO_RED_PLATFORM_UP_SPEED,
    downSpeed: LEVEL_TWO_RED_PLATFORM_DOWN_SPEED,
    endpointPauseSeconds: LEVEL_TWO_RED_PLATFORM_ENDPOINT_PAUSE_SECONDS,
    topPauseSeconds: LEVEL_TWO_RED_PLATFORM_ENDPOINT_PAUSE_SECONDS,
    bottomPauseSeconds: LEVEL_TWO_RED_PLATFORM_BOTTOM_PAUSE_SECONDS,
    initialProgress: 0,
    inactiveProgress: 0,
    activeProgress: 1,
    initialDirection: "up",
    releaseBehavior: "finish-current-direction",
    movementRule: "cycle-while-held",
    walkableBy: ["human"],
    linkedButtonId: "red-button-b",
    visibleFromStart: true
  }
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
  elephantEcho: LEVEL_TWO_POINTS.elephantEcho,
  mapShape: "square",
  mountain: {
    layerCount: LEVEL_TWO_MOUNTAIN_LAYER_COUNT,
    peakY: LEVEL_TWO_MOUNTAIN_PEAK_Y
  },
  centralMountainSupportTiles: LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES,
  frogJumpableLedges: LEVEL_TWO_FROG_JUMPABLE_LEDGES,
  elephantTotemHill: LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  elephantEchoTerraceTiles: LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TILES,
  blueRamp: LEVEL_TWO_BLUE_RAMP,
  redButtons: LEVEL_TWO_RED_BUTTONS,
  redPlatforms: LEVEL_TWO_RED_PLATFORMS
};
