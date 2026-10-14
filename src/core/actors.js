import * as THREE from "three";
import { applyTotemModelMaterial, applyTransparentModel } from "./modelMaterials.js";

export function buildActorMeshes({
  scene,
  assetCache,
  cloneAsset,
  actorMeshes,
  markerMeshes,
  animation,
  frogEchoTint,
  frogEchoOpacity,
  frogTotemVisualScale,
  onPlayIdle
}) {
  const player = assetCache.get("player");
  actorMeshes.human = player.object;
  actorMeshes.human.userData.devEditorCategory = "character";
  actorMeshes.human.userData.devEditorId = "human";
  actorMeshes.human.userData.devEditorName = "Human Character";
  actorMeshes.human.userData.devEditorAsset = "kaykit-platformer-character";
  actorMeshes.human.visible = true;
  actorMeshes.human.name = "KayKit platformer character";

  actorMeshes.frog = cloneAsset("frog");
  actorMeshes.frog.userData.devEditorCategory = "frog";
  actorMeshes.frog.userData.devEditorId = "frog";
  actorMeshes.frog.userData.devEditorAsset = "frog";
  actorMeshes.frog.name = "Frog Cubeling";

  actorMeshes.elephant = cloneAsset("elephant");
  actorMeshes.elephant.userData.devEditorCategory = "elephant";
  actorMeshes.elephant.userData.devEditorId = "elephant";
  actorMeshes.elephant.userData.devEditorAsset = "elephant";
  actorMeshes.elephant.name = "Elephant Cubeling";
  actorMeshes.elephant.visible = false;

  actorMeshes.crocodile = createGeneratedCrocodileActor();
  actorMeshes.crocodile.userData.devEditorCategory = "crocodile";
  actorMeshes.crocodile.userData.devEditorId = "crocodile";
  actorMeshes.crocodile.userData.devEditorAsset = "generated-crocodile-cubeling-temporary";
  actorMeshes.crocodile.userData.devEditorName = "Crocodile Cubeling";
  actorMeshes.crocodile.userData.devEditorDisplayName = "Crocodile Cubeling";
  actorMeshes.crocodile.name = "Crocodile Cubeling";
  actorMeshes.crocodile.visible = false;

  markerMeshes.frogEcho = cloneAsset("frog");
  markerMeshes.frogEcho.userData.devEditorCategory = "frog_echo";
  markerMeshes.frogEcho.userData.devEditorId = "frog_echo";
  markerMeshes.frogEcho.userData.devEditorAsset = "frog";
  markerMeshes.frogEcho.name = "Frog Echo";
  applyTransparentModel(markerMeshes.frogEcho, frogEchoTint, frogEchoOpacity);

  markerMeshes.frogTotem = cloneAsset("frog");
  markerMeshes.frogTotem.userData.devEditorCategory = "frog_totem";
  markerMeshes.frogTotem.userData.devEditorId = "frog_totem";
  markerMeshes.frogTotem.userData.devEditorAsset = "frog";
  markerMeshes.frogTotem.name = "Frog Cubeling Totem";
  markerMeshes.frogTotem.scale.multiplyScalar(frogTotemVisualScale);
  applyTotemModelMaterial(markerMeshes.frogTotem);

  scene.add(actorMeshes.human, actorMeshes.frog, actorMeshes.elephant, actorMeshes.crocodile, markerMeshes.frogEcho, markerMeshes.frogTotem);

  animation.humanMixer = new THREE.AnimationMixer(actorMeshes.human);
  player.animations.forEach((clip) => {
    animation.actions[clip.name] = animation.humanMixer.clipAction(clip);
  });
  onPlayIdle();
}

function createGeneratedCrocodileActor() {
  const group = new THREE.Group();
  group.name = "Crocodile Cubeling";

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f9a5c,
    roughness: 0.74,
    metalness: 0.01
  });
  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: 0xa8d48c,
    roughness: 0.78,
    metalness: 0.01
  });
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f6e43,
    roughness: 0.72,
    metalness: 0.01
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f0d4,
    roughness: 0.42,
    metalness: 0.01
  });
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x203323,
    roughness: 0.4,
    metalness: 0.01
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.92, 6, 16), bodyMaterial);
  body.name = "Crocodile Cubeling Body";
  body.rotation.z = Math.PI / 2;
  body.scale.set(1.1, 0.72, 0.58);
  body.position.y = 0.38;
  body.castShadow = true;
  body.receiveShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.25, 0.42), bodyMaterial);
  snout.name = "Crocodile Cubeling Snout";
  snout.position.set(0.74, 0.39, 0);
  snout.castShadow = true;
  snout.receiveShadow = true;

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.05, 0.36), bellyMaterial);
  belly.name = "Crocodile Cubeling Belly";
  belly.position.set(0.05, 0.17, 0);
  belly.castShadow = true;
  belly.receiveShadow = true;

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.58, 12), detailMaterial);
  tail.name = "Crocodile Cubeling Tail";
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.82, 0.37, 0);
  tail.castShadow = true;
  tail.receiveShadow = true;

  [-0.23, 0.23].forEach((zOffset) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), eyeMaterial);
    eye.name = "Crocodile Cubeling Eye";
    eye.position.set(0.92, 0.55, zOffset);
    eye.castShadow = true;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), pupilMaterial);
    pupil.name = "Crocodile Cubeling Pupil";
    pupil.position.set(0.065, 0.01, 0);
    eye.add(pupil);
    group.add(eye);
  });

  [-0.42, -0.12, 0.18].forEach((xOffset) => {
    const bump = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 6), detailMaterial);
    bump.name = "Crocodile Cubeling Back Bump";
    bump.scale.set(1, 0.55, 0.85);
    bump.position.set(xOffset, 0.69, 0);
    bump.castShadow = true;
    group.add(bump);
  });

  group.add(body, snout, belly, tail);
  group.scale.setScalar(0.92);
  return group;
}
