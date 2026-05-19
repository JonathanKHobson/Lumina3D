export const BUTTON_COLORS = {
  BLUE: "blue",
  RED: "red",
  YELLOW: "yellow"
};

export const BUTTON_ACTIVATION_TYPES = {
  PERSISTENT: "persistent",
  HELD_WEIGHT: "held-weight",
  TIMED_OR_POWERED: "timed-or-powered"
};

export function actorCanPressButton({
  activeActor,
  requiredActor = "frog",
  actor,
  button,
  radius,
  pressed = false,
  surfaceId = null,
  requiredSurfaceId = null
}) {
  if (pressed) return false;
  if (requiredActor && activeActor !== requiredActor) return false;
  if (requiredSurfaceId && surfaceId !== requiredSurfaceId) return false;
  if (!actor || !button) return false;
  return Math.hypot(actor.x - button.x, actor.z - button.z) <= radius;
}

export function syncButtonTopVisual(buttonTop, pressed, restY, pressedY) {
  if (!buttonTop) return;
  buttonTop.position.y = pressed ? pressedY : restY;
}
