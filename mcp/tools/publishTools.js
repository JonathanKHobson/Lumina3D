import { z } from "zod/v4";

import { runAllowedCommand } from "../../scripts/lib/commandRunner.js";
import { registerJsonTool } from "./toolResult.js";

const GIT_PUBLISH = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true
};

export const PUBLISH_TOOL_NAMES = [
  "lumina_publish_current_branch"
];

export function registerPublishTools(server) {
  registerJsonTool(
    server,
    "lumina_publish_current_branch",
    {
      title: "Lumina Publish Current Branch",
      description:
        "Guarded GitHub publish wrapper for the current Lumina3D branch. Runs git status, git diff --check, npm run build, stages all changes, commits, pushes, and reports the final commit. Requires explicit confirm=true.",
      inputSchema: {
        message: z.string().min(1).describe("One-line commit message."),
        branch: z.string().optional().describe("Expected current branch. The tool refuses to publish if the checkout is on a different branch."),
        remote: z.string().optional().describe("Git remote to push to. Defaults to origin."),
        confirm: z.boolean().describe("Must be true to run the publish flow.")
      },
      annotations: GIT_PUBLISH
    },
    async ({ message, branch = "", remote = "origin", confirm = false }) => {
      if (!confirm) {
        return {
          ok: false,
          summary: "Refusing to publish without confirm=true.",
          requiredInput: "confirm"
        };
      }
      return runAllowedCommand("publishCurrentBranch", { message, branch, remote }, { timeoutMs: 300000, previewChars: 12000 });
    }
  );
}
