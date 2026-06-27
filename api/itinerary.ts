import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "./_lib/http";
import { addItineraryItem, getItinerary } from "./_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
