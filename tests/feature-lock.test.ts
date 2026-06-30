import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { seatsHandler } from "../api/_lib/handlers";
import { SESSION_COOKIE } from "../api/_lib/http";
import { createSessionToken } from "../src/lib/session";
import {
  FEATURE_UNLOCK_AT_ISO,
  getCountdownParts,
  getFeatureLockState,
  isFeatureLocked,
  isLockedFeaturePath
} from "../src/lib/feature-lock";
import { createLockedFeatureResponse } from "../api/_lib/feature-gate";

function createMockResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader() {
      return this;
    }
  };
  return response as unknown as VercelResponse & { statusCode: number; body: unknown };
}

function authenticatedRequest(method: string) {
  const token = createSessionToken(
    { userId: "user-linh", username: "linh", tripId: "trip-hai-phong-2026" },
    "local-development-secret"
  );
  return {
    method,
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    body: {}
  } as VercelRequest;
}

describe("feature unlock gate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the Vietnam-time unlock timestamp", () => {
    expect(FEATURE_UNLOCK_AT_ISO).toBe("2026-07-11T22:00:00+07:00");
  });

  it("locks before 22:00 Vietnam time on 11 July 2026", () => {
    expect(isFeatureLocked(new Date("2026-07-11T21:59:59+07:00").getTime())).toBe(true);
  });

  it("unlocks at exactly 22:00 Vietnam time on 11 July 2026", () => {
    expect(isFeatureLocked(new Date("2026-07-11T22:00:00+07:00").getTime())).toBe(false);
  });

  it("formats countdown parts without going negative", () => {
    expect(getCountdownParts(90061000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
    expect(getCountdownParts(-1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("marks only the requested feature routes as locked pages", () => {
    expect(isLockedFeaturePath("/album")).toBe(true);
    expect(isLockedFeaturePath("/games")).toBe(true);
    expect(isLockedFeaturePath("/seats")).toBe(true);
    expect(isLockedFeaturePath("/expenses")).toBe(true);
    expect(isLockedFeaturePath("/guide")).toBe(false);
    expect(isLockedFeaturePath("/schedule")).toBe(false);
  });

  it("returns an API lock response payload before unlock", () => {
    const state = getFeatureLockState(new Date("2026-07-11T12:00:00+07:00").getTime());

    expect(createLockedFeatureResponse(state)).toEqual({
      status: 423,
      body: {
        code: "FEATURE_LOCKED",
        message: "Tinh nang nay se mo luc 22:00 ngay 11/07 theo gio Viet Nam.",
        unlockAt: "2026-07-11T22:00:00+07:00"
      }
    });
  });

  it("rejects locked feature API handlers before unlock even with a valid session", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T12:00:00+07:00"));

    const res = createMockResponse();

    await seatsHandler(authenticatedRequest("GET"), res);

    expect(res.statusCode).toBe(423);
    expect(res.body).toMatchObject({
      code: "FEATURE_LOCKED",
      unlockAt: "2026-07-11T22:00:00+07:00"
    });
  });
});
