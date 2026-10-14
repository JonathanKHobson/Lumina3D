import { SCENES } from "../config/scenes.js";
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
import {
  LEVEL_THREE_CINEMATIC_SPEED,
  LEVEL_THREE_CROCODILE_RADIUS,
  LEVEL_THREE_CROCODILE_SPAWN,
  LEVEL_THREE_CROCODILE_SPEED,
  LEVEL_THREE_POINTS,
  LEVEL_THREE_TITLE_SECONDS
} from "../levels/levelThree.js";

export function startLevelThreeScene(context, options = {}) {
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
    id: SCENES.LEVEL_THREE,
    phase: "arrival",
    titleCardVisible: showTitle,
    titleCardText: showTitle ? "Level Three" : "",
    fadeVisible: false,
    visibleAssets: []
  };
  state.home = createHomeState("inactive");
  state.levelOne = createLevelOneState("inactive");
  state.levelTwo = createLevelTwoState("inactive");
  state.levelThree = createLevelThreeState("arrival");
  state.active = "human";
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.human = createActorState(LEVEL_THREE_POINTS.entry, 0.45, 4.2);
  state.frog = createActorState(LEVEL_THREE_POINTS.frogStart, 0.53, 3.45);
  state.crocodile = createActorState(LEVEL_THREE_CROCODILE_SPAWN, LEVEL_THREE_CROCODILE_RADIUS, LEVEL_THREE_CROCODILE_SPEED);
  state.unlocks.frogCubeling = true;
  saveCubelingUnlocks();
  state.cubelings = {
    frog: { unlocked: true, unlockedThisTutorial: false },
    elephant: { unlocked: false, unlockedPending: false, active: false, spawned: false },
    crocodile: { unlocked: false, unlockedPending: false, active: false, spawned: false, controllable: false }
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
  playHumanAnimation("Walk");
  syncAll();
  updateCamera(1);
  updateHud();
}

export function updateLevelThreeSceneFlow(context, dt) {
  const {
    state,
    directionName,
    distance2D,
    playHumanAnimation,
    showPrompt
  } = context;

  if (state.levelThree.phase === "arrival") {
    updateTitleCardTimer(state, dt);
    state.levelThree.arrivalElapsed += dt;
    const dx = LEVEL_THREE_POINTS.humanStart.x - state.human.x;
    const dz = LEVEL_THREE_POINTS.humanStart.z - state.human.z;
    const len = Math.hypot(dx, dz);
    if (len <= 0.06) {
      beginLevelThreePlay({ state, showPrompt, playHumanAnimation });
      return;
    }
    const step = Math.min(len, LEVEL_THREE_CINEMATIC_SPEED * dt);
    state.human.facing = directionName({ x: dx / len, z: dz / len });
    state.human.x += (dx / len) * step;
    state.human.z += (dz / len) * step;
    state.inputMoving = true;
    if (distance2D(state.human, LEVEL_THREE_POINTS.humanStart) <= 0.08) {
      beginLevelThreePlay({ state, showPrompt, playHumanAnimation });
    }
  }
}

export function resetLevelThreeSceneFlow(context) {
  startLevelThreeScene(context);
}

function beginLevelThreePlay({ state, showPrompt, playHumanAnimation }) {
  state.levelThree.phase = "play";
  state.scene.phase = "play";
  state.scene.titleCardVisible = false;
  state.scene.titleCardText = "";
  state.inputMoving = false;
  showPrompt("The lake is wide, but Frog can try the floating leaves.", 2.8);
  playHumanAnimation("Idle");
}

function updateTitleCardTimer(state, dt) {
  if (!state.scene.titleCardVisible) return;
  state.levelThree.titleElapsed += dt;
  if (state.levelThree.titleElapsed < LEVEL_THREE_TITLE_SECONDS) return;
  state.scene.titleCardVisible = false;
  state.scene.titleCardText = "";
}
