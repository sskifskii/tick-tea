import { MAX_SECONDS, createSession, reconcile } from "./session";
import type { Session } from "./session";
export const STORAGE_KEY = "tick-tea:v2";
export interface Settings {
  sound: boolean;
  vibration: boolean;
}
export interface SavedState {
  version: 2;
  session: Session;
  settings: Settings;
}
export const defaultSettings: Settings = { sound: true, vibration: true };
const defaults = (): SavedState => ({
  version: 2,
  session: createSession(),
  settings: { ...defaultSettings },
});
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;
export function validSession(value: unknown): value is Session {
  if (!isObject(value) || !integer(value.increment, 0, MAX_SECONDS))
    return false;
  if (
    !integer(value.infusion, 1, 10000) ||
    !integer(value.duration, 1, MAX_SECONDS)
  )
    return false;
  if (
    typeof value.remainingMs !== "number" ||
    !Number.isFinite(value.remainingMs) ||
    value.remainingMs < 0 ||
    value.remainingMs > value.duration * 1000
  )
    return false;
  if (
    typeof value.status !== "string" ||
    !["idle", "running", "paused", "completed"].includes(value.status)
  )
    return false;
  if (
    value.status === "running"
      ? !integer(value.endsAt, 0, 8640000000000000)
      : value.endsAt !== null
  )
    return false;
  if (value.status === "idle" && value.remainingMs !== value.duration * 1000)
    return false;
  if (value.status === "paused" && value.remainingMs <= 0) return false;
  if (value.status === "completed" && value.remainingMs !== 0) return false;
  if (
    !Array.isArray(value.history) ||
    value.history.length !==
      value.infusion - (value.status === "completed" ? 0 : 1)
  )
    return false;
  return value.history.every(
    (item, index) =>
      isObject(item) &&
      item.number === index + 1 &&
      integer(item.duration, 1, MAX_SECONDS) &&
      (item.number !== value.infusion || item.duration === value.duration),
  );
}
export function decodeState(raw: string | null, now = Date.now()): SavedState {
  try {
    if (!raw) return defaults();
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.version !== 2) return defaults();
    const settings =
      isObject(data.settings) &&
      typeof data.settings.sound === "boolean" &&
      typeof data.settings.vibration === "boolean"
        ? { sound: data.settings.sound, vibration: data.settings.vibration }
        : { ...defaultSettings };
    return {
      version: 2,
      settings,
      session: validSession(data.session)
        ? reconcile(data.session, now)
        : createSession(),
    };
  } catch {
    return defaults();
  }
}
export function loadState(): SavedState {
  try {
    return decodeState(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return defaults();
  }
}
export function saveState(state: SavedState): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
