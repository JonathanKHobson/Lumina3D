const VALIDATION_COMMANDS = [
  "npm run build",
  "npm run tools:list-levels -- --pretty",
  "npm run tools:get-level-manifest -- <level_id> --pretty",
  "npm run tools:list-level-objects -- <level_id> --pretty",
  "npm run tools:run-scene-smoke -- <level_id> --pretty",
  "npm run tools:validate-missing-colliders -- <level_id> --pretty",
  "npm run tools:validate-float-colliders -- <level_id> --pretty"
];

export function buildEditorAiPrompt(stateExport) {
  const levelId = stateExport?.levelId || "unknown_level";
  const json = JSON.stringify(stateExport || {}, null, 2);
  const summary = {
    activeLevel: levelId,
    affectedObjects: stateExport?.affectedObjectCount || 0,
    changedObjects: (stateExport?.objects || []).filter((objectExport) => objectExport.changes?.length > 0).length,
    notedObjects: stateExport?.noteCount || 0,
    markedDeleteObjects: stateExport?.deleteCount || 0,
    markedReplaceObjects: stateExport?.replaceCount || 0,
    mapLevelNote: stateExport?.levelNotePresent ? "yes" : "no",
    colliderProxyCount: stateExport?.colliderOverlay?.proxyCount || 0,
    selectedColliderProxyCount: stateExport?.colliderOverlay?.selectedProxyCount || 0,
    selectedObject: stateExport?.selectedObjectContext?.objectId || "none",
    selectedMovable: stateExport?.selectedObjectContext?.movable ? "yes" : "no",
    selectedLocked: stateExport?.selectedObjectContext?.locked ? "yes" : "no",
    selectedAsset: stateExport?.assetCatalog?.selectedAsset?.assetKey || "none",
    selectedAssetScope: stateExport?.assetCatalog?.selectedAsset?.sourceScope || "none",
    noteReferences: stateExport?.referenceCount || 0,
    visibleExternalAssets: stateExport?.assetCatalog?.filter?.visibleExternalAssetCount ?? "unknown",
    visibleAssets: stateExport?.assetCatalog?.filter?.visibleAssetCount ?? "unknown",
    totalAssets: stateExport?.assetCatalog?.filter?.totalAssetCount ?? stateExport?.assetCatalog?.assetCount ?? "unknown",
    visibleObjects: stateExport?.objectFilter?.visibleObjectCount ?? "unknown",
    totalObjects: stateExport?.objectFilter?.totalObjectCount ?? "unknown"
  };

  return `You are working in my local Lumina3D project files.

Implement the requested level edits from this editor handoff. Work from local files, inspect the current source before applying changes, preserve playable game behavior at /, and keep /editor/ separate from gameplay. Do not commit, push, pull, merge, rebase, reset, or switch branches unless I explicitly ask.

Summary:
- Active level: ${summary.activeLevel}
- Affected objects: ${summary.affectedObjects}
- Objects with transform changes: ${summary.changedObjects}
- Objects with notes: ${summary.notedObjects}
- Map-level note: ${summary.mapLevelNote}
- Objects marked delete: ${summary.markedDeleteObjects}
- Objects marked replace: ${summary.markedReplaceObjects}
- Editor collider/proxy hints: ${summary.colliderProxyCount}
- Selected object collider/proxy hints: ${summary.selectedColliderProxyCount}
- Selected object: ${summary.selectedObject}
- Selected object movable: ${summary.selectedMovable}
- Selected object locked: ${summary.selectedLocked}
- Note references: ${summary.noteReferences}
- Object list visible/total: ${summary.visibleObjects}/${summary.totalObjects}
- Selected read-only asset: ${summary.selectedAsset}
- Selected asset source scope: ${summary.selectedAssetScope}
- Asset list visible/total: ${summary.visibleAssets}/${summary.totalAssets}
- External assets visible: ${summary.visibleExternalAssets}

Implementation instructions:
- Apply transform changes to source-backed level data where the sourceRef is clear.
- Treat object editability fields as editor handoff context: movable objects can receive transform edits; locked objects should be annotated or adjusted only after inspecting the source mapping and lockReason.
- Use selectedObjectContext when the selected tile or object was inspected but has no transform change.
- Use assetCatalog.selectedAsset as read-only asset context only; do not spawn, place, or source-write new asset instances unless I explicitly ask for an asset placement slice.
- External asset references are metadata-only local library references. They are not imported into Lumina3D, not served by the game, and not placeable in this slice unless a future import/placement task explicitly asks for that work.
- Interpret #... tokens in notes as editor references, not casual hashtags. Use noteReferences and referenceGlossary to resolve referenced objects/assets before changing code.
- Object references point to current-level editor records and may include sourceRef, transform, editability, and collider context. Asset references point to read-only assetCatalog records and do not imply placement.
- If a # reference is unresolved or stale, inspect local files and ask/propose options instead of guessing.
- Treat top-level levelNote and levelNoteIntents as notes about the whole map, not a specific object.
- Interpret note tags using the included intentGlossary and each object's noteIntents.
- Use colliderProxies and selectedColliderProxies as visual handoff context only. Do not edit collider source unless an object note explicitly asks for @collision or the transform change clearly requires a paired collider/proxy update.
- Respect markedForDelete as deletion intent, but do not delete blindly if the object has behavior links or unclear source ownership.
- Respect markedForReplace as replacement intent, not simple deletion. Preserve role, behavior, and linkage when appropriate; if the replacement asset is unclear, propose options instead of guessing.
- Do not invent new gameplay behavior unless the object note explicitly asks for it.
- Do not rewrite unrelated systems or migrate architecture.
- Do not make the browser/editor directly rewrite source files.

Validation commands to run after applying changes:
${VALIDATION_COMMANDS.map((command) => `- ${command.replaceAll("<level_id>", levelId)}`).join("\n")}

Editor state JSON:
\`\`\`json
${json}
\`\`\`
`;
}
