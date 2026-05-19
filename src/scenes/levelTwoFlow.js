import { SCENES } from "../config/scenes.js";
import { clearParticles } from "../systems/particleSystem.js";
import {
  createActorState,
  createCelebrationState,
  createHomeState,
  createLevelOneState,
  createLevelTwoState,
  createLoveLetterAttentionState,
  createLoveLetterMessageState
} from "../state/gameState.js";
import {
  LEVEL_TWO_CINEMATIC_SPEED,
  LEVEL_TWO_POINTS,
  LEVEL_TWO_TITLE_SECONDS
} from "../levels/levelTwo.js";

export function startLevelTwoScene(context, options = {}) {
  const {
    state,
    input,
    particleContext,
    saveCubelingUnlocks,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    syncAll,
    updateCamera,
    updateHud
  } = context;
  const showTitle = options.showTitle !== false;

  input.keys.clear();
  state.scene = {
    id: SCENES.LEVEL_TWO,
    phase: showTitle ? "title" : "arrival",
    titleCardVisible: showTitle,
    titleCardText: showTitle ? "Level Two" : "",
    fadeVisible: false,
    visibleAssets: []
  };
  state.home = createHomeState("inactive");
  state.levelOne = createLevelOneState("inactive");
  state.levelTwo = createLevelTwoState(showTitle ? "title" : "arrival");
  state.active = "human";
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.human = createActorState(LEVEL_TWO_POINTS.entry, 0.45, 4.2);
  state.frog = createActorState(LEVEL_TWO_POINTS.frogStart, 0.53, 3.45);
  state.unlocks.frogCubeling = true;
  saveCubelingUnlocks();
  state.cubelings = {
    frog: { unlocked: true, unlockedThisTutorial: false },
    elephant: { unlocked: false, unlockedPending: false, active: false }
  };
  state.reveals = { rightFloor: true, frogEcho: false, frogTotem: false, frog: true, barrier: false, button: false, spellbook: false };
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
  state.loveLetterAttention = createLoveLetterAttentionState();
  state.loveLetterReveal = { active: false, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState();
  resetFrogAiForScene();
  clearParticles(particleContext);
  clearSpeechQueue();
  state.speech = { text: "", anchor: "human", until: 0 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  playHumanAnimation(showTitle ? "Idle" : "Walk");
  syncAll();
  updateCamera(1);
  updateHud();
}

export function updateLevelTwoSceneFlow(context, dt) {
  const {
    state,
    directionName,
    distance2D,
    playHumanAnimation,
    showPrompt,
    updateLevelTwoInteractions
  } = context;

  if (state.levelTwo.phase === "title") {
    state.levelTwo.titleElapsed += dt;
    if (state.levelTwo.titleElapsed >= LEVEL_TWO_TITLE_SECONDS) {
      state.levelTwo.phase = "arrival";
      state.scene.phase = "arrival";
      state.scene.titleCardVisible = false;
      state.scene.titleCardText = "";
      playHumanAnimation("Walk");
    }
    return;
  }

  if (state.levelTwo.phase === "arrival") {
    state.levelTwo.arrivalElapsed += dt;
    const dx = LEVEL_TWO_POINTS.humanStart.x - state.human.x;
    const dz = LEVEL_TWO_POINTS.humanStart.z - state.human.z;
    const len = Math.hypot(dx, dz);
    if (len <= 0.06) {
      beginLevelTwoPlay({ state, showPrompt, playHumanAnimation });
      return;
    }
    const step = Math.min(len, LEVEL_TWO_CINEMATIC_SPEED * dt);
    state.human.facing = directionName({ x: dx / len, z: dz / len });
    state.human.x += (dx / len) * step;
    state.human.z += (dz / len) * step;
    state.inputMoving = true;
    if (distance2D(state.human, LEVEL_TWO_POINTS.humanStart) <= 0.08) {
      beginLevelTwoPlay({ state, showPrompt, playHumanAnimation });
    }
    return;
  }

  if (state.levelTwo.phase !== "play") return;
  updateLevelTwoInteractions();
}

export function resetLevelTwoSceneFlow(context) {
  startLevelTwoScene(context);
}

function beginLevelTwoPlay({ state, showPrompt, playHumanAnimation }) {
  state.levelTwo.phase = "play";
  state.scene.phase = "play";
  state.inputMoving = false;
  showPrompt("Find the Frog Cubeling and look for the high Love Letter.", 2.4);
  playHumanAnimation("Idle");
}
