import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTERNAL_3D_PACKS_ROOT = "/Volumes/KyleSSD/Documents/My Projects/My Games/game_design/assets/graphics/sprite_packs/3D_packs";
const OUTPUT_FILE = path.join(REPO_ROOT, "src/editor/EditorExternalAssetCatalog.generated.js");

const FOCUSED_SCOPES = [
  { id: "kaykits", label: "Kaykits", root: "Kaykits" },
  { id: "cubeling_pack", label: "Cubeling Pack", root: "Cubeling Pack" }
];

const FORMAT_PRIORITY = ["gltf", "glb", "obj", "fbx", "vox"];
const MODEL_EXTENSIONS = new Set(FORMAT_PRIORITY.map((format) => `.${format}`));
const FORMAT_FOLDER_NAMES = new Set([
  "2d",
  "3d",
  "animations",
  "assets",
  "blends",
  "characters",
  "fbx",
  "fbx_unity",
  "fbx_unreal",
  "glb",
  "gltf",
  "glTF".toLowerCase(),
  "models",
  "obj",
  "objs",
  "samples",
  "texture",
  "textures"
]);

function toPosix(value) {
  return String(value || "").split(path.sep).join("/");
}

function slug(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "asset";
}

function labelFromSlug(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isSkippedPathSegment(segment) {
  return !segment ||
    segment === ".DS_Store" ||
    segment.startsWith("._") ||
    segment.startsWith(".");
}

function shouldSkipFile(filePath) {
  const parts = filePath.split(path.sep);
  return parts.filter(Boolean).some(isSkippedPathSegment);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    readdirSync(current).forEach((entry) => {
      if (isSkippedPathSegment(entry)) return;
      const fullPath = path.join(current, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        stack.push(fullPath);
        return;
      }
      if (stats.isFile()) results.push(fullPath);
    });
  }
  return results.sort((a, b) => a.localeCompare(b));
}

function fileFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!MODEL_EXTENSIONS.has(ext)) return "";
  return ext.slice(1);
}

function stripModelExtension(fileName) {
  const ext = path.extname(fileName);
  return fileName.slice(0, fileName.length - ext.length);
}

function inferCategory(text) {
  const haystack = String(text || "").toLowerCase();
  if (haystack.includes("button") || haystack.includes("switch")) return "button";
  if (haystack.includes("bridge")) return "bridge";
  if (haystack.includes("platform") || haystack.includes("ramp") || haystack.includes("slope")) return "platform";
  if (
    haystack.includes("tile") ||
    haystack.includes("block") ||
    haystack.includes("terrain") ||
    haystack.includes("water") ||
    haystack.includes("ground") ||
    haystack.includes("sand") ||
    haystack.includes("grass")
  ) return "terrain";
  if (
    haystack.includes("frog") ||
    haystack.includes("elephant") ||
    haystack.includes("animal") ||
    haystack.includes("character") ||
    haystack.includes("cat") ||
    haystack.includes("dog") ||
    haystack.includes("bear") ||
    haystack.includes("fox") ||
    haystack.includes("bunny")
  ) return "character";
  if (
    haystack.includes("coin") ||
    haystack.includes("heart") ||
    haystack.includes("collectible") ||
    haystack.includes("pickup") ||
    haystack.includes("apple") ||
    haystack.includes("cheese") ||
    haystack.includes("carrot")
  ) return "goal";
  if (
    haystack.includes("tree") ||
    haystack.includes("rock") ||
    haystack.includes("bush") ||
    haystack.includes("plant") ||
    haystack.includes("barrel") ||
    haystack.includes("crate") ||
    haystack.includes("furniture")
  ) return "prop";
  return "external";
}

function normalizedIdentitySegments(parts) {
  return parts
    .map(slug)
    .filter((part) => part && !FORMAT_FOLDER_NAMES.has(part));
}

function scopePackName(scope, relativeParts) {
  if (scope.id === "kaykits") {
    return relativeParts[1] ? `${scope.label} / ${relativeParts[1]}` : scope.label;
  }
  if (scope.id === "cubeling_pack") {
    return relativeParts.length > 2 && relativeParts[1] ? `${scope.label} / ${relativeParts[1]}` : scope.label;
  }
  return scope.label;
}

function recordFromFile(filePath, scope) {
  const format = fileFormat(filePath);
  if (!format || shouldSkipFile(filePath)) return null;

  const relativePath = toPosix(path.relative(EXTERNAL_3D_PACKS_ROOT, filePath));
  const relativeParts = relativePath.split("/");
  const directoryParts = relativeParts.slice(0, -1);
  const fileName = relativeParts.at(-1) || "";
  const stem = stripModelExtension(fileName);
  const cleanStem = stem.replace(/\.vox$/i, "");
  const stemSlug = slug(cleanStem);
  const packName = scopePackName(scope, relativeParts);
  const packSlug = slug(packName.replace(`${scope.label} / `, ""));
  const folderPath = directoryParts.join("/");
  const identityParts = normalizedIdentitySegments(directoryParts.slice(1));
  const identityKey = [scope.id, packSlug, ...identityParts, stemSlug].join("/");
  const assetKeyBase = `external.${scope.id}.${packSlug}.${stemSlug}`;
  const searchText = `${relativePath} ${packName} ${stem}`;
  const category = inferCategory(searchText);
  const tags = [...new Set([
    "external",
    scope.id,
    packSlug,
    slug(category),
    format,
    ...directoryParts.map(slug),
    ...stemSlug.split("_")
  ].filter(Boolean))].sort();

  return {
    identityKey,
    priority: FORMAT_PRIORITY.indexOf(format),
    record: {
      assetKey: assetKeyBase,
      label: labelFromSlug(cleanStem),
      type: format,
      category,
      sourceScope: "external",
      provider: scope.label,
      packName,
      folderPath,
      relativePath,
      format,
      source: filePath,
      tags,
      targetFootprint: null,
      targetHeight: null,
      allowedLevels: [],
      placementEnabled: false,
      usageNotes: "External local asset reference only; not imported into Lumina3D. Editor placement is marker-only draft intent."
    }
  };
}

function dedupeRecords(candidates) {
  const bestByIdentity = new Map();
  candidates.forEach((candidate) => {
    if (!candidate) return;
    const existing = bestByIdentity.get(candidate.identityKey);
    if (!existing || candidate.priority < existing.priority) {
      bestByIdentity.set(candidate.identityKey, candidate);
    }
  });

  const keyCounts = new Map();
  return [...bestByIdentity.values()]
    .sort((a, b) => a.record.assetKey.localeCompare(b.record.assetKey) || a.record.relativePath.localeCompare(b.record.relativePath))
    .map(({ record }) => {
      const count = keyCounts.get(record.assetKey) || 0;
      keyCounts.set(record.assetKey, count + 1);
      if (count === 0) return record;
      const folderSuffix = slug(record.folderPath.split("/").slice(-3).join("_"));
      return {
        ...record,
        assetKey: `${record.assetKey}.${folderSuffix || count + 1}`
      };
    });
}

function buildIndex() {
  const candidates = [];
  const skippedScopes = [];
  FOCUSED_SCOPES.forEach((scope) => {
    const scopeRoot = path.join(EXTERNAL_3D_PACKS_ROOT, scope.root);
    if (!existsSync(scopeRoot)) {
      skippedScopes.push(scope.root);
      return;
    }
    walkFiles(scopeRoot).forEach((filePath) => {
      const record = recordFromFile(filePath, scope);
      if (record) candidates.push(record);
    });
  });

  const records = dedupeRecords(candidates);
  const generatedAt = new Date().toISOString();
  const byScope = records.reduce((counts, record) => {
    counts[record.sourceScope] = (counts[record.sourceScope] || 0) + 1;
    return counts;
  }, {});
  const byPack = records.reduce((counts, record) => {
    counts[record.packName] = (counts[record.packName] || 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt,
    root: EXTERNAL_3D_PACKS_ROOT,
    focusedScopes: FOCUSED_SCOPES.map((scope) => scope.root),
    skippedScopes,
    recordCount: records.length,
    byScope,
    byPack,
    records
  };
}

function writeGeneratedModule(index) {
  const meta = {
    schema: "lumina3d.editor.externalAssetIndex.v1",
    generatedAt: index.generatedAt,
    root: index.root,
    focusedScopes: index.focusedScopes,
    skippedScopes: index.skippedScopes,
    recordCount: index.recordCount,
    byScope: index.byScope,
    byPack: index.byPack
  };
  const contents = `// Generated by scripts/build-external-asset-index.js. Do not edit by hand.\n\n` +
    `export const EDITOR_EXTERNAL_ASSET_INDEX_META = ${JSON.stringify(meta, null, 2)};\n\n` +
    `export const EDITOR_EXTERNAL_ASSET_RECORDS = ${JSON.stringify(index.records, null, 2)};\n`;
  writeFileSync(OUTPUT_FILE, contents);
}

function main() {
  const pretty = process.argv.includes("--pretty");
  const index = buildIndex();
  writeGeneratedModule(index);
  const payload = {
    ok: true,
    command: "build-external-asset-index",
    output: toPosix(path.relative(REPO_ROOT, OUTPUT_FILE)),
    root: index.root,
    recordCount: index.recordCount,
    focusedScopes: index.focusedScopes,
    skippedScopes: index.skippedScopes,
    packCount: Object.keys(index.byPack).length,
    byPack: index.byPack
  };
  console.log(pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload));
}

main();
