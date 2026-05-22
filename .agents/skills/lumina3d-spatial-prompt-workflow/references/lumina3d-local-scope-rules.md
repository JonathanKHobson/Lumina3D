# Lumina3D Local Scope Rules

## Local Source Of Truth

Work from local files and local Git state. Do not assume GitHub is current.

## Do Not Do Unless Explicitly Asked

- Merge.
- Push.
- Commit.
- Open a PR.
- Delete or overwrite parallel work.

## In Scope For The Prompt Workflow Lane

- `AI_GAME_DEV.md`.
- `AGENTS.md`.
- `docs/ai-prompt-workflow/*`.
- `.agents/skills/lumina3d-spatial-prompt-workflow/*`.

## Out Of Scope For This Lane

- Runtime/gameplay code.
- Level or scene implementation changes.
- Asset additions or asset path changes.
- Full editor implementation.
- MCP wrappers.
- Automation servers.
- Runtime hooks.
- Source-file writers.
- Broad refactors.

## Reporting Rule

If out-of-scope files are already changed locally, do not delete or overwrite them during this workflow. Report them and keep the prompt workflow lane isolated.
