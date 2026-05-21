import * as THREE from "three";

import { SCENES } from "../config/scenes.js";
import { SURFACE_Y, TILE } from "../config/constants.js";
import { gridPoint } from "../core/grid.js";
import {
  LEVEL_ONE_BLUE_BLOOM_LATCH,
  LEVEL_ONE_BLUE_BLOOM_MATS,
  LEVEL_ONE_CROSSING_ROW,
  LEVEL_ONE_HEIGHT,
  LEVEL_ONE_LILY_PAD,
  LEVEL_ONE_PROPS,
  LEVEL_ONE_WATER_COLUMNS,
  LEVEL_ONE_WIDTH
} from "../levels/levelOne.js";

export function buildLevelOneScene({
  sceneGroups,
  placeAsset,
  levelOneMeshes,
  levelOneWaterColliders,
  levelOneBloomMeshes,
  colliderForProp,
  addSceneCollider
}) {
  for (let y = 0; y < LEVEL_ONE_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_ONE_WIDTH; x++) {
      if (LEVEL_ONE_WATER_COLUMNS.includes(x)) continue;
      const isTrail = y === LEVEL_ONE_CROSSING_ROW || (x < 4 && y === LEVEL_ONE_CROSSING_ROW + 1);
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

  addBlueBloomCrossing(sceneGroups.levelOne, levelOneMeshes, levelOneBloomMeshes);

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

function addBlueBloomCrossing(group, levelOneMeshes, levelOneBloomMeshes = {}) {
  const lilyPad = createLilyPadGroup();
  lilyPad.position.set(LEVEL_ONE_LILY_PAD.position.x, LEVEL_ONE_LILY_PAD.position.y, LEVEL_ONE_LILY_PAD.position.z);
  lilyPad.rotation.y = LEVEL_ONE_LILY_PAD.rotationY;
  lilyPad.scale.set(
    LEVEL_ONE_LILY_PAD.visualScale.x,
    LEVEL_ONE_LILY_PAD.visualScale.y,
    LEVEL_ONE_LILY_PAD.visualScale.z
  );
  tagLevelOneGenerated(lilyPad, "generated-lily-pad", "crossing_surface");
  group.add(lilyPad);
  levelOneMeshes.push(lilyPad);
  levelOneBloomMeshes.lilyPad = lilyPad;

  const latch = createBlueBloomLatchGroup();
  latch.position.set(LEVEL_ONE_BLUE_BLOOM_LATCH.position.x, LEVEL_ONE_BLUE_BLOOM_LATCH.position.y, LEVEL_ONE_BLUE_BLOOM_LATCH.position.z);
  latch.rotation.y = LEVEL_ONE_BLUE_BLOOM_LATCH.rotationY;
  tagLevelOneGenerated(latch, "generated-blue-flower-latch", "mechanism_gate");
  group.add(latch);
  levelOneMeshes.push(latch);
  levelOneBloomMeshes.latch = latch;

  levelOneBloomMeshes.mats = levelOneBloomMeshes.mats || {};
  Object.values(LEVEL_ONE_BLUE_BLOOM_MATS).forEach((matConfig, index) => {
    const mat = createBloomMatGroup(matConfig, index + 3);
    mat.position.set(0, 0, 0);
    mat.rotation.y = 0;
    tagLevelOneGenerated(mat, `generated-blue-bloom-mat-${matConfig.id}`, "crossing_surface");
    group.add(mat);
    levelOneMeshes.push(mat);
    levelOneBloomMeshes.mats[matConfig.id] = mat;
  });

  levelOneBloomMeshes.dockGlows = [
    createDockGlow("left-lily-dock", LEVEL_ONE_BLUE_BLOOM_MATS.left.docked.x + LEVEL_ONE_BLUE_BLOOM_MATS.left.halfX * 0.72, LEVEL_ONE_LILY_PAD.position.z),
    createDockGlow("right-lily-dock", LEVEL_ONE_BLUE_BLOOM_MATS.right.docked.x - LEVEL_ONE_BLUE_BLOOM_MATS.right.halfX * 0.72, LEVEL_ONE_LILY_PAD.position.z)
  ];
  levelOneBloomMeshes.dockGlows.forEach((glow) => {
    group.add(glow);
    levelOneMeshes.push(glow);
  });
}

function makeLilyPadShape(radius) {
  const shape = new THREE.Shape();
  const notchHalfAngle = 0.34;
  const innerNotch = radius * 0.26;
  const segments = 56;
  for (let index = 0; index <= segments; index += 1) {
    const t = notchHalfAngle + ((Math.PI * 2 - notchHalfAngle * 2) * index) / segments;
    const edgeRipple = 1 + Math.sin(index * 2.1) * 0.018;
    const x = Math.cos(t) * radius * edgeRipple;
    const y = Math.sin(t) * radius * 0.9 * edgeRipple;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.lineTo(innerNotch, 0);
  shape.closePath();
  return shape;
}

function createLilyPadGroup() {
  const lilyPad = new THREE.Group();
  lilyPad.name = "level-one-lily-pad";
  const radius = LEVEL_ONE_LILY_PAD.radius;
  const shape = makeLilyPadShape(radius);
  const top = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x4c9f32, roughness: 0.68, metalness: 0.02 })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.045;
  top.castShadow = true;
  top.receiveShadow = true;
  const underside = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x2e6f2f, roughness: 0.82, metalness: 0 })
  );
  underside.rotation.x = -Math.PI / 2;
  underside.position.y = 0.006;
  underside.receiveShadow = true;
  lilyPad.add(underside, top);

  const veinMaterial = new THREE.MeshStandardMaterial({ color: 0xa8de68, roughness: 0.74, metalness: 0.02 });
  [
    { length: radius * 1.26, width: 0.035, x: -radius * 0.23, z: 0, rotationY: 0 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: -radius * 0.36, rotationY: -0.78 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: -radius * 0.18, rotationY: -0.42 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: radius * 0.18, rotationY: 0.42 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: radius * 0.36, rotationY: 0.78 }
  ].forEach((veinConfig) => {
    const vein = new THREE.Mesh(new THREE.BoxGeometry(veinConfig.length, 0.018, veinConfig.width), veinMaterial);
    vein.position.set(veinConfig.x, 0.058, veinConfig.z);
    vein.rotation.y = veinConfig.rotationY;
    vein.receiveShadow = true;
    lilyPad.add(vein);
  });

  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.09, 0.026, 18),
    new THREE.MeshStandardMaterial({ color: 0xd6e26c, roughness: 0.7 })
  );
  center.position.set(-radius * 0.22, 0.075, 0);
  center.castShadow = true;
  lilyPad.add(center);
  return lilyPad;
}

function createBloomMatGroup(config, seed) {
  const mat = new THREE.Group();
  mat.name = `level-one-${config.label}`;
  mat.userData.flowerBedCluster = true;
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x4f9d3f, roughness: 0.76, metalness: 0.01 }),
    new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 0.78, metalness: 0.01 }),
    new THREE.MeshStandardMaterial({ color: 0x3f7d3b, roughness: 0.82, metalness: 0 })
  ];

  for (let i = 0; i < 24; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8), leafMaterials[i % leafMaterials.length]);
    leaf.scale.set(
      1.05 + seededUnit(seed + 1, i) * 0.62,
      0.12,
      0.42 + seededUnit(seed + 2, i) * 0.34
    );
    leaf.rotation.y = seededOffset(seed + 3, i, Math.PI);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    setFlowerBedMotion(leaf, config, seed, i, 24, {
      kind: "leaf",
      dockY: -0.005 + seededOffset(seed + 4, i, 0.018),
      heldRadiusX: 0.56,
      heldRadiusZ: 0.42
    });
    mat.add(leaf);
  }

  for (let i = 0; i < 48; i += 1) {
    const flower = createFlowerHead(seed + i, 0x4c9dff);
    flower.rotation.y = seededOffset(seed + 9, i, Math.PI);
    setFlowerBedMotion(flower, config, seed + 20, i, 48, {
      kind: "flower",
      dockY: 0.12 + seededOffset(seed + 10, i, 0.035),
      heldRadiusX: 0.46,
      heldRadiusZ: 0.36
    });
    mat.add(flower);
  }

  for (let i = 0; i < 8; i += 1) {
    const accentColor = i % 2 === 0 ? 0xf2edf8 : 0xffc9e3;
    const accent = createFlowerHead(seed + 80 + i, accentColor, 0.86);
    accent.rotation.y = seededOffset(seed + 12, i, Math.PI);
    setFlowerBedMotion(accent, config, seed + 40, i, 8, {
      kind: "accent",
      dockY: 0.14 + seededOffset(seed + 14, i, 0.025),
      heldRadiusX: 0.38,
      heldRadiusZ: 0.3
    });
    mat.add(accent);
  }

  return mat;
}

function createFlowerHead(seed, petalColor = 0x4c9dff, scale = 1) {
  const flower = new THREE.Group();
  const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.58, metalness: 0.02 });
  const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0xbddcff, roughness: 0.62, metalness: 0.01 });
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffe58a, roughness: 0.7, metalness: 0.02 });
  for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
    const angle = (Math.PI * 2 * petalIndex) / 5 + seededOffset(seed, petalIndex, 0.08);
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.072 * scale, 10, 8),
      petalIndex === 0 && petalColor === 0x4c9dff ? highlightMaterial : petalMaterial
    );
    petal.scale.set(1.15, 0.32, 0.82);
    petal.position.set(Math.cos(angle) * 0.09 * scale, 0, Math.sin(angle) * 0.09 * scale);
    petal.castShadow = true;
    flower.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.043 * scale, 10, 8), centerMaterial);
  center.scale.set(1, 0.5, 1);
  center.position.y = 0.015 * scale;
  center.castShadow = true;
  flower.add(center);
  return flower;
}

function setFlowerBedMotion(object, config, seed, index, count, options) {
  const docked = flowerBedDockedPosition(config, seed, index, count, options);
  const held = flowerBedHeldPosition(config, seed, index, count, options);
  object.position.copy(held);
  object.userData.heldOffset = held;
  object.userData.dockedOffset = docked;
  object.userData.baseRotationY = object.rotation.y;
  object.userData.bloomDelay = seededUnit(seed + 70, index) * 0.13;
  object.userData.bloomBob = seededUnit(seed + 71, index) * Math.PI * 2;
}

function flowerBedHeldPosition(config, seed, index, count, options) {
  const angle = seededUnit(seed + 30, index) * Math.PI * 2;
  const radius = Math.sqrt(seededUnit(seed + 31, index));
  const tightX = Math.cos(angle) * options.heldRadiusX * radius;
  const tightZ = Math.sin(angle) * options.heldRadiusZ * radius;
  const stack = (index / Math.max(1, count - 1) - 0.5) * 0.08;
  return new THREE.Vector3(
    config.held.x + tightX,
    config.held.y + options.dockY + stack,
    config.held.z + tightZ
  );
}

function flowerBedDockedPosition(config, seed, index, count, options) {
  const t = ((index * 7) % count + 0.5) / count;
  const rowBand = index % 5;
  const bandOffset = [-0.72, -0.34, 0, 0.36, 0.72][rowBand] || 0;
  const taper = 0.72 + Math.sin(t * Math.PI) * 0.24;
  const xJitter = seededOffset(seed + 42, index, options.kind === "leaf" ? 0.13 : 0.1);
  const zJitter = seededOffset(seed + 43, index, options.kind === "leaf" ? 0.13 : 0.1);
  const z = THREE.MathUtils.clamp(
    bandOffset * config.halfZ + zJitter,
    -config.halfZ * taper,
    config.halfZ * taper
  );
  const x = -config.halfX + t * config.halfX * 2 + xJitter;
  return new THREE.Vector3(
    config.docked.x + x,
    config.docked.y + options.dockY,
    config.docked.z + z
  );
}

function createBlueBloomLatchGroup() {
  const latch = new THREE.Group();
  latch.name = "level-one-blue-flower-latch";
  const vineMaterial = new THREE.MeshStandardMaterial({ color: 0x245f44, roughness: 0.78, metalness: 0 });
  const bloomMaterial = new THREE.MeshStandardMaterial({ color: 0x4c9dff, roughness: 0.58, metalness: 0.02 });
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(LEVEL_ONE_BLUE_BLOOM_LATCH.halfX * 2, 0.1, 0.14),
    vineMaterial
  );
  rail.castShadow = true;
  rail.receiveShadow = true;
  latch.add(rail);
  [-0.78, -0.32, 0.32, 0.78].forEach((fraction, index) => {
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), bloomMaterial);
    bloom.scale.set(1, 0.42, 1);
    bloom.position.set(fraction * LEVEL_ONE_BLUE_BLOOM_LATCH.halfX, 0.12, index % 2 === 0 ? -0.12 : 0.12);
    bloom.castShadow = true;
    latch.add(bloom);
  });
  return latch;
}

function createDockGlow(name, x, z) {
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.58, 36),
    new THREE.MeshBasicMaterial({ color: 0x70c9ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.name = `level-one-${name}`;
  glow.position.set(x, SURFACE_Y + 0.16, z);
  glow.rotation.x = -Math.PI / 2;
  tagLevelOneGenerated(glow, `generated-blue-dock-glow-${name}`, "mechanism_marker");
  return glow;
}

function seededOffset(seed, index, amplitude) {
  const value = Math.sin((seed + 1) * 12.9898 + (index + 1) * 78.233) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amplitude * 2;
}

function seededUnit(seed, index) {
  const value = Math.sin((seed + 1) * 12.9898 + (index + 1) * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function tagLevelOneGenerated(object, assetKey, category) {
  object.userData.levelOneAsset = assetKey;
  object.userData.runtimeAssetKey = assetKey;
  object.userData.devEditorCategory = category;
  object.userData.devEditorCollisionExpected = category === "crossing_surface";
}
