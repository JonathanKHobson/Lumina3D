import * as THREE from "three";

export function createGameRenderer(canvas, devicePixelRatio = window.devicePixelRatio || 1) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function createGameCamera() {
  return new THREE.OrthographicCamera(-14, 14, 10, -10, 0.1, 160);
}

export function setupSceneLights(scene) {
  scene.add(new THREE.HemisphereLight(0xf4ffe8, 0x789072, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.8);
  sun.position.set(7, 13, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  scene.add(sun);
}
