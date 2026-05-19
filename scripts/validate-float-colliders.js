import {
  formatJson,
  launchGameBrowser,
  readState,
  waitForScenePlayPhase,
  setPaused,
  jumpToLevel,
  waitForState
} from "./lib/cli-utils.js";
import { getDebugShortcut, getFloatWatchObjects, getLevel, getColliderExpectations } from "./lib/levelCatalog.js";

const USAGE_TEXT = "node scripts/validate-float-colliders.js [<level_id>] [--pretty] [--no-headless]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:validate-float-colliders -- level_two --pretty\n  npm run tools:validate-float-colliders -- level_one`;

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

function hasColliderMatch(observedLabels, expectation) {
  if (!expectation.colliderLabel) return false;
  if (expectation.colliderMatch === "exact") {
    return observedLabels.includes(expectation.colliderLabel);
  }
  if (expectation.colliderMatch === "prefix") {
    return observedLabels.some((label) => label.startsWith(expectation.colliderLabel));
  }
  if (expectation.colliderMatch === "any") {
    return observedLabels.length > 0;
  }
  return observedLabels.includes(expectation.colliderLabel);
}

function validateObjectElevation(object, tolerance = 0.45) {
  const y = Number(object?.position?.y ?? 0);
  const min = Number((object.elevationBand?.min ?? (y - 0.2)));
  const max = Number((object.elevationBand?.max ?? (y + 0.2)));
  if (y < min - tolerance) {
    return {
      ok: false,
      kind: "sinking",
      details: `y=${y} below band min=${min}`
    };
  }
  if (y > max + tolerance) {
    return {
      ok: false,
      kind: "floating",
      details: `y=${y} above band max=${max}`
    };
  }
  return { ok: true };
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

  const floatingCandidates = getFloatWatchObjects(level.id);
  const expectations = getColliderExpectations(level.id);
  const expectationsById = new Map(expectations.map((entry) => [entry.id, entry]));

  const { browser, page } = await launchGameBrowser({ headless: parsed.headless });
  try {
    const key = getDebugShortcut(level.id);
    if (key) {
      await jumpToLevel(page, key, level.id);
    } else {
      await setPaused(page, true);
      await waitForState(page, (nextState) => nextState?.scene?.id === level.id, { timeoutMs: 120000, label: "scene id" });
    }

    await setPaused(page, true);
    await waitForScenePlayPhase(page, level.id, { allowTitle: true, timeoutMs: 120000 });
    const state = await readState(page);
    const observed = getObservedColliderLabels(state, level.id);
    const observedUnique = Array.from(new Set(observed)).sort();
    const colliderSample = observedUnique.slice(0, 20);

    const issues = [];
    for (const entry of floatingCandidates) {
      const elevation = validateObjectElevation(entry);
      if (!elevation.ok) {
        issues.push({
          levelObjectId: entry.id,
          name: entry.name,
          issue: elevation.kind,
          details: elevation.details,
          elevationBand: entry.elevationBand || null,
          position: entry.position || null
        });
      }

      const expectation = expectationsById.get(entry.id);
      if (entry.collisionExpected && expectation?.collisionExpected && isTelemetryLevel(level.id)) {
        const hasMatch = hasColliderMatch(observed, expectation);
        if (!hasMatch) {
          issues.push({
            levelObjectId: entry.id,
            name: entry.name,
            issue: "missing-collision-context",
            details: `No observed collider probe matched ${expectation.colliderLabel || "unnamed collider label"} for collision-required object`,
            colliderLabel: expectation.colliderLabel || null
          });
        }
      }
    }

    const missing = issues.filter((issue) => issue.issue === "missing-collider").length;
    const suspicious = issues.filter((issue) => issue.issue !== "missing-collider").length;
    const payload = {
      ok: issues.length === 0,
      command: "validate-float-colliders",
      levelId: level.id,
      checked: floatingCandidates.length,
      missing,
      suspicious,
      issueCount: issues.length,
      issues,
      observedColliderCount: observedUnique.length,
      observedColliderSample: colliderSample,
      observedColliderTruncated: observedUnique.length > colliderSample.length
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
    command: "validate-float-colliders",
    error: {
      message: error?.message || String(error),
      usage: USAGE_TEXT
    }
  };
  console.log(formatJson(payload));
  process.exit(1);
});
