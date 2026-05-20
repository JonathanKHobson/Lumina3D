import * as THREE from "three";
import { SCENES } from "../config/scenes.js";
import {
  BUTTON_TOP_REST_Y,
  FLOOR_TARGET,
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { sceneGridPoint } from "../core/grid.js";
import { applyTotemModelMaterial, applyTransparentModel } from "../core/modelMaterials.js";
import {
  LEVEL_TWO_BLUE_RAMP,
  LEVEL_TWO_BUTTON_LEDGE_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_ELEPHANT_ECHO_OPACITY,
  LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
  LEVEL_TWO_ELEPHANT_ECHO_TINT,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
  LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_HEIGHT,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_PATH_TILES,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_PROPS,
  LEVEL_TWO_RED_BUTTONS,
  LEVEL_TWO_RED_PLATFORMS,
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
    const baseScale = tile.asset === "pathTile" ? 0.99 : 0.98;
    const raised = placeAsset(sceneGroups.levelTwo, tile.asset || "groundTile", point, {
      y: tile.bottomY,
      scale: baseScale
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
      `level-two-${labelPrefix}-${index}`,
      {
        levelTwoRaisedSurface: labelPrefix,
        levelTwoTileX: tile.x,
        levelTwoTileY: tile.y,
        levelTwoTier: tile.tier,
        levelTwoTierId: tile.tierId,
        levelTwoZone: tile.zone,
        levelTwoTopY: tile.topY,
        levelTwoBottomY: tile.bottomY
      }
    );
  }

  function stabilizeElevatorPlatformMaterial(object) {
    object.traverse((child) => {
      if (!child.isMesh && !child.isSkinnedMesh) return;
      child.receiveShadow = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const stabilized = materials.map((material) => {
        const next = material.clone();
        next.polygonOffset = true;
        next.polygonOffsetFactor = -1;
        next.polygonOffsetUnits = -1;
        next.depthWrite = true;
        next.needsUpdate = true;
        return next;
      });
      child.material = Array.isArray(child.material) ? stabilized : stabilized[0];
    });
  }

  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.forEach((tile, index) => {
    placeRaisedTile(tile, index, "central-mountain");
  });

  LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES.forEach((tile, index) => {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE);
    const support = placeAsset(sceneGroups.levelTwo, tile.asset || "groundTile", point, {
      y: tile.bottomY,
      scale: 0.96
    });
    support.userData.levelTwoAsset = "central-mountain-support";
    support.userData.levelTwoTier = tile.tier;
    support.userData.levelTwoZone = "central_mountain_support";
    support.userData.supportForTierId = tile.supportForTierId;
    levelTwoMeshes.push(support);
    levelTwoGoalMeshes.push(support);
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

  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const redButtonGroup = new THREE.Group();
    const redButtonBase = cloneAsset(button.asset);
    const redButtonTop = cloneAsset(button.topAsset);
    redButtonTop.position.y = BUTTON_TOP_REST_Y;
    redButtonGroup.position.set(
      button.position.x,
      button.surfaceTopY + (button.surfaceClearance || 0),
      button.position.z
    );
    redButtonGroup.userData.levelTwoAsset = "red-button-a";
    redButtonGroup.userData.redButtonId = button.id;
    redButtonGroup.add(redButtonBase, redButtonTop);
    redButtonGroup.visible = false;
    sceneGroups.levelTwo.add(redButtonGroup);
    levelTwoMeshes.push(redButtonGroup);
    levelTwoInteractiveMeshes.redButtons[button.id] = redButtonGroup;
    levelTwoInteractiveMeshes.redButtonTops[button.id] = redButtonTop;
  });

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

  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const redPlatform = placeAsset(sceneGroups.levelTwo, platform.asset, platform.position, {
      y: platform.baseY + (platform.initialProgress ?? 0) * platform.maxLift,
      scale: 1.0
    });
    stabilizeElevatorPlatformMaterial(redPlatform);
    redPlatform.userData.levelTwoAsset = "red-elevator-a";
    redPlatform.userData.redPlatformId = platform.id;
    redPlatform.visible = false;
    levelTwoMeshes.push(redPlatform);
    levelTwoInteractiveMeshes.redPlatforms[platform.id] = redPlatform;
  });

  const elephantEcho = cloneAsset("elephant");
  elephantEcho.position.set(
    LEVEL_TWO_POINTS.elephantEcho.x,
    LEVEL_TWO_ELEPHANT_ECHO_TOP_Y + 0.08,
    LEVEL_TWO_POINTS.elephantEcho.z
  );
  elephantEcho.userData.levelTwoAsset = "elephant-echo";
  elephantEcho.userData.devEditorCategory = "elephant_echo";
  elephantEcho.userData.devEditorId = "elephant_echo";
  elephantEcho.userData.devEditorAsset = "elephant";
  elephantEcho.name = "Elephant Echo";
  applyTransparentModel(elephantEcho, LEVEL_TWO_ELEPHANT_ECHO_TINT, LEVEL_TWO_ELEPHANT_ECHO_OPACITY);
  sceneGroups.levelTwo.add(elephantEcho);
  levelTwoMeshes.push(elephantEcho);
  levelTwoInteractiveMeshes.elephantEcho = elephantEcho;

  const elephantEchoRing = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.06, 48),
    new THREE.MeshBasicMaterial({ color: 0x9fad9f, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  elephantEchoRing.rotation.x = -Math.PI / 2;
  elephantEchoRing.position.set(
    LEVEL_TWO_POINTS.elephantEcho.x,
    LEVEL_TWO_ELEPHANT_ECHO_TOP_Y + 0.045,
    LEVEL_TWO_POINTS.elephantEcho.z
  );
  elephantEchoRing.userData.levelTwoAsset = "elephant-echo-ring";
  sceneGroups.levelTwo.add(elephantEchoRing);
  levelTwoMeshes.push(elephantEchoRing);
  levelTwoInteractiveMeshes.elephantEchoRing = elephantEchoRing;

  const totem = cloneAsset("elephant");
  totem.scale.multiplyScalar(LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE);
  totem.position.set(
    LEVEL_TWO_POINTS.elephantTotem.x,
    LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.9,
    LEVEL_TWO_POINTS.elephantTotem.z
  );
  totem.userData.levelTwoAsset = "elephant-cubeling-totem";
  totem.userData.devEditorCategory = "elephant_totem";
  totem.userData.devEditorId = "elephant_totem";
  totem.userData.devEditorAsset = "elephant";
  sceneGroups.levelTwo.add(totem);
  totem.name = "Elephant Cubeling Totem";
  applyTotemModelMaterial(totem);
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
