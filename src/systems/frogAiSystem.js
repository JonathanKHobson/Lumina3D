export function updateFrogAiSystem(context, dt) {
  const {
    state,
    sceneIds,
    frogPatrolSpeed,
    frogDoorwayClearSpeed,
    frogPatrolPauseMin,
    frogPatrolPauseMax,
    frogCelebrationSpeed,
    frogCelebrationPerchRadius,
    frogCurrentSide,
    shouldFrogClearDoorway,
    pointInDoorwayZone,
    canFrogPatrolStandAt,
    chooseFrogDoorwayClearTarget,
    chooseFrogPatrolTarget,
    updateCelebratingFrog,
    directionName,
    moveActor
  } = context;

  if (!state.reveals.frog) return;
  state.frogAi.lastMoveDistance = 0;
  state.frogAi.doorwayClear = false;
  state.frogAi.usesHumanAsTarget = false;
  state.frogAi.currentSide = frogCurrentSide();
  if (state.active === "frog" || state.frogJump) return;
  if (state.celebration.active) {
    updateCelebratingFrog(context, dt);
    return;
  }
  if (state.celebration.modalVisible) return;

  const patrolMode = state.scene.id === sceneIds.LEVEL_ONE || state.scene.id === sceneIds.LEVEL_TWO || state.frogAi.everPossessed || state.tutorialSkipped || state.celebration.freeMode;
  const doorwayClearMode = shouldFrogClearDoorway() && pointInDoorwayZone(state.frog, state.frog.radius + 0.18);
  state.frogAi.mode = doorwayClearMode ? "doorway_clear" : patrolMode ? "patrol" : "idle";
  state.frogAi.doorwayClear = doorwayClearMode;
  state.frogAi.targetSource = doorwayClearMode ? "doorway_clear" : "patrol";
  state.frogAi.timer -= dt;
  state.frogAi.hop = Math.max(0, state.frogAi.hop - dt);
  const targetNeedsRefresh = !canFrogPatrolStandAt(
    state.frogAi.target.x,
    state.frogAi.target.z,
    state.frogAi.currentSide,
    state.frogAi.targetSource
  );
  if (state.frogAi.timer <= 0 || doorwayClearMode || targetNeedsRefresh) {
    state.frogAi.timer = doorwayClearMode
      ? 0.38 + Math.random() * 0.22
      : frogPatrolPauseMin + Math.random() * (frogPatrolPauseMax - frogPatrolPauseMin);
    state.frogAi.hop = 0.32;
    state.frogAi.target = doorwayClearMode
      ? chooseFrogDoorwayClearTarget(context)
      : chooseFrogPatrolTarget(context);
  }

  const dx = state.frogAi.target.x - state.frog.x;
  const dz = state.frogAi.target.z - state.frog.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return;
  const speed = doorwayClearMode ? frogDoorwayClearSpeed : frogPatrolSpeed;
  const step = Math.min(len, speed * dt);
  const vector = { x: dx / len, z: dz / len };
  state.frog.facing = directionName(vector);
  const moved = moveActor(state.frog, vector.x * step, vector.z * step);
  state.frogAi.lastMoveDistance = moved;
  state.frogAi.totalMoveDistance += moved;
}

export function updateCelebratingFrogSystem(context, dt) {
  const {
    state,
    frogCelebrationSpeed,
    frogCelebrationPerchRadius,
    frogCurrentSide,
    distance2D,
    directionName,
    moveActor,
    chooseFrogCelebrationPerch,
    chooseFrogCelebrationHopTarget,
    frogCelebrationMinDistance
  } = context;

  state.frogAi.mode = "celebrating";
  state.frogAi.doorwayClear = false;
  state.frogAi.currentSide = frogCurrentSide();
  state.frogAi.targetSource = "celebration_perch";
  state.frogAi.usesHumanAsTarget = false;
  if (!state.frogAi.celebrationPerch || distance2D(state.frogAi.celebrationPerch, state.human) < frogCelebrationMinDistance) {
    state.frogAi.celebrationPerch = chooseFrogCelebrationPerch(context);
  }
  state.frogAi.timer -= dt;
  state.frogAi.hop = Math.max(0, state.frogAi.hop - dt);
  const perchDistance = distance2D(state.frog, state.frogAi.celebrationPerch);
  if (state.frogAi.timer <= 0) {
    state.frogAi.timer = 0.36 + Math.random() * 0.24;
    state.frogAi.hop = 0.32;
    state.frogAi.target = perchDistance > frogCelebrationPerchRadius
      ? state.frogAi.celebrationPerch
      : chooseFrogCelebrationHopTarget(context);
  }

  const dx = state.frogAi.target.x - state.frog.x;
  const dz = state.frogAi.target.z - state.frog.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.04) return;
  const vector = { x: dx / len, z: dz / len };
  const step = Math.min(len, frogCelebrationSpeed * dt);
  state.frog.facing = directionName(vector);
  const moved = moveActor(state.frog, vector.x * step, vector.z * step);
  state.frogAi.lastMoveDistance = moved;
  state.frogAi.totalMoveDistance += moved;
}

export function chooseFrogPatrolTargetSystem(context, side = context.frogCurrentSide()) {
  const { state, frogPatrolZone, canFrogPatrolStandAt, clampPointToPatrolZone } = context;
  const zone = frogPatrolZone(side);
  for (let i = 0; i < 16; i++) {
    const candidate = {
      x: lerp(zone.minX, zone.maxX, Math.random()),
      z: lerp(zone.minZ, zone.maxZ, Math.random())
    };
    if (canFrogPatrolStandAt(candidate.x, candidate.z, side, "patrol")) return candidate;
  }
  const fallback = clampPointToPatrolZone(state.frog, side);
  return canFrogPatrolStandAt(fallback.x, fallback.z, side, "patrol")
    ? fallback
    : { x: state.frog.x, z: state.frog.z };
}

export function chooseFrogDoorwayClearTargetSystem(context) {
  const { state, frogCurrentSide, frogPatrolZone, buttonPoint, clampPointToPatrolZone, canFrogPatrolStandAt, chooseFrogPatrolTarget } = context;
  const side = frogCurrentSide();
  const zone = frogPatrolZone(side);
  const button = buttonPoint();
  const candidates = side === "right"
    ? [
        { x: zone.minX + state.frog.radius + 0.2, z: button.z },
        { x: zone.centerX, z: zone.centerZ },
        { x: zone.maxX - state.frog.radius - 0.2, z: zone.minZ + state.frog.radius + 0.2 }
      ]
    : [
        { x: zone.maxX - state.frog.radius - 0.2, z: zone.centerZ },
        { x: zone.centerX, z: zone.centerZ },
        { x: zone.minX + state.frog.radius + 0.2, z: zone.maxZ - state.frog.radius - 0.2 }
      ];
  const valid = candidates
    .map((point) => clampPointToPatrolZone(point, side))
    .find((point) => canFrogPatrolStandAt(point.x, point.z, side, "doorway_clear"));
  return valid || chooseFrogPatrolTarget(context, side);
}

export function chooseFrogCelebrationPerchSystem(context) {
  const {
    state,
    frogCurrentSide,
    frogPatrolZone,
    clampPointToPatrolZone,
    canFrogPatrolStandAt,
    distance2D,
    frogCelebrationMinDistance
  } = context;
  const side = frogCurrentSide();
  const zone = frogPatrolZone(side);
  const candidates = [
    { x: zone.centerX, z: zone.centerZ },
    { x: zone.minX + state.frog.radius + 0.3, z: zone.minZ + state.frog.radius + 0.3 },
    { x: zone.maxX - state.frog.radius - 0.3, z: zone.minZ + state.frog.radius + 0.3 },
    { x: zone.centerX, z: zone.maxZ - state.frog.radius - 0.3 }
  ]
    .map((point) => clampPointToPatrolZone(point, side))
    .filter((point) => canFrogPatrolStandAt(point.x, point.z, side, "celebration_perch"))
    .sort((a, b) => distance2D(b, state.human) - distance2D(a, state.human));
  return candidates.find((point) => distance2D(point, state.human) >= frogCelebrationMinDistance) ||
    candidates[0] ||
    clampPointToPatrolZone(state.frog, side);
}

export function chooseFrogCelebrationHopTargetSystem(context) {
  const {
    state,
    frogCurrentSide,
    clampPointToPatrolZone,
    canFrogPatrolStandAt,
    chooseFrogCelebrationPerch
  } = context;
  const side = frogCurrentSide();
  const perch = state.frogAi.celebrationPerch || chooseFrogCelebrationPerch(context);
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.08 + Math.random() * 0.26;
    const candidate = clampPointToPatrolZone({
      x: perch.x + Math.cos(angle) * radius,
      z: perch.z + Math.sin(angle) * radius
    }, side);
    if (canFrogPatrolStandAt(candidate.x, candidate.z, side, "celebration_perch")) return candidate;
  }
  return perch;
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}
