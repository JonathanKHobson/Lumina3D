import * as THREE from "three";
import { SCENES } from "../config/scenes.js";
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
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_HEIGHT,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_PATH_TILES,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_PROPS,
  LEVEL_TWO_RESERVED_TERRACE_TILES,
  LEVEL_TWO_WIDTH
} from "../levels/levelTwo.js";

export function buildLevelTwoScene({
  sceneGroups,
  placeAsset,
  cloneAsset,
  levelTwoMeshes,
  levelTwoGoalMeshes,
  levelTwoInteractiveMeshes,
  addSceneCollider,
  colliderForProp
}) {
  const pathTiles = new Set(LEVEL_TWO_PATH_TILES.map((tile) => `${tile.x},${tile.y}`));

  for (let y = 0; y < LEVEL_TWO_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_TWO_WIDTH; x++) {
      const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, y, TILE);
      const tile = placeAsset(sceneGroups.levelTwo, pathTiles.has(`${x},${y}`) ? "pathTile" : "groundTile", point);
      tile.userData.levelTwoTile = `${x},${y}`;
      levelTwoMeshes.push(tile);
    }
  }

  function placeRaisedTile(tile, index, labelPrefix) {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE);
    const raised = placeAsset(sceneGroups.levelTwo, tile.asset || "groundTile", point, {
      y: tile.bottomY,
      scale: tile.asset === "pathTile" ? 0.99 : 0.98
    });
    raised.userData.levelTwoAsset = labelPrefix;
    raised.userData.levelTwoTier = tile.tier;
    raised.userData.levelTwoZone = tile.zone;
    levelTwoMeshes.push(raised);
    levelTwoGoalMeshes.push(raised);
    addSceneCollider(
      SCENES.LEVEL_TWO,
      point,
      FLOOR_TARGET * 0.48,
      FLOOR_TARGET * 0.48,
      `level-two-${labelPrefix}-${index}`
    );
  }

  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, "central-mountain");
  });

  LEVEL_TWO_FROG_SIDE_LEDGE_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, "frog-side-ledge");
  });

  LEVEL_TWO_BUTTON_LEDGE_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, "blue-button-ledge");
  });

  LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, "elephant-totem-hill");
  });

  LEVEL_TWO_RESERVED_TERRACE_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, `reserved-${tile.stationId}`);
  });

  const loveLetter = cloneAsset("spellbookClosed");
  loveLetter.position.set(
    LEVEL_TWO_POINTS.placeholderLoveLetter.x,
    LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
    LEVEL_TWO_POINTS.placeholderLoveLetter.z
  );
  loveLetter.rotation.y = -Math.PI * 0.18;
  loveLetter.userData.levelTwoAsset = "placeholder-love-letter";
  sceneGroups.levelTwo.add(loveLetter);
  levelTwoMeshes.push(loveLetter);
  levelTwoGoalMeshes.push(loveLetter);

  const buttonGroup = new THREE.Group();
  const buttonBase = cloneAsset("buttonBaseBlue");
  const buttonTop = cloneAsset("buttonTopBlue");
  buttonTop.position.y = BUTTON_TOP_REST_Y;
  buttonGroup.position.set(
    LEVEL_TWO_POINTS.blueButton.x,
    SURFACE_Y + LEVEL_TWO_BUTTON_LEDGE_TILES[0].bottomY,
    LEVEL_TWO_POINTS.blueButton.z
  );
  buttonGroup.userData.levelTwoAsset = "blue-button";
  buttonGroup.add(buttonBase, buttonTop);
  sceneGroups.levelTwo.add(buttonGroup);
  levelTwoMeshes.push(buttonGroup);
  levelTwoInteractiveMeshes.blueButton = buttonGroup;
  levelTwoInteractiveMeshes.blueButtonTop = buttonTop;

  const blueRamp = placeAsset(sceneGroups.levelTwo, LEVEL_TWO_BLUE_RAMP.asset, LEVEL_TWO_BLUE_RAMP.position, {
    y: SURFACE_Y,
    rotationY: LEVEL_TWO_BLUE_RAMP.rotationY,
    scale: 1.0
  });
  if (LEVEL_TWO_BLUE_RAMP.visualScale) {
    blueRamp.scale.set(
      LEVEL_TWO_BLUE_RAMP.visualScale.x,
      LEVEL_TWO_BLUE_RAMP.visualScale.y,
      LEVEL_TWO_BLUE_RAMP.visualScale.z
    );
  }
  blueRamp.userData.levelTwoAsset = "blue-ramp";
  blueRamp.visible = false;
  levelTwoMeshes.push(blueRamp);
  levelTwoInteractiveMeshes.blueRamp = blueRamp;

  const totem = createElephantTotem();
  totem.position.set(
    LEVEL_TWO_POINTS.elephantTotem.x,
    LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.9,
    LEVEL_TWO_POINTS.elephantTotem.z
  );
  totem.userData.levelTwoAsset = "elephant-cubeling-totem";
  sceneGroups.levelTwo.add(totem);
  levelTwoMeshes.push(totem);
  levelTwoInteractiveMeshes.elephantTotem = totem;

  const totemGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.7, 40),
    new THREE.MeshBasicMaterial({ color: 0xffda6a, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false })
  );
  totemGlow.rotation.x = -Math.PI / 2;
  totemGlow.position.set(
    LEVEL_TWO_POINTS.elephantTotem.x,
    LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.04,
    LEVEL_TWO_POINTS.elephantTotem.z
  );
  totemGlow.userData.levelTwoAsset = "elephant-cubeling-totem-glow";
  sceneGroups.levelTwo.add(totemGlow);
  levelTwoMeshes.push(totemGlow);
  levelTwoInteractiveMeshes.elephantTotemGlow = totemGlow;

  LEVEL_TWO_PROPS.forEach(([key, x, y, scale], index) => {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, y, TILE);
    const prop = placeAsset(sceneGroups.levelTwo, key, point, {
      y: SURFACE_Y,
      rotationY: index * 0.64,
      scale
    });
    prop.userData.levelTwoAsset = key;
    levelTwoMeshes.push(prop);
    const collider = colliderForProp(key, scale);
    if (collider) addSceneCollider(SCENES.LEVEL_TWO, point, collider.halfX, collider.halfZ, `level-two-${key}`);
  });

  sceneGroups.levelTwo.visible = false;
}

function createElephantTotem() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xffc957,
    emissive: 0x8a4f10,
    emissiveIntensity: 0.65,
    roughness: 0.42,
    metalness: 0.25
  });
  const darkGold = new THREE.MeshStandardMaterial({
    color: 0xb77525,
    emissive: 0x4a2608,
    emissiveIntensity: 0.25,
    roughness: 0.55,
    metalness: 0.1
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), gold);
  core.position.y = 0.48;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.24, 8), darkGold);
  base.position.y = 0.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), gold);
  cap.position.y = 0.78;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  group.name = "Elephant Cubeling Totem";
  return group;
}
