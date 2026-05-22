import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { TILE } from "../config/constants.js";

export async function loadAssetRegistry({ assets, scene, assetCache }) {
  await Promise.all(Object.entries(assets).map(async ([key, def]) => {
    assetCache.set(key, def.type === "gltf" ? await loadGltfAsset(def) : await loadObjAsset(def, scene));
  }));
}

export function cloneLoadedAsset(assetCache, key) {
  const cached = assetCache.get(key);
  if (!cached) throw new Error(`Missing asset: ${key}`);
  const clone = cached.object.clone(true);
  clone.userData.runtimeAssetKey = key;
  clone.visible = true;
  clone.traverse((child) => prepareMesh(child));
  return clone;
}

export function placeLoadedAsset(assetCache, group, key, point, options = {}) {
  const mesh = cloneLoadedAsset(assetCache, key);
  mesh.position.set(point.x, options.y ?? 0, point.z);
  mesh.rotation.y = options.rotationY || 0;
  if (options.scale) mesh.scale.multiplyScalar(options.scale);
  group.add(mesh);
  return mesh;
}

async function loadObjAsset(def, scene) {
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath(def.base);
  mtlLoader.setResourcePath(def.base);
  const materials = await mtlLoader.loadAsync(`${def.stem}.mtl`);
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setPath(def.base);
  objLoader.setMaterials(materials);
  const object = await objLoader.loadAsync(`${def.stem}.obj`);
  object.traverse((child) => prepareMesh(child));

  const wrapper = new THREE.Group();
  wrapper.add(object);
  normalizeChildToWrapper(object, def);
  wrapper.visible = false;
  scene.add(wrapper);
  return { object: wrapper, animations: [] };
}

async function loadGltfAsset(def) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(def.url);
  gltf.scene.traverse((child) => prepareMesh(child));

  const wrapper = new THREE.Group();
  wrapper.add(gltf.scene);
  normalizeChildToWrapper(gltf.scene, def);
  return { object: wrapper, animations: gltf.animations || [] };
}

function prepareMesh(child) {
  if (!child.isMesh && !child.isSkinnedMesh) return;
  child.castShadow = true;
  child.receiveShadow = true;
  if (child.material) {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.side = THREE.FrontSide;
      material.needsUpdate = true;
    });
  }
}

function normalizeChildToWrapper(child, def) {
  const box = new THREE.Box3().setFromObject(child);
  const size = new THREE.Vector3();
  box.getSize(size);
  const footprint = Math.max(size.x, size.z, 0.001);
  const height = Math.max(size.y, 0.001);
  const scalar = def.targetHeight ? def.targetHeight / height : (def.targetFootprint || TILE) / footprint;
  child.scale.multiplyScalar(scalar);

  const scaledBox = new THREE.Box3().setFromObject(child);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  child.position.x -= scaledCenter.x;
  child.position.y -= scaledBox.min.y;
  child.position.z -= scaledCenter.z;
}
