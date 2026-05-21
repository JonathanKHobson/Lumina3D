import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  MCP_LOG_ROOT,
  PROJECT_ROOT,
  ensureDirectory,
  projectRelativePath,
  resolveProjectPath
} from "./projectPaths.js";

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_PREVIEW_CHARS = 3000;
const DEFAULT_LUMINA_URL = "http://127.0.0.1:5178/";

const COMMAND_BUILDERS = {
  build: () => ({
    command: "npm",
    args: ["run", "build"],
    display: "npm run build"
  }),
  listLevels: () => ({
    command: "npm",
    args: ["run", "tools:list-levels", "--", "--pretty"],
    display: "npm run tools:list-levels -- --pretty"
  }),
  getLevelManifest: ({ levelId }) => ({
    command: "npm",
    args: ["run", "tools:get-level-manifest", "--", levelId, "--pretty"],
    display: `npm run tools:get-level-manifest -- ${levelId} --pretty`
  }),
  listLevelObjects: ({ levelId }) => ({
    command: "npm",
    args: ["run", "tools:list-level-objects", "--", levelId, "--pretty"],
    display: `npm run tools:list-level-objects -- ${levelId} --pretty`
  }),
  runSceneSmoke: ({ levelId }) => ({
    command: "npm",
    args: ["run", "tools:run-scene-smoke", "--", levelId, "--pretty"],
    display: `npm run tools:run-scene-smoke -- ${levelId} --pretty`,
    env: { LUMINA3D_URL: process.env.LUMINA3D_URL || DEFAULT_LUMINA_URL }
  }),
  validateMissingColliders: ({ levelId }) => ({
    command: "npm",
    args: ["run", "tools:validate-missing-colliders", "--", levelId, "--pretty"],
    display: `npm run tools:validate-missing-colliders -- ${levelId} --pretty`,
    env: { LUMINA3D_URL: process.env.LUMINA3D_URL || DEFAULT_LUMINA_URL }
  }),
  validateFloatColliders: ({ levelId }) => ({
    command: "npm",
    args: ["run", "tools:validate-float-colliders", "--", levelId, "--pretty"],
    display: `npm run tools:validate-float-colliders -- ${levelId} --pretty`,
    env: { LUMINA3D_URL: process.env.LUMINA3D_URL || DEFAULT_LUMINA_URL }
  }),
  validateEditorSync: ({ levelId = "all" } = {}) => ({
    command: "npm",
    args: ["run", "tools:validate-editor-sync", "--", levelId, "--pretty"],
    display: `npm run tools:validate-editor-sync -- ${levelId} --pretty`
  }),
  runEditorSmoke: () => ({
    command: "npm",
    args: ["run", "tools:run-editor-smoke", "--", "--pretty"],
    display: "npm run tools:run-editor-smoke -- --pretty",
    env: {
      LUMINA3D_URL: process.env.LUMINA3D_URL || DEFAULT_LUMINA_URL,
      LUMINA3D_EDITOR_URL: process.env.LUMINA3D_EDITOR_URL || `${DEFAULT_LUMINA_URL.replace(/\/$/, "")}/editor/`
    }
  }),
  explainEditorPatch: ({ patchPath }) => {
    const resolved = resolveProjectPath(patchPath);
    const relative = projectRelativePath(resolved);
    return {
      command: "npm",
      args: ["run", "tools:explain-editor-patch", "--", relative],
      display: `npm run tools:explain-editor-patch -- ${relative}`
    };
  }
};

export function listAllowedCommandIds() {
  return Object.keys(COMMAND_BUILDERS);
}

function previewText(text, maxChars = DEFAULT_PREVIEW_CHARS) {
  const trimmed = String(text || "").trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}\n...[truncated ${trimmed.length - maxChars} chars]`;
}

function buildLogPath(commandId) {
  ensureDirectory(MCP_LOG_ROOT);
  const safeCommand = String(commandId).replace(/[^a-z0-9_-]/gi, "-");
  return path.join(MCP_LOG_ROOT, `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeCommand}.log`);
}

function writeCommandLog({ logPath, spec, stdout, stderr, exitCode, durationMs, timedOut }) {
  const body = [
    `$ ${spec.display}`,
    `cwd: ${PROJECT_ROOT}`,
    `exitCode: ${exitCode}`,
    `durationMs: ${durationMs}`,
    `timedOut: ${timedOut}`,
    "",
    "## stdout",
    stdout || "",
    "",
    "## stderr",
    stderr || ""
  ].join("\n");
  fs.writeFileSync(logPath, body, "utf8");
}

export async function runAllowedCommand(commandId, params = {}, options = {}) {
  const buildSpec = COMMAND_BUILDERS[commandId];
  if (!buildSpec) {
    throw new Error(`Command is not allowlisted: ${commandId}`);
  }

  const spec = buildSpec(params);
  const timeoutMs = Number(options.timeoutMs || spec.timeoutMs || DEFAULT_TIMEOUT_MS);
  const previewChars = Number(options.previewChars || DEFAULT_PREVIEW_CHARS);
  const startedAt = Date.now();
  const logPath = buildLogPath(commandId);

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const child = spawn(spec.command, spec.args, {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        ...(spec.env || {})
      },
      shell: false
    });

    const finish = (exitCode, error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      if (error) stderr = `${stderr}\n${error.message || String(error)}`.trim();
      writeCommandLog({ logPath, spec, stdout, stderr, exitCode, durationMs, timedOut });
      const ok = exitCode === 0 && !timedOut && !error;
      resolve({
        ok,
        commandId,
        command: spec.display,
        exitCode,
        durationMs,
        timedOut,
        summary: ok ? `${spec.display} passed.` : `${spec.display} failed.`,
        stdoutPreview: previewText(stdout, previewChars),
        stderrPreview: previewText(stderr, previewChars),
        logPath: projectRelativePath(logPath)
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => finish(-1, error));
    child.on("close", (code) => finish(code ?? -1));
  });
}
