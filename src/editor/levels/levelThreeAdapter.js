import * as THREE from "three";

import {
  LEVEL_THREE_ANCHOR_STONES,
  LEVEL_THREE_BRIDGE_DESTINATION_MARKERS,
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
} from "../../levels/levelThree.js";
import { TILE } from "../../config/constants.js";
import { sceneGridPoint } from "../../core/grid.js";
import {
  addSceneGridTile,
  createReadOnlyBounds,
  EDITOR_SURFACE_Y,
  makeObjectColliderProxies,
  setPointPosition,
  sourceRef,
  tagEditorRoot
} from "./editorLevelUtils.js";

const LEVEL_ID = "level_three";
const SOURCE_FILE = "src/levels/levelThree.js";

export function buildLevelThreeEditorScene({ cloneAsset, placeAsset }) {
  const group = new THREE.Group();
  group.name = "Level Three Editor Scene";
  const editableObjects = [];
  const pathTiles = new Set(LEVEL_THREE_PATH_TILES.map((tile) => `${tile.x},${tile.y}`));
  const waterTiles = new Set(LEVEL_THREE_WATER_TILES.map((tile) => `${tile.x},${tile.y}`));

  for (let y = 0; y < LEVEL_THREE_HEIGHT; y += 1) {
    for (let x = 0; x < LEVEL_THREE_WIDTH; x += 1) {
      const key = `${x},${y}`;
      const isWater = waterTiles.has(key);
      const isPath = pathTiles.has(key);
      addSceneGridTile({
        group,
        cloneAsset,
        width: LEVEL_THREE_WIDTH,
        height: LEVEL_THREE_HEIGHT,
        x,
        y,
        assetKey: isWater ? "waterTile" : isPath ? "pathTile" : "groundTile",
        yPosition: isWater ? EDITOR_SURFACE_Y * 0.02 : 0,
        editableObjects,
        id: `level_three.terrain.${isWater ? "water" : isPath ? "path" : "ground"}.${x}.${y}`,
        name: `${isWater ? "Water" : isPath ? "Path" : "Ground"} Tile ${x},${y}`,
        category: isWater ? "terrain_water" : "terrain_tile",
        sourceRef: sourceRef(
          SOURCE_FILE,
          isWater ? "LEVEL_THREE_WATER_TILES" : isPath ? "LEVEL_THREE_PATH_TILES" : "LEVEL_THREE_WIDTH",
          `${isWater ? "water" : isPath ? "path" : "generated-ground"}:${x},${y}`,
          { generated: !isWater && !isPath }
        ),
        tags: ["terrain", isWater ? "water" : isPath ? "path" : "ground"],
        tileKind: isWater ? "water" : isPath ? "path" : "base_ground"
      });
    }
  }

  const loveLetter = cloneAsset("spellbookClosed");
  setPointPosition(loveLetter, LEVEL_THREE_POINTS.placeholderLoveLetter, LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y);
  loveLetter.rotation.y = Math.PI * 0.18;
  group.add(loveLetter);
  editableObjects.push(tagEditorRoot(loveLetter, {
    id: "level_three.love_letter.placeholder",
    name: "Placeholder Love Letter",
    category: "love_letter",
    assetKey: "spellbookClosed",
    sourceRef: sourceRef(SOURCE_FILE, "LEVEL_THREE_POINTS.placeholderLoveLetter", "position")
  }));

  addPlaceholderRecord({
    group,
    editableObjects,
    object: createEditorPlate(0xff9bb5, "cliff"),
    id: "level_three.level3LoveLetterCliff",
    name: "Love Letter Cliff",
    category: "cliff_placeholder",
    position: LEVEL_THREE_POINTS.placeholderLoveLetter,
    sourceExport: "LEVEL_THREE_POINTS.placeholderLoveLetter"
  });

  LEVEL_THREE_ISLAND_MARKERS.forEach((marker) => {
    addPlaceholderRecord({
      group,
      editableObjects,
      object: createEditorPlate(marker.id === "level3CenterHub" ? 0xf3d982 : 0xe0c889, "island-zone"),
      id: `level_three.${marker.objectId || marker.id}`,
      name: marker.name,
      category: "island_zone_marker",
      position: marker.position,
      sourceExport: "LEVEL_THREE_ISLANDS",
      sourcePath: marker.id,
      tags: ["level-three", "island", marker.role]
    });
  });

  addPlaceholderRecord({
    group,
    editableObjects,
    object: createEditorPlate(0xa9c9c0, "echo"),
    id: "level_three.level3CrocodileEcho",
    name: "Dormant Crocodile Echo",
    category: "crocodile_echo_placeholder",
    position: LEVEL_THREE_CROCODILE_ECHO.position,
    sourceExport: "LEVEL_THREE_CROCODILE_ECHO"
  });

  addPlaceholderRecord({
    group,
    editableObjects,
    object: createEditorPlate(0xd9b85f, "raft"),
    id: "level_three.level3TotemRaft",
    name: "Crocodile Totem Raft",
    category: "totem_raft_placeholder",
    position: LEVEL_THREE_TOTEM_RAFT.position,
    sourceExport: "LEVEL_THREE_TOTEM_RAFT"
  });

  [
    ...LEVEL_THREE_LILY_PAD_PLACEHOLDERS.map((item) => ({ ...item, category: "moving_lily_pad_placeholder", color: 0x4a9b4d, sourceExport: "LEVEL_THREE_LILY_PAD_PLACEHOLDERS" })),
    ...LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.map((item) => ({ ...item, category: "green_button_placeholder", color: 0x52b96a, sourceExport: "LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS" })),
    ...LEVEL_THREE_RAFT_MARKERS.map((item) => ({ ...item, category: "totem_raft_marker", color: 0xb7d9c8, sourceExport: "LEVEL_THREE_RAFT_MARKERS" })),
    ...LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.map((item) => ({ ...item, category: "bridge_destination_marker", color: 0x8fb8d8, sourceExport: "LEVEL_THREE_BRIDGE_DESTINATION_MARKERS" })),
    ...LEVEL_THREE_RED_BUTTON_PLACEHOLDERS.map((item) => ({ ...item, category: "red_button_placeholder", color: 0xd94848, sourceExport: "LEVEL_THREE_RED_BUTTON_PLACEHOLDERS" })),
    ...LEVEL_THREE_ANCHOR_STONES.map((item) => ({ ...item, category: "anchor_stone_placeholder", color: 0x7b7d78, sourceExport: "LEVEL_THREE_ANCHOR_STONES" })),
    ...LEVEL_THREE_RESET_PERCH_PLACEHOLDERS.map((item) => ({ ...item, category: "reset_perch_placeholder", color: 0x6c7c72, sourceExport: "LEVEL_THREE_RESET_PERCH_PLACEHOLDERS" }))
  ].forEach((item) => {
    addPlaceholderRecord({
      group,
      editableObjects,
      object: createEditorPlate(item.color, item.category),
      id: `level_three.${item.id}`,
      name: item.name || item.id,
      category: item.category,
      position: item.position,
      sourceExport: item.sourceExport,
      sourcePath: item.id
    });
  });

  LEVEL_THREE_PROPS.forEach(([assetKey, x, y, scale], index) => {
    const point = sceneGridPoint(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, x, y, TILE);
    const prop = placeAsset(group, assetKey, point, {
      y: EDITOR_SURFACE_Y,
      rotationY: index * 0.58,
      scale
    });
    editableObjects.push(tagEditorRoot(prop, {
      id: `level_three.prop.${assetKey}.${index + 1}`,
      name: `${assetKey} ${index + 1}`,
      category: "prop",
      assetKey,
      sourceRef: sourceRef(SOURCE_FILE, "LEVEL_THREE_PROPS", `[${index}]`)
    }));
  });

  group.add(createReadOnlyBounds(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, 0x5bd1c7));

  return {
    id: LEVEL_ID,
    name: "Level Three",
    group,
    editableObjects,
    colliderProxies: makeObjectColliderProxies(editableObjects)
  };
}

function addPlaceholderRecord({ group, editableObjects, object, id, name, category, position, sourceExport, sourcePath = "position", tags = [] }) {
  setPointPosition(object, position, EDITOR_SURFACE_Y + 0.28);
  group.add(object);
  editableObjects.push(tagEditorRoot(object, {
    id,
    name,
    category,
    assetKey: "generated-level-three-placeholder",
    sourceRef: sourceRef(SOURCE_FILE, sourceExport, sourcePath),
    readOnly: false,
    transformLocked: false,
    generated: false,
    sourceBacked: true,
    movable: true,
    locked: false,
    tags: ["level-three", "placeholder", category, ...tags],
    lockReason: ""
  }));
}

function createEditorPlate(color, name) {
  const group = new THREE.Group();
  group.name = `editor-${name}`;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.5, 0.12, 24),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.04,
      roughness: 0.7,
      transparent: true,
      opacity: 0.86
    })
  );
  base.position.y = 0.06;
  group.add(base);
  return group;
}

export const levelEditorAdapter = {
  id: LEVEL_ID,
  name: "Level Three",
  order: 50,
  playDebugScene: LEVEL_ID,
  defaultSelectedId: "level_three.love_letter.placeholder",
  buildEditorScene: buildLevelThreeEditorScene
};
