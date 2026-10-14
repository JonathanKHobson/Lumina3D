import * as THREE from "three";

import {
  BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
  BARRIER_TOP_HEIGHT,
  FLOOR_EDGE_MAX_Z,
  FLOOR_EDGE_MIN_Z,
  FROG_TOTEM,
  FROG_TOTEM_VISUAL_SCALE,
  SPELLBOOK,
  TUTORIAL_BUTTON,
  TUTORIAL_LEVEL
} from "../../levels/tutorialLevel.js";
import { DOOR_ROW, LEVEL_HEIGHT, LEVEL_WIDTH, SURFACE_Y, TILE, WALL_COLUMN } from "../../config/constants.js";
import { gridPoint } from "../../core/grid.js";
import {
  addGridPlane,
  createButtonGroup,
  makeFixedBoxColliderProxy,
  makeObjectColliderProxies,
  createReadOnlyBounds,
  EDITOR_SURFACE_Y,
  setPointPosition,
  sourceRef,
  tagEditorRoot
} from "./editorLevelUtils.js";

const LEVEL_ID = "tutorial";
const SOURCE_FILE = "src/levels/tutorialLevel.js";
const BARRIER_ROTATION_Y = Math.PI / 2;

function addTutorialBarriers({ group, cloneAsset, editableObjects }) {
  const colliderProxies = [];
  for (let y = 0; y < LEVEL_HEIGHT; y += 1) {
    const point = gridPoint(WALL_COLUMN, y, LEVEL_WIDTH, LEVEL_HEIGHT, TILE);
    const isDoorBarrier = y === DOOR_ROW;
    const barrierAsset = isDoorBarrier ? "tutorialBarrierBlue" : "barrier";
    const barrier = cloneAsset(barrierAsset);
    barrier.position.set(point.x, SURFACE_Y, point.z);
    barrier.rotation.y = BARRIER_ROTATION_Y;
    barrier.scale.y *= BARRIER_TOP_HEIGHT;
    barrier.userData.editorTerrain = isDoorBarrier
      ? "tutorial-button-gated-barrier-preview"
      : "tutorial-barrier-preview";
    group.add(barrier);
    const record = tagEditorRoot(barrier, {
      id: `tutorial.terrain.barrier.${WALL_COLUMN}.${y}`,
      name: isDoorBarrier
        ? `Button-Gated Barrier ${WALL_COLUMN},${y}`
        : `Barrier Preview ${WALL_COLUMN},${y}`,
      category: "terrain_barrier",
      assetKey: barrierAsset,
      readOnly: true,
      transformLocked: true,
      tags: isDoorBarrier
        ? ["tutorial", "barrier", "button-gated", "doorway", "disappears", "manual-review"]
        : ["tutorial", "barrier"],
      lockReason: isDoorBarrier
        ? "Button-gated Tutorial barrier: the playable runtime hides this row after the blue button is pressed."
        : "Tutorial barrier preview is selectable for notes, but transform editing is disabled in this slice.",
      sourceRef: sourceRef(SOURCE_FILE, "BARRIER_TOP_HEIGHT", `wallColumn:${y}`, {
        generated: true,
        note: isDoorBarrier
          ? "Editor-only preview of the Tutorial door barrier; playable runtime marks this row as the button-cleared doorway."
          : "Editor-only barrier preview derived from tutorial wall runtime layout."
      })
    });
    editableObjects.push(record);
    colliderProxies.push(makeFixedBoxColliderProxy({
      id: `tutorial.barrier.${y}.proxy`,
      label: isDoorBarrier
        ? `Tutorial button-gated barrier row ${y}`
        : `Tutorial barrier row ${y}`,
      ownerId: record.id,
      category: "barrier",
      source: isDoorBarrier ? "source-hint" : "manual-review",
      sourceRef: sourceRef(SOURCE_FILE, "BARRIER_TOP_HEIGHT", `wallColumn:${y}`, {
        generated: true,
        note: isDoorBarrier
          ? "Door-row collider proxy follows the button-cleared Tutorial barrier preview."
          : "Editor-only barrier proxy derived from tutorial wall preview."
      }),
      offset: { x: 0, y: 0.8, z: 0 },
      halfExtents: { x: 0.3, y: 0.8, z: TILE * 0.53 },
      rotationYFromOwner: true,
      generated: true,
      metadata: isDoorBarrier
        ? {
            doorRow: DOOR_ROW,
            clearedBy: "tutorial.blue_button",
            runtimeBehavior: "hidden after the Tutorial blue button is pressed"
          }
        : null
    }));
  }
  return colliderProxies;
}

function addTutorialBarrierEndCaps({ group, cloneAsset, editableObjects }) {
  const x = gridPoint(WALL_COLUMN, 0, LEVEL_WIDTH, LEVEL_HEIGHT, TILE).x;
  return [
    {
      id: "tutorial.terrain.barrier_cap.start",
      label: "Start Barrier End Cap",
      z: FLOOR_EDGE_MIN_Z + BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
      rotationY: -Math.PI / 2,
      path: "start-half-column-cap"
    },
    {
      id: "tutorial.terrain.barrier_cap.end",
      label: "End Barrier End Cap",
      z: FLOOR_EDGE_MAX_Z - BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
      rotationY: Math.PI / 2,
      path: "end-half-column-cap"
    }
  ].flatMap((cap) => {
    const mesh = cloneAsset("barrierColumnHalf");
    mesh.position.set(x, SURFACE_Y, cap.z);
    mesh.rotation.y = cap.rotationY;
    mesh.userData.editorTerrain = "tutorial-barrier-end-cap-preview";
    group.add(mesh);
    const record = tagEditorRoot(mesh, {
      id: cap.id,
      name: cap.label,
      category: "terrain_barrier",
      assetKey: "barrierColumnHalf",
      readOnly: true,
      transformLocked: true,
      sourceRef: sourceRef(SOURCE_FILE, "BARRIER_END_CAP_COLUMN_EDGE_OFFSET", cap.path, {
        generated: true,
        note: "Editor-only barrier end-cap preview derived from tutorial runtime layout."
      })
    });
    editableObjects.push(record);
    return makeFixedBoxColliderProxy({
      id: `${cap.id}.proxy`,
      label: `${cap.label} visual proxy`,
      ownerId: record.id,
      category: "barrier",
      source: "manual-review",
      sourceRef: record.sourceRef,
      offset: { x: 0, y: 0.8, z: 0 },
      halfExtents: { x: TILE * 0.31, y: 0.8, z: TILE * 0.26 },
      rotationYFromOwner: true,
      generated: true
    });
  });
}

export function buildTutorialEditorScene({ cloneAsset }) {
  const group = new THREE.Group();
  group.name = "Tutorial Editor Scene";
  const editableObjects = [];

  addGridPlane({
    group,
    cloneAsset,
    width: TUTORIAL_LEVEL.width,
    height: TUTORIAL_LEVEL.height,
    editableObjects,
    idPrefix: "tutorial.terrain.ground",
    namePrefix: "Tutorial Ground Tile",
    sourceRefForTile: ({ x, y }) => sourceRef(SOURCE_FILE, "TUTORIAL_LEVEL", `generated-ground:${x},${y}`, {
      generated: true,
      note: "Tutorial floor tile is generated from TUTORIAL_LEVEL dimensions."
    })
  });
  const barrierColliderProxies = addTutorialBarriers({ group, cloneAsset, editableObjects });
  const endCapColliderProxies = addTutorialBarrierEndCaps({ group, cloneAsset, editableObjects });

  const frogTotem = cloneAsset("frog");
  frogTotem.scale.multiplyScalar(FROG_TOTEM_VISUAL_SCALE);
  setPointPosition(frogTotem, FROG_TOTEM, EDITOR_SURFACE_Y + 0.05);
  group.add(frogTotem);
  editableObjects.push(tagEditorRoot(frogTotem, {
    id: "tutorial.frog_totem",
    name: "Frog Cubeling Totem",
    category: "totem",
    assetKey: "frog",
    sourceRef: sourceRef(SOURCE_FILE, "FROG_TOTEM", "position")
  }));

  const blueButton = createButtonGroup({ cloneAsset });
  setPointPosition(blueButton, TUTORIAL_BUTTON, EDITOR_SURFACE_Y);
  group.add(blueButton);
  editableObjects.push(tagEditorRoot(blueButton, {
    id: "tutorial.blue_button",
    name: "Blue Button",
    category: "button",
    assetKey: "buttonBaseBlue",
    sourceRef: sourceRef(SOURCE_FILE, "TUTORIAL_BUTTON", "position")
  }));

  const spellbook = cloneAsset("spellbookClosed");
  setPointPosition(spellbook, SPELLBOOK, EDITOR_SURFACE_Y + 0.1);
  spellbook.rotation.y = -Math.PI * 0.16;
  group.add(spellbook);
  editableObjects.push(tagEditorRoot(spellbook, {
    id: "tutorial.love_letter_spellbook",
    name: "Love Letter Spellbook",
    category: "goal",
    assetKey: "spellbookClosed",
    sourceRef: sourceRef(SOURCE_FILE, "SPELLBOOK", "position")
  }));

  group.add(createReadOnlyBounds(LEVEL_WIDTH, LEVEL_HEIGHT, 0x76a875));

  return {
    id: LEVEL_ID,
    name: "Tutorial",
    group,
    editableObjects,
    colliderProxies: [
      ...makeObjectColliderProxies(editableObjects),
      ...barrierColliderProxies,
      ...endCapColliderProxies
    ]
  };
}

export const levelEditorAdapter = {
  id: LEVEL_ID,
  name: "Tutorial",
  order: 10,
  playDebugScene: LEVEL_ID,
  defaultSelectedId: "tutorial.blue_button",
  buildEditorScene: buildTutorialEditorScene
};
