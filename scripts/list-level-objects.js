import { formatJson } from "./lib/cli-utils.js";
import { getLevelObjects } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/list-level-objects.js <level_id> [--pretty]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:list-level-objects -- level_two --pretty\n  npm run tools:list-level-objects -- level_one`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function getPositional(args) {
  return args.filter((arg) => !arg.startsWith("--") && !arg.startsWith("-"));
}

function hasUnexpectedFlag(args) {
  const knownFlags = new Set(["--pretty", "--help", "-h"]);
  return args.some((arg) => arg.startsWith("--") && !knownFlags.has(arg));
}

function hasUnknownShortFlag(args) {
  return args.some((arg) => /^-[^-]$/.test(arg) && arg !== "-h");
}

function compactObject(object) {
  const assetKey = object?.asset?.key || "unknown";
  const assetPath = object?.asset?.path || null;
  return {
    id: object.id,
    name: object.name,
    type: object.type,
    category: object.category,
    asset: {
      key: assetKey,
      path: assetPath
    },
    position: object.position,
    rotationY: object.rotationY,
    collisionExpected: Boolean(object.collisionExpected),
    colliderLabel: object.colliderLabel || null,
    mechanismLink: object.mechanismLink || null
  };
}

async function run() {
  const args = process.argv.slice(2);
  if (isHelp(args)) {
    console.log(HELP_TEXT);
    return;
  }

  if (hasUnexpectedFlag(args) || hasUnknownShortFlag(args)) {
    throw new Error(`Unexpected flag. Usage: ${USAGE_TEXT}`);
  }

  const positional = getPositional(args);
  if (positional.length !== 1) {
    throw new Error(`Usage: ${USAGE_TEXT}`);
  }

  const levelId = positional[0].trim();
  const objects = getLevelObjects(levelId).map(compactObject);
  if (!objects.length) {
    throw new Error(`Unknown level id or no objects recorded: ${levelId}`);
  }

  const payload = {
    ok: true,
    command: "list-level-objects",
    levelId,
    count: objects.length,
    objects
  };
  const pretty = args.includes("--pretty");
  console.log(pretty ? formatJson(payload) : JSON.stringify(payload));
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "list-level-objects",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
