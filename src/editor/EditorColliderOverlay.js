import * as THREE from "three";
import {
  colliderRoleColor,
  colliderSemanticRole,
  normalizeColliderViewMode,
  proxyMatchesColliderViewMode
} from "./EditorColliderDiagnostics.js";

const COLORS = {
  selected: 0xf7cf6b,
  manual: 0x8aa0b7,
  inactive: 0x6f7b73
};

function numberOrFallback(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function round(value) {
  return Number(numberOrFallback(value).toFixed(3));
}

function vectorFromLike(value, fallback = new THREE.Vector3()) {
  if (value instanceof THREE.Vector3) return value.clone();
  if (Array.isArray(value)) {
    return new THREE.Vector3(
      numberOrFallback(value[0], fallback.x),
      numberOrFallback(value[1], fallback.y),
      numberOrFallback(value[2], fallback.z)
    );
  }
  if (value && typeof value === "object") {
    return new THREE.Vector3(
      numberOrFallback(value.x, fallback.x),
      numberOrFallback(value.y, fallback.y),
      numberOrFallback(value.z, fallback.z)
    );
  }
  return fallback.clone();
}

function vectorSummary(vector) {
  return {
    x: round(vector.x),
    y: round(vector.y),
    z: round(vector.z)
  };
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material?.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}

function styleForProxy(proxy, selected) {
  if (selected) return { color: COLORS.selected, meshOpacity: 0.2, lineOpacity: 1 };
  if (proxy.active === false) return { color: COLORS.inactive, meshOpacity: 0.06, lineOpacity: 0.38 };
  if (proxy.generated || proxy.source === "manual-review") {
    return { color: colliderRoleColor(colliderSemanticRole(proxy)) || COLORS.manual, meshOpacity: 0.1, lineOpacity: 0.68 };
  }
  return { color: colliderRoleColor(colliderSemanticRole(proxy)), meshOpacity: 0.12, lineOpacity: 0.84 };
}

function createHelper(proxy) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const meshMaterial = new THREE.MeshBasicMaterial({
    color: colliderRoleColor(colliderSemanticRole(proxy)),
    transparent: true,
    opacity: 0.08,
    depthWrite: false
  });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: colliderRoleColor(colliderSemanticRole(proxy)),
    transparent: true,
    opacity: 0.72
  });
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMaterial);
  const root = new THREE.Group();
  root.name = proxy.label || proxy.id || "Editor collider proxy";
  root.userData.colliderProxyId = proxy.id || "";
  root.add(mesh, edges);
  return { root, mesh, edges };
}

export class EditorColliderOverlay {
  constructor({ scene }) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "Editor Collider Proxy Overlay";
    this.group.visible = false;
    this.scene.add(this.group);
    this.visible = false;
    this.records = [];
    this.recordsById = new Map();
    this.proxies = [];
    this.entries = [];
    this.viewMode = "off";
    this.tempBox = new THREE.Box3();
    this.tempCenter = new THREE.Vector3();
    this.tempSize = new THREE.Vector3();
  }

  rebuild({ records = [], proxies = [] } = {}) {
    this.clear();
    this.records = records;
    this.recordsById = new Map(records.map((record) => [record.id, record]));
    this.proxies = proxies;
    this.entries = proxies.map((proxy, index) => {
      const normalizedProxy = {
        id: proxy.id || `editor-collider-proxy-${index + 1}`,
        label: proxy.label || proxy.id || `Collider proxy ${index + 1}`,
        category: proxy.category || "collider_proxy",
        source: proxy.source || "visual-proxy",
        active: proxy.active !== false,
        generated: Boolean(proxy.generated),
        ...proxy
      };
      const helper = createHelper(normalizedProxy);
      this.group.add(helper.root);
      return {
        proxy: normalizedProxy,
        ...helper,
        currentSummary: null
      };
    });
    this.sync();
  }

  clear() {
    this.entries.forEach((entry) => {
      this.group.remove(entry.root);
      disposeObject(entry.root);
    });
    this.entries = [];
    this.proxies = [];
    this.records = [];
    this.recordsById = new Map();
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    if (!this.visible) this.viewMode = "off";
    if (this.visible && this.viewMode === "off") this.viewMode = "all";
    this.group.visible = this.visible;
  }

  setViewMode(mode = "off") {
    this.viewMode = normalizeColliderViewMode(mode);
    this.visible = this.viewMode !== "off";
    this.group.visible = this.visible;
    this.sync();
  }

  sync(selectedId = "") {
    this.group.visible = this.visible;
    this.entries.forEach((entry) => {
      const calculated = this.calculateProxy(entry.proxy);
      if (!calculated) {
        entry.root.visible = false;
        entry.currentSummary = null;
        return;
      }

      const selected = entry.proxy.ownerId && entry.proxy.ownerId === selectedId;
      const style = styleForProxy(entry.proxy, selected);
      entry.root.visible = proxyMatchesColliderViewMode(entry.proxy, this.viewMode);
      entry.root.position.copy(calculated.center);
      entry.root.scale.set(calculated.size.x, calculated.size.y, calculated.size.z);
      entry.root.rotation.set(0, calculated.rotationY || 0, 0);
      entry.mesh.material.color.setHex(style.color);
      entry.mesh.material.opacity = style.meshOpacity;
      entry.edges.material.color.setHex(style.color);
      entry.edges.material.opacity = style.lineOpacity;
      entry.currentSummary = this.summarizeProxy(entry.proxy, calculated);
    });
  }

  calculateProxy(proxy) {
    const owner = proxy.ownerId ? this.recordsById.get(proxy.ownerId) : null;
    if (proxy.deriveFromObject && owner?.object) {
      this.tempBox.setFromObject(owner.object);
      if (this.tempBox.isEmpty()) return null;
      this.tempBox.getCenter(this.tempCenter);
      this.tempBox.getSize(this.tempSize);
      return {
        center: this.tempCenter.clone(),
        size: this.tempSize.clone().max(new THREE.Vector3(0.08, 0.08, 0.08)),
        halfExtents: this.tempSize.clone().multiplyScalar(0.5),
        rotationY: 0
      };
    }

    const fallbackCenter = owner?.object?.position || new THREE.Vector3();
    const offset = vectorFromLike(proxy.offset, new THREE.Vector3());
    const center = owner?.object
      ? owner.object.position.clone().add(offset)
      : vectorFromLike(proxy.center, fallbackCenter);
    const halfExtents = vectorFromLike(proxy.halfExtents, new THREE.Vector3(0.5, 0.5, 0.5));
    const clampedHalfExtents = new THREE.Vector3(
      Math.max(0.04, Math.abs(halfExtents.x)),
      Math.max(0.04, Math.abs(halfExtents.y)),
      Math.max(0.04, Math.abs(halfExtents.z))
    );

    return {
      center,
      size: clampedHalfExtents.clone().multiplyScalar(2),
      halfExtents: clampedHalfExtents,
      rotationY: proxy.rotationYFromOwner && owner?.object ? owner.object.rotation.y : Number(proxy.rotationY) || 0
    };
  }

  summarizeProxy(proxy, calculated) {
    const owner = proxy.ownerId ? this.recordsById.get(proxy.ownerId) : null;
    return {
      id: proxy.id,
      label: proxy.label,
      ownerId: proxy.ownerId || null,
      category: proxy.category,
      semanticRole: colliderSemanticRole(proxy),
      source: proxy.source,
      sourceRef: proxy.sourceRef || owner?.sourceRef || null,
      center: vectorSummary(calculated.center),
      halfExtents: vectorSummary(calculated.halfExtents),
      active: proxy.active !== false,
      generated: Boolean(proxy.generated),
      manualReview: Boolean(proxy.generated || proxy.source === "manual-review"),
      metadata: proxy.metadata || null
    };
  }

  proxySummariesForObject(objectId) {
    return this.entries
      .filter((entry) => entry.proxy.ownerId === objectId)
      .map((entry) => entry.currentSummary || this.summarizeCurrentEntry(entry))
      .filter(Boolean);
  }

  summarizeCurrentEntry(entry) {
    const calculated = this.calculateProxy(entry.proxy);
    return calculated ? this.summarizeProxy(entry.proxy, calculated) : null;
  }

  selectedLabels(selectedId) {
    return this.proxySummariesForObject(selectedId).map((proxy) => proxy.label);
  }

  summary(selectedId = "") {
    const selectedProxies = selectedId ? this.proxySummariesForObject(selectedId) : [];
    const visibleProxyCount = this.entries.filter((entry) => (
      entry.root.visible && proxyMatchesColliderViewMode(entry.proxy, this.viewMode)
    )).length;
    return {
      visible: this.visible,
      viewMode: this.viewMode,
      proxyCount: this.entries.length,
      visibleProxyCount,
      selectedProxyCount: selectedProxies.length,
      selectedColliderLabels: selectedProxies.map((proxy) => proxy.label)
    };
  }
}
