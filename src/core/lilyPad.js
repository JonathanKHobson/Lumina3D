import * as THREE from "three";

export function makeLilyPadShape(radius) {
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

export function createLilyPadGroup({ name = "lily-pad", radius = 0.5 } = {}) {
  const lilyPad = new THREE.Group();
  lilyPad.name = name;
  const shape = makeLilyPadShape(radius);
  const top = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x4c9f32, roughness: 0.68, metalness: 0.02 })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.045;
  top.castShadow = true;
  top.receiveShadow = true;

  const underside = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 48),
    new THREE.MeshStandardMaterial({ color: 0x2e6f2f, roughness: 0.82, metalness: 0 })
  );
  underside.rotation.x = -Math.PI / 2;
  underside.position.y = 0.006;
  underside.receiveShadow = true;
  lilyPad.add(underside, top);

  const veinMaterial = new THREE.MeshStandardMaterial({ color: 0xa8de68, roughness: 0.74, metalness: 0.02 });
  [
    { length: radius * 1.26, width: 0.035, x: -radius * 0.23, z: 0, rotationY: 0 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: -radius * 0.36, rotationY: -0.78 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: -radius * 0.18, rotationY: -0.42 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: radius * 0.18, rotationY: 0.42 },
    { length: radius * 0.56, width: 0.022, x: -radius * 0.08, z: radius * 0.36, rotationY: 0.78 }
  ].forEach((veinConfig) => {
    const vein = new THREE.Mesh(new THREE.BoxGeometry(veinConfig.length, 0.018, veinConfig.width), veinMaterial);
    vein.position.set(veinConfig.x, 0.058, veinConfig.z);
    vein.rotation.y = veinConfig.rotationY;
    vein.receiveShadow = true;
    lilyPad.add(vein);
  });

  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.09, 0.026, 18),
    new THREE.MeshStandardMaterial({ color: 0xd6e26c, roughness: 0.7 })
  );
  center.position.set(-radius * 0.22, 0.075, 0);
  center.castShadow = true;
  lilyPad.add(center);
  return lilyPad;
}
