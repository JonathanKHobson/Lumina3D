# Research References + Design Notes

## Three.js editor mechanics

### TransformControls

Three.js `TransformControls` is the right primitive for translate/rotate/scale gizmos in a custom editor. It attaches to an Object3D and can transform it in the scene.

Reference: https://threejs.org/docs/pages/TransformControls.html

### Raycaster

Three.js `Raycaster` is designed for mouse picking — determining what object is under the pointer in 3D space.

Reference: https://threejs.org/docs/pages/Raycaster.html

### InstancedMesh caution

Three.js `InstancedMesh` is for efficiently rendering many objects with the same geometry/material but different transforms. It reduces draw calls, but individual instance editing is different from editing ordinary Object3D nodes.

Reference: https://threejs.org/docs/pages/InstancedMesh.html

Design implication: if tiles are instanced, the editor needs either instance-matrix editing or proxy objects. Do not treat an individual instance as a normal Object3D without source-backed proxy support.

## Animation/timeline research

### Three.js animation system

Three.js provides `AnimationClip`, `KeyframeTrack`, and `AnimationMixer`. This can support keyframed playback/scrubbing, but it may be better for model/transform animation than puzzle-state preview.

Reference: https://threejs.org/docs/pages/AnimationClip.html

### Theatre.js

Theatre.js is a web animation library with a professional motion-design toolset and Three.js support. It is powerful, but likely too much dependency/workflow for this sprint.

Reference: https://www.theatrejs.com/

Recommendation: use a custom deterministic preview timeline first; consider Theatre.js only if the level editor becomes heavily animation-authoring driven.

## Asset/object filtering research

### Unity Project search

Unity supports project search filters by asset type and label, including typed filters like `t:` and `l:`.

Reference: https://docs.unity3d.com/Manual/ProjectView.html

Design implication: Lumina editor can adopt lightweight token filters like `type:tile`, `tag:elevated`, `mark:replace`.

### PlayCanvas Assets Panel

PlayCanvas asset panel supports search/filter by name, ID, tags, or type.

Reference: https://developer.playcanvas.com/user-manual/editor/interface/assets/

Design implication: Asset library should search by assetKey, ID, path, tags, type/category.

### GameMaker Asset Browser tags

GameMaker emphasizes tags as powerful for organizing/filtering assets.

Reference: https://manual.gamemaker.io/monthly/en/Introduction/The_Asset_Browser.htm

Design implication: Lumina asset records should include tags early, even if the first asset library is read-only.

## Vite module discovery

Vite supports `import.meta.glob()` for importing multiple modules by glob pattern. This can help discover editor adapters or asset manifests, but glob patterns must be literal.

Reference: https://vite.dev/guide/features.html#glob-import

Design implication: Future level adapters can use explicit registry first, then possibly `import.meta.glob` for auto-discovery.
