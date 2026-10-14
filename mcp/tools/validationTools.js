import fs from "node:fs";
import path from "node:path";
import { z } from "zod/v4";

import { runAllowedCommand } from "../../scripts/lib/commandRunner.js";
import { readEditorStatePath } from "../../scripts/lib/editorStateStore.js";
import { MCP_PATCH_ROOT, ensureDirectory, projectRelativePath } from "../../scripts/lib/projectPaths.js";
import { listValidationSuites, runBuild, runLevelValidationSuite } from "../../scripts/lib/validationRunner.js";
import { VALIDATION, registerJsonTool } from "./toolResult.js";

function writeInlinePatch(patchJson) {
  ensureDirectory(MCP_PATCH_ROOT);
  const patchPath = path.join(MCP_PATCH_ROOT, `editor-patch-${Date.now()}.json`);
  fs.writeFileSync(patchPath, `${JSON.stringify(patchJson, null, 2)}\n`, "utf8");
  return projectRelativePath(patchPath);
}

export const VALIDATION_TOOL_NAMES = [
  "lumina_run_build",
  "lumina_run_level_validation_suite",
  "lumina_explain_editor_patch"
];

export function registerValidationTools(server) {
  registerJsonTool(
    server,
    "lumina_run_build",
    {
      title: "Lumina Run Build",
      description: "Validation-only allowlisted wrapper for npm run build. Writes build outputs/logs but never source edits.",
      inputSchema: {
        mode: z.enum(["summary", "full"]).optional().describe("summary returns a short preview; full returns a larger preview.")
      },
      annotations: VALIDATION
    },
    async ({ mode = "summary" }) => runBuild({ mode })
  );

  registerJsonTool(
    server,
    "lumina_run_level_validation_suite",
    {
      title: "Lumina Run Level Validation Suite",
      description: "Validation-only allowlisted suite runner for a Lumina3D level. Browser checks require an already-running local Vite server.",
      inputSchema: {
        levelId: z.string().min(1).describe("Level id or alias, for example level_two."),
        suite: z.enum(["basic", "collider", "editor_patch", "full"]).optional().describe("Validation suite to run."),
        patchPath: z.string().optional().describe("Optional project-relative patch path for editor_patch explanation.")
      },
      annotations: VALIDATION
    },
    async ({ levelId, suite = "basic", patchPath = "" }) => {
      const checkedPatchPath = patchPath ? projectRelativePath(readEditorStatePath(patchPath)) : "";
      return {
        ...(await runLevelValidationSuite({ levelId, suite, patchPath: checkedPatchPath })),
        availableSuites: listValidationSuites(),
        browserServerNote:
          "Browser-dependent checks use LUMINA3D_URL or http://127.0.0.1:5178/ and do not start a dev server."
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_explain_editor_patch",
    {
      title: "Lumina Explain Editor Patch",
      description: "Read-only allowlisted editor patch explainer. Accepts inline JSON or a project-root JSON path and never writes source files.",
      inputSchema: {
        patchPath: z.string().optional().describe("Project-relative JSON patch path."),
        patchJson: z.unknown().optional().describe("Inline editor patch JSON.")
      },
      annotations: VALIDATION
    },
    async ({ patchPath = "", patchJson = undefined }) => {
      if (!patchPath && patchJson === undefined) {
        return {
          ok: false,
          summary: "Provide patchPath or patchJson."
        };
      }
      const effectivePath = patchPath ? projectRelativePath(readEditorStatePath(patchPath)) : writeInlinePatch(patchJson);
      const result = await runAllowedCommand("explainEditorPatch", { patchPath: effectivePath }, { previewChars: 8000 });
      return {
        ...result,
        patchPath: effectivePath,
        summary: result.ok ? "Editor patch explanation completed." : result.summary
      };
    }
  );
}
