import { formatJson } from "./lib/cli-utils.js";
import { getLevelManifest } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/get-level-manifest.js <level_id> [--pretty]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:get-level-manifest -- level_two --pretty\n  npm run tools:get-level-manifest -- level_one`;

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

  const levelIdArg = positional[0].trim();
  const manifest = getLevelManifest(levelIdArg);
  if (!manifest) {
    throw new Error(`Unknown level id: ${levelIdArg}`);
  }

  const payload = {
    ok: true,
    command: "get-level-manifest",
    levelId: manifest.id,
    manifest
  };
  const pretty = args.includes("--pretty");
  console.log(pretty ? formatJson(payload) : JSON.stringify(payload));
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "get-level-manifest",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
