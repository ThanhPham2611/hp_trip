import type { VercelRequest, VercelResponse } from "@vercel/node";
import { photoMetadataSchema } from "../src/lib/schemas";
import { isCloudinarySecureUrl } from "../src/lib/upload";
import { methodNotAllowed, publicUser, requireSession } from "./_lib/http";
import { addPhoto, getPhotos, recordUploadEvent } from "./_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
