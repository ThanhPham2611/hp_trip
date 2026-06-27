import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "../_lib/http";
import { votePoll } from "../_lib/repository";
import { pollVoteSchema } from "../../src/lib/schemas";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  const parsed = pollVoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Bình chọn chưa hợp lệ" });
  try {
    return res.status(200).json(await votePoll(session.userId, parsed.data.pollId, parsed.data.optionId));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : "Không thể bình chọn" });
  }
}
