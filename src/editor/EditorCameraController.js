import * as THREE from "three";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_MIN_ZOOM = 0.45;
const DEFAULT_MAX_ZOOM = 4;
const DEFAULT_PAN_STEP = 1.2;
const DEFAULT_YAW_STEP = Math.PI / 24;
const DEFAULT_ZOOM_STEP = 1.15;

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
    zoomStep = DEFAULT_ZOOM_STEP
  }) {
    this.camera = camera;
    this.defaultOffset = offset.clone();
    this.target = target.clone();
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.panStep = panStep;
    this.yawStep = yawStep;
    this.zoomStep = zoomStep;
    this.horizontalDistance = Math.hypot(offset.x, offset.z);
    this.height = offset.y;
    this.defaultYaw = Math.atan2(offset.x, offset.z);
    this.yaw = this.defaultYaw;
    this.zoom = THREE.MathUtils.clamp(camera.zoom || 1, this.minZoom, this.maxZoom);
    this.isNavigating = false;
    this.apply();
  }

  apply() {
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * this.horizontalDistance,
      this.height,
      Math.cos(this.yaw) * this.horizontalDistance
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
      zoom: round(this.zoom),
      isNavigating: this.isNavigating
    };
  }
}
