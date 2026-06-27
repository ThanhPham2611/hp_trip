import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "../_lib/http";
import { selectSeat } from "../_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  try {
    return res.status(200).json(await selectSeat(session.userId, String(req.body?.code ?? "")));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : "Không thể chọn ghế" });
  }
}
