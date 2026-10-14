import { z } from "zod/v4";

import { getCurrentEditorState } from "../../scripts/lib/editorStateStore.js";
import { READ_ONLY, registerJsonTool } from "./toolResult.js";

export const EDITOR_TOOL_NAMES = ["lumina_get_current_editor_state"];

export function registerEditorTools(server) {
  registerJsonTool(
    server,
    "lumina_get_current_editor_state",
    {
      title: "Lumina Get Current Editor State",
      description:
        "Read-only file-backed lookup for the latest editor state export at tmp/editor-state/current.json.",
      inputSchema: {
        detail: z.enum(["summary", "full"]).optional().describe("summary returns compact counts and affected objects; full returns raw JSON.")
      },
      annotations: READ_ONLY
    },
    async ({ detail = "summary" }) => getCurrentEditorState({ detail })
  );
}
