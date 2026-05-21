import * as THREE from "three";

import {
  LEVEL_ONE_BRIDGE_DECK_HEIGHT,
  LEVEL_ONE_BRIDGE_DECK_Y,
  LEVEL_ONE_BRIDGE_HALF_Z,
  LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y,
  LEVEL_ONE_BRIDGE_VISUAL_Y,
  LEVEL_ONE_BUTTON,
  LEVEL_ONE_COMPLETE_BRIDGE_A,
  LEVEL_ONE_COMPLETE_BRIDGE_B,
  LEVEL_ONE_COMPLETE_BRIDGE_MAX_X,
  LEVEL_ONE_HEIGHT,
  LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
  LEVEL_ONE_PARTIAL_BRIDGE_MIN_X,
  LEVEL_ONE_PARTIAL_BRIDGE,
  LEVEL_ONE_PROPS,
  LEVEL_ONE_WATER_COLUMNS,
  LEVEL_ONE_WIDTH
} from "../../levels/levelOne.js";
import { TILE } from "../../config/constants.js";
import { gridPoint } from "../../core/grid.js";
import {
  addSceneGridTile,
  createButtonGroup,
  createReadOnlyBounds,
  EDITOR_SURFACE_Y,
  makeObjectColliderProxies,
  setPointPosition,
  sourceRef,
  tagEditorRoot
} from "./editorLevelUtils.js";

const LEVEL_ID = "level_one";
const SOURCE_FILE = "src/levels/levelOne.js";

function createBridgeDeckPreview(minX, maxX, z, label) {
  const width = maxX - minX;
  const deck = new THREE.Group();
  deck.name = label;
  deck.position.set((minX + maxX) * 0.5, LEVEL_ONE_BRIDGE_DECK_Y, z);
  deck.userData.editorVisualOnly = true;
  deck.userData.editorBridgeDeckPreview = label;

  const plankMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a4828,
    roughness: 0.72,
    metalness: 0.02
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x553018,
    roughness: 0.82,
    metalness: 0
  });

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(width, LEVEL_ONE_BRIDGE_DECK_HEIGHT, LEVEL_ONE_BRIDGE_HALF_Z * 1.42),
    plankMaterial
  );
  slab.castShadow = true;
  slab.receiveShadow = true;
  deck.add(slab);

  const seamCount = Math.max(2, Math.floor(width / 0.72));
  for (let i = 1; i < seamCount; i += 1) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, LEVEL_ONE_BRIDGE_DECK_HEIGHT + 0.018, LEVEL_ONE_BRIDGE_HALF_Z * 1.26),
      edgeMaterial
    );
    seam.position.x = -width * 0.5 + (width * i) / seamCount;
    seam.position.y = 0.014;
    seam.receiveShadow = true;
    deck.add(seam);
  }

  return deck;
}

function addLevelOneTerrain({ group, cloneAsset, editableObjects }) {
  for (let y = 0; y < LEVEL_ONE_HEIGHT; y += 1) {
    for (let x = 0; x < LEVEL_ONE_WIDTH; x += 1) {
      const isWater = LEVEL_ONE_WATER_COLUMNS.includes(x);
      addSceneGridTile({
        group,
        cloneAsset,
        width: LEVEL_ONE_WIDTH,
        height: LEVEL_ONE_HEIGHT,
        x,
        y,
        assetKey: isWater ? "waterTile" : "groundTile",
        yPosition: isWater ? EDITOR_SURFACE_Y * 0.02 : 0,
        editableObjects,
        id: `level_one.terrain.${isWater ? "water" : "ground"}.${x}.${y}`,
        name: `${isWater ? "Water" : "Ground"} Tile ${x},${y}`,
        category: isWater ? "terrain_water" : "terrain_tile",
        sourceRef: sourceRef(
          SOURCE_FILE,
          isWater ? "LEVEL_ONE_WATER_COLUMNS" : "LEVEL_ONE_WIDTH",
          `${isWater ? "water-column" : "generated-ground"}:${x},${y}`,
          {
            generated: true,
            note: isWater
              ? "Water tile is generated from LEVEL_ONE_WATER_COLUMNS membership."
              : "Ground tile is generated from LEVEL_ONE_WIDTH and LEVEL_ONE_HEIGHT."
          }
        )
      });
    }
  }
}

function addBridge({ group, placeAsset, point, assetKey, id, name, sourceExport }) {
  const visualScale = assetKey === "bridgeCenter" ? 0.96 : 0.98;
  const bridge = placeAsset(group, assetKey, point, {
    y: LEVEL_ONE_BRIDGE_VISUAL_Y,
    rotationY: 0,
    scale: visualScale
  });
  bridge.scale.y *= LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y;
  bridge.userData.editorRuntimeParity = "level-one-flat-bridge-preview";
  return tagEditorRoot(bridge, {
    id,
    name,
    category: "bridge",
    assetKey,
    sourceRef: sourceRef(SOURCE_FILE, sourceExport, "position")
  });
}

export function buildLevelOneEditorScene({ cloneAsset, placeAsset }) {
  const group = new THREE.Group();
  group.name = "Level One Editor Scene";
  const editableObjects = [];

  addLevelOneTerrain({ group, cloneAsset, editableObjects });

  editableObjects.push(addBridge({
    group,
    placeAsset,
    point: LEVEL_ONE_PARTIAL_BRIDGE,
    assetKey: "bridgeModular",
    id: "level_one.partial_bridge",
    name: "Partial Bridge",
    sourceExport: "LEVEL_ONE_PARTIAL_BRIDGE"
  }));
  editableObjects.push(addBridge({
    group,
    placeAsset,
    point: LEVEL_ONE_COMPLETE_BRIDGE_A,
    assetKey: "bridgeCenter",
    id: "level_one.complete_bridge_a",
    name: "Complete Bridge A",
    sourceExport: "LEVEL_ONE_COMPLETE_BRIDGE_A"
  }));
  editableObjects.push(addBridge({
    group,
    placeAsset,
    point: LEVEL_ONE_COMPLETE_BRIDGE_B,
    assetKey: "bridgeModular",
    id: "level_one.complete_bridge_b",
    name: "Complete Bridge B",
    sourceExport: "LEVEL_ONE_COMPLETE_BRIDGE_B"
  }));

  const partialBridgeDeck = createBridgeDeckPreview(
    LEVEL_ONE_PARTIAL_BRIDGE_MIN_X,
    LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
    LEVEL_ONE_PARTIAL_BRIDGE.z,
    "partial-bridge-walkable-deck"
  );
  const completeBridgeDeck = createBridgeDeckPreview(
    LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
    LEVEL_ONE_COMPLETE_BRIDGE_MAX_X,
    LEVEL_ONE_PARTIAL_BRIDGE.z,
    "complete-bridge-walkable-deck"
  );
  group.add(partialBridgeDeck, completeBridgeDeck);

  const blueButton = createButtonGroup({ cloneAsset });
  setPointPosition(blueButton, LEVEL_ONE_BUTTON, EDITOR_SURFACE_Y);
  group.add(blueButton);
  editableObjects.push(tagEditorRoot(blueButton, {
    id: "level_one.blue_button",
    name: "Blue Button",
    category: "button",
    assetKey: "buttonBaseBlue",
    sourceRef: sourceRef(SOURCE_FILE, "LEVEL_ONE_BUTTON", "position")
  }));

  LEVEL_ONE_PROPS.forEach(([assetKey, x, y, scale], index) => {
    const point = gridPoint(x, y, LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, TILE);
    const prop = placeAsset(group, assetKey, point, {
      y: EDITOR_SURFACE_Y,
      rotationY: index * 0.52,
      scale
    });
    editableObjects.push(tagEditorRoot(prop, {
      id: `level_one.prop.${assetKey}.${index + 1}`,
      name: `${assetKey} ${index + 1}`,
      category: "prop",
      assetKey,
      sourceRef: sourceRef(SOURCE_FILE, "LEVEL_ONE_PROPS", `[${index}]`)
    }));
  });

  group.add(createReadOnlyBounds(LEVEL_ONE_WIDTH, LEVEL_ONE_HEIGHT, 0x5bb8ff));

  return {
    id: LEVEL_ID,
    name: "Level One",
    group,
    editableObjects,
    colliderProxies: makeObjectColliderProxies(editableObjects)
  };
}

export const levelEditorAdapter = {
  id: LEVEL_ID,
  name: "Level One",
  order: 30,
  playDebugScene: LEVEL_ID,
  defaultSelectedId: "level_one.partial_bridge",
  buildEditorScene: buildLevelOneEditorScene
};
