import { chromium } from "playwright";

const DEFAULT_URL = process.env.LUMINA3D_URL || "http://127.0.0.1:5178/";
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_POLL_MS = 100;
const DEFAULT_VIEWPORT = { width: 1360, height: 860 };

export function fail(message, context = null) {
  const payload = {
    ok: false,
    error: {
      message: String(message),
      ...(context ? { context } : {})
    }
  };
  throw new Error(JSON.stringify(payload));
}

export function formatJson(payload) {
  return JSON.stringify(payload, null, 2);
}

export function formatStatusPayload(payload) {
  return JSON.stringify(payload);
}

export function compactObjectSummary(level) {
  return {
    id: level.id,
    name: level.name,
    sceneId: level.sceneId
  };
}

export async function launchGameBrowser({
  headless = true,
  url = DEFAULT_URL,
  viewport = DEFAULT_VIEWPORT
} = {}) {
  const browser = await chromium.launch({
    headless,
    args: ["--use-gl=egl", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
  });
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
  await page.goto(url, { waitUntil: "networkidle" });
  return { browser, page };
}

export async function readState(page) {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

export async function waitForGameReady(page, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS
} = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const payload = await page.evaluate(() => {
      if (!window.render_game_to_text) return null;
      try {
        return JSON.parse(window.render_game_to_text());
      } catch {
        return null;
      }
    });
    if (payload && payload.ready) return payload;
    await page.waitForTimeout(pollMs);
  }
  fail("Timed out waiting for render_game_to_text().ready", { timeoutMs });
}

export async function setPaused(page, value = true) {
  await page.evaluate((paused) => window.set_game_test_pause(Boolean(paused)), value);
}

export async function advance(page, ms = 120) {
  await page.evaluate((stepMs) => {
    if (typeof window.advanceTime === "function") window.advanceTime(stepMs);
  }, ms);
}

export async function tap(page, key, downMs = 95, upMs = 45) {
  await page.keyboard.down(key);
  await advance(page, downMs);
  await page.keyboard.up(key);
  await advance(page, upMs);
}

export async function hold(page, key, ms = 280, stepMs = 220) {
  await page.keyboard.down(key);
  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(stepMs, remaining);
    await advance(page, step);
    remaining -= step;
  }
  await page.keyboard.up(key);
  await advance(page, 50);
}

export async function waitForState(page, predicate, { timeoutMs = DEFAULT_TIMEOUT_MS, pollMs = DEFAULT_POLL_MS, label = "state predicate" } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await readState(page);
    if (predicate(state)) return state;
    await page.waitForTimeout(pollMs);
  }
  fail(`Timed out waiting for ${label}`, { timeoutMs });
}

export async function jumpToLevel(page, key, levelId = "unknown") {
  await page.keyboard.press(key);
  await advance(page, 120);
  return `digit-${key}`;
}

export async function ensureLevelState(page, levelId) {
  await setPaused(page, true);
  return waitForState(page, (state) => state && state.scene && state.scene.id === levelId, {
    label: `scene.id === ${levelId}`,
    timeoutMs: DEFAULT_TIMEOUT_MS
  });
}

export async function waitForScenePlayPhase(page, levelId, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  allowTitle = true
} = {}) {
  const phaseTarget = allowTitle ? ["title", "arrival", "play"] : ["arrival", "play"];
  const state = await waitForState(page, (s) => {
    if (!s?.scene || s.scene.id !== levelId) return false;
    return phaseTarget.includes(s.scene.phase) || (s.levelOne?.phase && phaseTarget.includes(s.levelOne.phase)) || (s.levelTwo?.phase && phaseTarget.includes(s.levelTwo.phase));
  }, { label: `scene.id === ${levelId} and phase in ${phaseTarget.join("|")}`, timeoutMs });
  return state;
}

export async function waitForScenePlayOnly(page, levelId, { timeoutMs = DEFAULT_TIMEOUT_MS, includeTutorial = false } = {}) {
  const state = await waitForState(page, (s) => {
    if (!s?.scene || s.scene.id !== levelId) return false;
    if (!includeTutorial && levelId === "tutorial") return true;
    if (s.scene.phase === "play") return true;
    return false;
  }, { label: `scene.id === ${levelId} and scene.phase === play`, timeoutMs });
  return state;
}
