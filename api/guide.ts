import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "./_lib/http";
import { getGuide } from "./_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  if (!requireSession(req, res)) return;
  return res.status(200).json(await getGuide());
}
