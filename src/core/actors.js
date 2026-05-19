import * as THREE from "three";

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

  scene.add(actorMeshes.human, actorMeshes.frog, markerMeshes.frogEcho, markerMeshes.frogTotem);

  animation.humanMixer = new THREE.AnimationMixer(actorMeshes.human);
  player.animations.forEach((clip) => {
    animation.actions[clip.name] = animation.humanMixer.clipAction(clip);
  });
  onPlayIdle();
}

function applyTransparentModel(object, color, opacity) {
  object.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.04,
      transparent: true,
      opacity,
      roughness: 0.9,
      metalness: 0,
      depthWrite: false
    });
  });
}

function applyTotemModelMaterial(object) {
  object.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.castShadow = true;
    child.receiveShadow = false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = materials.map((material) => {
      const next = material.clone();
      if (next.color) next.color.lerp(new THREE.Color(0xffe486), 0.48);
      if (next.emissive) next.emissive.set(0xffd05c).multiplyScalar(0.28);
      next.needsUpdate = true;
      return next;
    });
    child.material = Array.isArray(child.material) ? cloned : cloned[0];
  });
}
