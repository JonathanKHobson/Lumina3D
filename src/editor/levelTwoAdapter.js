import * as THREE from "three";

import {
  BUTTON_TOP_REST_Y,
  FLOOR_TARGET,
  SURFACE_Y,
  TILE
} from "../config/constants.js";
import { sceneGridPoint } from "../core/grid.js";
import {
  makeFixedBoxColliderProxy,
  makeObjectColliderProxies,
  makeTileColliderProxy
} from "./levels/editorLevelUtils.js";
import {
  applyEditorRecordUserData,
  normalizeEditorRecordSpec
} from "./EditorRecordMetadata.js";
import {
  LEVEL_TWO_BLUE_RAMP,
  LEVEL_TWO_BUTTON_LEDGE_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_ELEPHANT_ECHO_OPACITY,
  LEVEL_TWO_ELEPHANT_ECHO_TINT,
  LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES,
  LEVEL_TWO_HEIGHT,
  LEVEL_TWO_PATH_TILES,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_PROPS,
  LEVEL_TWO_RED_BUTTONS,
  LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE,
  LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES,
  LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE,
  LEVEL_TWO_RED_PLATFORMS,
  LEVEL_TWO_WIDTH
} from "../levels/levelTwo.js";
import { snapshotTransform } from "./EditorPatchExporter.js";

export const LEVEL_TWO_EDITOR_ID = "level_two";

function sourceRef(exportName, path, extra = {}) {
  return {
    file: "src/levels/levelTwo.js",
    exportName,
    path,
    ...extra
  };
}

function applyMaterialPatch(object, patch) {
  object.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materials.map((material) => {
      const next = material.clone();
      if (patch.color !== undefined && next.color) next.color.setHex(patch.color);
      if (patch.emissive !== undefined && next.emissive) {
        next.emissive.setHex(patch.emissive);
        next.emissiveIntensity = patch.emissiveIntensity ?? 0.1;
      }
      if (patch.opacity !== undefined) {
        next.transparent = true;
        next.opacity = patch.opacity;
        next.depthWrite = false;
      }
      next.needsUpdate = true;
      return next;
    });
    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
  });
}

function tagRoot(root, spec) {
  const metadata = normalizeEditorRecordSpec(spec);
  const transformTarget = spec.transformTarget || root;
  const record = {
    ...spec,
    ...metadata,
    object: root,
    transformTarget,
    originalTransform: snapshotTransform(transformTarget)
  };
  applyEditorRecordUserData(root, record);
  return record;
}

function createButtonGroup({ cloneAsset, baseAsset, topAsset }) {
  const group = new THREE.Group();
  const base = cloneAsset(baseAsset);
  const top = cloneAsset(topAsset);
  top.position.y = BUTTON_TOP_REST_Y;
  group.add(base, top);
  return group;
}

function placeRaisedTile({ group, placeAsset, tile, label, index }) {
  const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE);
  const raised = placeAsset(group, tile.asset || "groundTile", point, {
    y: tile.bottomY,
    scale: tile.asset === "pathTile" ? 0.99 : 0.98
  });
  raised.userData.editorTerrain = label;
  raised.userData.editorTerrainIndex = index;
  return raised;
}

function terrainName(label) {
  return label
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tagTerrainTile(tileObject, spec) {
  return tagRoot(tileObject, {
    category: "terrain_tile",
    readOnly: true,
    transformLocked: true,
    generated: Boolean(spec.sourceRef?.generated ?? spec.generated ?? true),
    movable: false,
    locked: true,
    tileKind: "base",
    tags: ["terrain", "tile", "base"],
    ...spec
  });
}

function addTerrain({ group, placeAsset, editableObjects }) {
  const pathTileIndexes = new Map(LEVEL_TWO_PATH_TILES.map((tile, index) => [`${tile.x},${tile.y}`, index]));
  for (let y = 0; y < LEVEL_TWO_HEIGHT; y++) {
    for (let x = 0; x < LEVEL_TWO_WIDTH; x++) {
      const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, y, TILE);
      const pathIndex = pathTileIndexes.get(`${x},${y}`);
      const asset = Number.isInteger(pathIndex) ? "pathTile" : "groundTile";
      const tile = placeAsset(group, asset, point);
      tile.userData.editorTerrain = "base";
      tile.userData.editorTile = `${x},${y}`;
      const tileSourceRef = Number.isInteger(pathIndex)
        ? sourceRef("LEVEL_TWO_PATH_TILES", `[${pathIndex}]`, {
          note: "Read-only path tile source coordinate. Use AI handoff before editing terrain layout."
        })
        : sourceRef("LEVEL_TWO_WIDTH", `generated-ground:${x},${y}`, {
          generated: true,
          note: "Base ground tile is generated from LEVEL_TWO_WIDTH and LEVEL_TWO_HEIGHT, not an individual source object."
        });
      editableObjects.push(tagTerrainTile(tile, {
        id: `level_two.terrain.base.${x}.${y}`,
        name: `${asset === "pathTile" ? "Path" : "Ground"} Tile ${x},${y}`,
        assetKey: asset,
        sourceRef: tileSourceRef,
        tileKind: Number.isInteger(pathIndex) ? "base_path" : "base_ground",
        tags: [
          "terrain",
          "tile",
          "base",
          Number.isInteger(pathIndex) ? "path" : "ground"
        ],
        sourceBacked: Number.isInteger(pathIndex),
        lockReason: Number.isInteger(pathIndex)
          ? "Base path tiles are source-backed but locked for this slice; use notes/AI handoff before changing base route topology."
          : "Generated base ground is structural terrain, not an individual movable source object."
      }));
    }
  }

  [
    ["central-mountain", LEVEL_TWO_CENTRAL_MOUNTAIN_TILES, "LEVEL_TWO_CENTRAL_MOUNTAIN_TILES", ""],
    ["central-mountain-support", LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES, "LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES", ""],
    ["frog-side-ledge", LEVEL_TWO_FROG_SIDE_LEDGE_TILES, "LEVEL_TWO_FROG_SIDE_LEDGE_TILES", ""],
    ["blue-button-ledge", LEVEL_TWO_BUTTON_LEDGE_TILES, "LEVEL_TWO_BUTTON_LEDGE_TILES", ""],
    ["elephant-totem-hill", LEVEL_TWO_ELEPHANT_TOTEM_HILL.tiles, "LEVEL_TWO_ELEPHANT_TOTEM_HILL", "tiles"],
    ["red-elevator-a-top-connector", LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES, "LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES", ""],
    ["human-love-letter-route", LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES, "LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES", ""]
  ].forEach(([label, tiles, exportName, pathPrefix]) => {
    tiles.forEach((tile, index) => {
      const raised = placeRaisedTile({ group, placeAsset, tile, label, index });
      const path = pathPrefix ? `${pathPrefix}[${index}]` : `[${index}]`;
      editableObjects.push(tagTerrainTile(raised, {
        id: `level_two.terrain.${label}.${index + 1}`,
        name: `${terrainName(label)} Tile ${index + 1}`,
        assetKey: tile.asset || "groundTile",
        readOnly: false,
        transformLocked: false,
        generated: false,
        movable: true,
        locked: false,
        lockReason: "",
        sourceBacked: true,
        tileKind: "elevated",
        tags: [
          "terrain",
          "tile",
          "elevated",
          label,
          tile.asset || "groundTile",
          tile.zone || "",
          Number.isFinite(tile.tier) ? `tier-${tile.tier}` : ""
        ],
        sourceRef: sourceRef(exportName, path, {
          note: "Source-backed raised terrain tile. Editor transform exports should be applied to this tile record by AI handoff."
        })
      }));
    });
  });
}

function makePropId(assetKey, index) {
  return `level_two.prop.${assetKey}.${index + 1}`;
}

function tileColliderProxy({ exportName, pathPrefix = "", label, tile, index }) {
  const path = pathPrefix ? `${pathPrefix}[${index}]` : `[${index}]`;
  return makeTileColliderProxy({
    id: `level_two.collider.${label}.${index + 1}`,
    label: `${label} tile ${index + 1}`,
    tile,
    levelWidth: LEVEL_TWO_WIDTH,
    levelHeight: LEVEL_TWO_HEIGHT,
    category: "terrain_surface",
    sourceRef: sourceRef(exportName, path)
  });
}

function buildTerrainColliderProxies() {
  return [
    ["LEVEL_TWO_CENTRAL_MOUNTAIN_TILES", "", "central-mountain", LEVEL_TWO_CENTRAL_MOUNTAIN_TILES],
    ["LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES", "", "central-mountain-support", LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES],
    ["LEVEL_TWO_FROG_SIDE_LEDGE_TILES", "", "frog-side-ledge", LEVEL_TWO_FROG_SIDE_LEDGE_TILES],
    ["LEVEL_TWO_BUTTON_LEDGE_TILES", "", "blue-button-ledge", LEVEL_TWO_BUTTON_LEDGE_TILES],
    ["LEVEL_TWO_ELEPHANT_TOTEM_HILL", "tiles", "elephant-totem-hill", LEVEL_TWO_ELEPHANT_TOTEM_HILL.tiles],
    ["LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES", "", "red-elevator-a-top-connector", LEVEL_TWO_RED_ELEVATOR_TOP_CONNECTOR_TILES],
    ["LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES", "", "human-love-letter-route", LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES]
  ].flatMap(([exportName, pathPrefix, label, tiles]) => (
    tiles.map((tile, index) => tileColliderProxy({ exportName, pathPrefix, label, tile, index }))
  ));
}

function vectorOffset(center, owner) {
  return {
    x: center.x - owner.object.position.x,
    y: center.y - owner.object.position.y,
    z: center.z - owner.object.position.z
  };
}

function sourceBackedOwnerProxy({ owner, id, label, center, halfExtents, source, sourceRef: proxySourceRef, category, metadata = {} }) {
  if (!owner) return null;
  return makeFixedBoxColliderProxy({
    id,
    label,
    ownerId: owner.id,
    category,
    source: source || "source-hint",
    sourceRef: proxySourceRef || owner.sourceRef,
    offset: vectorOffset(center, owner),
    halfExtents,
    rotationYFromOwner: true,
    active: true,
    generated: false,
    metadata: {
      ownerName: owner.name,
      ...metadata
    }
  });
}

function boxFromBounds(bounds) {
  return {
    center: {
      x: (bounds.minX + bounds.maxX) * 0.5,
      y: (bounds.minY + bounds.maxY) * 0.5,
      z: (bounds.minZ + bounds.maxZ) * 0.5
    },
    halfExtents: {
      x: Math.max(0.04, (bounds.maxX - bounds.minX) * 0.5),
      y: Math.max(0.04, (bounds.maxY - bounds.minY) * 0.5),
      z: Math.max(0.04, (bounds.maxZ - bounds.minZ) * 0.5)
    }
  };
}

function buildLevelTwoMechanismColliderProxies(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const proxies = [];
  const pushProxy = (proxy) => {
    if (proxy) proxies.push(proxy);
  };

  const ramp = byId.get("level_two.blue_ramp");
  const rampCenter = {
    x: (LEVEL_TWO_BLUE_RAMP.minX + LEVEL_TWO_BLUE_RAMP.maxX) * 0.5,
    y: SURFACE_Y + LEVEL_TWO_BLUE_RAMP.targetLift * 0.5,
    z: (LEVEL_TWO_BLUE_RAMP.minZ + LEVEL_TWO_BLUE_RAMP.maxZ) * 0.5
  };
  pushProxy(sourceBackedOwnerProxy({
    owner: ramp,
    id: "level_two.collider.blue_ramp.walkable_envelope",
    label: "Blue Ramp source walkable envelope",
    category: "walkable_proxy",
    center: rampCenter,
    halfExtents: {
      x: (LEVEL_TWO_BLUE_RAMP.maxX - LEVEL_TWO_BLUE_RAMP.minX) * 0.5,
      y: Math.max(0.05, LEVEL_TWO_BLUE_RAMP.targetLift * 0.5),
      z: (LEVEL_TWO_BLUE_RAMP.maxZ - LEVEL_TWO_BLUE_RAMP.minZ) * 0.5
    },
    sourceRef: sourceRef("LEVEL_TWO_BLUE_RAMP", "minX/maxX/minZ/maxZ/targetLift"),
    metadata: {
      runtimeSource: "buildColliderDebugEntries",
      walkableBy: "human when blueRampActive",
      lowEnd: LEVEL_TWO_BLUE_RAMP.lowEnd,
      highEnd: LEVEL_TWO_BLUE_RAMP.highEnd
    }
  }));

  const blueButton = byId.get("level_two.blue_button");
  pushProxy(sourceBackedOwnerProxy({
    owner: blueButton,
    id: "level_two.collider.blue_button.trigger_hint",
    label: "Blue Button source trigger/press area",
    category: "button_trigger",
    center: {
      x: LEVEL_TWO_POINTS.blueButton.x,
      y: SURFACE_Y + LEVEL_TWO_BUTTON_LEDGE_TILES[0].bottomY + 0.08,
      z: LEVEL_TWO_POINTS.blueButton.z
    },
    halfExtents: { x: 0.7, y: 0.1, z: 0.7 },
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "blueButton"),
    metadata: {
      linkedMechanism: "blue ramp reveal",
      sourceConfidence: "source position hint; trigger radius is runtime behavior context"
    }
  }));

  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const owner = byId.get(`level_two.${button.id}`);
    pushProxy(sourceBackedOwnerProxy({
      owner,
      id: `level_two.collider.${button.id}.held_weight_trigger`,
      label: `${button.id} held-weight trigger radius`,
      category: "button_trigger",
      center: {
        x: button.position.x,
        y: button.surfaceTopY,
        z: button.position.z
      },
      halfExtents: {
        x: button.radius,
        y: 0.08,
        z: button.radius
      },
      sourceRef: sourceRef("LEVEL_TWO_RED_BUTTONS", button.id),
      metadata: {
        requiredActor: button.requiredActor,
        activationType: button.activationType,
        linkedPlatformId: button.linkedPlatformId,
        surfaceId: button.surfaceId
      }
    }));
  });

  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const owner = byId.get(`level_two.${platform.id}`);
    const currentLift = (platform.initialProgress ?? 0) * platform.maxLift;
    const surfaceY = SURFACE_Y + currentLift + (platform.surfaceOffset || 0);
    pushProxy(sourceBackedOwnerProxy({
      owner,
      id: `level_two.collider.${platform.id}.walkable_surface`,
      label: `${platform.id} walkable platform surface`,
      category: "walkable_proxy",
      center: {
        x: platform.position.x,
        y: surfaceY,
        z: platform.position.z
      },
      halfExtents: {
        x: (platform.maxX - platform.minX) * 0.5,
        y: Math.max(0.08, (platform.surfaceOffset || 0.2) * 0.5),
        z: (platform.maxZ - platform.minZ) * 0.5
      },
      sourceRef: sourceRef("LEVEL_TWO_RED_PLATFORMS", platform.id),
      metadata: {
        walkableBy: platform.walkableBy,
        initialProgress: platform.initialProgress ?? 0,
        activeProgress: platform.activeProgress ?? null,
        inactiveProgress: platform.inactiveProgress ?? null,
        linkedButtonId: platform.linkedButtonId || null
      }
    }));
    pushProxy(sourceBackedOwnerProxy({
      owner,
      id: `level_two.collider.${platform.id}.visual_footprint`,
      label: `${platform.id} source visual footprint`,
      category: "platform_visual_bounds",
      center: {
        x: platform.position.x,
        y: platform.baseY + currentLift + 0.5,
        z: platform.position.z
      },
      halfExtents: {
        x: platform.visualHalfFootprint || (platform.maxX - platform.minX) * 0.5,
        y: 0.5,
        z: platform.visualHalfFootprint || (platform.maxZ - platform.minZ) * 0.5
      },
      sourceRef: sourceRef("LEVEL_TWO_RED_PLATFORMS", platform.id),
      metadata: {
        visualOnly: true,
        maxLift: platform.maxLift,
        movementRule: platform.movementRule
      }
    }));
  });

  const echo = byId.get("level_two.elephant_echo");
  pushProxy(sourceBackedOwnerProxy({
    owner: echo,
    id: "level_two.collider.elephant_echo.interaction_ring",
    label: "Elephant Echo interaction/terrace hint",
    category: "interaction_zone",
    center: {
      x: LEVEL_TWO_POINTS.elephantEcho.x,
      y: LEVEL_TWO_POINTS.elephantEcho.y ?? LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
      z: LEVEL_TWO_POINTS.elephantEcho.z
    },
    halfExtents: { x: 1.06, y: 0.08, z: 1.06 },
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "elephantEcho"),
    metadata: {
      terraceY: LEVEL_TWO_POINTS.elephantEcho.y ?? LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
      visualOpacity: LEVEL_TWO_ELEPHANT_ECHO_OPACITY
    }
  }));

  const totem = byId.get("level_two.elephant_totem");
  pushProxy(sourceBackedOwnerProxy({
    owner: totem,
    id: "level_two.collider.elephant_totem.hill_radius",
    label: "Elephant Totem hill/radius hint",
    category: "interaction_zone",
    center: {
      x: LEVEL_TWO_POINTS.elephantTotem.x,
      y: LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY,
      z: LEVEL_TWO_POINTS.elephantTotem.z
    },
    halfExtents: {
      x: LEVEL_TWO_ELEPHANT_TOTEM_HILL.radius || 0.82,
      y: Math.max(0.08, LEVEL_TWO_ELEPHANT_TOTEM_HILL.heightAboveGround * 0.5),
      z: LEVEL_TWO_ELEPHANT_TOTEM_HILL.radius || 0.82
    },
    sourceRef: sourceRef("LEVEL_TWO_ELEPHANT_TOTEM_HILL", "position/radius/topY"),
    metadata: {
      heightAboveGround: LEVEL_TWO_ELEPHANT_TOTEM_HILL.heightAboveGround,
      visualScale: LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE
    }
  }));

  [
    {
      id: "level_two.collider.red_elevator_a.side_approach_zone",
      label: "Red Elevator A side approach zone",
      category: "transition_zone",
      ownerId: "level_two.red-elevator-a",
      sourceRef: sourceRef("LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE", "bounds"),
      bounds: {
        minX: LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minX,
        maxX: LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxX,
        minY: SURFACE_Y,
        maxY: SURFACE_Y + 0.18,
        minZ: LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minZ,
        maxZ: LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxZ
      }
    },
    {
      id: "level_two.collider.red_elevator_a.top_exit_zone",
      label: "Red Elevator A top exit zone",
      category: "transition_zone",
      ownerId: "level_two.red-elevator-a",
      sourceRef: sourceRef("LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE", "bounds"),
      bounds: {
        minX: LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minX,
        maxX: LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxX,
        minY: LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
        maxY: LEVEL_TWO_ELEPHANT_ECHO_TOP_Y + 0.18,
        minZ: LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minZ,
        maxZ: LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxZ
      }
    }
  ].forEach((zone) => {
    const owner = byId.get(zone.ownerId);
    const box = boxFromBounds(zone.bounds);
    pushProxy(sourceBackedOwnerProxy({
      owner,
      id: zone.id,
      label: zone.label,
      category: zone.category,
      center: box.center,
      halfExtents: box.halfExtents,
      sourceRef: zone.sourceRef,
      metadata: {
        transitionZone: true
      }
    }));
  });

  return proxies;
}

export function buildLevelTwoEditorScene({ cloneAsset, placeAsset }) {
  const group = new THREE.Group();
  group.name = "Level Two Editor Scene";
  const editableObjects = [];

  addTerrain({ group, placeAsset, editableObjects });

  const loveLetter = cloneAsset("spellbookClosed");
  loveLetter.position.set(
    LEVEL_TWO_POINTS.placeholderLoveLetter.x,
    LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
    LEVEL_TWO_POINTS.placeholderLoveLetter.z
  );
  loveLetter.rotation.y = -Math.PI * 0.18;
  group.add(loveLetter);
  editableObjects.push(tagRoot(loveLetter, {
    id: "level_two.placeholder_love_letter",
    name: "Placeholder Love Letter",
    category: "goal",
    assetKey: "spellbookClosed",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "placeholderLoveLetter")
  }));

  const blueButton = createButtonGroup({
    cloneAsset,
    baseAsset: "buttonBaseBlue",
    topAsset: "buttonTopBlue"
  });
  blueButton.position.set(
    LEVEL_TWO_POINTS.blueButton.x,
    SURFACE_Y + LEVEL_TWO_BUTTON_LEDGE_TILES[0].bottomY,
    LEVEL_TWO_POINTS.blueButton.z
  );
  group.add(blueButton);
  editableObjects.push(tagRoot(blueButton, {
    id: "level_two.blue_button",
    name: "Blue Button",
    category: "button",
    assetKey: "buttonBaseBlue",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "blueButton")
  }));

  const blueRamp = cloneAsset(LEVEL_TWO_BLUE_RAMP.asset);
  blueRamp.position.set(
    LEVEL_TWO_BLUE_RAMP.position.x,
    SURFACE_Y,
    LEVEL_TWO_BLUE_RAMP.position.z
  );
  blueRamp.rotation.y = LEVEL_TWO_BLUE_RAMP.rotationY;
  if (LEVEL_TWO_BLUE_RAMP.visualScale) {
    blueRamp.scale.set(
      LEVEL_TWO_BLUE_RAMP.visualScale.x,
      LEVEL_TWO_BLUE_RAMP.visualScale.y,
      LEVEL_TWO_BLUE_RAMP.visualScale.z
    );
  }
  group.add(blueRamp);
  editableObjects.push(tagRoot(blueRamp, {
    id: "level_two.blue_ramp",
    name: "Blue Ramp",
    category: "ramp",
    assetKey: LEVEL_TWO_BLUE_RAMP.asset,
    sourceRef: sourceRef("LEVEL_TWO_BLUE_RAMP", "position")
  }));

  const dormantPanel = LEVEL_TWO_BLUE_RAMP.dormantPanel;
  if (dormantPanel) {
    const blueRampDormantPanel = new THREE.Mesh(
      new THREE.BoxGeometry(dormantPanel.width, dormantPanel.height, dormantPanel.depth),
      new THREE.MeshStandardMaterial({
        color: dormantPanel.color,
        emissive: dormantPanel.color,
        emissiveIntensity: 0.08,
        roughness: 0.58,
        metalness: 0.04,
        transparent: true,
        opacity: dormantPanel.opacity,
        depthWrite: false
      })
    );
    blueRampDormantPanel.position.set(dormantPanel.position.x, dormantPanel.y, dormantPanel.position.z);
    group.add(blueRampDormantPanel);
    editableObjects.push(tagRoot(blueRampDormantPanel, {
      id: "level_two.blue_ramp_dormant_panel",
      name: "Blue Ramp Dormant Panel",
      category: "mechanism_visual",
      assetKey: "generated-blue-ramp-dormant-panel",
      readOnly: true,
      transformLocked: true,
      sourceRef: sourceRef("LEVEL_TWO_BLUE_RAMP", "dormantPanel")
    }));
  }

  const elephantEcho = cloneAsset("elephant");
  elephantEcho.position.set(
    LEVEL_TWO_POINTS.elephantEcho.x,
    LEVEL_TWO_POINTS.elephantEcho.y ?? LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
    LEVEL_TWO_POINTS.elephantEcho.z
  );
  applyMaterialPatch(elephantEcho, {
    color: LEVEL_TWO_ELEPHANT_ECHO_TINT,
    opacity: LEVEL_TWO_ELEPHANT_ECHO_OPACITY
  });
  group.add(elephantEcho);
  editableObjects.push(tagRoot(elephantEcho, {
    id: "level_two.elephant_echo",
    name: "Elephant Echo",
    category: "elephant_echo",
    assetKey: "elephant",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "elephantEcho")
  }));

  const elephantTotem = cloneAsset("elephant");
  elephantTotem.scale.multiplyScalar(LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE);
  elephantTotem.position.set(
    LEVEL_TWO_POINTS.elephantTotem.x,
    LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.9,
    LEVEL_TWO_POINTS.elephantTotem.z
  );
  applyMaterialPatch(elephantTotem, {
    color: 0xffd76a,
    emissive: 0xffb347,
    emissiveIntensity: 0.18
  });
  group.add(elephantTotem);
  editableObjects.push(tagRoot(elephantTotem, {
    id: "level_two.elephant_totem",
    name: "Elephant Cubeling Totem",
    category: "elephant_totem",
    assetKey: "elephant",
    sourceRef: sourceRef("LEVEL_TWO_POINTS", "elephantTotem")
  }));

  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const redButton = createButtonGroup({
      cloneAsset,
      baseAsset: button.asset,
      topAsset: button.topAsset
    });
    redButton.position.set(
      button.position.x,
      button.surfaceTopY + (button.surfaceClearance || 0),
      button.position.z
    );
    group.add(redButton);
    editableObjects.push(tagRoot(redButton, {
      id: `level_two.${button.id}`,
      name: button.id === "red-button-b" ? "Red Button B" : "Red Button A",
      category: "red_button",
      assetKey: button.asset,
      sourceRef: sourceRef("LEVEL_TWO_RED_BUTTONS", button.id)
    }));
  });

  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const redPlatform = cloneAsset(platform.asset);
    redPlatform.position.set(
      platform.position.x,
      platform.baseY + (platform.initialProgress ?? 0) * platform.maxLift,
      platform.position.z
    );
    group.add(redPlatform);
    editableObjects.push(tagRoot(redPlatform, {
      id: `level_two.${platform.id}`,
      name: platform.id === "red-elevator-b" ? "Red Elevator B" : "Red Elevator A",
      category: "red_platform",
      assetKey: platform.asset,
      sourceRef: sourceRef("LEVEL_TWO_RED_PLATFORMS", platform.id)
    }));
  });

  LEVEL_TWO_PROPS.forEach(([assetKey, x, z, scale], index) => {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, x, z, TILE);
    const prop = placeAsset(group, assetKey, point, {
      y: SURFACE_Y,
      rotationY: index * 0.64,
      scale
    });
    const isPhysical = /Tree|Rock|Bush/.test(assetKey);
    editableObjects.push(tagRoot(prop, {
      id: makePropId(assetKey, index),
      name: `${assetKey} ${index + 1}`,
      category: isPhysical ? "physical_prop" : "decorative_prop",
      assetKey,
      sourceRef: sourceRef("LEVEL_TWO_PROPS", `[${index}]`)
    }));
  });

  const boundsHelper = new THREE.Box3Helper(
    new THREE.Box3(
      new THREE.Vector3(-LEVEL_TWO_WIDTH * TILE * 0.5, 0, -LEVEL_TWO_HEIGHT * TILE * 0.5),
      new THREE.Vector3(LEVEL_TWO_WIDTH * TILE * 0.5, FLOOR_TARGET, LEVEL_TWO_HEIGHT * TILE * 0.5)
    ),
    0x6f8a78
  );
  boundsHelper.name = "Level bounds";
  group.add(boundsHelper);

  return {
    id: LEVEL_TWO_EDITOR_ID,
    name: "Level Two",
    group,
    editableObjects,
    colliderProxies: [
      ...buildLevelTwoMechanismColliderProxies(editableObjects),
      ...makeObjectColliderProxies(editableObjects),
      ...buildTerrainColliderProxies()
    ]
  };
}

export const levelEditorAdapter = {
  id: LEVEL_TWO_EDITOR_ID,
  name: "Level Two",
  order: 40,
  playDebugScene: LEVEL_TWO_EDITOR_ID,
  defaultSelectedId: "level_two.blue_ramp",
  buildEditorScene: buildLevelTwoEditorScene
};
