import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { methodNotAllowed, requireSession } from "./_lib/http";
import { getUploadCounts, recordUploadEvent } from "./_lib/repository";

const RECENT_UPLOAD_LIMIT = 10;
const DAILY_UPLOAD_LIMIT = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "hai-phong-trip";
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(501).json({ message: "Cloudinary chua duoc cau hinh" });
  }

  const counts = await getUploadCounts(session.userId);
  if (counts.recent >= RECENT_UPLOAD_LIMIT || counts.daily >= DAILY_UPLOAD_LIMIT) {
    await recordUploadEvent({ userId: session.userId, status: "rate_limited" });
    return res.status(429).json({ message: "Ban da tai qua nhieu anh, vui long thu lai sau" });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  await recordUploadEvent({ userId: session.userId, status: "signature_issued" });
  return res.status(200).json({ cloudName, apiKey, folder, timestamp, signature });
}
