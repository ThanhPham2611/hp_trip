import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, publicUser, requireSession } from "./_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  return res.status(200).json({ user: await publicUser(session.userId) });
}
