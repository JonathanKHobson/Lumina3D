import * as THREE from "three";

import { SURFACE_Y } from "../config/constants.js";

function makeAssetTransparent(object) {
  object.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.depthWrite = false;
      material.opacity = 1;
      material.needsUpdate = true;
    });
  });
}

export function clearParticles({ state, scene }) {
  state.particles.forEach((particle) => scene.remove(particle.mesh));
  state.particles = [];
}

export function updateParticles({ state, scene }, dt) {
  state.particles.forEach((particle) => {
    particle.age += dt;
    particle.mesh.position.x += particle.velocity.x * dt;
    particle.mesh.position.y += particle.velocity.y * dt;
    particle.mesh.position.z += particle.velocity.z * dt;
    if (particle.target) {
      const pull = Math.min(1, particle.age / particle.life);
      particle.mesh.position.x = THREE.MathUtils.lerp(particle.mesh.position.x, particle.target.x, pull * 0.08);
      particle.mesh.position.z = THREE.MathUtils.lerp(particle.mesh.position.z, particle.target.z, pull * 0.08);
    }
    particle.mesh.rotation.y += dt * 2;
    const remaining = 1 - particle.age / particle.life;
    particle.mesh.scale.setScalar(Math.max(0, remaining) * (particle.baseScale ?? 1));
    particle.mesh.traverse((child) => {
      if (child.material) child.material.opacity = Math.max(0, remaining);
    });
  });
  state.particles = state.particles.filter((particle) => {
    if (particle.age < particle.life) return true;
    scene.remove(particle.mesh);
    return false;
  });
}

export function spawnHeartParticles({ state, scene, cloneAsset }, x, z, includeConfetti = false, heartCount = 14) {
  for (let i = 0; i < heartCount; i++) {
    const heart = cloneAsset("heartRed");
    const angle = (i / heartCount) * Math.PI * 2 + Math.random() * 0.28;
    heart.position.set(x, SURFACE_Y + 1.55, z);
    heart.rotation.set(0, angle + Math.PI / 2, (Math.random() - 0.5) * 0.34);
    heart.scale.setScalar(0.54 + Math.random() * 0.16);
    makeAssetTransparent(heart);
    scene.add(heart);
    state.particles.push({
      kind: "heart",
      mesh: heart,
      age: 0,
      life: 1.1 + Math.random() * 0.45,
      velocity: {
        x: Math.cos(angle) * (0.7 + Math.random() * 0.45),
        y: 1.0 + Math.random() * 0.55,
        z: Math.sin(angle) * (0.7 + Math.random() * 0.45)
      }
    });
  }
  if (!includeConfetti) return;
  const confettiColors = [0xffd166, 0x7ee8ff, 0xb8f27d, 0xd7a5ff, 0xff8ea8];
  const geometry = new THREE.BoxGeometry(0.16, 0.1, 0.08);
  for (let i = 0; i < 26; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: confettiColors[i % confettiColors.length],
      transparent: true,
      opacity: 1
    });
    const confetti = new THREE.Mesh(geometry, material);
    const angle = Math.random() * Math.PI * 2;
    confetti.position.set(x, SURFACE_Y + 1.9, z);
    confetti.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(confetti);
    state.particles.push({
      kind: "confetti",
      mesh: confetti,
      age: 0,
      life: 1.55 + Math.random() * 0.7,
      velocity: {
        x: Math.cos(angle) * (0.55 + Math.random() * 0.8),
        y: 1.15 + Math.random() * 0.85,
        z: Math.sin(angle) * (0.55 + Math.random() * 0.8)
      }
    });
  }
}

export function spawnLoveLetterHearts({ state, scene, cloneAsset }, spellbook, heartCount = 2) {
  for (let i = 0; i < heartCount; i++) {
    const heart = cloneAsset("heartRed");
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15;
    heart.position.set(
      spellbook.x + (Math.random() - 0.5) * 0.28,
      SURFACE_Y + 1.2 + Math.random() * 0.18,
      spellbook.z + (Math.random() - 0.5) * 0.28
    );
    heart.rotation.set(0, angle + Math.PI / 2, (Math.random() - 0.5) * 0.24);
    heart.scale.setScalar(0.24 + Math.random() * 0.08);
    makeAssetTransparent(heart);
    scene.add(heart);
    state.particles.push({
      kind: "love-letter-heart",
      mesh: heart,
      age: 0,
      life: 1.25 + Math.random() * 0.35,
      velocity: {
        x: Math.cos(angle) * (0.12 + Math.random() * 0.12),
        y: 0.58 + Math.random() * 0.26,
        z: Math.sin(angle) * (0.12 + Math.random() * 0.12)
      }
    });
  }
}

export function spawnTransferParticles({ state, scene }, from, to) {
  const colors = [0xfff08a, 0xffffff, 0x7ee8ff, 0xd9b8ff];
  const geometry = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  for (let i = 0; i < 24; i++) {
    const progress = i / 23;
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 1
    });
    const sparkle = new THREE.Mesh(geometry, material);
    const jitterX = (Math.random() - 0.5) * 0.45;
    const jitterZ = (Math.random() - 0.5) * 0.45;
    sparkle.position.set(
      THREE.MathUtils.lerp(from.x, to.x, progress) + jitterX,
      SURFACE_Y + 1.1 + Math.sin(progress * Math.PI) * 0.9 + (Math.random() - 0.5) * 0.25,
      THREE.MathUtils.lerp(from.z, to.z, progress) + jitterZ
    );
    sparkle.scale.setScalar(0.85 + Math.random() * 0.65);
    scene.add(sparkle);
    state.particles.push({
      kind: "transfer",
      mesh: sparkle,
      age: 0,
      life: 0.88 + Math.random() * 0.36,
      target: { x: to.x, z: to.z },
      velocity: {
        x: (to.x - from.x) * 0.5 + (Math.random() - 0.5) * 0.75,
        y: 0.6 + Math.random() * 0.75,
        z: (to.z - from.z) * 0.5 + (Math.random() - 0.5) * 0.75
      }
    });
  }
}

export function spawnRevealSparkles({ state, scene }, x, z, color = 0xffffff, count = 18) {
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  for (let i = 0; i < count; i++) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95
    });
    const sparkle = new THREE.Mesh(geometry, material);
    const angle = (i / count) * Math.PI * 2;
    sparkle.position.set(
      x + Math.cos(angle) * (0.18 + Math.random() * 0.25),
      SURFACE_Y + 0.45 + Math.random() * 0.9,
      z + Math.sin(angle) * (0.18 + Math.random() * 0.25)
    );
    scene.add(sparkle);
    state.particles.push({
      kind: "reveal",
      mesh: sparkle,
      age: 0,
      life: 0.82 + Math.random() * 0.36,
      velocity: {
        x: Math.cos(angle) * (0.3 + Math.random() * 0.35),
        y: 0.5 + Math.random() * 0.45,
        z: Math.sin(angle) * (0.3 + Math.random() * 0.35)
      }
    });
  }
}

export function spawnLandingPuff({ state, scene }, x, z) {
  const colors = [0xf1efe3, 0xd9d1be, 0xffffff];
  const geometry = new THREE.BoxGeometry(0.28, 0.18, 0.28);
  for (let i = 0; i < 8; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.6
    });
    const puff = new THREE.Mesh(geometry, material);
    const angle = (i / 8) * Math.PI * 2;
    puff.position.set(
      x + Math.cos(angle) * 0.18,
      SURFACE_Y + 0.15,
      z + Math.sin(angle) * 0.18
    );
    puff.scale.setScalar(0.7 + Math.random() * 0.45);
    scene.add(puff);
    state.particles.push({
      kind: "smoke",
      mesh: puff,
      age: 0,
      life: 0.5 + Math.random() * 0.2,
      velocity: {
        x: Math.cos(angle) * (0.28 + Math.random() * 0.18),
        y: 0.3 + Math.random() * 0.22,
        z: Math.sin(angle) * (0.28 + Math.random() * 0.18)
      }
    });
  }
}
