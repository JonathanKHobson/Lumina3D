# Asset Library / Asset Catalog Future Scope

## User intent

The user wants a way to browse all available game assets and assets available for the current level. This is especially important for Level 3 creation.

## Do not overbuild yet

This sprint should not build full asset placement unless it is already almost available locally.

Recommended now:

- plan asset catalog data model,
- optionally add a read-only Asset Library tab,
- support search/filter,
- avoid drag/drop placement until source mapping is stable.

## Asset browser inspiration

Mature editors use search, type filters, labels/tags, IDs, and folder/group organization. Unity supports search filters like type and label. PlayCanvas' Assets Panel supports search/filter by name, ID, tags, or type. GameMaker's Asset Browser emphasizes tags for organizing/filtering assets.

## Recommended asset record

```js
{
  assetKey: "forestTreeA",
  label: "Forest Tree A",
  type: "prop",
  category: "nature",
  path: "assets/models/forestTreeA.glb",
  tags: ["tree", "forest", "nature", "level-prop"],
  availableInLevels: ["tutorial", "level_one", "level_two"],
  defaultTransform: {
    rotationY: 0,
    scale: 1
  },
  bounds: null,
  placement: {
    allowed: false,
    reason: "Read-only catalog in current sprint."
  }
}
```

## Asset library UI

Potential tabs:

```txt
Objects | Inspector | Assets | Timeline
```

Asset tab MVP:

```txt
[Search assets...]
[All] [Props] [Tiles] [Characters] [Buttons] [Platforms] [Decor]
[Current level only] [Used in scene] [Unused]
```

## Search fields

Search by:

- assetKey,
- display label,
- path,
- category/type,
- tags,
- current-level availability.

## Future placement flow

Later:

1. Select asset in Asset Library.
2. Click “Place in Level.”
3. Editor creates a draft object record.
4. User positions it with TransformControls.
5. Export includes a create/add-object request.
6. Codex applies source changes safely.

## Future export shape

```json
{
  "assetLibrarySelection": {
    "assetKey": "forestTreeA",
    "placementMode": "draft",
    "draftObject": {
      "id": "level_three.prop.forest_tree_a_001",
      "transform": {}
    }
  }
}
```

## Acceptance criteria for read-only asset library

- Shows assets from local asset registry/config.
- Search works.
- Filters by type/category/tag.
- Shows whether asset is already used in current level if easy.
- Does not create objects yet.
