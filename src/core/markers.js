import * as THREE from "three";

export function setupMarkerMeshes(scene, markerMeshes) {
  const activeRing = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.84, 40),
    new THREE.MeshBasicMaterial({ color: 0xfff0a3, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  activeRing.rotation.x = -Math.PI / 2;
  markerMeshes.active = activeRing;
  scene.add(activeRing);

  const jumpShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 32),
    new THREE.MeshBasicMaterial({ color: 0x1e3326, transparent: true, opacity: 0, depthWrite: false })
  );
  jumpShadow.rotation.x = -Math.PI / 2;
  jumpShadow.visible = false;
  markerMeshes.jumpShadow = jumpShadow;
  scene.add(jumpShadow);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.88, 36),
    new THREE.MeshBasicMaterial({ color: 0xffe58a, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
  );
  glow.rotation.x = -Math.PI / 2;
  markerMeshes.rewardGlow = glow;
  scene.add(glow);

  const echoCircle = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.06, 48),
    new THREE.MeshBasicMaterial({ color: 0x9fad9f, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
  );
  echoCircle.rotation.x = -Math.PI / 2;
  echoCircle.visible = false;
  markerMeshes.frogEchoCircle = echoCircle;
  scene.add(echoCircle);

  const totemGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.56, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe486, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
  );
  totemGlow.rotation.x = -Math.PI / 2;
  totemGlow.visible = false;
  markerMeshes.frogTotemGlow = totemGlow;
  scene.add(totemGlow);
}
