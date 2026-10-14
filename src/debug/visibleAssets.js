export function currentVisibleAssetsForState(state, sceneIds) {
  if (state.scene.id === sceneIds.HOME) {
    return [
      "kaykit-blockbits-sand-with-grass",
      "kaykit-blockbits-sand-a-path",
      "kaykit-medieval-home-a-blue",
      "kaykit-forest-tree",
      "kaykit-forest-bush",
      "kaykit-forest-rock",
      "kaykit-forest-grass-1b-detail",
      "kaykit-platformer-character",
      "generated-door-note",
      "animals-farm-background-clouds-under-scene"
    ];
  }
  if (state.scene.id === sceneIds.LEVEL_ONE) {
    return [
      "kaykit-blockbits-sand-with-grass",
      "kaykit-blockbits-sand-a-path",
      "kaykit-blockbits-water",
      "generated-level-one-lily-pad",
      "generated-blue-flower-latch",
      "generated-blue-bloom-mats-held",
      state.levelOne.blueBloomDocked ? "generated-blue-bloom-mats-docked" : null,
      state.levelOne.blueBloomDocked ? "generated-blue-dock-glows" : null,
      "kaykit-forest-tree",
      "kaykit-forest-bush",
      "kaykit-forest-rock",
      "kaykit-forest-grass-1b-detail",
      "kaykit-platformer-character",
      "voxel-frog",
      "frog-cubeling",
      "kaykit-platformer-button-blue",
      state.reveals.spellbook ? "kaykit-love-letter-closed-model" : null,
      state.reward.active || state.celebration.active ? "kaykit-love-letter-open-model" : null,
      "kaykit-platformer-heart-red-particles",
      "animals-farm-background-clouds-under-scene"
    ].filter(Boolean);
  }
  if (state.scene.id === sceneIds.LEVEL_TWO) {
    return [
      "kaykit-blockbits-sand-with-grass",
      "kaykit-blockbits-sand-a-path",
      "kaykit-blockbits-multi-tier-central-mountain",
      "kaykit-blockbits-central-mountain-support-layers",
      "kaykit-blockbits-frog-side-ledge",
      "kaykit-blockbits-blue-button-ledge",
      "kaykit-blockbits-elephant-totem-hill",
      "kaykit-blockbits-red-elevator-a-top-connector",
      "kaykit-blockbits-human-love-letter-route",
      "kaykit-forest-tree",
      "kaykit-forest-bush",
      "kaykit-forest-rock",
      "kaykit-forest-grass-1b-detail",
      "kaykit-platformer-character",
      "voxel-frog",
      "frog-cubeling",
      state.levelTwo.elephantSpawned ? "elephant-cubeling-real-awake-actor" : null,
      "kaykit-platformer-button-blue-level-two",
      !state.levelTwo.blueRampActive || state.levelTwo.blueRampRevealActive ? "generated-blue-ramp-dormant-panel-visual-only" : null,
      state.levelTwo.blueRampActive ? "kaykit-platformer-blue-ramp" : null,
      state.levelTwo.elephantEchoVisible && !state.levelTwo.elephantAwake ? "elephant-echo-transparent-spawn-marker" : null,
      state.levelTwo.elephantEchoVisible ? "elephant-echo-muted-grey-ground-circle" : null,
      state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected ? "elephant-cubeling-totem-small-gold-floating-elephant" : null,
      "kaykit-platformer-button-red-weight-elevator-a",
      "kaykit-platformer-button-red-weight-elevator-b",
      "kaykit-platformer-red-elevator-a",
      "kaykit-platformer-red-elevator-b",
      "kaykit-love-letter-closed-placeholder-noncollectable",
      "animals-farm-background-clouds-under-scene"
    ].filter(Boolean);
  }
  if (state.scene.id === sceneIds.LEVEL_THREE) {
    return [
      "kaykit-blockbits-sand-with-grass",
      "kaykit-blockbits-water",
      "generated-level-three-island-zone-markers",
      "generated-level-one-lily-pad-shared-visual-walkable-phase-2a",
      "generated-level-three-lily-pad-track-markers",
      "kaykit-platformer-button-green-material-variant-repeatable-phase-2a",
      "kaykit-platformer-button-red-placeholder",
      "generated-level-three-crocodile-echo-dormant-awake-visual",
      state.levelThree.crocodileSpawned ? "generated-crocodile-cubeling-temporary-phase-3a" : null,
      "generated-level-three-crocodile-totem-raft-smooth-gated-drift",
      "generated-level-three-totem-raft-fixed-state-markers",
      "generated-level-three-totem-raft-reed-gates",
      "generated-level-three-start-island-fixed-totem-dock-marker",
      "generated-level-three-small-artificial-bridge-pivot",
      "generated-level-three-inactive-bridge-arm-hint",
      "generated-level-three-bridge-destination-markers",
      "generated-level-three-red-button-b-stone-sockets",
      "generated-level-three-anchor-stone-placeholders",
      "generated-level-three-love-letter-cliff",
      "kaykit-forest-tree",
      "kaykit-forest-bush",
      "kaykit-forest-rock",
      "kaykit-forest-grass-1b-detail",
      "kaykit-platformer-character",
      "voxel-frog",
      "frog-cubeling",
      "kaykit-love-letter-closed-placeholder-noncollectable",
      "animals-farm-background-clouds-under-scene"
    ].filter(Boolean);
  }
  return [
    "kaykit-blockbits-sand-with-grass",
    "kaykit-blockbits-sand-with-grass-left-start-floor",
    state.reveals.rightFloor ? "kaykit-blockbits-sand-with-grass-right-floor" : null,
    state.reveals.frogEcho ? "frog-echo-transparent-spawn-marker" : null,
    state.reveals.frogEcho ? "frog-echo-muted-grey-ground-circle" : null,
    state.reveals.frogTotem ? "frog-cubeling-totem-small-gold-floating-frog" : null,
    state.reveals.frog ? "voxel-frog" : null,
    state.reveals.frog ? "frog-cubeling" : null,
    state.reveals.barrier ? "kaykit-dungeon-barrier" : null,
    state.reveals.barrier ? "kaykit-dungeon-barrier-colum-half-end-caps" : null,
    "kaykit-platformer-character",
    state.reveals.button ? "kaykit-platformer-button-blue" : null,
    state.reveals.spellbook ? "kaykit-love-letter-closed-model" : null,
    state.reward.active || state.celebration.active ? "kaykit-love-letter-open-model" : null,
    "generated-transfer-sparkles",
    "kaykit-platformer-heart-red-particles",
    "animals-farm-background-clouds-under-scene"
  ].filter(Boolean);
}
