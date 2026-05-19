import * as THREE from "three";
import { CAMERA_FOLLOW_EASE, CAMERA_ROTATE_STEP, CAMERA_YAW_EASE, SURFACE_Y } from "../config/constants.js";

const cameraOffset = new THREE.Vector3(9.5, 11.5, 12.5);
const cameraYawAxis = new THREE.Vector3(0, 1, 0);

// Smooth-follow lerp target — owned here, not game state
const cameraTarget = new THREE.Vector3(0, 0, 0);

function normalizeAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function lerpAngle(from, to, t) {
  return normalizeAngle(from + normalizeAngle(to - from) * t);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function resetCameraTarget() {
  cameraTarget.set(0, 0, 0);
}

export function applyCameraUpdate(camera, state, dt, activeActor, bounds) {
  const desiredTarget = new THREE.Vector3(
    clamp(activeActor.x, bounds.minX + 4.5, bounds.maxX - 4.5),
    SURFACE_Y,
    clamp(activeActor.z, bounds.minZ + 3.5, bounds.maxZ - 3.5)
  );
  const follow = dt >= 1 ? 1 : 1 - Math.pow(CAMERA_FOLLOW_EASE, dt);
  const yawFollow = dt >= 1 ? 1 : 1 - Math.pow(CAMERA_YAW_EASE, dt);
  state.cameraYaw = lerpAngle(state.cameraYaw, state.targetCameraYaw, yawFollow);
  cameraTarget.lerp(desiredTarget, follow);
  const orbitYaw = state.celebration.active
    ? state.cameraYaw + state.celebration.elapsed * 0.36
    : state.cameraYaw;
  const rotatedOffset = cameraOffset.clone().applyAxisAngle(cameraYawAxis, orbitYaw);
  camera.position.copy(cameraTarget).add(rotatedOffset);
  camera.lookAt(cameraTarget);
}

export function stepCameraYaw(state, direction) {
  state.targetCameraYaw = normalizeAngle(state.targetCameraYaw + direction * CAMERA_ROTATE_STEP);
}

export function cameraRelativeDir(inputX, inputZ, cameraYaw) {
  const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(cameraYawAxis, cameraYaw);
  const up = new THREE.Vector3(0, 0, -1).applyAxisAngle(cameraYawAxis, cameraYaw);
  const wx = right.x * inputX + up.x * -inputZ;
  const wz = right.z * inputX + up.z * -inputZ;
  const len = Math.hypot(wx, wz);
  return len > 0 ? { x: wx / len, z: wz / len } : { x: 0, z: 0 };
}

export function getCameraFacingDirection(camera, human) {
  const dx = camera.position.x - human.x;
  const dz = camera.position.z - human.z;
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length, name: "camera" };
}
