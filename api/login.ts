import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findUserByUsername } from "./_lib/repository";
import { methodNotAllowed, setSessionCookie } from "./_lib/http";
import { loginSchema } from "../src/lib/schemas";
import { verifyPassword } from "../src/lib/password";
import { createSessionToken } from "../src/lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
