export const FEATURE_UNLOCK_AT_ISO = "2026-07-11T22:00:00+07:00";
export const FEATURE_UNLOCK_AT_MS = Date.parse(FEATURE_UNLOCK_AT_ISO);
export const FEATURE_LOCKED_MESSAGE = "Tinh nang nay se mo luc 22:00 ngay 11/07 theo gio Viet Nam.";

const LOCKED_FEATURE_PATHS = new Set(["/album", "/games", "/seats", "/expenses"]);
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type FeatureLockState = {
  locked: boolean;
  message: string;
  unlockAt: string;
  unlockAtMs: number;
  serverNowMs: number;
  remainingMs: number;
};

export function isFeatureLocked(nowMs = Date.now()) {
  return nowMs < FEATURE_UNLOCK_AT_MS;
}

export function getCountdownParts(milliseconds: number): CountdownParts {
  let remaining = Math.max(0, milliseconds);
  const days = Math.floor(remaining / DAY_MS);
  remaining -= days * DAY_MS;
  const hours = Math.floor(remaining / HOUR_MS);
  remaining -= hours * HOUR_MS;
  const minutes = Math.floor(remaining / MINUTE_MS);
  remaining -= minutes * MINUTE_MS;
  const seconds = Math.floor(remaining / SECOND_MS);

  return { days, hours, minutes, seconds };
}

export function getFeatureLockState(nowMs = Date.now()): FeatureLockState {
  return {
    locked: isFeatureLocked(nowMs),
    message: FEATURE_LOCKED_MESSAGE,
    unlockAt: FEATURE_UNLOCK_AT_ISO,
    unlockAtMs: FEATURE_UNLOCK_AT_MS,
    serverNowMs: nowMs,
    remainingMs: Math.max(0, FEATURE_UNLOCK_AT_MS - nowMs)
  };
}

export function isLockedFeaturePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return LOCKED_FEATURE_PATHS.has(normalized);
}
