import * as THREE from "three";
import { SCENES } from "../config/scenes.js";
import { SURFACE_Y } from "../config/constants.js";
import {
  HOME_HEIGHT,
  HOME_POINTS,
  HOME_PROPS,
  HOME_WIDTH
} from "../levels/homeIntroLevel.js";
import { sceneGridPoint } from "../core/grid.js";

export function buildHomeScene({
  sceneGroups,
  placeAsset,
  homeMeshes,
  addSceneCollider,
  colliderForProp
}) {
  for (let y = 0; y < HOME_HEIGHT; y++) {
    for (let x = 0; x < HOME_WIDTH; x++) {
      const isTrail = y === 5 || (x >= 5 && x <= 7 && y === 4);
      const point = sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, x, y);
      const tile = placeAsset(sceneGroups.home, isTrail ? "pathTile" : "groundTile", point);
      tile.userData.homeTile = `${x},${y}`;
      homeMeshes.push(tile);
    }
  }

  const house = placeAsset(sceneGroups.home, "homeBlue", HOME_POINTS.house, { y: SURFACE_Y, rotationY: 0 });
  house.userData.homeAsset = "building_home_A_blue";
  homeMeshes.push(house);
  addSceneCollider(SCENES.HOME, { x: HOME_POINTS.house.x, z: HOME_POINTS.house.z - 0.42 }, 3.2, 2.32, "home-house-main-body");
  addSceneCollider(SCENES.HOME, { x: HOME_POINTS.house.x - 2.32, z: HOME_POINTS.house.z + 0.88 }, 0.72, 1.08, "home-house-left-front");
  addSceneCollider(SCENES.HOME, { x: HOME_POINTS.house.x + 2.32, z: HOME_POINTS.house.z + 0.88 }, 0.72, 1.08, "home-house-right-front");
  addSceneCollider(SCENES.HOME, { x: HOME_POINTS.house.x, z: HOME_POINTS.house.z + 2.12 }, 1.08, 0.28, "home-house-front-threshold");

  const note = new THREE.Group();
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.05, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xfff1bd, emissive: 0xffd58b, emissiveIntensity: 0.08, roughness: 0.62 })
  );
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.065, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xe46672, roughness: 0.5 })
  );
  ribbon.position.y = 0.045;
  note.add(paper, ribbon);
  note.position.set(HOME_POINTS.note.x, SURFACE_Y + 0.11, HOME_POINTS.note.z);
  note.rotation.y = Math.PI * 0.08;
  note.userData.homeAsset = "generated-door-note";
  sceneGroups.home.add(note);
  homeMeshes.push(note);

  HOME_PROPS.forEach(([key, x, y, scale], index) => {
    const point = sceneGridPoint(HOME_WIDTH, HOME_HEIGHT, x, y);
    const prop = placeAsset(sceneGroups.home, key, point, {
      y: SURFACE_Y,
      rotationY: index * 0.7,
      scale
    });
    prop.userData.homeAsset = key;
    homeMeshes.push(prop);
    const collider = colliderForProp(key, scale);
    if (collider) addSceneCollider(SCENES.HOME, point, collider.halfX, collider.halfZ, `home-${key}`);
  });

  sceneGroups.home.visible = false;
}
