import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  userId: string;
  username: string;
  tripId: string;
  exp?: number;
};

const encoder = new TextEncoder();

function base64UrlEncode(value: string | Uint8Array) {
  const buffer = typeof value === "string" ? Buffer.from(value) : Buffer.from(value);
  return buffer.toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">, secret: string, ttlSeconds = 60 * 60 * 24 * 7) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(body, secret);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined, secret: string): SessionPayload | null {
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = sign(body, secret);
  const actualBytes = encoder.encode(signature);
  const expectedBytes = encoder.encode(expectedSignature);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.userId || !payload.username || !payload.tripId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
