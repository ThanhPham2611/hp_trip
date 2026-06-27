import { describe, expect, it } from "vitest";
import { photoMetadataSchema } from "../src/lib/schemas";
import { formatFileSize, isAllowedImageType, isCloudinarySecureUrl, MAX_UPLOAD_BYTES } from "../src/lib/upload";

describe("upload validation", () => {
  it("accepts supported image mime types", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true);
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/webp")).toBe(true);
    expect(isAllowedImageType("image/gif")).toBe(true);
    expect(isAllowedImageType("application/pdf")).toBe(false);
  });

  it("formats file size labels", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
  });

  it("exposes an 8MB upload limit", () => {
    expect(MAX_UPLOAD_BYTES).toBe(8 * 1024 * 1024);
  });

  it("validates photo metadata", () => {
    const parsed = photoMetadataSchema.parse({
      publicId: "hai-phong-trip/photo-1",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/hai-phong-trip/photo-1.jpg",
      caption: "Check-in Do Son",
      tripDay: 2,
      fileSize: 123456
    });

    expect(parsed.tripDay).toBe(2);
  });

  it("rejects invalid photo metadata", () => {
    const parsed = photoMetadataSchema.safeParse({
      publicId: "",
      secureUrl: "not-a-url",
      caption: "",
      tripDay: 4,
      fileSize: MAX_UPLOAD_BYTES + 1
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects non-cloudinary photo URLs", () => {
    expect(isCloudinarySecureUrl("https://example.com/image.jpg", "demo")).toBe(false);
    expect(isCloudinarySecureUrl("http://res.cloudinary.com/demo/image/upload/a.jpg", "demo")).toBe(false);
    expect(isCloudinarySecureUrl("https://res.cloudinary.com/demo/image/upload/a.jpg", "demo")).toBe(true);
  });
});
