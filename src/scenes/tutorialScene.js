import {
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  SURFACE_Y,
  TILE,
  WALL_COLUMN,
  DOOR_ROW
} from "../config/constants.js";
import { gridPoint } from "../core/grid.js";
import {
  BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
  FLOOR_EDGE_MAX_Z,
  FLOOR_EDGE_MIN_Z
} from "../levels/tutorialLevel.js";

function tagDevEditorObject(object, spec) {
  object.userData.devEditorId = spec.id;
  object.userData.devEditorName = spec.name;
  object.userData.devEditorDisplayName = spec.name;
  object.userData.devEditorAsset = spec.asset;
  object.userData.devEditorCategory = spec.category;
  object.userData.devEditorCollisionExpected = true;
  object.userData.devEditorSource = "src/scenes/tutorialScene.js or src/levels/tutorialLevel.js";
}

export function buildTutorialScene({
  scene,
  sceneGroups,
  cloneAsset,
  floorMeshes,
  barrierMeshes,
  barrierColliders,
  barrierEndCapMeshes,
  buildButtonMarker,
  markerMeshes
}) {
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      const floor = cloneAsset("groundTile");
      floor.position.set(gridPoint(x, y, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x, 0, gridPoint(x, y, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).z);
      floor.userData.column = x;
      floor.userData.row = y;
      tagDevEditorObject(floor, {
        id: `tutorial.ground_tile.${x}.${y}`,
        name: `Ground Tile ${x},${y}`,
        asset: "groundTile",
        category: "terrain_tile"
      });
      sceneGroups.tutorial.add(floor);
      floorMeshes.push(floor);
    }
  }

  for (let row = 0; row < LEVEL_HEIGHT; row++) {
    const point = gridPoint(WALL_COLUMN, row, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
    const isDoorBarrier = row === DOOR_ROW;
    const barrierAsset = isDoorBarrier ? "tutorialBarrierBlue" : "barrier";
    const barrier = cloneAsset(barrierAsset);
    barrier.position.set(point.x, SURFACE_Y, point.z);
    barrier.rotation.y = Math.PI / 2;
    tagDevEditorObject(barrier, {
      id: `tutorial.terrain.barrier.${WALL_COLUMN}.${row}`,
      name: `Barrier ${WALL_COLUMN},${row}`,
      asset: barrierAsset,
      category: "terrain_barrier"
    });
    sceneGroups.tutorial.add(barrier);
    barrierMeshes.set(row, barrier);
    barrierColliders.push({
      row,
      door: row === DOOR_ROW,
      x: point.x,
      z: point.z,
      halfX: 0.3,
      halfZ: TILE * 0.53
    });
  }

  [
    {
      key: "barrierColumnHalf",
      z: FLOOR_EDGE_MIN_Z + BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
      boundaryZ: FLOOR_EDGE_MIN_Z,
      rotation: -Math.PI / 2,
      revealIndex: -1,
      label: "start-half-column-cap"
    },
    {
      key: "barrierColumnHalf",
      z: FLOOR_EDGE_MAX_Z - BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
      boundaryZ: FLOOR_EDGE_MAX_Z,
      rotation: Math.PI / 2,
      revealIndex: LEVEL_HEIGHT,
      label: "end-half-column-cap"
    }
  ].forEach((cap) => {
    const mesh = cloneAsset(cap.key);
    const x = gridPoint(WALL_COLUMN, 0, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
    mesh.position.set(x, SURFACE_Y, cap.z);
    mesh.rotation.y = cap.rotation;
    mesh.userData.revealIndex = cap.revealIndex;
    mesh.userData.endCapLabel = cap.label;
    mesh.userData.boundaryZ = cap.boundaryZ;
    mesh.userData.columnEdgeOffset = BARRIER_END_CAP_COLUMN_EDGE_OFFSET;
    tagDevEditorObject(mesh, {
      id: `tutorial.terrain.barrier_cap.${cap.label.startsWith("start") ? "start" : "end"}`,
      name: cap.label.startsWith("start") ? "Start Barrier End Cap" : "End Barrier End Cap",
      asset: cap.key,
      category: "terrain_barrier"
    });
    sceneGroups.tutorial.add(mesh);
    barrierEndCapMeshes.push(mesh);
  });

  buildButtonMarker();

  markerMeshes.spellbookClosed = cloneAsset("spellbookClosed");
  markerMeshes.spellbookOpen = cloneAsset("spellbookOpen");
  markerMeshes.spellbookOpen.visible = false;
  tagDevEditorObject(markerMeshes.spellbookClosed, {
    id: "tutorial.love_letter.closed",
    name: "Love Letter Closed",
    asset: "spellbookClosed",
    category: "love_letter"
  });
  tagDevEditorObject(markerMeshes.spellbookOpen, {
    id: "tutorial.love_letter.open",
    name: "Love Letter Open",
    asset: "spellbookOpen",
    category: "love_letter"
  });
  scene.add(markerMeshes.spellbookClosed, markerMeshes.spellbookOpen);
}
