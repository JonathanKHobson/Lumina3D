export function loadCubelingUnlocks(storage, storageKey) {
  try {
    const raw = storage?.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return { frogCubeling: Boolean(parsed.frogCubeling) };
  } catch {
    return { frogCubeling: false };
  }
}

export function saveCubelingUnlocks(storage, storageKey, unlocks) {
  try {
    storage?.setItem(storageKey, JSON.stringify(unlocks));
  } catch {
    // Persistence is a convenience hook; game play still works without it.
  }
}
