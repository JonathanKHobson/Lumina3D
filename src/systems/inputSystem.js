import { MOVE_KEYS } from "../config/constants.js";
import { cameraRelativeDir } from "./cameraSystem.js";

export function createInputState() {
  return { keys: new Set() };
}

export function isMoveKey(code) {
  return Boolean(MOVE_KEYS[code]);
}

export function captureMoveKeyDown(input, event) {
  if (!isMoveKey(event.code)) return false;
  event.preventDefault();
  input.keys.add(event.code);
  return true;
}

export function captureMoveKeyUp(input, event) {
  if (!isMoveKey(event.code)) return false;
  event.preventDefault();
  input.keys.delete(event.code);
  return true;
}

export function inputVectorFromKeys(input, cameraYaw) {
  let x = 0;
  let z = 0;
  if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) x -= 1;
  if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) x += 1;
  if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) z -= 1;
  if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) z += 1;
  const length = Math.hypot(x, z);
  if (length <= 0) return { x: 0, z: 0 };
  return cameraRelativeDir(x / length, z / length, cameraYaw);
}
