import * as THREE from "three";

export function createBlueButtonMarker({ cloneAsset, point, surfaceY, topRestY }) {
  const buttonGroup = new THREE.Group();
  const base = cloneAsset("buttonBaseBlue");
  const top = cloneAsset("buttonTopBlue");

  buttonGroup.userData.devEditorCategory = "button";
  buttonGroup.userData.devEditorId = "button";
  buttonGroup.userData.devEditorName = "Red Button";
  buttonGroup.userData.devEditorAsset = "kaykit-platformer-button-blue";

  top.position.y = topRestY;
  buttonGroup.position.set(point.x, surfaceY, point.z);
  buttonGroup.add(base, top);
  buttonGroup.visible = false;

  return { buttonGroup, base, top };
}
