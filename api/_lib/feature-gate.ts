import type { VercelResponse } from "@vercel/node";
import { FEATURE_LOCKED_MESSAGE, FEATURE_UNLOCK_AT_ISO, getFeatureLockState, type FeatureLockState } from "../../src/lib/feature-lock";

export function createLockedFeatureResponse(state: FeatureLockState = getFeatureLockState()) {
  return {
    status: 423,
    body: {
      code: "FEATURE_LOCKED",
      message: state.message,
      unlockAt: state.unlockAt
    }
  };
}

export function rejectIfFeatureLocked(res: VercelResponse, nowMs = Date.now()) {
  const state = getFeatureLockState(nowMs);
  if (!state.locked) return false;

  const locked = createLockedFeatureResponse(state);
  res.status(locked.status).json(locked.body);
  return true;
}

export function featureLockStatusBody(nowMs = Date.now()) {
  const state = getFeatureLockState(nowMs);
  return {
    locked: state.locked,
    message: FEATURE_LOCKED_MESSAGE,
    unlockAt: FEATURE_UNLOCK_AT_ISO,
    unlockAtMs: state.unlockAtMs,
    serverNowMs: state.serverNowMs,
    remainingMs: state.remainingMs
  };
}
