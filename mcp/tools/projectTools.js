import fs from "node:fs";
import path from "node:path";
import { z } from "zod/v4";

import { listAllowedCommandIds } from "../../scripts/lib/commandRunner.js";
import { getLevelManifest, getLevelObjects, listLevels } from "../../scripts/lib/levelCatalog.js";
import { PROJECT_ROOT, projectRelativePath } from "../../scripts/lib/projectPaths.js";
import { READ_ONLY, registerJsonTool } from "./toolResult.js";

function readPackageJson() {
  const packagePath = path.join(PROJECT_ROOT, "package.json");
  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relativePath));
}

function compactObject(object, { includeSourceRefs = false } = {}) {
  const payload = {
    id: object.id,
    name: object.name,
    type: object.type,
    category: object.category,
    asset: {
      key: object?.asset?.key || "unknown",
      path: object?.asset?.path || null
    },
    position: object.position,
    rotationY: object.rotationY,
    collisionExpected: Boolean(object.collisionExpected),
    colliderLabel: object.colliderLabel || null,
    mechanismLink: object.mechanismLink || null
  };
  if (includeSourceRefs) {
    payload.sourceRef = object.sourceRef || null;
    payload.runtimeProbe = object.runtimeProbe || null;
  }
  return payload;
}

export const PROJECT_TOOL_NAMES = [
  "lumina_health",
  "lumina_project_summary",
  "lumina_list_levels",
  "lumina_get_level_manifest",
  "lumina_list_level_objects"
];

export function registerProjectTools(server, allToolNames) {
  registerJsonTool(
    server,
    "lumina_health",
    {
      title: "Lumina Health",
      description: "Read-only health check for the local Lumina3D MCP server, project root, package metadata, and exposed tool names.",
      annotations: READ_ONLY
    },
    async () => {
      const pkg = readPackageJson();
      return {
        ok: true,
        summary: "Lumina3D MCP server is running.",
        projectRoot: PROJECT_ROOT,
        packageName: pkg.name,
        packageVersion: pkg.version,
        nodeVersion: process.version,
        availableTools: allToolNames,
        allowedCommands: listAllowedCommandIds()
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_project_summary",
    {
      title: "Lumina Project Summary",
      description: "Read-only compact project overview for Lumina3D folders, package scripts, MCP docs, and editor/tooling availability.",
      inputSchema: {
        includeScripts: z.boolean().optional().describe("Include package.json script names when true.")
      },
      annotations: READ_ONLY
    },
    async ({ includeScripts = false }) => {
      const pkg = readPackageJson();
      return {
        ok: true,
        summary: "Lumina3D project summary loaded.",
        projectRoot: PROJECT_ROOT,
        package: {
          name: pkg.name,
          version: pkg.version,
          type: pkg.type
        },
        detectedPaths: {
          src: pathExists("src"),
          levels: pathExists("src/levels"),
          scenes: pathExists("src/scenes"),
          systems: pathExists("src/systems"),
          editor: pathExists("src/editor"),
          mcp: pathExists("mcp"),
          docsMcp: pathExists("docs/mcp"),
          scriptsLib: pathExists("scripts/lib")
        },
        scripts: includeScripts ? Object.keys(pkg.scripts || {}) : undefined,
        dependencies: {
          mcpSdk: pkg.dependencies?.["@modelcontextprotocol/sdk"] || null,
          zod: pkg.dependencies?.zod || null,
          three: pkg.dependencies?.three || null,
          vite: pkg.dependencies?.vite || null
        }
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_list_levels",
    {
      title: "Lumina List Levels",
      description: "Read-only list of known Lumina3D levels from the local level catalog. Use before level-specific inspection.",
      inputSchema: {
        includeUnsupported: z.boolean().optional().describe("Reserved for future fixture filtering; current levels are returned either way.")
      },
      annotations: READ_ONLY
    },
    async () => {
      const levels = listLevels();
      return {
        ok: true,
        summary: `${levels.length} levels found.`,
        count: levels.length,
        levels
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_get_level_manifest",
    {
      title: "Lumina Get Level Manifest",
      description: "Read-only compact manifest for a single Lumina3D level from scripts/lib/levelCatalog.js.",
      inputSchema: {
        levelId: z.string().min(1).describe("Level id or alias, for example level_two.")
      },
      annotations: READ_ONLY
    },
    async ({ levelId }) => {
      const manifest = getLevelManifest(levelId);
      if (!manifest) {
        return {
          ok: false,
          summary: `Unknown level id: ${levelId}`,
          levelId
        };
      }
      return {
        ok: true,
        summary: `Manifest loaded for ${manifest.id}.`,
        levelId: manifest.id,
        manifest
      };
    }
  );

  registerJsonTool(
    server,
    "lumina_list_level_objects",
    {
      title: "Lumina List Level Objects",
      description: "Read-only object summaries for a Lumina3D level with optional category filtering and limit.",
      inputSchema: {
        levelId: z.string().min(1).describe("Level id or alias, for example level_two."),
        categories: z.array(z.string()).optional().describe("Optional categories to include."),
        includeSourceRefs: z.boolean().optional().describe("Include source/runtime probe refs when available."),
        limit: z.number().int().min(1).max(200).optional().describe("Maximum objects to return. Defaults to 100.")
      },
      annotations: READ_ONLY
    },
    async ({ levelId, categories = [], includeSourceRefs = false, limit = 100 }) => {
      const manifest = getLevelManifest(levelId);
      if (!manifest) {
        return {
          ok: false,
          summary: `Unknown level id: ${levelId}`,
          levelId
        };
      }
      const categorySet = new Set(categories);
      const allObjects = getLevelObjects(levelId)
        .filter((object) => categorySet.size === 0 || categorySet.has(object.category))
        .map((object) => compactObject(object, { includeSourceRefs }));
      const objects = allObjects.slice(0, limit);
      return {
        ok: true,
        summary: `${objects.length} of ${allObjects.length} objects returned for ${manifest.id}.`,
        levelId: manifest.id,
        count: objects.length,
        totalMatchingCount: allObjects.length,
        truncated: allObjects.length > objects.length,
        objects,
        projectRelativeDataFile: manifest.levelDataFile ? projectRelativePath(path.join(PROJECT_ROOT, manifest.levelDataFile)) : null
      };
    }
  );
}
