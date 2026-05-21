import {
  CELEBRATION_HEART_INTERVAL,
  LOVE_LETTER_BOUNCE_INTERVAL,
  LOVE_LETTER_HEART_INTERVAL,
  LOVE_LETTER_REMINDER_SECONDS,
  LOVE_LETTER_SPARKLE_INTERVAL
} from "../config/constants.js";
import { LOVE_LETTER_MESSAGES, TUTORIAL_LOVE_LETTER_ID } from "../content/loveLetters.js";
import { LEVEL_ONE_BLUE_BLOOM_MATS, LEVEL_ONE_JUMP_ZONE, LEVEL_ONE_LILY_PAD } from "../levels/levelOne.js";

export function createActorState(start, radius, speed) {
  return {
    x: start.x,
    z: start.z,
    radius,
    speed,
    facing: { ...start.facing }
  };
}

export function createLoveLetterAttentionState() {
  return {
    sparkleTimer: LOVE_LETTER_SPARKLE_INTERVAL,
    heartTimer: LOVE_LETTER_HEART_INTERVAL,
    bounceTimer: LOVE_LETTER_BOUNCE_INTERVAL,
    bounceElapsed: 0,
    reminderTimer: LOVE_LETTER_REMINDER_SECONDS,
    idleReminderCount: 0,
    attentionBurstCount: 0,
    buttonReactionCount: 0,
    revealedBeforeButton: false,
    revealReason: "",
    lastAttentionReason: "",
    protectSpeechUntil: 0
  };
}

export function createLoveLetterMessageState(id = TUTORIAL_LOVE_LETTER_ID) {
  const message = LOVE_LETTER_MESSAGES[id] || LOVE_LETTER_MESSAGES[TUTORIAL_LOVE_LETTER_ID];
  return {
    id,
    title: message.title,
    text: message.text,
    visible: false,
    shown: false,
    dismissed: false,
    inputBufferUntil: 0
  };
}

export function createTutorialRecoveryState() {
  return {
    stranded: false,
    startedAt: -Infinity,
    lastPromptAt: -Infinity,
    resetPromptShown: false,
    characterLineShown: false
  };
}

export function createCelebrationState(overrides = {}) {
  return {
    active: false,
    elapsed: 0,
    modalVisible: false,
    freeMode: false,
    animationStage: "",
    awaitingContinue: false,
    continuePromptVisible: false,
    inputArmed: false,
    animationTimer: 0,
    heartTimer: CELEBRATION_HEART_INTERVAL,
    heartBurstCount: 0,
    ...overrides
  };
}

export function createHomeState(phase = "inactive") {
  return {
    phase,
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
  };
}

export function createLevelOneState(phase = "inactive") {
  return {
    phase,
    bridgeComplete: false,
    bridgeRevealActive: false,
    bridgeRevealElapsed: 0,
    blueBloomReleased: false,
    blueBloomRevealActive: false,
    blueBloomRevealElapsed: 0,
    blueBloomDocked: false,
    loveLetterSurfaced: false,
    blueBloomMats: {
      left: { id: LEVEL_ONE_BLUE_BLOOM_MATS.left.id, walkable: false },
      right: { id: LEVEL_ONE_BLUE_BLOOM_MATS.right.id, walkable: false }
    },
    lilyPadSurfaceId: LEVEL_ONE_LILY_PAD.id,
    lilyPadPromptShown: false,
    crossingReadyPromptShown: false,
    hintTimer: 0,
    hintStage: "",
    complete: false,
    waterBlocked: true,
    bridgeAsset: "blue-bloom-crossing-held",
    frogJumpZone: LEVEL_ONE_JUMP_ZONE,
    titleElapsed: 0,
    frogWaterBlockedCount: 0,
    lastFrogWaterPromptAt: -Infinity
  };
}

export function createLevelTwoState(phase = "inactive") {
  return {
    phase,
    titleElapsed: 0,
    arrivalElapsed: 0,
    elevatedGoalVisible: phase !== "inactive",
    placeholderLoveLetterVisible: phase !== "inactive",
    placeholderLoveLetterCollectable: false,
    frogSurfaceId: null,
    humanSurfaceId: null,
    blueButtonPressed: false,
    blueRampActive: false,
    blueRampRevealActive: false,
    blueRampRevealElapsed: 0,
    elephantEchoVisible: phase !== "inactive",
    elephantEchoPromptIndex: 0,
    lastElephantEchoPromptAt: -Infinity,
    elephantEchoSparkleTimer: 0.7,
    elephantTotemVisible: phase !== "inactive",
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
  };
}

export function createLevelThreeState(phase = "inactive") {
  return {
    phase,
    titleElapsed: 0,
    arrivalElapsed: 0,
    placeholderLoveLetterVisible: phase !== "inactive",
    placeholderLoveLetterCollectable: false,
    frogAvailableFromStart: phase !== "inactive",
    reservedWaterCubelingSpaceVisible: phase !== "inactive",
    totemRaftState: 0,
    totemRaftDocked: false,
    crocodileUnlocked: false,
    bridgeState: 0,
    openingGreenPressCount: 0,
    complete: false
  };
}
