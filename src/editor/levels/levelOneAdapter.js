import * as THREE from "three";

import {
  LEVEL_ONE_BLUE_BLOOM_LATCH,
  LEVEL_ONE_BLUE_BLOOM_MATS,
  LEVEL_ONE_BUTTON,
  LEVEL_ONE_CROSSING_ROW,
  LEVEL_ONE_HEIGHT,
  LEVEL_ONE_LILY_PAD,
  LEVEL_ONE_LOVE_LETTER_POINT,
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

function isLevelOnePathTile(x, y) {
  return y === LEVEL_ONE_CROSSING_ROW || (x < 4 && y === LEVEL_ONE_CROSSING_ROW + 1);
}

function addLevelOneTerrain({ group, cloneAsset, editableObjects }) {
  for (let y = 0; y < LEVEL_ONE_HEIGHT; y += 1) {
    for (let x = 0; x < LEVEL_ONE_WIDTH; x += 1) {
      if (LEVEL_ONE_WATER_COLUMNS.includes(x)) continue;
      const isPath = isLevelOnePathTile(x, y);
      addSceneGridTile({
        group,
        cloneAsset,
        width: LEVEL_ONE_WIDTH,
        height: LEVEL_ONE_HEIGHT,
        x,
        y,
        assetKey: isPath ? "pathTile" : "groundTile",
        yPosition: 0,
        editableObjects,
        id: `level_one.terrain.${isPath ? "path" : "ground"}.${x}.${y}`,
        name: `${isPath ? "Path" : "Ground"} Tile ${x},${y}`,
        category: isPath ? "terrain_path" : "terrain_tile",
        tileKind: isPath ? "base_path" : "base_ground",
        tags: isPath ? ["level-one", "path", "trail", "runtime-parity"] : ["level-one", "ground", "base-terrain"],
        sourceRef: sourceRef(
          SOURCE_FILE,
          isPath ? "LEVEL_ONE_CROSSING_ROW" : "LEVEL_ONE_WIDTH",
          `${isPath ? "generated-path" : "generated-ground"}:${x},${y}`,
          {
            generated: true,
            note: isPath
              ? "Path tile is generated from the playable Level One crossing rule using LEVEL_ONE_CROSSING_ROW."
              : "Ground tile is generated from LEVEL_ONE_WIDTH and LEVEL_ONE_HEIGHT."
          }
        )
      });
    }
  }

  LEVEL_ONE_WATER_COLUMNS.forEach((column) => {
    for (let row = 0; row < LEVEL_ONE_HEIGHT; row += 1) {
      addSceneGridTile({
        group,
        cloneAsset,
        width: LEVEL_ONE_WIDTH,
        height: LEVEL_ONE_HEIGHT,
        x: column,
        y: row,
        assetKey: "waterTile",
        yPosition: EDITOR_SURFACE_Y * 0.02,
        editableObjects,
        id: `level_one.terrain.water.${column}.${row}`,
        name: `Water Tile ${column},${row}`,
        category: "terrain_water",
        tileKind: "water_overlay",
        tags: ["level-one", "water", "overlay", "runtime-parity"],
        sourceRef: sourceRef(
          SOURCE_FILE,
          "LEVEL_ONE_WATER_COLUMNS",
          `water-column:${column},${row}`,
          {
            generated: true,
            note: "Water tile is generated as an overlay from LEVEL_ONE_WATER_COLUMNS membership."
          }
        )
      });
    }
  });
}

function addLoveLetterPreview({ group, cloneAsset, editableObjects }) {
  const spellbook = cloneAsset("spellbookClosed");
  if (!spellbook) return;
  setPointPosition(spellbook, LEVEL_ONE_LOVE_LETTER_POINT, EDITOR_SURFACE_Y + LEVEL_ONE_LILY_PAD.actorLift + 0.72);
  spellbook.rotation.y = -Math.PI * 0.18;
  group.add(spellbook);
  editableObjects.push(tagEditorRoot(spellbook, {
    id: "level_one.love_letter_spellbook",
    name: "Love Letter Spellbook",
    category: "love_letter",
    assetKey: "spellbookClosed",
    sourceRef: sourceRef(SOURCE_FILE, "LEVEL_ONE_LOVE_LETTER_POINT", "position", {
      note: "Level One Love Letter reveals from the docked right-side blue-bloom mat."
    }),
    readOnly: true,
    transformLocked: true,
    movable: false,
    locked: true,
    lockReason: "Level One Love Letter is tied to the Blue Bloom Crossing surface contract.",
    sourceBacked: true,
    tags: ["level-one", "love-letter", "spellbook", "goal", "blue-bloom-crossing", "runtime-marker"]
  }));
}

function createLatchPreview() {
  const group = new THREE.Group();
  group.name = "level-one-blue-bloom-latch-preview";
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x2879d8, roughness: 0.54, metalness: 0.04 });
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x1f5f9f, roughness: 0.62, metalness: 0.04 });
  const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0x64b7ff, roughness: 0.58, metalness: 0.02 });

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(LEVEL_ONE_BLUE_BLOOM_LATCH.halfX * 2, 0.12, LEVEL_ONE_BLUE_BLOOM_LATCH.halfZ * 2),
    railMaterial
  );
  rail.position.y = 0.12;
  rail.castShadow = true;
  rail.receiveShadow = true;
  group.add(rail);

  [-0.84, 0, 0.84].forEach((fraction) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 12), postMaterial);
    post.position.set(fraction * LEVEL_ONE_BLUE_BLOOM_LATCH.halfX, 0.27, 0);
    post.castShadow = true;
    group.add(post);

    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), flowerMaterial);
    flower.scale.set(1, 0.45, 1);
    flower.position.set(post.position.x, 0.53, 0);
    flower.castShadow = true;
    group.add(flower);
  });

  return group;
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

function createLilyPadPreview() {
  const group = new THREE.Group();
  group.name = "level-one-lily-pad-preview";
  const shape = makeLilyPadShape(LEVEL_ONE_LILY_PAD.radius);
  const pad = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x4c9f32, roughness: 0.68, metalness: 0.02 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.045;
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  const underside = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x2e6f2f, roughness: 0.82, metalness: 0 })
  );
  underside.rotation.x = -Math.PI / 2;
  underside.position.y = 0.006;
  underside.receiveShadow = true;
  group.add(underside);
  return group;
}

function createBloomMatPreview(mat) {
  const group = new THREE.Group();
  group.name = `level-one-blue-bloom-mat-${mat.id}-preview`;
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4f9d3f, roughness: 0.76, metalness: 0.01 });
  const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0x4c9dff, roughness: 0.58, metalness: 0.02 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xf2edf8, roughness: 0.62, metalness: 0.01 });
  for (let i = 0; i < 18; i += 1) {
    const t = ((i * 7) % 18 + 0.5) / 18;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), leafMaterial);
    leaf.scale.set(1.28, 0.1, 0.48);
    leaf.position.set(-mat.halfX + t * mat.halfX * 2, 0.02, seededOffset(i, mat.id === "left" ? 1 : 5, mat.halfZ * 0.7));
    leaf.rotation.y = seededOffset(i, 8, Math.PI);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }
  for (let i = 0; i < 36; i += 1) {
    const t = ((i * 5) % 36 + 0.5) / 36;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), i % 8 === 0 ? accentMaterial : flowerMaterial);
    flower.scale.set(1.15, 0.36, 1);
    flower.position.set(
      -mat.halfX + t * mat.halfX * 2 + seededOffset(i, 2, 0.08),
      0.16 + seededOffset(i, 3, 0.025),
      seededOffset(i, 4, mat.halfZ * 0.76)
    );
    flower.castShadow = true;
    group.add(flower);
  }
  return group;
}

function seededOffset(seed, index, amplitude) {
  const value = Math.sin((seed + 1) * 12.9898 + (index + 1) * 78.233) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amplitude * 2;
}

function addGeneratedPreview({
  group,
  editableObjects,
  object,
  id,
  name,
  category,
  assetKey,
  sourceExport,
  sourcePath = "position",
  tags
}) {
  group.add(object);
  editableObjects.push(tagEditorRoot(object, {
    id,
    name,
    category,
    assetKey,
    sourceRef: sourceRef(SOURCE_FILE, sourceExport, sourcePath),
    readOnly: true,
    transformLocked: true,
    movable: false,
    locked: true,
    sourceBacked: true,
    tags
  }));
}

export function buildLevelOneEditorScene({ cloneAsset, placeAsset }) {
  const group = new THREE.Group();
  group.name = "Level One Editor Scene";
  const editableObjects = [];

  addLevelOneTerrain({ group, cloneAsset, editableObjects });
  addLoveLetterPreview({ group, cloneAsset, editableObjects });

  const lilyPad = createLilyPadPreview();
  setPointPosition(lilyPad, LEVEL_ONE_LILY_PAD.position, EDITOR_SURFACE_Y + LEVEL_ONE_LILY_PAD.actorLift);
  lilyPad.rotation.y = LEVEL_ONE_LILY_PAD.rotationY;
  lilyPad.scale.set(
    LEVEL_ONE_LILY_PAD.visualScale.x,
    LEVEL_ONE_LILY_PAD.visualScale.y,
    LEVEL_ONE_LILY_PAD.visualScale.z
  );
  addGeneratedPreview({
    group,
    editableObjects,
    object: lilyPad,
    id: "level_one.lily_pad",
    name: "Central Lily Pad",
    category: "crossing_surface",
    assetKey: "generatedLilyPad",
    sourceExport: "LEVEL_ONE_LILY_PAD",
    tags: ["level-one", "lily-pad", "walkable", "runtime-surface", "blue-bloom-crossing"]
  });

  Object.values(LEVEL_ONE_BLUE_BLOOM_MATS).forEach((mat) => {
    const matPreview = createBloomMatPreview(mat);
    setPointPosition(matPreview, mat.docked, mat.docked.y);
    matPreview.rotation.y = mat.rotationY;
    addGeneratedPreview({
      group,
      editableObjects,
      object: matPreview,
      id: `level_one.blue_bloom_mat.${mat.id}`,
      name: `${mat.id === "left" ? "Left" : "Right"} Blue Bloom Mat`,
      category: "crossing_surface",
      assetKey: "generatedBlueBloomMat",
      sourceExport: "LEVEL_ONE_BLUE_BLOOM_MATS",
      sourcePath: `${mat.id}.docked`,
      tags: ["level-one", "blue-bloom-mat", "walkable-after-button", "runtime-surface", "blue-bloom-crossing"]
    });
  });

  const latch = createLatchPreview();
  setPointPosition(latch, LEVEL_ONE_BLUE_BLOOM_LATCH.position, EDITOR_SURFACE_Y + 0.08);
  addGeneratedPreview({
    group,
    editableObjects,
    object: latch,
    id: "level_one.blue_bloom_latch",
    name: "Blue Flower Latch",
    category: "mechanism",
    assetKey: "generatedBlueFlowerLatch",
    sourceExport: "LEVEL_ONE_BLUE_BLOOM_LATCH",
    tags: ["level-one", "blue-bloom-latch", "mechanism", "button-linked", "blue-bloom-crossing"]
  });

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
  defaultSelectedId: "level_one.lily_pad",
  buildEditorScene: buildLevelOneEditorScene
};
