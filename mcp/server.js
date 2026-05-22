#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ARCHETYPE_TOOL_NAMES, registerArchetypeTools } from "./tools/archetypeTools.js";
import { EDITOR_TOOL_NAMES, registerEditorTools } from "./tools/editorTools.js";
import { PUBLISH_TOOL_NAMES, registerPublishTools } from "./tools/publishTools.js";
import { PROJECT_TOOL_NAMES, registerProjectTools } from "./tools/projectTools.js";
import { VALIDATION_TOOL_NAMES, registerValidationTools } from "./tools/validationTools.js";

export const LUMINA_MCP_TOOL_NAMES = [
  ...PROJECT_TOOL_NAMES,
  ...VALIDATION_TOOL_NAMES,
  ...EDITOR_TOOL_NAMES,
  ...ARCHETYPE_TOOL_NAMES,
  ...PUBLISH_TOOL_NAMES
];

export function createLuminaMcpServer() {
  const server = new McpServer({
    name: "lumina3d",
    version: "0.1.0",
    instructions:
      "Local Lumina3D MCP. Use compact project, level, editor-state, validation, archetype, and guarded current-branch publish tools. No source-writing patch tools or arbitrary shell tools are exposed."
  });

  registerProjectTools(server, LUMINA_MCP_TOOL_NAMES);
  registerValidationTools(server);
  registerEditorTools(server);
  registerArchetypeTools(server);
  registerPublishTools(server);

  return server;
}

async function main() {
  const server = createLuminaMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lumina3D MCP server connected over stdio.");
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  main().catch((error) => {
    console.error("Lumina3D MCP server failed to start.");
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}
