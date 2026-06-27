import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { loginSchema, photoMetadataSchema, pollVoteSchema } from "../../src/lib/schemas";
import { verifyPassword } from "../../src/lib/password";
import { createSessionToken } from "../../src/lib/session";
import { isCloudinarySecureUrl } from "../../src/lib/upload";
import { clearSessionCookie, methodNotAllowed, publicUser, requireSession, setSessionCookie } from "./http";
import {
  addExpense,
  addItineraryItem,
  addPhoto,
  findUserByUsername,
  getDashboard,
  getExpenses,
  getGames,
  getGuide,
  getItinerary,
  getPhotos,
  getSeats,
  getUploadCounts,
  randomSeat,
  recordUploadEvent,
  selectSeat,
  votePoll
} from "./repository";

export async function loginHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Thông tin đăng nhập chưa hợp lệ" });

  const user = await findUserByUsername(parsed.data.username);
  if (!user?.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  const token = createSessionToken(
    { userId: user.id, username: user.username, tripId: user.tripId },
    process.env.APP_SESSION_SECRET ?? "local-development-secret"
  );
  setSessionCookie(res, token);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return res.status(200).json({ user: safeUser });
}

export function logoutHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}

export async function meHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  return res.status(200).json({ user: await publicUser(session.userId) });
}

export async function dashboardHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  return res.status(200).json(await getDashboard(session.userId));
}

export async function guideHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  if (!requireSession(req, res)) return;
  return res.status(200).json(await getGuide());
}

export async function itineraryHandler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") return res.status(200).json(await getItinerary());
  if (req.method !== "POST") return methodNotAllowed(res);

  const item = await addItineraryItem(
    {
      day: Number(req.body?.day ?? 1),
      time: String(req.body?.time ?? "09:00"),
      title: String(req.body?.title ?? ""),
      category: req.body?.category ?? "visit",
      location: req.body?.location ? String(req.body.location) : undefined,
      note: req.body?.note ? String(req.body.note) : undefined
    },
    session.userId
  );
  return res.status(201).json(item);
}

export async function seatsHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  if (!requireSession(req, res)) return;
  return res.status(200).json(await getSeats());
}

export async function seatSelectHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  try {
    return res.status(200).json(await selectSeat(session.userId, String(req.body?.code ?? "")));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : "Không thể chọn ghế" });
  }
}

export async function seatRandomHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireSession(req, res);
  if (!session) return;
  try {
    return res.status(200).json(await randomSeat(session.userId));
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : "Không thể random ghế" });
  }
}

export async function photosHandler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") return res.status(200).json(await getPhotos());
  if (req.method !== "POST") return methodNotAllowed(res);

  const parsed = photoMetadataSchema.safeParse(req.body);
  if (!parsed.success) {
    await recordUploadEvent({ userId: session.userId, status: "rejected" });
    return res.status(400).json({ message: "Thong tin anh chua hop le" });
  }

  if (!isCloudinarySecureUrl(parsed.data.secureUrl, process.env.CLOUDINARY_CLOUD_NAME)) {
    await recordUploadEvent({
      userId: session.userId,
      publicId: parsed.data.publicId,
      fileSize: parsed.data.fileSize,
      status: "rejected"
    });
    return res.status(400).json({ message: "Duong dan anh chua hop le" });
  }

  const user = await publicUser(session.userId);
  try {
    const photo = await addPhoto({
      publicId: parsed.data.publicId,
      secureUrl: parsed.data.secureUrl,
      caption: parsed.data.caption,
      tripDay: parsed.data.tripDay,
      uploadedBy: session.userId,
      uploadedByName: user?.displayName ?? session.username
    });
    await recordUploadEvent({
      userId: session.userId,
      publicId: parsed.data.publicId,
      fileSize: parsed.data.fileSize,
      status: "metadata_saved"
    });
    return res.status(201).json(photo);
  } catch (error) {
    if (error instanceof Error && error.message.includes("da duoc luu")) {
      return res.status(409).json({ message: "Anh nay da duoc luu" });
    }
    return res.status(500).json({ message: "Khong luu duoc anh" });
  }
}

export async function gamesHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  if (!requireSession(req, res)) return;
  return res.status(200).json(await getGames());
}

export async function pollVoteHandler(req: VercelRequest, res: VercelResponse) {
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

export async function expensesHandler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;

  if (req.method === "GET") return res.status(200).json(await getExpenses());
  if (req.method !== "POST") return methodNotAllowed(res);

  const expense = await addExpense({
    title: String(req.body?.title ?? ""),
    amount: Number(req.body?.amount ?? 0),
    paidBy: String(req.body?.paidBy ?? "")
  });
  return res.status(201).json(expense);
}

export async function cloudinarySignatureHandler(req: VercelRequest, res: VercelResponse) {
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
  if (counts.recent >= 10 || counts.daily >= 60) {
    await recordUploadEvent({ userId: session.userId, status: "rate_limited" });
    return res.status(429).json({ message: "Ban da tai qua nhieu anh, vui long thu lai sau" });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  await recordUploadEvent({ userId: session.userId, status: "signature_issued" });
  return res.status(200).json({ cloudName, apiKey, folder, timestamp, signature });
}
