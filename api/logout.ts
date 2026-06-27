import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearSessionCookie, methodNotAllowed } from "./_lib/http";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
