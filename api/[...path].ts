import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  cloudinarySignatureHandler,
  dashboardHandler,
  expensesHandler,
  featureLockHandler,
  gamesHandler,
  guideHandler,
  itineraryHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  missionConfirmHandler,
  missionDrawHandler,
  missionRedrawHandler,
  photosHandler,
  pollVoteHandler,
  seatRandomHandler,
  seatsHandler,
  seatSelectHandler
} from "./_lib/handlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : typeof req.query.path === "string"
    ? req.query.path
    : "";
  const pathname = rawPath
    ? `/api/${rawPath}`
    : new URL(req.url ?? "/", "http://localhost").pathname.replace(/\/$/, "");

  switch (pathname) {
    case "/api/login":
      return loginHandler(req, res);
    case "/api/logout":
      return logoutHandler(req, res);
    case "/api/me":
      return meHandler(req, res);
    case "/api/dashboard":
      return dashboardHandler(req, res);
    case "/api/guide":
      return guideHandler(req, res);
    case "/api/itinerary":
      return itineraryHandler(req, res);
    case "/api/feature-lock":
      return featureLockHandler(req, res);
    case "/api/seats":
      return seatsHandler(req, res);
    case "/api/seats/select":
      return seatSelectHandler(req, res);
    case "/api/seats/random":
      return seatRandomHandler(req, res);
    case "/api/photos":
      return photosHandler(req, res);
    case "/api/games":
      return gamesHandler(req, res);
    case "/api/games/mission/draw":
      return missionDrawHandler(req, res);
    case "/api/games/mission/redraw":
      return missionRedrawHandler(req, res);
    case "/api/games/mission/confirm":
      return missionConfirmHandler(req, res);
    case "/api/polls/vote":
      return pollVoteHandler(req, res);
    case "/api/expenses":
      return expensesHandler(req, res);
    case "/api/cloudinary-signature":
      return cloudinarySignatureHandler(req, res);
    default:
      return res.status(404).json({ message: "API route not found" });
  }
}
