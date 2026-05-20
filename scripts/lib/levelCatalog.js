import { ASSETS } from "../../src/config/assets.js";
import {
  SURFACE_Y,
  WORLD_BOUNDS
} from "../../src/config/constants.js";
import { SCENES } from "../../src/config/scenes.js";
import {
  HOME_BOUNDS,
  HOME_HEIGHT,
  HOME_POINTS,
  HOME_PROPS,
  HOME_WIDTH
} from "../../src/levels/homeIntroLevel.js";
import {
  LEVEL_ONE_BOUNDS,
  LEVEL_ONE_PARTIAL_BRIDGE,
  LEVEL_ONE_BUTTON,
  LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
  LEVEL_ONE_PROPS,
  LEVEL_ONE_WIDTH,
  LEVEL_ONE_HEIGHT
} from "../../src/levels/levelOne.js";
import {
  LEVEL_TWO_BOUNDS,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES,
  LEVEL_TWO_LOVE_LETTER_CLEARANCE,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_PROPS,
  LEVEL_TWO_RED_BUTTONS,
  LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES,
  LEVEL_TWO_RED_ELEVATOR_B_SHAFT_TILES,
  LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES,
  LEVEL_TWO_RED_PLATFORMS,
  LEVEL_TWO_RESERVED_TERRACE_GROUPS,
  LEVEL_TWO_RESERVED_TERRACE_TILES,
  LEVEL_TWO_WIDTH,
  LEVEL_TWO_HEIGHT
} from "../../src/levels/levelTwo.js";
import {
  FROG_TOTEM,
  SPELLBOOK,
  START,
  TUTORIAL_BUTTON
} from "../../src/levels/tutorialLevel.js";

const TOOLING_VERSION = "lumina3d-tools-v1.0.0";
const UNKNOWN_ASSET_PATH = "/assets/unknown";

const FALLBACK_ASSET = {
  key: "unknown",
  path: UNKNOWN_ASSET_PATH
};

const LEVEL_ALIAS_MAP = {
  tutorial: SCENES.TUTORIAL,
  home_intro: SCENES.HOME,
  home: SCENES.HOME,
  homeintro: SCENES.HOME,
  level_one: SCENES.LEVEL_ONE,
  levelone: SCENES.LEVEL_ONE,
  "level-one": SCENES.LEVEL_ONE,
  level_two: SCENES.LEVEL_TWO,
  leveltwo: SCENES.LEVEL_TWO,
  "level-two": SCENES.LEVEL_TWO,
  full_flow: SCENES.TUTORIAL,
  fullflow: SCENES.TUTORIAL,
  "full-flow": SCENES.TUTORIAL
};

const DEBUG_KEY_BY_SCENE = {
  [SCENES.TUTORIAL]: "Digit1",
  [SCENES.HOME]: "Digit2",
  [SCENES.LEVEL_ONE]: "Digit3",
  [SCENES.LEVEL_TWO]: "Digit4"
};

function resolveAssetPath(key) {
  const asset = ASSETS[key];
  if (!asset) return UNKNOWN_ASSET_PATH;
  if (asset.url) return asset.url;
  return `${asset.base}${asset.stem}.${asset.type === "gltf" ? "gltf" : "obj"}`;
}

function makeAsset(key) {
  return {
    key,
    path: resolveAssetPath(key),
    scale: 1
  };
}

function toTwoDecimals(value) {
  return Number(Number(value).toFixed(2));
}

function makeObject(input) {
  const result = {
    id: input.id,
    name: input.name,
    type: input.type,
    category: input.category,
    asset: input.asset || FALLBACK_ASSET,
    position: input.position,
    rotationY: input.rotationY === undefined ? 0 : Number(input.rotationY.toFixed(3)),
    collisionExpected: Boolean(input.collisionExpected),
    colliderLabel: input.colliderLabel || null,
    colliderMatch: input.colliderMatch || "exact",
    expectedColliderCount: Number(input.expectedColliderCount || (input.collisionExpected ? 1 : 0)),
    mechanismLink: input.mechanismLink || null,
    elevationBand: input.elevationBand || {
      min: toTwoDecimals(SURFACE_Y - 0.25),
      max: toTwoDecimals(SURFACE_Y + 0.35)
    },
    runtimeProbe: input.runtimeProbe || null
  };
  if (input.fingerprint) result.fingerprint = input.fingerprint;
  return result;
}

function makePropObject(levelPrefix, source, props, assumeSolid = true) {
  return props.map(([assetKey, x, z, scale], index) => {
    const position = {
      x: toTwoDecimals(x),
      y: toTwoDecimals(SURFACE_Y),
      z: toTwoDecimals(z)
    };
    const collisionExpected = assumeSolid && /Tree|Rock|Bush/.test(assetKey);
    return makeObject({
      id: `${levelPrefix}_${assetKey}_${index + 1}`,
      name: `${assetKey} ${index + 1}`,
      type: "prop",
      category: collisionExpected ? "physical-prop" : "decorative-prop",
      asset: {
        key: assetKey,
        path: makeAsset(assetKey).path,
        scale
      },
      position,
      rotationY: Number(((index * 0.62) % (Math.PI * 2)).toFixed(3)),
      collisionExpected,
      colliderLabel: collisionExpected ? `${source}-${assetKey}` : null,
      colliderMatch: "prefix",
      expectedColliderCount: collisionExpected ? 1 : 0,
      mechanismLink: null,
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.16),
        max: toTwoDecimals(SURFACE_Y + 0.45)
      },
      runtimeProbe: collisionExpected ? `props.${levelPrefix}.${assetKey}[${index}]` : null
    });
  });
}

function makeTerrainExpectation(id, name, prefix, count, sourceY = SURFACE_Y, note = "") {
  return makeObject({
    id,
    name,
    type: "terrain",
    category: "collision-band",
    asset: makeAsset("groundTile"),
    position: {
      x: 0,
      y: toTwoDecimals(sourceY),
      z: 0
    },
    rotationY: 0,
    collisionExpected: true,
    colliderLabel: `${prefix}`,
    colliderMatch: "prefix",
    expectedColliderCount: Number(count),
    mechanismLink: null,
    elevationBand: {
      min: toTwoDecimals(sourceY - 0.15),
      max: toTwoDecimals(sourceY + 1.05)
    },
    runtimeProbe: `terrain.${id}`,
    fingerprint: note || undefined
  });
}

function makeLandmarks(points) {
  return points.map((point) => ({
    id: point.id,
    name: point.name,
    position: {
      x: toTwoDecimals(point.x),
      y: toTwoDecimals(point.y || SURFACE_Y),
      z: toTwoDecimals(point.z)
    }
  }));
}

function fixtureImplemented(id, description) {
  return {
    id,
    status: "implemented",
    description,
    migrationHint: null
  };
}

function fixtureUnsupported(id, reason) {
  return {
    id,
    status: "unsupported",
    reason,
    migrationHint: "Add deterministic state seed steps in run-fixture wrapper so fixtures can be replayed consistently."
  };
}

const LEVEL_ONE_PROPS_OBJECTS = makePropObject("level_one", "level-one", LEVEL_ONE_PROPS);
const HOME_PROPS_OBJECTS = makePropObject("home_intro", "home", HOME_PROPS, false);
const LEVEL_TWO_PROPS_OBJECTS = makePropObject("level_two", "level-two", LEVEL_TWO_PROPS);

function makeLevelMetadata() {
  const levelTwoCentralTerrain = makeTerrainExpectation(
    "level_two_central_mountain",
    "Central mountain platform",
    "level-two-central-mountain-",
    LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.length
  );
  const levelTwoFrogLedge = makeTerrainExpectation(
    "level_two_frog_side_ledge",
    "Frog-side elevated ledge",
    "level-two-frog-side-ledge-",
    LEVEL_TWO_FROG_SIDE_LEDGE_TILES.length,
    LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT,
    "froglike crossing path before frog mechanics"
  );
  const levelTwoRedElevatorTopConnector = makeTerrainExpectation(
    "level_two_red_elevator_a_top_connector",
    "Red Elevator A top connector",
    "level-two-red-elevator-a-top-connector-",
    LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES.length,
    LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES[0]?.bottomY || SURFACE_Y,
    "Elephant route connector from Red Elevator A to tier-3 terrain"
  );
  const levelTwoHumanLoveLetterRoute = makeTerrainExpectation(
    "level_two_human_love_letter_route",
    "Elevator B upper Love Letter route",
    "level-two-human-love-letter-route-",
    LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES.length,
    LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT,
    "Elevator B human exit route to Level Two Love Letter"
  );
  const levelTwoRedButtons = LEVEL_TWO_RED_BUTTONS.map((button) => makeObject({
    id: `level_two_${button.id.replace(/-/g, "_")}`,
    name: button.id === "red-button-b" ? "Red Button B" : "Red Button A",
    type: "mechanism-button",
    category: "mechanism",
    asset: {
      key: button.asset,
      path: resolveAssetPath(button.asset),
      scale: 1
    },
    position: {
      x: toTwoDecimals(button.position.x),
      y: toTwoDecimals((button.surfaceTopY || SURFACE_Y) + (button.surfaceClearance || 0)),
      z: toTwoDecimals(button.position.z)
    },
    collisionExpected: false,
    mechanismLink: `${button.id} -> ${button.linkedPlatformId}`,
    elevationBand: {
      min: toTwoDecimals((button.surfaceTopY || SURFACE_Y) - 0.25),
      max: toTwoDecimals((button.surfaceTopY || SURFACE_Y) + 0.65)
    },
    runtimeProbe: `levelTwo.redButtons.${button.id}`
  }));
  const levelTwoRedPlatforms = LEVEL_TWO_RED_PLATFORMS.map((platform) => makeObject({
    id: `level_two_${platform.id.replace(/-/g, "_")}`,
    name: platform.id === "red-elevator-b" ? "Red Elevator B" : "Red Elevator A",
    type: "moving-platform",
    category: "mechanism",
    asset: {
      key: platform.asset,
      path: resolveAssetPath(platform.asset),
      scale: 1
    },
    position: {
      x: toTwoDecimals(platform.position.x),
      y: toTwoDecimals(platform.baseY),
      z: toTwoDecimals(platform.position.z)
    },
    collisionExpected: false,
    mechanismLink: `${platform.linkedButtonId} -> ${platform.id}`,
    elevationBand: {
      min: toTwoDecimals(platform.baseY - 0.25),
      max: toTwoDecimals(platform.baseY + platform.maxLift + 1.1)
    },
    runtimeProbe: `levelTwo.redPlatforms.${platform.id}`
  }));

  const levelTwoPlaceholder = makeObject({
    id: "level_two_placeholder_love_letter",
    name: "Placeholder Love Letter",
    type: "collectible",
    category: "goal",
    asset: {
      key: "spellbookClosed",
      path: resolveAssetPath("spellbookClosed"),
      scale: 0.72
    },
    position: {
      x: toTwoDecimals(LEVEL_TWO_POINTS.placeholderLoveLetter.x),
      y: toTwoDecimals(LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y),
      z: toTwoDecimals(LEVEL_TWO_POINTS.placeholderLoveLetter.z)
    },
    rotationY: -0.565,
    collisionExpected: false,
    colliderLabel: null,
    colliderMatch: "exact",
    expectedColliderCount: 0,
    mechanismLink: "collectible-ready",
    elevationBand: {
      min: toTwoDecimals(LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y - 0.4),
      max: toTwoDecimals(LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y + 0.8)
    },
    runtimeProbe: "levelTwo.placeholderLoveLetterPosition"
  });

  const tutorialObjects = [
    makeObject({
      id: "tutorial_button",
      name: "Tutorial barrier button",
      type: "mechanism-button",
      category: "mechanism",
      asset: {
        key: "buttonBaseBlue",
        path: resolveAssetPath("buttonBaseBlue"),
        scale: 1
      },
      position: {
        x: toTwoDecimals(TUTORIAL_BUTTON.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(TUTORIAL_BUTTON.z)
      },
      rotationY: 0,
      collisionExpected: false,
      colliderLabel: null,
      colliderMatch: "exact",
      expectedColliderCount: 0,
      mechanismLink: "unlock-doorway",
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.2),
        max: toTwoDecimals(SURFACE_Y + 0.4)
      }
    }),
    makeObject({
      id: "tutorial_love_letter",
      name: "Tutorial Love Letter",
      type: "collectible",
      category: "goal",
      asset: {
        key: "spellbookClosed",
        path: resolveAssetPath("spellbookClosed"),
        scale: 0.72
      },
      position: {
        x: toTwoDecimals(SPELLBOOK.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(SPELLBOOK.z)
      },
      rotationY: 0,
      collisionExpected: false,
      colliderLabel: null,
      colliderMatch: "exact",
      expectedColliderCount: 0,
      mechanismLink: "collectible",
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.2),
        max: toTwoDecimals(SURFACE_Y + 0.5)
      }
    }),
    makeObject({
      id: "tutorial_frog_totem",
      name: "Frog Totem",
      type: "collectible",
      category: "upgrade",
      asset: {
        key: "frog",
        path: resolveAssetPath("frog"),
        scale: 1
      },
      position: {
        x: toTwoDecimals(FROG_TOTEM.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(FROG_TOTEM.z)
      },
      rotationY: 0,
      collisionExpected: false,
      colliderLabel: null,
      colliderMatch: "exact",
      expectedColliderCount: 0,
      mechanismLink: "frog-cubeling-unlock",
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.2),
        max: toTwoDecimals(SURFACE_Y + 0.5)
      },
      runtimeProbe: "frogTotem.visible"
    })
  ];

  const homeObjects = [
    ...HOME_PROPS_OBJECTS,
    makeObject({
      id: "home_house_main_body",
      name: "Home house main collider",
      type: "structure-collider",
      category: "environment",
      asset: makeAsset("homeBlue"),
      position: {
        x: toTwoDecimals(HOME_POINTS.house.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(HOME_POINTS.house.z)
      },
      rotationY: 0,
      collisionExpected: true,
      colliderLabel: "home-house-main-body",
      colliderMatch: "exact",
      expectedColliderCount: 1,
      mechanismLink: null,
      elevationBand: { min: toTwoDecimals(SURFACE_Y - 0.1), max: toTwoDecimals(SURFACE_Y + 0.42) },
      runtimeProbe: "home.houseColliders.home-house-main-body"
    }),
    makeObject({
      id: "home_house_left_front",
      name: "Home house left-front collider",
      type: "structure-collider",
      category: "environment",
      asset: makeAsset("homeBlue"),
      position: {
        x: toTwoDecimals(HOME_POINTS.house.x - 2.32),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(HOME_POINTS.house.z + 0.88)
      },
      rotationY: 0,
      collisionExpected: true,
      colliderLabel: "home-house-left-front",
      colliderMatch: "exact",
      expectedColliderCount: 1,
      mechanismLink: null,
      elevationBand: { min: toTwoDecimals(SURFACE_Y - 0.2), max: toTwoDecimals(SURFACE_Y + 0.38) },
      runtimeProbe: "home.houseColliders.home-house-left-front"
    }),
    makeObject({
      id: "home_house_right_front",
      name: "Home house right-front collider",
      type: "structure-collider",
      category: "environment",
      asset: makeAsset("homeBlue"),
      position: {
        x: toTwoDecimals(HOME_POINTS.house.x + 2.32),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(HOME_POINTS.house.z + 0.88)
      },
      rotationY: 0,
      collisionExpected: true,
      colliderLabel: "home-house-right-front",
      colliderMatch: "exact",
      expectedColliderCount: 1,
      mechanismLink: null,
      elevationBand: { min: toTwoDecimals(SURFACE_Y - 0.2), max: toTwoDecimals(SURFACE_Y + 0.38) },
      runtimeProbe: "home.houseColliders.home-house-right-front"
    }),
    makeObject({
      id: "home_house_front_threshold",
      name: "Home front threshold collider",
      type: "structure-collider",
      category: "environment",
      asset: makeAsset("homeBlue"),
      position: {
        x: toTwoDecimals(HOME_POINTS.house.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(HOME_POINTS.house.z + 2.12)
      },
      rotationY: 0,
      collisionExpected: true,
      colliderLabel: "home-house-front-threshold",
      colliderMatch: "exact",
      expectedColliderCount: 1,
      mechanismLink: "home-exit-zone",
      elevationBand: { min: toTwoDecimals(SURFACE_Y - 0.2), max: toTwoDecimals(SURFACE_Y + 0.30) },
      runtimeProbe: "home.houseColliders.home-house-front-threshold"
    }),
    makeObject({
      id: "home_note",
      name: "House note marker",
      type: "collectible",
      category: "story",
      asset: {
        key: "generated-door-note",
        path: "/assets/notes/generated-door-note.obj",
        scale: 1
      },
      position: {
        x: toTwoDecimals(HOME_POINTS.note.x),
        y: toTwoDecimals(SURFACE_Y + 0.11),
        z: toTwoDecimals(HOME_POINTS.note.z)
      },
      rotationY: Number((Math.PI * 0.08).toFixed(3)),
      collisionExpected: false,
      colliderLabel: null,
      colliderMatch: "exact",
      expectedColliderCount: 0,
      mechanismLink: "note",
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.25),
        max: toTwoDecimals(SURFACE_Y + 0.6)
      },
      runtimeProbe: "home.notePosition"
    })
  ];

  const levelOneObjects = [
    ...LEVEL_ONE_PROPS_OBJECTS,
    makeObject({
      id: "level_one_bridge_partial",
      name: "Partial bridge visual",
      type: "bridge",
      category: "navigation",
      asset: {
        key: "bridgeModular",
        path: resolveAssetPath("bridgeModular"),
        scale: 0.98
      },
      position: {
        x: toTwoDecimals(LEVEL_ONE_PARTIAL_BRIDGE.x),
        y: toTwoDecimals(SURFACE_Y + 0.02),
        z: toTwoDecimals(LEVEL_ONE_PARTIAL_BRIDGE.z)
      },
      rotationY: 0,
      collisionExpected: true,
      colliderLabel: "level-one-bridge",
      colliderMatch: "prefix",
      expectedColliderCount: 1,
      mechanismLink: null,
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y),
        max: toTwoDecimals(SURFACE_Y + 1.0)
      },
      runtimeProbe: "levelOne?.activeActors"
    }),
    makeObject({
      id: "level_one_button_anchor",
      name: "Level One button anchor",
      type: "mechanism-button",
      category: "mechanism",
      asset: {
        key: "buttonBaseBlue",
        path: resolveAssetPath("buttonBaseBlue"),
        scale: 1
      },
      position: {
        x: toTwoDecimals(LEVEL_ONE_BUTTON.x),
        y: toTwoDecimals(SURFACE_Y),
        z: toTwoDecimals(LEVEL_ONE_BUTTON.z)
      },
      rotationY: 0,
      collisionExpected: false,
      colliderLabel: null,
      colliderMatch: "exact",
      expectedColliderCount: 0,
      mechanismLink: "button -> bridge",
      elevationBand: {
        min: toTwoDecimals(SURFACE_Y - 0.2),
        max: toTwoDecimals(SURFACE_Y + 0.7)
      }
    })
  ];

  const levelTwoObjects = [
    ...LEVEL_TWO_PROPS_OBJECTS,
    levelTwoCentralTerrain,
    levelTwoFrogLedge,
    levelTwoRedElevatorTopConnector,
    levelTwoHumanLoveLetterRoute,
    ...levelTwoRedButtons,
    ...levelTwoRedPlatforms,
    levelTwoPlaceholder
  ];

  const levelTwoReservedFixtureIds = LEVEL_TWO_RESERVED_TERRACE_GROUPS.map((station) => `reserved-${station.id}`);

  return {
    [SCENES.TUTORIAL]: {
      id: "tutorial",
      name: "Tutorial",
      sceneId: SCENES.TUTORIAL,
      sceneFile: "/src/scenes/tutorialScene.js",
      levelDataFile: "/src/levels/tutorialLevel.js",
      sceneAssets: ["groundTile", "waterTile", "barrier", "barrierColumnHalf", "buttonBaseBlue", "buttonTopBlue", "spellbookClosed", "frog", "heartRed"],
      bounds: WORLD_BOUNDS,
      landmarks: makeLandmarks([
        { id: "tutorial_start", name: "Start", ...START.human },
        { id: "tutorial_frog_start", name: "Frog start", ...START.frog },
        { id: "tutorial_button", name: "Button", x: TUTORIAL_BUTTON.x, y: SURFACE_Y, z: TUTORIAL_BUTTON.z }
      ]),
      cubelings: [{ id: "frog", name: "Frog Cubeling", status: "unlockable" }],
      collectibles: [{ id: "tutorial_love_letter", name: "Love Letter", position: makeLandmarks([{ id: "tutorial_spellbook", name: "Love Letter", ...SPELLBOOK }])[0].position }],
      objects: tutorialObjects,
      fixtures: {
        implemented: [],
        planned: []
      },
      smokeAvailable: true
    },
    [SCENES.HOME]: {
      id: "home_intro",
      name: "Home Intro",
      sceneId: SCENES.HOME,
      sceneFile: "/src/scenes/homeIntroScene.js",
      levelDataFile: "/src/levels/homeIntroLevel.js",
      sceneAssets: ["groundTile", "pathTile", "homeBlue", "forestTreeA", "forestTreeB", "forestBush", "forestRock", "forestGrass"],
      bounds: HOME_BOUNDS,
      landmarks: makeLandmarks([
        { id: "home_entry", name: "Entry", ...HOME_POINTS.entry },
        { id: "home_house", name: "House", ...HOME_POINTS.house },
        { id: "home_note", name: "House note", ...HOME_POINTS.note },
        { id: "home_exit", name: "Exit", ...HOME_POINTS.exit }
      ]),
      cubelings: [],
      collectibles: [{ id: "home_note", name: "House note", position: makeLandmarks([{ id: "home_note", name: "House note", ...HOME_POINTS.note }])[0].position }],
      objects: homeObjects,
      fixtures: {
        implemented: [],
        planned: []
      },
      smokeAvailable: true
    },
    [SCENES.LEVEL_ONE]: {
      id: "level_one",
      name: "Level One",
      sceneId: SCENES.LEVEL_ONE,
      sceneFile: "/src/scenes/levelOneScene.js",
      levelDataFile: "/src/levels/levelOne.js",
      sceneAssets: ["groundTile", "pathTile", "waterTile", "forestTreeA", "forestTreeB", "forestBush", "forestRock", "forestGrass", "bridgeModular", "bridgeCenter", "spellbookClosed"],
      bounds: {
        minX: WORLD_BOUNDS.minX,
        maxX: WORLD_BOUNDS.maxX,
        minZ: WORLD_BOUNDS.minZ,
        maxZ: WORLD_BOUNDS.maxZ
      },
      landmarks: makeLandmarks([
        { id: "level_one_start", name: "Level one start", x: -WORLD_BOUNDS.maxX + 0.2, y: START.human.y, z: START.human.z },
        { id: "level_one_button", name: "Bridge button", ...LEVEL_ONE_BUTTON },
        { id: "level_one_bridge_spawn", name: "Bridge spawn", x: LEVEL_ONE_PARTIAL_BRIDGE.x, y: SURFACE_Y + 0.02, z: LEVEL_ONE_PARTIAL_BRIDGE.z }
      ]),
      cubelings: [{ id: "frog", name: "Frog Cubeling", status: "spawned" }],
      collectibles: [{ id: "level_one_love_letter", name: "Love Letter", position: { x: 11.5, y: SURFACE_Y, z: 5.5 } }],
      objects: levelOneObjects,
      fixtures: {
        implemented: [],
        planned: []
      },
      smokeAvailable: true
    },
    [SCENES.LEVEL_TWO]: {
      id: "level_two",
      name: "Level Two",
      sceneId: SCENES.LEVEL_TWO,
      sceneFile: "/src/scenes/levelTwoScene.js",
      levelDataFile: "/src/levels/levelTwo.js",
      sceneAssets: [
        "groundTile",
        "pathTile",
        "forestTreeA",
        "forestTreeB",
        "forestBush",
        "forestRock",
        "forestGrass",
        "buttonBaseBlue",
        "buttonTopBlue",
        "buttonBaseRed",
        "buttonTopRed",
        "blueRamp",
        "redPlatform4x4",
        "spellbookClosed",
        "bridgeModular"
      ],
      bounds: LEVEL_TWO_BOUNDS,
      landmarks: makeLandmarks([
        { id: "level_two_entry", name: "Level Two entry", ...LEVEL_TWO_POINTS.entry },
        { id: "level_two_frog_start", name: "Frog start", ...LEVEL_TWO_POINTS.frogStart },
        { id: "level_two_center", name: "Mountain center", x: 0, y: SURFACE_Y, z: 0 },
        {
          id: "level_two_placeholder_love_letter",
          name: "Placeholder Love Letter",
          x: LEVEL_TWO_POINTS.placeholderLoveLetter.x,
          y: LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
          z: LEVEL_TWO_POINTS.placeholderLoveLetter.z
        }
      ]),
      cubelings: [{ id: "frog", name: "Frog Cubeling", status: "spawned" }],
      collectibles: [{ id: "level_two_placeholder_love_letter", name: "Placeholder Love Letter", position: {
        x: toTwoDecimals(LEVEL_TWO_POINTS.placeholderLoveLetter.x),
        y: toTwoDecimals(LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y),
        z: toTwoDecimals(LEVEL_TWO_POINTS.placeholderLoveLetter.z)
      } }],
      objects: levelTwoObjects,
      fixtures: {
        implemented: [
          fixtureImplemented("level_two_start", "Jump directly to Level Two and wait for play state."),
          fixtureImplemented(
            "level_two_love_letter_ready",
            "Enter Level Two, wait for play, then confirm the placeholder Love Letter is visible and collectible-ready indicators are stable."
          ),
          fixtureImplemented(
            "level_two_red_b_route",
            "Seed Elephant on Red Button B and human on Elevator B, cycle to the top, then walk the human route to collect the Level Two Love Letter."
          )
        ],
        planned: [
          fixtureUnsupported(
            "level_two_elephant_unlock_test",
            "Fixture requires Elephant Cubeling unlock/reveal state and deterministic fixture hooks."
          ),
          fixtureUnsupported(
            "level_two_red_button_test",
            "Use implemented level_two_red_b_route for the current Red Button B path; this older broad red-button fixture still needs split A/B expectations."
          ),
          fixtureUnsupported(
            "level_two_recall_test",
            "Recall wiring is tied to narrative/scene timing and needs deterministic level-state initialization hooks."
          ),
          fixtureUnsupported(
            "level_two_elevator_test",
            "Use implemented level_two_red_b_route for the current Elevator B path; this older broad elevator fixture still needs split A/B expectations."
          )
        ]
      },
      smokeAvailable: true,
      metadata: {
        levelWidth: LEVEL_TWO_WIDTH,
        levelHeight: LEVEL_TWO_HEIGHT,
        reservedPlatforms: levelTwoReservedFixtureIds,
        placeholderLoveLetterClearance: toTwoDecimals(LEVEL_TWO_LOVE_LETTER_CLEARANCE),
        centralMountainTiers: LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.map((tier) => tier.id),
        terrain: {
          centralMountainTileCount: LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.length,
          frogSideLedgeTileCount: LEVEL_TWO_FROG_SIDE_LEDGE_TILES.length,
          reservedTerraceTileCount: LEVEL_TWO_RESERVED_TERRACE_TILES.length,
          redButtonBTerraceTileCount: LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES.length,
          redElevatorBShaftTileCount: LEVEL_TWO_RED_ELEVATOR_B_SHAFT_TILES.length,
          humanLoveLetterRouteTileCount: LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES.length
        }
      }
    }
  };
}

const LEVEL_MAP = makeLevelMetadata();

function normalizeLevelId(raw) {
  if (!raw) return "";
  const normalized = String(raw).trim().toLowerCase();
  return LEVEL_ALIAS_MAP[normalized] || LEVEL_ALIAS_MAP[normalized.replace(/[^a-z0-9_]/g, "_")] || normalized;
}

function makeLevelEntry(level) {
  return {
    id: level.id,
    name: level.name,
    sceneId: level.sceneId,
    sceneFile: level.sceneFile,
    levelDataFile: level.levelDataFile,
    hasSmoke: Boolean(level.smokeAvailable),
    hasFixtures: level.fixtures.implemented.length > 0,
    fixtureIds: level.fixtures.implemented.map((fixture) => fixture.id),
    bounds: level.bounds,
    objectCount: level.objects.length,
    majorAssets: level.sceneAssets.length
  };
}

export function listLevels() {
  return Object.keys(LEVEL_MAP).map((sceneId) => makeLevelEntry(LEVEL_MAP[sceneId]));
}

export function getLevel(levelId) {
  const sceneId = normalizeLevelId(levelId);
  return LEVEL_MAP[sceneId] || null;
}

export function getFixture(levelId, fixtureId) {
  const level = getLevel(levelId);
  if (!level) return null;
  const normalized = String(fixtureId || "").toLowerCase();
  const all = [...level.fixtures.implemented, ...level.fixtures.planned];
  const found = all.find((fixture) => fixture.id === normalized) || null;
  return found ? { ...found, levelId: level.id } : null;
}

export function getColliderExpectations(levelId) {
  const level = getLevel(levelId);
  if (!level) return [];
  return level.objects.filter((obj) => obj.collisionExpected);
}

export function getFloatWatchObjects(levelId) {
  const level = getLevel(levelId);
  if (!level) return [];
  return level.objects.filter((obj) => obj.collisionExpected || obj.category === "collectible");
}

export function getLevelManifest(levelId) {
  const level = getLevel(levelId);
  if (!level) return null;
  const majorObjects = level.objects.slice(0, 64).map((object) => ({
    id: object.id,
    name: object.name,
    type: object.type,
    category: object.category,
    asset: object.asset,
    collisionExpected: object.collisionExpected,
    colliderLabel: object.colliderLabel
  }));
  return {
    toolingVersion: TOOLING_VERSION,
    id: level.id,
    name: level.name,
    sceneId: level.sceneId,
    sceneFile: level.sceneFile,
    levelDataFile: level.levelDataFile,
    sceneAssets: level.sceneAssets,
    bounds: level.bounds,
    landmarks: level.landmarks,
    cubelings: level.cubelings,
    collectibles: level.collectibles,
    objects: majorObjects,
    fixtures: level.fixtures
  };
}

export function getLevelObjects(levelId) {
  const level = getLevel(levelId);
  if (!level) return [];
  return level.objects;
}

export function getDebugShortcut(levelId) {
  const level = getLevel(levelId);
  if (!level) return "";
  return DEBUG_KEY_BY_SCENE[level.sceneId];
}

export function levelCatalog() {
  return LEVEL_MAP;
}
