import {
  formatJson,
  launchGameBrowser,
  readState,
  jumpToLevel,
  waitForScenePlayPhase,
  setPaused,
  waitForState
} from "./lib/cli-utils.js";
import { getColliderExpectations, getDebugShortcut, getLevel } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/validate-missing-colliders.js [<level_id>] [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:validate-missing-colliders -- level_two --pretty\n  npm run tools:validate-missing-colliders -- level_two`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function getPositional(args) {
  return args.filter((arg) => !arg.startsWith("--") && !arg.startsWith("-"));
}

function hasUnexpectedFlag(args) {
  const knownFlags = new Set(["--pretty", "--no-headless", "--help", "-h"]);
  return args.some((arg) => arg.startsWith("--") && !knownFlags.has(arg));
}

function hasUnknownShortFlag(args) {
  return args.some((arg) => /^-[^-]$/.test(arg) && arg !== "-h");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const positional = getPositional(args);
  return {
    levelId: positional[0] || "tutorial",
    pretty: args.includes("--pretty"),
    headless: !args.includes("--no-headless")
  };
}

function getObservedColliderLabels(state, levelId) {
  if (!state) return [];
  if (levelId === "home_intro") return (state.home?.houseColliders || []).map((entry) => entry.label).filter(Boolean);
  if (levelId === "level_two") return state.levelTwo?.colliderLabels || [];
  return [];
}

function matchExpectation(expectation, observedLabels) {
  if (expectation.colliderMatch === "exact") {
    return observedLabels.filter((label) => label === expectation.colliderLabel);
  }
  if (expectation.colliderMatch === "prefix") {
    return observedLabels.filter((label) => label.startsWith(expectation.colliderLabel || ""));
  }
  if (expectation.colliderMatch === "any") {
    return observedLabels.length ? [observedLabels[0]] : [];
  }
  return expectation.colliderLabel ? observedLabels.filter((label) => label.includes(expectation.colliderLabel)) : [];
}

function buildIssue({ id, name, objectLabel, expected, observed, kind }) {
  return {
    levelObjectId: id,
    name,
    issue: kind,
    expectedLabel: expected || null,
    observedMatches: observed
  };
}

function isTelemetryLevel(levelId) {
  return levelId === "home_intro" || levelId === "level_two";
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

  const parsed = parseArgs();
  const level = getLevel(parsed.levelId);
  if (!level) {
    throw new Error(`Unknown level id: ${parsed.levelId}`);
  }

  if (!isTelemetryLevel(level.id)) {
    const payload = {
      ok: true,
      command: "validate-missing-colliders",
      levelId: level.id,
      status: "unsupported",
      checked: 0,
      missing: 0,
      suspicious: 0,
      issues: [
        {
          issue: "collider_snapshot_unavailable",
          message: `No stable collider labels in render_game_to_text for ${level.id}; skipping missing-collider enforcement for this level.`
        }
      ]
    };
    console.log(parsed.pretty ? formatJson(payload) : JSON.stringify(payload));
    return;
  }

  const expectations = getColliderExpectations(level.id);
  const expectedSolid = expectations.filter((entry) => entry.collisionExpected);

  const { browser, page } = await launchGameBrowser({ headless: parsed.headless });
  try {
    const key = getDebugShortcut(level.id);
    if (key) {
      await jumpToLevel(page, key, level.id);
    } else {
      await setPaused(page, true);
      await waitForState(page, (state) => state?.scene?.id === level.id, { timeoutMs: 120000, label: "scene id" });
    }

    await setPaused(page, true);
    const inLevel = await waitForScenePlayPhase(page, level.id, { allowTitle: true, timeoutMs: 120000 });
    if (!inLevel?.scene?.id) {
      throw new Error(`Failed to enter ${level.id}`);
    }

    const state = await readState(page);
    const observed = getObservedColliderLabels(state, level.id);
    const observedUnique = Array.from(new Set(observed)).sort();
    const colliderSample = observedUnique.slice(0, 20);
    const issues = [];

    for (const expectation of expectedSolid) {
      if (!expectation.colliderLabel) {
        issues.push(buildIssue({
          id: expectation.id,
          name: expectation.name,
          objectLabel: expectation.category,
          expected: expectation.colliderLabel,
          observed: [],
          kind: "suspicious-missing-label"
        }));
        continue;
      }

      const matches = matchExpectation(expectation, observed);
      const required = Number(expectation.expectedColliderCount || 1);
      if (matches.length < required) {
        issues.push(buildIssue({
          id: expectation.id,
          name: expectation.name,
          objectLabel: expectation.colliderLabel,
          expected: expectation.colliderMatch === "prefix" ? `${expectation.colliderLabel}*` : expectation.colliderLabel,
          observed: matches,
          kind: "missing-collider"
        }));
      }
    }

    const suspicious = issues.filter((issue) => issue.issue === "suspicious-missing-label").length;
    const payload = {
      ok: issues.length === 0,
      command: "validate-missing-colliders",
      levelId: level.id,
      checked: expectedSolid.length,
      missing: issues.filter((issue) => issue.issue === "missing-collider").length,
      suspicious,
      issueCount: issues.length,
      issues,
      observedColliderCount: observedUnique.length,
      observedColliderSample: colliderSample,
      observedColliderTruncated: observedUnique.length > colliderSample.length,
      expectedColliderCount: expectedSolid.length
    };

    console.log(parsed.pretty ? formatJson(payload) : JSON.stringify(payload));
    if (!payload.ok) process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  const payload = {
    ok: false,
    command: "validate-missing-colliders",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
