export const EDITOR_COLLIDER_DIAGNOSTICS_SCHEMA = "lumina3d.editor.colliderDiagnostics.v1";

export const EDITOR_COLLIDER_VIEW_MODES = [
  { id: "off", label: "Off" },
  { id: "all", label: "All" },
  { id: "blocking", label: "Blocking" },
  { id: "walkable", label: "Walkable" },
  { id: "triggers", label: "Triggers" },
  { id: "visual", label: "Visual Bounds" },
  { id: "actor_walkability", label: "Actor Walkability" },
  { id: "problems", label: "Problems Only" }
];

const ACTORS = ["human", "frog", "elephant"];

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function metadataText(proxy = {}) {
  return Object.entries(proxy.metadata || {})
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join(",") : value}`)
    .join(" ")
    .toLowerCase();
}

export function normalizeColliderViewMode(mode = "off") {
  return EDITOR_COLLIDER_VIEW_MODES.some((entry) => entry.id === mode) ? mode : "off";
}

export function colliderSemanticRole(proxy = {}) {
  const text = `${normalized(proxy.category)} ${normalized(proxy.label)} ${metadataText(proxy)}`;
  if (text.includes("draft")) return "visual";
  if (text.includes("trigger") || text.includes("button") || text.includes("interaction") || text.includes("transition")) return "trigger";
  if (text.includes("walkable") || text.includes("terrain_surface") || text.includes("surface")) return "walkable";
  if (text.includes("visual") || text.includes("bounds") || proxy.source === "visual-proxy") return "visual";
  if (text.includes("physical") || text.includes("blocking") || text.includes("barrier") || text.includes("collider")) return "blocking";
  return "manual-review";
}

export function colliderRoleColor(role = "manual-review") {
  if (role === "blocking") return 0xf26f6f;
  if (role === "walkable") return 0x5ed1bb;
  if (role === "trigger") return 0xe4c35a;
  if (role === "visual") return 0xff7a6f;
  return 0x8aa0b7;
}

export function proxyHasProblem(proxy = {}) {
  if (!proxy.ownerId) return true;
  if (proxy.generated || proxy.source === "manual-review") return true;
  const role = colliderSemanticRole(proxy);
  if (role === "manual-review") return true;
  if (role === "trigger" && !proxy.metadata?.linkedMechanism && !proxy.metadata?.linkedPlatformId && !proxy.metadata?.linkedButtonId) return true;
  return false;
}

export function proxyMatchesColliderViewMode(proxy = {}, mode = "all") {
  const viewMode = normalizeColliderViewMode(mode);
  if (viewMode === "off") return false;
  if (viewMode === "all") return true;
  const role = colliderSemanticRole(proxy);
  if (viewMode === "blocking") return role === "blocking";
  if (viewMode === "walkable") return role === "walkable";
  if (viewMode === "triggers") return role === "trigger";
  if (viewMode === "visual") return role === "visual";
  if (viewMode === "actor_walkability") return role === "walkable" || role === "blocking" || Boolean(proxy.metadata?.walkableBy);
  if (viewMode === "problems") return proxyHasProblem(proxy);
  return true;
}

function actorWalkabilityValue(actor, proxies = []) {
  const relevantText = proxies.map((proxy) => `${proxy.label || ""} ${proxy.category || ""} ${metadataText(proxy)}`.toLowerCase()).join(" ");
  const actorMentioned = relevantText.includes(actor);
  const walkableMentioned = relevantText.includes("walkable");
  const blockedMentioned = relevantText.includes("block") || relevantText.includes("blocking");
  return {
    actor,
    blocks: actorMentioned && blockedMentioned ? "yes" : blockedMentioned ? "review" : "no",
    walkable: actorMentioned && walkableMentioned ? "yes" : walkableMentioned ? "review" : "no",
    triggers: actorMentioned && relevantText.includes("trigger") ? "yes" : relevantText.includes("trigger") ? "review" : "no",
    notes: actorMentioned ? "explicit metadata mention" : "inferred from proxy role"
  };
}

export function buildColliderDiagnostics({
  selectedRecord = null,
  selectedProxies = [],
  allProxies = [],
  viewMode = "off"
} = {}) {
  const normalizedMode = normalizeColliderViewMode(viewMode);
  const proxySummaries = selectedProxies.map((proxy) => ({
    ...proxy,
    semanticRole: colliderSemanticRole(proxy),
    hasProblem: proxyHasProblem(proxy)
  }));
  const warnings = [];
  const selectedCategory = normalized(selectedRecord?.category);
  const looksSolid = /physical|prop|rock|tree|barrier|wall|platform|ramp|elevator/.test(selectedCategory);
  const hasBlocking = proxySummaries.some((proxy) => proxy.semanticRole === "blocking");
  const hasWalkable = proxySummaries.some((proxy) => proxy.semanticRole === "walkable");
  const hasTrigger = proxySummaries.some((proxy) => proxy.semanticRole === "trigger");

  if (selectedRecord && looksSolid && !hasBlocking && !hasWalkable) {
    warnings.push({
      code: "solid_object_without_blocking_or_walkable_proxy",
      severity: "warning",
      message: "Solid-looking object has no blocking or walkable source proxy."
    });
  }
  proxySummaries.forEach((proxy) => {
    if (!proxy.ownerId) {
      warnings.push({
        code: "proxy_without_owner",
        severity: "warning",
        proxyId: proxy.id,
        message: "Collider proxy has no visible owner record."
      });
    }
    if (proxy.manualReview || proxy.source === "manual-review") {
      warnings.push({
        code: "manual_review_proxy",
        severity: "info",
        proxyId: proxy.id,
        message: "Proxy is manual-review context, not authoritative runtime collision."
      });
    }
    if (proxy.semanticRole === "trigger" && !proxy.metadata?.linkedMechanism && !proxy.metadata?.linkedPlatformId && !proxy.metadata?.linkedButtonId) {
      warnings.push({
        code: "trigger_without_link",
        severity: "warning",
        proxyId: proxy.id,
        message: "Trigger proxy has no linked mechanism target metadata."
      });
    }
    const text = metadataText(proxy);
    if (text.includes("elephant") && !text.includes("human") && !text.includes("actorrestriction")) {
      warnings.push({
        code: "elephant_walkability_without_human_rule",
        severity: "warning",
        proxyId: proxy.id,
        message: "Elephant walkability appears without an explicit Human restriction."
      });
    }
  });

  const problemWarningCount = allProxies.filter(proxyHasProblem).length + warnings.filter((warning) => warning.severity === "warning").length;

  return {
    schema: EDITOR_COLLIDER_DIAGNOSTICS_SCHEMA,
    viewMode: normalizedMode,
    selectedObjectId: selectedRecord?.id || null,
    selectedObjectCategory: selectedRecord?.category || "",
    selectedProxyCount: proxySummaries.length,
    selectedRoles: [...new Set(proxySummaries.map((proxy) => proxy.semanticRole))],
    selectedHasBlocking: hasBlocking,
    selectedHasWalkable: hasWalkable,
    selectedHasTrigger: hasTrigger,
    actorWalkability: ACTORS.map((actor) => actorWalkabilityValue(actor, proxySummaries)),
    warnings,
    warningCount: warnings.length,
    problemWarningCount,
    globalProblemProxyCount: allProxies.filter(proxyHasProblem).length
  };
}
