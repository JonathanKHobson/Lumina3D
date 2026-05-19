import { SCENES } from "../config/scenes.js";
import {
  HOME_CINEMATIC_SPEED,
  HOME_EXIT_CONFIRM_COOLDOWN,
  HOME_EXIT_FADE_SECONDS,
  HOME_POINTS
} from "../levels/homeIntroLevel.js";
import { START } from "../levels/tutorialLevel.js";
import { clearParticles } from "../systems/particleSystem.js";
import {
  createActorState,
  createCelebrationState,
  createHomeState,
  createLevelOneState,
  createLevelTwoState,
  createLoveLetterMessageState
} from "../state/gameState.js";

export function startHomeIntroScene(context, event = null, options = {}) {
  const {
    state,
    input,
    particleContext,
    resetFrogAiForScene,
    clearSpeechQueue,
    playHumanAnimation,
    syncAll,
    updateCamera,
    updateHud
  } = context;

  event?.preventDefault();
  if (!options.debug && (state.scene.id !== SCENES.TUTORIAL || !state.tutorialComplete)) return;
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
  state.active = "human";
  state.cameraYaw = 0;
  state.targetCameraYaw = 0;
  state.human = createActorState({
    x: HOME_POINTS.entry.x,
    z: HOME_POINTS.entry.z,
    facing: { x: 1, z: 0, name: "east" }
  }, 0.45, 4.2);
  state.frog = createActorState(START.frog, 0.53, 3.45);
  resetFrogAiForScene();
  state.reveals = { rightFloor: false, frogEcho: false, frogTotem: false, frog: false, barrier: false, button: false, spellbook: false };
  state.buttonPressed = false;
  state.doorwayOpen = false;
  state.spellbookCollected = false;
  state.celebration = createCelebrationState();
  state.reward = { active: false, elapsed: 0 };
  state.loveLetterMessage = createLoveLetterMessageState();
  state.overridePrompt = null;
  clearParticles(particleContext);
  clearSpeechQueue();
  state.speech = { text: "", anchor: "human", until: 0 };
  state.secondarySpeech = { text: "", anchor: "", until: 0 };
  playHumanAnimation("Idle");
  syncAll();
  updateCamera(1);
  updateHud();
}

export function updateHomeSceneFlow(context, dt) {
  const {
    state,
    directionName,
    distance2D,
    playHumanAnimation,
    showPrompt,
    showSpeech,
    startLevelOne,
    updateHomeInteractions
  } = context;

  if (state.home.phase === "leaving") {
    state.home.transitionTimer += dt;
    if (state.home.transitionTimer >= HOME_EXIT_FADE_SECONDS) startLevelOne({ showTitle: true });
    return;
  }

  if (state.home.phase === "arrival") {
    state.home.arrivalElapsed += dt;
    if (state.home.arrivalElapsed < 0.08) showSpeech("human", "I'm home, my love.", 1.8);
    const dx = HOME_POINTS.arrival.x - state.human.x;
    const dz = HOME_POINTS.arrival.z - state.human.z;
    const len = Math.hypot(dx, dz);
    if (len <= 0.06) {
      beginHomePlay({ state, showSpeech, showPrompt });
      return;
    }
    const step = Math.min(len, HOME_CINEMATIC_SPEED * dt);
    state.human.facing = directionName({ x: dx / len, z: dz / len });
    state.human.x += (dx / len) * step;
    state.human.z += (dz / len) * step;
    state.inputMoving = true;
    if (distance2D(state.human, HOME_POINTS.arrival) <= 0.08) beginHomePlay({ state, showSpeech, showPrompt });
    return;
  }

  if (state.home.phase !== "play") return;
  updateHomeInteractions(dt);
}

export function openHomeExitConfirmFlow(context) {
  const { state, input } = context;
  if (state.home.exitConfirmVisible || state.home.phase !== "play") return;
  state.home.exitConfirmVisible = true;
  state.home.exitConfirmOpenCount += 1;
  input.keys.clear();
}

export function stayInHomeIntroFlow(context, event = null) {
  const { state, showPrompt } = context;
  event?.preventDefault();
  if (!state.home.exitConfirmVisible) return;
  state.home.exitConfirmVisible = false;
  state.home.exitConfirmCooldownUntil = state.elapsed + HOME_EXIT_CONFIRM_COOLDOWN;
  state.home.exitZoneInside = true;
  showPrompt("Stay and look around home.", 1.4);
}

export function confirmHomeExitFlow(context, event = null) {
  const { state } = context;
  event?.preventDefault();
  if (state.scene.id !== SCENES.HOME || !state.home.exitConfirmVisible) return;
  state.home.exitConfirmVisible = false;
  beginHomeExitTransitionFlow(context);
}

export function beginHomeExitTransitionFlow(context) {
  const { state, input } = context;
  if (state.home.phase === "leaving") return;
  state.home.phase = "leaving";
  state.scene.phase = "leaving_home";
  state.scene.titleCardVisible = false;
  state.scene.titleCardText = "";
  state.scene.fadeVisible = true;
  state.home.transitionTimer = 0;
  input.keys.clear();
}

function beginHomePlay({ state, showSpeech, showPrompt }) {
  state.scene.phase = "play";
  state.home.phase = "play";
  state.inputMoving = false;
  state.home.hintTimer = 0;
  showSpeech("human", "Love?", 1.7);
  showPrompt("Look around the house.", 2.4);
}
