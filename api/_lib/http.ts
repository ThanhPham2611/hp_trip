import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySessionToken, type SessionPayload } from "../../src/lib/session";
import { getPublicUser } from "./repository";

export const SESSION_COOKIE = "hp_trip_session";

export function readCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(";")
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}; Secure`
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Secure`);
}

export function getSession(req: VercelRequest): SessionPayload | null {
  const secret = process.env.APP_SESSION_SECRET ?? "local-development-secret";
  return verifySessionToken(readCookie(req, SESSION_COOKIE), secret);
}

export function requireSession(req: VercelRequest, res: VercelResponse) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ message: "Ban can dang nhap" });
    return null;
  }
  return session;
}

export async function publicUser(userId: string) {
  return getPublicUser(userId);
}

export function methodNotAllowed(res: VercelResponse) {
  res.status(405).json({ message: "Method not allowed" });
}
