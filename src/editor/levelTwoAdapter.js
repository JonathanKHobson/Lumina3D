import * as THREE from "three";

import {
  BUTTON_TOP_REST_Y,
  FLOOR_TARGET,
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { sceneGridPoint } from "../core/grid.js";
import {
  LEVEL_TWO_BLUE_RAMP,
  LEVEL_TWO_BUTTON_LEDGE_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_ELEPHANT_ECHO_OPACITY,
  LEVEL_TWO_ELEPHANT_ECHO_TINT,
  LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_HEIGHT,
  LEVEL_TWO_PATH_TILES,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_PROPS,
  LEVEL_TWO_RED_BUTTONS,
  LEVEL_TWO_RED_PLATFORMS,
  LEVEL_TWO_RESERVED_TERRACE_TILES,
  LEVEL_TWO_WIDTH
} from "../levels/levelTwo.js";
import { snapshotTransform } from "./EditorPatchExporter.js";

export const LEVEL_TWO_EDITOR_ID = "level_two";

function sourceRef(exportName, path) {
  return {
    file: "src/levels/levelTwo.js",
    exportName,
    path
  };
}

function applyMaterialPatch(object, patch) {
  object.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materials.map((material) => {
      const next = material.clone();
      if (patch.color !== undefined && next.color) next.color.setHex(patch.color);
      if (patch.emissive !== undefined && next.emissive) {
        next.emissive.setHex(patch.emissive);
        next.emissiveIntensity = patch.emissiveIntensity ?? 0.1;
      }
      if (patch.opacity !== undefined) {
        next.transparent = true;
        next.opacity = patch.opacity;
        next.depthWrite = false;
      }
      next.needsUpdate = true;
      return next;
    });
    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
  });
}

function tagRoot(root, spec) {
  root.name = spec.name;
  root.userData.editorId = spec.id;
  root.userData.editorName = spec.name;
  root.userData.editorCategory = spec.category;
  root.userData.editorAsset = spec.assetKey || "";
  root.userData.editorSourceRef = spec.sourceRef;
  root.traverse((child) => {
    child.userData.editorRootId = spec.id;
  });
  return {
    ...spec,
    object: root,
    originalTransform: snapshotTransform(root)
  };
}

function createButtonGroup({ cloneAsset, baseAsset, topAsset }) {
  const group = new THREE.Group();
  const base = cloneAsset(baseAsset);
  const top = cloneAsset(topAsset);
  top.position.y = BUTTON_TOP_REST_Y;
  group.add(base, top);
  return group;
}

function placeRaisedTile({ group, placeAsset, tile, label, index }) {
  const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE);
  const raised = placeAsset(group, tile.asset || "groundTile", point, {
    y: tile.bottomY,
    scale: tile.asset === "pathTile" ? 0.99 : 0.98
  });
  raised.userData.editorTerrain = label;
  raised.userData.editorTerrainIndex = index;
  return raised;
}

function addTerrain({ group, placeAsset }) {
  const pathTiles = new Set(LEVEL_TWO_PATH_TILES.map((tile) => `${tile.x},${tile.y}`));
  for (let y = 0; y < LEVEL_TWO_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_TWO_WIDTH; x++) {
      const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, y, TILE);
      const asset = pathTiles.has(`${x},${y}`) ? "pathTile" : "groundTile";
      const tile = placeAsset(group, asset, point);
      tile.userData.editorTerrain = "base";
      tile.userData.editorTile = `${x},${y}`;
    }
  }

  [
    ["central-mountain", LEVEL_TWO_CENTRAL_MOUNTAIN_TILES],
    ["central-mountain-support", LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES],
    ["frog-side-ledge", LEVEL_TWO_FROG_SIDE_LEDGE_TILES],
    ["blue-button-ledge", LEVEL_TWO_BUTTON_LEDGE_TILES],
    ["elephant-totem-hill", LEVEL_TWO_ELEPHANT_TOTEM_HILL.tiles],
    ["reserved-terrace", LEVEL_TWO_RESERVED_TERRACE_TILES]
  ].forEach(([label, tiles]) => {
    tiles.forEach((tile, index) => {
      placeRaisedTile({ group, placeAsset, tile, label, index });
    });
  });
}

function makePropId(assetKey, index) {
  return `level_two.prop.${assetKey}.${index + 1}`;
}

export function buildLevelTwoEditorScene({ cloneAsset, placeAsset }) {
  const group = new THREE.Group();
  group.name = "Level Two Editor Scene";
  const editableObjects = [];

  addTerrain({ group, placeAsset });

  const loveLetter = cloneAsset("spellbookClosed");
  loveLetter.position.set(
    LEVEL_TWO_POINTS.placeholderLoveLetter.x,
    LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
    LEVEL_TWO_POINTS.placeholderLoveLetter.z
  );
  loveLetter.rotation.y = -Math.PI * 0.18;
  group.add(loveLetter);
  editableObjects.push(tagRoot(loveLetter, {
    id: "level_two.placeholder_love_letter",
    name: "Placeholder Love Letter",
    category: "goal",
    assetKey: "spellbookClosed",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "placeholderLoveLetter")
  }));

  const blueButton = createButtonGroup({
    cloneAsset,
    baseAsset: "buttonBaseBlue",
    topAsset: "buttonTopBlue"
  });
  blueButton.position.set(
    LEVEL_TWO_POINTS.blueButton.x,
    SURFACE_Y + LEVEL_TWO_BUTTON_LEDGE_TILES[0].bottomY,
    LEVEL_TWO_POINTS.blueButton.z
  );
  group.add(blueButton);
  editableObjects.push(tagRoot(blueButton, {
    id: "level_two.blue_button",
    name: "Blue Button",
    category: "button",
    assetKey: "buttonBaseBlue",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "blueButton")
  }));

  const blueRamp = cloneAsset(LEVEL_TWO_BLUE_RAMP.asset);
  blueRamp.position.set(
    LEVEL_TWO_BLUE_RAMP.position.x,
    SURFACE_Y,
    LEVEL_TWO_BLUE_RAMP.position.z
  );
  blueRamp.rotation.y = LEVEL_TWO_BLUE_RAMP.rotationY;
  if (LEVEL_TWO_BLUE_RAMP.visualScale) {
    blueRamp.scale.set(
      LEVEL_TWO_BLUE_RAMP.visualScale.x,
      LEVEL_TWO_BLUE_RAMP.visualScale.y,
      LEVEL_TWO_BLUE_RAMP.visualScale.z
    );
  }
  group.add(blueRamp);
  editableObjects.push(tagRoot(blueRamp, {
    id: "level_two.blue_ramp",
    name: "Blue Ramp",
    category: "ramp",
    assetKey: LEVEL_TWO_BLUE_RAMP.asset,
    sourceRef: sourceRef("LEVEL_TWO_BLUE_RAMP", "position")
  }));

  const elephantEcho = cloneAsset("elephant");
  elephantEcho.position.set(
    LEVEL_TWO_POINTS.elephantEcho.x,
    LEVEL_TWO_ELEPHANT_ECHO_TOP_Y + 0.08,
    LEVEL_TWO_POINTS.elephantEcho.z
  );
  applyMaterialPatch(elephantEcho, {
    color: LEVEL_TWO_ELEPHANT_ECHO_TINT,
    opacity: LEVEL_TWO_ELEPHANT_ECHO_OPACITY
  });
  group.add(elephantEcho);
  editableObjects.push(tagRoot(elephantEcho, {
    id: "level_two.elephant_echo",
    name: "Elephant Echo",
    category: "elephant_echo",
    assetKey: "elephant",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "elephantEcho")
  }));

  const elephantTotem = cloneAsset("elephant");
  elephantTotem.scale.multiplyScalar(LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE);
  elephantTotem.position.set(
    LEVEL_TWO_POINTS.elephantTotem.x,
    LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.9,
    LEVEL_TWO_POINTS.elephantTotem.z
  );
  applyMaterialPatch(elephantTotem, {
    color: 0xffd76a,
    emissive: 0xffb347,
    emissiveIntensity: 0.18
  });
  group.add(elephantTotem);
  editableObjects.push(tagRoot(elephantTotem, {
    id: "level_two.elephant_totem",
    name: "Elephant Cubeling Totem",
    category: "elephant_totem",
    assetKey: "elephant",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "elephantTotem")
  }));

  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const redButton = createButtonGroup({
      cloneAsset,
      baseAsset: button.asset,
      topAsset: button.topAsset
    });
    redButton.position.set(
      button.position.x,
      button.surfaceTopY + (button.surfaceClearance || 0),
      button.position.z
    );
    group.add(redButton);
    editableObjects.push(tagRoot(redButton, {
      id: `level_two.${button.id}`,
      name: "Red Button A",
      category: "red_button",
      assetKey: button.asset,
      sourceRef: sourceRef("LEVEL_TWO_RED_BUTTONS", button.id)
    }));
  });

  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const redPlatform = cloneAsset(platform.asset);
    redPlatform.position.set(
      platform.position.x,
      platform.baseY + (platform.initialProgress ?? 0) * platform.maxLift,
      platform.position.z
    );
    group.add(redPlatform);
    editableObjects.push(tagRoot(redPlatform, {
      id: `level_two.${platform.id}`,
      name: "Red Elevator A",
      category: "red_platform",
      assetKey: platform.asset,
      sourceRef: sourceRef("LEVEL_TWO_RED_PLATFORMS", platform.id)
    }));
  });

  LEVEL_TWO_PROPS.forEach(([assetKey, x, z, scale], index) => {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, z, TILE);
    const prop = placeAsset(group, assetKey, point, {
      y: SURFACE_Y,
      rotationY: index * 0.64,
      scale
    });
    const isPhysical = /Tree|Rock|Bush/.test(assetKey);
    editableObjects.push(tagRoot(prop, {
      id: makePropId(assetKey, index),
      name: `${assetKey} ${index + 1}`,
      category: isPhysical ? "physical_prop" : "decorative_prop",
      assetKey,
      sourceRef: sourceRef("LEVEL_TWO_PROPS", `[${index}]`)
    }));
  });

  const boundsHelper = new THREE.Box3Helper(
    new THREE.Box3(
      new THREE.Vector3(-LEVEL_TWO_WIDTH * TILE * 0.5, 0, -LEVEL_TWO_HEIGHT * TILE * 0.5),
      new THREE.Vector3(LEVEL_TWO_WIDTH * TILE * 0.5, FLOOR_TARGET, LEVEL_TWO_HEIGHT * TILE * 0.5)
    ),
    0x6f8a78
  );
  boundsHelper.name = "Level bounds";
  group.add(boundsHelper);

  return {
    id: LEVEL_TWO_EDITOR_ID,
    name: "Level Two",
    group,
    editableObjects
  };
}
