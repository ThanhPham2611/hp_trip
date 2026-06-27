import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "./_lib/http";
import { getDashboard } from "./_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  return res.status(200).json(await getDashboard(session.userId));
}
