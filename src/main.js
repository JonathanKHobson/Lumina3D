import * as THREE from "three";
import "./styles.css";

import { ASSETS } from "./config/assets.js";
import {
  ACTOR_BLOCK_PADDING,
  BUTTON_RADIUS,
  BUTTON_TOP_PRESSED_Y,
  BUTTON_TOP_REST_Y,
  CELEBRATION_HEART_INTERVAL,
  CELEBRATION_MIN_SECONDS,
  DOOR_ROW,
  FLOOR_TARGET,
  FROG_CELEBRATION_MIN_DISTANCE,
  FROG_CELEBRATION_PERCH_RADIUS,
  FROG_CELEBRATION_SPEED,
  FROG_DOORWAY_CLEAR_SPEED,
  FROG_JUMP_LIFT,
  FROG_PATROL_PAUSE_MAX,
  FROG_PATROL_PAUSE_MIN,
  FROG_PATROL_SPEED,
  FROG_SMALL_HOP_HEIGHT,
  JUMP_DURATION,
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  LOVE_LETTER_APPROACH_RADIUS,
  LOVE_LETTER_ATTENTION_BOUNCE_SECONDS,
  LOVE_LETTER_BLOCK_RADIUS,
  LOVE_LETTER_BOUNCE_INTERVAL,
  LOVE_LETTER_HEART_INTERVAL,
  LOVE_LETTER_LESSON_COOLDOWN,
  LOVE_LETTER_MESSAGE_DELAY_SECONDS,
  LOVE_LETTER_MESSAGE_INPUT_BUFFER_SECONDS,
  LOVE_LETTER_REMINDER_SECONDS,
  LOVE_LETTER_REVEAL_SECONDS,
  LOVE_LETTER_SPARKLE_INTERVAL,
  NUDGE_REPEAT_WINDOW,
  POSSESSION_RADIUS,
  SPEECH_SECONDS,
  SPELLBOOK_RADIUS,
  SURFACE_Y,
  TILE,
  TRANSFER_INPUT_GRACE_RADIUS,
  UNLOCK_STORAGE_KEY,
  WALL_COLUMN,
  WORLD_BOUNDS
} from "./config/constants.js";
import { LEVEL_ONE_LOVE_LETTER_ID, LEVEL_TWO_LOVE_LETTER_ID, REWARD_NAME, TUTORIAL_LOVE_LETTER_ID } from "./content/loveLetters.js";
import { ELEPHANT_ECHO_LINES, FROG_ECHO_LINES, FROG_TOTEM_LINES } from "./content/dialogue.js";
import { actorCanPressButton, syncButtonTopVisual } from "./systems/buttonSystem.js";
import { applyCameraUpdate, getCameraFacingDirection, stepCameraYaw } from "./systems/cameraSystem.js";
import {
  clearSpeechQueue as clearSpeechQueueState,
  getSecondarySpeechBubble as getSecondarySpeechBubbleState,
  getSpeechBubble as getSpeechBubbleState,
  queueSpeech as queueSpeechState,
  setSpeech as setSpeechState,
  showSecondarySpeech as showSecondarySpeechState,
  showSpeech as showSpeechState,
  updateSpeechQueue as updateSpeechQueueState
} from "./systems/dialogueSystem.js";
import { circleIntersectsAabb, clamp, clampZoneToBoundsForRadius, pointInBounds } from "./systems/collisionSystem.js";
import { captureMoveKeyDown, captureMoveKeyUp, createInputState, inputVectorFromKeys } from "./systems/inputSystem.js";
import {
  chooseFrogCelebrationHopTargetSystem,
  chooseFrogCelebrationPerchSystem,
  chooseFrogDoorwayClearTargetSystem,
  chooseFrogPatrolTargetSystem,
  updateCelebratingFrogSystem,
  updateFrogAiSystem
} from "./systems/frogAiSystem.js";
import {
  currentTutorialStepId,
  frogUnlockStepForState,
  recordTutorialNudgeState,
  shouldRequestTutorialSkip,
  tutorialHasLearned,
  tutorialStepBefore
} from "./systems/tutorialSystem.js";
import {
  clearParticles,
  spawnHeartParticles,
  spawnLandingPuff,
  spawnLoveLetterHearts,
  spawnRevealSparkles,
  spawnTransferParticles,
  updateParticles
} from "./systems/particleSystem.js";
import { devCameraSnapshot, enterDevCamera, exitDevCamera, handleDevCameraKeyDown, handleDevCameraKeyUp, updateDevCamera, zoomDevCameraFromWheel } from "./debug/devCameraControls.js";
import { handleDevEditorKeyDown, handleDevEditorPointerDown, initDevEditor, syncDevEditorColliderHelpers, syncDevEditorSelectionToScene, toggleDevEditorPanel, updateDevEditorPanel } from "./debug/devEditor.js";
import { installTestHooks } from "./debug/testHooks.js";
import { currentVisibleAssetsForState } from "./debug/visibleAssets.js";
import { SCENES } from "./config/scenes.js";
import { cloneLoadedAsset, loadAssetRegistry, placeLoadedAsset } from "./core/assetLoader.js";
import { buildActorMeshes } from "./core/actors.js";
import { createBlueButtonMarker } from "./core/buttonMarker.js";
import { gridPoint, sceneGridPoint } from "./core/grid.js";
import { setupMarkerMeshes } from "./core/markers.js";
import { applySceneRevealVisibility } from "./core/revealVisibility.js";
import { createGameCamera, createGameRenderer, setupSceneLights } from "./core/renderer.js";
import { syncActorMeshPositions, syncMarkerMeshes } from "./core/syncMeshes.js";
import { debugSceneForCode } from "./debug/debugLevelSelect.js";
import {
  createActorState,
  createCelebrationState,
  createHomeState,
  createLevelOneState,
  createLevelThreeState,
  createLevelTwoState,
  createLoveLetterAttentionState,
  createLoveLetterMessageState,
  createTutorialRecoveryState
} from "./state/gameState.js";
import { loadCubelingUnlocks as loadCubelingUnlocksFromStorage, saveCubelingUnlocks as saveCubelingUnlocksToStorage } from "./state/persistence.js";
import {
  HOME_ARROW_HINT_SECONDS,
  HOME_BOUNDS,
  HOME_DOOR_NOTE_TEXT,
  HOME_EXIT_RADIUS,
  HOME_HEIGHT,
  HOME_NOTE_EXIT_RADIUS,
  HOME_NOTE_RADIUS,
  HOME_POINTS,
  HOME_TRAIL_HINT_SECONDS,
  HOME_TRAIL_LINES,
  HOME_WIDTH,
  HOME_WRONG_WAY_LINES
} from "./levels/homeIntroLevel.js";
import {
  LEVEL_ONE_BOUNDS,
  LEVEL_ONE_BLUE_BLOOM_LATCH,
  LEVEL_ONE_BLUE_BLOOM_MATS,
  LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS,
  LEVEL_ONE_BLUE_BLOOM_TIMING,
  LEVEL_ONE_FROG_WATER_SPEECH_COOLDOWN,
  LEVEL_ONE_BUTTON,
  LEVEL_ONE_CROSSING_ACTOR_LIFT,
  LEVEL_ONE_CROSSING_ROW,
  LEVEL_ONE_CROSSING_Z,
  LEVEL_ONE_HEIGHT,
  LEVEL_ONE_HINT_SECONDS,
  LEVEL_ONE_JUMP_ZONE,
  LEVEL_ONE_LANDING,
  LEVEL_ONE_LEFT_APPROACH,
  LEVEL_ONE_LILY_PAD,
  LEVEL_ONE_LOVE_LETTER_POINT,
  LEVEL_ONE_RIGHT_APPROACH,
  LEVEL_ONE_WATER_COLUMNS,
  LEVEL_ONE_WIDTH
} from "./levels/levelOne.js";
import {
  LEVEL_TWO_BOUNDS,
  LEVEL_TWO_BLUE_RAMP,
  LEVEL_TWO_BUTTON_LEDGE_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS,
  LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES,
  LEVEL_TWO_CENTRAL_MOUNTAIN_TILES,
  LEVEL_TWO_ELEPHANT_ECHO_HEIGHT,
  LEVEL_TWO_ELEPHANT_ECHO_OPACITY,
  LEVEL_TWO_ELEPHANT_ECHO_RADIUS,
  LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TIER,
  LEVEL_TWO_ELEPHANT_ECHO_SPARKLE,
  LEVEL_TWO_ELEPHANT_ECHO_SPEECH_COOLDOWN,
  LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TILES,
  LEVEL_TWO_ELEPHANT_ECHO_TOP_Y,
  LEVEL_TWO_ELEPHANT_IDLE_BOB,
  LEVEL_TWO_ELEPHANT_RADIUS,
  LEVEL_TWO_ELEPHANT_REVEAL_SECONDS,
  LEVEL_TWO_ELEPHANT_SPEED,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL,
  LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
  LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE,
  LEVEL_TWO_FROG_JUMPABLE_LEDGES,
  LEVEL_TWO_FROG_SIDE_LEDGE_TILES,
  LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT,
  LEVEL_TWO_HEIGHT,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID,
  LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES,
  LEVEL_TWO_LOVE_LETTER_CLEARANCE,
  LEVEL_TWO_MOUNTAIN_LAYER_COUNT,
  LEVEL_TWO_MOUNTAIN_PEAK_Y,
  LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_RED_BUTTON_INVALID_COOLDOWN,
  LEVEL_TWO_RED_BUTTONS,
  LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES,
  LEVEL_TWO_RED_ELEVATOR_A_GROUND_CLEARANCE_TILES,
  LEVEL_TWO_RED_ELEVATOR_A_START_DELAY_SECONDS,
  LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE,
  LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE,
  LEVEL_TWO_RED_PLATFORMS,
  LEVEL_TWO_RESERVED_TERRACE_GROUPS,
  LEVEL_TWO_RESERVED_TERRACE_TILES,
  LEVEL_TWO_TIER_BASE_Y,
  LEVEL_TWO_TIER_STEP_Y,
  LEVEL_TWO_WIDTH
} from "./levels/levelTwo.js";
import {
  LEVEL_THREE_ANCHOR_STONES,
  LEVEL_THREE_BOUNDS,
  LEVEL_THREE_BRIDGE_PIVOT,
  LEVEL_THREE_BRIDGE_STATE_METADATA,
  LEVEL_THREE_BRIDGE_DESTINATION_MARKERS,
  LEVEL_THREE_CROCODILE_ECHO,
  LEVEL_THREE_CROCODILE_RADIUS,
  LEVEL_THREE_CROCODILE_SPAWN,
  LEVEL_THREE_CROCODILE_SPEED,
  LEVEL_THREE_FROG_LANE_JUMPS,
  LEVEL_THREE_FROG_LANE_RESET_COOLDOWN,
  LEVEL_THREE_FROG_LANE_RESET_POINT,
  LEVEL_THREE_FROG_LANE_WATER_RESET_ZONE,
  LEVEL_THREE_FROG_WATER_BLOCK_COOLDOWN,
  LEVEL_THREE_FROG_LILY_PAD_SURFACE_PADDING,
  LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS,
  LEVEL_THREE_HEIGHT,
  LEVEL_THREE_ISLAND_MARKERS,
  LEVEL_THREE_ISLANDS,
  LEVEL_THREE_LAND_TILES,
  LEVEL_THREE_LILY_PAD_PLACEHOLDERS,
  LEVEL_THREE_LILY_PAD_MIN_EDGE_GAP,
  LEVEL_THREE_LILY_PAD_MIN_ISLAND_GAP,
  LEVEL_THREE_MAP_SHAPE,
  LEVEL_THREE_PATH_TILES,
  LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y,
  LEVEL_THREE_PLACEHOLDER_IDS,
  LEVEL_THREE_POINTS,
  LEVEL_THREE_RAFT_MARKERS,
  LEVEL_THREE_RED_BUTTON_PLACEHOLDERS,
  LEVEL_THREE_RESERVED_ZONES,
  LEVEL_THREE_RESET_PERCH_PLACEHOLDERS,
  LEVEL_THREE_START_EDGE_CONNECTION_TILES,
  LEVEL_THREE_TOTEM_RAFT_DRIFT_SECONDS,
  LEVEL_THREE_TOTEM_RAFT_GATES,
  LEVEL_THREE_TOTEM_COLLECTION_RADIUS,
  LEVEL_THREE_TOTEM_GREEN_BUTTON_RADIUS,
  LEVEL_THREE_TOTEM_RAFT,
  LEVEL_THREE_WATER_TILES,
  LEVEL_THREE_WIDTH
} from "./levels/levelThree.js";
import {
  BARRIER_END_CAP_COLUMN_EDGE_OFFSET,
  BARRIER_REVEAL_FLOOR_LEAD,
  BARRIER_REVEAL_SECONDS,
  BARRIER_REVEAL_STAGGER,
  BARRIER_TOP_HEIGHT,
  DOORWAY_CLEAR_HALF_X,
  DOORWAY_CLEAR_HALF_Z,
  DOORWAY_CLEAR_TARGET_OFFSET,
  FLOOR_EDGE_MAX_Z,
  FLOOR_EDGE_MIN_Z,
  FREE_PLAY_PROMPT,
  FROG_ECHO_OPACITY,
  FROG_ECHO_RADIUS,
  FROG_ECHO_SPEECH_COOLDOWN,
  FROG_ECHO_SPARKLE,
  FROG_ECHO_TINT,
  FROG_REVEAL_SECONDS,
  FROG_TOTEM,
  FROG_TOTEM_RADIUS,
  FROG_TOTEM_REVEAL_DELAY,
  FROG_TOTEM_REVEAL_SECONDS,
  FROG_TOTEM_SPARKLE,
  FROG_TOTEM_SPEECH_COOLDOWN,
  FROG_TOTEM_VISUAL_SCALE,
  GUIDED_STEP_COUNT,
  LOVE_LETTER_BARRIER_REVEAL_DISTANCE,
  RIGHT_FLOOR_REVEAL_SECONDS,
  SPELLBOOK,
  SPEECH_STEPS,
  START,
  STEP_IDS,
  TUTORIAL_BUTTON,
  TUTORIAL_STEPS
} from "./levels/tutorialLevel.js";
import { buildHomeScene } from "./scenes/homeIntroScene.js";
import {
  confirmHomeExitFlow,
  openHomeExitConfirmFlow,
  startHomeIntroScene,
  stayInHomeIntroFlow,
  updateHomeSceneFlow
} from "./scenes/homeIntroFlow.js";
import { resetLevelOneSceneFlow, startLevelOneScene, updateLevelOneSceneFlow } from "./scenes/levelOneFlow.js";
import { buildLevelOneScene } from "./scenes/levelOneScene.js";
import { resetLevelThreeSceneFlow, startLevelThreeScene, updateLevelThreeSceneFlow } from "./scenes/levelThreeFlow.js";
import { buildLevelThreeScene } from "./scenes/levelThreeScene.js";
import { resetLevelTwoSceneFlow, startLevelTwoScene, updateLevelTwoSceneFlow } from "./scenes/levelTwoFlow.js";
import { buildLevelTwoScene } from "./scenes/levelTwoScene.js";
import { buildTutorialScene } from "./scenes/tutorialScene.js";
import { resetTutorialSceneFlow } from "./scenes/tutorialFlow.js";
import {
  createHudRefs,
  getHudGoalLabel,
  getHudPrompt,
  getHudStepLabel,
  renderContinuePrompt,
  renderControlsPanel,
  renderHudBase,
  renderLevelCompleteModal,
  renderLoveLetterMessageModal,
  renderSceneOverlays,
  renderSkipModal,
  renderSpeechBubbleElement
} from "./ui/hud.js";

const TUTORIAL_RECOVERY_RESET_LESSON_SECONDS = 5.5;
const TUTORIAL_RECOVERY_RESCUE_NUDGE_SECONDS = 10.0;
const TUTORIAL_RECOVERY_PROMPT_COOLDOWN_SECONDS = 3.2;
const TUTORIAL_RECOVERY_PROMPT = "Frog is across the wall. Press R to reset the tutorial, or wait and Frog may step on the button.";
const TUTORIAL_RECOVERY_RESCUE_PROMPT = "Frog may still solve this. Press R to reset, or wait a little longer.";
const TUTORIAL_RECOVERY_CHARACTER_LINE = "Oh no. How am I gonna reach the Love Letter now?";

const hud = createHudRefs();
let tutorialBannerAttentionKey = "";

const state = {
  ready: false,
  error: "",
  active: "human",
  scene: {
    id: SCENES.TUTORIAL,
    phase: "guided",
    titleCardVisible: false,
    titleCardText: "",
    fadeVisible: false,
    visibleAssets: []
  },
  home: {
    phase: "inactive",
    titleElapsed: 0,
    arrivalElapsed: 0,
    noteVisible: false,
    noteRead: false,
    noteZoneInside: false,
    noteOpenCount: 0,
    exitReady: false,
    exitDirection: "east",
    exitZoneInside: false,
    exitConfirmVisible: false,
    exitConfirmOpenCount: 0,
    exitConfirmCooldownUntil: 0,
    hintTimer: 0,
    arrowVisible: false,
    trailHintShown: false,
    trailHintBursts: 0,
    wrongWayIndex: 0,
    trailLineIndex: 0,
    postNoteLineShown: false,
    trailExplorationLineShown: false,
    lastDialogueAt: -Infinity,
    transitionTimer: 0
  },
  levelOne: createLevelOneState("inactive"),
  levelTwo: {
    phase: "inactive",
    titleElapsed: 0,
    arrivalElapsed: 0,
    elevatedGoalVisible: false,
    placeholderLoveLetterVisible: false,
    placeholderLoveLetterCollectable: false,
    frogSurfaceId: null,
    humanSurfaceId: null,
    blueButtonPressed: false,
    blueRampActive: false,
    blueRampRevealActive: false,
    blueRampRevealElapsed: 0,
    elephantEchoVisible: false,
    elephantEchoPromptIndex: 0,
    lastElephantEchoPromptAt: -Infinity,
    elephantEchoSparkleTimer: 0.7,
    elephantTotemVisible: false,
    elephantTotemCollected: false,
    elephantUnlockPending: false,
    elephantAwake: false,
    elephantSpawned: false,
    elephantSurfaceId: null,
    elephantRevealActive: false,
    elephantRevealElapsed: 0,
    elephantSpawnCount: 0,
    lastElephantTransferPromptAt: -Infinity,
    redButtons: {},
    redPlatforms: {},
    redElevatorAStartGate: {
      released: true,
      delayRemaining: 0,
      waitingReason: "grounded-start"
    },
    lastRedButtonInvalidPromptAt: -Infinity,
    lastFrogJumpResult: "none",
    lastFrogJumpReason: "",
    lastFrogJumpAt: -Infinity,
    frogTooHighPromptCount: 0,
    lastTotemPromptAt: -Infinity,
    complete: false
  },
  levelThree: createLevelThreeState("inactive"),
  human: createActorState(START.human, 0.45, 4.2),
  frog: createActorState(START.frog, 0.53, 3.45),
  elephant: createActorState({
    ...LEVEL_TWO_POINTS.elephantEcho,
    facing: { x: 0, z: 1, name: "south" }
  }, LEVEL_TWO_ELEPHANT_RADIUS, LEVEL_TWO_ELEPHANT_SPEED),
  crocodile: createActorState(LEVEL_THREE_CROCODILE_SPAWN, LEVEL_THREE_CROCODILE_RADIUS, LEVEL_THREE_CROCODILE_SPEED),
  unlocks: loadCubelingUnlocks(),
  cubelings: {
    frog: { unlocked: false, unlockedThisTutorial: false },
    elephant: { unlocked: false, unlockedPending: false, active: false, spawned: false },
    crocodile: { unlocked: false, unlockedPending: false, active: false, spawned: false, controllable: false }
  },
  tutorialIndex: 0,
  maxTutorialIndexReached: 0,
  tutorialSkipped: false,
  controlsOpen: false,
  devEditor: {
    open: false,
    selectedObjectId: "",
    nudgeStep: 0.25,
    snapToGrid: true,
    transformMode: "translate",
    transformDragging: false,
    showColliders: false,
    debugCamera: null,
    rows: []
  },
  reveals: {
    rightFloor: false,
    frogEcho: false,
    frogTotem: false,
    frog: false,
    barrier: false,
    button: false,
    spellbook: false
  },
  frogEcho: { promptIndex: 0, lastPromptAt: -Infinity, sparkleTimer: 0 },
  frogTotem: { collected: false, promptIndex: 0, lastPromptAt: -Infinity, sparkleTimer: 0 },
  frogTotemReveal: { active: false, elapsed: 0, delay: 0 },
  frogReveal: { active: false, elapsed: 0 },
  rightFloorReveal: { active: false, elapsed: 0 },
  barrierReveal: { active: false, elapsed: 0, landed: [] },
  loveLetterReveal: { active: false, elapsed: 0 },
  loveLetterAttention: createLoveLetterAttentionState(),
  skipModal: { visible: false, reason: "", anchor: "human" },
  skipNudge: { id: "", count: 0, lastAt: -Infinity },
  tutorialRecovery: createTutorialRecoveryState(),
  speech: { text: "", anchor: "human", until: 0 },
  secondarySpeech: { text: "", anchor: "", until: 0 },
  speechQueue: [],
  speechSequenceActive: false,
  loveLetterLesson: {
    frogBlocked: false,
    frogBlockCount: 0,
    lastFrogPromptAt: -Infinity,
    humanPrompted: false,
    lastHumanPromptAt: -Infinity
  },
  buttonPressed: false,
  doorwayOpen: false,
  spellbookCollected: false,
  tutorialComplete: false,
  overridePrompt: null,
  cameraYaw: 0,
  targetCameraYaw: 0,
  cameraActiveSurfaceLift: 0,
  cameraHighElevationZoomActive: false,
  cameraTargetY: SURFACE_Y,
  frogAi: {
    enabled: true,
    everPossessed: false,
    target: { x: START.frog.x, z: START.frog.z },
    timer: 0,
    hop: 0,
    mode: "idle",
    doorwayClear: false,
    currentSide: "left",
    targetSource: "patrol",
    usesHumanAsTarget: false,
    celebrationPerch: null,
    totalMoveDistance: 0,
    lastMoveDistance: 0
  },
  frogJump: null,
  reward: { active: false, elapsed: 0 },
  celebration: createCelebrationState(),
  particles: [],
  loveLetterMessage: createLoveLetterMessageState(),
  frogMoveHop: 0,
  actorCollisionBlocked: false,
  lastJumpClearance: { active: false, currentLift: 0, peakLift: 0, clearsBarrier: false },
  elapsed: 0,
  inputMoving: false,
  frogMoveProgress: 0
};

const input = createInputState();

const canvas = document.querySelector("#game-canvas");
const scene = new THREE.Scene();
scene.background = null;
const particleContext = { state, scene, cloneAsset };

function homeFlowContext() {
  return {
    state,
    input,
    particleContext,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    syncAll,
    updateCamera,
    updateHud,
    showPrompt,
    showSpeech,
    directionName,
    distance2D,
    startLevelOne,
    updateHomeInteractions
  };
}

function tutorialFlowContext() {
  return {
    state,
    input,
    particleContext,
    barrierMeshes,
    markerMeshes,
    loadCubelingUnlocks,
    playHumanAnimation,
    updateControlsPanel,
    updateLevelCompleteModal,
    syncAll,
    updateCamera,
    updateHud
  };
}

function levelOneFlowContext() {
  return {
    state,
    input,
    particleContext,
    saveCubelingUnlocks,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    triggerLoveLetterAttention,
    syncAll,
    updateCamera,
    updateHud,
    showPrompt,
    directionName,
    distance2D,
    updateLevelOneFlowEffects
  };
}

function levelTwoFlowContext() {
  return {
    state,
    input,
    particleContext,
    saveCubelingUnlocks,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    syncAll,
    updateCamera,
    updateHud,
    showPrompt,
    directionName,
    distance2D,
    resetLevelTwoRedMechanismState,
    updateLevelTwoInteractions
  };
}

function levelThreeFlowContext() {
  return {
    state,
    input,
    particleContext,
    saveCubelingUnlocks,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    syncAll,
    updateCamera,
    updateHud,
    showPrompt,
    directionName,
    distance2D
  };
}

const renderer = createGameRenderer(canvas);
const camera = createGameCamera();
const projectionVector = new THREE.Vector3();

const world = new THREE.Group();
scene.add(world);

const sceneGroups = {
  tutorial: new THREE.Group(),
  home: new THREE.Group(),
  levelOne: new THREE.Group(),
  levelTwo: new THREE.Group(),
  levelThree: new THREE.Group()
};
world.add(sceneGroups.tutorial, sceneGroups.home, sceneGroups.levelOne, sceneGroups.levelTwo, sceneGroups.levelThree);

const assetCache = new Map();
const floorMeshes = [];
const homeMeshes = [];
const levelOneMeshes = [];
const levelOneWaterColliders = [];
const levelOneBridgeMeshes = { partial: [], complete: [] };
const levelOneBridgeDeckMeshes = { partial: [], complete: [] };
const levelOneBloomMeshes = { lilyPad: null, latch: null, mats: {}, dockGlows: [] };
const levelTwoMeshes = [];
const levelTwoGoalMeshes = [];
const levelThreeMeshes = [];
const levelThreeGoalMeshes = [];
const levelTwoInteractiveMeshes = {
  blueButton: null,
  blueButtonTop: null,
  blueRamp: null,
  blueRampDormantPanel: null,
  elephantEcho: null,
  elephantEchoRing: null,
  elephantTotem: null,
  elephantTotemGlow: null,
  redButtons: {},
  redButtonTops: {},
  redPlatforms: {}
};
const levelThreeInteractiveMeshes = {
  greenButtons: {},
  greenButtonTops: {},
  totemRaftGates: {},
  totemRaft: null,
  crocodileEcho: null
};
const sceneObjectColliders = [];
const barrierMeshes = new Map();
const barrierEndCapMeshes = [];
const barrierColliders = [];
const actorMeshes = { human: null, frog: null, elephant: null, crocodile: null };
const markerMeshes = {
  active: null,
  frogEcho: null,
  frogEchoCircle: null,
  frogTotem: null,
  frogTotemGlow: null,
  button: null,
  buttonBase: null,
  buttonTop: null,
  spellbookClosed: null,
  spellbookOpen: null,
  rewardGlow: null,
  jumpShadow: null
};
const animation = { humanMixer: null, actions: {}, currentHumanAction: "" };
const clock = new THREE.Clock();
let lastFrameTime = performance.now();
const runtime = {
  manualAdvanceDepth: 0,
  testPaused: false
};
init();

async function init() {
  try {
    setupSceneLights(scene);
    setupMarkerMeshes(scene, markerMeshes);
    await loadRequiredAssets();
    buildTutorialScene({
      scene,
      sceneGroups,
      cloneAsset,
      floorMeshes,
      barrierMeshes,
      barrierColliders,
      barrierEndCapMeshes,
      buildButtonMarker,
      markerMeshes
    });
    buildHomeScene({
      sceneGroups,
      placeAsset,
      homeMeshes,
      addSceneCollider,
      colliderForProp
    });
    buildLevelOneScene({
      sceneGroups,
      placeAsset,
      levelOneMeshes,
      levelOneWaterColliders,
      levelOneBloomMeshes,
      colliderForProp,
      addSceneCollider
    });
    buildLevelTwoScene({
      sceneGroups,
      placeAsset,
      cloneAsset,
      levelTwoMeshes,
      levelTwoGoalMeshes,
      levelTwoInteractiveMeshes,
      addSceneCollider,
      colliderForProp
    });
    buildLevelThreeScene({
      sceneGroups,
      placeAsset,
      cloneAsset,
      levelThreeMeshes,
      levelThreeGoalMeshes,
      levelThreeInteractiveMeshes,
      addSceneCollider,
      colliderForProp
    });
    buildActors();
    syncAll();
    state.ready = true;
    showSpeech("human", SPEECH_STEPS.move_up.text, 3);
  } catch (error) {
    console.error(error);
    state.error = String(error);
    showPrompt("Asset load failed. Check console.", 999);
  }
  updateHud();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  hud.skipYes?.addEventListener("click", confirmSkipTutorial);
  hud.skipNo?.addEventListener("click", declineSkipTutorial);
  hud.controlsToggle?.addEventListener("click", toggleControlsPanel);
  initDevEditor({
    state,
    scene,
    hud,
    camera,
    renderer,
    getSceneMeshes: getCurrentEditableSceneMeshes,
    getSceneColliderDebugEntries: getCurrentSceneColliderDebugEntries,
    getRuntimeSnapshot: () => {
      try {
        return JSON.parse(renderGameToText());
      } catch {
        return null;
      }
    },
    sceneNav: {
      tutorial: jumpToTutorialDebug,
      home: () => startHomeIntro(null, { debug: true }),
      levelOne: startLevelOne,
      levelTwo: startLevelTwo,
      levelThree: startLevelThree
    },
    onUpdateHud: updateHud,
    onOpenChange: handleDevEditorOpenChange,
    onShowPrompt: showPrompt
  });
  hud.loveLetterContinue?.addEventListener("click", dismissLoveLetterMessage);
  hud.continueFreeMode?.addEventListener("click", continueFreeMode);
  hud.resetTutorialLevel?.addEventListener("click", resetLevel);
  hud.nextLevel?.addEventListener("click", handleNextLevelClick);
  hud.exitContinue?.addEventListener("click", confirmHomeExit);
  hud.exitStay?.addEventListener("click", stayInHomeIntro);
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("wheel", handleWheel, { passive: false });
  applyInitialDebugSceneFromUrl();
  resize();
  renderer.setAnimationLoop(renderFrame);
}

async function loadRequiredAssets() {
  await loadAssetRegistry({ assets: ASSETS, scene, assetCache });
}

function cloneAsset(key) {
  return cloneLoadedAsset(assetCache, key);
}

function placeAsset(group, key, point, options = {}) {
  return placeLoadedAsset(assetCache, group, key, point, options);
}

function addSceneCollider(sceneId, point, halfX, halfZ, label = "", metadata = {}) {
  sceneObjectColliders.push({
    ...metadata,
    scene: sceneId,
    x: point.x,
    z: point.z,
    halfX,
    halfZ,
    label
  });
}

function colliderForProp(key, scale = 1) {
  if (key.includes("Tree")) return { halfX: 0.58 * scale, halfZ: 0.58 * scale };
  if (key.includes("Bush")) return { halfX: 0.42 * scale, halfZ: 0.42 * scale };
  if (key.includes("Rock")) return { halfX: 0.34 * scale, halfZ: 0.34 * scale };
  return null;
}

function loadCubelingUnlocks() {
  return loadCubelingUnlocksFromStorage(window.localStorage, UNLOCK_STORAGE_KEY);
}

function saveCubelingUnlocks() {
  saveCubelingUnlocksToStorage(window.localStorage, UNLOCK_STORAGE_KEY, state.unlocks);
}

function buildButtonMarker() {
  const { buttonGroup, base, top } = createBlueButtonMarker({
    cloneAsset,
    point: TUTORIAL_BUTTON,
    surfaceY: SURFACE_Y,
    topRestY: BUTTON_TOP_REST_Y
  });

  markerMeshes.button = buttonGroup;
  markerMeshes.buttonBase = base;
  markerMeshes.buttonTop = top;
  scene.add(buttonGroup);
}

function buildActors() {
  buildActorMeshes({
    scene,
    assetCache,
    cloneAsset,
    actorMeshes,
    markerMeshes,
    animation,
    frogEchoTint: FROG_ECHO_TINT,
    frogEchoOpacity: FROG_ECHO_OPACITY,
    frogTotemVisualScale: FROG_TOTEM_VISUAL_SCALE,
    onPlayIdle: () => playHumanAnimation("Idle")
  });
}

function debugSceneFromUrl() {
  const debugScene = new URLSearchParams(window.location.search).get("debugScene");
  return Object.values(SCENES).includes(debugScene) ? debugScene : "";
}

function applyInitialDebugSceneFromUrl() {
  const debugScene = debugSceneFromUrl();
  if (debugScene === SCENES.TUTORIAL) jumpToTutorialDebug();
  if (debugScene === SCENES.HOME) startHomeIntro(null, { debug: true });
  if (debugScene === SCENES.LEVEL_ONE) startLevelOne();
  if (debugScene === SCENES.LEVEL_TWO) startLevelTwo();
  if (debugScene === SCENES.LEVEL_THREE) startLevelThree();
}

function handleKeyDown(event) {
  if (!state.ready && event.code !== "KeyR") return;
  const debugScene = event.repeat ? "" : debugSceneForCode(event.code);
  if (debugScene) {
    event.preventDefault();
    if (debugScene === SCENES.TUTORIAL) jumpToTutorialDebug();
    if (debugScene === SCENES.HOME) startHomeIntro(null, { debug: true });
    if (debugScene === SCENES.LEVEL_ONE) startLevelOne();
    if (debugScene === SCENES.LEVEL_TWO) startLevelTwo();
    if (debugScene === SCENES.LEVEL_THREE) startLevelThree();
    return;
  }
  if (event.code === "F2") {
    event.preventDefault();
    toggleDevEditorPanel();
    return;
  }
  if (state.devEditor.open) {
    if (handleDevCameraKeyDown(event, state)) return;
    if (handleDevEditorKeyDown(event)) return;
    if (event.code === "Space") {
      event.preventDefault();
      return;
    }
  }
  if (event.code === "KeyR") {
    event.preventDefault();
    resetLevel();
    return;
  }
  if (state.home.exitConfirmVisible) {
    event.preventDefault();
    if (!event.repeat && (event.code === "Enter" || event.code === "Space")) confirmHomeExit();
    if (!event.repeat && event.code === "Escape") stayInHomeIntro();
    return;
  }
  if (state.skipModal.visible) {
    event.preventDefault();
    return;
  }
  if (state.loveLetterMessage.visible) {
    event.preventDefault();
    return;
  }
  if (state.celebration.active) {
    event.preventDefault();
    if (!event.repeat) tryFinishCelebration();
    return;
  }
  if (state.celebration.modalVisible) {
    event.preventDefault();
    return;
  }
  if (captureMoveKeyDown(input, event)) return;
  if (event.repeat) return;
  if (event.code === "KeyQ") {
    event.preventDefault();
    rotateCamera(-1);
    return;
  }
  if (event.code === "KeyE") {
    event.preventDefault();
    rotateCamera(1);
    return;
  }
  if (event.key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
    event.preventDefault();
    switchActor();
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    frogJump();
    return;
  }
}


function getCurrentEditableSceneMeshes() {
  if (state.scene.id === SCENES.TUTORIAL) {
    return {
      actorMeshes: { human: actorMeshes.human, frog: actorMeshes.frog, elephant: actorMeshes.elephant, crocodile: actorMeshes.crocodile },
      markers: [
        markerMeshes.frogEcho,
        markerMeshes.frogTotem,
        markerMeshes.button,
        markerMeshes.spellbookClosed,
        markerMeshes.spellbookOpen
      ],
      arrays: [floorMeshes, barrierMeshes, barrierEndCapMeshes]
    };
  }
  if (state.scene.id === SCENES.HOME) {
    return { actorMeshes: { human: actorMeshes.human, frog: actorMeshes.frog, elephant: actorMeshes.elephant, crocodile: actorMeshes.crocodile }, markers: [markerMeshes.frogEcho, markerMeshes.frogTotem], arrays: [homeMeshes] };
  }
  if (state.scene.id === SCENES.LEVEL_ONE) {
    return {
      actorMeshes: { human: actorMeshes.human, frog: actorMeshes.frog, elephant: actorMeshes.elephant, crocodile: actorMeshes.crocodile },
      markers: [
        markerMeshes.frogEcho,
        markerMeshes.frogTotem,
        markerMeshes.button,
        markerMeshes.spellbookClosed,
        markerMeshes.spellbookOpen
      ],
      arrays: [
        levelOneMeshes,
        levelOneBridgeMeshes.partial,
        levelOneBridgeMeshes.complete,
        levelOneBridgeDeckMeshes.partial,
        levelOneBridgeDeckMeshes.complete
      ]
    };
  }
  if (state.scene.id === SCENES.LEVEL_TWO) {
    return {
      actorMeshes: { human: actorMeshes.human, frog: actorMeshes.frog, elephant: actorMeshes.elephant, crocodile: actorMeshes.crocodile },
      markers: [
        markerMeshes.frogEcho,
        markerMeshes.frogTotem,
        levelTwoInteractiveMeshes.elephantEcho,
        levelTwoInteractiveMeshes.elephantTotem
      ],
      arrays: [levelTwoMeshes, levelTwoGoalMeshes]
    };
  }
  return {
    actorMeshes: { human: actorMeshes.human, frog: actorMeshes.frog, elephant: actorMeshes.elephant, crocodile: actorMeshes.crocodile },
    markers: [markerMeshes.frogEcho, markerMeshes.frogTotem, levelThreeInteractiveMeshes.crocodileEcho],
    arrays: [levelThreeMeshes, levelThreeGoalMeshes]
  };
}

function roundDebug(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function colliderDebugEntry({
  id,
  label,
  sceneId,
  source,
  center,
  halfExtents,
  active = true,
  metadata = {},
  sourceFileHint = "src/main.js"
}) {
  return {
    id,
    label,
    sceneId,
    type: "aabb2d",
    source,
    center: center.map((value) => roundDebug(value)),
    halfExtents: halfExtents.map((value) => roundDebug(value)),
    active,
    metadata,
    sourceFileHint
  };
}

function meshBoundsDebugEntry(mesh, { id, label, sceneId, source, active = true, metadata = {}, sourceFileHint }) {
  if (!mesh) return null;
  const box = new THREE.Box3().setFromObject(mesh);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return colliderDebugEntry({
    id,
    label,
    sceneId,
    source,
    center: [center.x, center.y, center.z],
    halfExtents: [size.x * 0.5, size.y * 0.5, size.z * 0.5],
    active,
    metadata,
    sourceFileHint
  });
}

function sceneObjectColliderDebugEntries(sceneId) {
  return sceneObjectColliders
    .filter((collider) => collider.scene === sceneId)
    .map((collider, index) => colliderDebugEntry({
      id: collider.label || `${sceneId}-scene-collider-${index}`,
      label: collider.label || `${sceneId}-scene-collider-${index}`,
      sceneId,
      source: "sceneObjectColliders",
      center: [
        collider.x,
        Number.isFinite(collider.levelTwoTopY) ? collider.levelTwoTopY : SURFACE_Y,
        collider.z
      ],
      halfExtents: [
        collider.halfX,
        Number.isFinite(collider.levelTwoTopY) && Number.isFinite(collider.levelTwoBottomY)
          ? Math.max(0.05, (collider.levelTwoTopY - collider.levelTwoBottomY) * 0.5)
          : 0,
        collider.halfZ
      ],
      metadata: { ...collider, scene: undefined },
      sourceFileHint: sceneId === SCENES.LEVEL_TWO
        ? "src/scenes/levelTwoScene.js or src/levels/levelTwo.js"
        : sceneId === SCENES.LEVEL_ONE
          ? "src/scenes/levelOneScene.js or src/levels/levelOne.js"
          : sceneId === SCENES.LEVEL_THREE
            ? "src/scenes/levelThreeScene.js or src/levels/levelThree.js"
            : "src/scenes/homeIntroScene.js or src/levels/homeIntroLevel.js"
    }));
}

function getCurrentSceneColliderDebugEntries() {
  const sceneId = state.scene.id;
  const entries = sceneObjectColliderDebugEntries(sceneId);

  if (sceneId === SCENES.TUTORIAL) {
    barrierColliders.forEach((barrier) => {
      entries.push(colliderDebugEntry({
        id: `tutorial-barrier-row-${barrier.row}`,
        label: barrier.door ? `tutorial-barrier-door-row-${barrier.row}` : `tutorial-barrier-row-${barrier.row}`,
        sceneId,
        source: "barrierColliders",
        center: [barrier.x, SURFACE_Y, barrier.z],
        halfExtents: [barrier.halfX, 0, barrier.halfZ],
        active: !(state.doorwayOpen && barrier.door),
        metadata: { row: barrier.row, door: Boolean(barrier.door) },
        sourceFileHint: "src/scenes/tutorialScene.js or src/levels/tutorialLevel.js"
      }));
    });
  }

  if (sceneId === SCENES.LEVEL_ONE) {
    levelOneWaterColliders.forEach((water) => {
      entries.push(colliderDebugEntry({
        id: `level-one-water-${water.column}-${water.row}`,
        label: `level-one-water-${water.column}-${water.row}`,
        sceneId,
        source: "levelOneWaterColliders",
        center: [water.x, SURFACE_Y, water.z],
        halfExtents: [water.halfX, 0, water.halfZ],
        active: true,
        metadata: { column: water.column, row: water.row, bypassedByExplicitCrossingSurfaces: true },
        sourceFileHint: "src/scenes/levelOneScene.js or src/levels/levelOne.js"
      }));
    });
    entries.push(colliderDebugEntry({
      id: LEVEL_ONE_LILY_PAD.id,
      label: "level-one-lily-pad-walkable-surface",
      sceneId,
      source: "LEVEL_ONE_LILY_PAD",
      center: [LEVEL_ONE_LILY_PAD.position.x, SURFACE_Y + LEVEL_ONE_CROSSING_ACTOR_LIFT, LEVEL_ONE_LILY_PAD.position.z],
      halfExtents: [LEVEL_ONE_LILY_PAD.halfX, 0.06, LEVEL_ONE_LILY_PAD.halfZ],
      active: true,
      metadata: { walkable: true, actors: ["frog", "human-after-dock"], surfaceId: LEVEL_ONE_LILY_PAD.id },
      sourceFileHint: "src/levels/levelOne.js"
    }));
    Object.values(LEVEL_ONE_BLUE_BLOOM_MATS).forEach((mat) => {
      entries.push(colliderDebugEntry({
        id: `level-one-blue-bloom-mat-${mat.id}`,
        label: `level-one-blue-bloom-mat-${mat.id}-walkable-surface`,
        sceneId,
        source: "LEVEL_ONE_BLUE_BLOOM_MATS",
        center: [mat.docked.x, SURFACE_Y + LEVEL_ONE_CROSSING_ACTOR_LIFT, mat.docked.z],
        halfExtents: [mat.halfX, 0.06, mat.halfZ],
        active: Boolean(state.levelOne.blueBloomDocked),
        metadata: { walkable: true, actors: ["human", "frog"], matId: mat.id, requiresDocked: true },
        sourceFileHint: "src/levels/levelOne.js"
      }));
    });
    [...levelOneBridgeDeckMeshes.partial, ...levelOneBridgeDeckMeshes.complete].forEach((mesh, index) => {
      const entry = meshBoundsDebugEntry(mesh, {
        id: `${mesh.name || "level-one-bridge-deck"}-${index}`,
        label: mesh.name || `level-one-bridge-deck-${index}`,
        sceneId,
        source: "levelOneBridgeDeckMeshes",
        active: mesh.visible,
        metadata: { walkable: true },
        sourceFileHint: "src/scenes/levelOneScene.js"
      });
      if (entry) entries.push(entry);
    });
  }

  if (sceneId === SCENES.LEVEL_TWO) {
    entries.push(colliderDebugEntry({
      id: LEVEL_TWO_BLUE_RAMP.id,
      label: LEVEL_TWO_BLUE_RAMP.id,
      sceneId,
      source: "LEVEL_TWO_BLUE_RAMP",
      center: [
        (LEVEL_TWO_BLUE_RAMP.minX + LEVEL_TWO_BLUE_RAMP.maxX) * 0.5,
        SURFACE_Y + levelTwoRampLiftAt({
          x: (LEVEL_TWO_BLUE_RAMP.minX + LEVEL_TWO_BLUE_RAMP.maxX) * 0.5,
          z: (LEVEL_TWO_BLUE_RAMP.minZ + LEVEL_TWO_BLUE_RAMP.maxZ) * 0.5
        }, false),
        (LEVEL_TWO_BLUE_RAMP.minZ + LEVEL_TWO_BLUE_RAMP.maxZ) * 0.5
      ],
      halfExtents: [
        (LEVEL_TWO_BLUE_RAMP.maxX - LEVEL_TWO_BLUE_RAMP.minX) * 0.5,
        Math.max(0.05, LEVEL_TWO_BLUE_RAMP.targetLift * 0.5),
        (LEVEL_TWO_BLUE_RAMP.maxZ - LEVEL_TWO_BLUE_RAMP.minZ) * 0.5
      ],
      active: state.levelTwo.blueRampActive,
      metadata: { walkableBy: state.levelTwo.blueRampActive ? "human" : "none" },
      sourceFileHint: "src/levels/levelTwo.js"
    }));

    LEVEL_TWO_RED_BUTTONS.forEach((button) => {
      entries.push(colliderDebugEntry({
        id: button.id,
        label: button.id,
        sceneId,
        source: "LEVEL_TWO_RED_BUTTONS",
        center: [button.position.x, levelTwoRedButtonSurfaceY(button), button.position.z],
        halfExtents: [button.radius, 0.08, button.radius],
        active: state.scene.id === SCENES.LEVEL_TWO,
        metadata: {
          requiredActor: button.requiredActor,
          linkedPlatformId: button.linkedPlatformId,
          active: Boolean(state.levelTwo.redButtons?.[button.id]?.active)
        },
        sourceFileHint: "src/levels/levelTwo.js"
      }));
    });

    LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
      entries.push(colliderDebugEntry({
        id: platform.id,
        label: platform.id,
        sceneId,
        source: "LEVEL_TWO_RED_PLATFORMS",
        center: [
          platform.position.x,
          levelTwoRedButtonSurfaceY({ platformId: platform.id }),
          platform.position.z
        ],
        halfExtents: [
          platform.visualHalfFootprint || (platform.maxX - platform.minX) * 0.5,
          Math.max(0.08, (platform.surfaceOffset || 0.2) * 0.5),
          platform.visualHalfFootprint || (platform.maxZ - platform.minZ) * 0.5
        ],
        active: state.scene.id === SCENES.LEVEL_TWO,
        metadata: {
          progress: roundDebug(levelTwoRedPlatformProgressById(platform.id)),
          lift: roundDebug(levelTwoRedPlatformLiftById(platform.id)),
          walkableBy: platform.walkableBy
        },
        sourceFileHint: "src/levels/levelTwo.js"
      }));
    });
  }

  return entries;
}

function handleKeyUp(event) {
  if (state.devEditor.open && handleDevCameraKeyUp(event, state)) return;
  captureMoveKeyUp(input, event);
}

function handlePointerDown(event) {
  if (handleDevEditorPointerDown(event)) return;
  if (!state.celebration.active) return;
  event.preventDefault();
  if (state.loveLetterMessage.visible) return;
  tryFinishCelebration();
}

function handleWheel(event) {
  if (!state.devEditor.open || event.target !== renderer.domElement) return;
  zoomDevCameraFromWheel(event, { state, camera });
}

function handleDevEditorOpenChange(open) {
  input.keys.clear();
  if (open) {
    enterDevCamera({ state, camera, activeActor: getActiveActor() });
    return;
  }
  exitDevCamera({ state, camera });
  updateCamera(1);
}

function startHomeIntro(event, options = {}) {
  startHomeIntroScene(homeFlowContext(), event, options);
}

function handleNextLevelClick(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!state.celebration.modalVisible || !levelCompleteNextLevelEnabled()) return;
  if (state.scene.id === SCENES.TUTORIAL) {
    startHomeIntro(event);
    return;
  }
  if (state.scene.id === SCENES.LEVEL_ONE) startLevelTwo({ showTitle: true });
}

function updateSceneFlow(dt) {
  if (state.scene.id === SCENES.HOME) updateHomeScene(dt);
  if (state.scene.id === SCENES.LEVEL_ONE) updateLevelOneScene(dt);
  if (state.scene.id === SCENES.LEVEL_TWO) updateLevelTwoScene(dt);
  if (state.scene.id === SCENES.LEVEL_THREE) updateLevelThreeScene(dt);
}

function updateHomeScene(dt) {
  updateHomeSceneFlow(homeFlowContext(), dt);
}

function updateHomeInteractions(dt) {
  const noteDistance = distance2D(state.human, HOME_POINTS.note);
  const inNoteZone = state.home.noteZoneInside
    ? noteDistance <= HOME_NOTE_EXIT_RADIUS
    : noteDistance <= HOME_NOTE_RADIUS;
  if (inNoteZone && !state.home.noteZoneInside) {
    state.home.noteZoneInside = true;
    state.home.noteVisible = true;
    state.home.noteRead = true;
    state.home.exitReady = true;
    state.home.noteOpenCount += 1;
    state.home.hintTimer = 0;
    state.home.arrowVisible = false;
    clearSpeechQueue();
    state.speech = { text: "", anchor: "human", until: 0 };
    state.secondarySpeech = { text: "", anchor: "", until: 0 };
  } else if (!inNoteZone && state.home.noteZoneInside) {
    state.home.noteZoneInside = false;
    state.home.noteVisible = false;
    if (state.home.noteRead && !state.home.postNoteLineShown) {
      state.home.postNoteLineShown = true;
      state.home.lastDialogueAt = state.elapsed;
      showSpeech("human", "I'll follow the trail.", 2.1);
    }
  } else if (state.home.noteZoneInside) {
    state.home.noteVisible = true;
  }

  const homeNudgeEligible = state.home.noteRead && !state.home.noteVisible && !state.home.exitConfirmVisible;
  const homeSpeechClear = !state.speechSequenceActive && (!state.speech.text || state.elapsed >= state.speech.until);
  if (
    homeNudgeEligible &&
    state.home.postNoteLineShown &&
    !state.home.trailExplorationLineShown &&
    state.human.x >= HOME_POINTS.note.x + 5.8 &&
    homeSpeechClear &&
    state.elapsed - state.home.lastDialogueAt > 2.2
  ) {
    state.home.trailExplorationLineShown = true;
    state.home.lastDialogueAt = state.elapsed;
    showSpeech("human", "Maybe they left something else nearby.", 2.2);
  }
  if (homeNudgeEligible) state.home.hintTimer += dt;
  if (homeNudgeEligible && state.home.hintTimer > HOME_TRAIL_HINT_SECONDS && !state.home.trailHintShown) {
    state.home.trailLineIndex += 1;
    state.home.trailHintShown = true;
    if (!state.home.postNoteLineShown && homeSpeechClear) {
      state.home.postNoteLineShown = true;
      state.home.lastDialogueAt = state.elapsed;
      showSpeech("human", HOME_TRAIL_LINES[0], 2.0);
    }
    spawnTrailHintParticles();
  }
  if (homeNudgeEligible && state.home.hintTimer > HOME_ARROW_HINT_SECONDS && !state.home.arrowVisible) {
    state.home.arrowVisible = true;
    spawnTrailHintParticles();
    state.home.hintTimer = 0;
  }

  const inExitZone = state.home.noteRead && distance2D(state.human, HOME_POINTS.exit) <= HOME_EXIT_RADIUS;
  if (inExitZone) {
    state.home.exitZoneInside = true;
    if (!state.home.exitConfirmVisible && state.elapsed >= state.home.exitConfirmCooldownUntil) openHomeExitConfirm();
  } else if (state.home.exitZoneInside) {
    state.home.exitZoneInside = false;
  }

  if (state.human.x <= HOME_BOUNDS.minX + state.human.radius + 0.12 && state.elapsed - state.loveLetterLesson.lastHumanPromptAt > 1.1) {
    const text = HOME_WRONG_WAY_LINES[state.home.wrongWayIndex % HOME_WRONG_WAY_LINES.length];
    state.home.wrongWayIndex += 1;
    state.loveLetterLesson.lastHumanPromptAt = state.elapsed;
    showSpeech("human", text, 1.7);
  }
}

function openHomeExitConfirm() {
  openHomeExitConfirmFlow(homeFlowContext());
}

function stayInHomeIntro(event) {
  stayInHomeIntroFlow(homeFlowContext(), event);
}

function confirmHomeExit(event) {
  confirmHomeExitFlow(homeFlowContext(), event);
}

function startLevelOne(options = {}) {
  startLevelOneScene(levelOneFlowContext(), options);
}

function startLevelTwo(options = {}) {
  startLevelTwoScene(levelTwoFlowContext(), options);
}

function startLevelThree(options = {}) {
  startLevelThreeScene(levelThreeFlowContext(), options);
}

function updateLevelOneScene(dt) {
  updateLevelOneSceneFlow(levelOneFlowContext(), dt);
}

function updateLevelOneFlowEffects(dt) {
  if (state.levelOne.blueBloomRevealActive || state.levelOne.bridgeRevealActive) {
    state.levelOne.blueBloomRevealElapsed += dt;
    state.levelOne.bridgeRevealElapsed = state.levelOne.blueBloomRevealElapsed;
    if (
      state.levelOne.blueBloomRevealElapsed >= LEVEL_ONE_BLUE_BLOOM_TIMING.loveLetterSurfaceAt &&
      !state.levelOne.loveLetterSurfaced
    ) {
      surfaceLevelOneLoveLetterWithBloom();
    }
    if (state.levelOne.blueBloomRevealElapsed >= LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS) {
      state.levelOne.blueBloomRevealElapsed = LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS;
      state.levelOne.bridgeRevealElapsed = LEVEL_ONE_BLUE_BLOOM_REVEAL_SECONDS;
      state.levelOne.blueBloomRevealActive = false;
      state.levelOne.bridgeRevealActive = false;
      state.levelOne.blueBloomDocked = true;
      state.levelOne.bridgeComplete = true;
      state.levelOne.waterBlocked = false;
      state.levelOne.bridgeAsset = "blue-bloom-crossing-docked";
      state.levelOne.blueBloomMats.left.walkable = true;
      state.levelOne.blueBloomMats.right.walkable = true;
      dockLevelOneLoveLetterWithBloom();
    }
  }

  if (state.levelOne.phase !== "play") return;
  updateLevelOneHints(dt);
}

function updateLevelTwoScene(dt) {
  updateLevelTwoSceneFlow(levelTwoFlowContext(), dt);
  updateLevelTwoBlueRampReveal(dt);
}

function updateLevelThreeScene(dt) {
  updateLevelThreeSceneFlow(levelThreeFlowContext(), dt);
}

function updateLevelTwoBlueRampReveal(dt) {
  if (!state.levelTwo.blueRampRevealActive) return;
  state.levelTwo.blueRampRevealElapsed += dt;
  const revealSeconds = LEVEL_TWO_BLUE_RAMP.revealSeconds || 0.72;
  if (state.levelTwo.blueRampRevealElapsed >= revealSeconds) {
    state.levelTwo.blueRampRevealElapsed = revealSeconds;
    state.levelTwo.blueRampRevealActive = false;
  }
}

function updateLevelTwoInteractions(dt = 0) {
  updateLevelTwoSurfaceState();
  updateLevelTwoRedMechanisms(dt);

  if (
    actorCanPressButton({
      activeActor: state.active,
      actorKey: "frog",
      actor: state.frog,
      button: LEVEL_TWO_POINTS.blueButton,
      radius: BUTTON_RADIUS,
      pressed: state.levelTwo.blueButtonPressed,
      requiredActor: "frog",
      surfaceId: state.levelTwo.frogSurfaceId,
      requiredSurfaceId: "blue-button-ledge"
    })
  ) {
    state.levelTwo.blueButtonPressed = true;
    state.levelTwo.blueRampActive = true;
    state.levelTwo.blueRampRevealActive = true;
    state.levelTwo.blueRampRevealElapsed = 0;
    showPrompt("Button pressed. A blue ramp appeared.", 1.8);
    showSpeech("frog", "That opened a path.", 1.6);
    spawnRevealSparkles(particleContext, LEVEL_TWO_BLUE_RAMP.position.x, LEVEL_TWO_BLUE_RAMP.position.z, 0x75c8ff, 18);
    return;
  }

  if (
    state.levelTwo.elephantEchoVisible &&
    !state.levelTwo.elephantTotemCollected &&
    distance2D(getActiveActor(), LEVEL_TWO_POINTS.elephantEcho) <= LEVEL_TWO_ELEPHANT_ECHO_RADIUS
  ) {
    if (state.elapsed - state.levelTwo.lastElephantEchoPromptAt >= LEVEL_TWO_ELEPHANT_ECHO_SPEECH_COOLDOWN) {
      const line = ELEPHANT_ECHO_LINES[state.levelTwo.elephantEchoPromptIndex % ELEPHANT_ECHO_LINES.length];
      state.levelTwo.elephantEchoPromptIndex += 1;
      state.levelTwo.lastElephantEchoPromptAt = state.elapsed;
      showSpeech("elephantEcho", line, 2.0);
    }
  }

  if (!state.levelTwo.elephantTotemCollected && distance2D(getActiveActor(), LEVEL_TWO_POINTS.elephantTotem) <= LEVEL_TWO_ELEPHANT_TOTEM_HILL.radius) {
    if (state.active === "human") {
      collectElephantTotem();
      return;
    }
    if (state.elapsed - state.levelTwo.lastTotemPromptAt >= LOVE_LETTER_LESSON_COOLDOWN) {
      state.levelTwo.lastTotemPromptAt = state.elapsed;
      showPrompt("Only your character can collect Cubeling Totems and treasures.", 2.2);
      showSpeech("frog", "That Totem is for you.", 1.8);
    }
  }

  state.levelTwo.placeholderLoveLetterCollectable = levelTwoLoveLetterReachableByHuman();
  if (!state.spellbookCollected) {
    const activeActor = getActiveActor();
    const distanceToLoveLetter = distance2D(activeActor, LEVEL_TWO_POINTS.placeholderLoveLetter);
    if (state.active === "human" && distanceToLoveLetter <= LOVE_LETTER_APPROACH_RADIUS && distanceToLoveLetter > SPELLBOOK_RADIUS) {
      showHumanLoveLetterApproach();
    }
    if (state.active === "human" && distanceToLoveLetter <= SPELLBOOK_RADIUS && levelTwoLoveLetterReachableByHuman()) {
      collectSpellbook();
      return;
    }
    if (state.active !== "human" && distanceToLoveLetter <= SPELLBOOK_RADIUS) {
      showPrompt("Cubelings can't collect Love Letters. Switch back to your character.", 2.4);
      showSpeech(state.active, "I can't pick this up.", 1.8);
    }
  }
}

function resetLevelTwoRedMechanismState() {
  state.levelTwo.redButtons = {};
  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    state.levelTwo.redButtons[button.id] = {
      id: button.id,
      active: false,
      heldActor: "",
      eligibleActor: button.requiredActor,
      ineligibleActor: "",
      linkedPlatformId: button.linkedPlatformId,
      activationType: button.activationType
    };
  });
  state.levelTwo.redPlatforms = {};
  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    state.levelTwo.redPlatforms[platform.id] = {
      id: platform.id,
      progress: platform.initialProgress ?? 0,
      lift: (platform.initialProgress ?? 0) * platform.maxLift,
      direction: platform.initialDirection || "down",
      pauseRemaining: 0,
      releaseTarget: null,
      wasActive: false,
      hasActivated: false,
      moving: "idle",
      heldBy: "",
      linkedButtonId: platform.linkedButtonId
    };
  });
  state.levelTwo.redElevatorAStartGate = createLevelTwoRedElevatorAStartGate();
  state.levelTwo.lastRedButtonInvalidPromptAt = -Infinity;
}

function createLevelTwoRedElevatorAStartGate() {
  return {
    released: true,
    delayRemaining: 0,
    waitingReason: "grounded-start"
  };
}

function ensureLevelTwoRedMechanismState() {
  if (!state.levelTwo.redButtons || !state.levelTwo.redPlatforms) resetLevelTwoRedMechanismState();
  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    if (!state.levelTwo.redButtons[button.id]) {
      state.levelTwo.redButtons[button.id] = {
        id: button.id,
        active: false,
        heldActor: "",
        eligibleActor: button.requiredActor,
        ineligibleActor: "",
        linkedPlatformId: button.linkedPlatformId,
        activationType: button.activationType
      };
    }
  });
  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    if (!state.levelTwo.redPlatforms[platform.id]) {
      state.levelTwo.redPlatforms[platform.id] = {
        id: platform.id,
        progress: platform.initialProgress ?? 0,
        lift: (platform.initialProgress ?? 0) * platform.maxLift,
        direction: platform.initialDirection || "down",
        pauseRemaining: 0,
        releaseTarget: null,
        wasActive: false,
        hasActivated: false,
        moving: "idle",
        heldBy: "",
        linkedButtonId: platform.linkedButtonId
      };
    } else {
      const platformState = state.levelTwo.redPlatforms[platform.id];
      if (platform.movementRule === "cycle-while-held" && !["up", "down"].includes(platformState.direction)) {
        platformState.direction = platform.initialDirection || "down";
      }
      if (!Number.isFinite(platformState.pauseRemaining)) platformState.pauseRemaining = 0;
      if (platformState.releaseTarget !== null && !Number.isFinite(platformState.releaseTarget)) platformState.releaseTarget = null;
      if (typeof platformState.wasActive !== "boolean") platformState.wasActive = false;
      if (typeof platformState.hasActivated !== "boolean") platformState.hasActivated = false;
    }
  });
  if (!Number.isFinite(state.levelTwo.lastRedButtonInvalidPromptAt)) {
    state.levelTwo.lastRedButtonInvalidPromptAt = -Infinity;
  }
  if (!state.levelTwo.redElevatorAStartGate || typeof state.levelTwo.redElevatorAStartGate !== "object") {
    state.levelTwo.redElevatorAStartGate = createLevelTwoRedElevatorAStartGate();
  }
  if (!Number.isFinite(state.levelTwo.redElevatorAStartGate.delayRemaining)) {
    state.levelTwo.redElevatorAStartGate.delayRemaining = 0;
  }
  if (typeof state.levelTwo.redElevatorAStartGate.released !== "boolean") {
    state.levelTwo.redElevatorAStartGate.released = true;
  }
  if (!state.levelTwo.redElevatorAStartGate.waitingReason) {
    state.levelTwo.redElevatorAStartGate.waitingReason = "grounded-start";
  }
}

function updateLevelTwoRedMechanisms(dt = 0) {
  ensureLevelTwoRedMechanismState();
  if (state.scene.id !== SCENES.LEVEL_TWO) return;

  const invalidRedButtonAttempt = activeIneligibleActorOnRedButton();
  const ineligibleActor = invalidRedButtonAttempt?.actorKey || "";

  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const buttonState = state.levelTwo.redButtons[button.id];
    const heldByElephant = state.levelTwo.elephantSpawned &&
      levelTwoActorIsOnRedButtonSurface("elephant", state.elephant, button) &&
      distance2D(state.elephant, button.position) <= button.radius;
    buttonState.active = heldByElephant;
    buttonState.heldActor = heldByElephant ? "elephant" : "";
    buttonState.ineligibleActor = invalidRedButtonAttempt?.buttonId === button.id ? ineligibleActor : "";
  });

  if (invalidRedButtonAttempt && state.elapsed - state.levelTwo.lastRedButtonInvalidPromptAt >= LEVEL_TWO_RED_BUTTON_INVALID_COOLDOWN) {
    state.levelTwo.lastRedButtonInvalidPromptAt = state.elapsed;
    showRedButtonInvalidFeedback(invalidRedButtonAttempt);
  }

  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const platformState = state.levelTwo.redPlatforms[platform.id];
    const buttonState = state.levelTwo.redButtons[platform.linkedButtonId];
    const buttonActive = Boolean(buttonState?.active);
    if (buttonActive) platformState.hasActivated = true;
    if (platform.movementRule === "cycle-while-held") {
      if (platform.id === "red-elevator-a" && updateLevelTwoRedElevatorAStartGate(platform, platformState, buttonActive, dt)) {
        platformState.lift = platformState.progress * platform.maxLift;
        platformState.heldBy = buttonState?.heldActor || "";
        platformState.wasActive = buttonActive;
        return;
      }
      updateLevelTwoCyclingRedPlatform(platform, platformState, buttonActive, dt);
    } else {
      const target = buttonState?.active
        ? platform.activeProgress ?? 1
        : platform.inactiveProgress ?? 0;
      if (!buttonActive && !state.levelTwo.elephantSpawned) {
        platformState.progress = target;
      } else if (dt > 0 && Math.abs(platformState.progress - target) > 0.0001) {
        moveLevelTwoRedPlatformToward(platform, platformState, target, dt);
      }
      platformState.moving = target > platformState.progress
        ? "up"
        : target < platformState.progress
          ? "down"
          : buttonState?.active
            ? "held"
            : "idle";
    }
    platformState.lift = platformState.progress * platform.maxLift;
    platformState.heldBy = buttonState?.heldActor || "";
    platformState.wasActive = buttonActive;
  });
}

function updateLevelTwoRedElevatorAStartGate(platform, platformState, buttonActive, dt = 0) {
  const gate = state.levelTwo.redElevatorAStartGate || createLevelTwoRedElevatorAStartGate();
  state.levelTwo.redElevatorAStartGate = gate;
  if (gate.released || !state.levelTwo.elephantSpawned) return false;

  if (buttonActive) {
    gate.released = true;
    gate.delayRemaining = 0;
    gate.waitingReason = "released-by-red-button-a";
    return false;
  }

  const gateTriggered = state.active === "elephant" ||
    levelTwoRedElevatorSideApproachSafeAt(state.human, state.human.radius);
  if (gateTriggered) {
    gate.waitingReason = "start-delay";
    gate.delayRemaining = Math.max(0, gate.delayRemaining - Math.max(0, dt));
    if (gate.delayRemaining <= 0) {
      gate.released = true;
      gate.waitingReason = "released";
      return false;
    }
  } else {
    gate.delayRemaining = LEVEL_TWO_RED_ELEVATOR_A_START_DELAY_SECONDS;
    gate.waitingReason = "waiting-for-human-approach-or-elephant-possession";
  }

  if (!buttonActive) return false;
  platformState.progress = platform.initialProgress ?? 1;
  platformState.direction = platform.initialDirection || "down";
  platformState.pauseRemaining = 0;
  platformState.releaseTarget = null;
  platformState.moving = gateTriggered ? "gate-delay" : "gate-wait";
  return true;
}

function moveLevelTwoRedPlatformToward(platform, platformState, target, dt = 0) {
  if (dt <= 0 || Math.abs(platformState.progress - target) <= 0.0001) {
    platformState.progress = Math.abs(platformState.progress - target) < 0.001 ? target : platformState.progress;
    return;
  }
  const speed = target > platformState.progress ? platform.upSpeed : platform.downSpeed;
  const delta = speed * dt * (target > platformState.progress ? 1 : -1);
  platformState.progress = clamp(platformState.progress + delta, 0, 1);
  if (Math.abs(platformState.progress - target) < 0.001) platformState.progress = target;
}

function updateLevelTwoCyclingRedPlatform(platform, platformState, buttonActive, dt = 0) {
  if (!state.levelTwo.elephantSpawned && !buttonActive) {
    platformState.progress = platform.inactiveProgress ?? platform.initialProgress ?? 1;
    platformState.direction = platform.initialDirection || "down";
    platformState.pauseRemaining = 0;
    platformState.releaseTarget = null;
    platformState.moving = "idle";
    return;
  }

  if (buttonActive) {
    platformState.releaseTarget = null;
    if (!["up", "down"].includes(platformState.direction)) platformState.direction = platform.initialDirection || "down";
    updateLevelTwoRedPlatformCycle(platform, platformState, dt);
    return;
  }

  if (platformState.wasActive && platformState.releaseTarget === null) {
    if (platform.releaseBehavior === "return-to-bottom") {
      platformState.releaseTarget = 0;
    } else if (platformState.moving === "pause-bottom" || platformState.progress <= 0.001) {
      platformState.releaseTarget = 0;
    } else if (platformState.moving === "pause-top" || platformState.progress >= 0.999) {
      platformState.releaseTarget = 1;
    } else {
      platformState.releaseTarget = platformState.direction === "up" ? 1 : 0;
    }
  }

  platformState.pauseRemaining = 0;
  const target = platformState.releaseTarget ?? levelTwoRedPlatformInactiveTarget(platform, platformState);
  if (Math.abs(platformState.progress - target) > 0.001) {
    moveLevelTwoRedPlatformToward(platform, platformState, target, dt);
    platformState.moving = target > platformState.progress ? "up" : target < platformState.progress ? "down" : "idle";
  } else {
    platformState.progress = target;
    platformState.moving = "idle";
  }
}

function updateLevelTwoRedPlatformCycle(platform, platformState, dt = 0) {
  if (
    platform.id !== "red-elevator-a" &&
    !platformState.wasActive &&
    platformState.progress <= 0.001 &&
    platformState.direction === "up" &&
    platformState.pauseRemaining <= 0
  ) {
    platformState.pauseRemaining = platform.bottomPauseSeconds ?? platform.endpointPauseSeconds ?? 0.6;
  }
  if (platformState.pauseRemaining > 0) {
    platformState.pauseRemaining = Math.max(0, platformState.pauseRemaining - dt);
    platformState.moving = platformState.progress <= 0.001 ? "pause-bottom" : "pause-top";
    if (platformState.pauseRemaining <= 0) {
      platformState.direction = platformState.progress <= 0.001 ? "up" : "down";
    }
    return;
  }

  const target = platformState.direction === "up" ? 1 : 0;
  if (Math.abs(platformState.progress - target) <= 0.001) {
    platformState.progress = target;
    platformState.pauseRemaining = target <= 0
      ? platform.bottomPauseSeconds ?? platform.endpointPauseSeconds ?? 0.6
      : platform.topPauseSeconds ?? platform.endpointPauseSeconds ?? 0.6;
    platformState.moving = target <= 0 ? "pause-bottom" : "pause-top";
    return;
  }

  moveLevelTwoRedPlatformToward(platform, platformState, target, dt);
  platformState.moving = platformState.direction;
  if (Math.abs(platformState.progress - target) <= 0.001) {
    platformState.progress = target;
    platformState.pauseRemaining = target <= 0
      ? platform.bottomPauseSeconds ?? platform.endpointPauseSeconds ?? 0.6
      : platform.topPauseSeconds ?? platform.endpointPauseSeconds ?? 0.6;
    platformState.moving = target <= 0 ? "pause-bottom" : "pause-top";
  }
}

function levelTwoRedPlatformInactiveTarget(platform, platformState) {
  if (platform.releaseBehavior === "return-to-bottom" && platformState.hasActivated) return 0;
  return platform.inactiveProgress ?? platform.initialProgress ?? 1;
}

function activeIneligibleActorOnRedButton() {
  if (state.active !== "human" && state.active !== "frog") return null;
  const actor = getActiveActor();
  const button = LEVEL_TWO_RED_BUTTONS.find((candidate) =>
    distance2D(actor, candidate.position) <= candidate.radius &&
    (candidate.id === "red-button-a" || levelTwoActorIsOnRedButtonSurface(state.active, actor, candidate))
  );
  return button ? { actorKey: state.active, buttonId: button.id } : null;
}

function showRedButtonInvalidFeedback({ actorKey, buttonId }) {
  if (buttonId === "red-button-a") {
    const elephantUnlocked = Boolean(
      state.cubelings.elephant?.unlocked ||
      state.levelTwo.elephantAwake ||
      state.levelTwo.elephantSpawned ||
      state.levelTwo.elephantTotemCollected
    );
    if (elephantUnlocked) {
      showPrompt("The Elephant might be heavy enough for this.", 1.8);
      showSpeech(actorKey, "The Elephant might be heavy enough for this.", 1.7);
      return;
    }
    showPrompt("This red button needs more weight.", 1.8);
    showSpeech(
      actorKey,
      actorKey === "frog"
        ? "I can't press that. I'm too light."
        : "I'm not heavy enough for this red button.",
      1.7
    );
    return;
  }
  showPrompt("Only the Elephant Cubeling is heavy enough for red buttons.", 1.8);
  showSpeech(actorKey, "Only the Elephant Cubeling is heavy enough for red buttons.", 1.7);
}

function levelTwoActorIsOnRedButtonSurface(actorKey, actor, button) {
  if (!button) return false;
  if (button.platformId && levelTwoRedPlatformAt(actor)?.id === button.platformId) return true;
  if (button.surfaceId && levelTwoActorSurfaceId(actor) === button.surfaceId) return true;
  if (button.surfaceId === "tier-3-elephant-route" && actorKey === "elephant") {
    return levelTwoElephantEchoTerraceSafeAt(actor, actor.radius + 0.08);
  }
  return false;
}

function collectElephantTotem() {
  if (state.levelTwo.elephantTotemCollected) return;
  state.levelTwo.elephantTotemCollected = true;
  state.levelTwo.elephantTotemVisible = false;
  state.levelTwo.elephantUnlockPending = false;
  awakenElephantCubeling();
  showPrompt("Elephant Cubeling Found!", 2.5);
  showSpeech("human", "Elephant Cubeling Found!", 2.2);
  spawnRevealSparkles(particleContext, LEVEL_TWO_POINTS.elephantTotem.x, LEVEL_TWO_POINTS.elephantTotem.z, 0xffd66a, 24);
}

function awakenElephantCubeling() {
  state.levelTwo.elephantAwake = true;
  state.levelTwo.elephantSpawned = true;
  state.levelTwo.elephantEchoVisible = true;
  state.levelTwo.elephantSurfaceId = null;
  state.levelTwo.elephantRevealActive = true;
  state.levelTwo.elephantRevealElapsed = 0;
  state.levelTwo.elephantSpawnCount += 1;
  state.elephant = createActorState({
    ...LEVEL_TWO_POINTS.elephantEcho,
    facing: { x: 0, z: 1, name: "south" }
  }, LEVEL_TWO_ELEPHANT_RADIUS, LEVEL_TWO_ELEPHANT_SPEED);
  state.cubelings.elephant = {
    unlocked: true,
    unlockedPending: false,
    active: false,
    spawned: true
  };
  const spawnEffectY = LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y;
  state.levelTwo.lastElephantSpawnEffectY = spawnEffectY;
  spawnRevealSparkles(particleContext, LEVEL_TWO_POINTS.elephantEcho.x, LEVEL_TWO_POINTS.elephantEcho.z, LEVEL_TWO_ELEPHANT_ECHO_SPARKLE, 26, {
    y: spawnEffectY
  });
}

function updateLevelOneHints(dt) {
  if (state.spellbookCollected || state.celebration.active || state.celebration.modalVisible || state.speechSequenceActive) return;
  state.levelOne.hintTimer += dt;
  if (state.levelOne.hintTimer < LEVEL_ONE_HINT_SECONDS) return;
  state.levelOne.hintTimer = 0;
  if (state.active === "human" && !state.buttonPressed && Math.abs(state.human.x - gridPoint(5.1, LEVEL_ONE_CROSSING_ROW).x) < 1.4) {
    state.levelOne.hintStage = "human_water";
    showSpeech("human", "That gap's too wide for me.", 2.1);
    return;
  }
  if (state.active === "human" && !state.frogAi.everPossessed && !state.buttonPressed) {
    state.levelOne.hintStage = "use_frog";
    showSpeech("human", "Maybe my little frog friend can make the jump.", 2.3);
    return;
  }
  if (state.active === "frog" && frogCurrentSide() === "right" && !state.buttonPressed) {
    state.levelOne.hintStage = "find_button";
    showSpeech("frog", "Something over there looks useful.", 2.1);
  }
}

function resetTutorialRecoveryState() {
  state.tutorialRecovery = createTutorialRecoveryState();
}

function tutorialFrogStrandedCandidate() {
  return state.scene.id === SCENES.TUTORIAL &&
    !state.tutorialSkipped &&
    !state.tutorialComplete &&
    state.active === "human" &&
    state.reveals.frog &&
    state.reveals.button &&
    !state.buttonPressed &&
    !state.doorwayOpen &&
    frogCurrentSide() === "right";
}

function tutorialRecoveryElapsed() {
  if (!state.tutorialRecovery?.stranded) return 0;
  return Math.max(0, state.elapsed - state.tutorialRecovery.startedAt);
}

function tutorialRecoveryPhase() {
  if (!state.tutorialRecovery?.stranded) return "inactive";
  const elapsed = tutorialRecoveryElapsed();
  if (elapsed < TUTORIAL_RECOVERY_RESET_LESSON_SECONDS) return "reset_lesson";
  if (elapsed < TUTORIAL_RECOVERY_RESCUE_NUDGE_SECONDS) return "wait_for_frog";
  return "rescue_nudge";
}

function tutorialRecoveryAutoPressAllowed() {
  return !state.tutorialRecovery?.stranded ||
    tutorialRecoveryElapsed() >= TUTORIAL_RECOVERY_RESET_LESSON_SECONDS;
}

function tutorialRecoveryRescueNudgeActive() {
  return Boolean(state.tutorialRecovery?.stranded) &&
    tutorialRecoveryElapsed() >= TUTORIAL_RECOVERY_RESCUE_NUDGE_SECONDS;
}

function tutorialUnpossessedFrogButtonSuppressed() {
  return state.scene.id === SCENES.TUTORIAL &&
    state.active !== "frog" &&
    state.tutorialRecovery?.stranded &&
    !tutorialRecoveryAutoPressAllowed();
}

function pointIsInTutorialRecoveryButtonBuffer(x, z) {
  return state.scene.id === SCENES.TUTORIAL &&
    state.tutorialRecovery?.stranded &&
    !tutorialRecoveryAutoPressAllowed() &&
    distance2D({ x, z }, TUTORIAL_BUTTON) <= BUTTON_RADIUS + state.frog.radius + 0.18;
}

function updateTutorialRecovery() {
  if (tutorialFrogStrandedCandidate()) {
    if (!state.tutorialRecovery?.stranded) {
      state.tutorialRecovery = {
        stranded: true,
        startedAt: state.elapsed,
        lastPromptAt: -Infinity,
        resetPromptShown: false,
        characterLineShown: false
      };
    }
    if (!state.tutorialRecovery.characterLineShown) {
      showSpeech("human", TUTORIAL_RECOVERY_CHARACTER_LINE, 2.6);
      state.tutorialRecovery.characterLineShown = true;
    }
    const phase = tutorialRecoveryPhase();
    const promptText = phase === "reset_lesson"
      ? TUTORIAL_RECOVERY_PROMPT
      : TUTORIAL_RECOVERY_RESCUE_PROMPT;
    const promptDue = !state.tutorialRecovery.resetPromptShown ||
      state.elapsed - state.tutorialRecovery.lastPromptAt >= TUTORIAL_RECOVERY_PROMPT_COOLDOWN_SECONDS;
    if (promptDue) {
      showPrompt(promptText, TUTORIAL_RECOVERY_PROMPT_COOLDOWN_SECONDS);
      state.tutorialRecovery.lastPromptAt = state.elapsed;
      state.tutorialRecovery.resetPromptShown = true;
    }
    return;
  }

  if (state.tutorialRecovery?.stranded) resetTutorialRecoveryState();
}

function spawnTrailHintParticles() {
  state.home.trailHintBursts += 1;
  // The previous Home heart stream read as noisy motion clutter. Keep the
  // timed hint state for QA, but rely on dialogue and the exit arrow until the
  // trail effect gets a calmer custom treatment.
}

function update(dt) {
  if (!state.ready) return;
  state.elapsed += dt;
  clearExpiredPrompt();
  updateSpeechQueue();
  state.actorCollisionBlocked = false;
  updateSceneFlow(dt);
  updateActiveMovement(dt);
  updateTutorialRecovery(dt);
  updateFrogAi(dt);
  updateElephantIdle(dt);
  updateFrogJump(dt);
  updateInteractions(dt);
  updateTutorialProximity();
  maybeRevealLoveLetterFromBarrierApproach();
  updateVisualEffects(dt);
  updateCelebration(dt);
  syncAll();
  updateCamera(dt);
  updateHud();
  animation.humanMixer?.update(dt);
}

function updateActiveMovement(dt) {
  if (!sceneAllowsInput()) return;
  if (state.devEditor.open) {
    state.inputMoving = false;
    return;
  }
  if (state.frogJump || state.skipModal.visible || state.celebration.active || state.celebration.modalVisible) {
    state.inputMoving = false;
    return;
  }
  const vector = getInputVector();
  state.inputMoving = vector.x * vector.x + vector.z * vector.z > 0.001;
  if (!state.inputMoving) {
    state.frogMoveHop = 0;
    return;
  }

  const actor = getActiveActor();
  actor.facing = directionName(vector);
  const moved = moveActor(actor, vector.x * actor.speed * dt, vector.z * actor.speed * dt);
  if (moved <= 0.001) return;

  if (state.active === "frog") state.frogMoveHop += dt * 10.5;
  if (
    state.scene.id === SCENES.LEVEL_THREE &&
    state.active === "crocodile" &&
    levelThreeActorIntersectsWater(state.crocodile)
  ) {
    state.levelThree.crocodileSurfaceId = "level3LakeWater";
    if (!state.levelThree.crocodileWaterPromptShown) {
      state.levelThree.crocodileWaterPromptShown = true;
      showPrompt("Crocodile feels at home in the lake.", 1.9);
      showSpeech("crocodile", "Crocodile feels at home in the lake.", 1.8);
    }
  } else if (state.scene.id === SCENES.LEVEL_THREE && state.active === "crocodile") {
    state.levelThree.crocodileSurfaceId = "level3IslandLand";
  }

  if (state.scene.id === SCENES.TUTORIAL && state.active === "frog" && currentStepId() === "frog_move") {
    state.frogMoveProgress += moved;
    if (state.frogMoveProgress > 0.65) advanceTutorial("frog_move");
  }

  if (state.scene.id === SCENES.TUTORIAL && state.active === "human") {
    if (currentStepId() === "move_up" && vector.z < -0.35) advanceTutorial("move_up");
    if (currentStepId() === "move_down" && vector.z > 0.35) advanceTutorial("move_down");
    if (currentStepId() === "move_horizontal" && Math.abs(vector.x) > 0.35) advanceTutorial("move_horizontal");
  }
}

function frogAiContext() {
  return {
    state,
    sceneIds: SCENES,
    frogPatrolSpeed: FROG_PATROL_SPEED,
    frogDoorwayClearSpeed: FROG_DOORWAY_CLEAR_SPEED,
    frogPatrolPauseMin: FROG_PATROL_PAUSE_MIN,
    frogPatrolPauseMax: FROG_PATROL_PAUSE_MAX,
    frogCelebrationSpeed: FROG_CELEBRATION_SPEED,
    frogCelebrationPerchRadius: FROG_CELEBRATION_PERCH_RADIUS,
    frogCelebrationMinDistance: FROG_CELEBRATION_MIN_DISTANCE,
    frogCurrentSide,
    shouldFrogClearDoorway,
    pointInDoorwayZone,
    frogPatrolZone,
    canFrogPatrolStandAt,
    clampPointToPatrolZone,
    buttonPoint,
    chooseFrogPatrolTarget: chooseFrogPatrolTargetForAi,
    chooseFrogDoorwayClearTarget: chooseFrogDoorwayClearTargetSystem,
    chooseFrogCelebrationPerch: chooseFrogCelebrationPerchSystem,
    chooseFrogCelebrationHopTarget: chooseFrogCelebrationHopTargetSystem,
    updateCelebratingFrog: updateCelebratingFrogSystem,
    distance2D,
    directionName,
    moveActor
  };
}

function updateFrogAi(dt) {
  updateFrogAiSystem(frogAiContext(), dt);
}

function updateCelebratingFrog(dt) {
  updateCelebratingFrogSystem(frogAiContext(), dt);
}

function updateElephantIdle(dt) {
  if (state.scene.id !== SCENES.LEVEL_TWO || !state.levelTwo.elephantSpawned || state.active === "elephant") return;
  if (!sceneAllowsInput() || state.levelTwo.elephantRevealActive) return;
  const heldButton = LEVEL_TWO_RED_BUTTONS.find((candidate) =>
    levelTwoActorIsOnRedButtonSurface("elephant", state.elephant, candidate) &&
    distance2D(state.elephant, candidate.position) <= candidate.radius
  );
  if (heldButton) return;
  const button = LEVEL_TWO_RED_BUTTONS[0];
  if (!button) return;
  const distanceToButton = distance2D(state.elephant, button.position);
  if (distanceToButton <= 0.08) return;
  const platformProgress = levelTwoRedPlatformProgressById(button.platformId || button.linkedPlatformId);
  const onButtonPlatform = levelTwoRedPlatformAt(state.elephant)?.id === button.platformId;
  const onTopRoute = state.levelTwo.elephantSurfaceId === "tier-3-elephant-route" && platformProgress >= 0.92;
  const canReachFromGround = platformProgress <= 0.08 && distanceToButton <= 3.2;
  if (!onButtonPlatform && !onTopRoute && !canReachFromGround) return;
  const dx = button.position.x - state.elephant.x;
  const dz = button.position.z - state.elephant.z;
  const length = Math.hypot(dx, dz);
  if (length <= 0.001) return;
  const speed = Math.min(state.elephant.speed * 0.42, 0.95);
  const step = Math.min(length, speed * dt);
  const vector = { x: dx / length, z: dz / length };
  state.elephant.facing = directionName(vector);
  moveActor(state.elephant, vector.x * step, vector.z * step);
}

function chooseFrogPatrolTargetForAi(context, side = frogCurrentSide()) {
  if (
    state.scene.id === SCENES.TUTORIAL &&
    tutorialRecoveryRescueNudgeActive() &&
    side === "right" &&
    canFrogPatrolStandAt(TUTORIAL_BUTTON.x, TUTORIAL_BUTTON.z, side, "rescue_nudge")
  ) {
    return { x: TUTORIAL_BUTTON.x, z: TUTORIAL_BUTTON.z };
  }
  return chooseFrogPatrolTargetSystem(context, side);
}

function chooseFrogPatrolTarget(side = frogCurrentSide()) {
  return chooseFrogPatrolTargetForAi(frogAiContext(), side);
}

function chooseFrogDoorwayClearTarget() {
  return chooseFrogDoorwayClearTargetSystem(frogAiContext());
}

function chooseFrogCelebrationPerch() {
  return chooseFrogCelebrationPerchSystem(frogAiContext());
}

function chooseFrogCelebrationHopTarget() {
  return chooseFrogCelebrationHopTargetSystem(frogAiContext());
}

function canFrogPatrolStandAt(x, z, side = frogCurrentSide(), source = "patrol") {
  const bounds = activeWorldBounds();
  if (x < bounds.minX + state.frog.radius || x > bounds.maxX - state.frog.radius) return false;
  if (z < bounds.minZ + state.frog.radius || z > bounds.maxZ - state.frog.radius) return false;
  const zone = frogPatrolZone(side);
  if (x < zone.minX - 0.05 || x > zone.maxX + 0.05 || z < zone.minZ - 0.05 || z > zone.maxZ + 0.05) return false;
  if (pointIsInTutorialRecoveryButtonBuffer(x, z)) return false;
  if (distance2D({ x, z }, state.human) < state.human.radius + state.frog.radius + ACTOR_BLOCK_PADDING + 0.38) return false;
  if (state.doorwayOpen && source !== "celebration_perch" && pointInDoorwayZone({ x, z }, state.frog.radius + 0.12)) return false;
  if (loveLetterBlocksFrogAt(x, z)) return false;
  if (sceneColliderBlocks(state.frog, x, z)) return false;
  return !activeBarrierColliders().some((barrier) => circleIntersectsAabb(x, z, state.frog.radius, barrier));
}

function updateFrogJump(dt) {
  if (!state.frogJump) return;
  state.frogJump.elapsed += dt;
  const t = clamp(state.frogJump.elapsed / state.frogJump.duration, 0, 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  state.frog.x = THREE.MathUtils.lerp(state.frogJump.start.x, state.frogJump.end.x, eased);
  state.frog.z = THREE.MathUtils.lerp(state.frogJump.start.z, state.frogJump.end.z, eased);
  const currentLift = Math.sin(t * Math.PI) * FROG_JUMP_LIFT;
  state.lastJumpClearance = {
    active: true,
    currentLift,
    peakLift: FROG_JUMP_LIFT,
    clearsBarrier: FROG_JUMP_LIFT > state.frogJump.over.topHeight + 0.55
  };
  if (t >= 1) {
    state.frog.x = state.frogJump.end.x;
    state.frog.z = state.frogJump.end.z;
    const jumpKind = state.frogJump.kind;
    const jumpLedgeId = state.frogJump.ledgeId || state.frogJump.destinationSurface || "";
    state.frogJump = null;
    state.lastJumpClearance.active = false;
    if (jumpKind !== "level_one_water") showSpeech("frog", "Clean hop.", 1.1);
    if (jumpKind === "tutorial_barrier") {
      advanceTutorial("jump_wall");
      revealButton();
    } else if (jumpKind === "level_one_water") {
      state.levelOne.hintTimer = LEVEL_ONE_HINT_SECONDS;
      if (jumpLedgeId === LEVEL_ONE_LILY_PAD.id || state.levelOne.lilyPadSurfaceId === LEVEL_ONE_LILY_PAD.id && isOnLevelOneLilyPadSurface(state.frog)) {
        showPrompt("The Frog Cubeling reached the lily pad.", 1.4);
        if (!state.levelOne.lilyPadPromptShown) {
          state.levelOne.lilyPadPromptShown = true;
          showSpeech("frog", "A lily pad! Perfect for a little hop.", 1.9);
        }
      } else {
        showPrompt("The Frog Cubeling made it across.", 1.6);
      }
    } else if (jumpKind === "level_two_ledge") {
      state.levelTwo.frogSurfaceId = jumpLedgeId;
      state.levelTwo.lastFrogJumpResult = "success";
      state.levelTwo.lastFrogJumpReason = state.levelTwo.frogSurfaceId;
      state.levelTwo.lastFrogJumpAt = state.elapsed;
      if (state.levelTwo.frogSurfaceId === "blue-button-ledge") {
        showPrompt("Step on the blue button.", 1.6);
      }
    } else if (jumpKind === "level_three_lily_lane") {
      state.levelThree.frogLaneSurfaceId = jumpLedgeId === "level3TotemWinchIsland" ? null : jumpLedgeId;
      if (jumpLedgeId === "level3TotemWinchIsland") {
        showPrompt("This green button can be pressed again and again.", 2.2);
        showSpeech("frog", "This green button can be pressed again and again.", 2.0);
        state.levelThree.totemGreenButtonPromptShown = true;
      } else {
        showPrompt("Frog landed on a floating leaf.", 1.3);
      }
    }
  }
}

function updateInteractions(dt = 0) {
  if (state.scene.id === SCENES.HOME) return;
  if (state.scene.id === SCENES.LEVEL_ONE) {
    updateLevelOneInteractions();
    return;
  }
  if (state.scene.id === SCENES.LEVEL_TWO) {
    updateLevelTwoInteractions(dt);
    return;
  }
  if (state.scene.id === SCENES.LEVEL_THREE) {
    updateLevelThreeInteractions(dt);
    return;
  }
  if (state.active === "human" && state.reveals.frogEcho && !state.reveals.frog && distance2D(state.human, START.frog) <= FROG_ECHO_RADIUS) {
    showFrogEchoDialogue();
  }

  if (state.reveals.frogTotem && !state.frogTotem.collected) {
    const actor = getActiveActor();
    const distanceToTotem = distance2D(actor, FROG_TOTEM);
    if (state.active === "human" && distanceToTotem <= FROG_TOTEM_RADIUS) {
      collectFrogTotem();
      return;
    }
    if (state.active === "human" && distanceToTotem <= FROG_TOTEM_RADIUS + 1.6) {
      showFrogTotemDialogue();
    } else if (state.active !== "human" && distanceToTotem <= FROG_TOTEM_RADIUS + 0.8) {
      showPrompt("Only your character can collect Cubeling Totems and treasures.", 2.2);
      showSpeech("frogTotem", "Only your character can collect me.", 1.8);
    }
  }

  if (state.reveals.button && actorCanPressButton({
    activeActor: state.active,
    actorKey: "frog",
    actor: state.frog,
    button: buttonPoint(),
    radius: BUTTON_RADIUS,
    pressed: state.buttonPressed,
    requiredActor: "frog"
  })) {
    if (tutorialUnpossessedFrogButtonSuppressed()) return;
    if (maybeRequestSkip(
      "press_button",
      "You reached the button before the guided lesson asked for it.",
      "frog",
      "We'll use the button in a moment. Follow the guide first."
    )) {
      return;
    }
    pressButton();
  }

  const loveLetterPoint = currentLoveLetterPoint();
  const loveLetterCollectable = currentLoveLetterCollectable();
  if (state.active === "frog" && loveLetterCollectable && !state.spellbookCollected && distance2D(state.frog, loveLetterPoint) <= SPELLBOOK_RADIUS) {
    showFrogLoveLetterLesson();
  }

  if (state.active === "human" && loveLetterCollectable && !state.spellbookCollected) {
    const distanceToLoveLetter = distance2D(state.human, loveLetterPoint);
    if (distanceToLoveLetter <= LOVE_LETTER_APPROACH_RADIUS && distanceToLoveLetter > SPELLBOOK_RADIUS) {
      showHumanLoveLetterApproach();
    }
  }

  if (state.active === "human" && loveLetterCollectable && !state.spellbookCollected && distance2D(state.human, loveLetterPoint) <= SPELLBOOK_RADIUS) {
    if (maybeRequestSkip(
      "collect_love_letter",
      "You reached the Love Letter before the guided lesson opened the final step.",
      "loveLetter",
      "Almost. Follow the guide, then collect the Love Letter."
    )) {
      return;
    }
    collectSpellbook();
  }
}

function updateLevelThreeInteractions(dt = 0) {
  updateLevelThreeTotemRaftDrift(dt);
  updateLevelThreeTotemGreenButton();
  updateLevelThreeCrocodileTotemCollection();
  updateLevelThreeLoveLetterPlaceholder();
}

function updateLevelThreeTotemGreenButton() {
  const button = LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.find((item) => item.id === "level3TotemGreenButton");
  if (!button) return;
  const frogOnButton = distance2D(state.frog, button.position) <= LEVEL_THREE_TOTEM_GREEN_BUTTON_RADIUS;
  state.levelThree.totemGreenButtonPressed = frogOnButton;
  state.levelThree.totemGreenButtonHeld = frogOnButton;
  state.levelThree.totemGreenButtonHeldActor = frogOnButton ? "frog" : "";
  if (frogOnButton && !state.levelThree.totemGreenButtonPromptShown) {
    state.levelThree.totemGreenButtonPromptShown = true;
    showPrompt("This green button can be pressed again and again.", 2.2);
    showSpeech("frog", "This green button can be pressed again and again.", 2.0);
  }
  if (!frogOnButton) {
    state.levelThree.totemGreenButtonWasHeld = false;
    return;
  }
  if (state.levelThree.totemGreenButtonWasHeld) return;
  state.levelThree.totemGreenButtonWasHeld = true;
  pressLevelThreeTotemGreenButton();
}

function pressLevelThreeTotemGreenButton() {
  if (state.levelThree.totemRaftDrifting) {
    showPrompt("The raft is still floating closer.", 1.8);
    showSpeech("frog", "The raft is still floating closer.", 1.5);
    return;
  }
  const maxState = LEVEL_THREE_RAFT_MARKERS.length - 1;
  if (state.levelThree.totemRaftState < maxState) {
    const fromState = state.levelThree.totemRaftState;
    const targetState = fromState + 1;
    const gate = LEVEL_THREE_TOTEM_RAFT_GATES.find((item) => item.fromState === fromState && item.toState === targetState);
    state.levelThree.totemGreenButtonPresses += 1;
    state.levelThree.openingGreenPressCount = state.levelThree.totemGreenButtonPresses;
    state.levelThree.totemRaftGateState = targetState;
    state.levelThree.totemRaftDrifting = true;
    state.levelThree.totemRaftFromState = fromState;
    state.levelThree.totemRaftTargetState = targetState;
    state.levelThree.totemRaftDriftProgress = 0;
    state.levelThree.totemRaftLastMovedAt = state.elapsed;
    if (gate && !state.levelThree.totemRaftOpenedGates.includes(gate.id)) {
      state.levelThree.totemRaftOpenedGates.push(gate.id);
      spawnRevealSparkles(particleContext, gate.position.x, gate.position.z, 0xcfeab0, 12);
    }
    showPrompt("The reeds open. The raft starts drifting closer.", 2.2);
    showSpeech("frog", "Something is drifting closer.", 1.8);
  } else {
    state.levelThree.totemRaftDocked = true;
    showPrompt("The Totem is already docked. The Human should take it.", 2.1);
  }
}

function updateLevelThreeTotemRaftDrift(dt = 0) {
  if (!state.levelThree.totemRaftDrifting) return;
  state.levelThree.totemRaftDriftProgress = clamp(
    (state.levelThree.totemRaftDriftProgress || 0) + dt / LEVEL_THREE_TOTEM_RAFT_DRIFT_SECONDS,
    0,
    1
  );
  if (state.levelThree.totemRaftDriftProgress < 1) return;

  const targetState = clamp(
    Math.round(state.levelThree.totemRaftTargetState || 0),
    0,
    LEVEL_THREE_RAFT_MARKERS.length - 1
  );
  state.levelThree.totemRaftState = targetState;
  state.levelThree.totemRaftFromState = targetState;
  state.levelThree.totemRaftTargetState = targetState;
  state.levelThree.totemRaftDrifting = false;
  state.levelThree.totemRaftDriftProgress = 1;
  state.levelThree.totemRaftLastMovedAt = state.elapsed;

  const marker = LEVEL_THREE_RAFT_MARKERS[targetState] || LEVEL_THREE_RAFT_MARKERS[0];
  spawnRevealSparkles(particleContext, marker.position.x, marker.position.z, 0x8feeb0, 16);
  if (targetState >= LEVEL_THREE_RAFT_MARKERS.length - 1) {
    state.levelThree.totemRaftDocked = true;
    showPrompt("The Totem has reached the shore. The Human should take it.", 2.8);
    showSpeech("frog", "The Totem reached the shore.", 2.0);
  }
}

function updateLevelThreeCrocodileTotemCollection() {
  if (!state.levelThree.totemRaftDocked || state.levelThree.crocodileTotemCollected) return;
  const raftPosition = currentLevelThreeTotemRaftPosition();
  const activeActor = getActiveActor();
  if (distance2D(activeActor, raftPosition) > LEVEL_THREE_TOTEM_COLLECTION_RADIUS) return;
  if (state.active === "human") {
    collectLevelThreeCrocodileTotem();
    return;
  }
  if (state.elapsed - state.loveLetterLesson.lastFrogPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
  state.loveLetterLesson.lastFrogPromptAt = state.elapsed;
  showPrompt("The Human should pick this one up.", 2.2);
  showSpeech(state.active === "crocodile" ? "crocodile" : "frog", "The Human should pick this one up.", 1.8);
}

function collectLevelThreeCrocodileTotem() {
  if (state.levelThree.crocodileTotemCollected) return;
  state.levelThree.crocodileTotemCollected = true;
  state.levelThree.crocodileUnlocked = true;
  state.levelThree.crocodileEchoAwake = true;
  spawnLevelThreeCrocodileCubeling();
  const echoPosition = LEVEL_THREE_CROCODILE_ECHO.position;
  showPrompt("The Crocodile Cubeling woke up.", 2.6);
  queueSpeech([
    { anchor: "human", text: "Crocodile Totem found.", seconds: 1.7 },
    { anchor: "level3CrocodileEcho", text: "A patient lake friend is listening.", seconds: 2.4 }
  ]);
  spawnRevealSparkles(particleContext, echoPosition.x, echoPosition.z, 0xaef5cf, 28);
}

function spawnLevelThreeCrocodileCubeling() {
  state.levelThree.crocodileSpawned = true;
  state.levelThree.crocodileControlAvailable = true;
  state.levelThree.crocodileSurfaceId = "level3CrocodileEcho";
  state.cubelings.crocodile = {
    unlocked: true,
    unlockedPending: false,
    active: state.active === "crocodile",
    spawned: true,
    controllable: true
  };
  state.crocodile.x = LEVEL_THREE_CROCODILE_SPAWN.x;
  state.crocodile.z = LEVEL_THREE_CROCODILE_SPAWN.z;
  state.crocodile.facing = { ...LEVEL_THREE_CROCODILE_SPAWN.facing };
  spawnRevealSparkles(particleContext, state.crocodile.x, state.crocodile.z, 0x9ee6a6, 18);
}

function updateLevelThreeLoveLetterPlaceholder() {
  if (!state.levelThree.placeholderLoveLetterVisible || state.levelThree.placeholderLoveLetterCollectable) return;
  const activeActor = getActiveActor();
  const distanceToPlaceholder = distance2D(activeActor, LEVEL_THREE_POINTS.placeholderLoveLetter);
  if (distanceToPlaceholder > LOVE_LETTER_APPROACH_RADIUS) return;
  if (state.active === "crocodile") {
    if (state.elapsed - state.loveLetterLesson.lastFrogPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
    state.loveLetterLesson.lastFrogPromptAt = state.elapsed;
    showPrompt("The Human should collect Love Letters.", 2.1);
    showSpeech("crocodile", "The Human should collect Love Letters.", 1.9);
    return;
  }
  if (state.active === "human") {
    if (state.elapsed - state.loveLetterLesson.lastHumanPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
    state.loveLetterLesson.lastHumanPromptAt = state.elapsed;
    showPrompt("Placeholder Love Letter: Level Three route is not authored yet.", 2.2);
    showSpeech("loveLetter", "Not yet. Sketch the path first.", 1.9);
  }
}

function updateLevelOneInteractions() {
  if (state.reveals.button && actorCanPressButton({
    activeActor: state.active,
    actorKey: "frog",
    actor: state.frog,
    button: buttonPoint(),
    radius: BUTTON_RADIUS,
    pressed: state.buttonPressed,
    requiredActor: "frog"
  })) {
    pressButton();
    return;
  }
  const loveLetterPoint = currentLoveLetterPoint();
  const loveLetterCollectable = currentLoveLetterCollectable();
  if (state.active === "frog" && loveLetterCollectable && !state.spellbookCollected && distance2D(state.frog, loveLetterPoint) <= SPELLBOOK_RADIUS) {
    showFrogLoveLetterLesson();
  }
  if (state.active === "human" && loveLetterCollectable && !state.spellbookCollected) {
    const distanceToLoveLetter = distance2D(state.human, loveLetterPoint);
    if (distanceToLoveLetter <= LOVE_LETTER_APPROACH_RADIUS && distanceToLoveLetter > SPELLBOOK_RADIUS) showHumanLoveLetterApproach();
    if (distanceToLoveLetter <= SPELLBOOK_RADIUS) collectSpellbook();
  }
}

function updateTutorialProximity() {
  if (state.scene.id !== SCENES.TUTORIAL) return;
  if (state.tutorialSkipped || state.tutorialComplete) return;
  if (currentStepId() === "inspect_frog_echo" && state.reveals.frogEcho && distance2D(state.human, START.frog) <= FROG_ECHO_RADIUS) {
    showFrogEchoDialogue();
  }
  if (!state.reveals.frog) return;
  if (currentStepId() === "possess_frog" && !canTransferToFrog(TRANSFER_INPUT_GRACE_RADIUS)) {
    setTutorialStep("approach_frog");
    showSpeech("frog", "Come a little closer to the Frog Cubeling.", 1.5);
    return;
  }
  if (currentStepId() === "approach_frog" && canTransferToFrog(TRANSFER_INPUT_GRACE_RADIUS)) {
    advanceTutorial("approach_frog");
  }
  if (currentStepId() === "possess_frog_again" && state.active === "frog" && isFrogNearJumpableBarrier()) {
    advanceTutorial("possess_frog_again");
  }
  if (currentStepId() === "press_button" && state.buttonPressed) advanceTutorial("press_button");
}

function updateLevelOneBloomVisuals(dt) {
  if (!levelOneBloomMeshes.lilyPad) return;
  const isLevelOne = state.scene.id === SCENES.LEVEL_ONE;
  const progress = levelOneBloomProgress();
  const elapsed = state.levelOne.blueBloomRevealElapsed;
  const lilyBob = Math.sin(state.elapsed * 2.2) * 0.035;
  levelOneBloomMeshes.lilyPad.visible = isLevelOne;
  levelOneBloomMeshes.lilyPad.position.set(
    LEVEL_ONE_LILY_PAD.position.x,
    LEVEL_ONE_LILY_PAD.position.y + lilyBob,
    LEVEL_ONE_LILY_PAD.position.z
  );
  levelOneBloomMeshes.lilyPad.rotation.z = Math.sin(state.elapsed * 1.6) * 0.018;

  if (levelOneBloomMeshes.latch) {
    const latchProgress = easeOutCubic(clamp((elapsed - LEVEL_ONE_BLUE_BLOOM_TIMING.latchOpenAt) / 0.42, 0, 1));
    levelOneBloomMeshes.latch.visible = isLevelOne;
    levelOneBloomMeshes.latch.position.set(
      LEVEL_ONE_BLUE_BLOOM_LATCH.position.x,
      LEVEL_ONE_BLUE_BLOOM_LATCH.position.y + Math.sin(state.elapsed * 2.6) * 0.018,
      LEVEL_ONE_BLUE_BLOOM_LATCH.position.z
    );
    levelOneBloomMeshes.latch.rotation.x = -latchProgress * 0.42;
    levelOneBloomMeshes.latch.children.forEach((child, index) => {
      if (!child.material?.emissive) return;
      child.material.emissive.setHex(index === 0 ? 0x000000 : 0x0b355e);
      child.material.emissiveIntensity = latchProgress * 0.28;
    });
  }

  Object.entries(LEVEL_ONE_BLUE_BLOOM_MATS).forEach(([id, config], index) => {
    const mesh = levelOneBloomMeshes.mats?.[id];
    if (!mesh) return;
    mesh.visible = isLevelOne;
    const bedBob = Math.sin(state.elapsed * 1.6 + index) * 0.026;
    mesh.position.set(0, bedBob, 0);
    mesh.rotation.y = config.rotationY + Math.sin(state.elapsed * 1.05 + index) * 0.018 * (1 - progress * 0.35);
    mesh.rotation.z = Math.sin(state.elapsed * 1.2 + index) * 0.018;
    mesh.children.forEach((child) => {
      const held = child.userData.heldOffset;
      const docked = child.userData.dockedOffset;
      if (!held || !docked) return;
      const delay = child.userData.bloomDelay || 0;
      const childProgress = easeInOutSmooth(clamp((progress - delay) / Math.max(0.12, 1 - delay), 0, 1));
      child.position.lerpVectors(held, docked, childProgress);
      child.rotation.y = (child.userData.baseRotationY || 0) +
        Math.sin(state.elapsed * 1.9 + (child.userData.bloomBob || 0)) * 0.035 * (1 - childProgress * 0.6);
    });
  });

  (levelOneBloomMeshes.dockGlows || []).forEach((glow, index) => {
    const pulse = 0.5 + Math.sin(state.elapsed * 4.0 + index) * 0.5;
    glow.visible = isLevelOne;
    glow.material.opacity = state.levelOne.blueBloomDocked ? 0.24 + pulse * 0.13 : progress > 0.65 ? (progress - 0.65) * 0.36 : 0;
    glow.scale.setScalar(0.95 + pulse * 0.08);
  });

  if (dt > 0 && state.levelOne.blueBloomDocked && !state.levelOne.crossingReadyPromptShown && state.active === "human") {
    state.levelOne.crossingReadyPromptShown = true;
    showSpeech("human", "Now I can cross.", 1.8);
  }
}

function levelOneBloomProgress() {
  if (state.levelOne.blueBloomDocked) return 1;
  if (!state.levelOne.blueBloomReleased && !state.levelOne.blueBloomRevealActive) return 0;
  return levelOneBloomDriftProgress();
}

function levelOneBloomDriftProgress() {
  const raw = (state.levelOne.blueBloomRevealElapsed - LEVEL_ONE_BLUE_BLOOM_TIMING.driftStartAt) /
    (LEVEL_ONE_BLUE_BLOOM_TIMING.dockedAt - LEVEL_ONE_BLUE_BLOOM_TIMING.driftStartAt);
  return easeInOutSmooth(clamp(raw, 0, 1));
}

function updateVisualEffects(dt) {
  markerMeshes.active.rotation.z += dt * 1.8;
  updateLevelOneBloomVisuals(dt);
  updateLevelThreeOpeningVisuals(dt);
  if (state.frogReveal.active) {
    state.frogReveal.elapsed += dt;
    if (state.frogReveal.elapsed >= FROG_REVEAL_SECONDS) state.frogReveal.active = false;
  }
  if (state.levelTwo.elephantRevealActive) {
    state.levelTwo.elephantRevealElapsed += dt;
    if (state.levelTwo.elephantRevealElapsed >= LEVEL_TWO_ELEPHANT_REVEAL_SECONDS) {
      state.levelTwo.elephantRevealActive = false;
    }
  }
  updateFrogUnlockVisuals(dt);
  updateRightFloorReveal(dt);
  updateBarrierReveal(dt);
  updateLoveLetterReveal(dt);
  updateLoveLetterAttention(dt);
  levelTwoGoalMeshes.forEach((mesh) => {
    if (mesh.userData.levelTwoAsset !== "placeholder-love-letter") return;
    mesh.visible = state.scene.id === SCENES.LEVEL_TWO && !state.spellbookCollected;
    mesh.position.y = LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y + Math.sin(state.elapsed * 2.4) * 0.11;
    mesh.rotation.y += dt * 1.25;
  });
  levelThreeGoalMeshes.forEach((mesh) => {
    if (mesh.userData.levelThreeAsset !== "placeholder-love-letter") return;
    mesh.visible = state.scene.id === SCENES.LEVEL_THREE && state.levelThree.placeholderLoveLetterVisible;
    mesh.position.y = LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y + Math.sin(state.elapsed * 2.2) * 0.1;
    mesh.rotation.y += dt * 1.1;
  });
  if (levelTwoInteractiveMeshes.elephantTotem) {
    const bob = Math.sin(state.elapsed * 3.0) * 0.12;
    levelTwoInteractiveMeshes.elephantTotem.position.y = LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 0.9 + bob;
    levelTwoInteractiveMeshes.elephantTotem.rotation.y += dt * 1.45;
  }
  if (levelTwoInteractiveMeshes.elephantTotemGlow?.material) {
    const pulse = 0.5 + Math.sin(state.elapsed * 4.0) * 0.5;
    levelTwoInteractiveMeshes.elephantTotemGlow.material.opacity = state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected
      ? 0.24 + pulse * 0.18
      : 0;
    levelTwoInteractiveMeshes.elephantTotemGlow.scale.setScalar(0.92 + pulse * 0.08);
  }
  if (levelTwoInteractiveMeshes.elephantEcho) {
    const pulse = 0.5 + Math.sin(state.elapsed * 3.2) * 0.5;
    const echoSurfaceY = LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y;
    levelTwoInteractiveMeshes.elephantEcho.position.set(
      LEVEL_TWO_POINTS.elephantEcho.x,
      echoSurfaceY + Math.sin(state.elapsed * 2.6) * 0.05,
      LEVEL_TWO_POINTS.elephantEcho.z
    );
    levelTwoInteractiveMeshes.elephantEcho.rotation.y += dt * 0.55;
    if (levelTwoInteractiveMeshes.elephantEchoRing?.material) {
      levelTwoInteractiveMeshes.elephantEchoRing.position.set(
        LEVEL_TWO_POINTS.elephantEcho.x,
        echoSurfaceY + 0.045,
        LEVEL_TWO_POINTS.elephantEcho.z
      );
      levelTwoInteractiveMeshes.elephantEchoRing.material.opacity = state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantEchoVisible
        ? state.levelTwo.elephantAwake ? 0.32 + pulse * 0.14 : 0.22 + pulse * 0.1
        : 0;
      levelTwoInteractiveMeshes.elephantEchoRing.scale.setScalar((state.levelTwo.elephantAwake ? 1.08 : 1) + pulse * 0.08);
    }
    if (state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantEchoVisible && !state.levelTwo.elephantAwake) {
    state.levelTwo.elephantEchoSparkleTimer -= dt;
    if (state.levelTwo.elephantEchoSparkleTimer <= 0) {
      state.levelTwo.elephantEchoSparkleTimer = 1.1;
        spawnRevealSparkles(particleContext, LEVEL_TWO_POINTS.elephantEcho.x, LEVEL_TWO_POINTS.elephantEcho.z, LEVEL_TWO_ELEPHANT_ECHO_SPARKLE, 4, {
          y: echoSurfaceY
        });
      }
    }
  }
  LEVEL_TWO_RED_PLATFORMS.forEach((platform) => {
    const mesh = levelTwoInteractiveMeshes.redPlatforms?.[platform.id];
    if (!mesh) return;
    const platformState = state.levelTwo.redPlatforms?.[platform.id];
    const nextY = Number((platform.baseY + (platformState?.lift || 0)).toFixed(4));
    if (!Number.isFinite(mesh.userData.lastY) || Math.abs(mesh.userData.lastY - nextY) > 0.0005) {
      mesh.position.y = nextY;
      mesh.userData.lastY = nextY;
    }
  });
  LEVEL_TWO_RED_BUTTONS.forEach((button) => {
    const mesh = levelTwoInteractiveMeshes.redButtons?.[button.id];
    if (!mesh) return;
    const nextY = Number((levelTwoRedButtonSurfaceY(button) + (button.surfaceClearance || 0)).toFixed(4));
    if (
      !Number.isFinite(mesh.userData.lastY) ||
      Math.abs(mesh.userData.lastY - nextY) > 0.0005 ||
      mesh.position.x !== button.position.x ||
      mesh.position.z !== button.position.z
    ) {
      mesh.position.set(button.position.x, nextY, button.position.z);
      mesh.userData.lastY = nextY;
    }
  });
  const loveLetterPoint = currentLoveLetterPoint();
  const loveLetterBaseY = Number.isFinite(loveLetterPoint.y) ? loveLetterPoint.y : SURFACE_Y;
  const levelOneBloomingLetter = state.scene.id === SCENES.LEVEL_ONE &&
    state.levelOne.blueBloomReleased &&
    !state.levelOne.blueBloomDocked;
  const loveLetterBob = levelOneBloomingLetter
    ? Math.sin(state.elapsed * 1.75) * 0.08
    : Math.sin(state.elapsed * 2.7) * 0.12;
  if (state.reveals.spellbook && !state.spellbookCollected) {
    const revealT = state.loveLetterReveal.active
      ? clamp(state.loveLetterReveal.elapsed / LOVE_LETTER_REVEAL_SECONDS, 0, 1)
      : 1;
    const drop = levelOneBloomingLetter ? 0 : (1 - easeOutCubic(revealT)) * 2.35;
    const wiggle = levelOneBloomingLetter
      ? Math.sin(state.elapsed * 2.4) * 0.08
      : state.loveLetterReveal.active
      ? Math.sin(state.elapsed * 18) * 0.16 * (1 - revealT)
      : 0;
    const attentionBounce = state.loveLetterAttention.bounceElapsed > 0
      ? Math.sin((1 - state.loveLetterAttention.bounceElapsed / LOVE_LETTER_ATTENTION_BOUNCE_SECONDS) * Math.PI) * 0.32
      : 0;
    markerMeshes.spellbookClosed.visible = true;
    markerMeshes.spellbookClosed.position.set(loveLetterPoint.x, loveLetterBaseY + 0.72 + loveLetterBob + attentionBounce + drop, loveLetterPoint.z);
    markerMeshes.spellbookClosed.rotation.y += dt * 1.7;
    markerMeshes.spellbookClosed.rotation.z = wiggle;
    markerMeshes.spellbookOpen.visible = false;
    markerMeshes.rewardGlow.position.set(loveLetterPoint.x, loveLetterBaseY + 0.08, loveLetterPoint.z);
    markerMeshes.rewardGlow.material.opacity = (0.38 + Math.sin(state.elapsed * 4) * 0.08) * revealT;
  } else {
    markerMeshes.spellbookClosed.visible = false;
    markerMeshes.spellbookClosed.rotation.z = 0;
    markerMeshes.rewardGlow.material.opacity = 0;
  }

  if (state.reward.active || state.celebration.active) {
    state.reward.elapsed += dt;
    markerMeshes.spellbookOpen.visible = state.celebration.active || state.reward.elapsed < CELEBRATION_MIN_SECONDS;
    markerMeshes.spellbookOpen.position.set(state.human.x, SURFACE_Y + 2.15 + Math.sin(state.elapsed * 5) * 0.08, state.human.z);
    markerMeshes.spellbookOpen.rotation.y += dt * 2.2;
    if (state.reward.elapsed > CELEBRATION_MIN_SECONDS && !state.celebration.active) {
      markerMeshes.spellbookOpen.visible = false;
      state.reward.active = false;
    }
  }

  updateParticles(particleContext, dt);
}

function updateLevelThreeOpeningVisuals(dt) {
  if (levelThreeInteractiveMeshes.totemRaft) {
    const raftPosition = currentLevelThreeTotemRaftPosition();
    const bob = Math.sin(state.elapsed * 2.1) * 0.045;
    levelThreeInteractiveMeshes.totemRaft.position.set(raftPosition.x, SURFACE_Y + 0.12 + bob, raftPosition.z);
    levelThreeInteractiveMeshes.totemRaft.rotation.y += dt * 0.18;
    levelThreeInteractiveMeshes.totemRaft.traverse((child) => {
      if (child.userData?.levelThreeRaftTotem) {
        child.visible = state.scene.id === SCENES.LEVEL_THREE && !state.levelThree.crocodileTotemCollected;
      }
    });
  }

  LEVEL_THREE_TOTEM_RAFT_GATES.forEach((gate) => {
    const gateMesh = levelThreeInteractiveMeshes.totemRaftGates?.[gate.id];
    if (!gateMesh) return;
    const opened = state.levelThree.totemRaftOpenedGates?.includes(gate.id);
    const bob = Math.sin(state.elapsed * 2.4 + gate.gateIndex) * 0.025;
    gateMesh.visible = state.scene.id === SCENES.LEVEL_THREE;
    gateMesh.position.set(
      gate.position.x + (opened ? 0.26 : 0),
      SURFACE_Y + 0.02 + bob - (opened ? 0.42 : 0),
      gate.position.z
    );
    gateMesh.rotation.z = opened ? -0.38 : 0;
    gateMesh.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.opacity !== undefined) {
          material.transparent = true;
          material.opacity = opened ? 0.28 : 0.92;
        }
      });
    });
  });

  if (levelThreeInteractiveMeshes.crocodileEcho) {
    const awake = Boolean(state.levelThree.crocodileEchoAwake);
    const pulse = 0.5 + Math.sin(state.elapsed * (awake ? 4.2 : 2.8)) * 0.5;
    levelThreeInteractiveMeshes.crocodileEcho.position.set(
      LEVEL_THREE_CROCODILE_ECHO.position.x,
      SURFACE_Y + 0.14 + Math.sin(state.elapsed * 2.3) * 0.04,
      LEVEL_THREE_CROCODILE_ECHO.position.z
    );
    levelThreeInteractiveMeshes.crocodileEcho.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const part = child.userData?.levelThreeEchoPart || "body";
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.opacity !== undefined) {
          material.opacity = part === "ring"
            ? awake ? 0.74 + pulse * 0.16 : 0.48 + pulse * 0.08
            : awake ? 0.58 + pulse * 0.08 : 0.32 + pulse * 0.06;
        }
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = part === "ring"
            ? awake ? 0.34 + pulse * 0.12 : 0.1
            : awake ? 0.18 + pulse * 0.08 : 0.08;
        }
      });
    });
  }
}

function updateFrogUnlockVisuals(dt) {
  if (state.reveals.frogEcho && !state.reveals.frog && !state.reveals.frogTotem && !state.frogTotem.collected) {
    state.frogTotemReveal.delay += dt;
    if (state.frogTotemReveal.delay >= FROG_TOTEM_REVEAL_DELAY) revealFrogTotem();
  }

  if (markerMeshes.frogEcho) {
    const pulse = 0.5 + Math.sin(state.elapsed * 3.2) * 0.5;
    markerMeshes.frogEcho.position.set(START.frog.x, SURFACE_Y + 0.08 + Math.sin(state.elapsed * 2.6) * 0.05, START.frog.z);
    markerMeshes.frogEcho.rotation.y += dt * 0.55;
    if (markerMeshes.frogEchoCircle) {
      markerMeshes.frogEchoCircle.position.set(START.frog.x, SURFACE_Y + 0.045, START.frog.z);
      markerMeshes.frogEchoCircle.material.opacity = state.reveals.frogEcho && !state.reveals.frog ? 0.22 + pulse * 0.1 : 0;
      markerMeshes.frogEchoCircle.scale.setScalar(1 + pulse * 0.08);
    }
    if (state.reveals.frogEcho && !state.reveals.frog) {
      state.frogEcho.sparkleTimer -= dt;
      if (state.frogEcho.sparkleTimer <= 0) {
        state.frogEcho.sparkleTimer = 1.1;
        spawnRevealSparkles(particleContext, START.frog.x, START.frog.z, FROG_ECHO_SPARKLE, 4);
      }
    }
  }

  if (markerMeshes.frogTotem) {
    const revealT = state.frogTotemReveal.active
      ? clamp(state.frogTotemReveal.elapsed / FROG_TOTEM_REVEAL_SECONDS, 0, 1)
      : state.reveals.frogTotem ? 1 : 0;
    if (state.frogTotemReveal.active) {
      state.frogTotemReveal.elapsed += dt;
      if (state.frogTotemReveal.elapsed >= FROG_TOTEM_REVEAL_SECONDS) state.frogTotemReveal.active = false;
    }
    const drop = (1 - easeOutCubic(revealT)) * 2.4;
    const bob = Math.sin(state.elapsed * 3.4) * 0.13;
    markerMeshes.frogTotem.position.set(FROG_TOTEM.x, SURFACE_Y + 0.92 + bob + drop, FROG_TOTEM.z);
    markerMeshes.frogTotem.rotation.y += dt * 1.85;
    if (markerMeshes.frogTotemGlow) {
      const pulse = 0.5 + Math.sin(state.elapsed * 4.2) * 0.5;
      markerMeshes.frogTotemGlow.position.set(FROG_TOTEM.x, SURFACE_Y + 0.05, FROG_TOTEM.z);
      markerMeshes.frogTotemGlow.material.opacity = state.reveals.frogTotem && !state.frogTotem.collected ? 0.38 + pulse * 0.26 : 0;
      markerMeshes.frogTotemGlow.scale.setScalar(0.78 + pulse * 0.1);
    }
    if (state.reveals.frogTotem && !state.frogTotem.collected) {
      state.frogTotem.sparkleTimer -= dt;
      if (state.frogTotem.sparkleTimer <= 0) {
        state.frogTotem.sparkleTimer = 0.9;
        spawnRevealSparkles(particleContext, FROG_TOTEM.x, FROG_TOTEM.z, FROG_TOTEM_SPARKLE, 5);
      }
    }
  }
}

function switchActor() {
  if (!state.ready) return;
  if (state.scene.id !== SCENES.TUTORIAL) {
    switchActorFree();
    return;
  }
  if (state.active === "frog") {
    if (maybeRequestSkip(
      "return_human",
      "You tried returning before the guided lesson introduced it.",
      "frog",
      "Move around as the Frog Cubeling first. Shift will bring you back soon."
    )) {
      return;
    }
    state.active = "human";
    state.frogAi.timer = 0;
    state.frogAi.currentSide = frogCurrentSide();
    state.frogAi.targetSource = "patrol";
    state.frogAi.usesHumanAsTarget = false;
    state.frogAi.celebrationPerch = null;
    spawnTransferParticles(particleContext, state.frog, state.human);
    if (tutorialFrogStrandedCandidate()) {
      updateTutorialRecovery();
      return;
    }
    const loveLetterWaiting = state.reveals.spellbook && !state.spellbookCollected;
    advanceTutorial("return_human");
    advanceTutorial("return_after_button");
    if (loveLetterWaiting) {
      showPrompt("Walk your character to the Love Letter and pick it up.", 2.8);
      triggerLoveLetterAttention("return_to_human", "gentle");
      queueSpeech([
        { anchor: "loveLetter", text: "Come back as yourself and collect me!", seconds: 2.4 },
        { anchor: "", text: "", seconds: 0.7 },
        { anchor: "human", text: "The Frog Cubeling can't grab it. I should go get it.", seconds: 2.3 }
      ]);
    } else if (state.tutorialSkipped || state.celebration.freeMode) {
      showSpeech("human", "Back to me.", 1.2);
    }
    return;
  }

  if (!state.reveals.frog) {
    if (state.reveals.frogEcho || state.reveals.frogTotem) {
      showPrompt("Collect the Frog Cubeling Totem to awaken the Frog Cubeling.", 2.1);
      if (state.reveals.frogTotem) showFrogTotemDialogue(true);
      else showFrogEchoDialogue(true);
      return;
    }
    if (!maybeRequestSkip(
      "possess_frog",
      "You tried transferring before the Frog Cubeling was available.",
      "human",
      "The Frog Echo has not appeared yet."
    )) {
      showPrompt("The Frog Echo has not appeared yet.", 1.1);
    }
    return;
  }

  if (currentStepId() === "approach_frog" && canTransferToFrog(TRANSFER_INPUT_GRACE_RADIUS)) {
    advanceTutorial("approach_frog");
  }
  if (!hasLearned("possess_frog") && currentStepId() !== "possess_frog" && currentStepId() !== "possess_frog_again") {
    maybeRequestSkip(
      "possess_frog",
      "You tried transferring before the guided lesson asked for it.",
      "human",
      "Walk close to the Frog Cubeling first."
    );
    return;
  }
  if (!canTransferToFrog(TRANSFER_INPUT_GRACE_RADIUS)) {
    showPrompt("Come a little closer to the Frog Cubeling.", 1.4);
    showSpeech("frog", "Come a little closer to the Frog Cubeling.", 1.5);
    return;
  }
  state.active = "frog";
  resetTutorialRecoveryState();
  state.frogAi.everPossessed = true;
  state.frogAi.timer = 0;
  state.frogAi.currentSide = frogCurrentSide();
  state.frogAi.targetSource = "patrol";
  state.frogAi.usesHumanAsTarget = false;
  state.frogAi.celebrationPerch = null;
  spawnTransferParticles(particleContext, state.human, state.frog);
  showSpeech("frog", "You are the Frog Cubeling now.", 1.2);
  advanceTutorial("possess_frog");
}

function switchActorFree() {
  if (!sceneAllowsInput()) return;
  if (!state.reveals.frog && !canUseElephantCubeling() && !canUseCrocodileCubeling()) {
    showPrompt("No Cubeling is available here.", 1.4);
    return;
  }
  if (state.active === "frog" || state.active === "elephant" || state.active === "crocodile") {
    const returningActor = getActiveActor();
    const returningKey = state.active;
    state.active = "human";
    if (returningKey === "frog") {
      state.frogAi.timer = 0;
      state.frogAi.currentSide = frogCurrentSide();
      state.frogAi.targetSource = "patrol";
      state.frogAi.usesHumanAsTarget = false;
    }
    if (returningKey === "elephant") state.cubelings.elephant.active = false;
    if (returningKey === "crocodile") state.cubelings.crocodile.active = false;
    spawnTransferParticles(particleContext, returningActor, state.human);
    if (state.scene.id === SCENES.LEVEL_ONE && state.levelOne.blueBloomDocked && !state.spellbookCollected) {
      showPrompt("Bring your character across the blue blooms to the Love Letter.", 2.2);
      showSpeech("human", "There we go. Now I can cross.", 2.0);
    } else {
      showSpeech("human", "Back to me.", 1.2);
    }
    return;
  }

  const transferTarget = nearestTransferTarget(TRANSFER_INPUT_GRACE_RADIUS);
  if (!transferTarget) {
    const nearest = nearestAvailableCubeling();
    if (nearest?.key === "elephant") {
      showPrompt("Come a little closer to the Elephant Cubeling.", 1.4);
      showSpeech("elephant", "Come a little closer to the Elephant Cubeling.", 1.5);
    } else if (nearest?.key === "crocodile") {
      registerCrocodileTransferPrompt();
    } else {
      showPrompt("Come a little closer to the Frog Cubeling.", 1.4);
      showSpeech("frog", "Come a little closer to the Frog Cubeling.", 1.5);
    }
    return;
  }
  if (transferTarget.key === "elephant") {
    state.active = "elephant";
    state.cubelings.elephant.active = true;
    spawnTransferParticles(particleContext, state.human, state.elephant);
    clearHumanFromElephantExitLane();
    showPrompt("You are the Elephant Cubeling now.", 1.6);
    showSpeech("elephant", "You are the Elephant Cubeling now.", 1.4);
    return;
  }
  if (transferTarget.key === "crocodile") {
    state.active = "crocodile";
    state.cubelings.crocodile.active = true;
    spawnTransferParticles(particleContext, state.human, state.crocodile);
    showPrompt("You are the Crocodile Cubeling now.", 1.8);
    showSpeech("crocodile", "You are the Crocodile Cubeling now.", 1.5);
    return;
  }
  possessFrogCubeling();
}

function registerCrocodileTransferPrompt() {
  if (state.elapsed - state.levelThree.lastCrocodileTransferPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
  state.levelThree.lastCrocodileTransferPromptAt = state.elapsed;
  showPrompt("Come a little closer to the Crocodile Cubeling.", 1.6);
  showSpeech("crocodile", "Come a little closer to the Crocodile Cubeling.", 1.5);
}

function registerFrogLoveLetterBlock() {
  state.loveLetterLesson.frogBlocked = true;
  if (state.elapsed - state.loveLetterLesson.lastFrogPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
  state.loveLetterLesson.frogBlockCount += 1;
  state.loveLetterLesson.lastFrogPromptAt = state.elapsed;
  showFrogLoveLetterLesson();
}

function showFrogLoveLetterLesson() {
  if (state.elapsed - state.loveLetterLesson.lastFrogPromptAt >= LOVE_LETTER_LESSON_COOLDOWN) {
    state.loveLetterLesson.lastFrogPromptAt = state.elapsed;
  }
  showPrompt("The Frog Cubeling can't collect the Love Letter. Switch back to your character to pick it up.", 3.2);
  const frogLine = state.scene.id === SCENES.LEVEL_ONE
    ? "I brought it closer, but you pick it up."
    : "I can't pick this up.";
  queueSpeech([
    { anchor: "frog", text: frogLine, seconds: 2.1 },
    { anchor: "loveLetter", text: "Come back as yourself and collect me!", seconds: 2.4 }
  ]);
}

function possessFrogCubeling() {
  state.active = "frog";
  state.frogAi.everPossessed = true;
  state.frogAi.timer = 0;
  state.frogAi.currentSide = frogCurrentSide();
  state.frogAi.targetSource = "patrol";
  state.frogAi.usesHumanAsTarget = false;
  spawnTransferParticles(particleContext, state.human, state.frog);
  showSpeech("frog", "You are the Frog Cubeling now.", 1.2);
}

function registerFrogWaterBlock() {
  if (state.scene.id !== SCENES.LEVEL_ONE || state.active !== "frog") return;
  if (state.elapsed - state.levelOne.lastFrogWaterPromptAt < LEVEL_ONE_FROG_WATER_SPEECH_COOLDOWN) return;
  state.levelOne.frogWaterBlockedCount += 1;
  state.levelOne.lastFrogWaterPromptAt = state.elapsed;
  state.levelOne.hintStage = "frog_water";
  showSpeech("frog", "I need to jump, not swim.", 1.7);
}

function showHumanLoveLetterApproach() {
  if (state.elapsed - state.loveLetterLesson.lastHumanPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
  state.loveLetterLesson.humanPrompted = true;
  state.loveLetterLesson.lastHumanPromptAt = state.elapsed;
  queueSpeech([
    { anchor: "human", text: "I need that Love Letter.", seconds: 1.9 },
    { anchor: "loveLetter", text: "There you are. Pick me up!", seconds: 2.1 }
  ]);
}

function frogJump() {
  if (state.active !== "frog") {
    showPrompt("Only the Frog Cubeling can jump.", 1.2);
    return;
  }
  if (maybeRequestSkip(
    "jump_wall",
    "You tried the Frog Cubeling jump before the guided lesson introduced it.",
    "frog",
    "We'll practice the big Frog Cubeling jump in a moment."
  )) {
    return;
  }
  if (state.frogJump) return;

  const jump = getFrogJump();
  if (!jump) {
    const text = state.scene.id === SCENES.LEVEL_ONE
      ? "Line up with the lily pad, then press Space."
      : state.scene.id === SCENES.LEVEL_TWO
        ? (state.levelTwo.lastFrogJumpReason === "too_high" ? "That ledge is too high for the Frog Cubeling." : "Line up with a low ledge, then press Space.")
        : state.scene.id === SCENES.LEVEL_THREE
          ? "Line up with the next floating leaf, then press Space."
          : "Face the barrier from close range, then press Space.";
    showPrompt(text, 1.4);
    const speech = state.scene.id === SCENES.LEVEL_ONE
      ? "I need to jump, not swim."
      : state.scene.id === SCENES.LEVEL_TWO
        ? (state.levelTwo.lastFrogJumpReason === "too_high" ? "That's too high for me." : "Line me up with a ledge first.")
        : state.scene.id === SCENES.LEVEL_THREE
          ? "I can hop from leaf to leaf."
          : "Line me up with the barrier first.";
    showSpeech("frog", speech, 1.5);
    return;
  }
  state.frogJump = jump;
  state.lastJumpClearance = {
    active: true,
    currentLift: 0,
    peakLift: FROG_JUMP_LIFT,
    clearsBarrier: FROG_JUMP_LIFT > jump.over.topHeight + 0.55
  };
}

function getFrogJump() {
  if (state.scene.id === SCENES.LEVEL_ONE) return getLevelOneFrogJump();
  if (state.scene.id === SCENES.LEVEL_TWO) return getLevelTwoFrogJump();
  if (state.scene.id === SCENES.LEVEL_THREE) return getLevelThreeFrogJump();
  const barrierX = gridPoint(WALL_COLUMN, DOOR_ROW).x;
  const side = state.frog.x < barrierX ? 1 : -1;
  const facingTowardBarrier = state.frog.facing.x * side > 0.35;
  const nearBarrier = Math.abs(state.frog.x - barrierX) < 1.85;
  const matchingBarrier = activeBarrierColliders().find((barrier) => Math.abs(state.frog.z - barrier.z) <= barrier.halfZ + 0.15);
  if (!facingTowardBarrier || !nearBarrier || !matchingBarrier) return null;

  const landing = {
    x: barrierX + side * 2.05,
    z: clamp(state.frog.z, WORLD_BOUNDS.minZ + state.frog.radius, WORLD_BOUNDS.maxZ - state.frog.radius)
  };
  if (collidesAt(state.frog, landing.x, landing.z)) return null;

  return {
    kind: "tutorial_barrier",
    start: { x: state.frog.x, z: state.frog.z },
    end: landing,
    over: { x: barrierX, z: matchingBarrier.z, topHeight: BARRIER_TOP_HEIGHT },
    elapsed: 0,
    duration: JUMP_DURATION
  };
}

function getLevelThreeFrogJump() {
  const currentSurface = state.levelThree.frogLaneSurfaceId || "";
  const currentSurfaceJump = currentSurface
    ? LEVEL_THREE_FROG_LANE_JUMPS.find((candidate) =>
      candidate.fromId === currentSurface &&
      distance2D(state.frog, candidate.from) <= candidate.fromRadius + 0.65
    )
    : null;
  const startJump = !currentSurface
    ? LEVEL_THREE_FROG_LANE_JUMPS.find((candidate) =>
      candidate.fromId === "level3FrogLaneStart" &&
      distance2D(state.frog, candidate.from) <= candidate.fromRadius
    )
    : null;
  const jump = currentSurfaceJump || startJump;
  if (!jump) return null;
  const landing = { x: jump.to.x, z: jump.to.z };
  if (collidesAt(state.frog, landing.x, landing.z, { ignoreActor: true })) return null;
  return {
    kind: "level_three_lily_lane",
    jumpId: jump.id,
    destinationSurface: jump.destinationSurface,
    start: { x: state.frog.x, z: state.frog.z },
    end: landing,
    over: { x: landing.x, z: landing.z, topHeight: 0.18 },
    elapsed: 0,
    duration: JUMP_DURATION
  };
}

function getLevelTwoFrogJump() {
  if (state.levelTwo.frogSurfaceId) {
    state.levelTwo.lastFrogJumpResult = "blocked";
    state.levelTwo.lastFrogJumpReason = "already_on_ledge";
    return null;
  }
  const ledge = LEVEL_TWO_FROG_JUMPABLE_LEDGES.find((candidate) =>
    candidate.frogJumpable &&
    (
      distance2D(state.frog, candidate.approachZone) <= candidate.approachZone.radius ||
      pointNearLevelTwoTiles(state.frog, candidate.tiles, 1.75)
    ) &&
    !pointInLevelTwoTiles(state.frog, candidate.tiles, state.frog.radius * 0.2)
  );
  if (ledge) {
    const landing = { x: ledge.landingPoint.x, z: ledge.landingPoint.z };
    if (levelTwoLandingBlockedAt(landing.x, landing.z, ledge.id)) {
      state.levelTwo.lastFrogJumpResult = "blocked";
      state.levelTwo.lastFrogJumpReason = "landing_blocked";
      return null;
    }
    state.levelTwo.lastFrogJumpResult = "ready";
    state.levelTwo.lastFrogJumpReason = ledge.id;
    return {
      kind: "level_two_ledge",
      ledgeId: ledge.id,
      start: { x: state.frog.x, z: state.frog.z },
      end: landing,
      over: { x: landing.x, z: landing.z, topHeight: ledge.heightAboveGround },
      elapsed: 0,
      duration: JUMP_DURATION
    };
  }

  if (levelTwoNearTooHighTarget()) {
    state.levelTwo.lastFrogJumpResult = "blocked";
    state.levelTwo.lastFrogJumpReason = "too_high";
    state.levelTwo.frogTooHighPromptCount += 1;
    state.levelTwo.lastFrogJumpAt = state.elapsed;
    return null;
  }

  state.levelTwo.lastFrogJumpResult = "blocked";
  state.levelTwo.lastFrogJumpReason = "no_jumpable_ledge";
  state.levelTwo.lastFrogJumpAt = state.elapsed;
  return null;
}

function levelTwoLandingBlockedAt(x, z, allowedLedgeId) {
  const bounds = activeWorldBounds();
  if (x < bounds.minX + state.frog.radius || x > bounds.maxX - state.frog.radius) return true;
  if (z < bounds.minZ + state.frog.radius || z > bounds.maxZ - state.frog.radius) return true;
  if (distance2D({ x, z }, state.human) < state.frog.radius + state.human.radius + ACTOR_BLOCK_PADDING) return true;
  for (const collider of sceneObjectColliders.filter((item) => item.scene === SCENES.LEVEL_TWO)) {
    if (!circleIntersectsAabb(x, z, state.frog.radius, collider)) continue;
    const ledge = levelTwoLedgeForCollider(collider);
    if (ledge?.id === allowedLedgeId) continue;
    return true;
  }
  return false;
}

function levelTwoNearTooHighTarget() {
  const highTargets = [
    LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES,
    LEVEL_TWO_CENTRAL_MOUNTAIN_TILES
  ];
  return highTargets.some((tiles) => pointNearLevelTwoTiles(state.frog, tiles, 1.85));
}

function pointNearLevelTwoTiles(point, tiles, padding) {
  return pointInBounds(point, levelTwoTileBounds(tiles, padding));
}

function getLevelOneFrogJump() {
  const frog = state.frog;
  const onLilyPad = isOnLevelOneLilyPadSurface(frog);
  const nearLeftApproach = distance2D(frog, LEVEL_ONE_LEFT_APPROACH) <= LEVEL_ONE_LEFT_APPROACH.radius ||
    (frog.x < LEVEL_ONE_LILY_PAD.position.x - 1.25 && Math.abs(frog.z - LEVEL_ONE_CROSSING_Z) <= 2.25);
  const nearRightApproach = distance2D(frog, LEVEL_ONE_RIGHT_APPROACH) <= LEVEL_ONE_RIGHT_APPROACH.radius ||
    distance2D(frog, LEVEL_ONE_BUTTON) <= 2.45 ||
    (frog.x > LEVEL_ONE_LILY_PAD.position.x + 1.65 && Math.abs(frog.z - LEVEL_ONE_CROSSING_Z) <= 2.35);
  const facingEast = frog.facing.x > -0.35;
  const facingWest = frog.facing.x < 0.35;

  let landing = null;
  let destinationSurface = "";
  if (onLilyPad) {
    if (frog.facing.x < -0.2) {
      landing = { x: LEVEL_ONE_LEFT_APPROACH.x, z: LEVEL_ONE_LEFT_APPROACH.z };
      destinationSurface = "left-bank";
    } else {
      landing = { x: LEVEL_ONE_LANDING.x, z: LEVEL_ONE_LANDING.z };
      destinationSurface = "right-bank";
    }
  } else if (nearLeftApproach && facingEast) {
    landing = { x: LEVEL_ONE_LILY_PAD.position.x, z: LEVEL_ONE_LILY_PAD.position.z };
    destinationSurface = LEVEL_ONE_LILY_PAD.id;
  } else if (nearRightApproach && facingWest) {
    landing = { x: LEVEL_ONE_LILY_PAD.position.x, z: LEVEL_ONE_LILY_PAD.position.z };
    destinationSurface = LEVEL_ONE_LILY_PAD.id;
  }
  if (!landing) return null;
  if (collidesAt(state.frog, landing.x, landing.z, { ignoreActor: true })) return null;
  return {
    kind: "level_one_water",
    destinationSurface,
    start: { x: state.frog.x, z: state.frog.z },
    end: landing,
    over: { x: LEVEL_ONE_LILY_PAD.position.x, z: LEVEL_ONE_LILY_PAD.position.z, topHeight: 0.18 },
    elapsed: 0,
    duration: JUMP_DURATION
  };
}

function pressButton() {
  const tutorialPressedWhileHuman = state.scene.id === SCENES.TUTORIAL && state.active === "human";
  state.buttonPressed = true;
  resetTutorialRecoveryState();
  if (state.scene.id === SCENES.LEVEL_ONE) {
    beginLevelOneBlueBloomRelease();
  } else {
    state.doorwayOpen = true;
    const door = barrierMeshes.get(DOOR_ROW);
    if (door) door.visible = false;
    advanceTutorial("press_button");
    if (tutorialPressedWhileHuman) {
      advanceTutorial("return_after_button");
      showPrompt("Button pressed. Walk through the doorway and collect the Love Letter.", 2.4);
    } else {
      showPrompt("Button pressed. A doorway opened.", 1.5);
    }
  }
  state.loveLetterAttention.buttonReactionCount += 1;
  if (state.scene.id !== SCENES.LEVEL_ONE) triggerLoveLetterAttention("button_pressed", "strong");
  if (state.scene.id === SCENES.TUTORIAL) {
    if (tutorialPressedWhileHuman) {
      queueSpeech([
        { anchor: "loveLetter", text: "Doorway's open. Come collect me!", seconds: 2.3 },
        { anchor: "", text: "", seconds: 0.7 },
        { anchor: "human", text: "Now I can walk through.", seconds: 1.9 }
      ]);
    } else {
      queueSpeech([
        { anchor: "loveLetter", text: "Come back as yourself and collect me!", seconds: 2.4 },
        { anchor: "", text: "", seconds: 0.9 },
        { anchor: "human", text: "I need that Love Letter.", seconds: 2.0 }
      ]);
    }
  }
}

function beginLevelOneBlueBloomRelease() {
  if (state.levelOne.blueBloomReleased) return;
  state.levelOne.blueBloomReleased = true;
  state.levelOne.blueBloomRevealActive = true;
  state.levelOne.blueBloomRevealElapsed = 0;
  state.levelOne.blueBloomDocked = false;
  state.levelOne.loveLetterSurfaced = false;
  state.levelOne.bridgeRevealActive = true;
  state.levelOne.bridgeRevealElapsed = 0;
  state.levelOne.bridgeComplete = false;
  state.levelOne.waterBlocked = true;
  state.levelOne.bridgeAsset = "blue-bloom-crossing-releasing";
  showPrompt("The blue blooms are drifting in!", 1.9);
  spawnRevealSparkles(particleContext, LEVEL_ONE_BLUE_BLOOM_LATCH.position.x, LEVEL_ONE_BLUE_BLOOM_LATCH.position.z, 0x70c9ff, 20);
}

function surfaceLevelOneLoveLetterWithBloom() {
  if (state.scene.id !== SCENES.LEVEL_ONE || state.spellbookCollected) return;
  state.levelOne.loveLetterSurfaced = true;
  if (state.reveals.spellbook) return;
  state.reveals.spellbook = true;
  state.loveLetterReveal = { active: true, elapsed: 0, mode: "level_one_bloom_float" };
  state.loveLetterAttention = {
    ...createLoveLetterAttentionState(),
    revealedBeforeButton: false,
    revealReason: "blue_bloom_float",
    protectSpeechUntil: state.elapsed + 1.4
  };
}

function dockLevelOneLoveLetterWithBloom() {
  if (state.scene.id !== SCENES.LEVEL_ONE || state.spellbookCollected) return;
  if (!state.reveals.spellbook) surfaceLevelOneLoveLetterWithBloom();
  state.loveLetterReveal = { active: false, elapsed: LOVE_LETTER_REVEAL_SECONDS, mode: "level_one_bloom_docked" };
  state.loveLetterAttention = {
    ...state.loveLetterAttention,
    revealReason: "blue_bloom_docked",
    protectSpeechUntil: state.elapsed + 2.4
  };
  showPrompt("The blue flowers opened a crossing.", 2.1);
  spawnRevealSparkles(particleContext, LEVEL_ONE_LOVE_LETTER_POINT.x, LEVEL_ONE_LOVE_LETTER_POINT.z, 0x70c9ff, 14);
  triggerLoveLetterAttention("blue_bloom_docked", "strong");
}

function revealLevelOneLoveLetter() {
  if (state.scene.id !== SCENES.LEVEL_ONE || state.reveals.spellbook || state.spellbookCollected) return;
  state.reveals.spellbook = true;
  state.loveLetterReveal = { active: true, elapsed: 0 };
  state.loveLetterAttention = {
    ...createLoveLetterAttentionState(),
    revealedBeforeButton: false,
    revealReason: "blue_bloom_docked",
    protectSpeechUntil: state.elapsed + 2.4
  };
  showPrompt("The blue flowers opened a crossing.", 2.1);
  spawnRevealSparkles(particleContext, LEVEL_ONE_LOVE_LETTER_POINT.x, LEVEL_ONE_LOVE_LETTER_POINT.z, 0x70c9ff, 22);
  triggerLoveLetterAttention("blue_bloom_docked", "strong");
}

function collectSpellbook() {
  state.spellbookCollected = true;
  if (state.scene.id === SCENES.TUTORIAL) state.tutorialComplete = true;
  if (state.scene.id === SCENES.LEVEL_ONE) state.levelOne.complete = true;
  if (state.scene.id === SCENES.LEVEL_TWO) state.levelTwo.complete = true;
  state.reward = { active: true, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState(currentLoveLetterId());
  state.celebration = createCelebrationState({ active: true, animationStage: "jump" });
  state.active = "human";
  state.overridePrompt = null;
  clearSpeechQueue();
  state.speech = { text: "", anchor: "human", until: 0 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  state.frogAi.timer = 0;
  state.frogAi.hop = 0.32;
  state.frogAi.currentSide = frogCurrentSide();
  state.frogAi.targetSource = "celebration_perch";
  state.frogAi.usesHumanAsTarget = false;
  state.frogAi.celebrationPerch = null;
  input.keys.clear();
  playHumanAnimation("Jump", true);
  if (state.scene.id === SCENES.TUTORIAL) advanceTutorial("collect_love_letter");
  spawnHeartParticles(particleContext, state.human.x, state.human.z, true);
}

function jumpToTutorialDebug() {
  state.scene.id = SCENES.TUTORIAL;
  resetLevel();
  showPrompt("Debug: Tutorial.", 1.2);
}

function resetLevel() {
  if (state.scene.id === SCENES.HOME) {
    resetHomeScene();
    return;
  }
  if (state.scene.id === SCENES.LEVEL_ONE) {
    resetLevelOneScene();
    return;
  }
  if (state.scene.id === SCENES.LEVEL_TWO) {
    resetLevelTwoScene();
    return;
  }
  if (state.scene.id === SCENES.LEVEL_THREE) {
    resetLevelThreeScene();
    return;
  }
  resetTutorialSceneFlow(tutorialFlowContext());
}

function resetHomeScene() {
  input.keys.clear();
  state.scene = {
    id: SCENES.HOME,
    phase: "arrival",
    titleCardVisible: false,
    titleCardText: "",
    fadeVisible: false,
    visibleAssets: []
  };
  state.home = createHomeState("arrival");
  state.levelOne = createLevelOneState("inactive");
  state.levelTwo = createLevelTwoState("inactive");
  state.levelThree = createLevelThreeState("inactive");
  state.active = "human";
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.human = createActorState({
    x: HOME_POINTS.entry.x,
    z: HOME_POINTS.entry.z,
    facing: { x: 1, z: 0, name: "east" }
  }, 0.45, 4.2);
  state.reveals = { rightFloor: false, frogEcho: false, frogTotem: false, frog: false, barrier: false, button: false, spellbook: false };
  state.buttonPressed = false;
  state.doorwayOpen = false;
  state.spellbookCollected = false;
  state.celebration = createCelebrationState();
  state.reward = { active: false, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState();
  clearParticles(particleContext);
  state.overridePrompt = null;
  clearSpeechQueue();
  state.speech = { text: "", anchor: "human", until: 0 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  playHumanAnimation("Idle");
  syncAll();
  updateCamera(1);
  updateHud();
}

function resetLevelOneScene() {
  resetLevelOneSceneFlow(levelOneFlowContext());
}

function resetLevelTwoScene() {
  resetLevelTwoSceneFlow(levelTwoFlowContext());
}

function resetLevelThreeScene() {
  resetLevelThreeSceneFlow(levelThreeFlowContext());
}

function moveActor(actor, dx, dz) {
  const before = { x: actor.x, z: actor.z };
  const nextX = actor.x + dx;
  if (!collidesAt(actor, nextX, actor.z)) actor.x = nextX;
  const nextZ = actor.z + dz;
  if (!collidesAt(actor, actor.x, nextZ)) actor.z = nextZ;
  if (state.scene.id === SCENES.LEVEL_TWO) updateLevelTwoSurfaceState();
  return Math.hypot(actor.x - before.x, actor.z - before.z);
}

function collidesAt(actor, x, z, options = {}) {
  const bounds = activeWorldBounds();
  if (x < bounds.minX + actor.radius || x > bounds.maxX - actor.radius) return true;
  if (z < bounds.minZ + actor.radius || z > bounds.maxZ - actor.radius) return true;
  if (levelTwoRaisedSurfaceBlocksTransition(actor, x, z)) return true;
  if (!options.ignoreActor) {
    for (const otherActor of activeActorCollisionCandidates(actor)) {
      if (!actorsShareBlockingHeight(actor, otherActor, { x, z, radius: actor.radius })) continue;
      if (distance2D({ x, z }, otherActor) >= actor.radius + otherActor.radius + ACTOR_BLOCK_PADDING) continue;
      state.actorCollisionBlocked = true;
      return true;
    }
  }
  if (actor === state.frog && loveLetterBlocksFrogAt(x, z)) {
    if (state.active === "frog") registerFrogLoveLetterBlock();
    return true;
  }
  if (sceneColliderBlocks(actor, x, z)) return true;
  return activeBarrierColliders().some((barrier) => circleIntersectsAabb(x, z, actor.radius, barrier));
}

function activeActorCollisionCandidates(actor) {
  const candidates = [];
  if (actor !== state.human) candidates.push(state.human);
  if (actor !== state.frog && state.scene.id !== SCENES.HOME && state.reveals.frog) candidates.push(state.frog);
  if (actor !== state.elephant && canUseElephantCubeling()) candidates.push(state.elephant);
  if (actor !== state.crocodile && canUseCrocodileCubeling()) candidates.push(state.crocodile);
  return candidates;
}

function actorsShareBlockingHeight(a, b, targetPoint = a) {
  if (state.scene.id !== SCENES.LEVEL_TWO) return true;
  return Math.abs(levelTwoActorLiftAt(a, targetPoint) - levelTwoActorLiftAt(b)) < 1.05;
}

function sceneColliderBlocks(actor, x, z) {
  if (state.scene.id === SCENES.HOME) {
    return sceneObjectColliders
      .filter((collider) => collider.scene === SCENES.HOME)
      .some((collider) => circleIntersectsAabb(x, z, actor.radius, collider));
  }
  if (state.scene.id === SCENES.LEVEL_ONE) {
    if (sceneObjectColliders
      .filter((collider) => collider.scene === SCENES.LEVEL_ONE)
      .some((collider) => circleIntersectsAabb(x, z, actor.radius, collider))) {
      return true;
    }
    for (const water of levelOneWaterColliders) {
      if (levelOneBridgeWalkableAt(actor, x, z)) continue;
      if (!circleIntersectsAabb(x, z, actor.radius, water)) continue;
      if (actor === state.frog) registerFrogWaterBlock();
      return true;
    }
    return false;
  }
  if (state.scene.id === SCENES.LEVEL_TWO) {
    for (const collider of sceneObjectColliders.filter((item) => item.scene === SCENES.LEVEL_TWO)) {
      if (!circleIntersectsAabb(x, z, actor.radius, collider)) continue;
      if (levelTwoWalkableSurfaceAllows(actor, x, z, collider)) continue;
      return true;
    }
    return false;
  }
  if (state.scene.id === SCENES.LEVEL_THREE) {
    for (const collider of sceneObjectColliders.filter((item) => item.scene === SCENES.LEVEL_THREE)) {
      if (!circleIntersectsAabb(x, z, actor.radius, collider)) continue;
      if (levelThreeWalkableSurfaceAllows(actor, x, z, collider)) continue;
      if (
        actor === state.frog &&
        state.active === "frog" &&
        collider.levelThreeWater
      ) {
        registerLevelThreeFrogWaterBlock();
        return true;
      }
      if (
        actor === state.human &&
        state.active === "human" &&
        collider.levelThreeWater
      ) {
        registerLevelThreeHumanWaterBlock();
        return true;
      }
      return true;
    }
    return false;
  }
  return false;
}

function levelThreeWalkableSurfaceAllows(actor, x, z, collider) {
  if (!collider.levelThreeWater) return false;
  if (actor === state.crocodile && canUseCrocodileCubeling()) return true;
  return actor === state.frog && levelThreeFrogLilyPadWalkableAt({ x, z }, actor.radius);
}

function levelTwoWalkableSurfaceAllows(actor, x, z, collider) {
  if (
    (actor === state.human || actor === state.frog) &&
    collider.label.startsWith("level-two-red-elevator-a-top-connector") &&
    levelTwoRedElevatorAGroundClearanceSafeAt({ x, z }, actor.radius)
  ) {
    return true;
  }
  if (actor === state.frog) {
    const ledge = levelTwoLedgeForCollider(collider);
    return Boolean(
      ledge &&
      state.levelTwo.frogSurfaceId === ledge.id &&
      pointInLevelTwoTiles({ x, z }, ledge.tiles, actor.radius + 0.28)
    );
  }
  if (actor === state.human && state.levelTwo.blueRampActive && collider.label.startsWith("level-two-elephant-totem-hill")) {
    return levelTwoTotemHillWalkableAt({ x, z }, actor.radius);
  }
  if (actor === state.human && collider.label.startsWith("level-two-human-love-letter-route")) {
    const currentPlatform = LEVEL_TWO_RED_PLATFORMS.find((platform) => platform.id === state.levelTwo.humanSurfaceId);
    return levelTwoHumanLoveLetterRouteSafeAt({ x, z }, actor.radius) ||
      Boolean(currentPlatform && levelTwoRedPlatformIsTopAligned(currentPlatform));
  }
  if (
    actor === state.human &&
    collider.label.startsWith("level-two-central-mountain") &&
    Number.isFinite(collider.levelTwoTier)
  ) {
    return levelTwoHumanElevatorARouteSafeAt({ x, z }, actor.radius) ||
      levelTwoHumanLoveLetterRouteSafeAt({ x, z }, actor.radius);
  }
  if (
    actor === state.human &&
    (
      collider.label.startsWith("level-two-red-elevator-a-top-connector") ||
      collider.label.startsWith("level-two-reserved-red-elevator-a-top-connector")
    )
  ) {
    return levelTwoHumanElevatorARouteSafeAt({ x, z }, actor.radius);
  }
  if (actor === state.elephant && collider.label.startsWith("level-two-central-mountain")) {
    return levelTwoElephantCanUseMountainCollider({ x, z }, collider);
  }
  if (
    actor === state.elephant &&
    (
      collider.label.startsWith("level-two-red-elevator-a-top-connector") ||
      collider.label.startsWith("level-two-reserved-red-elevator-a-top-connector")
    )
  ) {
    return levelTwoElephantHasTopRouteAccess() &&
      levelTwoElephantEchoTerraceSafeAt({ x, z }, actor.radius);
  }
  return false;
}

function levelTwoElephantHasTopRouteAccess() {
  if (state.levelTwo.elephantSurfaceId === "tier-3-elephant-route") return true;
  if (state.levelTwo.elephantSurfaceId !== "red-elevator-a") return false;
  return levelTwoRedPlatformProgressById("red-elevator-a") >= 0.92;
}

function levelTwoElephantCanUseMountainCollider(point, collider) {
  if (!levelTwoElephantHasTopRouteAccess()) return false;
  if (!levelTwoElephantEchoTerraceSafeAt(point, state.elephant.radius)) return false;
  if (Number.isFinite(collider.levelTwoTier) && collider.levelTwoTier > LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TIER) return false;
  return true;
}

function levelTwoLedgeForCollider(collider) {
  if (collider.label.startsWith("level-two-frog-side-ledge")) {
    return LEVEL_TWO_FROG_JUMPABLE_LEDGES.find((ledge) => ledge.id === "practice-ledge");
  }
  if (collider.label.startsWith("level-two-blue-button-ledge")) {
    return LEVEL_TWO_FROG_JUMPABLE_LEDGES.find((ledge) => ledge.id === "blue-button-ledge");
  }
  return null;
}

function levelTwoTileBounds(tiles, padding = 0) {
  const half = FLOOR_TARGET * 0.5 + padding;
  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity
  };
  tiles.forEach((tile) => {
    const point = sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE);
    bounds.minX = Math.min(bounds.minX, point.x - half);
    bounds.maxX = Math.max(bounds.maxX, point.x + half);
    bounds.minZ = Math.min(bounds.minZ, point.z - half);
    bounds.maxZ = Math.max(bounds.maxZ, point.z + half);
  });
  return bounds;
}

function pointInLevelTwoTiles(point, tiles, padding = 0) {
  return pointInBounds(point, levelTwoTileBounds(tiles, padding));
}

function levelThreeFrogLilyPadWalkableAt(point, actorRadius = 0) {
  return LEVEL_THREE_LILY_PAD_PLACEHOLDERS.some((pad) =>
    distance2D(point, pad.position) <= pad.radius + Math.min(actorRadius, 0.35) + LEVEL_THREE_FROG_LILY_PAD_SURFACE_PADDING
  );
}

function levelThreeActorIntersectsWater(actor) {
  return sceneObjectColliders
    .filter((item) => item.scene === SCENES.LEVEL_THREE && item.levelThreeWater)
    .some((collider) => circleIntersectsAabb(actor.x, actor.z, actor.radius, collider));
}

function registerLevelThreeFrogWaterBlock() {
  if (state.scene.id !== SCENES.LEVEL_THREE || state.active !== "frog") return;
  if (state.elapsed - state.levelThree.lastFrogWaterBlockAt < LEVEL_THREE_FROG_WATER_BLOCK_COOLDOWN) return;
  state.levelThree.lastFrogWaterBlockAt = state.elapsed;
  state.levelThree.frogWaterBlockedCount += 1;
  showPrompt("I need to hop to the leaf.", 1.6);
  showSpeech("frog", "I need to hop to the leaf.", 1.5);
}

function registerLevelThreeHumanWaterBlock() {
  if (state.scene.id !== SCENES.LEVEL_THREE || state.active !== "human") return;
  if (state.elapsed - state.loveLetterLesson.lastHumanPromptAt < LOVE_LETTER_LESSON_COOLDOWN) return;
  state.loveLetterLesson.lastHumanPromptAt = state.elapsed;
  showPrompt("That water is too deep for me.", 1.6);
  showSpeech("human", "That water is too deep for me.", 1.5);
}

function resetLevelThreeFrogLane() {
  if (state.scene.id !== SCENES.LEVEL_THREE) return;
  if (state.elapsed - state.levelThree.lastFrogLaneResetAt < LEVEL_THREE_FROG_LANE_RESET_COOLDOWN) return;
  state.levelThree.lastFrogLaneResetAt = state.elapsed;
  state.levelThree.frogLaneResetCount += 1;
  state.levelThree.frogLaneSurfaceId = null;
  state.frog.x = LEVEL_THREE_FROG_LANE_RESET_POINT.x;
  state.frog.z = LEVEL_THREE_FROG_LANE_RESET_POINT.z;
  state.frog.facing = { ...LEVEL_THREE_FROG_LANE_RESET_POINT.facing };
  state.frogJump = null;
  state.frogMoveHop = 0;
  state.frogAi.timer = 0;
  state.frogAi.target = { x: state.frog.x, z: state.frog.z };
  state.frogAi.currentSide = frogCurrentSide();
  showPrompt("Splash. Frog pops back to the lane start.", 1.8);
  showSpeech("frog", "Back to the start leaf.", 1.5);
  spawnRevealSparkles(particleContext, state.frog.x, state.frog.z, 0xaee8ff, 10);
}

function currentLevelThreeTotemRaftPosition() {
  if (state.levelThree?.totemRaftDrifting) {
    const fromMarker = LEVEL_THREE_RAFT_MARKERS[clamp(
      Math.round(state.levelThree.totemRaftFromState ?? state.levelThree.totemRaftState ?? 0),
      0,
      LEVEL_THREE_RAFT_MARKERS.length - 1
    )] || LEVEL_THREE_RAFT_MARKERS[0];
    const targetMarker = LEVEL_THREE_RAFT_MARKERS[clamp(
      Math.round(state.levelThree.totemRaftTargetState ?? state.levelThree.totemRaftState ?? 0),
      0,
      LEVEL_THREE_RAFT_MARKERS.length - 1
    )] || fromMarker;
    const progress = easeInOutSmooth(state.levelThree.totemRaftDriftProgress || 0);
    return {
      x: fromMarker.position.x + (targetMarker.position.x - fromMarker.position.x) * progress,
      z: fromMarker.position.z + (targetMarker.position.z - fromMarker.position.z) * progress
    };
  }
  const marker = LEVEL_THREE_RAFT_MARKERS[clamp(
    Math.round(state.levelThree?.totemRaftState ?? 0),
    0,
    LEVEL_THREE_RAFT_MARKERS.length - 1
  )] || LEVEL_THREE_RAFT_MARKERS[0];
  return marker.position;
}

function levelThreeTileIsWater(tile) {
  return Boolean(tile && LEVEL_THREE_WATER_TILES.some((candidate) =>
    candidate.x === tile.x && candidate.y === tile.y
  ));
}

function levelThreeTileWorldPoint(tile) {
  return sceneGridPoint(LEVEL_THREE_WIDTH, LEVEL_THREE_HEIGHT, tile.x, tile.y, TILE);
}

function levelThreeDistanceFromNearestLandTile(point, radius = 0) {
  return Math.min(...LEVEL_THREE_LAND_TILES.map((tile) => {
    const tilePoint = levelThreeTileWorldPoint(tile);
    return distance2D(point, tilePoint) - radius - TILE * 0.5;
  }));
}

function levelThreePointInsideLandTile(point) {
  const half = TILE * 0.5 - 0.04;
  return LEVEL_THREE_LAND_TILES.some((tile) => {
    const tilePoint = levelThreeTileWorldPoint(tile);
    return point.x >= tilePoint.x - half &&
      point.x <= tilePoint.x + half &&
      point.z >= tilePoint.z - half &&
      point.z <= tilePoint.z + half;
  });
}

function levelThreeSegmentLandHits(from, to, steps = 30) {
  const hits = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const point = {
      x: from.x + (to.x - from.x) * t,
      z: from.z + (to.z - from.z) * t
    };
    if (!levelThreePointInsideLandTile(point)) continue;
    hits.push({
      x: Number(point.x.toFixed(2)),
      z: Number(point.z.toFixed(2)),
      t: Number(t.toFixed(2))
    });
  }
  return hits;
}

function levelThreeRaftPathContract() {
  const segments = LEVEL_THREE_RAFT_MARKERS.slice(0, -1).map((marker, index) => {
    const next = LEVEL_THREE_RAFT_MARKERS[index + 1];
    const landHits = levelThreeSegmentLandHits(marker.position, next.position);
    return {
      fromId: marker.id,
      toId: next.id,
      fromState: marker.stateIndex,
      toState: next.stateIndex,
      landHitCount: landHits.length,
      landHits
    };
  });
  return {
    avoidsLand: segments.every((segment) => segment.landHitCount === 0),
    dockMarkerFixed: true,
    dockMarkerInsideLand: levelThreePointInsideLandTile(LEVEL_THREE_RAFT_MARKERS[LEVEL_THREE_RAFT_MARKERS.length - 1].position),
    dockMarkerShoreClearance: Number(levelThreeDistanceFromNearestLandTile(LEVEL_THREE_RAFT_MARKERS[LEVEL_THREE_RAFT_MARKERS.length - 1].position).toFixed(2)),
    segments
  };
}

function levelThreePadEdgeGap(a, b) {
  return distance2D(a.position, b.position) - (a.radius || 0) - (b.radius || 0);
}

function levelThreeLilyPadSpatialContract() {
  const padEdgeGaps = [];
  for (let index = 0; index < LEVEL_THREE_LILY_PAD_PLACEHOLDERS.length - 1; index += 1) {
    const from = LEVEL_THREE_LILY_PAD_PLACEHOLDERS[index];
    const to = LEVEL_THREE_LILY_PAD_PLACEHOLDERS[index + 1];
    padEdgeGaps.push({
      fromId: from.id,
      toId: to.id,
      edgeGap: Number(levelThreePadEdgeGap(from, to).toFixed(2))
    });
  }
  const finalPad = LEVEL_THREE_LILY_PAD_PLACEHOLDERS[LEVEL_THREE_LILY_PAD_PLACEHOLDERS.length - 1];
  const finalJump = LEVEL_THREE_FROG_LANE_JUMPS.find((jump) => jump.toId === "level3TotemWinchIsland");
  const pad3ToTotemWinchIslandGap = finalPad && finalJump
    ? distance2D(finalPad.position, finalJump.to) - (finalPad.radius || 0) - TILE * 0.5
    : 0;
  const trackEndpointChecks = LEVEL_THREE_LILY_PAD_PLACEHOLDERS.map((pad) => ({
    id: pad.id,
    startTileIsWater: levelThreeTileIsWater(pad.trackStartTile),
    endTileIsWater: levelThreeTileIsWater(pad.trackEndTile),
    startLandClearance: Number(levelThreeDistanceFromNearestLandTile(pad.trackStart, pad.radius || 0).toFixed(2)),
    endLandClearance: Number(levelThreeDistanceFromNearestLandTile(pad.trackEnd, pad.radius || 0).toFixed(2))
  }));
  const nearestPadEdgeGap = Math.min(...padEdgeGaps.map((gap) => gap.edgeGap));
  return {
    minPadEdgeGap: LEVEL_THREE_LILY_PAD_MIN_EDGE_GAP,
    minPadToIslandGap: LEVEL_THREE_LILY_PAD_MIN_ISLAND_GAP,
    padEdgeGaps,
    nearestPadEdgeGap: Number(nearestPadEdgeGap.toFixed(2)),
    pad3ToTotemWinchIslandGap: Number(pad3ToTotemWinchIslandGap.toFixed(2)),
    allCentersOnWater: LEVEL_THREE_LILY_PAD_PLACEHOLDERS.every((pad) => levelThreeTileIsWater(pad.tile)),
    allTrackEndpointsOnWater: trackEndpointChecks.every((check) => check.startTileIsWater && check.endTileIsWater),
    trackEndpointChecks,
    futureMotionCorridorsReserved: nearestPadEdgeGap >= LEVEL_THREE_LILY_PAD_MIN_EDGE_GAP &&
      pad3ToTotemWinchIslandGap >= LEVEL_THREE_LILY_PAD_MIN_ISLAND_GAP &&
      trackEndpointChecks.every((check) => check.startTileIsWater && check.endTileIsWater)
  };
}

function pointInLevelTwoRamp(point) {
  if (!state.levelTwo.blueRampActive) return false;
  return point.x >= LEVEL_TWO_BLUE_RAMP.minX &&
    point.x <= LEVEL_TWO_BLUE_RAMP.maxX &&
    point.z >= LEVEL_TWO_BLUE_RAMP.minZ &&
    point.z <= LEVEL_TWO_BLUE_RAMP.maxZ;
}

function levelTwoRedPlatformAt(point) {
  if (state.scene.id !== SCENES.LEVEL_TWO) return null;
  return LEVEL_TWO_RED_PLATFORMS.find((platform) =>
    point.x >= platform.minX &&
    point.x <= platform.maxX &&
    point.z >= platform.minZ &&
    point.z <= platform.maxZ
  ) || null;
}

function levelTwoActorSurfaceId(actor) {
  if (actor === state.human) return state.levelTwo.humanSurfaceId;
  if (actor === state.frog) return state.levelTwo.frogSurfaceId;
  if (actor === state.elephant) return state.levelTwo.elephantSurfaceId;
  return null;
}

function levelTwoRedPlatformProgressById(id) {
  const platform = LEVEL_TWO_RED_PLATFORMS.find((candidate) => candidate.id === id);
  if (!platform) return 0;
  const platformState = state.levelTwo.redPlatforms?.[platform.id];
  if (Number.isFinite(platformState?.progress)) return platformState.progress;
  return platform.initialProgress ?? 0;
}

function levelTwoRedPlatformLiftById(id) {
  const platform = LEVEL_TWO_RED_PLATFORMS.find((candidate) => candidate.id === id);
  if (!platform) return 0;
  const platformState = state.levelTwo.redPlatforms?.[platform.id];
  if (Number.isFinite(platformState?.lift)) return platformState.lift;
  return (platform.initialProgress ?? 0) * platform.maxLift;
}

function levelTwoRedButtonSurfaceY(button) {
  if (!button) return SURFACE_Y;
  if (!button.platformId && Number.isFinite(button.surfaceTopY)) return button.surfaceTopY;
  const platform = LEVEL_TWO_RED_PLATFORMS.find((candidate) =>
    candidate.id === (button?.platformId || button?.linkedPlatformId)
  );
  return SURFACE_Y + levelTwoRedPlatformLiftById(platform?.id) + (platform?.surfaceOffset || 0);
}

function levelTwoActorCanRideRedPlatform(actor, platform) {
  if (!platform) return false;
  if (platform.walkableBy === "all") return true;
  if (platform.walkableBy === "elephant") return actor === state.elephant;
  if (Array.isArray(platform.walkableBy)) {
    const actorKey = actor === state.elephant ? "elephant" : actor === state.frog ? "frog" : "human";
    return platform.walkableBy.includes(actorKey);
  }
  return false;
}

function levelTwoActorIsOnRedPlatformSurface(actor, platform) {
  return Boolean(platform && levelTwoActorSurfaceId(actor) === platform.id);
}

function levelTwoRedPlatformIsGroundAligned(platform) {
  return levelTwoRedPlatformProgressById(platform.id) <= 0.06;
}

function levelTwoRedPlatformIsTopAligned(platform) {
  return levelTwoRedPlatformProgressById(platform.id) >= 0.92;
}

function levelTwoRedPlatformCanAttachActor(actor, platform) {
  if (!levelTwoActorCanRideRedPlatform(actor, platform)) return false;
  if (levelTwoActorIsOnRedPlatformSurface(actor, platform)) return true;
  if (levelTwoRedPlatformIsGroundAligned(platform)) return true;
  if (
    actor === state.human &&
    platform.id === "red-elevator-a" &&
    state.levelTwo.humanSurfaceId === "tier-3-elephant-route" &&
    levelTwoRedPlatformIsTopAligned(platform)
  ) {
    return true;
  }
  if (
    actor === state.human &&
    state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID &&
    levelTwoRedPlatformIsTopAligned(platform)
  ) {
    return true;
  }
  return actor === state.elephant &&
    state.levelTwo.elephantSurfaceId === "tier-3-elephant-route" &&
    levelTwoRedPlatformIsTopAligned(platform);
}

function levelTwoRedPlatformLiftAt(point, actor = null) {
  const platform = levelTwoRedPlatformAt(point);
  if (!platform) return 0;
  if (actor && !levelTwoActorCanRideRedPlatform(actor, platform)) return 0;
  if (actor && !levelTwoActorIsOnRedPlatformSurface(actor, platform)) return 0;
  return (state.levelTwo.redPlatforms?.[platform.id]?.lift || 0) + (platform.surfaceOffset || 0);
}

function levelTwoRampProgressAt(point) {
  if (!pointInLevelTwoRamp(point)) return 0;
  return clamp((point.x - LEVEL_TWO_BLUE_RAMP.minX) / Math.max(0.001, LEVEL_TWO_BLUE_RAMP.maxX - LEVEL_TWO_BLUE_RAMP.minX), 0, 1);
}

function levelTwoRampLiftAt(point, includeActorClearance = false) {
  const progress = levelTwoRampProgressAt(point);
  const clearance = includeActorClearance ? (LEVEL_TWO_BLUE_RAMP.actorLiftClearance || 0) * progress : 0;
  return progress * LEVEL_TWO_BLUE_RAMP.targetLift + clearance;
}

function levelTwoHumanHillSafeAt(point, actorRadius = 0) {
  const safePadding = -Math.max(0, actorRadius * 0.55);
  return pointInLevelTwoTiles(point, LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES, safePadding);
}

function levelTwoElephantEchoTerraceSafeAt(point, actorRadius = 0) {
  const safePadding = -Math.max(0, actorRadius * 0.45);
  return pointInLevelTwoTiles(point, LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TILES, safePadding) ||
    levelTwoRedElevatorTopExitSafeAt(point, actorRadius);
}

function levelTwoHumanElevatorARouteAccessible() {
  if (state.levelTwo.humanSurfaceId === "tier-3-elephant-route") return true;
  if (state.levelTwo.humanSurfaceId !== "red-elevator-a") return false;
  return levelTwoRedPlatformProgressById("red-elevator-a") >= 0.92;
}

function levelTwoHumanElevatorARouteSafeAt(point, actorRadius = 0) {
  if (!levelTwoHumanElevatorARouteAccessible()) return false;
  return levelTwoElephantEchoTerraceSafeAt(point, actorRadius);
}

function levelTwoHumanLoveLetterRouteAccessible() {
  if (state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID) return true;
  return levelTwoRedPlatformProgressById("red-elevator-b") >= 0.92;
}

function levelTwoHumanLoveLetterRouteSafeAt(point, actorRadius = 0) {
  if (!levelTwoHumanLoveLetterRouteAccessible()) return false;
  const routePadding = Math.max(0.04, actorRadius * 0.08);
  const plateauPadding = Math.max(0.04, actorRadius * 0.08);
  const loveLetterPlateau = LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.find((tier) => tier.id === "tier-4-love-letter-plateau");
  return pointInLevelTwoTiles(point, LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES, routePadding) ||
    Boolean(loveLetterPlateau && pointInLevelTwoTiles(point, loveLetterPlateau.tiles, plateauPadding));
}

function levelTwoLoveLetterReachableByHuman() {
  if (state.scene.id !== SCENES.LEVEL_TWO || state.spellbookCollected) return false;
  return state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID ||
    levelTwoHumanLoveLetterRouteSafeAt(state.human, state.human.radius + 0.08);
}

function levelTwoRedElevatorTopExitSafeAt(point, actorRadius = 0) {
  if (levelTwoRedPlatformProgressById("red-elevator-a") < 0.92) return false;
  const padding = Math.max(0, actorRadius * 0.2);
  return point.x >= LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minX - padding &&
    point.x <= LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxX + padding &&
    point.z >= LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minZ - padding &&
    point.z <= LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxZ + padding;
}

function levelTwoRedElevatorSideApproachSafeAt(point, actorRadius = 0) {
  const padding = Math.max(0, actorRadius * 0.25);
  return point.x >= LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minX - padding &&
    point.x <= LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxX + padding &&
    point.z >= LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minZ - padding &&
    point.z <= LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxZ + padding;
}

function levelTwoRaisedSurfaceBlocksTransition(actor, x, z) {
  if (state.scene.id !== SCENES.LEVEL_TWO) return false;
  const redPlatformTransition = levelTwoRedPlatformBlocksTransition(actor, { x, z });
  if (redPlatformTransition !== null) return redPlatformTransition;
  if (actor === state.elephant && state.levelTwo.elephantSpawned) {
    const target = { x, z };
    return state.levelTwo.elephantSurfaceId === "tier-3-elephant-route" &&
      !levelTwoElephantEchoTerraceSafeAt(target, actor.radius);
  }
  if (actor === state.human && state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID) {
    const target = { x, z };
    const targetPlatform = levelTwoRedPlatformAt(target);
    if (levelTwoHumanLoveLetterRouteSafeAt(target, actor.radius)) return false;
    if (targetPlatform && levelTwoRedPlatformIsTopAligned(targetPlatform)) return false;
    return true;
  }
  if (actor === state.human && state.levelTwo.humanSurfaceId === "tier-3-elephant-route") {
    const target = { x, z };
    const targetPlatform = levelTwoRedPlatformAt(target);
    if (levelTwoHumanElevatorARouteSafeAt(target, actor.radius)) return false;
    if (targetPlatform?.id === "red-elevator-a" && levelTwoRedPlatformIsTopAligned(targetPlatform)) return false;
    return true;
  }
  if (actor !== state.human || !state.levelTwo.blueRampActive) return false;
  const target = { x, z };
  const currentSurface = state.levelTwo.humanSurfaceId;
  if (currentSurface === "elephant-totem-hill") {
    return !levelTwoHumanHillSafeAt(target, actor.radius) && !pointInLevelTwoRamp(target);
  }
  if (currentSurface === LEVEL_TWO_BLUE_RAMP.id) {
    if (pointInLevelTwoRamp(target) || levelTwoHumanHillSafeAt(target, actor.radius)) return false;
    return levelTwoRampProgressAt(actor) > (LEVEL_TWO_BLUE_RAMP.groundExitProgress || 0.18);
  }
  return false;
}

function levelTwoRedPlatformBlocksTransition(actor, target) {
  if (!state.levelTwo?.redPlatforms) return null;
  const targetPlatform = levelTwoRedPlatformAt(target);
  const currentPlatform = LEVEL_TWO_RED_PLATFORMS.find((platform) =>
    platform.id === levelTwoActorSurfaceId(actor) &&
    levelTwoActorCanRideRedPlatform(actor, platform)
  );

  if (currentPlatform) {
    if (targetPlatform?.id === currentPlatform.id) return false;
    if (levelTwoRedPlatformIsGroundAligned(currentPlatform)) return false;
    if (
      actor === state.elephant &&
      levelTwoRedPlatformIsTopAligned(currentPlatform) &&
      levelTwoElephantEchoTerraceSafeAt(target, actor.radius)
    ) {
      return false;
    }
    if (
      actor === state.human &&
      levelTwoRedPlatformIsTopAligned(currentPlatform) &&
      (
        levelTwoHumanElevatorARouteSafeAt(target, actor.radius) ||
        levelTwoHumanLoveLetterRouteSafeAt(target, actor.radius)
      )
    ) {
      return false;
    }
    return true;
  }

  if (!targetPlatform || !levelTwoActorCanRideRedPlatform(actor, targetPlatform)) return null;
  if (levelTwoRedElevatorAGroundClearanceSafeAt(target, actor.radius)) return false;
  if (levelTwoRedPlatformIsGroundAligned(targetPlatform)) return false;
  if (
    actor === state.elephant &&
    state.levelTwo.elephantSurfaceId === "tier-3-elephant-route" &&
    levelTwoRedPlatformIsTopAligned(targetPlatform)
  ) {
    return false;
  }
  if (
    actor === state.human &&
    state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID &&
    levelTwoRedPlatformIsTopAligned(targetPlatform)
  ) {
    return false;
  }
  if (
    actor === state.human &&
    state.levelTwo.humanSurfaceId === "tier-3-elephant-route" &&
    targetPlatform.id === "red-elevator-a" &&
    levelTwoRedPlatformIsTopAligned(targetPlatform)
  ) {
    return false;
  }
  return false;
}

function levelTwoRedElevatorAGroundClearanceSafeAt(point, actorRadius = 0) {
  return pointInLevelTwoTiles(
    point,
    LEVEL_TWO_RED_ELEVATOR_A_GROUND_CLEARANCE_TILES,
    Math.max(0.02, actorRadius * 0.05)
  );
}

function levelTwoTotemHillWalkableAt(point, actorRadius = 0) {
  if (!state.levelTwo.blueRampActive) return false;
  if (!pointInLevelTwoTiles(point, LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES, actorRadius + 0.18)) return false;
  if (levelTwoHumanHillSafeAt(point, actorRadius) || pointInLevelTwoRamp(point)) return true;
  const hillBounds = levelTwoTileBounds(LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES, -actorRadius * 0.35);
  const rampLaneZ = point.z >= LEVEL_TWO_BLUE_RAMP.minZ - actorRadius * 0.35 &&
    point.z <= LEVEL_TWO_BLUE_RAMP.maxZ + actorRadius * 0.35;
  const westernDock = point.x <= hillBounds.minX + actorRadius + 0.7;
  return rampLaneZ && westernDock;
}

function levelTwoActorLiftAt(actor, point = actor) {
  if (state.scene.id !== SCENES.LEVEL_TWO) return 0;
  const redPlatformLift = levelTwoRedPlatformLiftAt(point, actor);
  if (actor === state.frog && state.levelTwo.frogSurfaceId) {
    const ledge = LEVEL_TWO_FROG_JUMPABLE_LEDGES.find((item) => item.id === state.levelTwo.frogSurfaceId);
    if (ledge && pointInLevelTwoTiles(point, ledge.tiles, 0.08)) return Math.max(ledge.heightAboveGround, redPlatformLift);
  }
  if (actor === state.human && state.levelTwo.blueRampActive) {
    if (pointInLevelTwoRamp(point)) {
      return Math.max(
        redPlatformLift,
        levelTwoRampLiftAt(point, true),
        levelTwoHumanHillSafeAt(point, actor.radius)
          ? LEVEL_TWO_ELEPHANT_TOTEM_HILL.heightAboveGround
          : 0
      );
    }
    if (levelTwoHumanHillSafeAt(point, actor.radius)) return Math.max(LEVEL_TWO_ELEPHANT_TOTEM_HILL.heightAboveGround, redPlatformLift);
  }
  if (actor === state.human && levelTwoHumanElevatorARouteSafeAt(point, actor.radius + 0.04)) {
    return Math.max(LEVEL_TWO_ELEPHANT_ECHO_HEIGHT, redPlatformLift);
  }
  if (actor === state.human && levelTwoHumanLoveLetterRouteSafeAt(point, actor.radius + 0.04)) {
    return Math.max(LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT, redPlatformLift);
  }
  if (actor === state.elephant && state.levelTwo.elephantSpawned) {
    if (levelTwoElephantHasTopRouteAccess() && levelTwoElephantEchoTerraceSafeAt(point, actor.radius + 0.04)) {
      return Math.max(LEVEL_TWO_ELEPHANT_ECHO_HEIGHT, redPlatformLift);
    }
  }
  return redPlatformLift;
}

function updateLevelTwoSurfaceState() {
  if (state.scene.id !== SCENES.LEVEL_TWO) return;
  if (state.levelTwo.frogSurfaceId) {
    const ledge = LEVEL_TWO_FROG_JUMPABLE_LEDGES.find((item) => item.id === state.levelTwo.frogSurfaceId);
    if (!ledge || !pointInLevelTwoTiles(state.frog, ledge.tiles, state.frog.radius + 0.32)) {
      state.levelTwo.frogSurfaceId = null;
    }
  }
  const humanRedPlatform = levelTwoRedPlatformAt(state.human);
  const humanOnLoveLetterRoute = levelTwoHumanLoveLetterRouteSafeAt(state.human, state.human.radius + 0.06);
  const humanOnElevatorATopRoute = levelTwoHumanElevatorARouteSafeAt(state.human, state.human.radius + 0.06);
  if (
    humanOnLoveLetterRoute &&
    (
      state.levelTwo.humanSurfaceId === LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID ||
      (state.levelTwo.humanSurfaceId === "red-elevator-b" && levelTwoRedPlatformProgressById("red-elevator-b") >= 0.92)
    )
  ) {
    state.levelTwo.humanSurfaceId = LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID;
  } else if (
    humanOnElevatorATopRoute &&
    (
      state.levelTwo.humanSurfaceId === "tier-3-elephant-route" ||
      (state.levelTwo.humanSurfaceId === "red-elevator-a" && levelTwoRedPlatformProgressById("red-elevator-a") >= 0.92)
    )
  ) {
    state.levelTwo.humanSurfaceId = "tier-3-elephant-route";
  } else if (humanRedPlatform && levelTwoRedPlatformCanAttachActor(state.human, humanRedPlatform)) {
    state.levelTwo.humanSurfaceId = humanRedPlatform.id;
  } else if (humanOnElevatorATopRoute) {
    state.levelTwo.humanSurfaceId = "tier-3-elephant-route";
  } else if (humanOnLoveLetterRoute) {
    state.levelTwo.humanSurfaceId = LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID;
  } else if (state.levelTwo.blueRampActive) {
    if (levelTwoHumanHillSafeAt(state.human, state.human.radius)) {
      state.levelTwo.humanSurfaceId = "elephant-totem-hill";
    } else if (pointInLevelTwoRamp(state.human)) {
      state.levelTwo.humanSurfaceId = LEVEL_TWO_BLUE_RAMP.id;
    } else if (
      state.levelTwo.humanSurfaceId === "elephant-totem-hill" &&
      pointInLevelTwoTiles(state.human, LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES, state.human.radius + 0.18)
    ) {
      const safeBounds = levelTwoTileBounds(LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES, -state.human.radius * 0.55);
      state.human.x = clamp(state.human.x, safeBounds.minX, safeBounds.maxX);
      state.human.z = clamp(state.human.z, safeBounds.minZ, safeBounds.maxZ);
      state.levelTwo.humanSurfaceId = "elephant-totem-hill";
    } else {
      state.levelTwo.humanSurfaceId = null;
    }
  } else {
    state.levelTwo.humanSurfaceId = null;
  }
  if (state.levelTwo.elephantSpawned) {
    const previousElephantSurfaceId = state.levelTwo.elephantSurfaceId;
    const redPlatform = levelTwoRedPlatformAt(state.elephant);
    const exitingElevatorATop = redPlatform?.id === "red-elevator-a" &&
      previousElephantSurfaceId === "red-elevator-a" &&
      levelTwoRedPlatformIsTopAligned(redPlatform) &&
      state.elephant.x <= redPlatform.minX + state.elephant.radius + 0.24 &&
      levelTwoRedElevatorTopExitSafeAt(state.elephant, state.elephant.radius + 0.08);
    if (exitingElevatorATop) {
      state.levelTwo.elephantSurfaceId = "tier-3-elephant-route";
    } else if (redPlatform && levelTwoRedPlatformCanAttachActor(state.elephant, redPlatform)) {
      state.levelTwo.elephantSurfaceId = redPlatform.id;
    } else if (levelTwoElephantEchoTerraceSafeAt(state.elephant, state.elephant.radius + 0.08)) {
      const previousPlatform = LEVEL_TWO_RED_PLATFORMS.find((platform) => platform.id === previousElephantSurfaceId);
      if (
        previousElephantSurfaceId === "tier-3-elephant-route" ||
        (previousPlatform && levelTwoRedPlatformIsTopAligned(previousPlatform))
      ) {
        state.levelTwo.elephantSurfaceId = "tier-3-elephant-route";
      } else {
        state.levelTwo.elephantSurfaceId = null;
      }
    } else if (state.levelTwo.elephantSurfaceId === "tier-3-elephant-route") {
      const safeBounds = levelTwoTileBounds(LEVEL_TWO_ELEPHANT_ECHO_TERRACE_TILES, -state.elephant.radius * 0.45);
      state.elephant.x = clamp(state.elephant.x, safeBounds.minX, safeBounds.maxX);
      state.elephant.z = clamp(state.elephant.z, safeBounds.minZ, safeBounds.maxZ);
    } else {
      state.levelTwo.elephantSurfaceId = null;
    }
  } else {
    state.levelTwo.elephantSurfaceId = null;
  }
}

function levelOneBridgeLiftAt(point) {
  return state.scene.id === SCENES.LEVEL_ONE && isOnLevelOneBridgeSurface(point, false)
    ? LEVEL_ONE_CROSSING_ACTOR_LIFT
    : 0;
}

function levelOneBridgeWalkableAt(actor, x, z) {
  const point = { x, z };
  const padding = Math.max(0, actor?.radius || 0);
  if (actor === state.frog && isOnLevelOneLilyPadSurface(point, padding)) return true;
  if (actor === state.human && state.levelOne.blueBloomDocked && isOnLevelOneLilyPadSurface(point, padding)) return true;
  if (!state.levelOne.blueBloomDocked) return false;
  return levelOneDockedBloomCrossingAt(point, padding);
}

function isOnLevelOneBridgeSurface(point, includeBankOverlap = true) {
  if (isOnLevelOneLilyPadSurface(point)) return true;
  if (!state.levelOne.blueBloomDocked && !state.levelOne.bridgeComplete) return false;
  if (isOnLevelOneBloomMatSurface(point, "left") || isOnLevelOneBloomMatSurface(point, "right")) return true;
  if (!includeBankOverlap) return false;
  const minX = Math.min(
    LEVEL_ONE_BLUE_BLOOM_MATS.left.docked.x - LEVEL_ONE_BLUE_BLOOM_MATS.left.halfX,
    LEVEL_ONE_BLUE_BLOOM_MATS.right.docked.x - LEVEL_ONE_BLUE_BLOOM_MATS.right.halfX
  );
  const maxX = Math.max(
    LEVEL_ONE_BLUE_BLOOM_MATS.left.docked.x + LEVEL_ONE_BLUE_BLOOM_MATS.left.halfX,
    LEVEL_ONE_BLUE_BLOOM_MATS.right.docked.x + LEVEL_ONE_BLUE_BLOOM_MATS.right.halfX
  );
  const halfZ = Math.max(LEVEL_ONE_LILY_PAD.halfZ, LEVEL_ONE_BLUE_BLOOM_MATS.left.halfZ, LEVEL_ONE_BLUE_BLOOM_MATS.right.halfZ);
  return Math.abs(point.z - LEVEL_ONE_CROSSING_Z) <= halfZ && point.x >= minX && point.x <= maxX;
}

function levelOneDockedBloomCrossingAt(point, padding = 0) {
  if (!state.levelOne.blueBloomDocked && !state.levelOne.bridgeComplete) return false;
  if (isOnLevelOneLilyPadSurface(point, padding)) return true;
  if (isOnLevelOneBloomMatSurface(point, "left", padding) || isOnLevelOneBloomMatSurface(point, "right", padding)) return true;
  const bankOverlap = 0.72;
  const minX = Math.min(
    LEVEL_ONE_BLUE_BLOOM_MATS.left.docked.x - LEVEL_ONE_BLUE_BLOOM_MATS.left.halfX,
    LEVEL_ONE_LILY_PAD.position.x - LEVEL_ONE_LILY_PAD.halfX,
    LEVEL_ONE_BLUE_BLOOM_MATS.right.docked.x - LEVEL_ONE_BLUE_BLOOM_MATS.right.halfX
  ) - bankOverlap;
  const maxX = Math.max(
    LEVEL_ONE_BLUE_BLOOM_MATS.left.docked.x + LEVEL_ONE_BLUE_BLOOM_MATS.left.halfX,
    LEVEL_ONE_LILY_PAD.position.x + LEVEL_ONE_LILY_PAD.halfX,
    LEVEL_ONE_BLUE_BLOOM_MATS.right.docked.x + LEVEL_ONE_BLUE_BLOOM_MATS.right.halfX
  ) + bankOverlap;
  const halfZ = Math.max(LEVEL_ONE_LILY_PAD.halfZ, LEVEL_ONE_BLUE_BLOOM_MATS.left.halfZ, LEVEL_ONE_BLUE_BLOOM_MATS.right.halfZ);
  return Math.abs(point.z - LEVEL_ONE_CROSSING_Z) <= halfZ + padding &&
    point.x >= minX - padding &&
    point.x <= maxX + padding;
}

function isOnLevelOnePartialBridgeSurface(point) {
  return isOnLevelOneLilyPadSurface(point) || isOnLevelOneBloomMatSurface(point, "left");
}

function isOnLevelOneLilyPadSurface(point, padding = 0) {
  return Math.abs(point.x - LEVEL_ONE_LILY_PAD.position.x) <= LEVEL_ONE_LILY_PAD.halfX + padding &&
    Math.abs(point.z - LEVEL_ONE_LILY_PAD.position.z) <= LEVEL_ONE_LILY_PAD.halfZ + padding;
}

function isOnLevelOneBloomMatSurface(point, id, padding = 0) {
  const mat = LEVEL_ONE_BLUE_BLOOM_MATS[id];
  if (!mat) return false;
  return Math.abs(point.x - mat.docked.x) <= mat.halfX + padding &&
    Math.abs(point.z - mat.docked.z) <= mat.halfZ + padding;
}

function loveLetterBlocksFrogAt(x, z) {
  if (!currentLoveLetterCollectable() || state.spellbookCollected) return false;
  return distance2D({ x, z }, currentLoveLetterPoint()) < state.frog.radius + LOVE_LETTER_BLOCK_RADIUS;
}

function activeBarrierColliders() {
  if (!state.reveals.barrier) return [];
  return barrierColliders.filter((barrier) => !(state.doorwayOpen && barrier.door));
}

function activeWorldBounds() {
  if (state.scene.id === SCENES.HOME) return HOME_BOUNDS;
  if (state.scene.id === SCENES.LEVEL_ONE) return LEVEL_ONE_BOUNDS;
  if (state.scene.id === SCENES.LEVEL_TWO) return LEVEL_TWO_BOUNDS;
  if (state.scene.id === SCENES.LEVEL_THREE) return LEVEL_THREE_BOUNDS;
  if (state.reveals.rightFloor) return WORLD_BOUNDS;
  return {
    ...WORLD_BOUNDS,
    maxX: gridPoint(WALL_COLUMN - 0.5, 0).x
  };
}

function frogCurrentSide() {
  return state.frog.x < doorwayClearZone().x ? "left" : "right";
}

function frogPatrolZone(side = frogCurrentSide()) {
  const bounds = activeWorldBounds();
  if (state.scene.id === SCENES.LEVEL_ONE) {
    const button = LEVEL_ONE_BUTTON;
    const rawLevelZone = side === "right"
      ? {
          side,
          minX: button.x - 1.35,
          maxX: button.x + 2.0,
          minZ: button.z - 1.35,
          maxZ: button.z + 1.35
        }
      : {
          side: "left",
          minX: START.frog.x - 1.45,
          maxX: START.frog.x + 1.45,
          minZ: START.frog.z - 1.05,
          maxZ: START.frog.z + 1.05
        };
    const zone = clampZoneToBounds(rawLevelZone, bounds);
    zone.centerX = (zone.minX + zone.maxX) * 0.5;
    zone.centerZ = (zone.minZ + zone.maxZ) * 0.5;
    return zone;
  }
  if (state.scene.id === SCENES.LEVEL_TWO) {
    const frogStart = LEVEL_TWO_POINTS.frogStart;
    const zone = clampZoneToBounds({
      side: "left",
      minX: frogStart.x - 1.35,
      maxX: frogStart.x + 1.35,
      minZ: frogStart.z - 1.0,
      maxZ: frogStart.z + 1.0
    }, bounds);
    zone.centerX = (zone.minX + zone.maxX) * 0.5;
    zone.centerZ = (zone.minZ + zone.maxZ) * 0.5;
    return zone;
  }
  if (state.scene.id === SCENES.LEVEL_THREE) {
    const frogStart = LEVEL_THREE_POINTS.frogStart;
    const zone = clampZoneToBounds({
      side: "left",
      minX: frogStart.x - 1.35,
      maxX: frogStart.x + 1.35,
      minZ: frogStart.z - 1.0,
      maxZ: frogStart.z + 1.0
    }, bounds);
    zone.centerX = (zone.minX + zone.maxX) * 0.5;
    zone.centerZ = (zone.minZ + zone.maxZ) * 0.5;
    return zone;
  }
  const button = TUTORIAL_BUTTON;
  const rawZone = side === "right"
    ? {
        side,
        minX: button.x - 0.95,
        maxX: button.x + 2.35,
        minZ: button.z - 1.35,
        maxZ: button.z + 1.35
      }
    : {
        side: "left",
        minX: START.frog.x - 1.45,
        maxX: START.frog.x + 1.45,
        minZ: START.frog.z - 1.05,
        maxZ: START.frog.z + 1.05
      };
  const zone = {
    ...rawZone,
    minX: clamp(rawZone.minX, bounds.minX + state.frog.radius, bounds.maxX - state.frog.radius),
    maxX: clamp(rawZone.maxX, bounds.minX + state.frog.radius, bounds.maxX - state.frog.radius),
    minZ: clamp(rawZone.minZ, bounds.minZ + state.frog.radius, bounds.maxZ - state.frog.radius),
    maxZ: clamp(rawZone.maxZ, bounds.minZ + state.frog.radius, bounds.maxZ - state.frog.radius)
  };
  zone.centerX = (zone.minX + zone.maxX) * 0.5;
  zone.centerZ = (zone.minZ + zone.maxZ) * 0.5;
  return zone;
}

function clampZoneToBounds(rawZone, bounds) {
  return clampZoneToBoundsForRadius(rawZone, bounds, state.frog.radius);
}

function clampPointToPatrolZone(point, side = frogCurrentSide()) {
  const zone = frogPatrolZone(side);
  return {
    x: clamp(point.x, zone.minX, zone.maxX),
    z: clamp(point.z, zone.minZ, zone.maxZ)
  };
}

function roundedZone(zone) {
  return {
    side: zone.side,
    minX: Number(zone.minX.toFixed(2)),
    maxX: Number(zone.maxX.toFixed(2)),
    minZ: Number(zone.minZ.toFixed(2)),
    maxZ: Number(zone.maxZ.toFixed(2)),
    centerX: Number(zone.centerX.toFixed(2)),
    centerZ: Number(zone.centerZ.toFixed(2))
  };
}

function doorwayClearZone() {
  const center = gridPoint(WALL_COLUMN, DOOR_ROW);
  return {
    x: center.x,
    z: center.z,
    halfX: DOORWAY_CLEAR_HALF_X,
    halfZ: DOORWAY_CLEAR_HALF_Z
  };
}

function pointInDoorwayZone(point, padding = 0) {
  const zone = doorwayClearZone();
  return Math.abs(point.x - zone.x) <= zone.halfX + padding &&
    Math.abs(point.z - zone.z) <= zone.halfZ + padding;
}

function shouldFrogClearDoorway() {
  return state.scene.id === SCENES.TUTORIAL && state.doorwayOpen && state.active === "human" && !state.spellbookCollected;
}

function getInputVector() {
  return inputVectorFromKeys(input, state.cameraYaw);
}

function syncAll() {
  syncActorMeshes();
  syncMarkers();
  applyRevealVisibility();
  if (state.devEditor.open) {
    syncDevEditorSelectionToScene();
    syncDevEditorColliderHelpers();
  }
}

function syncActorMeshes() {
  syncActorMeshPositions({
    actorMeshes,
    state,
    camera,
    surfaceY: SURFACE_Y,
    frogJumpLift: FROG_JUMP_LIFT,
    frogSmallHopHeight: FROG_SMALL_HOP_HEIGHT,
    frogRevealSeconds: FROG_REVEAL_SECONDS,
    levelOneBridgeLiftAt,
    levelTwoActorLiftAt,
    directionToRotation,
    getCameraFacingDirection,
    playHumanAnimation,
    clamp
  });
}

function syncMarkers() {
  syncMarkerMeshes({
    markerMeshes,
    levelTwoInteractiveMeshes,
    state,
    surfaceY: SURFACE_Y,
    buttonTopRestY: BUTTON_TOP_REST_Y,
    buttonTopPressedY: BUTTON_TOP_PRESSED_Y,
    getActiveActor,
    sceneAllowsInput,
    levelOneBridgeLiftAt,
    levelTwoActorLiftAt,
    buttonPoint,
    syncButtonTopVisual,
    clamp
  });
  Object.entries(levelThreeInteractiveMeshes.greenButtonTops || {}).forEach(([id, buttonTop]) => {
    const pressed = id === "level3TotemGreenButton"
      ? Boolean(state.levelThree.totemGreenButtonPressed)
      : false;
    syncButtonTopVisual(buttonTop, pressed, BUTTON_TOP_REST_Y, BUTTON_TOP_PRESSED_Y);
  });
}

function applyRevealVisibility() {
  applySceneRevealVisibility({
    state,
    sceneIds: SCENES,
    sceneGroups,
    floorMeshes,
    actorMeshes,
    markerMeshes,
    barrierMeshes,
    barrierEndCapMeshes,
    levelOneBridgeMeshes,
    levelOneBridgeDeckMeshes,
    levelTwoInteractiveMeshes,
    surfaceY: SURFACE_Y,
    doorRow: DOOR_ROW,
    levelOneBridgeVisualY: SURFACE_Y,
    levelOneBridgeDeckY: SURFACE_Y,
    levelTwoBlueRamp: LEVEL_TWO_BLUE_RAMP,
    rightFloorProgress,
    barrierSegmentProgress,
    easeOutCubic,
    clamp
  });
}

function playHumanAnimation(name, force = false) {
  if (!animation.actions[name] || (!force && animation.currentHumanAction === name)) return;
  const next = animation.actions[name];
  next.reset().fadeIn(0.16).play();
  if (animation.currentHumanAction && animation.actions[animation.currentHumanAction]) {
    animation.actions[animation.currentHumanAction].fadeOut(0.16);
  }
  animation.currentHumanAction = name;
}

function updateCamera(dt) {
  if (state.devEditor.open) {
    updateDevCamera({ state, camera, dt, activeActor: getActiveActor() });
    return;
  }
  const activeActor = state.celebration.active || state.celebration.modalVisible ? state.human : getActiveActor();
  const activeSurfaceLift = levelOneBridgeLiftAt(activeActor) + levelTwoActorLiftAt(activeActor);
  const bounds = activeWorldBounds();
  applyCameraUpdate(camera, state, dt, activeActor, bounds, activeSurfaceLift);
}

function rotateCamera(direction) {
  if (!state.ready) return;
  stepCameraYaw(state, direction);
  if (state.scene.id === SCENES.TUTORIAL && !state.tutorialSkipped) advanceTutorial("rotate_camera");
}

function renderFrame() {
  const now = performance.now();
  const dt = runtime.manualAdvanceDepth > 0 || runtime.testPaused ? 0 : Math.min(clock.getDelta(), 0.05);
  lastFrameTime = now;
  if (dt > 0) update(dt);
  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  const aspect = width / Math.max(height, 1);
  const frustum = width < 720 ? 13.4 : 10.8;
  camera.left = -frustum * aspect;
  camera.right = frustum * aspect;
  camera.top = frustum;
  camera.bottom = -frustum;
  camera.updateProjectionMatrix();
  updateCamera(1);
}

function updateHud() {
  const stepId = currentStepId();
  const stepLabel = currentStepLabel();
  const prompt = currentPrompt(stepId);
  renderHudBase(hud, {
    activeLabel: activeActorLabel(),
    goalLabel: currentGoalLabel(),
    stepLabel,
    prompt
  });
  updateTutorialBannerAttention(stepLabel, prompt);
  updateSkipModal();
  updateControlsPanel();
  updateDevEditorPanel();
  updateLevelCompleteModal();
  updateLoveLetterMessageModal();
  updateContinuePrompt();
  updateSpeechBubble();
  updateSceneOverlays();
}

function updateTutorialBannerAttention(stepLabel, prompt) {
  if (!hud.tutorialBanner) return;
  if (state.scene.id !== SCENES.TUTORIAL || state.scene.titleCardVisible) {
    tutorialBannerAttentionKey = "";
    hud.tutorialBanner.classList.remove("tutorial-banner-attention");
    return;
  }
  const nextKey = [
    state.scene.id,
    state.tutorialIndex,
    stepLabel,
    prompt,
    tutorialRecoveryPhase()
  ].join(":");
  if (nextKey === tutorialBannerAttentionKey) return;
  tutorialBannerAttentionKey = nextKey;
  hud.tutorialBanner.classList.remove("tutorial-banner-attention");
  void hud.tutorialBanner.offsetWidth;
  hud.tutorialBanner.classList.add("tutorial-banner-attention");
}

function activeActorLabel() {
  if (state.active === "frog") return "Frog Cubeling";
  if (state.active === "elephant") return "Elephant Cubeling";
  if (state.active === "crocodile") return "Crocodile Cubeling";
  return "Character";
}

function currentPrompt(stepId = currentStepId()) {
  clearExpiredPrompt();
  return getHudPrompt(state, stepId, {
    sceneIds: SCENES,
    tutorialSteps: TUTORIAL_STEPS,
    freePlayPrompt: FREE_PLAY_PROMPT
  });
}

function currentGoalLabel() {
  return getHudGoalLabel(state, SCENES);
}

function currentStepLabel() {
  return getHudStepLabel(state, SCENES, GUIDED_STEP_COUNT);
}

function showPrompt(text, seconds = 1.2) {
  state.overridePrompt = { text, until: state.elapsed + seconds };
  updateHud();
}

function clearExpiredPrompt() {
  if (state.overridePrompt && state.elapsed >= state.overridePrompt.until) state.overridePrompt = null;
}

function currentStepId() {
  return currentTutorialStepId(state, STEP_IDS);
}

function advanceTutorial(expectedStep) {
  if (state.tutorialSkipped) return;
  if (currentStepId() !== expectedStep) return;
  state.tutorialIndex = Math.min(state.tutorialIndex + 1, STEP_IDS.length - 1);
  state.maxTutorialIndexReached = Math.max(state.maxTutorialIndexReached, state.tutorialIndex);
  state.overridePrompt = null;
  if (currentStepId() === "frog_move") state.frogMoveProgress = 0;
  handleTutorialReveal(currentStepId());
  const speech = SPEECH_STEPS[currentStepId()];
  const preservingLoveLetterCallout =
    currentStepId() === "jump_wall" &&
    state.reveals.spellbook &&
    state.elapsed < state.loveLetterAttention.protectSpeechUntil;
  if (speech && !state.tutorialComplete && !preservingLoveLetterCallout) showSpeech(speech.anchor, speech.text, SPEECH_SECONDS);
}

function setTutorialStep(stepId) {
  const next = STEP_IDS.indexOf(stepId);
  if (next < 0 || state.tutorialIndex === next) return;
  state.tutorialIndex = next;
  state.maxTutorialIndexReached = Math.max(state.maxTutorialIndexReached, next);
  state.overridePrompt = null;
  const speech = SPEECH_STEPS[stepId];
  if (speech) showSpeech(speech.anchor, speech.text, SPEECH_SECONDS);
}

function stepBefore(stepId) {
  return tutorialStepBefore(state, STEP_IDS, stepId);
}

function hasLearned(stepId) {
  return tutorialHasLearned(state, STEP_IDS, stepId);
}

function shouldRequestSkip(stepId) {
  return shouldRequestTutorialSkip(state, SCENES, STEP_IDS, stepId);
}

function maybeRequestSkip(stepId, reason, anchor = "human", nudgeText = "") {
  if (!shouldRequestSkip(stepId)) return false;
  const count = recordTutorialNudge(`${currentStepId()}:${stepId}`);
  if (count < 2) {
    const text = nudgeText || SPEECH_STEPS[currentStepId()]?.text || currentPrompt();
    showPrompt(text, 1.8);
    showSpeech(anchor, text, 1.8);
    return true;
  }
  requestSkip(reason, anchor);
  return true;
}

function recordTutorialNudge(id) {
  return recordTutorialNudgeState(state, state.elapsed, id, NUDGE_REPEAT_WINDOW);
}

function handleTutorialReveal(stepId) {
  if (stepId === "inspect_frog_echo") revealFrogEcho();
  if (stepId === "possess_frog_again") revealBarrier();
}

function revealFrogEcho() {
  if (state.reveals.frogEcho || state.reveals.frog) return;
  state.reveals.frogEcho = true;
  state.frogTotemReveal = { active: false, elapsed: 0, delay: 0 };
  state.frogEcho.sparkleTimer = 0;
  spawnRevealSparkles(particleContext, START.frog.x, START.frog.z, FROG_ECHO_SPARKLE);
  showSpeech("frogEcho", SPEECH_STEPS.inspect_frog_echo.text, SPEECH_SECONDS);
}

function revealFrogTotem() {
  if (state.reveals.frogTotem || state.frogTotem.collected || state.reveals.frog) return;
  state.reveals.frogTotem = true;
  state.frogTotemReveal = { active: true, elapsed: 0, delay: FROG_TOTEM_REVEAL_DELAY };
  state.frogTotem.sparkleTimer = 0;
  spawnRevealSparkles(particleContext, FROG_TOTEM.x, FROG_TOTEM.z, FROG_TOTEM_SPARKLE);
  advanceTutorial("inspect_frog_echo");
  showSpeech("frogTotem", "Frog Cubeling Totem. Collect me to awaken the Frog Cubeling.", 2.4);
}

function revealFrogCubeling() {
  if (state.reveals.frog) return;
  state.reveals.frog = true;
  state.frog = createActorState(START.frog, 0.53, 3.45);
  state.frogReveal = { active: true, elapsed: 0 };
  spawnRevealSparkles(particleContext, START.frog.x, START.frog.z, 0xa6f57b);
}

function collectFrogTotem() {
  if (state.frogTotem.collected) return;
  state.frogTotem.collected = true;
  state.reveals.frogTotem = false;
  state.reveals.frogEcho = false;
  state.cubelings.frog.unlocked = true;
  state.cubelings.frog.unlockedThisTutorial = true;
  state.unlocks.frogCubeling = true;
  saveCubelingUnlocks();
  revealFrogCubeling();
  advanceTutorial("collect_frog_totem");
  showPrompt("Frog Cubeling Found! Frog Cubeling Unlocked!", 2.5);
  showSpeech("frog", "Frog Cubeling Found!", 1.8);
  spawnRevealSparkles(particleContext, START.frog.x, START.frog.z, 0xb8ff8f, 24);
}

function showFrogEchoDialogue(force = false) {
  if (!force && state.elapsed - state.frogEcho.lastPromptAt < FROG_ECHO_SPEECH_COOLDOWN) return;
  const text = FROG_ECHO_LINES[state.frogEcho.promptIndex % FROG_ECHO_LINES.length];
  state.frogEcho.promptIndex += 1;
  state.frogEcho.lastPromptAt = state.elapsed;
  showSpeech("frogEcho", text, 1.8);
  if (currentStepId() === "inspect_frog_echo") showPrompt("Find the Frog Cubeling Totem to awaken the Frog Cubeling.", 2.0);
}

function showFrogTotemDialogue(force = false) {
  if (!force && state.elapsed - state.frogTotem.lastPromptAt < FROG_TOTEM_SPEECH_COOLDOWN) return;
  const text = FROG_TOTEM_LINES[state.frogTotem.promptIndex % FROG_TOTEM_LINES.length];
  state.frogTotem.promptIndex += 1;
  state.frogTotem.lastPromptAt = state.elapsed;
  showSpeech("frogTotem", text, 1.9);
  showPrompt(
    state.active === "human"
      ? "Collect the Frog Cubeling Totem to unlock the Frog Cubeling."
      : "Only your character can collect Cubeling Totems and treasures.",
    2.2
  );
}

function revealBarrier() {
  if (state.reveals.barrier) return;
  state.reveals.rightFloor = true;
  state.reveals.barrier = true;
  state.rightFloorReveal = { active: true, elapsed: 0 };
  state.barrierReveal = { active: true, elapsed: 0, landed: [] };
  spawnRevealSparkles(particleContext, gridPoint(WALL_COLUMN, DOOR_ROW).x, gridPoint(WALL_COLUMN, DOOR_ROW).z, 0xffe18c);
}

function revealButton() {
  if (state.reveals.button) return;
  if (!state.reveals.spellbook) revealSpellbook("button_fallback");
  state.reveals.button = true;
  const button = buttonPoint();
  spawnRevealSparkles(particleContext, button.x, button.z, 0x75c8ff);
}

function revealSpellbook(reason = "barrier_approach") {
  if (state.reveals.spellbook) return;
  state.reveals.spellbook = true;
  state.loveLetterReveal = { active: true, elapsed: 0 };
  state.loveLetterAttention = {
    ...createLoveLetterAttentionState(),
    revealedBeforeButton: !state.reveals.button,
    revealReason: reason,
    protectSpeechUntil: state.elapsed + 2.8
  };
  triggerLoveLetterAttention("first_reveal", "strong");
  showSpeech("loveLetter", "Come collect me!", 2.4);
}

function maybeRevealLoveLetterFromBarrierApproach() {
  if (state.scene.id !== SCENES.TUTORIAL) return;
  if (state.reveals.spellbook || state.spellbookCollected || !state.reveals.barrier || !state.reveals.rightFloor) return;
  const barrierX = gridPoint(WALL_COLUMN, DOOR_ROW).x;
  const doorZ = gridPoint(WALL_COLUMN, DOOR_ROW).z;
  const actor = state.active === "frog" ? state.frog : state.human;
  const distanceToBarrierArea = Math.hypot(actor.x - barrierX, actor.z - doorZ);
  const frogNearBarrier = state.active === "frog" && Math.abs(state.frog.x - barrierX) <= LOVE_LETTER_BARRIER_REVEAL_DISTANCE;
  const humanNearBarrier = state.active === "human" && distanceToBarrierArea <= LOVE_LETTER_BARRIER_REVEAL_DISTANCE;
  if (!frogNearBarrier && !humanNearBarrier) return;
  revealSpellbook("barrier_approach");
}

function triggerLoveLetterAttention(reason = "gentle", intensity = "gentle") {
  if (!state.reveals.spellbook || state.spellbookCollected) return;
  const strong = intensity === "strong";
  const loveLetterPoint = currentLoveLetterPoint();
  spawnRevealSparkles(particleContext, loveLetterPoint.x, loveLetterPoint.z, 0xffd37a, strong ? 18 : 7);
  spawnLoveLetterHearts(particleContext, loveLetterPoint, strong ? 5 : 2);
  state.loveLetterAttention.bounceElapsed = LOVE_LETTER_ATTENTION_BOUNCE_SECONDS;
  state.loveLetterAttention.sparkleTimer = LOVE_LETTER_SPARKLE_INTERVAL;
  state.loveLetterAttention.heartTimer = LOVE_LETTER_HEART_INTERVAL;
  state.loveLetterAttention.bounceTimer = LOVE_LETTER_BOUNCE_INTERVAL;
  state.loveLetterAttention.attentionBurstCount += 1;
  state.loveLetterAttention.lastAttentionReason = reason;
}

function updateRightFloorReveal(dt) {
  if (!state.rightFloorReveal.active) return;
  state.rightFloorReveal.elapsed += dt;
  if (rightFloorProgress(LEVEL_WIDTH - 1, LEVEL_HEIGHT - 1) >= 1) {
    state.rightFloorReveal.active = false;
  }
}

function updateBarrierReveal(dt) {
  if (!state.barrierReveal.active) return;
  state.barrierReveal.elapsed += dt;
  const revealIndices = [-1, ...Array.from({ length: LEVEL_HEIGHT }, (_, row) => row), LEVEL_HEIGHT];
  revealIndices.forEach((index) => {
    if (state.barrierReveal.landed.includes(index)) return;
    if (barrierSegmentProgress(index) < 0.72) return;
    state.barrierReveal.landed.push(index);
    const row = clamp(index, 0, LEVEL_HEIGHT - 1);
    const point = gridPoint(WALL_COLUMN, row);
    spawnLandingPuff(particleContext, point.x, point.z);
  });
  if (barrierSegmentProgress(LEVEL_HEIGHT) >= 1) state.barrierReveal.active = false;
}

function updateLoveLetterReveal(dt) {
  if (!state.loveLetterReveal.active) return;
  state.loveLetterReveal.elapsed += dt;
  if (state.loveLetterReveal.elapsed >= LOVE_LETTER_REVEAL_SECONDS) state.loveLetterReveal.active = false;
}

function updateLoveLetterAttention(dt) {
  if (!state.reveals.spellbook || state.spellbookCollected || state.celebration.active) return;
  const attention = state.loveLetterAttention;
  attention.bounceElapsed = Math.max(0, attention.bounceElapsed - dt);
  attention.sparkleTimer -= dt;
  attention.heartTimer -= dt;
  attention.bounceTimer -= dt;

  if (attention.sparkleTimer <= 0) {
    const loveLetterPoint = currentLoveLetterPoint();
    spawnRevealSparkles(particleContext, loveLetterPoint.x, loveLetterPoint.z, 0xffd37a, 5);
    attention.sparkleTimer = LOVE_LETTER_SPARKLE_INTERVAL + Math.random() * 1.2;
  }
  if (attention.heartTimer <= 0) {
    spawnLoveLetterHearts(particleContext, currentLoveLetterPoint(), 2);
    attention.heartTimer = LOVE_LETTER_HEART_INTERVAL + Math.random() * 1.4;
  }
  if (attention.bounceTimer <= 0) {
    attention.bounceElapsed = LOVE_LETTER_ATTENTION_BOUNCE_SECONDS;
    attention.bounceTimer = LOVE_LETTER_BOUNCE_INTERVAL + Math.random() * 1.3;
  }

  if (!(state.doorwayOpen || state.levelOne.bridgeComplete)) return;
  attention.reminderTimer -= dt;
  if (attention.reminderTimer > 0) return;
  attention.reminderTimer = LOVE_LETTER_REMINDER_SECONDS;
  attention.idleReminderCount += 1;
  triggerLoveLetterAttention("idle_reminder", "gentle");
  if (state.speechSequenceActive || state.speech.text && state.elapsed < state.speech.until) return;
  showSpeech(
    "loveLetter",
    state.active === "human" ? "There you are. Pick me up!" : "Come back as yourself and collect me!",
    2.2
  );
}

function barrierSegmentProgress(index) {
  if (!state.reveals.barrier) return 0;
  if (!state.barrierReveal.active) return 1;
  const staggerIndex = index + 1;
  const start = staggerIndex * BARRIER_REVEAL_STAGGER;
  const raw = (state.barrierReveal.elapsed - BARRIER_REVEAL_FLOOR_LEAD - start) / BARRIER_REVEAL_SECONDS;
  return easeOutCubic(clamp(raw, 0, 1));
}

function rightFloorProgress(column, row) {
  if (column < WALL_COLUMN) return 1;
  if (!state.reveals.rightFloor) return 0;
  if (!state.rightFloorReveal.active) return 1;
  const columnStagger = (column - WALL_COLUMN) * 0.045;
  const rowStagger = row * 0.018;
  const raw = (state.rightFloorReveal.elapsed - columnStagger - rowStagger) / RIGHT_FLOOR_REVEAL_SECONDS;
  return easeOutCubic(clamp(raw, 0, 1));
}

function isFrogNearJumpableBarrier() {
  return Boolean(getFrogJump());
}

function requestSkip(reason, anchor = "human") {
  if (state.tutorialSkipped || state.tutorialComplete || state.celebration.freeMode || state.skipModal.visible) return;
  clearSpeechQueue();
  state.skipModal = { visible: true, reason, anchor };
  const speech = SPEECH_STEPS[currentStepId()];
  showSpeech(anchor, speech?.text || currentPrompt(), 2);
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  input.keys.clear();
  updateHud();
}

function confirmSkipTutorial() {
  state.tutorialSkipped = true;
  state.maxTutorialIndexReached = GUIDED_STEP_COUNT;
  state.skipModal = { visible: false, reason: "", anchor: "human" };
  state.skipNudge = { id: "", count: 0, lastAt: -Infinity };
  const frogUnlocked = state.cubelings.frog.unlocked || state.frogTotem.collected;
  state.reveals = {
    rightFloor: true,
    frogEcho: !frogUnlocked,
    frogTotem: !frogUnlocked,
    frog: frogUnlocked,
    barrier: true,
    button: true,
    spellbook: true
  };
  if (!frogUnlocked) {
    state.frogTotemReveal = { active: true, elapsed: FROG_TOTEM_REVEAL_SECONDS, delay: FROG_TOTEM_REVEAL_DELAY };
    showPrompt("Free mode is open, but collect the Frog Cubeling Totem before using the Frog Cubeling.", 3.2);
  }
  state.frogReveal = { active: false, elapsed: 0 };
  state.rightFloorReveal = { active: false, elapsed: 0 };
  state.barrierReveal = { active: false, elapsed: 0, landed: [] };
  state.loveLetterReveal = { active: false, elapsed: 0 };
  state.loveLetterAttention = {
    ...createLoveLetterAttentionState(),
    revealedBeforeButton: false,
    revealReason: "skip_mode"
  };
  clearSpeechQueue();
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  state.speech = { text: "", anchor: "", until: 0 };
  if (frogUnlocked) {
    state.overridePrompt = null;
    showSpeech(state.active, "Free exploration mode.", 1.6);
  } else {
    setSpeech("frogTotem", "Collect me to unlock the Frog Cubeling.", 2.4);
  }
  syncAll();
  updateHud();
}

function declineSkipTutorial() {
  const anchor = state.skipModal.anchor || SPEECH_STEPS[currentStepId()]?.anchor || "human";
  const speech = SPEECH_STEPS[currentStepId()];
  state.skipModal = { visible: false, reason: "", anchor };
  showSpeech(anchor, speech?.text || currentPrompt(), 2);
  updateHud();
}

function updateSkipModal() {
  renderSkipModal(hud, state.skipModal);
}

function toggleControlsPanel() {
  state.controlsOpen = !state.controlsOpen;
  updateControlsPanel();
}

function updateControlsPanel() {
  renderControlsPanel(hud, state.controlsOpen);
}

function levelCompleteNextLevelEnabled() {
  if (state.scene.id === SCENES.TUTORIAL) return Boolean(state.tutorialComplete);
  if (state.scene.id === SCENES.LEVEL_ONE) return Boolean(state.levelOne.complete);
  return false;
}

function levelCompleteNextLevelDestination() {
  if (state.scene.id === SCENES.TUTORIAL) return "Level One";
  if (state.scene.id === SCENES.LEVEL_ONE) return "Level Two";
  return "";
}

function updateLevelCompleteModal() {
  renderLevelCompleteModal(hud, {
    open: state.celebration.modalVisible,
    isTutorial: state.scene.id === SCENES.TUTORIAL,
    levelName: state.scene.id === SCENES.LEVEL_TWO ? "Level Two" : "Level One",
    nextLevelEnabled: levelCompleteNextLevelEnabled(),
    nextLevelDestination: levelCompleteNextLevelDestination()
  });
}

function updateLoveLetterMessageModal() {
  renderLoveLetterMessageModal(hud, state.loveLetterMessage);
}

function updateContinuePrompt() {
  const visible = state.celebration.continuePromptVisible && !state.celebration.modalVisible && !state.loveLetterMessage.visible;
  renderContinuePrompt(hud, visible);
}

function updateSceneOverlays() {
  renderSceneOverlays(hud, {
    state,
    sceneIds: SCENES,
    doorNoteText: HOME_DOOR_NOTE_TEXT,
    updateExitArrowPosition
  });
}

function updateExitArrowPosition() {
  if (!hud.exitArrow) return;
  const humanScreen = worldToScreen({ x: state.human.x, y: SURFACE_Y + 0.55, z: state.human.z });
  const exitScreen = worldToScreen({ x: HOME_POINTS.exit.x, y: SURFACE_Y + 0.55, z: HOME_POINTS.exit.z });
  const marginX = 94;
  const marginY = 82;
  const x = clamp(exitScreen.x, marginX, window.innerWidth - marginX);
  const y = clamp(exitScreen.y - 32, marginY, window.innerHeight - marginY);
  const angle = Math.atan2(exitScreen.y - humanScreen.y, exitScreen.x - humanScreen.x);
  hud.exitArrow.style.left = `${Math.round(x)}px`;
  hud.exitArrow.style.top = `${Math.round(y)}px`;
  hud.exitArrow.style.setProperty("--arrow-rotation", `${angle}rad`);
}

function worldToScreen(point) {
  projectionVector.set(point.x, point.y, point.z).project(camera);
  return {
    x: (projectionVector.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projectionVector.y * 0.5 + 0.5) * window.innerHeight
  };
}

function showLoveLetterMessage() {
  if (state.loveLetterMessage.shown) return;
  state.loveLetterMessage.shown = true;
  state.loveLetterMessage.visible = true;
  state.celebration.awaitingContinue = false;
  state.celebration.continuePromptVisible = false;
  state.celebration.inputArmed = false;
  input.keys.clear();
  updateHud();
}

function dismissLoveLetterMessage(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!state.loveLetterMessage.visible) return;
  state.loveLetterMessage.visible = false;
  state.loveLetterMessage.dismissed = true;
  state.loveLetterMessage.inputBufferUntil = state.elapsed + LOVE_LETTER_MESSAGE_INPUT_BUFFER_SECONDS;
  if (hud.loveLetterModal) {
    hud.loveLetterModal.hidden = true;
    hud.loveLetterModal.classList.remove("is-open");
    hud.loveLetterModal.setAttribute("aria-hidden", "true");
  }
  state.celebration.awaitingContinue = false;
  state.celebration.continuePromptVisible = false;
  state.celebration.inputArmed = false;
  input.keys.clear();
  updateHud();
}

function loveLetterMessageBlocksContinue() {
  if (!state.spellbookCollected) return false;
  if (!state.loveLetterMessage.shown) return true;
  if (state.loveLetterMessage.visible || !state.loveLetterMessage.dismissed) return true;
  return state.elapsed < state.loveLetterMessage.inputBufferUntil;
}

function continueFreeMode() {
  state.celebration.active = false;
  state.celebration.modalVisible = false;
  state.celebration.freeMode = true;
  state.celebration.awaitingContinue = false;
  state.celebration.continuePromptVisible = false;
  state.celebration.inputArmed = false;
  state.reward.active = false;
  state.tutorialSkipped = true;
  state.overridePrompt = null;
  clearSpeechQueue();
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  markerMeshes.spellbookOpen.visible = false;
  showSpeech("human", "Free mode is open.", 1.5);
  updateHud();
}

function updateCelebration(dt) {
  if (!state.celebration.active) return;
  state.celebration.elapsed += dt;
  if (!state.loveLetterMessage.shown && state.celebration.elapsed >= LOVE_LETTER_MESSAGE_DELAY_SECONDS) {
    showLoveLetterMessage();
  }
  state.celebration.animationTimer += dt;
  state.celebration.heartTimer -= dt;
  if (state.celebration.heartTimer <= 0) {
    state.celebration.heartTimer = CELEBRATION_HEART_INTERVAL + Math.random() * 0.28;
    state.celebration.heartBurstCount += 1;
    spawnHeartParticles(particleContext, state.human.x, state.human.z, false, 5);
  }
  if (state.celebration.elapsed > 0.72 && state.celebration.animationStage === "jump") {
    state.celebration.animationStage = "yes";
    playHumanAnimation(animation.actions.Yes ? "Yes" : "Wave", true);
  }
  if (state.celebration.elapsed > 1.25 && state.celebration.animationTimer > 1.45) {
    state.celebration.animationTimer = 0;
    const loopAction = state.celebration.animationStage === "yes" && animation.actions.Wave ? "Wave" : animation.actions.Yes ? "Yes" : "Wave";
    state.celebration.animationStage = loopAction.toLowerCase();
    playHumanAnimation(loopAction, true);
  }
  if (state.celebration.elapsed >= CELEBRATION_MIN_SECONDS && !loveLetterMessageBlocksContinue()) {
    state.celebration.awaitingContinue = true;
    state.celebration.continuePromptVisible = true;
    state.celebration.inputArmed = true;
  } else if (loveLetterMessageBlocksContinue()) {
    state.celebration.awaitingContinue = false;
    state.celebration.continuePromptVisible = false;
    state.celebration.inputArmed = false;
  }
}

function tryFinishCelebration() {
  if (loveLetterMessageBlocksContinue()) return;
  if (!state.celebration.active || !state.celebration.awaitingContinue || !state.celebration.inputArmed) return;
  state.celebration.active = false;
  state.celebration.awaitingContinue = false;
  state.celebration.continuePromptVisible = false;
  state.celebration.inputArmed = false;
  state.celebration.modalVisible = true;
  state.reward.active = false;
  markerMeshes.spellbookOpen.visible = false;
  input.keys.clear();
  playHumanAnimation(animation.actions.Yes ? "Yes" : "Wave", true);
  updateHud();
}

function showSpeech(anchor, text, seconds = 1.4) {
  showSpeechState(state, state.elapsed, anchor, text, seconds);
}

function setSpeech(anchor, text, seconds = 1.4) {
  setSpeechState(state, state.elapsed, anchor, text, seconds);
}

function showSecondarySpeech(anchor, text, seconds = 1.4) {
  showSecondarySpeechState(state, state.elapsed, anchor, text, seconds);
}

function clearSpeechQueue() {
  clearSpeechQueueState(state);
}

function queueSpeech(items) {
  queueSpeechState(state, state.elapsed, items);
}

function updateSpeechQueue() {
  updateSpeechQueueState(state, state.elapsed);
}

function updateSpeechBubble() {
  renderSpeechBubbleElement(hud.speech, getSpeechBubble(), {
    worldToScreen,
    getAnchorPoint: getSpeechAnchorPoint
  });
  renderSpeechBubbleElement(hud.speechSecondary, getSecondarySpeechBubble(), {
    offset: { y: 54 },
    worldToScreen,
    getAnchorPoint: getSpeechAnchorPoint
  });
}

function getSpeechBubble() {
  return getSpeechBubbleState(state, state.elapsed);
}

function getSecondarySpeechBubble() {
  return getSecondarySpeechBubbleState(state, state.elapsed);
}

function getSpeechAnchorPoint(anchor) {
  if (anchor === "frog") return { x: state.frog.x, y: SURFACE_Y + 2.0, z: state.frog.z };
  if (anchor === "elephant") return { x: state.elephant.x, y: LEVEL_TWO_ELEPHANT_ECHO_TOP_Y + 2.0, z: state.elephant.z };
  if (anchor === "crocodile") return { x: state.crocodile.x, y: SURFACE_Y + 1.15, z: state.crocodile.z };
  if (anchor === "frogEcho") return { x: START.frog.x, y: SURFACE_Y + 2.0, z: START.frog.z };
  if (anchor === "frogTotem") return { x: FROG_TOTEM.x, y: SURFACE_Y + 2.0, z: FROG_TOTEM.z };
  if (anchor === "elephantEcho") return { x: LEVEL_TWO_POINTS.elephantEcho.x, y: (LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y) + 2.0, z: LEVEL_TWO_POINTS.elephantEcho.z };
  if (anchor === "elephantTotem") return { x: LEVEL_TWO_POINTS.elephantTotem.x, y: LEVEL_TWO_ELEPHANT_TOTEM_HILL.topY + 1.4, z: LEVEL_TWO_POINTS.elephantTotem.z };
  if (anchor === "level3CrocodileEcho") return { x: LEVEL_THREE_CROCODILE_ECHO.position.x, y: SURFACE_Y + 1.6, z: LEVEL_THREE_CROCODILE_ECHO.position.z };
  if (anchor === "level3TotemGreenButton") {
    const button = LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.find((item) => item.id === "level3TotemGreenButton") || LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS[0];
    return { x: button.position.x, y: SURFACE_Y + 1.05, z: button.position.z };
  }
  if (anchor === "level3TotemRaft") {
    const raftPosition = currentLevelThreeTotemRaftPosition();
    return { x: raftPosition.x, y: SURFACE_Y + 1.35, z: raftPosition.z };
  }
  if (anchor === "button") {
    const button = buttonPoint();
    return { x: button.x, y: SURFACE_Y + 1.05, z: button.z };
  }
  if (anchor === "loveLetter" || anchor === "spellbook") {
    if (state.scene.id === SCENES.LEVEL_TWO) {
      return {
        x: LEVEL_TWO_POINTS.placeholderLoveLetter.x,
        y: LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y + 1.2,
        z: LEVEL_TWO_POINTS.placeholderLoveLetter.z
      };
    }
    if (state.scene.id === SCENES.LEVEL_THREE) {
      return {
        x: LEVEL_THREE_POINTS.placeholderLoveLetter.x,
        y: LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y + 1.2,
        z: LEVEL_THREE_POINTS.placeholderLoveLetter.z
      };
    }
    const loveLetterPoint = currentLoveLetterPoint();
    const loveLetterBaseY = Number.isFinite(loveLetterPoint.y) ? loveLetterPoint.y : SURFACE_Y;
    return { x: loveLetterPoint.x, y: loveLetterBaseY + 1.9, z: loveLetterPoint.z };
  }
  return { x: state.human.x, y: SURFACE_Y + 2.35, z: state.human.z };
}

function getActiveActor() {
  if (state.active === "frog") return state.frog;
  if (state.active === "elephant") return state.elephant;
  if (state.active === "crocodile") return state.crocodile;
  return state.human;
}

function buttonPoint() {
  return state.scene.id === SCENES.LEVEL_ONE ? LEVEL_ONE_BUTTON : TUTORIAL_BUTTON;
}

function currentLoveLetterPoint() {
  if (state.scene.id === SCENES.LEVEL_ONE) return currentLevelOneLoveLetterPoint();
  return SPELLBOOK;
}

function currentLevelOneLoveLetterPoint() {
  if (!state.levelOne.blueBloomReleased || state.levelOne.blueBloomDocked) return LEVEL_ONE_LOVE_LETTER_POINT;
  const driftT = levelOneBloomDriftProgress();
  const riseT = easeOutCubic(clamp(
    (state.levelOne.blueBloomRevealElapsed - LEVEL_ONE_BLUE_BLOOM_TIMING.loveLetterSurfaceAt) /
      LEVEL_ONE_BLUE_BLOOM_TIMING.loveLetterRiseSeconds,
    0,
    1
  ));
  const rightMat = LEVEL_ONE_BLUE_BLOOM_MATS.right;
  const heldX = rightMat.held.x + 0.22;
  const heldZ = rightMat.held.z + 0.12;
  return {
    x: THREE.MathUtils.lerp(heldX, LEVEL_ONE_LOVE_LETTER_POINT.x, driftT),
    y: THREE.MathUtils.lerp(SURFACE_Y - 0.56, LEVEL_ONE_LOVE_LETTER_POINT.y, riseT),
    z: THREE.MathUtils.lerp(heldZ, LEVEL_ONE_LOVE_LETTER_POINT.z, driftT)
  };
}

function currentLoveLetterCollectable() {
  if (!state.reveals.spellbook) return false;
  if (state.scene.id === SCENES.LEVEL_ONE) return state.levelOne.blueBloomDocked;
  return true;
}

function resetFrogAiForScene() {
  state.frogAi = {
    enabled: true,
    everPossessed: false,
    target: { x: state.frog.x, z: state.frog.z },
    timer: 0,
    hop: 0,
    mode: state.scene.id === SCENES.LEVEL_ONE || state.scene.id === SCENES.LEVEL_TWO || state.scene.id === SCENES.LEVEL_THREE ? "patrol" : "idle",
    doorwayClear: false,
    currentSide: frogCurrentSide(),
    targetSource: "patrol",
    usesHumanAsTarget: false,
    celebrationPerch: null,
    totalMoveDistance: 0,
    lastMoveDistance: 0
  };
}

function sceneAllowsInput() {
  if (state.scene.id === SCENES.HOME) return state.home.phase === "play" && !state.home.exitConfirmVisible;
  if (state.scene.id === SCENES.LEVEL_ONE) return state.levelOne.phase === "play";
  if (state.scene.id === SCENES.LEVEL_TWO) return state.levelTwo.phase === "play";
  if (state.scene.id === SCENES.LEVEL_THREE) return state.levelThree.phase === "play";
  return true;
}

function currentLoveLetterId() {
  if (state.scene.id === SCENES.LEVEL_ONE) return LEVEL_ONE_LOVE_LETTER_ID;
  if (state.scene.id === SCENES.LEVEL_TWO) return LEVEL_TWO_LOVE_LETTER_ID;
  return TUTORIAL_LOVE_LETTER_ID;
}

function directionName(vector) {
  if (Math.abs(vector.x) > Math.abs(vector.z)) {
    return vector.x > 0 ? { x: 1, z: 0, name: "east" } : { x: -1, z: 0, name: "west" };
  }
  return vector.z > 0 ? { x: 0, z: 1, name: "south" } : { x: 0, z: -1, name: "north" };
}

function directionToRotation(direction) {
  return Math.atan2(direction.x, direction.z);
}


function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function canTransferToFrog(graceRadius = 0) {
  return distance2D(state.human, state.frog) <= POSSESSION_RADIUS + graceRadius;
}

function canUseElephantCubeling() {
  return state.scene.id === SCENES.LEVEL_TWO &&
    state.levelTwo.elephantSpawned &&
    Boolean(state.cubelings.elephant?.unlocked);
}

function canUseCrocodileCubeling() {
  return state.scene.id === SCENES.LEVEL_THREE &&
    Boolean(state.levelThree.crocodileSpawned) &&
    Boolean(state.levelThree.crocodileControlAvailable) &&
    Boolean(state.cubelings.crocodile?.unlocked) &&
    Boolean(state.cubelings.crocodile?.controllable);
}

function clearHumanFromElephantExitLane() {
  if (state.scene.id !== SCENES.LEVEL_TWO || !state.levelTwo.elephantSpawned) return;
  if (!levelTwoRedPlatformAt(state.elephant) && state.levelTwo.elephantSurfaceId !== "red-elevator-a") return;
  const targetX = LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxX - state.human.radius;
  const targetZ = clamp(
    state.human.z,
    LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minZ + state.human.radius,
    LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxZ - state.human.radius
  );
  if (!collidesAt(state.human, targetX, targetZ, { ignoreActor: true })) {
    state.human.x = targetX;
    state.human.z = targetZ;
    state.levelTwo.humanSurfaceId = null;
  }
}

function canTransferToElephant(graceRadius = 0) {
  return canUseElephantCubeling() &&
    distance2D(state.human, state.elephant) <= POSSESSION_RADIUS + graceRadius;
}

function canTransferToCrocodile(graceRadius = 0) {
  return canUseCrocodileCubeling() &&
    distance2D(state.human, state.crocodile) <= POSSESSION_RADIUS + graceRadius;
}

function availableTransferTargets() {
  const targets = [];
  if (state.reveals.frog) {
    targets.push({ key: "frog", actor: state.frog, distance: distance2D(state.human, state.frog) });
  }
  if (canUseElephantCubeling()) {
    targets.push({ key: "elephant", actor: state.elephant, distance: distance2D(state.human, state.elephant) });
  }
  if (canUseCrocodileCubeling()) {
    targets.push({ key: "crocodile", actor: state.crocodile, distance: distance2D(state.human, state.crocodile) });
  }
  return targets.sort((a, b) => a.distance - b.distance);
}

function nearestTransferTarget(graceRadius = 0) {
  return availableTransferTargets().find((target) => target.distance <= POSSESSION_RADIUS + graceRadius) || null;
}

function nearestAvailableCubeling() {
  return availableTransferTargets()[0] || null;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutSmooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function lerpAngle(from, to, amount) {
  const delta = normalizeAngle(to - from);
  return normalizeAngle(from + delta * amount);
}

function roundedPoint(actor) {
  return { x: Number(actor.x.toFixed(2)), z: Number(actor.z.toFixed(2)), facing: actor.facing.name };
}

function frogUnlockStep() {
  return frogUnlockStepForState(state);
}

function currentVisibleAssets() {
  return currentVisibleAssetsForState(state, SCENES);
}

function renderGameToText() {
  const levelThreeTotemButton = LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.find((button) => button.id === "level3TotemGreenButton");
  const levelThreeRaftPosition = currentLevelThreeTotemRaftPosition();
  const levelThreeLilyContract = levelThreeLilyPadSpatialContract();
  const levelThreeRaftPath = levelThreeRaftPathContract();
  const levelThreeOpenedRaftGates = state.levelThree.totemRaftOpenedGates || [];
  const redButtonADistanceFromPivot = Number(distance2D(
    LEVEL_THREE_BRIDGE_PIVOT.position,
    LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.find((marker) => marker.id === "level3BridgeDestinationRedA")?.position || LEVEL_THREE_BRIDGE_PIVOT.position
  ).toFixed(2));
  return JSON.stringify({
  title: "Lumina3D",
  ready: state.ready,
  error: state.error,
  activeActor: state.active,
  scene: {
    id: state.scene.id,
    phase: state.scene.phase,
    titleCardVisible: state.scene.titleCardVisible,
    titleCardText: state.scene.titleCardText,
    fadeVisible: state.scene.fadeVisible
  },
  human: roundedPoint(state.human),
  frog: roundedPoint(state.frog),
  elephant: roundedPoint(state.elephant),
  crocodile: roundedPoint(state.crocodile),
  tutorial: {
    stepIndex: state.tutorialIndex,
    stepId: currentStepId(),
    unlockStep: frogUnlockStep(),
    maxTutorialIndexReached: state.maxTutorialIndexReached,
    prompt: currentPrompt(),
    complete: state.tutorialComplete,
    skipped: state.tutorialSkipped,
    modalVisible: state.skipModal.visible,
    modalReason: state.skipModal.reason,
    nudge: {
      id: state.skipNudge.id,
      count: state.skipNudge.count,
      lastAt: Number(state.skipNudge.lastAt.toFixed(2))
    },
    recovery: {
      stranded: Boolean(state.tutorialRecovery?.stranded),
      phase: tutorialRecoveryPhase(),
      elapsed: Number(tutorialRecoveryElapsed().toFixed(2)),
      autoPressAllowed: tutorialRecoveryAutoPressAllowed(),
      rescueNudgeActive: tutorialRecoveryRescueNudgeActive(),
      resetPromptShown: Boolean(state.tutorialRecovery?.resetPromptShown),
      characterLineShown: Boolean(state.tutorialRecovery?.characterLineShown)
    }
  },
  hud: {
    tutorialBannerAttentionKey,
    tutorialBannerAnimating: Boolean(hud.tutorialBanner?.classList.contains("tutorial-banner-attention"))
  },
  controlsPanel: {
    open: state.controlsOpen,
    buttonLabel: "Controls",
    rows: ["Move: WASD / Arrows", "Transfer: Shift", "Rotate Camera: Q / E", "Frog Cubeling Jump: Space", "Reset: R Testing Only", "Debug Jump: 1 / 2 / 3 / 4 / 5"]
  },
  reveal: {
    rightFloor: state.reveals.rightFloor,
    rightFloorDroppingIn: state.rightFloorReveal.active,
    frogEcho: state.reveals.frogEcho,
    frogTotem: state.reveals.frogTotem,
    frog: state.reveals.frog,
    barrier: state.reveals.barrier,
    button: state.reveals.button,
    loveLetter: state.reveals.spellbook,
    frogDroppingIn: state.frogReveal.active
  },
  cubelings: {
    frog: {
      name: "Frog Cubeling",
      unlocked: state.cubelings.frog.unlocked,
      unlockedThisTutorial: state.cubelings.frog.unlockedThisTutorial,
      persistentUnlocked: state.unlocks.frogCubeling
    },
    elephant: {
      name: "Elephant Cubeling",
      unlocked: Boolean(state.cubelings.elephant?.unlocked),
      unlockedPending: Boolean(state.cubelings.elephant?.unlockedPending),
      active: state.active === "elephant",
      spawned: Boolean(state.cubelings.elephant?.spawned),
      speed: LEVEL_TWO_ELEPHANT_SPEED,
      behavior: "slow grounded actor after Totem unlock; stationary when unpossessed; heavy enough for red buttons"
    },
    crocodile: {
      name: "Crocodile Cubeling",
      unlocked: Boolean(state.cubelings.crocodile?.unlocked),
      unlockedPending: Boolean(state.cubelings.crocodile?.unlockedPending),
      active: state.active === "crocodile",
      spawned: Boolean(state.cubelings.crocodile?.spawned),
      controllable: Boolean(state.cubelings.crocodile?.controllable),
      radius: LEVEL_THREE_CROCODILE_RADIUS,
      speed: LEVEL_THREE_CROCODILE_SPEED,
      waterMovement: "level-three-only land and water movement after Crocodile Totem collection",
      behavior: "Phase 3A controllable amphibious Cubeling; no cargo, ferrying, red buttons, bridge cycling, or Love Letter collection"
    }
  },
  persistentUnlocks: {
    frogCubeling: state.unlocks.frogCubeling,
    storageKey: UNLOCK_STORAGE_KEY
  },
  frogEcho: {
    name: "Frog Echo",
    visible: state.reveals.frogEcho,
    active: false,
    solid: false,
    x: START.frog.x,
    z: START.frog.z,
    radius: FROG_ECHO_RADIUS,
    tint: "muted grey-green",
    opacity: FROG_ECHO_OPACITY,
    nextDialogueIndex: state.frogEcho.promptIndex % FROG_ECHO_LINES.length,
    accessibility: "transparent grey frog silhouette plus muted ground ring, sparkles, speech label, and render text name"
  },
  frogTotem: {
    name: "Frog Cubeling Totem",
    visible: state.reveals.frogTotem,
    collected: state.frogTotem.collected,
    collectibleBy: "human",
    x: FROG_TOTEM.x,
    z: FROG_TOTEM.z,
    radius: FROG_TOTEM_RADIUS,
    visualScale: FROG_TOTEM_VISUAL_SCALE,
    visualStyle: "small warm-gold floating frog charm with glow ring",
    distanceFromEcho: Number(distance2D(FROG_TOTEM, START.frog).toFixed(2)),
    droppingIn: state.frogTotemReveal.active,
    nextDialogueIndex: state.frogTotem.promptIndex % FROG_TOTEM_LINES.length
  },
  celebration: {
    active: state.celebration.active,
    elapsed: Number(state.celebration.elapsed.toFixed(2)),
    modalVisible: state.celebration.modalVisible,
    freeMode: state.celebration.freeMode,
    awaitingContinue: state.celebration.awaitingContinue,
    continuePromptVisible: state.celebration.continuePromptVisible,
    cameraOrbiting: state.celebration.active,
    animationStage: state.celebration.animationStage,
    heartLoopActive: state.celebration.active,
    heartBurstCount: state.celebration.heartBurstCount || 0,
    frogCelebrating: state.celebration.active && state.frogAi.mode === "celebrating",
    frogDistanceFromHuman: Number(distance2D(state.frog, state.human).toFixed(2)),
    choiceLabels: [
      "Next Level",
      state.scene.id === SCENES.TUTORIAL ? "Reset Tutorial Level" : "Reset Level",
      "Continue Free Mode",
      "Main Menu Coming Soon"
    ],
    disabledChoices: levelCompleteNextLevelEnabled() ? ["Main Menu Coming Soon"] : ["Next Level", "Main Menu Coming Soon"]
  },
  loveLetterMessage: {
    id: state.loveLetterMessage.id,
    title: state.loveLetterMessage.title,
    text: state.loveLetterMessage.text,
    visible: state.loveLetterMessage.visible,
    domOpen: Boolean(hud.loveLetterModal?.classList.contains("is-open")),
    domHidden: Boolean(hud.loveLetterModal?.hidden),
    domDisplay: hud.loveLetterModal ? getComputedStyle(hud.loveLetterModal).display : "",
    domOpacity: hud.loveLetterModal ? Number(getComputedStyle(hud.loveLetterModal).opacity) : 0,
    shown: state.loveLetterMessage.shown,
    dismissed: state.loveLetterMessage.dismissed,
    delaySeconds: LOVE_LETTER_MESSAGE_DELAY_SECONDS,
    inputBufferSeconds: LOVE_LETTER_MESSAGE_INPUT_BUFFER_SECONDS,
    inputBufferRemaining: Number(Math.max(0, state.loveLetterMessage.inputBufferUntil - state.elapsed).toFixed(2)),
    blocksContinue: loveLetterMessageBlocksContinue()
  },
  speech: {
    visible: !hud.speech?.hidden,
    text: getSpeechBubble()?.text || "",
    anchor: getSpeechBubble()?.anchor || "",
    queueLength: state.speechQueue.length,
    sequenceActive: state.speechSequenceActive,
    activeAnchor: getSpeechBubble()?.anchor || "",
    secondaryVisible: !hud.speechSecondary?.hidden,
    secondaryText: getSecondarySpeechBubble()?.text || "",
    secondaryAnchor: getSecondarySpeechBubble()?.anchor || ""
  },
  camera: {
    yaw: Number(state.cameraYaw.toFixed(3)),
    targetYaw: Number(state.targetCameraYaw.toFixed(3)),
    zoom: Number(camera.zoom.toFixed(3)),
    activeSurfaceLift: Number((state.cameraActiveSurfaceLift || 0).toFixed(2)),
    highElevationZoomActive: Boolean(state.cameraHighElevationZoomActive),
    targetY: Number((state.cameraTargetY || SURFACE_Y).toFixed(2)),
    movement: state.devEditor.open ? "dev-editor-free-camera" : "camera-relative",
    devEditor: devCameraSnapshot(state)
  },
  frogAi: {
    active: state.reveals.frog && state.active !== "frog" && !state.celebration.modalVisible,
    everPossessed: state.frogAi.everPossessed,
    mode: state.frogAi.mode,
    target: { x: Number(state.frogAi.target.x.toFixed(2)), z: Number(state.frogAi.target.z.toFixed(2)) },
    hop: Number(state.frogAi.hop.toFixed(2)),
    doorwayClear: state.frogAi.doorwayClear,
    inDoorwayZone: pointInDoorwayZone(state.frog, state.frog.radius),
    currentSide: frogCurrentSide(),
    targetSource: state.frogAi.targetSource,
    usesHumanAsTarget: false,
    patrolZone: roundedZone(frogPatrolZone(frogCurrentSide())),
    lastMoveDistance: Number(state.frogAi.lastMoveDistance.toFixed(3)),
    totalMoveDistance: Number(state.frogAi.totalMoveDistance.toFixed(2)),
    patrolSpeed: FROG_PATROL_SPEED,
    patrolPauseMin: FROG_PATROL_PAUSE_MIN,
    patrolPauseMax: FROG_PATROL_PAUSE_MAX
  },
  frogJump: {
    active: Boolean(state.frogJump),
    currentLift: Number(state.lastJumpClearance.currentLift.toFixed(2)),
    peakLift: Number(state.lastJumpClearance.peakLift.toFixed(2)),
    barrierTopHeight: BARRIER_TOP_HEIGHT,
    clearsBarrier: state.lastJumpClearance.clearsBarrier
  },
  frogMovement: { hopPhase: Number(state.frogMoveHop.toFixed(2)), playerHopHeight: FROG_SMALL_HOP_HEIGHT },
  button: {
    x: buttonPoint().x,
    z: buttonPoint().z,
    visible: state.reveals.button,
    pressed: state.buttonPressed,
    asset: "kaykit-platformer-button-blue",
    pressedVisual: Boolean(markerMeshes.buttonTop && markerMeshes.buttonTop.position.y <= BUTTON_TOP_PRESSED_Y + 0.001)
  },
  doorway: {
    barrierColumn: WALL_COLUMN,
    doorRow: DOOR_ROW,
    open: state.doorwayOpen,
    clearZone: {
      x: Number(doorwayClearZone().x.toFixed(2)),
      z: Number(doorwayClearZone().z.toFixed(2)),
      halfX: Number(doorwayClearZone().halfX.toFixed(2)),
      halfZ: Number(doorwayClearZone().halfZ.toFixed(2))
    }
  },
  reward: {
    name: REWARD_NAME,
    x: Number(currentLoveLetterPoint().x.toFixed(2)),
    y: Number((Number.isFinite(currentLoveLetterPoint().y) ? currentLoveLetterPoint().y : SURFACE_Y).toFixed(2)),
    z: Number(currentLoveLetterPoint().z.toFixed(2)),
    visible: state.reveals.spellbook,
    collectable: currentLoveLetterCollectable(),
    droppingIn: state.loveLetterReveal.active,
    wiggling: state.loveLetterReveal.active,
    revealedBeforeButton: state.loveLetterAttention.revealedBeforeButton,
    revealReason: state.loveLetterAttention.revealReason,
    attentionActive: state.loveLetterAttention.bounceElapsed > 0,
    attentionBurstCount: state.loveLetterAttention.attentionBurstCount,
    lastAttentionReason: state.loveLetterAttention.lastAttentionReason,
    buttonReactionCount: state.loveLetterAttention.buttonReactionCount,
    idleReminderCount: state.loveLetterAttention.idleReminderCount,
    reminderTimer: Number(state.loveLetterAttention.reminderTimer.toFixed(2)),
    firstCalloutProtected: state.elapsed < state.loveLetterAttention.protectSpeechUntil,
    collected: state.spellbookCollected,
    collectibleBy: "human",
    heartAsset: "heart_red",
    blocksFrog: true,
    blockRadius: LOVE_LETTER_BLOCK_RADIUS,
    frogBlocked: state.loveLetterLesson.frogBlocked,
    frogBlockCount: state.loveLetterLesson.frogBlockCount,
    humanPrompted: state.loveLetterLesson.humanPrompted,
    lessonPrompt: "The Frog Cubeling can't collect the Love Letter. Switch back to your character to pick it up.",
    rewardActive: state.reward.active,
    particleCount: state.particles.length
  },
  barrier: {
    dropInActive: state.barrierReveal.active,
    endCapAsset: "barrier_colum_half",
    endCapAnchor: "column_outer_edge_to_floor_boundary",
    floorEdgeMinZ: Number(FLOOR_EDGE_MIN_Z.toFixed(2)),
    floorEdgeMaxZ: Number(FLOOR_EDGE_MAX_Z.toFixed(2)),
    columnEdgeOffset: Number(BARRIER_END_CAP_COLUMN_EDGE_OFFSET.toFixed(2)),
    endCapCenters: barrierEndCapMeshes.map((mesh) => ({
      label: mesh.userData.endCapLabel,
      z: Number(mesh.position.z.toFixed(2)),
      boundaryZ: Number(mesh.userData.boundaryZ.toFixed(2)),
      columnEdgeOffset: Number(mesh.userData.columnEdgeOffset.toFixed(2))
    })),
    segmentRevealProgress: [-1, ...Array.from({ length: LEVEL_HEIGHT }, (_, row) => row), LEVEL_HEIGHT]
      .map((index) => ({ index, progress: Number(barrierSegmentProgress(index).toFixed(2)) }))
  },
  transfer: {
    radius: POSSESSION_RADIUS,
    distanceOnly: true
  },
  home: {
    noteVisible: state.home.noteVisible,
    noteRead: state.home.noteRead,
    noteZoneInside: state.home.noteZoneInside,
    noteOpenCount: state.home.noteOpenCount,
    exitReady: state.home.exitReady,
    exitDirection: state.home.exitDirection,
    exitZoneInside: state.home.exitZoneInside,
    exitConfirmVisible: state.home.exitConfirmVisible,
    exitConfirmOpenCount: state.home.exitConfirmOpenCount,
    arrowVisible: state.home.arrowVisible,
    trailHintShown: state.home.trailHintShown,
    trailHintBursts: state.home.trailHintBursts,
    postNoteLineShown: state.home.postNoteLineShown,
    trailExplorationLineShown: state.home.trailExplorationLineShown,
    trailHeartsDisabled: true,
    trailHeartCount: state.particles.filter((particle) => particle.kind === "home-trail-heart").length,
    houseColliders: sceneObjectColliders
      .filter((collider) => collider.scene === SCENES.HOME && collider.label.startsWith("home-house"))
      .map((collider) => ({
        label: collider.label,
        x: Number(collider.x.toFixed(2)),
        z: Number(collider.z.toFixed(2)),
        halfX: Number(collider.halfX.toFixed(2)),
        halfZ: Number(collider.halfZ.toFixed(2))
      })),
    notePosition: {
      x: Number(HOME_POINTS.note.x.toFixed(2)),
      z: Number(HOME_POINTS.note.z.toFixed(2)),
      radius: HOME_NOTE_RADIUS
    },
    exitPosition: {
      x: Number(HOME_POINTS.exit.x.toFixed(2)),
      z: Number(HOME_POINTS.exit.z.toFixed(2)),
      radius: HOME_EXIT_RADIUS
    },
    phase: state.home.phase
  },
  levelOne: {
    phase: state.levelOne.phase,
    waterBlocked: !state.levelOne.blueBloomDocked,
    bridgeComplete: state.levelOne.bridgeComplete,
    bridgeAsset: state.levelOne.bridgeAsset,
    crossingType: "blue-bloom-crossing",
    blueBloomReleased: state.levelOne.blueBloomReleased,
    blueBloomRevealActive: state.levelOne.blueBloomRevealActive,
    blueBloomRevealElapsed: Number(state.levelOne.blueBloomRevealElapsed.toFixed(2)),
    blueBloomDocked: state.levelOne.blueBloomDocked,
    blueBloomProgress: Number(levelOneBloomProgress().toFixed(2)),
    loveLetterSurfaced: Boolean(state.levelOne.loveLetterSurfaced),
    crossingActorLift: LEVEL_ONE_CROSSING_ACTOR_LIFT,
    lilyPad: {
      id: LEVEL_ONE_LILY_PAD.id,
      x: Number(LEVEL_ONE_LILY_PAD.position.x.toFixed(2)),
      z: Number(LEVEL_ONE_LILY_PAD.position.z.toFixed(2)),
      halfX: LEVEL_ONE_LILY_PAD.halfX,
      halfZ: LEVEL_ONE_LILY_PAD.halfZ,
      visualScale: LEVEL_ONE_LILY_PAD.visualScale,
      frogWalkableBeforeDock: true,
      humanWalkableAfterDock: state.levelOne.blueBloomDocked
    },
    blueBloomMats: Object.values(LEVEL_ONE_BLUE_BLOOM_MATS).map((mat) => ({
      id: mat.id,
      held: { x: Number(mat.held.x.toFixed(2)), z: Number(mat.held.z.toFixed(2)) },
      docked: { x: Number(mat.docked.x.toFixed(2)), z: Number(mat.docked.z.toFixed(2)) },
      halfX: mat.halfX,
      halfZ: mat.halfZ,
      walkable: state.levelOne.blueBloomDocked
    })),
    blueBloomLatch: {
      x: Number(LEVEL_ONE_BLUE_BLOOM_LATCH.position.x.toFixed(2)),
      z: Number(LEVEL_ONE_BLUE_BLOOM_LATCH.position.z.toFixed(2)),
      open: state.levelOne.blueBloomReleased
    },
    loveLetterPoint: {
      x: Number(LEVEL_ONE_LOVE_LETTER_POINT.x.toFixed(2)),
      y: Number(LEVEL_ONE_LOVE_LETTER_POINT.y.toFixed(2)),
      z: Number(LEVEL_ONE_LOVE_LETTER_POINT.z.toFixed(2)),
      visualX: Number(currentLoveLetterPoint().x.toFixed(2)),
      visualY: Number((Number.isFinite(currentLoveLetterPoint().y) ? currentLoveLetterPoint().y : SURFACE_Y).toFixed(2)),
      visualZ: Number(currentLoveLetterPoint().z.toFixed(2)),
      collectable: currentLoveLetterCollectable(),
      revealedAfterDock: state.reveals.spellbook && state.levelOne.blueBloomDocked
    },
    frogJumpZone: {
      x: Number(LEVEL_ONE_JUMP_ZONE.x.toFixed(2)),
      z: Number(LEVEL_ONE_JUMP_ZONE.z.toFixed(2)),
      radius: LEVEL_ONE_JUMP_ZONE.radius
    },
    waterColumns: LEVEL_ONE_WATER_COLUMNS,
    buttonPlacement: "far-side-off-axis",
    loveLetterVisibleFromStart: false,
    loveLetterVisibleAfterDock: state.scene.id === SCENES.LEVEL_ONE && state.reveals.spellbook,
    frogAvailableFromStart: state.scene.id === SCENES.LEVEL_ONE && state.reveals.frog,
    hasFrogEcho: state.scene.id === SCENES.LEVEL_ONE ? false : state.reveals.frogEcho,
    hasFrogTotem: state.scene.id === SCENES.LEVEL_ONE ? false : state.reveals.frogTotem,
    hintStage: state.levelOne.hintStage,
    frogWaterBlockedCount: state.levelOne.frogWaterBlockedCount,
    frogWaterFeedback: {
      line: "I need to jump, not swim.",
      cooldownSeconds: LEVEL_ONE_FROG_WATER_SPEECH_COOLDOWN,
      lastPromptAt: Number.isFinite(state.levelOne.lastFrogWaterPromptAt)
        ? Number(state.levelOne.lastFrogWaterPromptAt.toFixed(2))
        : null
    }
  },
  levelTwo: {
    phase: state.levelTwo.phase,
    titleCardVisible: state.scene.id === SCENES.LEVEL_TWO && state.scene.titleCardVisible,
    mapShape: "square",
    width: LEVEL_TWO_WIDTH,
    height: LEVEL_TWO_HEIGHT,
    complete: state.levelTwo.complete,
    frogAvailableFromStart: state.scene.id === SCENES.LEVEL_TWO && state.reveals.frog,
    elevatedGoalVisible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elevatedGoalVisible,
    placeholderLoveLetterVisible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.placeholderLoveLetterVisible,
    placeholderLoveLetterCollectable: state.levelTwo.placeholderLoveLetterCollectable || levelTwoLoveLetterReachableByHuman(),
    placeholderLoveLetterPosition: {
      x: Number(LEVEL_TWO_POINTS.placeholderLoveLetter.x.toFixed(2)),
      y: Number(LEVEL_TWO_PLACEHOLDER_LOVE_LETTER_Y.toFixed(2)),
      z: Number(LEVEL_TWO_POINTS.placeholderLoveLetter.z.toFixed(2))
    },
    placeholderLoveLetterClearance: Number(LEVEL_TWO_LOVE_LETTER_CLEARANCE.toFixed(2)),
    elevatedGoalTileCount: LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.length,
    centralMountain: {
      visible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elevatedGoalVisible,
      centered: true,
      frogJumpable: false,
      layerCount: LEVEL_TWO_MOUNTAIN_LAYER_COUNT,
      peakY: Number(LEVEL_TWO_MOUNTAIN_PEAK_Y.toFixed(2)),
      firstTierBottomY: Number(LEVEL_TWO_TIER_BASE_Y.toFixed(2)),
      groundContactGap: Number(Math.max(0, LEVEL_TWO_TIER_BASE_Y - SURFACE_Y).toFixed(2)),
      tierStepY: Number(LEVEL_TWO_TIER_STEP_Y.toFixed(2)),
      lowerTiersSupported: true,
      upperTiersMayFloat: true,
      tileCount: LEVEL_TWO_CENTRAL_MOUNTAIN_TILES.length,
      supportTileCount: LEVEL_TWO_CENTRAL_MOUNTAIN_SUPPORT_TILES.length,
      terraces: LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS.map((tier) => ({
        id: tier.id,
        name: tier.name,
        tier: tier.tier,
        tileCount: tier.tiles.length,
        topY: Number(tier.topY.toFixed(2))
      }))
    },
    frogSideLedge: {
      visible: state.scene.id === SCENES.LEVEL_TWO,
      tileCount: LEVEL_TWO_FROG_SIDE_LEDGE_TILES.length,
      heightAboveGround: Number(LEVEL_TWO_FROG_SIDE_LEDGE_HEIGHT.toFixed(2)),
      frogJumpable: true,
      purpose: "future Frog ledge for Elephant Totem path"
    },
    frogJumpableLedges: LEVEL_TWO_FROG_JUMPABLE_LEDGES.map((ledge) => ({
      id: ledge.id,
      label: ledge.label,
      frogJumpable: ledge.frogJumpable,
      tileCount: ledge.tiles.length,
      heightAboveGround: Number(ledge.heightAboveGround.toFixed(2)),
      landingPoint: {
        x: Number(ledge.landingPoint.x.toFixed(2)),
        z: Number(ledge.landingPoint.z.toFixed(2))
      },
      approachZone: {
        x: Number(ledge.approachZone.x.toFixed(2)),
        z: Number(ledge.approachZone.z.toFixed(2)),
        radius: ledge.approachZone.radius
      }
    })),
    frogSurfaceId: state.levelTwo.frogSurfaceId,
    humanSurfaceId: state.levelTwo.humanSurfaceId,
    humanSurfaceLift: Number(levelTwoActorLiftAt(state.human).toFixed(2)),
    humanRampProgress: Number(levelTwoRampProgressAt(state.human).toFixed(2)),
    lastFrogJumpResult: state.levelTwo.lastFrogJumpResult,
    lastFrogJumpReason: state.levelTwo.lastFrogJumpReason,
    blueButton: {
      visible: state.scene.id === SCENES.LEVEL_TWO,
      pressed: state.levelTwo.blueButtonPressed,
      collectibleBy: "frog",
      x: Number(LEVEL_TWO_POINTS.blueButton.x.toFixed(2)),
      z: Number(LEVEL_TWO_POINTS.blueButton.z.toFixed(2)),
      onLedgeId: "blue-button-ledge"
    },
    blueRamp: {
      visible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.blueRampActive,
      active: state.levelTwo.blueRampActive,
      asset: "kaykit-platformer-blue-ramp",
      id: LEVEL_TWO_BLUE_RAMP.id,
      walkableBy: state.levelTwo.blueRampActive ? "human" : "none",
      revealActive: Boolean(state.levelTwo.blueRampRevealActive),
      revealProgress: Number(clamp(
        (state.levelTwo.blueRampRevealElapsed || 0) / (LEVEL_TWO_BLUE_RAMP.revealSeconds || 0.72),
        0,
        1
      ).toFixed(2)),
      dormantPanel: LEVEL_TWO_BLUE_RAMP.dormantPanel ? {
        id: LEVEL_TWO_BLUE_RAMP.dormantPanel.id,
        visible: state.scene.id === SCENES.LEVEL_TWO &&
          (!state.levelTwo.blueRampActive || state.levelTwo.blueRampRevealActive),
        visualOnly: true,
        walkableBy: "none",
        collider: "none",
        x: Number(LEVEL_TWO_BLUE_RAMP.dormantPanel.position.x.toFixed(2)),
        y: Number(LEVEL_TWO_BLUE_RAMP.dormantPanel.y.toFixed(2)),
        z: Number(LEVEL_TWO_BLUE_RAMP.dormantPanel.position.z.toFixed(2)),
        width: Number(LEVEL_TWO_BLUE_RAMP.dormantPanel.width.toFixed(2)),
        depth: Number(LEVEL_TWO_BLUE_RAMP.dormantPanel.depth.toFixed(2))
      } : null,
      minX: Number(LEVEL_TWO_BLUE_RAMP.minX.toFixed(2)),
      maxX: Number(LEVEL_TWO_BLUE_RAMP.maxX.toFixed(2)),
      minZ: Number(LEVEL_TWO_BLUE_RAMP.minZ.toFixed(2)),
      maxZ: Number(LEVEL_TWO_BLUE_RAMP.maxZ.toFixed(2)),
      targetLift: Number(LEVEL_TWO_BLUE_RAMP.targetLift.toFixed(2)),
      actorLiftClearance: Number((LEVEL_TWO_BLUE_RAMP.actorLiftClearance || 0).toFixed(2)),
      groundExitProgress: Number((LEVEL_TWO_BLUE_RAMP.groundExitProgress || 0).toFixed(2)),
      lowEnd: {
        x: Number(LEVEL_TWO_BLUE_RAMP.lowEnd.x.toFixed(2)),
        z: Number(LEVEL_TWO_BLUE_RAMP.lowEnd.z.toFixed(2))
      },
      highEnd: {
        x: Number(LEVEL_TWO_BLUE_RAMP.highEnd.x.toFixed(2)),
        z: Number(LEVEL_TWO_BLUE_RAMP.highEnd.z.toFixed(2))
      }
    },
    elephantTotemHill: {
      visible: state.scene.id === SCENES.LEVEL_TWO,
      frogJumpable: false,
      tileCount: LEVEL_TWO_ELEPHANT_TOTEM_HILL_TILES.length,
      heightAboveGround: Number(LEVEL_TWO_ELEPHANT_TOTEM_HILL.heightAboveGround.toFixed(2)),
      reachableByHuman: state.levelTwo.blueRampActive,
      reachableByFrog: false,
      unsupportedEdges: "blocked-before-fall"
    },
    elephantTotem: {
      name: "Elephant Cubeling Totem",
      visible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected,
      collected: state.levelTwo.elephantTotemCollected,
      collectibleBy: "human",
      x: Number(LEVEL_TWO_POINTS.elephantTotem.x.toFixed(2)),
      z: Number(LEVEL_TWO_POINTS.elephantTotem.z.toFixed(2)),
      radius: LEVEL_TWO_ELEPHANT_TOTEM_HILL.radius,
      asset: "voxel-elephant",
      visualScale: LEVEL_TWO_ELEPHANT_TOTEM_VISUAL_SCALE,
      visualStyle: "small warm-gold floating elephant charm with glow ring",
      unlockMessage: "Elephant Cubeling Found!"
    },
    elephantEcho: {
      name: "Elephant Echo",
      visible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantEchoVisible && !state.levelTwo.elephantAwake,
      awake: state.levelTwo.elephantAwake,
      active: state.levelTwo.elephantAwake,
      solid: false,
      x: Number(LEVEL_TWO_POINTS.elephantEcho.x.toFixed(2)),
      y: Number((LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y).toFixed(2)),
      z: Number(LEVEL_TWO_POINTS.elephantEcho.z.toFixed(2)),
      radius: LEVEL_TWO_ELEPHANT_ECHO_RADIUS,
      asset: "voxel-elephant",
      elevated: (LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y) > SURFACE_Y + 0.5,
      heightAboveGround: Number(Math.max(0, (LEVEL_TWO_POINTS.elephantEcho.y ?? SURFACE_Y) - SURFACE_Y).toFixed(2)),
      surfaceId: null,
      tint: "muted grey-green",
      opacity: LEVEL_TWO_ELEPHANT_ECHO_OPACITY,
      homeAnchor: true,
      spawnsUsableActorThisSlice: true,
      dormantVisualReplacedByElephant: state.levelTwo.elephantAwake,
      nextDialogueIndex: state.levelTwo.elephantEchoPromptIndex % ELEPHANT_ECHO_LINES.length,
      lastSpawnEffectY: Number((state.levelTwo.lastElephantSpawnEffectY || 0).toFixed(2)),
      accessibility: "transparent grey elephant silhouette plus muted ground ring, sparkles, speech label, and render text name"
    },
    elephantCubeling: {
      name: "Elephant Cubeling",
      visible: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantSpawned,
      spawned: state.levelTwo.elephantSpawned,
      unlocked: Boolean(state.cubelings.elephant?.unlocked),
      active: state.active === "elephant",
      x: Number(state.elephant.x.toFixed(2)),
      z: Number(state.elephant.z.toFixed(2)),
      radius: LEVEL_TWO_ELEPHANT_RADIUS,
      speed: LEVEL_TWO_ELEPHANT_SPEED,
      spawnSurfaceId: null,
      surfaceId: state.levelTwo.elephantSurfaceId,
      surfaceLift: Number(levelTwoActorLiftAt(state.elephant).toFixed(2)),
      mostlyStationaryWhenUnpossessed: state.active !== "elephant",
      behavior: "slow grounded movement; holds red buttons when unpossessed; activates Button A for its elevator and Button B for the human elevator"
    },
    loveLetterRoute: {
      id: LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID,
      visible: state.scene.id === SCENES.LEVEL_TWO,
      reachableByHuman: levelTwoLoveLetterReachableByHuman(),
      tileCount: LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_TILES.length,
      heightAboveGround: Number(LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_HEIGHT.toFixed(2)),
      requiresElevatorBTopAligned: state.levelTwo.humanSurfaceId !== LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID,
      elevatorBProgress: Number(levelTwoRedPlatformProgressById("red-elevator-b").toFixed(2)),
      buttonBTerraceTileCount: LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES.length,
      buttonBUsesExistingTier3Terrain: LEVEL_TWO_RED_BUTTON_B_TERRACE_TILES.length === 0,
      routeProof: "fixture walks human from Elevator B upper stop to Love Letter"
    },
    redButtons: LEVEL_TWO_RED_BUTTONS.map((button) => {
      const buttonState = state.levelTwo.redButtons?.[button.id] || {};
      return {
        id: button.id,
        visible: state.scene.id === SCENES.LEVEL_TWO,
        color: "red",
        activationType: button.activationType,
        active: Boolean(buttonState.active),
        heldActor: buttonState.heldActor || "",
        ineligibleActor: buttonState.ineligibleActor || "",
        requiredActor: button.requiredActor,
        linkedPlatformId: button.linkedPlatformId,
        x: Number(button.position.x.toFixed(2)),
        y: Number((levelTwoRedButtonSurfaceY(button) + (button.surfaceClearance || 0)).toFixed(2)),
        surfaceY: Number(levelTwoRedButtonSurfaceY(button).toFixed(2)),
        z: Number(button.position.z.toFixed(2)),
        radius: button.radius,
        surfaceId: button.surfaceId,
        actorEligibility: {
          human: false,
          frog: false,
          elephant: true
        }
      };
    }),
    redPlatforms: LEVEL_TWO_RED_PLATFORMS.map((platform) => {
      const platformState = state.levelTwo.redPlatforms?.[platform.id] || {};
      return {
        id: platform.id,
        visible: state.scene.id === SCENES.LEVEL_TWO,
        color: "red",
        asset: "kaykit-platformer-red-platform-4x4x1",
        linkedButtonId: platform.linkedButtonId,
        progress: Number((platformState.progress || 0).toFixed(2)),
        lift: Number((platformState.lift || 0).toFixed(2)),
        moving: platformState.moving || "idle",
        direction: platformState.direction || platform.initialDirection || "",
        pauseRemaining: Number((platformState.pauseRemaining || 0).toFixed(2)),
        releaseTarget: Number.isFinite(platformState.releaseTarget) ? Number(platformState.releaseTarget.toFixed(2)) : null,
        hasActivated: Boolean(platformState.hasActivated),
        heldBy: platformState.heldBy || "",
        walkableBy: platform.walkableBy,
        x: Number(platform.position.x.toFixed(2)),
        y: Number((platform.baseY + (platformState.lift || 0)).toFixed(2)),
        z: Number(platform.position.z.toFixed(2)),
        minX: Number(platform.minX.toFixed(2)),
        maxX: Number(platform.maxX.toFixed(2)),
        minZ: Number(platform.minZ.toFixed(2)),
        maxZ: Number(platform.maxZ.toFixed(2)),
        maxLift: platform.maxLift,
        surfaceOffset: platform.surfaceOffset || 0,
        topSurfaceY: Number(levelTwoRedButtonSurfaceY({ platformId: platform.id }).toFixed(2)),
        movementRule: platform.movementRule,
        releaseBehavior: platform.releaseBehavior || "",
        endpointPauseSeconds: platform.endpointPauseSeconds || 0,
        topPauseSeconds: platform.topPauseSeconds ?? platform.endpointPauseSeconds ?? 0,
        bottomPauseSeconds: platform.bottomPauseSeconds ?? platform.endpointPauseSeconds ?? 0,
        riderActors: ["human", "frog", "elephant"].filter((actorKey) =>
          levelTwoActorIsOnRedPlatformSurface(state[actorKey], platform)
        )
      };
    }),
    redElevatorA: {
      visible: state.scene.id === SCENES.LEVEL_TWO,
      teachingSequence: "Red Button A can be inspected before Elephant is found; Elephant later provides the needed weight.",
      startsRaised: false,
      upperDockTier: 3,
      upperDockSurfaceY: Number(LEVEL_TWO_ELEPHANT_ECHO_TOP_Y.toFixed(2)),
      topConnection: "red-elevator-a-top-connector-to-tier-3-elephant-route",
      verticalShaftClearance: "outside-central-mountain-column",
      mountainClearanceX: Number((
        (LEVEL_TWO_RED_PLATFORMS[0].position.x - (LEVEL_TWO_RED_PLATFORMS[0].visualHalfFootprint || 0)) -
        (levelTwoTileBounds(LEVEL_TWO_CENTRAL_MOUNTAIN_TIERS[0].tiles).maxX)
      ).toFixed(2)),
      buttonNearEdge: true,
      buttonOffsetFromPlatformCenter: Number(distance2D(LEVEL_TWO_RED_BUTTONS[0].position, LEVEL_TWO_RED_PLATFORMS[0].position).toFixed(2)),
      cyclesWhileHeldByElephant: LEVEL_TWO_RED_PLATFORMS[0].movementRule === "cycle-while-held",
      releaseBehavior: LEVEL_TWO_RED_PLATFORMS[0].releaseBehavior,
      raisesWhenHeldByElephant: true,
      humanRidesThisSlice: false,
      supportsHumanCollision: true,
      supportsHumanRidingIfPlayerBoards: true,
      sideApproachZone: {
        minX: Number(LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minX.toFixed(2)),
        maxX: Number(LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxX.toFixed(2)),
        minZ: Number(LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.minZ.toFixed(2)),
        maxZ: Number(LEVEL_TWO_RED_ELEVATOR_SIDE_APPROACH_ZONE.maxZ.toFixed(2))
      },
      topExitZone: {
        minX: Number(LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minX.toFixed(2)),
        maxX: Number(LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxX.toFixed(2)),
        minZ: Number(LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.minZ.toFixed(2)),
        maxZ: Number(LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.maxZ.toFixed(2)),
        visual: LEVEL_TWO_RED_ELEVATOR_TOP_EXIT_ZONE.visual
      },
      isolated: false,
      connectedToLoveLetterRoute: false,
      invalidFeedback: state.cubelings.elephant?.unlocked
        ? "The Elephant might be heavy enough for this."
        : "This red button needs more weight."
    },
    redElevatorAStartGate: {
      released: Boolean(state.levelTwo.redElevatorAStartGate?.released),
      delayRemaining: Number((state.levelTwo.redElevatorAStartGate?.delayRemaining || 0).toFixed(2)),
      waitingReason: state.levelTwo.redElevatorAStartGate?.waitingReason || "",
      armed: state.levelTwo.elephantSpawned && !state.levelTwo.redElevatorAStartGate?.released
    },
    redElevatorB: {
      visible: state.scene.id === SCENES.LEVEL_TWO,
      teachingSequence: "Elephant holds west-side Red Button B while the human rides Red Elevator B to the Love Letter route.",
      startsRaised: false,
      upperDockTier: 4,
      upperDockSurfaceY: Number(LEVEL_TWO_MOUNTAIN_PEAK_Y.toFixed(2)),
      topConnection: LEVEL_TWO_HUMAN_LOVE_LETTER_ROUTE_ID,
      verticalShaftClearance: "ground restored under platform; no shaft cutout",
      hasShaftCutout: false,
      buttonNearEdge: false,
      buttonOffsetFromPlatformCenter: Number(distance2D(LEVEL_TWO_RED_BUTTONS[1].position, LEVEL_TWO_RED_PLATFORMS[1].position).toFixed(2)),
      cyclesWhileHeldByElephant: LEVEL_TWO_RED_PLATFORMS[1].movementRule === "cycle-while-held",
      releaseBehavior: LEVEL_TWO_RED_PLATFORMS[1].releaseBehavior,
      raisesWhenHeldByElephant: true,
      humanRidesThisSlice: true,
      supportsHumanCollision: true,
      supportsHumanRidingIfPlayerBoards: true,
      connectedToLoveLetterRoute: true,
      invalidFeedback: "Only the Elephant Cubeling is heavy enough for red buttons."
    },
    reservedPlatformStations: LEVEL_TWO_RESERVED_TERRACE_GROUPS.map((station) => ({
      id: station.id,
      role: station.role,
      tier: station.tier,
      tileCount: station.tiles.length
    })),
    redElevatorAGroundClearance: {
      tileCount: LEVEL_TWO_RED_ELEVATOR_A_GROUND_CLEARANCE_TILES.length,
      tiles: LEVEL_TWO_RED_ELEVATOR_A_GROUND_CLEARANCE_TILES.map((tile) => ({
        x: tile.x,
        y: tile.y,
        worldX: Number(sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE).x.toFixed(2)),
        worldZ: Number(sceneGridPoint(LEVEL_TWO_WIDTH, LEVEL_TWO_HEIGHT, tile.x, tile.y, TILE).z.toFixed(2))
      }))
    },
    reservedTerraceTileCount: LEVEL_TWO_RESERVED_TERRACE_TILES.length,
    hasElephantEcho: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantEchoVisible,
    hasElephantTotem: state.scene.id === SCENES.LEVEL_TWO && state.levelTwo.elephantTotemVisible && !state.levelTwo.elephantTotemCollected,
    redButtonsPresent: state.scene.id === SCENES.LEVEL_TWO,
    recallAvailable: false,
    bounds: {
      minX: LEVEL_TWO_BOUNDS.minX,
      maxX: LEVEL_TWO_BOUNDS.maxX,
      minZ: LEVEL_TWO_BOUNDS.minZ,
      maxZ: LEVEL_TWO_BOUNDS.maxZ
    },
    colliderLabels: sceneObjectColliders
      .filter((collider) => collider.scene === SCENES.LEVEL_TWO)
      .map((collider) => collider.label)
  },
  levelThree: {
    phase: state.levelThree.phase,
    titleCardVisible: state.scene.id === SCENES.LEVEL_THREE && state.scene.titleCardVisible,
    mapShape: LEVEL_THREE_MAP_SHAPE,
    width: LEVEL_THREE_WIDTH,
    height: LEVEL_THREE_HEIGHT,
    complete: state.levelThree.complete,
    frogAvailableFromStart: state.scene.id === SCENES.LEVEL_THREE && state.reveals.frog,
    placeholderLoveLetterVisible: state.scene.id === SCENES.LEVEL_THREE && state.levelThree.placeholderLoveLetterVisible,
    placeholderLoveLetterCollectable: Boolean(state.levelThree.placeholderLoveLetterCollectable),
    placeholderLoveLetterPosition: {
      x: Number(LEVEL_THREE_POINTS.placeholderLoveLetter.x.toFixed(2)),
      y: Number(LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y.toFixed(2)),
      z: Number(LEVEL_THREE_POINTS.placeholderLoveLetter.z.toFixed(2))
    },
    waterTileCount: LEVEL_THREE_WATER_TILES.length,
    landTileCount: LEVEL_THREE_LAND_TILES.length,
    pathTileCount: LEVEL_THREE_PATH_TILES.length,
    mostlyWater: LEVEL_THREE_WATER_TILES.length > LEVEL_THREE_LAND_TILES.length,
    startIslandEdgeConnection: {
      connectedToLeftEdge: LEVEL_THREE_START_EDGE_CONNECTION_TILES.some((tile) => tile.x === 0) &&
        LEVEL_THREE_ISLANDS.some((island) => island.id === "level3StartIsland" && LEVEL_THREE_START_EDGE_CONNECTION_TILES.every((tile) =>
          island.tiles.some((islandTile) => islandTile.x === tile.x && islandTile.y === tile.y)
        )),
      tiles: LEVEL_THREE_START_EDGE_CONNECTION_TILES.map((tile) => ({ x: tile.x, y: tile.y }))
    },
    islandCount: LEVEL_THREE_ISLANDS.length,
    islands: LEVEL_THREE_ISLANDS.map((island) => ({
      id: island.id,
      name: island.name,
      role: island.role,
      purpose: island.purpose,
      tileCount: island.tileCount,
      bridgeState: island.bridgeState ?? null,
      x: Number(island.position.x.toFixed(2)),
      z: Number(island.position.z.toFixed(2))
    })),
    islandMarkers: LEVEL_THREE_ISLAND_MARKERS.map((marker) => ({
      id: marker.id,
      objectId: marker.objectId || marker.id,
      name: marker.name,
      role: marker.role,
      purpose: marker.purpose,
      x: Number(marker.position.x.toFixed(2)),
      z: Number(marker.position.z.toFixed(2)),
      editorSelectable: true,
      editorMovable: true
    })),
    placeholders: LEVEL_THREE_PLACEHOLDER_IDS,
    editorSelectableIds: [
      ...LEVEL_THREE_ISLAND_MARKERS.map((marker) => marker.objectId || marker.id),
      ...LEVEL_THREE_PLACEHOLDER_IDS,
      "level_three.love_letter.placeholder"
    ],
    neutralFutureState: {
      level3TotemRaftState: state.levelThree.totemRaftState ?? 0,
      level3TotemRaftDocked: Boolean(state.levelThree.totemRaftDocked),
      level3TotemRaftDrifting: Boolean(state.levelThree.totemRaftDrifting),
      level3TotemRaftGateState: state.levelThree.totemRaftGateState ?? 0,
      level3CrocodileUnlocked: Boolean(state.levelThree.crocodileUnlocked),
      level3BridgeState: state.levelThree.bridgeState ?? 0,
      level3OpeningGreenPressCount: state.levelThree.openingGreenPressCount ?? 0,
      level3CrocodileSpawned: Boolean(state.levelThree.crocodileSpawned),
      level3CrocodileControlAvailable: Boolean(state.levelThree.crocodileControlAvailable)
    },
    phase2AState: {
      implemented: true,
      movingLilyPadTimingDeferred: true,
      humanVisualReviewPending: false,
      totemRaftState: state.levelThree.totemRaftState ?? 0,
      totemRaftDocked: Boolean(state.levelThree.totemRaftDocked),
      totemRaftGateState: state.levelThree.totemRaftGateState ?? 0,
      totemRaftDrifting: Boolean(state.levelThree.totemRaftDrifting),
      totemRaftFromState: state.levelThree.totemRaftFromState ?? 0,
      totemRaftTargetState: state.levelThree.totemRaftTargetState ?? 0,
      totemRaftDriftProgress: Number((state.levelThree.totemRaftDriftProgress || 0).toFixed(2)),
      totemRaftOpenedGates: [...levelThreeOpenedRaftGates],
      crocodileTotemCollected: Boolean(state.levelThree.crocodileTotemCollected),
      crocodileEchoAwake: Boolean(state.levelThree.crocodileEchoAwake),
      crocodileUnlocked: Boolean(state.levelThree.crocodileUnlocked),
      crocodileSpawned: Boolean(state.levelThree.crocodileSpawned),
      crocodileControlAvailable: Boolean(state.levelThree.crocodileControlAvailable),
      frogLaneResetCount: state.levelThree.frogLaneResetCount ?? 0,
      frogWaterBlockedCount: state.levelThree.frogWaterBlockedCount ?? 0,
      frogLaneSurfaceId: state.levelThree.frogLaneSurfaceId || "",
      totemGreenButtonPresses: state.levelThree.totemGreenButtonPresses ?? 0,
      totemGreenButtonPressed: Boolean(state.levelThree.totemGreenButtonPressed),
      totemGreenButtonHeldActor: state.levelThree.totemGreenButtonHeldActor || ""
    },
    phase3AState: {
      implemented: true,
      lilyPadsEnlarged: true,
      frogWalkingWaterResetDisabled: true,
      frogWalkingWaterBehavior: "blocked-with-hint",
      crocodileActorVisual: "generated-crocodile-cubeling-temporary",
      crocodileUnlocked: Boolean(state.levelThree.crocodileUnlocked),
      crocodileSpawned: Boolean(state.levelThree.crocodileSpawned),
      crocodileControlAvailable: Boolean(state.levelThree.crocodileControlAvailable),
      crocodileActive: state.active === "crocodile",
      crocodileWaterMovement: true,
      crocodileCargo: false,
      crocodileFerrying: false,
      bridgeGreenButtonActive: false,
      redButtonActivation: false
    },
    spatialContractRepairState: {
      implemented: true,
      humanVisualReviewPending: true,
      lilyLaneSpacingCorrected: true,
      movingLilyPadTimingDeferred: true,
      centerHubRole: LEVEL_THREE_BRIDGE_PIVOT.role,
      centerHubFootprintTiles: LEVEL_THREE_BRIDGE_PIVOT.footprintTiles,
      bridgeRotationImplemented: false,
      totemRaftDriftImplemented: true,
      totemRaftGated: true,
      dockMarkerFixed: true
    },
    lilyPadLane: LEVEL_THREE_LILY_PAD_PLACEHOLDERS.map((pad) => ({
      id: pad.id,
      name: pad.name,
      x: Number(pad.position.x.toFixed(2)),
      z: Number(pad.position.z.toFixed(2)),
      tileX: pad.tile?.x ?? null,
      tileY: pad.tile?.y ?? null,
      centerTileIsWater: levelThreeTileIsWater(pad.tile),
      trackStart: {
        x: Number(pad.trackStart.x.toFixed(2)),
        z: Number(pad.trackStart.z.toFixed(2))
      },
      trackEnd: {
        x: Number(pad.trackEnd.x.toFixed(2)),
        z: Number(pad.trackEnd.z.toFixed(2))
      },
      trackStartTile: { x: pad.trackStartTile?.x ?? null, y: pad.trackStartTile?.y ?? null },
      trackEndTile: { x: pad.trackEndTile?.x ?? null, y: pad.trackEndTile?.y ?? null },
      trackStartTileIsWater: levelThreeTileIsWater(pad.trackStartTile),
      trackEndTileIsWater: levelThreeTileIsWater(pad.trackEndTile),
      trackStartLandClearance: Number(levelThreeDistanceFromNearestLandTile(pad.trackStart, pad.radius || 0).toFixed(2)),
      trackEndLandClearance: Number(levelThreeDistanceFromNearestLandTile(pad.trackEnd, pad.radius || 0).toFixed(2)),
      visualAsset: "generated-level-one-lily-pad-shared-visual",
      radius: pad.radius,
      walkableRadius: Number((pad.radius + Math.min(state.frog.radius, 0.35) + LEVEL_THREE_FROG_LILY_PAD_SURFACE_PADDING).toFixed(2)),
      staticPhaseOne: false,
      staticPhase2A: true,
      movementImplemented: false,
      splashResetImplemented: false,
      walkingWaterResetImplemented: false,
      frogWalkable: true,
      frogJumpSurface: true,
      movingTimingDeferred: true,
      humanUsable: false
    })),
    lilyPadSpatialContract: levelThreeLilyContract,
    greenButtons: LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.map((button) => ({
      id: button.id,
      name: button.name,
      islandId: button.islandId,
      futureMechanism: button.futureMechanism,
      x: Number(button.position.x.toFixed(2)),
      z: Number(button.position.z.toFixed(2)),
      color: "green",
      visualAsset: "kaykit-platformer-button-green-material-variant",
      repeatableFutureButton: true,
      behaviorImplemented: button.id === "level3TotemGreenButton",
      pressCount: button.id === "level3TotemGreenButton" ? state.levelThree.totemGreenButtonPresses ?? 0 : 0,
      pressed: button.id === "level3TotemGreenButton" ? Boolean(state.levelThree.totemGreenButtonPressed) : false,
      heldActor: button.id === "level3TotemGreenButton" ? state.levelThree.totemGreenButtonHeldActor || "" : "",
      reachableByFrog: button.id === "level3TotemGreenButton",
      linkedMechanismActive: button.id === "level3TotemGreenButton",
      activeForCrocodileThisSlice: false
    })),
    crocodileEcho: {
      id: LEVEL_THREE_CROCODILE_ECHO.id,
      name: LEVEL_THREE_CROCODILE_ECHO.name,
      visible: state.scene.id === SCENES.LEVEL_THREE,
      active: Boolean(state.levelThree.crocodileEchoAwake),
      awake: Boolean(state.levelThree.crocodileEchoAwake),
      solid: false,
      x: Number(LEVEL_THREE_CROCODILE_ECHO.position.x.toFixed(2)),
      z: Number(LEVEL_THREE_CROCODILE_ECHO.position.z.toFixed(2)),
      radius: LEVEL_THREE_CROCODILE_ECHO.radius,
      unlockImplemented: true,
      possessionImplemented: true,
      waterMovementImplemented: true
    },
    crocodileCubeling: {
      name: "Crocodile Cubeling",
      visible: state.scene.id === SCENES.LEVEL_THREE && Boolean(state.levelThree.crocodileSpawned),
      unlocked: Boolean(state.levelThree.crocodileUnlocked),
      spawned: Boolean(state.levelThree.crocodileSpawned),
      active: state.active === "crocodile",
      controllable: Boolean(state.levelThree.crocodileControlAvailable),
      x: Number(state.crocodile.x.toFixed(2)),
      z: Number(state.crocodile.z.toFixed(2)),
      radius: LEVEL_THREE_CROCODILE_RADIUS,
      speed: LEVEL_THREE_CROCODILE_SPEED,
      surfaceId: state.levelThree.crocodileSurfaceId || "",
      waterCapable: true,
      landCapable: true,
      canCollectTotems: false,
      canCollectLoveLetters: false,
      canHoldRedButtons: false,
      canCarryStones: false,
      canCarryHuman: false,
      canCarryCubelings: false,
      generatedVisual: true,
      visualAsset: "generated-crocodile-cubeling-temporary"
    },
    totemRaft: {
      id: LEVEL_THREE_TOTEM_RAFT.id,
      name: LEVEL_THREE_TOTEM_RAFT.name,
      x: Number(levelThreeRaftPosition.x.toFixed(2)),
      z: Number(levelThreeRaftPosition.z.toFixed(2)),
      stateIndex: state.levelThree.totemRaftState ?? 0,
      fromState: state.levelThree.totemRaftFromState ?? 0,
      targetState: state.levelThree.totemRaftTargetState ?? 0,
      drifting: Boolean(state.levelThree.totemRaftDrifting),
      driftProgress: Number((state.levelThree.totemRaftDriftProgress || 0).toFixed(2)),
      docked: Boolean(state.levelThree.totemRaftDocked),
      collectable: Boolean(state.levelThree.totemRaftDocked && !state.levelThree.crocodileTotemCollected),
      collected: Boolean(state.levelThree.crocodileTotemCollected),
      movementImplemented: true,
      movementStyle: "smooth-gated-drift-spatial-contract-repair",
      driftSeconds: LEVEL_THREE_TOTEM_RAFT_DRIFT_SECONDS,
      movingObjectId: "level3TotemRaft",
      fixedDockMarkerId: "level3TotemDockMarker",
      dockMarkerFixed: true,
      pathContract: levelThreeRaftPath,
      collectionRadius: LEVEL_THREE_TOTEM_COLLECTION_RADIUS,
      markers: LEVEL_THREE_RAFT_MARKERS.map((marker) => ({
        id: marker.id,
        name: marker.name,
        stateIndex: marker.stateIndex,
        fixedMarker: marker.id === "level3TotemDockMarker",
        x: Number(marker.position.x.toFixed(2)),
        z: Number(marker.position.z.toFixed(2))
      })),
      gates: LEVEL_THREE_TOTEM_RAFT_GATES.map((gate) => ({
        id: gate.id,
        name: gate.name,
        fromState: gate.fromState,
        toState: gate.toState,
        opened: levelThreeOpenedRaftGates.includes(gate.id),
        blocksRaftOnly: Boolean(gate.blocksRaftOnly),
        visual: gate.visual,
        x: Number(gate.position.x.toFixed(2)),
        z: Number(gate.position.z.toFixed(2))
      }))
    },
    totemGreenButtonReachability: {
      id: levelThreeTotemButton?.id || "level3TotemGreenButton",
      frogDistance: levelThreeTotemButton ? Number(distance2D(state.frog, levelThreeTotemButton.position).toFixed(2)) : null,
      radius: LEVEL_THREE_TOTEM_GREEN_BUTTON_RADIUS,
      reachableByFrog: Boolean(levelThreeTotemButton),
      bridgeGreenButtonSeparate: LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS.some((button) => button.id === "level3BridgeGreenButton")
    },
    bridgePlaceholders: {
      cycleImplemented: false,
      pivot: {
        id: LEVEL_THREE_BRIDGE_PIVOT.id,
        role: LEVEL_THREE_BRIDGE_PIVOT.role,
        visualIntent: LEVEL_THREE_BRIDGE_PIVOT.visualIntent,
        futureMechanic: LEVEL_THREE_BRIDGE_PIVOT.futureMechanic,
        artificial: Boolean(LEVEL_THREE_BRIDGE_PIVOT.artificial),
        footprintTiles: LEVEL_THREE_BRIDGE_PIVOT.footprintTiles,
        bridgeRotationImplemented: Boolean(LEVEL_THREE_BRIDGE_PIVOT.bridgeRotationImplemented),
        armLength: LEVEL_THREE_BRIDGE_PIVOT.armLength,
        x: Number(LEVEL_THREE_BRIDGE_PIVOT.position.x.toFixed(2)),
        z: Number(LEVEL_THREE_BRIDGE_PIVOT.position.z.toFixed(2))
      },
      destinations: LEVEL_THREE_BRIDGE_DESTINATION_MARKERS.map((marker) => ({
        id: marker.id,
        name: marker.name,
        stateIndex: marker.stateIndex,
        islandId: marker.islandId,
        x: Number(marker.position.x.toFixed(2)),
        z: Number(marker.position.z.toFixed(2))
      })),
      destinationRing: LEVEL_THREE_BRIDGE_STATE_METADATA.map((entry) => ({
        id: entry.id,
        stateIndex: entry.stateIndex,
        angleRadians: Number(entry.angleRadians.toFixed(2)),
        distanceFromPivot: Number(entry.distanceFromPivot.toFixed(2))
      })),
      redButtonADistanceFromPivot,
      redButtonAMeaningfullyDistant: redButtonADistanceFromPivot >= 5.5,
      notDirectlyConnected: ["level3GreenButtonIsland", "level3WeightCacheIsland", "level3RedButtonBIsland", "level3LoveLetterCliff"]
    },
    redButtonPlaceholders: LEVEL_THREE_RED_BUTTON_PLACEHOLDERS.map((button) => ({
      id: button.id,
      name: button.name,
      islandId: button.islandId,
      futureRequirement: button.futureRequirement,
      x: Number(button.position.x.toFixed(2)),
      z: Number(button.position.z.toFixed(2)),
      visualAsset: "kaykit-platformer-button-red-placeholder",
      behaviorImplemented: false
    })),
    anchorStones: LEVEL_THREE_ANCHOR_STONES.map((stone) => ({
      id: stone.id,
      name: stone.name,
      x: Number(stone.position.x.toFixed(2)),
      z: Number(stone.position.z.toFixed(2)),
      cargoImplemented: false
    })),
    resetPerches: LEVEL_THREE_RESET_PERCH_PLACEHOLDERS.map((perch) => ({
      id: perch.id,
      name: perch.name,
      x: Number(perch.position.x.toFixed(2)),
      z: Number(perch.position.z.toFixed(2)),
      resetBehaviorImplemented: false
    })),
    loveLetterCliff: {
      id: "level3LoveLetterCliff",
      visible: state.scene.id === SCENES.LEVEL_THREE && state.levelThree.placeholderLoveLetterVisible,
      x: Number(LEVEL_THREE_POINTS.placeholderLoveLetter.x.toFixed(2)),
      y: Number(LEVEL_THREE_PLACEHOLDER_LOVE_LETTER_Y.toFixed(2)),
      z: Number(LEVEL_THREE_POINTS.placeholderLoveLetter.z.toFixed(2)),
      reachable: false,
      completionImplemented: false
    },
    inactiveMechanics: {
      crocodileCargo: false,
      crocodileFerrying: false,
      movingLilyPads: false,
      centralBridgeCycle: false,
      redButtons: false,
      movingPlatforms: false,
      loveLetterCompletion: false
    },
    reservedZones: LEVEL_THREE_RESERVED_ZONES.map((zone) => ({
      id: zone.id,
      name: zone.name,
      purpose: zone.purpose,
      x: Number(zone.position.x.toFixed(2)),
      z: Number(zone.position.z.toFixed(2)),
      radius: zone.radius
    })),
    authoringContract: "Spatial contract repair: larger spaced Frog lily lane, small artificial bridge pivot, gated Totem raft drift; no moving lily timing, no bridge rotation, no cargo, no red buttons, no final route",
    colliderLabels: sceneObjectColliders
      .filter((collider) => collider.scene === SCENES.LEVEL_THREE)
      .map((collider) => collider.label)
  },
  level: {
    width: state.scene.id === SCENES.HOME
      ? HOME_WIDTH
      : state.scene.id === SCENES.LEVEL_TWO
        ? LEVEL_TWO_WIDTH
        : state.scene.id === SCENES.LEVEL_THREE
          ? LEVEL_THREE_WIDTH
          : LEVEL_WIDTH,
    height: state.scene.id === SCENES.HOME
      ? HOME_HEIGHT
      : state.scene.id === SCENES.LEVEL_TWO
        ? LEVEL_TWO_HEIGHT
        : state.scene.id === SCENES.LEVEL_THREE
          ? LEVEL_THREE_HEIGHT
          : LEVEL_HEIGHT,
    floorAsset: "kaykit-blockbits-sand-with-grass",
    movement: "continuous",
    collision: "circle-vs-aabb plus active/inactive actor circle blocking",
    activeBounds: {
      minX: activeWorldBounds().minX,
      maxX: activeWorldBounds().maxX,
      minZ: activeWorldBounds().minZ,
      maxZ: activeWorldBounds().maxZ
    },
    hiddenUntilBarrierColumns: state.scene.id === SCENES.TUTORIAL ? `${WALL_COLUMN}-${LEVEL_WIDTH - 1}` : "",
    visibleAssets: currentVisibleAssets(),
    cloudsVisible: true,
    barrierEndCapsVisible: state.reveals.barrier
  },
  controls: {
    move: "WASD/arrows camera-relative",
    transfer: "Shift near an unlocked Cubeling, or from a Cubeling back to your character",
    camera: "Q/E rotate 45 degrees",
    frogJump: "Space",
    resetTesting: "R"
  },
  effects: {
    transferParticleCount: state.particles.filter((particle) => particle.kind === "transfer").length,
    heartParticleAsset: "kaykit-platformer-heart-red",
    heartParticleCount: state.particles.filter((particle) => particle.kind === "heart").length,
    totalParticleCount: state.particles.length
  },
  actorCollision: {
    distance: Number(distance2D(state.human, state.frog).toFixed(2)),
    humanToElephant: Number(distance2D(state.human, state.elephant).toFixed(2)),
    blockDistance: Number((state.human.radius + state.frog.radius + ACTOR_BLOCK_PADDING).toFixed(2)),
    blockedLastFrame: state.actorCollisionBlocked
  },
  distances: {
    humanToFrog: Number(distance2D(state.human, state.frog).toFixed(2)),
    humanToElephant: Number(distance2D(state.human, state.elephant).toFixed(2)),
    elephantToEcho: Number(distance2D(state.elephant, LEVEL_TWO_POINTS.elephantEcho).toFixed(2)),
    humanToFrogEcho: Number(distance2D(state.human, START.frog).toFixed(2)),
    humanToFrogTotem: Number(distance2D(state.human, FROG_TOTEM).toFixed(2)),
    frogToButton: Number(distance2D(state.frog, buttonPoint()).toFixed(2)),
    humanToLoveLetter: Number(distance2D(state.human, getSpeechAnchorPoint("loveLetter")).toFixed(2)),
    frogToLoveLetter: Number(distance2D(state.frog, getSpeechAnchorPoint("loveLetter")).toFixed(2))
  },
  frameAgeMs: Math.round(performance.now() - lastFrameTime)
  });
}

installTestHooks({
  runtime,
  renderer,
  scene,
  camera,
  state,
  input,
  sceneIds: SCENES,
  levelTwoRamp: LEVEL_TWO_BLUE_RAMP,
  levelTwoPoints: LEVEL_TWO_POINTS,
  update,
  renderFrame,
  startLevelOne,
  startLevelTwo,
  startLevelThree,
  tutorialButton: TUTORIAL_BUTTON,
  tutorialStart: START,
  spellbook: SPELLBOOK,
  levelOneButton: LEVEL_ONE_BUTTON,
  levelOneLoveLetterPoint: LEVEL_ONE_LOVE_LETTER_POINT,
  levelThreePoints: LEVEL_THREE_POINTS,
  levelThreeGreenButtons: LEVEL_THREE_GREEN_BUTTON_PLACEHOLDERS,
  levelThreeRaftMarkers: LEVEL_THREE_RAFT_MARKERS,
  levelThreeRaftGates: LEVEL_THREE_TOTEM_RAFT_GATES,
  levelThreeFrogLaneResetPoint: LEVEL_THREE_FROG_LANE_RESET_POINT,
  levelThreeCrocodileSpawn: LEVEL_THREE_CROCODILE_SPAWN,
  levelTwoRedPlatforms: LEVEL_TWO_RED_PLATFORMS,
  levelTwoRedButtonSurfaceY,
  updateLevelTwoSurfaceState,
  resetLevelTwoRedMechanismState,
  syncAll,
  updateCamera,
  updateHud,
  clearSpeechQueue,
  directionName,
  setTutorialStep,
  renderGameToText
});
