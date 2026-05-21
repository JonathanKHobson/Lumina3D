import { SCENES } from "../config/scenes.js";
import { START, SPEECH_STEPS } from "../levels/tutorialLevel.js";
import { clearParticles } from "../systems/particleSystem.js";
import {
  createActorState,
  createCelebrationState,
  createHomeState,
  createLevelOneState,
  createLevelTwoState,
  createLoveLetterAttentionState,
  createLoveLetterMessageState,
  createTutorialRecoveryState
} from "../state/gameState.js";

export function resetTutorialSceneFlow(context) {
  const {
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
  } = context;

  input.keys.clear();
  state.scene = {
    id: SCENES.TUTORIAL,
    phase: "guided",
    titleCardVisible: false,
    titleCardText: "",
    fadeVisible: false,
    visibleAssets: []
  };
  state.home = createHomeState("inactive");
  state.levelOne = createLevelOneState("inactive");
  state.levelTwo = createLevelTwoState("inactive");
  state.active = "human";
  state.human = createActorState(START.human, 0.45, 4.2);
  state.frog = createActorState(START.frog, 0.53, 3.45);
  state.unlocks = loadCubelingUnlocks();
  state.cubelings = {
    frog: { unlocked: false, unlockedThisTutorial: false },
    elephant: { unlocked: false, unlockedPending: false, active: false }
  };
  state.tutorialIndex = 0;
  state.maxTutorialIndexReached = 0;
  state.tutorialSkipped = false;
  state.controlsOpen = false;
  state.reveals = { rightFloor: false, frogEcho: false, frogTotem: false, frog: false, barrier: false, button: false, spellbook: false };
  state.frogEcho = { promptIndex: 0, lastPromptAt: -Infinity, sparkleTimer: 0 };
  state.frogTotem = { collected: false, promptIndex: 0, lastPromptAt: -Infinity, sparkleTimer: 0 };
  state.frogTotemReveal = { active: false, elapsed: 0, delay: 0 };
  state.frogReveal = { active: false, elapsed: 0 };
  state.rightFloorReveal = { active: false, elapsed: 0 };
  state.barrierReveal = { active: false, elapsed: 0, landed: [] };
  state.loveLetterReveal = { active: false, elapsed: 0 };
  state.loveLetterAttention = createLoveLetterAttentionState();
  state.skipModal = { visible: false, reason: "", anchor: "human" };
  state.skipNudge = { id: "", count: 0, lastAt: -Infinity };
  state.tutorialRecovery = createTutorialRecoveryState();
  state.speech = { text: SPEECH_STEPS.move_up.text, anchor: "human", until: state.elapsed + 3 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  state.speechQueue = [];
  state.speechSequenceActive = false;
  state.loveLetterLesson = {
    frogBlocked: false,
    frogBlockCount: 0,
    lastFrogPromptAt: -Infinity,
    humanPrompted: false,
    lastHumanPromptAt: -Infinity
  };
  state.buttonPressed = false;
  state.doorwayOpen = false;
  state.spellbookCollected = false;
  state.tutorialComplete = false;
  state.overridePrompt = null;
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.frogMoveProgress = 0;
  state.frogMoveHop = 0;
  state.frogJump = null;
  state.lastJumpClearance = { active: false, currentLift: 0, peakLift: 0, clearsBarrier: false };
  state.actorCollisionBlocked = false;
  state.frogAi = {
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
  };
  state.reward = { active: false, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState();
  state.celebration = createCelebrationState();
  clearParticles(particleContext);
  barrierMeshes.forEach((mesh) => {
    mesh.visible = false;
  });
  markerMeshes.spellbookOpen.visible = false;
  playHumanAnimation("Idle");
  updateControlsPanel();
  updateLevelCompleteModal();
  syncAll();
  updateCamera(1);
  updateHud();
}
