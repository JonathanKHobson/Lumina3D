# Validation + Manual QA Checklist

## Automated/local commands

Codex should inspect `package.json` and run only commands that exist locally.

Likely commands:

```bash
npm run build
npm run editor
npm run tools:list-levels -- --pretty
npm run tools:get-level-manifest -- tutorial --pretty
npm run tools:get-level-manifest -- level_one --pretty
npm run tools:get-level-manifest -- level_two --pretty
npm run tools:list-level-objects -- tutorial --pretty
npm run tools:list-level-objects -- level_one --pretty
npm run tools:list-level-objects -- level_two --pretty
npm run tools:run-editor-smoke -- --pretty
```

If a command does not exist, Codex should not invent success. It should say it was unavailable.

## Manual QA — routes

- `/editor/` opens.
- `/` playable game still opens.
- No editor-only errors appear in playable game.

## Manual QA — object selection

- Select a prop.
- Select a button.
- Select a platform.
- Select a base ground tile.
- Select an elevated/extra tile.
- Selection helpers appear correctly.
- Inspector shows correct id/type/tags/movable state.

## Manual QA — tile movement

- Base tile is either movable or clearly locked.
- Elevated/source-backed tile can move.
- Transform controls attach to the correct target.
- Moving tile updates dirty state.
- Export includes tile changes or lock metadata.

## Manual QA — object list filtering

- Search by id works.
- Search by asset/type works.
- Search by note text works if notes exist.
- Quick filters work:
  - Tiles
  - Elevated
  - Movable
  - Locked
  - Dirty
  - Noted
  - Delete
  - Replace
- Visible/total counts update.
- Selected object is not silently lost when filters hide it.

## Manual QA — exports

- Copy state still works.
- Copy patch still works if present.
- Copy AI prompt still works if present.
- Export includes object notes/intents if present.
- Export includes delete/replace marks if present.
- Export includes tile movable/locked metadata.

## Manual QA — camera

- Camera orbit/drag/zoom still works.
- Camera tilt/pitch still works.
- Camera reset still works.
- Export includes camera context if implemented.

## Manual QA — non-regression

- Level Two still loads correctly.
- Tutorial and Level One still load if supported.
- Objects are oriented like the playable game.
- Existing mark delete/replace/reset behavior still works.
