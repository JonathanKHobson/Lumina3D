import * as THREE from "three";

import { TILE } from "../config/constants.js";

export const EDITOR_PROCEDURAL_ASSET_RECORDS = [
  {
    assetKey: "procedural.lilyPad.tile",
    label: "Procedural Lily Pad",
    type: "procedural",
    category: "terrain",
    sourceScope: "procedural",
    provider: "Lumina3D editor",
    packName: "Editor procedural assets",
    folderPath: "src/editor",
    relativePath: "src/editor/EditorProceduralAssets.js:createProceduralLilyPad",
    format: "threejs-procedural",
    source: "src/editor/EditorProceduralAssets.js",
    tags: [
      "procedural",
      "editor-generated",
      "lily-pad",
      "water",
      "terrain",
      "level-one",
      "draft-placeable"
    ],
    targetFootprint: TILE * 0.88,
    targetHeight: 0.12,
    allowedLevels: ["level_one"],
    usageNotes: "Editor-only procedural lily pad sized just under one Level One water tile. Draft placement exports an AI handoff; runtime source is not written from the browser.",
    placementEnabled: false,
    draftPlacementEnabled: true
  }
];

function makeLilyPadShape(radius) {
  const shape = new THREE.Shape();
  const notchHalfAngle = 0.34;
  const innerNotch = radius * 0.26;
  const segments = 56;
  for (let index = 0; index <= segments; index += 1) {
    const t = notchHalfAngle + ((Math.PI * 2 - notchHalfAngle * 2) * index) / segments;
    const edgeRipple = 1 + Math.sin(index * 2.1) * 0.018;
    const x = Math.cos(t) * radius * edgeRipple;
    const y = Math.sin(t) * radius * 0.9 * edgeRipple;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.lineTo(innerNotch, 0);
  shape.closePath();
  return shape;
}

function makeVein(length, width, color, opacity = 0.62) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.018, width),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.74,
      metalness: 0.02,
      transparent: opacity < 1,
      opacity
    })
  );
}

function addVein(group, { length, width = 0.025, angle = 0, centerX = 0, centerZ = 0, color = 0x93c94c }) {
  const vein = makeVein(length, width, color);
  vein.position.set(centerX, 0.058, centerZ);
  vein.rotation.y = angle;
  vein.castShadow = false;
  vein.receiveShadow = true;
  group.add(vein);
  return vein;
}

export function createProceduralLilyPad() {
  const group = new THREE.Group();
  group.name = "Procedural Lily Pad";

  const radius = TILE * 0.43;
  const shape = makeLilyPadShape(radius);
  const top = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({
      color: 0x4c9f32,
      roughness: 0.68,
      metalness: 0.02
    })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.045;
  top.castShadow = true;
  top.receiveShadow = true;

  const underside = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2e6f2f,
      roughness: 0.82,
      metalness: 0
    })
  );
  underside.rotation.x = -Math.PI / 2;
  underside.position.y = 0.01;
  underside.castShadow = false;
  underside.receiveShadow = true;

  group.add(underside, top);

  addVein(group, { length: radius * 1.24, width: 0.035, centerX: -radius * 0.23, color: 0x9bd75a });
  [-0.78, -0.42, 0.42, 0.78].forEach((angle, index) => {
    const side = index < 2 ? -1 : 1;
    addVein(group, {
      length: radius * 0.56,
      width: 0.022,
      angle,
      centerX: -radius * 0.08,
      centerZ: side * radius * (index % 2 === 0 ? 0.18 : 0.36),
      color: 0xa8de68,
      opacity: 0.56
    });
  });

  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.09, 0.026, 18),
    new THREE.MeshStandardMaterial({
      color: 0xd6e26c,
      roughness: 0.7
    })
  );
  center.position.set(-radius * 0.22, 0.075, 0);
  center.castShadow = true;
  group.add(center);

  group.userData.editorProceduralAssetKey = "procedural.lilyPad.tile";
  return group;
}

export function createProceduralEditorAsset(assetKey) {
  if (assetKey === "procedural.lilyPad.tile") return createProceduralLilyPad();
  return null;
}
