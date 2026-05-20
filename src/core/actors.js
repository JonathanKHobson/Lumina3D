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

  scene.add(actorMeshes.human, actorMeshes.frog, actorMeshes.elephant, markerMeshes.frogEcho, markerMeshes.frogTotem);

  animation.humanMixer = new THREE.AnimationMixer(actorMeshes.human);
  player.animations.forEach((clip) => {
    animation.actions[clip.name] = animation.humanMixer.clipAction(clip);
  });
  onPlayIdle();
}
