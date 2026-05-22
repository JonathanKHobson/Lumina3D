import { WORLD_BOUNDS } from "../config/constants.js";
import { SCENES } from "../config/scenes.js";
import { LEVEL_ONE_LOVE_LETTER_ID } from "../content/loveLetters.js";
import { LEVEL_ONE_CINEMATIC_SPEED, LEVEL_ONE_TITLE_SECONDS } from "../levels/levelOne.js";
import { START } from "../levels/tutorialLevel.js";
import { clearParticles } from "../systems/particleSystem.js";
import {
  createActorState,
  createCelebrationState,
  createHomeState,
  createLevelOneState,
  createLevelThreeState,
  createLevelTwoState,
  createLoveLetterAttentionState,
  createLoveLetterMessageState
} from "../state/gameState.js";

export function startLevelOneScene(context, options = {}) {
  const {
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
    updateHud
  } = context;
  const showTitle = options.showTitle !== false;

  input.keys.clear();
  state.scene = {
    id: SCENES.LEVEL_ONE,
    phase: "arrival",
    titleCardVisible: showTitle,
    titleCardText: showTitle ? "Level One" : "",
    fadeVisible: false,
    visibleAssets: []
  };
  state.home = createHomeState("inactive");
  state.levelOne = createLevelOneState("arrival");
  state.levelTwo = createLevelTwoState("inactive");
  state.levelThree = createLevelThreeState("inactive");
  state.active = "human";
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.human = createActorState({
    x: WORLD_BOUNDS.minX - 1.1,
    z: START.human.z,
    facing: { x: 1, z: 0, name: "east" }
  }, 0.45, 4.2);
  state.frog = createActorState(START.frog, 0.53, 3.45);
  state.unlocks.frogCubeling = true;
  saveCubelingUnlocks();
  state.cubelings = {
    frog: { unlocked: true, unlockedThisTutorial: false },
    elephant: { unlocked: false, unlockedPending: false, active: false }
  };
  state.reveals = { rightFloor: true, frogEcho: false, frogTotem: false, frog: true, barrier: false, button: true, spellbook: false };
  state.frogTotem.collected = false;
  state.buttonPressed = false;
  state.doorwayOpen = false;
  state.spellbookCollected = false;
  state.tutorialSkipped = true;
  state.overridePrompt = null;
  state.reward = { active: false, elapsed: 0 };
  state.celebration = createCelebrationState();
  state.loveLetterLesson = {
    frogBlocked: false,
    frogBlockCount: 0,
    lastFrogPromptAt: -Infinity,
    humanPrompted: false,
    lastHumanPromptAt: -Infinity
  };
  state.loveLetterAttention = {
    ...createLoveLetterAttentionState(),
    revealedBeforeButton: false,
    revealReason: "level_one_start"
  };
  state.loveLetterReveal = { active: false, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState(LEVEL_ONE_LOVE_LETTER_ID);
  resetFrogAiForScene();
  clearParticles(particleContext);
  clearSpeechQueue();
  state.speech = { text: "", anchor: "human", until: 0 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  playHumanAnimation("Walk");
  syncAll();
  updateCamera(1);
  updateHud();
}

export function updateLevelOneSceneFlow(context, dt) {
  const {
    state,
    directionName,
    distance2D,
    playHumanAnimation,
    showPrompt,
    updateLevelOneFlowEffects
  } = context;

  if (state.levelOne.phase === "arrival") {
    updateTitleCardTimer(state, dt);
    const dx = START.human.x - state.human.x;
    const dz = START.human.z - state.human.z;
    const len = Math.hypot(dx, dz);
    if (len <= 0.06) {
      beginLevelOnePlay({ state, showPrompt, playHumanAnimation });
      return;
    }
    const step = Math.min(len, LEVEL_ONE_CINEMATIC_SPEED * dt);
    state.human.facing = directionName({ x: dx / len, z: dz / len });
    state.human.x += (dx / len) * step;
    state.human.z += (dz / len) * step;
    state.inputMoving = true;
    if (distance2D(state.human, START.human) <= 0.08) {
      beginLevelOnePlay({ state, showPrompt, playHumanAnimation });
    }
    return;
  }

  updateLevelOneFlowEffects(dt);
}

export function resetLevelOneSceneFlow(context) {
  startLevelOneScene(context);
}

function beginLevelOnePlay({ state, showPrompt, playHumanAnimation }) {
  state.levelOne.phase = "play";
  state.scene.phase = "play";
  state.scene.titleCardVisible = false;
  state.scene.titleCardText = "";
  state.inputMoving = false;
  showPrompt("Find the Love Letter.", 2.2);
  playHumanAnimation("Idle");
}

function updateTitleCardTimer(state, dt) {
  if (!state.scene.titleCardVisible) return;
  state.levelOne.titleElapsed += dt;
  if (state.levelOne.titleElapsed < LEVEL_ONE_TITLE_SECONDS) return;
  state.scene.titleCardVisible = false;
  state.scene.titleCardText = "";
}
