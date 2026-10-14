import * as THREE from "three";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_MIN_ZOOM = 0.45;
const DEFAULT_MAX_ZOOM = 4;
const DEFAULT_PAN_STEP = 1.2;
const DEFAULT_YAW_STEP = Math.PI / 24;
const DEFAULT_PITCH_STEP = Math.PI / 36;
const DEFAULT_ZOOM_STEP = 1.15;
const DEFAULT_MIN_PITCH = 0.22;
const DEFAULT_MAX_PITCH = 1.24;

function round(value) {
  return Number(value.toFixed(3));
}

export class EditorCameraController {
  constructor({
    camera,
    offset,
    target = new THREE.Vector3(),
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    panStep = DEFAULT_PAN_STEP,
    yawStep = DEFAULT_YAW_STEP,
    pitchStep = DEFAULT_PITCH_STEP,
    minPitch = DEFAULT_MIN_PITCH,
    maxPitch = DEFAULT_MAX_PITCH,
    zoomStep = DEFAULT_ZOOM_STEP
  }) {
    this.camera = camera;
    this.defaultOffset = offset.clone();
    this.target = target.clone();
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.panStep = panStep;
    this.yawStep = yawStep;
    this.pitchStep = pitchStep;
    this.minPitch = minPitch;
    this.maxPitch = maxPitch;
    this.zoomStep = zoomStep;
    this.horizontalDistance = Math.hypot(offset.x, offset.z);
    this.distance = offset.length();
    this.defaultYaw = Math.atan2(offset.x, offset.z);
    this.defaultPitch = Math.atan2(offset.y, this.horizontalDistance);
    this.yaw = this.defaultYaw;
    this.pitch = this.defaultPitch;
    this.zoom = THREE.MathUtils.clamp(camera.zoom || 1, this.minZoom, this.maxZoom);
    this.isNavigating = false;
    this.apply();
  }

  apply() {
    const horizontalDistance = Math.cos(this.pitch) * this.distance;
    const height = Math.sin(this.pitch) * this.distance;
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * horizontalDistance,
      height,
      Math.cos(this.yaw) * horizontalDistance
    );
    this.camera.position.copy(this.target).add(offset);
    this.camera.up.copy(WORLD_UP);
    this.camera.lookAt(this.target);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }

  frameTarget(target) {
    this.target.copy(target);
    this.apply();
  }

  reset(target = new THREE.Vector3()) {
    this.target.copy(target);
    this.yaw = this.defaultYaw;
    this.pitch = this.defaultPitch;
    this.zoom = 1;
    this.apply();
  }

  pan({ forward = 0, right = 0, multiplier = 1 } = {}) {
    if (!forward && !right) return;
    const distance = (this.panStep * multiplier) / this.zoom;
    const forwardVector = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rightVector = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.target.addScaledVector(forwardVector, forward * distance);
    this.target.addScaledVector(rightVector, right * distance);
    this.apply();
  }

  rotateYaw(direction, multiplier = 1) {
    if (!direction) return;
    this.yaw += direction * this.yawStep * multiplier;
    this.apply();
  }

  tiltPitch(direction, multiplier = 1) {
    if (!direction) return;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch + direction * this.pitchStep * multiplier,
      this.minPitch,
      this.maxPitch
    );
    this.apply();
  }

  zoomBy(factor) {
    const nextZoom = THREE.MathUtils.clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    if (nextZoom === this.zoom) return;
    this.zoom = nextZoom;
    this.apply();
  }

  zoomIn() {
    this.zoomBy(this.zoomStep);
  }

  zoomOut() {
    this.zoomBy(1 / this.zoomStep);
  }

  wheelZoom(deltaY) {
    this.zoomBy(Math.exp(-deltaY * 0.001));
  }

  setNavigating(value) {
    this.isNavigating = Boolean(value);
  }

  state() {
    return {
      target: {
        x: round(this.target.x),
        y: round(this.target.y),
        z: round(this.target.z)
      },
      yaw: round(this.yaw),
      pitch: round(this.pitch),
      zoom: round(this.zoom),
      isNavigating: this.isNavigating
    };
  }
}
