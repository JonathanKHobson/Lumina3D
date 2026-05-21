import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(THIS_DIR, "../..");
export const TMP_ROOT = path.join(PROJECT_ROOT, "tmp");
export const MCP_TMP_ROOT = path.join(TMP_ROOT, "lumina-mcp");
export const MCP_LOG_ROOT = path.join(MCP_TMP_ROOT, "logs");
export const MCP_PATCH_ROOT = path.join(MCP_TMP_ROOT, "patches");
export const DEFAULT_EDITOR_STATE_PATH = path.join(PROJECT_ROOT, "tmp/editor-state/current.json");

export function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function isInsideProject(absolutePath) {
  const relative = path.relative(PROJECT_ROOT, absolutePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function resolveProjectPath(inputPath) {
  if (typeof inputPath !== "string" || !inputPath.trim()) {
    throw new Error("Path is required.");
  }

  const resolved = path.resolve(PROJECT_ROOT, inputPath);
  if (!isInsideProject(resolved)) {
    throw new Error(`Path escapes project root: ${inputPath}`);
  }
  return resolved;
}

export function projectRelativePath(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");
}
