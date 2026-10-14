import { z } from "zod/v4";

import { getArchetypeContract, listArchetypes } from "../../scripts/lib/archetypeRegistry.js";
import { READ_ONLY, registerJsonTool } from "./toolResult.js";

export const ARCHETYPE_TOOL_NAMES = ["lumina_list_archetypes", "lumina_get_archetype_contract"];

export function registerArchetypeTools(server) {
  registerJsonTool(
    server,
    "lumina_list_archetypes",
    {
      title: "Lumina List Archetypes",
      description: "Read-only discovery list for Lumina3D gameplay archetype contracts.",
      inputSchema: {
        category: z.string().optional().describe("Optional category filter such as button, platform, collider, pickup, prop, or spawn."),
        status: z.enum(["active", "planned", "experimental"]).optional().describe("Optional implementation status filter.")
      },
      annotations: READ_ONLY
    },
    async ({ category = "", status = "" }) => {
      const archetypes = listArchetypes({ category, status });
      return {
        ok: true,
        summary: `${archetypes.length} archetypes found.`,
        count: archetypes.length,
        archetypes
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_get_archetype_contract",
    {
      title: "Lumina Get Archetype Contract",
      description: "Read-only contract detail for a known Lumina3D gameplay archetype.",
      inputSchema: {
        archetypeId: z.string().min(1).describe("Archetype id such as button.red, ramp.blue, or collider.walkable.")
      },
      annotations: READ_ONLY
    },
    async ({ archetypeId }) => {
      const contract = getArchetypeContract(archetypeId);
      if (!contract) {
        return {
          ok: false,
          summary: `Unknown archetype: ${archetypeId}`,
          archetypeId
        };
      }
      return {
        ok: true,
        summary: `Archetype contract loaded for ${archetypeId}.`,
        archetypeId,
        contract
      };
    }
  );
}
