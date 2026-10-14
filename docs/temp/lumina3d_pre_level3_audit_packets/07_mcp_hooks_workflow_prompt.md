# Codex Prompt — MCP, Hooks, and Documentation Maintenance Workflow

You are working in the Lumina3D repo. Improve the workflow layer so docs, bug reports, and planning files stay current without the AI silently rewriting everything.

## Read first

- README.md
- progress.md
- backlog.md
- bug_report.md
- docs/github-workflow.md
- docs/refactor-plan.md
- scripts/lib/levelCatalog.js
- package.json

## Task

Design and implement a lightweight maintenance workflow.

Preferred approach:

1. Add `docs/agent-closeout-checklist.md` with required closeout questions:
   - What changed?
   - What commands were run?
   - What passed/failed?
   - Did progress.md need an entry?
   - Did backlog.md need an update?
   - Did bug_report.md need an update?
   - Did any handbook docs become stale?
2. Add `scripts/check-closeout-docs.js` or similar that can be run manually to report likely stale docs after code changes. It should not auto-edit docs.
3. Add `npm run tools:check-closeout-docs`.
4. Add a `docs/context-packet.md` or script that tells agents which files to read for:
   - gameplay changes;
   - level editor changes;
   - collision changes;
   - Level Three additions;
   - MCP/tooling changes.
5. If a hook system is available in the local Codex setup, document recommended hook usage:
   - session-start hook: show context packet / key docs;
   - pre-commit or closeout hook: run check-closeout-docs and remind the agent to update progress/backlog/bug_report;
   - no auto-mutating docs without explicit task scope.
6. Update README.md and docs/github-workflow.md with the new commands.

## Verification

Run:

- npm run build
- npm run tools:check-closeout-docs
- npm run tools:list-levels

## Guardrails

- Do not create a noisy process that blocks tiny edits.
- Do not make the MCP or scripts auto-write progress.md.
- Scripts should report, not guess.
- Keep this workflow lightweight enough that it will actually be used.
