import * as THREE from "three";

import { SCENES } from "../config/scenes.js";

const tmpBox = new THREE.Box3();
const tmpPosition = new THREE.Vector3();
const tmpQuaternion = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

const SOURCE_HINTS_BY_SCENE = {
  [SCENES.TUTORIAL]: "src/scenes/tutorialScene.js or src/levels/tutorialLevel.js",
  [SCENES.HOME]: "src/scenes/homeIntroScene.js or src/levels/homeIntroLevel.js",
  [SCENES.LEVEL_ONE]: "src/scenes/levelOneScene.js or src/levels/levelOne.js",
  [SCENES.LEVEL_TWO]: "src/scenes/levelTwoScene.js or src/levels/levelTwo.js"
};

const ACTOR_SOURCE_HINTS = {
  character: "src/core/actors.js",
  frog: "src/core/actors.js",
  elephant: "src/core/actors.js",
  frog_echo: "src/core/actors.js",
  frog_totem: "src/core/actors.js",
  elephant_echo: "src/scenes/levelTwoScene.js",
  elephant_totem: "src/scenes/levelTwoScene.js"
};

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function slug(value) {
  return String(value || "object")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "object";
}

function scenePrefixFor(sceneId) {
  if (sceneId === SCENES.HOME) return "home";
  if (sceneId === SCENES.LEVEL_ONE) return "levelOne";
  if (sceneId === SCENES.LEVEL_TWO) return "levelTwo";
  return "tutorial";
}

function arrayFromVector3(vector, digits = 3) {
  return [round(vector.x, digits), round(vector.y, digits), round(vector.z, digits)];
}

function arrayFromEuler(euler, digits = 3) {
  return [round(euler.x, digits), round(euler.y, digits), round(euler.z, digits)];
}

function arrayFromQuaternion(quaternion, digits = 4) {
  return [
    round(quaternion.x, digits),
    round(quaternion.y, digits),
    round(quaternion.z, digits),
    round(quaternion.w, digits)
  ];
}

function inferAsset(object, scenePrefix) {
  const key = object.userData.devEditorAsset ||
    object.userData.homeAsset ||
    object.userData.levelOneAsset ||
    object.userData.levelTwoAsset ||
    object.userData.levelTwoTier ||
    object.userData.levelTwoZone ||
    (typeof object.userData[`${scenePrefix}Asset`] === "string" ? object.userData[`${scenePrefix}Asset`] : "");

  return {
    key: key || "",
    path: object.userData.devEditorAssetPath || "",
    source: key ? "runtime-userData" : "unknown"
  };
}

function inferCategory(object, assetKey) {
  if (object.userData.devEditorCategory) return object.userData.devEditorCategory;
  if (object.userData.homeAsset?.startsWith("home") || /house|home/i.test(assetKey)) return "house";
  if (/button/i.test(assetKey)) return "button";
  if (/bridge/i.test(assetKey)) return "bridge";
  if (/ramp/i.test(assetKey)) return "ramp";
  if (/elevator|platform/i.test(assetKey)) return "platform";
  if (/tree/i.test(assetKey)) return "tree";
  if (/rock/i.test(assetKey)) return "rock";
  if (/bush/i.test(assetKey)) return "bush";
  if (/love|spellbook/i.test(assetKey)) return "love_letter";
  if (/echo/i.test(assetKey)) return "echo";
  if (/totem/i.test(assetKey)) return "totem";
  return "prop";
}

function inferType(object, category) {
  if (/character|frog|elephant/.test(category)) return "actor";
  if (/echo|totem/.test(category)) return "marker";
  if (/button|platform|ramp/.test(category)) return "mechanism";
  if (object.isGroup) return "group";
  if (object.isMesh || object.isSkinnedMesh) return "mesh";
  return object.type || "object";
}

function inferCollisionExpected(object, category, assetKey) {
  if (object.userData.devEditorCollisionExpected !== undefined) {
    return Boolean(object.userData.devEditorCollisionExpected);
  }
  if (
    category === "button" ||
    category === "bridge" ||
    category === "house" ||
    category === "tree" ||
    category === "rock" ||
    category === "bush" ||
    category === "platform" ||
    category === "ramp" ||
    /love|spellbook/i.test(assetKey || "")
  ) {
    return true;
  }
  return /character|frog|elephant/.test(category);
}

function shouldSkipObject(object) {
  return Boolean(
    object.userData.devEditorHelper ||
    object.userData.homeTile ||
    object.userData.levelOneTile ||
    object.userData.levelTwoTile ||
    object.userData.levelOneWater
  );
}

function makeStableId(sceneId, object, category, counters, seen) {
  const existing = object.userData.devEditorId;
  if (existing) {
    const base = String(existing).includes(".") ? String(existing) : `${sceneId}.${slug(existing)}`;
    if (!seen.has(base)) {
      seen.add(base);
      return base;
    }
  }

  const base = `${sceneId}.${slug(category)}`;
  counters[base] = (counters[base] || 0) + 1;
  let candidate = `${base}.${counters[base]}`;
  if (seen.has(candidate)) candidate = `${candidate}.${object.uuid.slice(0, 8)}`;
  seen.add(candidate);
  if (!object.userData.devEditorId) object.userData.devEditorId = candidate;
  return candidate;
}

function visualBoundsFor(object) {
  object.updateWorldMatrix(true, true);
  tmpBox.setFromObject(object);
  if (tmpBox.isEmpty()) {
    object.getWorldPosition(tmpPosition);
    tmpBox.setFromCenterAndSize(tmpPosition, new THREE.Vector3(0, 0, 0));
  }
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  tmpBox.getCenter(center);
  tmpBox.getSize(size);
  return {
    min: arrayFromVector3(tmpBox.min),
    max: arrayFromVector3(tmpBox.max),
    center: arrayFromVector3(center),
    size: arrayFromVector3(size)
  };
}

function transformFor(object) {
  object.updateWorldMatrix(true, true);
  object.matrixWorld.decompose(tmpPosition, tmpQuaternion, tmpScale);
  return {
    local: {
      position: arrayFromVector3(object.position),
      rotationEuler: arrayFromEuler(object.rotation),
      rotationY: round(object.rotation.y),
      quaternion: arrayFromQuaternion(object.quaternion),
      scale: arrayFromVector3(object.scale)
    },
    world: {
      position: arrayFromVector3(tmpPosition),
      quaternion: arrayFromQuaternion(tmpQuaternion),
      scale: arrayFromVector3(tmpScale)
    }
  };
}

function sourceHintFor(sceneId, object, category) {
  return object.userData.devEditorSource ||
    object.userData.sourceFileHint ||
    ACTOR_SOURCE_HINTS[category] ||
    SOURCE_HINTS_BY_SCENE[sceneId] ||
    "src/main.js";
}

function colliderCenterX(collider) {
  return Array.isArray(collider.center) ? collider.center[0] : collider.x;
}

function colliderCenterZ(collider) {
  return Array.isArray(collider.center) ? collider.center[2] : collider.z;
}

function colliderMatchesEntity(collider, entity) {
  const label = String(collider.label || collider.id || "").toLowerCase();
  const idWithoutScene = String(entity.id || "").replace(`${entity.sceneId}.`, "");
  const tokens = [
    idWithoutScene,
    entity.name,
    entity.category,
    entity.asset?.key
  ].flatMap((value) => String(value || "").toLowerCase().split(/[^a-z0-9]+/))
    .filter((value) =>
      value.length > 2 &&
      !["tutorial", "home", "intro", "level", "one", "two", "prop", "mesh", "object"].includes(value)
    );

  if (tokens.some((token) => label.includes(token))) return true;

  const bounds = entity.bounds?.visualAabb;
  if (!bounds) return false;
  const x = colliderCenterX(collider);
  const z = colliderCenterZ(collider);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  return x >= bounds.min[0] - 0.35 &&
    x <= bounds.max[0] + 0.35 &&
    z >= bounds.min[2] - 0.35 &&
    z <= bounds.max[2] + 0.35;
}

function compactCollider(collider) {
  return {
    id: collider.id || collider.label || "",
    label: collider.label || collider.id || "",
    type: collider.type || "aabb2d",
    source: collider.source || "runtime",
    center: collider.center || [round(collider.x), round(collider.y || 0), round(collider.z)],
    halfExtents: collider.halfExtents || [round(collider.halfX), round(collider.halfY || 0), round(collider.halfZ)],
    active: collider.active !== false,
    sourceFileHint: collider.sourceFileHint || ""
  };
}

function makeEntity({ sceneId, object, category, fallbackName, asset, collisionExpected, counters, seen, colliderEntries }) {
  const id = makeStableId(sceneId, object, category, counters, seen);
  const resolvedAsset = asset || inferAsset(object, scenePrefixFor(sceneId));
  const name = object.userData.devEditorName || fallbackName || object.name || id;
  const resolvedCategory = category || inferCategory(object, resolvedAsset.key);
  const collision = collisionExpected === undefined
    ? inferCollisionExpected(object, resolvedCategory, resolvedAsset.key)
    : Boolean(collisionExpected);

  const entity = {
    id,
    sceneId,
    name,
    type: inferType(object, resolvedCategory),
    category: resolvedCategory,
    asset: resolvedAsset,
    object,
    mesh: object,
    runtime: {
      uuid: object.uuid,
      visible: object.visible,
      parentName: object.parent?.name || "",
      childCount: object.children?.length || 0
    },
    transform: transformFor(object),
    bounds: {
      visualAabb: visualBoundsFor(object)
    },
    collision: {
      expected: collision,
      colliders: []
    },
    notes: {
      orientation: {
        worldUp: "+Y",
        movementPlane: "X/Z",
        rotationUnits: "radians"
      },
      sourceFileHint: sourceHintFor(sceneId, object, resolvedCategory)
    },
    sourceFileHint: sourceHintFor(sceneId, object, resolvedCategory)
  };

  entity.collision.colliders = (colliderEntries || [])
    .filter((collider) => colliderMatchesEntity(collider, entity))
    .slice(0, 8)
    .map(compactCollider);

  return entity;
}

export function collectDevEntities({ state, getSceneMeshes, getSceneColliderDebugEntries }) {
  const sceneId = state.scene.id;
  const scenePrefix = scenePrefixFor(sceneId);
  const colliderEntries = typeof getSceneColliderDebugEntries === "function"
    ? getSceneColliderDebugEntries()
    : [];
  const seen = new Set();
  const counters = {};
  const entities = [];
  const meshSeen = new Set();

  const push = (object, category, fallbackName, asset, collisionExpected) => {
    if (!object || meshSeen.has(object.uuid) || shouldSkipObject(object)) return;
    const resolvedAsset = asset || inferAsset(object, scenePrefix);
    const resolvedCategory = category || inferCategory(object, resolvedAsset.key || object.userData.devEditorCategory || "prop");
    entities.push(makeEntity({
      sceneId,
      object,
      category: resolvedCategory,
      fallbackName,
      asset: resolvedAsset,
      collisionExpected,
      counters,
      seen,
      colliderEntries
    }));
    meshSeen.add(object.uuid);
  };

  const { actorMeshes, markers, arrays } = getSceneMeshes();
  if (actorMeshes?.human) push(actorMeshes.human, "character", "Human Character", inferAsset(actorMeshes.human, scenePrefix), true);
  if (actorMeshes?.frog) push(actorMeshes.frog, "frog", "Frog Cubeling", inferAsset(actorMeshes.frog, scenePrefix), true);
  if (actorMeshes?.elephant && actorMeshes.elephant.visible) {
    push(actorMeshes.elephant, "elephant", "Elephant Cubeling", inferAsset(actorMeshes.elephant, scenePrefix), true);
  }

  (markers || []).forEach((object) => {
    if (!object || shouldSkipObject(object)) return;
    const asset = inferAsset(object, scenePrefix);
    const category = inferCategory(object, asset.key);
    push(object, category, object.userData.devEditorName || object.name || category, asset, inferCollisionExpected(object, category, asset.key));
  });

  (arrays || []).forEach((collection) => {
    (collection || []).forEach((object) => {
      if (!object || shouldSkipObject(object)) return;
      const asset = inferAsset(object, scenePrefix);
      if (!asset.key && !object.userData.devEditorCategory) return;
      const category = inferCategory(object, asset.key || object.userData.devEditorCategory || "prop");
      push(object, category, object.name || category, asset, inferCollisionExpected(object, category, asset.key));
    });
  });

  return entities;
}

export function findDevEntityById(devEntities, id) {
  return (devEntities || []).find((entity) => entity.id === id) || null;
}

export function getDevEntityRoot(object, devEntities) {
  let current = object;
  while (current) {
    if (current.userData?.devEditorHelper) return null;
    const match = (devEntities || []).find((entity) => entity.object === current || entity.mesh === current);
    if (match) return match.object;
    current = current.parent;
  }
  return null;
}

export function findDevEntityForObject(object, devEntities) {
  const root = getDevEntityRoot(object, devEntities);
  if (!root) return null;
  return (devEntities || []).find((entity) => entity.object === root || entity.mesh === root) || null;
}

export function assignDevEditorIdentity(object, identity) {
  if (!object || !identity) return object;
  Object.entries(identity).forEach(([key, value]) => {
    if (value !== undefined) object.userData[key] = value;
  });
  return object;
}

export function normalizeDevEntity(entity) {
  if (!entity) return null;
  const { object, mesh, ...serializable } = entity;
  return serializable;
}

export function entityDistance2D(a, b) {
  const ax = a?.transform?.world?.position?.[0];
  const az = a?.transform?.world?.position?.[2];
  const bx = b?.transform?.world?.position?.[0];
  const bz = b?.transform?.world?.position?.[2];
  if (![ax, az, bx, bz].every(Number.isFinite)) return Infinity;
  return Math.hypot(ax - bx, az - bz);
}
