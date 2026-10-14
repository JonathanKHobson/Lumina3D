export const EDITOR_NOTE_INTENTS = [
  {
    tag: "@move",
    label: "Move",
    summary: "Object should be repositioned.",
    usage: "Use when the starting position should change.",
    example: "@move raise this platform so it meets the ramp edge",
    aiInstruction:
      "Interpret this note as a request to update the object's starting transform position in source level data. Prefer level data or manifest changes over runtime gameplay logic, and preserve behavior links unless the note explicitly asks otherwise."
  },
  {
    tag: "@rotate",
    label: "Rotate",
    summary: "Object should be reoriented.",
    usage: "Use when facing, angle, or visual orientation is wrong.",
    example: "@rotate turn this barrier to match the path direction",
    aiInstruction:
      "Interpret this note as a request to update the object's starting rotation or facing direction in source level data. Preserve position, behavior type, and linked triggers unless explicitly requested."
  },
  {
    tag: "@scale",
    label: "Scale",
    summary: "Object should change visual or collision size.",
    usage: "Use when size or footprint should change, especially if source-backed scale fields exist.",
    example: "@scale make this tile slightly wider but keep its center point",
    aiInstruction:
      "Interpret this note as a request to review source scale fields such as scale tuples, visualScale, or collider dimensions. Apply only source-backed scale changes that are clear; otherwise call out the manual review needed."
  },
  {
    tag: "@fade",
    label: "Fade",
    summary: "Object should fade in or out.",
    usage: "Use for visual transition intent, not deletion.",
    example: "@fade fade this clue in after the button is pressed",
    aiInstruction:
      "Interpret this note as animation intent. Do not invent a broad animation system; identify the smallest existing scene, material, or behavior hook that can support a fade, or propose a bounded follow-up if no safe hook exists."
  },
  {
    tag: "@appear",
    label: "Appear",
    summary: "Object should become visible during play.",
    usage: "Use when an object should start hidden and become visible later.",
    example: "@appear show this bridge piece after the red buttons are solved",
    aiInstruction:
      "Interpret this note as visibility or spawn-timing intent. Preserve the object's source identity and links, and prefer adding data-backed visibility state over ad hoc runtime conditionals."
  },
  {
    tag: "@disappear",
    label: "Disappear",
    summary: "Object should become hidden or removed during play.",
    usage: "Use when an object should hide during play without deleting the source record.",
    example: "@disappear hide this blocker once the platform reaches the top",
    aiInstruction:
      "Interpret this note as visibility or despawn intent. Do not delete source data unless the object is also marked for delete; prefer a data-backed visibility or trigger rule."
  },
  {
    tag: "@spawn",
    label: "Spawn",
    summary: "Object should be introduced by a trigger or event.",
    usage: "Use when an object should be created or introduced by gameplay timing.",
    example: "@spawn introduce a reward marker here after the puzzle completes",
    aiInstruction:
      "Interpret this note as spawn behavior intent. Keep placement/source data explicit, preserve gameplay readability, and avoid implementing a generalized spawn editor unless the local code already supports it."
  },
  {
    tag: "@trigger",
    label: "Trigger",
    summary: "Object should trigger or respond to another object.",
    usage: "Use when one object should activate, unlock, reveal, or move another.",
    example: "@trigger connect this button to #level_two.red-elevator-a",
    aiInstruction:
      "Interpret this note as a request to inspect trigger relationships, IDs, and behavior bindings. Preserve existing links unless the note names a new source or target relationship."
  },
  {
    tag: "@button",
    label: "Button",
    summary: "Object should behave like or connect to a button.",
    usage: "Use for pressable/weighted button behavior or button target wiring.",
    example: "@button this should require Elephant weight and trigger the red platform",
    aiInstruction:
      "Interpret this note as button interaction intent. Prefer data-backed trigger mappings and keep button visuals, collider/proxy behavior, and target IDs consistent."
  },
  {
    tag: "@platform",
    label: "Platform",
    summary: "Object should behave like or connect to a platform.",
    usage: "Use for walkable platform behavior, movement, or platform target links.",
    example: "@platform this elevator should stop level with the upper route",
    aiInstruction:
      "Interpret this note as platform behavior intent. Preserve collision and movement contracts, and only change platform behavior parameters when the note provides a clear target."
  },
  {
    tag: "@collision",
    label: "Collision",
    summary: "Object needs collider or walkability attention.",
    usage: "Use when the visual object and playable collision/walkable surface may not match.",
    example: "@collision player catches on this tile edge near the ramp",
    aiInstruction:
      "Interpret this note as collision/proxy review intent. Do not treat visual transforms as sufficient; inspect local collider helpers and validation tooling before changing collision behavior."
  },
  {
    tag: "@replace",
    label: "Replace",
    summary: "Object should be replaced with another asset or source object.",
    usage: "Use when the existing object should keep its role but use a different asset or form.",
    example: "@replace replace this crate with #barrierColumnHalf while preserving the blocker role",
    aiInstruction:
      "Interpret this note as a replacement request, not a simple deletion. Preserve the object's gameplay role, source references, and behavior links where appropriate. If the replacement asset is unclear, propose options instead of guessing."
  }
];

export const EDITOR_NOTE_INTENT_MAP = new Map(
  EDITOR_NOTE_INTENTS.map((intent) => [intent.tag, intent])
);

const NOTE_TAG_PATTERN = /@[a-zA-Z0-9_-]+/g;

function toPublicIntent(intent) {
  if (!intent) return null;

  return {
    tag: intent.tag,
    label: intent.label,
    summary: intent.summary,
    usage: intent.usage,
    example: intent.example,
    aiInstruction: intent.aiInstruction
  };
}

export function normalizeIntentToken(token = "") {
  const trimmed = String(token).trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function extractNoteTags(note = "") {
  const matches = String(note).match(NOTE_TAG_PATTERN) || [];
  const unique = [];

  for (const match of matches) {
    const tag = normalizeIntentToken(match);
    if (EDITOR_NOTE_INTENT_MAP.has(tag) && !unique.includes(tag)) {
      unique.push(tag);
    }
  }

  return unique;
}

export function resolveNoteIntents(noteOrTags = "") {
  const tags = Array.isArray(noteOrTags) ? noteOrTags : extractNoteTags(noteOrTags);

  return tags
    .map(normalizeIntentToken)
    .map((tag) => toPublicIntent(EDITOR_NOTE_INTENT_MAP.get(tag)))
    .filter(Boolean);
}

export function findIntentSuggestions(query = "") {
  const normalized = String(query).trim().toLowerCase().replace(/^@/, "");

  return EDITOR_NOTE_INTENTS.filter((intent) => {
    if (!normalized) return true;
    return (
      intent.tag.slice(1).startsWith(normalized) ||
      intent.label.toLowerCase().startsWith(normalized) ||
      intent.summary.toLowerCase().includes(normalized)
    );
  })
    .slice(0, 8)
    .map(toPublicIntent);
}

export function buildIntentGlossary(input = []) {
  const tags = new Set();

  const addFromValue = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((tag) => tags.add(normalizeIntentToken(tag)));
      return;
    }
    if (typeof value === "string") {
      extractNoteTags(value).forEach((tag) => tags.add(tag));
      return;
    }
    if (Array.isArray(value.noteTags)) {
      value.noteTags.forEach((tag) => tags.add(normalizeIntentToken(tag)));
    }
    if (typeof value.note === "string") {
      extractNoteTags(value.note).forEach((tag) => tags.add(tag));
    }
  };

  if (Array.isArray(input)) {
    input.forEach(addFromValue);
  } else {
    addFromValue(input);
  }

  return Array.from(tags)
    .filter((tag) => EDITOR_NOTE_INTENT_MAP.has(tag))
    .sort()
    .reduce((glossary, tag) => {
      glossary[tag] = toPublicIntent(EDITOR_NOTE_INTENT_MAP.get(tag));
      return glossary;
    }, {});
}
