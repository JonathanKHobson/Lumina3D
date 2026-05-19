import * as THREE from "three";

import { SCENES } from "../config/scenes.js";
import { SURFACE_Y, TILE } from "../config/constants.js";
import { gridPoint } from "../core/grid.js";
import {
  LEVEL_ONE_BRIDGE_DECK_HEIGHT,
  LEVEL_ONE_BRIDGE_DECK_Y,
  LEVEL_ONE_BRIDGE_HALF_Z,
  LEVEL_ONE_BRIDGE_ROW,
  LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y,
  LEVEL_ONE_BRIDGE_VISUAL_Y,
  LEVEL_ONE_BRIDGE_Z,
  LEVEL_ONE_COMPLETE_BRIDGE_A,
  LEVEL_ONE_COMPLETE_BRIDGE_B,
  LEVEL_ONE_COMPLETE_BRIDGE_MAX_X,
  LEVEL_ONE_HEIGHT,
  LEVEL_ONE_PARTIAL_BRIDGE,
  LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
  LEVEL_ONE_PARTIAL_BRIDGE_MIN_X,
  LEVEL_ONE_PROPS,
  LEVEL_ONE_WATER_COLUMNS,
  LEVEL_ONE_WIDTH
} from "../levels/levelOne.js";

export function buildLevelOneScene({
  sceneGroups,
  placeAsset,
  levelOneMeshes,
  levelOneWaterColliders,
  levelOneBridgeMeshes,
  levelOneBridgeDeckMeshes,
  colliderForProp,
  addSceneCollider
}) {
  for (let y = 0; y < LEVEL_ONE_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_ONE_WIDTH; x++) {
      const isTrail = y === LEVEL_ONE_BRIDGE_ROW || (x < 4 && y === LEVEL_ONE_BRIDGE_ROW + 1);
      const tile = placeAsset(sceneGroups.levelOne, isTrail ? "pathTile" : "groundTile", gridPoint(x, y), { y: 0 });
      tile.userData.levelOneTile = `${x},${y}`;
      levelOneMeshes.push(tile);
    }
  }

  LEVEL_ONE_WATER_COLUMNS.forEach((column) => {
    for (let row = 0; row < LEVEL_ONE_HEIGHT; row++) {
      const point = gridPoint(column, row);
      const water = placeAsset(sceneGroups.levelOne, "waterTile", point, { y: SURFACE_Y * 0.02 });
      water.userData.levelOneWater = `${column},${row}`;
      levelOneMeshes.push(water);
      levelOneWaterColliders.push({
        column,
        row,
        x: point.x,
        z: point.z,
        halfX: TILE * 0.52,
        halfZ: TILE * 0.52
      });
    }
  });

  const partialBridge = placeAsset(sceneGroups.levelOne, "bridgeModular", LEVEL_ONE_PARTIAL_BRIDGE, {
    y: LEVEL_ONE_BRIDGE_VISUAL_Y,
    rotationY: 0,
    scale: 0.98
  });
  partialBridge.scale.y *= LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y;
  partialBridge.userData.levelOneAsset = "partial-bridge";
  levelOneBridgeMeshes.partial.push(partialBridge);

  const completeBridgeA = placeAsset(sceneGroups.levelOne, "bridgeCenter", LEVEL_ONE_COMPLETE_BRIDGE_A, {
    y: LEVEL_ONE_BRIDGE_VISUAL_Y,
    rotationY: 0,
    scale: 0.96
  });
  completeBridgeA.scale.y *= LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y;
  const completeBridgeB = placeAsset(sceneGroups.levelOne, "bridgeModular", LEVEL_ONE_COMPLETE_BRIDGE_B, {
    y: LEVEL_ONE_BRIDGE_VISUAL_Y,
    rotationY: 0,
    scale: 0.98
  });
  completeBridgeB.scale.y *= LEVEL_ONE_BRIDGE_VISUAL_FLATTEN_Y;
  [completeBridgeA, completeBridgeB].forEach((bridge) => {
    bridge.visible = false;
    bridge.userData.levelOneAsset = "complete-bridge";
    levelOneBridgeMeshes.complete.push(bridge);
  });

  const partialDeck = createBridgeDeck(
    LEVEL_ONE_PARTIAL_BRIDGE_MIN_X,
    LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
    LEVEL_ONE_BRIDGE_Z,
    "partial-bridge-walkable-deck"
  );
  sceneGroups.levelOne.add(partialDeck);
  levelOneBridgeDeckMeshes.partial.push(partialDeck);

  const completeDeck = createBridgeDeck(
    LEVEL_ONE_PARTIAL_BRIDGE_MAX_X,
    LEVEL_ONE_COMPLETE_BRIDGE_MAX_X,
    LEVEL_ONE_BRIDGE_Z,
    "complete-bridge-walkable-deck"
  );
  completeDeck.visible = false;
  completeDeck.position.y = LEVEL_ONE_BRIDGE_DECK_Y;
  sceneGroups.levelOne.add(completeDeck);
  levelOneBridgeDeckMeshes.complete.push(completeDeck);

  LEVEL_ONE_PROPS.forEach(([key, x, y, scale], index) => {
    const point = gridPoint(x, y);
    const prop = placeAsset(sceneGroups.levelOne, key, point, {
      y: SURFACE_Y,
      rotationY: index * 0.62,
      scale
    });
    prop.userData.levelOneAsset = key;
    levelOneMeshes.push(prop);
    const collider = colliderForProp(key, scale);
    if (collider) addSceneCollider(SCENES.LEVEL_ONE, point, collider.halfX, collider.halfZ, `level-one-${key}`);
  });

  sceneGroups.levelOne.visible = false;
}

function createBridgeDeck(minX, maxX, z, label) {
  const width = maxX - minX;
  const deck = new THREE.Group();
  deck.name = label;
  deck.position.set((minX + maxX) * 0.5, LEVEL_ONE_BRIDGE_DECK_Y, z);

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
  for (let i = 1; i < seamCount; i++) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, LEVEL_ONE_BRIDGE_DECK_HEIGHT + 0.018, LEVEL_ONE_BRIDGE_HALF_Z * 1.26),
      edgeMaterial
    );
    seam.position.x = -width * 0.5 + (width * i) / seamCount;
    seam.position.y = 0.014;
    seam.castShadow = false;
    seam.receiveShadow = true;
    deck.add(seam);
  }

  return deck;
}
