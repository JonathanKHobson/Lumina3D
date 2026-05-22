# Lumina3D MCP MVP

The Lumina3D MCP is a local stdio server for giving Codex compact project context, level data, editor-state snapshots, allowlisted validation wrappers, gameplay archetype contracts, and a guarded current-branch publish helper.

The normal surface is read-only plus validation. It does not apply patches, scaffold objects, mutate source files, expose arbitrary shell commands, or run an HTTP editor bridge. The only write/open-world tool is the guarded Git publish helper, which requires explicit confirmation and runs the project publish checklist before pushing.

## Tools

| Tool | Type | Purpose |
|---|---|---|
| `lumina_health` | read-only | Check server, project root, package metadata, exposed tools, and command allowlist. |
| `lumina_project_summary` | read-only | Return a compact repo/script/editor/MCP overview. |
| `lumina_list_levels` | read-only | List levels from `scripts/lib/levelCatalog.js`. |
| `lumina_get_level_manifest` | read-only | Return one level manifest by level id or alias. |
| `lumina_list_level_objects` | read-only | Return compact object summaries with optional category and limit filters. |
| `lumina_get_current_editor_state` | read-only | Read `tmp/editor-state/current.json` or the `LUMINA3D_EDITOR_STATE_PATH` override. |
| `lumina_list_archetypes` | read-only | Discover gameplay archetype contracts. |
| `lumina_get_archetype_contract` | read-only | Return one archetype contract, such as `button.red`. |
| `lumina_run_build` | validation | Run the allowlisted `npm run build` wrapper. |
| `lumina_run_level_validation_suite` | validation | Run `basic`, `collider`, `editor_patch`, or `full` validation suites. |
| `lumina_explain_editor_patch` | validation/read-only | Explain an editor patch from inline JSON or a project-root JSON path. |
| `lumina_publish_current_branch` | git publish | Guarded wrapper that runs status, `git diff --check`, build, stage, commit, push, and final status/log for the current branch. Requires `confirm: true`. |

## Safety Model

- stdio stdout is reserved for MCP protocol traffic. Server diagnostics use stderr.
- Commands are allowlisted in `scripts/lib/commandRunner.js`; there is no arbitrary command tool.
- Commands run with `spawn(..., shell: false)`.
- Path inputs resolve inside the project root and reject traversal or outside-root absolute paths.
- Command responses return concise previews, exit code, duration, and a project-relative log path.
- Full command logs are written under ignored `tmp/lumina-mcp/logs/`.
- Inline editor patches for explanation are written under ignored `tmp/lumina-mcp/patches/`.
- Validation wrappers do not start or own a Vite dev server. Browser-dependent checks use `LUMINA3D_URL` or `http://127.0.0.1:5178/`.
- No MCP tool writes source files in this MVP.
- `lumina_publish_current_branch` is intentionally the one remote-mutating exception. It does not run arbitrary shell commands; it calls the allowlisted `tools:publish-current-branch` script, requires `confirm: true`, refuses branch mismatches, and runs `npm run build` before commit/push.

## Codex Config

Add this to a trusted project-scoped `.codex/config.toml` or to `~/.codex/config.toml`:

```toml
[mcp_servers.lumina3d]
command = "npm"
args = ["run", "mcp:stdio"]
cwd = "/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D"
tool_timeout_sec = 120
```

You can also launch the stdio server directly:

```bash
npm run mcp:stdio
```

Use the smoke client to verify the tool surface without adding the server to Codex:

```bash
npm run mcp:smoke
```

The smoke check starts the stdio server through an MCP client, lists the exact expected tools, confirms no source-write/apply/scaffold tools are exposed, calls health, levels, the Level Two manifest, archetype discovery/contract, the missing editor-state fallback, and the publish tool's `confirm: false` refusal path.

## Publishing

For the current Lumina3D branch, agents can use either the npm script directly:

```bash
npm run tools:publish-current-branch -- --message "Update Lumina3D Level 3 and editor prep" --branch codex/lumina3d-level-editor-mvp --yes --pretty
```

or the MCP tool:

```json
{
  "tool": "lumina_publish_current_branch",
  "arguments": {
    "message": "Update Lumina3D Level 3 and editor prep",
    "branch": "codex/lumina3d-level-editor-mvp",
    "confirm": true
  }
}
```

The helper is for publishing an already-reviewed current branch. It does not open or merge PRs.

## Validation Suites

`lumina_run_level_validation_suite` supports:

| Suite | Commands |
|---|---|
| `basic` | `tools:get-level-manifest`, `tools:list-level-objects`, `tools:run-scene-smoke` |
| `collider` | `tools:validate-missing-colliders`, `tools:validate-float-colliders` |
| `editor_patch` | `tools:run-editor-smoke`, optionally `tools:explain-editor-patch` when `patchPath` is supplied |
| `full` | build, manifest, objects, scene smoke, collider validators, editor smoke |

Scene and editor smoke commands require an already-running local Vite server. Start one in another terminal when needed:

```bash
npm run dev:test
```

## Editor State

For the MVP, the editor state bridge is file-backed:

```txt
tmp/editor-state/current.json
```

The expected payload is the editor export schema already used by the browser editor:

```txt
lumina3d.editor.stateExport.v1
```

`lumina_get_current_editor_state` returns a compact summary by default, including level id, selected object id, affected object counts, notes, delete/replace marks, and up to 20 affected object summaries. Use `detail: "full"` only when the raw export is needed.

## Archetype Registry

The MVP registry lives in `scripts/lib/archetypeRegistry.js` and exposes active and planned gameplay contracts. Initial entries include:

```txt
button.blue
button.red
platform.red
ramp.blue
pickup.letter
collider.solid
collider.walkable
prop.static
spawn.player
spawn.companion
button.yellow
button.green
```

These contracts are AI-facing context, not a second game engine. Runtime behavior remains owned by the game source.

## Future Roadmap

Next phases should stay explicit and separate:

1. Browser-to-local editor bridge: `POST /editor-state` bound to `127.0.0.1`, with Origin validation.
2. MCP resources for stable read-only context such as `lumina://levels` and `lumina://archetypes`.
3. MCP prompts for editor handoff, collision review, and button/platform puzzle review workflows.
4. Dry-run patch preview tools that return diffs but do not write source files.
5. Approved write tools only after dry-run behavior is reliable and explicit write mode is required.
6. Archetype validation and scaffolding after the registry is stable.

## References

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Codex MCP docs](https://developers.openai.com/codex/mcp)
- [MCP stdio transport rules](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
