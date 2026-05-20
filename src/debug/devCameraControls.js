import * as THREE from "three";

import { SURFACE_Y } from "../config/constants.js";

const MOVE_SPEED = 10;
const TURN_SPEED = 1.65;
const PITCH_SPEED = 1.15;
const ZOOM_SPEED = 1.35;
const WHEEL_ZOOM_STEP = 0.0018;
const MIN_PITCH = 0.18;
const MAX_PITCH = 1.32;
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 3.75;

const tmpForward = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpPlanarForward = new THREE.Vector3();

const KEY_BINDINGS = {
  KeyW: "forward",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  KeyQ: "yawLeft",
  KeyE: "yawRight",
  KeyR: "pitchUp",
  KeyF: "pitchDown",
  Minus: "zoomOut",
  NumpadSubtract: "zoomOut",
  Equal: "zoomIn",
  NumpadAdd: "zoomIn",
  ShiftLeft: "fast",
  ShiftRight: "fast",
  AltLeft: "slow",
  AltRight: "slow"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function ensureStore(state) {
  if (!state.devEditor.debugCamera) {
    state.devEditor.debugCamera = {
      active: false,
      sceneId: "",
      target: [0, SURFACE_Y, 0],
      yaw: 0,
      pitch: 0.68,
      distance: 19.5,
      zoom: 1,
      restoreZoom: 1,
      keys: {}
    };
  }
  if (!state.devEditor.debugCamera.keys) state.devEditor.debugCamera.keys = {};
  return state.devEditor.debugCamera;
}

function inferTargetFromCamera(camera, fallbackActor) {
  tmpForward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const denominator = tmpForward.y;
  if (Math.abs(denominator) > 0.0001) {
    const distanceToSurface = (SURFACE_Y - camera.position.y) / denominator;
    if (Number.isFinite(distanceToSurface) && distanceToSurface > 0) {
      return tmpTarget.copy(camera.position).addScaledVector(tmpForward, distanceToSurface);
    }
  }
  return tmpTarget.set(fallbackActor?.x || 0, SURFACE_Y, fallbackActor?.z || 0);
}

function seedFromCamera(store, camera, fallbackActor, sceneId) {
  inferTargetFromCamera(camera, fallbackActor);
  tmpOffset.copy(camera.position).sub(tmpTarget);
  const horizontal = Math.hypot(tmpOffset.x, tmpOffset.z);
  const distance = Math.max(4, tmpOffset.length());
  store.active = true;
  store.sceneId = sceneId || "";
  store.target = [round(tmpTarget.x), round(tmpTarget.y), round(tmpTarget.z)];
  store.yaw = Math.atan2(tmpOffset.x, tmpOffset.z);
  store.pitch = clamp(Math.atan2(tmpOffset.y, Math.max(0.001, horizontal)), MIN_PITCH, MAX_PITCH);
  store.distance = distance;
  store.zoom = clamp(camera.zoom || 1, MIN_ZOOM, MAX_ZOOM);
}

function applyCamera(store, camera) {
  const target = store.target || [0, SURFACE_Y, 0];
  const distance = Math.max(4, store.distance || 19.5);
  const pitch = clamp(store.pitch || 0.68, MIN_PITCH, MAX_PITCH);
  const yaw = store.yaw || 0;
  const horizontal = Math.cos(pitch) * distance;
  const y = Math.sin(pitch) * distance;

  tmpTarget.set(target[0] || 0, target[1] || SURFACE_Y, target[2] || 0);
  camera.position.set(
    tmpTarget.x + Math.sin(yaw) * horizontal,
    tmpTarget.y + y,
    tmpTarget.z + Math.cos(yaw) * horizontal
  );
  camera.lookAt(tmpTarget);
  camera.zoom = clamp(store.zoom || 1, MIN_ZOOM, MAX_ZOOM);
  camera.updateProjectionMatrix();
}

function updateTarget(store, dx, dz) {
  const target = store.target || [0, SURFACE_Y, 0];
  store.target = [
    round((target[0] || 0) + dx, 4),
    round(target[1] ?? SURFACE_Y, 4),
    round((target[2] || 0) + dz, 4)
  ];
}

function applyZoom(store, delta) {
  store.zoom = clamp((store.zoom || 1) * Math.exp(delta), MIN_ZOOM, MAX_ZOOM);
}

export function enterDevCamera({ state, camera, activeActor }) {
  const store = ensureStore(state);
  store.restoreZoom = camera.zoom || store.restoreZoom || 1;
  store.keys = {};
  seedFromCamera(store, camera, activeActor, state.scene?.id || "");
  applyCamera(store, camera);
}

export function exitDevCamera({ state, camera }) {
  const store = ensureStore(state);
  store.active = false;
  store.keys = {};
  camera.zoom = store.restoreZoom || 1;
  camera.updateProjectionMatrix();
}

export function handleDevCameraKeyDown(event, state) {
  if (!state?.devEditor?.open) return false;
  const action = KEY_BINDINGS[event.code];
  if (!action) return false;
  event.preventDefault();
  ensureStore(state).keys[action] = true;
  return true;
}

export function handleDevCameraKeyUp(event, state) {
  if (!state?.devEditor?.open) return false;
  const action = KEY_BINDINGS[event.code];
  if (!action) return false;
  event.preventDefault();
  ensureStore(state).keys[action] = false;
  return true;
}

export function zoomDevCameraFromWheel(event, { state, camera }) {
  if (!state?.devEditor?.open) return false;
  const store = ensureStore(state);
  if (!store.active) return false;
  event.preventDefault();
  applyZoom(store, -event.deltaY * WHEEL_ZOOM_STEP);
  applyCamera(store, camera);
  return true;
}

export function updateDevCamera({ state, camera, dt, activeActor }) {
  const store = ensureStore(state);
  if (!store.active) {
    seedFromCamera(store, camera, activeActor, state.scene?.id || "");
  } else if (store.sceneId !== state.scene?.id) {
    store.sceneId = state.scene?.id || "";
    store.target = [round(activeActor?.x || 0), SURFACE_Y, round(activeActor?.z || 0)];
  }

  const keys = store.keys || {};
  const step = Math.min(Math.max(dt || 0, 0), 0.05);
  const speedScale = keys.fast ? 2.8 : keys.slow ? 0.32 : 1;
  const moveDistance = MOVE_SPEED * speedScale * step / Math.max(0.7, store.zoom || 1);
  const yawDelta = (keys.yawRight ? 1 : 0) - (keys.yawLeft ? 1 : 0);
  const pitchDelta = (keys.pitchUp ? 1 : 0) - (keys.pitchDown ? 1 : 0);
  const zoomDelta = (keys.zoomIn ? 1 : 0) - (keys.zoomOut ? 1 : 0);

  store.yaw += yawDelta * TURN_SPEED * step;
  store.pitch = clamp((store.pitch || 0.68) + pitchDelta * PITCH_SPEED * step, MIN_PITCH, MAX_PITCH);
  if (zoomDelta) applyZoom(store, zoomDelta * ZOOM_SPEED * step);

  tmpPlanarForward.set(-Math.sin(store.yaw), 0, -Math.cos(store.yaw));
  tmpRight.set(Math.cos(store.yaw), 0, -Math.sin(store.yaw));
  const forwardDelta = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
  const rightDelta = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (forwardDelta || rightDelta) {
    const dx = tmpPlanarForward.x * forwardDelta * moveDistance + tmpRight.x * rightDelta * moveDistance;
    const dz = tmpPlanarForward.z * forwardDelta * moveDistance + tmpRight.z * rightDelta * moveDistance;
    updateTarget(store, dx, dz);
  }

  store.yaw = round(store.yaw, 5);
  store.pitch = round(store.pitch, 5);
  store.zoom = round(store.zoom, 5);
  applyCamera(store, camera);
}

export function devCameraSnapshot(state) {
  const store = ensureStore(state);
  return {
    active: Boolean(store.active),
    target: (store.target || [0, SURFACE_Y, 0]).map((value) => round(value)),
    yaw: round(store.yaw),
    pitch: round(store.pitch),
    zoom: round(store.zoom)
  };
}
