import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "./upload";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Nhap ten dang nhap"),
  password: z.string().min(1, "Nhap mat khau")
});

export const uploadSchema = z.object({
  caption: z.string().trim().min(1, "Nhap caption").max(160, "Caption toi da 160 ky tu"),
  tripDay: z.coerce.number().int().min(1).max(3),
  tags: z.array(z.string()).default([])
});

export const photoMetadataSchema = z.object({
  publicId: z.string().trim().min(1).max(180),
  secureUrl: z.string().trim().url(),
  caption: z.string().trim().min(1, "Nhap caption").max(160, "Caption toi da 160 ky tu"),
  tripDay: z.coerce.number().int().min(1).max(3),
  fileSize: z.coerce.number().int().positive().max(MAX_UPLOAD_BYTES).optional()
});

export const pollVoteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1)
});

export const itineraryInputSchema = z.object({
  day: z.coerce.number().int().min(1).max(3),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Nhap gio dang HH:mm"),
  title: z.string().trim().min(1, "Nhap ten hoat dong").max(80, "Ten toi da 80 ky tu"),
  category: z.enum(["move", "visit", "food", "stay", "game"]),
  location: z.string().trim().max(80).optional(),
  note: z.string().trim().max(160).optional()
});

export const expenseInputSchema = z.object({
  title: z.string().trim().min(1, "Nhap khoan chi").max(80, "Ten khoan chi toi da 80 ky tu"),
  amount: z.coerce.number().positive("So tien phai lon hon 0"),
  paidBy: z.string().min(1, "Chon nguoi tra")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;
export type PhotoMetadataInput = z.infer<typeof photoMetadataSchema>;
export type PollVoteInput = z.infer<typeof pollVoteSchema>;
export type ItineraryInput = z.infer<typeof itineraryInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
