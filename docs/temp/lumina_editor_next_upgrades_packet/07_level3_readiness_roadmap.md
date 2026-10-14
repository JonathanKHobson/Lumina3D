# Roadmap Toward Level 3 Creation

## Goal

Reach the point where the editor can support real Level 3 design instead of only refining existing levels.

## Readiness milestones

### Milestone 1 — Editor reliability

- All current levels can load in editor.
- Objects are correctly oriented compared with playable game.
- Clickability and registry completeness are stable.
- Transform controls work for source-backed objects.
- Base/locked objects explain lock reasons.

### Milestone 2 — Object list usability

- Search/filter makes dense scenes manageable.
- Tiles can be hidden or filtered.
- Dirty/noted/delete/replace filters work.
- Export state uses filtered/selected object context well.

### Milestone 3 — AI handoff quality

- Copy AI Prompt creates useful instructions.
- Notes and @intent tags export with expanded meanings.
- Delete/replace marks are represented clearly.
- Dirty transforms and locked-object context are included.

### Milestone 4 — Asset catalog

- Asset Library tab shows available assets.
- Assets have categories/tags/default placement metadata.
- Current-level assets and global assets are distinguishable.

### Milestone 5 — Draft placement

- User can draft-place an asset.
- Placement exports as an add-object request.
- Codex can convert add-object requests into local source data changes.

### Milestone 6 — Timeline preview

- Moving platforms and button effects can be previewed.
- Timeline scrubber shows solution states.
- Timeline export includes current time and active events.

### Milestone 7 — Level 3 seed creation

- New level adapter/manifest can be generated.
- Level 3 can load in editor even if empty/skeleton.
- Asset Library can place initial objects.
- Exported AI prompt can ask Codex to materialize the first Level 3 source changes.

## Recommended next three implementation slices

### Slice A — Dense object control

- Tile editability fix.
- Object search/filter.
- Object counts.
- Tile lock reasons.

### Slice B — AI handoff upgrade

- Copy AI prompt polish.
- Better note/tag/export state.
- Dirty/locked/tile metadata.

### Slice C — Read-only asset catalog

- Asset Library tab.
- Search/filter assets.
- Asset availability metadata.
- No placement yet.

## When to start Level 3

Start Level 3 when:

- Tutorial/Level One/Level Two load in editor.
- Object list filtering is stable.
- At least one elevated tile can be moved and exported.
- Asset catalog can show what is available.
- AI prompt export can describe intended changes cleanly.
