# Editor Object List Search + Filtering Spec

## Problem

Now that floor/ground/tile objects are included, the editor object list can become noisy and difficult to use.

The object list needs search, filters, counts, and possibly default hiding of base terrain.

## Recommended UI

At top of object list:

```txt
[ Search objects...                         ]
[All] [Changed] [Noted] [Delete] [Replace]
[Movable] [Locked] [Tiles] [Elevated] [Props]
42 / 318 objects shown
```

Optional advanced filter input:

```txt
type:tile tag:elevated movable:true
```

## Minimum filters

### Text search

Search should match:

- id
- label/name
- type/category
- assetKey
- tags
- note text

### Quick filters

- All
- Dirty/Changed
- Noted
- Marked Delete
- Marked Replace
- Movable
- Locked
- Tiles/Ground
- Elevated Tiles
- Props
- Buttons
- Platforms
- Colliders/Triggers if present

### Default display recommendation

Default view should probably hide base/structural ground tiles if they flood the list.

Use a filter like:

```js
hideBaseGroundByDefault: true
```

but make it visible/toggleable.

## Data requirements

Every editor record should have enough metadata:

```js
{
  id,
  label,
  type,
  category,
  assetKey,
  tags: [],
  dirty: false,
  noted: false,
  markedForDelete: false,
  markedForReplace: false,
  movable: true,
  locked: false,
  lockReason: null
}
```

## Filter state

Recommended state shape:

```js
{
  query: "",
  quickFilters: new Set(),
  hideBaseGround: true,
  sortMode: "categoryThenName"
}
```

## Search syntax future-proofing

Support plain search now. Add token syntax later if easy:

| Syntax | Meaning |
|---|---|
| `type:tile` | Only tile objects |
| `tag:elevated` | Objects with elevated tag |
| `asset:grass` | Asset key/name contains grass |
| `state:dirty` | Changed objects |
| `mark:delete` | Marked delete |
| `mark:replace` | Marked replace |
| `movable:true` | Movable objects |
| `locked:true` | Locked objects |

## Selection behavior

If selected object is hidden by filter:

Option A: show a small warning:

```txt
Selected object is hidden by current filters. [Show Selected]
```

Option B: always keep selected object visible in a pinned section.

Recommended MVP: Add a “Show Selected” button or clear filters affordance.

## Smoke/debug output

`window.render_editor_to_text()` should include:

```txt
activeLevel=level_two
objectCountTotal=318
objectCountVisible=42
objectSearchQuery=grass
activeFilters=tiles,elevated,movable
selectedObject=level_two.tile.mountain_034
selectedHiddenByFilters=false
```

## Acceptance criteria

- Search filters object list by id/name/type/asset/tags/note.
- Quick filters work.
- Tile-heavy levels are navigable.
- Counts are accurate.
- Selection is not lost accidentally.
- Existing object operations still work after filtering.
