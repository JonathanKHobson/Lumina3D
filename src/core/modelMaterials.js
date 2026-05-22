import * as THREE from "three";

export function applyTransparentModel(object, color, opacity) {
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

export function applyTotemModelMaterial(object) {
  object.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.castShadow = true;
    child.receiveShadow = false;
    if (!child.material) return;
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
