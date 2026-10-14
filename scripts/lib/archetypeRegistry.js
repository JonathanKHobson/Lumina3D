export const LUMINA_ARCHETYPES = {
  "button.blue": {
    id: "button.blue",
    label: "Blue Button",
    category: "button",
    status: "active",
    summary: "Press-once activation used for simple persistent puzzle changes.",
    requiredFields: ["id", "position", "mechanismLink"],
    optionalFields: ["assetKey", "sourceRef", "noteTags"],
    behaviorContract: {
      playerModel: "Blue = press once.",
      activation: "one_time_or_persistent_press",
      expectedActors: ["frog", "player"],
      targetCategories: ["platform.blue", "bridge", "gate"],
      runtimeOwner: "gameplay source, not editor"
    },
    validationHints: [
      "Button should have a stable id and visible source location.",
      "Button should communicate the persistent result it activates.",
      "Do not require held weight for blue buttons."
    ],
    aiImplementationNotes:
      "When moving or editing a blue button, preserve press-once semantics and update only level/source data unless the task explicitly asks for behavior work."
  },
  "button.red": {
    id: "button.red",
    label: "Red Button",
    category: "button",
    status: "active",
    summary: "Heavy held button for Elephant-driven cycling mechanisms.",
    requiredFields: ["id", "position", "linkedPlatformId"],
    optionalFields: ["surfaceTopY", "surfaceClearance", "asset", "topAsset"],
    behaviorContract: {
      playerModel: "Red = hold with weight; mechanism cycles.",
      activation: "held_weight_contact",
      expectedActors: ["elephant"],
      rejectedActors: ["player", "frog"],
      targetCategories: ["platform.red"],
      runtimeOwner: "gameplay source, not editor"
    },
    validationHints: [
      "Red button should link to a compatible red platform/elevator.",
      "Main character and Frog should not activate red buttons.",
      "Connected mechanism should communicate held/cycling behavior."
    ],
    aiImplementationNotes:
      "Do not convert red buttons into latches or one-shot triggers. Preserve Elephant-only weight semantics unless the user explicitly changes the design."
  },
  "button.yellow": {
    id: "button.yellow",
    label: "Yellow Button",
    category: "button",
    status: "planned",
    summary: "Planned timed activation: press and hurry.",
    requiredFields: ["id", "position", "targetIds", "durationMs"],
    optionalFields: ["resetDurationMs", "warningCue"],
    behaviorContract: {
      playerModel: "Yellow = press and hurry.",
      activation: "timed_press",
      targetCategories: ["gate", "bridge", "platform"],
      runtimeOwner: "not implemented yet"
    },
    validationHints: [
      "Do not scaffold yellow runtime behavior in the MCP MVP.",
      "Mark yellow instances as planned until runtime support exists."
    ],
    aiImplementationNotes:
      "Treat this as design-system context only. Do not add yellow mechanics while working on the MCP MVP."
  },
  "button.green": {
    id: "button.green",
    label: "Green Button",
    category: "button",
    status: "planned",
    summary: "Planned repeatable/multi-state activation.",
    requiredFields: ["id", "position", "states"],
    optionalFields: ["targetIds", "cycleOrder"],
    behaviorContract: {
      playerModel: "Green = press again to switch or cycle.",
      activation: "repeatable_press",
      targetCategories: ["multi_state_mechanism"],
      runtimeOwner: "not implemented yet"
    },
    validationHints: [
      "Do not infer green-button runtime from blue or red behavior.",
      "Keep green as planned until an explicit mechanic slice implements it."
    ],
    aiImplementationNotes:
      "Use as future design context only. Do not add green mechanics during read-only MCP work."
  },
  "platform.red": {
    id: "platform.red",
    label: "Red Platform / Elevator",
    category: "platform",
    status: "active",
    summary: "Moving platform/elevator controlled by a held red button.",
    requiredFields: ["id", "position", "linkedButtonId", "baseY", "maxLift"],
    optionalFields: ["initialProgress", "asset", "speed"],
    behaviorContract: {
      activation: "cycles_while_linked_red_button_held",
      allowedLinks: ["button.red"],
      movement: "vertical_or_path_based",
      runtimeOwner: "level two mechanism source"
    },
    validationHints: [
      "Linked button id should resolve to a red button.",
      "Elevator endpoints should align with walkable terrain.",
      "Actor riding/collision behavior must be verified with scene smoke or fixture tests."
    ],
    aiImplementationNotes:
      "Keep Level Two red elevators linked to Red Button A/B contracts. Do not rewrite platform physics from MCP tooling changes."
  },
  "ramp.blue": {
    id: "ramp.blue",
    label: "Blue Ramp",
    category: "ramp",
    status: "active",
    summary: "Walkable ramp that connects ground/raised terrain in the Level Two blue path.",
    requiredFields: ["id", "position", "rotationY", "visualScale"],
    optionalFields: ["asset", "sourceRef"],
    behaviorContract: {
      activation: "static_navigation_surface",
      expectedActors: ["player"],
      runtimeOwner: "level layout and collision/surface source"
    },
    validationHints: [
      "Check actor can move up and down without clipping.",
      "Check visual mesh and walkable proxy stay aligned.",
      "Run float/collider validation after moving ramps."
    ],
    aiImplementationNotes:
      "Ramp edits are spatial-risk edits. Keep fixes small and verify with build plus Level Two spatial checks."
  },
  "pickup.letter": {
    id: "pickup.letter",
    label: "Love Letter Pickup",
    category: "pickup",
    status: "active",
    summary: "Main level reward collectible; Cubelings do not collect it.",
    requiredFields: ["id", "position", "messageId"],
    optionalFields: ["assetKey", "clearance", "celebrationCue"],
    behaviorContract: {
      activation: "player_collects",
      rejectedActors: ["frog", "elephant"],
      runtimeOwner: "Love Letter gameplay flow"
    },
    validationHints: [
      "Do not use spellbook as player-facing copy.",
      "Main character collects Love Letters; Cubelings should not.",
      "Completion flow should show Love Letter message before completion menu."
    ],
    aiImplementationNotes:
      "Preserve Love Letter reward semantics when moving the temporary spellbook visual."
  },
  "collider.solid": {
    id: "collider.solid",
    label: "Solid Collider",
    category: "collider",
    status: "active",
    summary: "Collision proxy for props, walls, structures, or terrain blockers.",
    requiredFields: ["id", "colliderLabel", "position", "bounds"],
    optionalFields: ["runtimeProbe", "expectedColliderCount"],
    behaviorContract: {
      activation: "blocks_actor_movement",
      runtimeOwner: "collision system and scene builders"
    },
    validationHints: [
      "Run missing-collider validation after adding solid geometry.",
      "Collider labels should be stable enough for render_game_to_text probes.",
      "Visual mesh and collider proxy must stay spatially aligned."
    ],
    aiImplementationNotes:
      "Do not treat visual props as solid unless the level catalog marks collisionExpected or gameplay requires a blocker."
  },
  "collider.walkable": {
    id: "collider.walkable",
    label: "Walkable Surface",
    category: "collider",
    status: "active",
    summary: "Surface or proxy that actors can stand on or traverse.",
    requiredFields: ["id", "surfaceY", "bounds"],
    optionalFields: ["slope", "linkedVisualId", "elevationBand"],
    behaviorContract: {
      activation: "supports_actor_movement",
      runtimeOwner: "collision/surface system"
    },
    validationHints: [
      "Run float-collider validation after elevation changes.",
      "Walkable endpoints should align with surrounding terrain.",
      "Avoid combining walkable-surface refactors with active mechanic changes."
    ],
    aiImplementationNotes:
      "For ramps/platforms, inspect both visual placement and walkable proxy behavior before changing gameplay code."
  },
  "prop.static": {
    id: "prop.static",
    label: "Static Prop",
    category: "prop",
    status: "active",
    summary: "Decorative or physical scenery object placed in level data.",
    requiredFields: ["id", "assetKey", "position"],
    optionalFields: ["scale", "rotationY", "collisionExpected"],
    behaviorContract: {
      activation: "none",
      runtimeOwner: "level data and scene builders"
    },
    validationHints: [
      "Physical trees, rocks, and bushes usually need collider review.",
      "Decorative grass should not block paths.",
      "Avoid clutter that hides puzzle routes or camera sightlines."
    ],
    aiImplementationNotes:
      "Prop edits should stay layout-only unless the user asks for asset or collision behavior changes."
  },
  "spawn.player": {
    id: "spawn.player",
    label: "Player Spawn",
    category: "spawn",
    status: "active",
    summary: "Main character starting or handoff position.",
    requiredFields: ["id", "position"],
    optionalFields: ["facing", "scenePhase"],
    behaviorContract: {
      activation: "scene_start_or_transition",
      runtimeOwner: "scene flow and state factories"
    },
    validationHints: [
      "Spawn should not overlap solids or begin outside level bounds.",
      "Scene smoke should confirm active actor and scene phase."
    ],
    aiImplementationNotes:
      "Do not move spawns casually; scene-flow timing can depend on exact entry state."
  },
  "spawn.companion": {
    id: "spawn.companion",
    label: "Cubeling Spawn / Echo",
    category: "spawn",
    status: "active",
    summary: "Cubeling start, Echo, or unlock destination.",
    requiredFields: ["id", "cubelingId", "position"],
    optionalFields: ["locked", "totemId", "opacity"],
    behaviorContract: {
      activation: "spawn_unlock_or_recall_anchor",
      runtimeOwner: "Cubeling systems and level data"
    },
    validationHints: [
      "Echoes should be readable but not confused with active Cubelings.",
      "Cubeling spawns should not block required player paths.",
      "Future recall should return Cubelings to Echo anchors without resetting level state."
    ],
    aiImplementationNotes:
      "Keep Echo, Totem, and active Cubeling roles separate in source and player-facing copy."
  }
};

export function listArchetypes({ category = "", status = "" } = {}) {
  return Object.values(LUMINA_ARCHETYPES)
    .filter((entry) => !category || entry.category === category)
    .filter((entry) => !status || entry.status === status)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      category: entry.category,
      status: entry.status,
      summary: entry.summary
    }));
}

export function getArchetypeContract(archetypeId) {
  return LUMINA_ARCHETYPES[archetypeId] || null;
}
