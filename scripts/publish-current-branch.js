#!/usr/bin/env node
import { spawn } from "node:child_process";

const HELP_TEXT = `Usage:
  node scripts/publish-current-branch.js --message "Commit message" [--branch <branch>] [--remote origin] --yes [--pretty]

Publishes the current Lumina3D branch by running:
  git status -sb
  git diff --check
  npm run build
  git add -A
  git commit -m <message>
  git push <remote> <branch>
  git status -sb
  git log --oneline -1 --decorate

The command requires --yes so agents cannot push accidentally.`;

function parseArgs(argv) {
  const parsed = {
    branch: "",
    message: "",
    remote: "origin",
    yes: false,
    pretty: false,
    help: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--yes") parsed.yes = true;
    else if (arg === "--pretty") parsed.pretty = true;
    else if (arg === "--branch") parsed.branch = argv[++index] || "";
    else if (arg === "--message" || arg === "-m") parsed.message = argv[++index] || "";
    else if (arg === "--remote") parsed.remote = argv[++index] || "";
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function assertSafeToken(value, label) {
  if (!value || /[\r\n]/.test(value)) throw new Error(`${label} is required and must be one line.`);
  return value;
}

function runStep(name, command, args) {
  const display = [command, ...args].join(" ");
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, { shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("close", (code) => {
      resolve({
        name,
        command: display,
        exitCode: code ?? -1,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr
      });
    });
    child.on("error", (error) => {
      resolve({
        name,
        command: display,
        exitCode: -1,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr: `${stderr}\n${error.message || String(error)}`.trim()
      });
    });
  });
}

async function checkedStep(steps, name, command, args) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = await runStep(name, command, args);
  steps.push(result);
  if (result.exitCode !== 0) {
    const error = new Error(`${name} failed with exit code ${result.exitCode}.`);
    error.result = result;
    throw error;
  }
  return result;
}

function lastLine(text) {
  return String(text || "").trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  if (!args.yes) throw new Error("Refusing to publish without --yes.");

  const message = assertSafeToken(args.message, "Commit message");
  const remote = assertSafeToken(args.remote || "origin", "Remote");
  const steps = [];

  const currentBranchResult = await checkedStep(steps, "current_branch", "git", ["branch", "--show-current"]);
  const currentBranch = lastLine(currentBranchResult.stdout);
  const branch = args.branch ? assertSafeToken(args.branch, "Branch") : currentBranch;
  if (!currentBranch) throw new Error("Could not determine current git branch.");
  if (branch !== currentBranch) {
    throw new Error(`Current branch is ${currentBranch}, but publish target is ${branch}. Checkout the target branch first.`);
  }

  await checkedStep(steps, "status_before", "git", ["status", "-sb"]);
  await checkedStep(steps, "diff_check", "git", ["diff", "--check"]);
  await checkedStep(steps, "build", "npm", ["run", "build"]);
  await checkedStep(steps, "stage_all", "git", ["add", "-A"]);

  const stagedResult = await checkedStep(steps, "staged_names", "git", ["diff", "--cached", "--name-only"]);
  const stagedFiles = String(stagedResult.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  let commitHash = "";
  if (stagedFiles.length > 0) {
    await checkedStep(steps, "commit", "git", ["commit", "-m", message]);
    const commitResult = await checkedStep(steps, "commit_hash", "git", ["rev-parse", "--short", "HEAD"]);
    commitHash = lastLine(commitResult.stdout);
  } else {
    console.log("\nNo staged changes after git add -A; skipping commit and pushing current branch.");
  }

  await checkedStep(steps, "push", "git", ["push", remote, branch]);
  const statusAfter = await checkedStep(steps, "status_after", "git", ["status", "-sb"]);
  const logAfter = await checkedStep(steps, "log_after", "git", ["log", "--oneline", "-1", "--decorate"]);

  const summary = {
    ok: true,
    branch,
    remote,
    commitHash: commitHash || lastLine(logAfter.stdout).split(" ")[0],
    committed: stagedFiles.length > 0,
    stagedFiles,
    status: lastLine(statusAfter.stdout),
    latestCommit: lastLine(logAfter.stdout),
    steps: steps.map((step) => ({
      name: step.name,
      command: step.command,
      exitCode: step.exitCode,
      durationMs: step.durationMs
    }))
  };
  console.log(args.pretty ? JSON.stringify(summary, null, 2) : JSON.stringify(summary));
}

main().catch((error) => {
  const payload = {
    ok: false,
    error: error.message || String(error),
    failedStep: error.result?.name || null,
    command: error.result?.command || null,
    exitCode: error.result?.exitCode ?? null
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
});
