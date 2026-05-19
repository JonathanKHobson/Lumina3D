import { formatJson } from "./lib/cli-utils.js";
import { listLevels } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/list-levels.js [--pretty]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:list-levels\n  npm run tools:list-levels -- --pretty`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function getPositional(args) {
  return args.filter((arg) => !arg.startsWith("--"));
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

  if (getPositional(args).length > 0) {
    throw new Error(`Unexpected positional arguments. Usage: ${USAGE_TEXT}`);
  }

  const levels = listLevels();
  const payload = {
    ok: true,
    command: "list-levels",
    count: levels.length,
    levels
  };
  const pretty = args.includes("--pretty");
  console.log(pretty ? formatJson(payload) : JSON.stringify(payload));
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "list-levels",
    error: {
      message: error?.message || String(error),
      usage: "node scripts/list-levels.js [--pretty]"
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
