#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const EXPECTED_TOOLS = [
  "lumina_health",
  "lumina_project_summary",
  "lumina_list_levels",
  "lumina_get_level_manifest",
  "lumina_list_level_objects",
  "lumina_run_build",
  "lumina_run_level_validation_suite",
  "lumina_explain_editor_patch",
  "lumina_get_current_editor_state",
  "lumina_list_archetypes",
  "lumina_get_archetype_contract",
  "lumina_publish_current_branch"
];

const FORBIDDEN_TOOL_PATTERNS = [/apply/i, /dry.*run/i, /scaffold/i, /write/i, /run.*any.*command/i];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readPayload(result) {
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((item) => item.type === "text")?.text;
  assert(text, "Tool returned no structuredContent or text content.");
  return JSON.parse(text);
}

function toolNames(listResult) {
  return listResult.tools.map((tool) => tool.name).sort();
}

async function callJsonTool(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  return readPayload(result);
}

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp/server.js"],
    env: {
      ...process.env,
      LUMINA3D_EDITOR_STATE_PATH: "tmp/lumina-mcp-smoke/missing-current-editor-state.json"
    },
    stderr: "pipe"
  });
  const client = new Client({ name: "lumina3d-mcp-smoke", version: "0.1.0" });

  try {
    await client.connect(transport);

    const listedNames = toolNames(await client.listTools());
    assert(
      JSON.stringify(listedNames) === JSON.stringify([...EXPECTED_TOOLS].sort()),
      `Unexpected tool list.\nExpected: ${EXPECTED_TOOLS.sort().join(", ")}\nActual: ${listedNames.join(", ")}`
    );
    for (const name of listedNames) {
      assert(!FORBIDDEN_TOOL_PATTERNS.some((pattern) => pattern.test(name)), `Forbidden write-like tool exposed: ${name}`);
    }

    const health = await callJsonTool(client, "lumina_health");
    assert(health.ok === true, "lumina_health failed.");
    assert(health.availableTools?.length === EXPECTED_TOOLS.length, "health tool count mismatch.");

    const levels = await callJsonTool(client, "lumina_list_levels");
    assert(levels.ok === true && levels.count >= 4, "lumina_list_levels did not return expected levels.");

    const manifest = await callJsonTool(client, "lumina_get_level_manifest", { levelId: "level_two" });
    assert(manifest.ok === true && manifest.levelId === "level_two", "level_two manifest lookup failed.");

    const archetypes = await callJsonTool(client, "lumina_list_archetypes");
    assert(archetypes.ok === true && archetypes.archetypes.some((entry) => entry.id === "button.red"), "button.red archetype missing.");

    const redButton = await callJsonTool(client, "lumina_get_archetype_contract", { archetypeId: "button.red" });
    assert(redButton.ok === true && redButton.contract?.behaviorContract?.activation === "held_weight_contact", "button.red contract mismatch.");

    const editorState = await callJsonTool(client, "lumina_get_current_editor_state");
    assert(editorState.ok === false && editorState.status === "missing", "missing editor-state fallback failed.");

    const publishRefusal = await callJsonTool(client, "lumina_publish_current_branch", {
      message: "Smoke should not publish",
      branch: "smoke",
      confirm: false
    });
    assert(publishRefusal.ok === false && publishRefusal.requiredInput === "confirm", "publish confirmation refusal failed.");

    console.log(`[OK] Lumina MCP smoke passed with ${listedNames.length} tools.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("[FAIL] Lumina MCP smoke failed.");
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
