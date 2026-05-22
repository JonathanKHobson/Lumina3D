import * as THREE from "three";

import { SCENES } from "../config/scenes.js";
import {
  BUTTON_TOP_REST_Y,
  FLOOR_TARGET,
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { sceneGridPoint } from "../core/grid.js";
import { createLilyPadGroup } from "../core/lilyPad.js";
import {
  LEVEL_THREE_ANCHOR_STONES,
  LEVEL_THREE_BRIDGE_DESTINATION_MARKERS,
  LEVEL_THREE_CLIFF_TOP_Y,
  LEVEL_THREE_CROCODILE_ECHO,
  LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS,
  LEVEL_THREE_HEIGHT,
  LEVEL_THREE_ISLAND_MARKERS,
  LEVEL_THREE_LILY_PAD_PLACEHOLDERS,
  LEVEL_THREE_PATH_TILES,
  LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_THREE_POINTS,
  LEVEL_THREE_PROPS,
  LEVEL_THREE_RAFT_MARKERS,
  LEVEL_THREE_RED_BUTTON_PLACEHOLDERS,
  LEVEL_THREE_RESET_PERCH_PLACEHOLDERS,
  LEVEL_THREE_TOTEM_RAFT,
  LEVEL_THREE_WATER_TILES,
  LEVEL_THREE_WIDTH
} from "../levels/levelThree.js";

export function buildLevelThreeScene({
  sceneGroups,
  placeAsset,
  cloneAsset,
  levelThreeMeshes,
  levelThreeGoalMeshes,
  levelThreeInteractiveMeshes = {},
  addSceneCollider,
  colliderForProp
}) {
  const pathTiles = new Set(LEVEL_THREE_PATH_TILES.map((tile) => `${tile.x},${tile.y}`));
  const waterTiles = new Set(LEVEL_THREE_WATER_TILES.map((tile) => `${tile.x},${tile.y}`));

  for (let y = 0; y < LEVEL_THREE_HEIGHT; y += 1) {
    for (let x = 0; x < LEVEL_THREE_WIDTH; x += 1) {
      const tileKey = `${x},${y}`;
      const isWater = waterTiles.has(tileKey);
      const assetKey = isWater ? "waterTile" : pathTiles.has(tileKey) ? "pathTile" : "groundTile";
      const point = sceneGridPoint(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, x, y, TILE);
      const tile = placeAsset(sceneGroups.levelThree, assetKey, point, { y: isWater ? SURFACE_Y * 0.02 : 0 });
      tile.userData.levelThreeTile = tileKey;
      tile.userData.levelThreeAsset = assetKey;
      tile.userData.levelThreeWater = isWater;
      levelThreeMeshes.push(tile);

      if (isWater) {
        addSceneCollider(
          SCENES.LEVEL_THREE,
          point,
          FLOOR_TARGET * 0.5,
          FLOOR_TARGET * 0.5,
          `level-three-water-${x}-${y}`,
          {
            levelThreeWater: true,
            levelThreeTileX: x,
            levelThreeTileY: y
          }
        );
      }
    }
  }

  addLevelThreePlaceholders(sceneGroups.levelThree, levelThreeMeshes, cloneAsset, addSceneCollider, levelThreeInteractiveMeshes);

  const loveLetter = cloneAsset("spellbookClosed");
  loveLetter.position.set(
    LEVEL_THREE_POINTS.placeholderLoveLetter.x,
    LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y,
    LEVEL_THREE_POINTS.placeholderLoveLetter.z
  );
  loveLetter.rotation.y = Math.PI * 0.18;
  loveLetter.userData.levelThreeAsset = "placeholder-love-letter";
  loveLetter.userData.devEditorCategory = "love_letter";
  loveLetter.userData.devEditorId = "level_three.love_letter.placeholder";
  loveLetter.userData.devEditorAsset = "spellbookClosed";
  loveLetter.userData.devEditorName = "Placeholder Love Letter";
  loveLetter.userData.devEditorDisplayName = "Placeholder Love Letter";
  loveLetter.userData.devEditorSource = "src/scenes/levelThreeScene.js or src/levels/levelThree.js";
  loveLetter.userData.devEditorCollisionExpected = false;
  sceneGroups.levelThree.add(loveLetter);
  levelThreeMeshes.push(loveLetter);
  levelThreeGoalMeshes.push(loveLetter);

  LEVEL_THREE_PROPS.forEach(([key, x, y, scale], index) => {
    const point = sceneGridPoint(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, x, y, TILE);
    const prop = placeAsset(sceneGroups.levelThree, key, point, {
      y: SURFACE_Y,
      rotationY: index * 0.58,
      scale
    });
    prop.userData.levelThreeAsset = key;
    levelThreeMeshes.push(prop);
    const collider = colliderForProp(key, scale);
    if (collider) addSceneCollider(SCENES.LEVEL_THREE, point, collider.halfX, collider.halfZ, `level-three-${key}`);
  });

  sceneGroups.levelThree.visible = false;
}

function addLevelThreePlaceholders(group, levelThreeMeshes, cloneAsset, addSceneCollider, levelThreeInteractiveMeshes = {}) {
  levelThreeInteractiveMeshes.greenButtons = levelThreeInteractiveMeshes.greenButtons || {};
  levelThreeInteractiveMeshes.greenButtonTops = levelThreeInteractiveMeshes.greenButtonTops || {};

  LEVEL_THREE_ISLAND_MARKERS.forEach((marker) => {
    addGenerated(group, levelThreeMeshes, createIslandMarker(marker), marker.objectId || marker.id, "island_zone_marker", {
      name: marker.name,
      displayName: marker.name,
      role: marker.role,
      sourceExport: "LEVEL_THREE_ISLANDS",
      collisionExpected: false
    });
  });

  addGenerated(group, levelThreeMeshes, createLoveLetterCliff(), "level3LoveLetterCliff", "cliff_placeholder", {
    name: "Love Letter Cliff",
    displayName: "Love Letter Cliff",
    sourceExport: "LEVEL_THREE_POINTS.placeholderLoveLetter",
    collisionExpected: true
  });
  addSceneCollider(
    SCENES.LEVEL_THREE,
    LEVEL_THREE_POINTS.placeholderLoveLetter,
    TILE * 1.25,
    TILE * 1.15,
    "level-three-love-letter-cliff",
    { levelThreePlaceholder: "level3LoveLetterCliff", visualOnlyCliff: true }
  );

  levelThreeInteractiveMeshes.crocodileEcho = addGenerated(group, levelThreeMeshes, createCrocodileEcho(), LEVEL_THREE_CROCODILE_ECHO.id, "crocodile_echo_placeholder", {
    name: LEVEL_THREE_CROCODILE_ECHO.name,
    displayName: LEVEL_THREE_CROCODILE_ECHO.name,
    sourceExport: "LEVEL_THREE_CROCODILE_ECHO"
  });
  levelThreeInteractiveMeshes.totemRaft = addGenerated(group, levelThreeMeshes, createTotemRaft(), LEVEL_THREE_TOTEM_RAFT.id, "totem_raft_placeholder", {
    name: LEVEL_THREE_TOTEM_RAFT.name,
    displayName: LEVEL_THREE_TOTEM_RAFT.name,
    sourceExport: "LEVEL_THREE_TOTEM_RAFT"
  });

  LEVEL_THREE_RAFT_MARKERS.forEach((marker) => {
    addGenerated(group, levelThreeMeshes, createRaftMarker(marker), marker.id, "totem_raft_marker", {
      name: marker.name,
      displayName: marker.name,
      sourceExport: "LEVEL_THREE_RAFT_MARKERS"
    });
  });

  LEVEL_THREE_LILY_PAD_PLACEHOLDERS.forEach((pad) => {
    addGenerated(group, levelThreeMeshes, createLilyPadPlaceholder(pad), pad.id, "moving_lily_pad_placeholder", {
      name: pad.name,
      displayName: pad.name,
      sourceExport: "LEVEL_THREE_LILY_PAD_PLACEHOLDERS",
      editorAsset: "generated-level-one-lily-pad-shared-visual",
      editorAssetPath: "/generated/shared/lily-pad"
    });
    addGenerated(group, levelThreeMeshes, createTrackMarker(pad), `${pad.id}Track`, "moving_lily_pad_track_marker", {
      name: `${pad.name} Track`,
      displayName: `${pad.name} Track`,
      sourceExport: "LEVEL_THREE_LILY_PAD_PLACEHOLDERS"
    });
  });

  LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.forEach((button) => {
    const buttonMesh = addGenerated(group, levelThreeMeshes, createButtonAssetPlaceholder(button, {
      cloneAsset,
      baseAsset: "buttonBaseBlue",
      topAsset: "buttonTopBlue",
      baseColor: 0x7b756c,
      topColor: 0x52b96a,
      topEmissive: 0x2f7f47
    }), button.id, "green_button_placeholder", {
      name: button.name,
      displayName: button.name,
      sourceExport: "LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS",
      role: button.futureMechanism,
      editorAsset: "kaykit-platformer-button-green-material-variant",
      editorAssetPath: "/generated/material-variant/button-green-from-kaykit-button-blue"
    });
    levelThreeInteractiveMeshes.greenButtons[button.id] = buttonMesh;
    if (buttonMesh.levelThreeButtonTop) {
      levelThreeInteractiveMeshes.greenButtonTops[button.id] = buttonMesh.levelThreeButtonTop;
    }
  });

  LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.forEach((marker) => {
    addGenerated(group, levelThreeMeshes, createBridgeDestinationMarker(marker), marker.id, "bridge_destination_marker", {
      name: marker.name,
      displayName: marker.name,
      sourceExport: "LEVEL_THREE_BRIDGE_DESTINATION_MARKERS"
    });
  });

  LEVEL_THREE_RED_BUTTON_PLACEHOLDERS.forEach((button) => {
    addGenerated(group, levelThreeMeshes, createButtonAssetPlaceholder(button, {
      cloneAsset,
      baseAsset: "buttonBaseRed",
      topAsset: "buttonTopRed"
    }), button.id, "red_button_placeholder", {
      name: button.name,
      displayName: button.name,
      sourceExport: "LEVEL_THREE_RED_BUTTON_PLACEHOLDERS",
      role: button.futureRequirement,
      editorAsset: "kaykit-platformer-button-red-placeholder",
      editorAssetPath: "/assets/kaykit/platformer/button-red/"
    });
    if (button.id === "level3RedButtonB") {
      addGenerated(group, levelThreeMeshes, createStoneSockets(button.position), "level3RedButtonBStoneSockets", "red_button_b_stone_sockets", {
        name: "Red Button B Stone Sockets",
        displayName: "Red Button B Stone Sockets",
        sourceExport: "LEVEL_THREE_RED_BUTTON_PLACEHOLDERS"
      });
    }
  });

  LEVEL_THREE_ANCHOR_STONES.forEach((stone) => {
    addGenerated(group, levelThreeMeshes, createAnchorStone(stone), stone.id, "anchor_stone_placeholder", {
      name: stone.name,
      displayName: stone.name,
      sourceExport: "LEVEL_THREE_ANCHOR_STONES"
    });
  });

  LEVEL_THREE_RESET_PERCH_PLACEHOLDERS.forEach((perch) => {
    addGenerated(group, levelThreeMeshes, createResetPerch(perch), perch.id, "reset_perch_placeholder", {
      name: perch.name,
      displayName: perch.name,
      sourceExport: "LEVEL_THREE_RESET_PERCH_PLACEHOLDERS"
    });
  });
}

function addGenerated(group, levelThreeMeshes, object, id, category, options = {}) {
  object.userData.levelThreeAsset = id;
  object.userData.devEditorId = `level_three.${id}`;
  object.userData.devEditorCategory = category;
  object.userData.devEditorAsset = options.editorAsset || "generated-level-three-placeholder";
  object.userData.devEditorAssetPath = options.editorAssetPath || "/generated/level-three-placeholder";
  object.userData.devEditorName = options.name || object.name || id;
  object.userData.devEditorDisplayName = options.displayName || options.name || object.name || id;
  object.userData.devEditorSource = "src/scenes/levelThreeScene.js or src/levels/levelThree.js";
  object.userData.devEditorCollisionExpected = Boolean(options.collisionExpected);
  object.userData.levelThreeSourceExport = options.sourceExport || "";
  object.userData.levelThreeVisualAsset = options.editorAsset || "generated-level-three-placeholder";
  object.userData.levelThreePhase = "phase-2a-opening-shell";
  object.userData.levelThreeRole = options.role || "";
  group.add(object);
  levelThreeMeshes.push(object);
  return object;
}

function createIslandMarker(marker) {
  const group = new THREE.Group();
  group.name = marker.objectId || marker.id;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.035, 8, 36),
    new THREE.MeshStandardMaterial({
      color: 0xf3e5b5,
      emissive: 0x8d743d,
      emissiveIntensity: 0.04,
      roughness: 0.7,
      transparent: true,
      opacity: marker.id === "level3CenterHub" ? 0.72 : 0.48
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  const dot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.08, 12),
    ring.material
  );
  dot.position.y = 0.08;
  group.add(ring, dot);
  group.position.set(marker.position.x, SURFACE_Y + 0.04, marker.position.z);
  return group;
}

function createLilyPadPlaceholder(pad) {
  const lilyPad = createLilyPadGroup({
    name: pad.id,
    radius: pad.radius || 0.46
  });
  lilyPad.position.set(pad.position.x, SURFACE_Y + 0.13, pad.position.z);
  lilyPad.rotation.y = Math.PI * 0.08;
  return lilyPad;
}

function createTrackMarker(pad) {
  const start = pad.trackStart;
  const end = pad.trackEnd;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const track = new THREE.Group();
  track.name = `${pad.id}-track`;
  const material = new THREE.MeshStandardMaterial({
    color: 0xdcefb0,
    emissive: 0x8fb85b,
    emissiveIntensity: 0.05,
    roughness: 0.68,
    transparent: true,
    opacity: 0.72
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, 0.08), material);
  rail.position.y = 0.035;
  rail.rotation.y = Math.atan2(dz, dx);
  track.add(rail);
  [start, end].forEach((point, index) => {
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.07, 16), material);
    nub.position.set(point.x - (start.x + end.x) * 0.5, 0.07, point.z - (start.z + end.z) * 0.5);
    nub.castShadow = true;
    track.add(nub);
  });
  track.position.set((start.x + end.x) * 0.5, SURFACE_Y + 0.07, (start.z + end.z) * 0.5);
  return track;
}

function createButtonAssetPlaceholder(button, {
  cloneAsset,
  baseAsset,
  topAsset,
  baseColor = null,
  topColor = null,
  topEmissive = null
}) {
  const group = new THREE.Group();
  group.name = button.id;
  const base = cloneAsset(baseAsset);
  const top = cloneAsset(topAsset);

  if (base) {
    if (baseColor !== null) applyMaterialVariant(base, { color: baseColor });
    base.position.y = 0;
    group.add(base);
  }
  if (top) {
    if (topColor !== null) {
      applyMaterialVariant(top, {
        color: topColor,
        emissive: topEmissive ?? topColor,
        emissiveIntensity: 0.08
      });
    }
    top.position.y = BUTTON_TOP_REST_Y;
    top.name = `${button.id}-top`;
    group.levelThreeButtonTop = top;
    group.add(top);
  }
  group.position.set(button.position.x, SURFACE_Y + 0.02, button.position.z);
  return group;
}

function applyMaterialVariant(root, { color, emissive = null, emissiveIntensity = null }) {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => cloneTintedMaterial(material, { color, emissive, emissiveIntensity }))
      : cloneTintedMaterial(child.material, { color, emissive, emissiveIntensity });
  });
}

function cloneTintedMaterial(material, { color, emissive, emissiveIntensity }) {
  const next = material.clone();
  if (next.color) next.color.setHex(color);
  if (next.emissive && emissive !== null) next.emissive.setHex(emissive);
  if (emissiveIntensity !== null && "emissiveIntensity" in next) next.emissiveIntensity = emissiveIntensity;
  return next;
}

function createCrocodileEcho() {
  const group = new THREE.Group();
  group.name = LEVEL_THREE_CROCODILE_ECHO.id;
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 24, 14),
    new THREE.MeshStandardMaterial({
      color: 0x8ea49a,
      emissive: 0x5d766d,
      emissiveIntensity: 0.08,
      roughness: 0.7,
      transparent: true,
      opacity: 0.36,
      depthWrite: false
    })
  );
  body.name = "level3CrocodileEchoBody";
  body.userData.levelThreeEchoPart = "body";
  body.scale.set(1.55, 0.28, 0.55);
  body.position.y = 0.35;
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.18, 0.42),
    body.material
  );
  snout.name = "level3CrocodileEchoSnout";
  snout.userData.levelThreeEchoPart = "body";
  snout.position.set(0.72, 0.35, 0);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.035, 10, 48),
    new THREE.MeshStandardMaterial({
      color: 0xc6d3cf,
      emissive: 0x8ca59d,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    })
  );
  ring.name = "level3CrocodileEchoRing";
  ring.userData.levelThreeEchoPart = "ring";
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  group.add(body, snout, ring);
  group.position.set(LEVEL_THREE_CROCODILE_ECHO.position.x, SURFACE_Y + 0.14, LEVEL_THREE_CROCODILE_ECHO.position.z);
  group.rotation.y = -Math.PI * 0.12;
  return group;
}

function createTotemRaft() {
  const group = new THREE.Group();
  group.name = LEVEL_THREE_TOTEM_RAFT.id;
  const raftMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6b35, roughness: 0.82, metalness: 0.01 });
  [-0.45, -0.15, 0.15, 0.45].forEach((offset) => {
    const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.45, 10), raftMaterial);
    reed.rotation.z = Math.PI / 2;
    reed.position.set(0, 0.08, offset);
    reed.castShadow = true;
    reed.receiveShadow = true;
    group.add(reed);
  });
  const totem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.55, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xd9b85f,
      emissive: 0xae803a,
      emissiveIntensity: 0.16,
      roughness: 0.58,
      metalness: 0.05
    })
  );
  totem.name = "level3CrocodileTotemVisual";
  totem.userData.levelThreeRaftTotem = true;
  totem.position.y = 0.55;
  totem.castShadow = true;
  group.add(totem);
  group.position.set(LEVEL_THREE_TOTEM_RAFT.position.x, SURFACE_Y + 0.12, LEVEL_THREE_TOTEM_RAFT.position.z);
  group.rotation.y = Math.PI * 0.08;
  return group;
}

function createRaftMarker(marker) {
  const group = new THREE.Group();
  group.name = marker.id;
  const material = new THREE.MeshStandardMaterial({
    color: marker.id === "level3TotemDockMarker" ? 0xd9c183 : 0xb7d9c8,
    emissive: marker.id === "level3TotemDockMarker" ? 0x6f5e32 : 0x5d8372,
    emissiveIntensity: 0.08,
    roughness: 0.62,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 10, 36), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 12), material);
  post.position.y = 0.28;
  post.castShadow = true;
  group.add(ring, post);
  group.position.set(marker.position.x, SURFACE_Y + 0.04, marker.position.z);
  return group;
}

function createBridgeDestinationMarker(marker) {
  const group = new THREE.Group();
  group.name = marker.id;
  const material = new THREE.MeshStandardMaterial({
    color: 0x8fb8d8,
    emissive: 0x426986,
    emissiveIntensity: 0.06,
    roughness: 0.7,
    transparent: true,
    opacity: 0.82
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.72), material);
  base.position.y = 0.06;
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.56), material);
  notch.position.y = 0.2;
  group.add(base, notch);
  group.position.set(marker.position.x, SURFACE_Y + 0.03, marker.position.z);
  group.rotation.y = marker.stateIndex * (Math.PI / 2);
  return group;
}

function createAnchorStone(stone) {
  const group = new THREE.Group();
  group.name = stone.id;
  const stoneMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: 0x7b7d78, roughness: 0.86, metalness: 0.01 })
  );
  stoneMesh.scale.set(1.1, 0.65, 0.9);
  stoneMesh.position.y = 0.34;
  stoneMesh.castShadow = true;
  stoneMesh.receiveShadow = true;
  group.add(stoneMesh);
  group.position.set(stone.position.x, SURFACE_Y + 0.02, stone.position.z);
  group.rotation.y = 0.4;
  return group;
}

function createStoneSockets(position) {
  const group = new THREE.Group();
  group.name = "level3RedButtonBStoneSockets";
  const material = new THREE.MeshStandardMaterial({
    color: 0x5f5550,
    roughness: 0.78,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82
  });
  [
    [-0.62, -0.48],
    [0.62, -0.48],
    [0, 0.62]
  ].forEach(([x, z]) => {
    const socket = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 28), material);
    socket.rotation.x = Math.PI / 2;
    socket.position.set(x, 0.08, z);
    group.add(socket);
  });
  group.position.set(position.x, SURFACE_Y + 0.06, position.z);
  return group;
}

function createResetPerch(perch) {
  const group = new THREE.Group();
  group.name = perch.id;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: 0x6c7c72, roughness: 0.8 })
  );
  rock.scale.set(1.15, 0.5, 0.9);
  rock.position.y = 0.28;
  rock.castShadow = true;
  group.add(rock);
  group.position.set(perch.position.x, SURFACE_Y + 0.02, perch.position.z);
  return group;
}

function createLoveLetterCliff() {
  const group = new THREE.Group();
  group.name = "level3LoveLetterCliff";
  const cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x9b8667, roughness: 0.82, metalness: 0.01 });
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x6ea05f, roughness: 0.76, metalness: 0.01 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(TILE * 2.4, LEVEL_THREE_CLIFF_TOP_Y - SURFACE_Y, TILE * 2.15), cliffMaterial);
  base.position.y = (LEVEL_THREE_CLIFF_TOP_Y - SURFACE_Y) * 0.5;
  base.castShadow = true;
  base.receiveShadow = true;
  const top = new THREE.Mesh(new THREE.BoxGeometry(TILE * 2.25, 0.16, TILE * 2.0), grassMaterial);
  top.position.y = LEVEL_THREE_CLIFF_TOP_Y - SURFACE_Y + 0.08;
  top.castShadow = true;
  top.receiveShadow = true;
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.035, 10, 46),
    new THREE.MeshStandardMaterial({
      color: 0xffd2dd,
      emissive: 0xff8ca8,
      emissiveIntensity: 0.14,
      transparent: true,
      opacity: 0.82,
      roughness: 0.5
    })
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.y = LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y - SURFACE_Y - 0.08;
  group.add(base, top, glow);
  group.position.set(LEVEL_THREE_POINTS.placeholderLoveLetter.x, SURFACE_Y, LEVEL_THREE_POINTS.placeholderLoveLetter.z);
  return group;
}
