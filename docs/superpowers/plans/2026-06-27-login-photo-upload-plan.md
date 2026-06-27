# Login Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make login and photo uploads production-ready with Supabase-backed metadata, Cloudinary direct uploads, upload spam protection, and server-side security validation.

**Architecture:** Keep the current Vite + Vercel API shape. The browser requests a signed Cloudinary upload from `/api/cloudinary-signature`, uploads the file directly to Cloudinary, then saves metadata through `/api/photos`; all protected API routes require the existing signed session cookie. Supabase is the durable source for users, photos, and upload audit events when configured; seed/runtime fallback is allowed only when Supabase is not configured.

**Tech Stack:** React, TypeScript, Vite, TanStack Query, Zod, Vercel API handlers, Supabase JS client, Cloudinary signed upload, Vitest.

---

## File Structure

- Create `src/lib/upload.ts`: shared constants and helper functions for file validation, Cloudinary URL validation, and formatting file sizes.
- Modify `src/lib/schemas.ts`: add `photoMetadataSchema` and exported `PhotoMetadataInput`.
- Modify `src/lib/api-client.ts`: add `uploadPhoto`, distinguish auth failures from local demo fallback, keep metadata-only `addPhoto`.
- Modify `src/pages/album.tsx`: wire the modal to selected files and `api.uploadPhoto`.
- Modify `api/_lib/repository.ts`: add Supabase-backed public user lookup, photos CRUD, upload-event logging, and rate-limit checks.
- Modify `api/_lib/http.ts`: resolve public users through repository logic instead of seed-only lookup.
- Modify `api/cloudinary-signature.ts`: enforce session, config, and upload rate limits before returning signed fields.
- Modify `api/photos.ts`: validate metadata, validate Cloudinary URLs, reject duplicates, and persist through repository.
- Create `docs/database/supabase-schema.sql`: SQL for `app_users`, `photos`, and `upload_events`.
- Add tests in `tests/upload.test.ts`, `tests/album-upload.test.tsx`, and update existing tests if mocks need the new API surface.

## Task 1: Shared Upload Validation

**Files:**
- Create: `src/lib/upload.ts`
- Modify: `src/lib/schemas.ts`
- Test: `tests/upload.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `tests/upload.test.ts`:

```ts
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

  it("rejects non-cloudinary photo URLs", () => {
    expect(isCloudinarySecureUrl("https://example.com/image.jpg", "demo")).toBe(false);
    expect(isCloudinarySecureUrl("http://res.cloudinary.com/demo/image/upload/a.jpg", "demo")).toBe(false);
    expect(isCloudinarySecureUrl("https://res.cloudinary.com/demo/image/upload/a.jpg", "demo")).toBe(true);
  });
});
```

Run: `npm run test -- tests/upload.test.ts`
Expected: FAIL because `src/lib/upload.ts` and `photoMetadataSchema` do not exist.

- [ ] **Step 2: Implement upload helpers**

Create `src/lib/upload.ts`:

```ts
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.includes(type as (typeof ALLOWED_IMAGE_TYPES)[number]);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
  return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`;
}

export function isCloudinarySecureUrl(value: string, cloudName: string | undefined) {
  if (!cloudName) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Add metadata schema**

Modify `src/lib/schemas.ts` to import `MAX_UPLOAD_BYTES` and add:

```ts
export const photoMetadataSchema = z.object({
  publicId: z.string().trim().min(1).max(180),
  secureUrl: z.string().trim().url(),
  caption: z.string().trim().min(1, "Nhập caption").max(160, "Caption tối đa 160 ký tự"),
  tripDay: z.coerce.number().int().min(1).max(3),
  fileSize: z.coerce.number().int().positive().max(MAX_UPLOAD_BYTES).optional()
});

export type PhotoMetadataInput = z.infer<typeof photoMetadataSchema>;
```

- [ ] **Step 4: Verify tests pass**

Run: `npm run test -- tests/upload.test.ts`
Expected: PASS.

## Task 2: Supabase Repository and Database SQL

**Files:**
- Modify: `api/_lib/repository.ts`
- Create: `docs/database/supabase-schema.sql`

- [ ] **Step 1: Add SQL schema**

Create `docs/database/supabase-schema.sql`:

```sql
create table if not exists app_users (
  id text primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text not null,
  trip_id text not null,
  password_hash text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id text primary key,
  public_id text unique not null,
  secure_url text not null,
  caption text not null,
  trip_day integer not null check (trip_day between 1 and 3),
  uploaded_by text not null references app_users(id),
  uploaded_by_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists upload_events (
  id text primary key,
  user_id text not null references app_users(id),
  public_id text,
  file_size integer,
  status text not null check (status in ('signature_issued', 'metadata_saved', 'rate_limited', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists photos_created_at_idx on photos (created_at desc);
create index if not exists upload_events_user_created_idx on upload_events (user_id, created_at desc);
```

- [ ] **Step 2: Add repository helpers**

Modify `api/_lib/repository.ts`:

```ts
type UploadEventStatus = "signature_issued" | "metadata_saved" | "rate_limited" | "rejected";

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function mapUserRow(data: Record<string, unknown>): AppUser {
  return {
    id: String(data.id),
    username: String(data.username),
    displayName: String(data.display_name),
    avatarUrl: String(data.avatar_url),
    tripId: String(data.trip_id),
    passwordHash: String(data.password_hash)
  };
}

function mapPhotoRow(data: Record<string, unknown>): Photo {
  return {
    id: String(data.id),
    publicId: String(data.public_id),
    secureUrl: String(data.secure_url),
    caption: String(data.caption),
    tripDay: Number(data.trip_day),
    uploadedBy: String(data.uploaded_by),
    uploadedByName: String(data.uploaded_by_name),
    createdAt: String(data.created_at)
  };
}
```

Add exported helpers:

```ts
export async function findUserById(userId: string) {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("app_users").select("*").eq("id", userId).single();
    if (error) throw new Error("Không tải được người dùng");
    return data ? mapUserRow(data) : null;
  }
  return seedUsers.find((user) => user.id === userId) ?? null;
}

export async function getPublicUser(userId: string) {
  const user = await findUserById(userId);
  return user ? stripPassword(user) : null;
}

export async function recordUploadEvent(input: { userId: string; publicId?: string; fileSize?: number; status: UploadEventStatus }) {
  const client = supabase();
  const event = {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: input.userId,
    public_id: input.publicId ?? null,
    file_size: input.fileSize ?? null,
    status: input.status
  };
  if (client) {
    const { error } = await client.from("upload_events").insert(event);
    if (error) throw new Error("Không ghi được lịch sử upload");
  }
}

export async function getUploadCounts(userId: string, now = new Date()) {
  const client = supabase();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  if (client) {
    const recent = await client.from("upload_events").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", tenMinutesAgo).in("status", ["signature_issued", "metadata_saved"]);
    const daily = await client.from("upload_events").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", oneDayAgo).in("status", ["signature_issued", "metadata_saved"]);
    if (recent.error || daily.error) throw new Error("Không kiểm tra được giới hạn upload");
    return { recent: recent.count ?? 0, daily: daily.count ?? 0 };
  }
  return { recent: 0, daily: 0 };
}
```

Update `getPhotos` and `addPhoto` to use Supabase when configured:

```ts
export async function getPhotos() {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("photos").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Không tải được album");
    return (data ?? []).map(mapPhotoRow);
  }
  return mutablePhotos;
}

export async function addPhoto(input: Omit<Photo, "id" | "createdAt">) {
  const client = supabase();
  const id = `photo-${Date.now()}`;
  if (client) {
    const row = {
      id,
      public_id: input.publicId,
      secure_url: input.secureUrl,
      caption: input.caption,
      trip_day: input.tripDay,
      uploaded_by: input.uploadedBy,
      uploaded_by_name: input.uploadedByName
    };
    const { data, error } = await client.from("photos").insert(row).select("*").single();
    if (error) {
      if (error.code === "23505") throw new Error("Ảnh này đã được lưu");
      throw new Error("Không lưu được ảnh");
    }
    return mapPhotoRow(data);
  }
  const photo: Photo = { ...input, id, createdAt: new Date().toISOString() };
  mutablePhotos.unshift(photo);
  return photo;
}
```

## Task 3: Protected API Hardening

**Files:**
- Modify: `api/_lib/http.ts`
- Modify: `api/cloudinary-signature.ts`
- Modify: `api/photos.ts`

- [ ] **Step 1: Use repository public user**

Modify `api/_lib/http.ts` to import `getPublicUser` from `./repository` and replace seed-only `publicUser` with:

```ts
export async function publicUser(userId: string) {
  return getPublicUser(userId);
}
```

Update callers that use `publicUser` to `await publicUser(...)`.

- [ ] **Step 2: Harden Cloudinary signature route**

Modify `api/cloudinary-signature.ts` to:

```ts
import { recordUploadEvent, getUploadCounts } from "./_lib/repository";

const RECENT_UPLOAD_LIMIT = 10;
const DAILY_UPLOAD_LIMIT = 60;

const counts = await getUploadCounts(session.userId);
if (counts.recent >= RECENT_UPLOAD_LIMIT || counts.daily >= DAILY_UPLOAD_LIMIT) {
  await recordUploadEvent({ userId: session.userId, status: "rate_limited" });
  return res.status(429).json({ message: "Bạn đã tải quá nhiều ảnh, vui lòng thử lại sau" });
}
await recordUploadEvent({ userId: session.userId, status: "signature_issued" });
```

Keep the route method as `async` and preserve the existing SHA1 signature generation.

- [ ] **Step 3: Harden photos route**

Modify `api/photos.ts` to:

```ts
import { photoMetadataSchema } from "../src/lib/schemas";
import { isCloudinarySecureUrl } from "../src/lib/upload";
import { recordUploadEvent } from "./_lib/repository";

const parsed = photoMetadataSchema.safeParse(req.body);
if (!parsed.success) {
  await recordUploadEvent({ userId: session.userId, status: "rejected" });
  return res.status(400).json({ message: "Thông tin ảnh chưa hợp lệ" });
}
if (!isCloudinarySecureUrl(parsed.data.secureUrl, process.env.CLOUDINARY_CLOUD_NAME)) {
  await recordUploadEvent({ userId: session.userId, publicId: parsed.data.publicId, fileSize: parsed.data.fileSize, status: "rejected" });
  return res.status(400).json({ message: "Đường dẫn ảnh chưa hợp lệ" });
}
```

Use `await publicUser(session.userId)` and save through `addPhoto`. Record `metadata_saved` after the photo is stored.

## Task 4: Client Upload Flow

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Add Cloudinary response types and auth-aware request fallback**

Add:

```ts
type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
};
```

Update `request<T>` errors so JSON `401` and `403` are not swallowed by local fallback in login/me/dashboard flows when production APIs are reachable.

- [ ] **Step 2: Add `uploadPhoto` helper**

Add to `api`:

```ts
async uploadPhoto(input: { file: File; caption: string; tripDay: number }) {
  const signature = await this.cloudinarySignature();
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });
  const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse & { error?: { message?: string } };
  if (!uploadResponse.ok) throw new Error(uploaded.error?.message ?? "Không tải được ảnh lên Cloudinary");

  return this.addPhoto({
    publicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    caption: input.caption,
    tripDay: input.tripDay,
    fileSize: input.file.size
  });
}
```

Update `addPhoto` input type to include optional `fileSize`.

## Task 5: Album Upload UI

**Files:**
- Modify: `src/pages/album.tsx`
- Test: `tests/album-upload.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `tests/album-upload.test.tsx` with mocks for `api.photos` and `api.uploadPhoto`. Test selected file display, oversized file rejection, and successful upload.

Core assertions:

```ts
expect(screen.getByText(/do-son.png/i)).toBeInTheDocument();
expect(screen.getByText(/File tối đa 8 MB/i)).toBeInTheDocument();
await waitFor(() => expect(mocks.uploadPhoto).toHaveBeenCalled());
```

- [ ] **Step 2: Implement selected file state**

In `AlbumPage`, add:

```ts
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [fileError, setFileError] = useState("");
const [previewUrl, setPreviewUrl] = useState("");
```

Use `isAllowedImageType`, `MAX_UPLOAD_BYTES`, and `formatFileSize` from `src/lib/upload.ts`.

- [ ] **Step 3: Wire file input**

Replace passive file input with `onChange`:

```tsx
<input
  className="sr-only"
  type="file"
  accept="image/jpeg,image/png,image/webp,image/gif"
  onChange={(event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!isAllowedImageType(file.type)) {
      setSelectedFile(null);
      setFileError("Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setSelectedFile(null);
      setFileError("File tối đa 8 MB");
      return;
    }
    setFileError("");
    setSelectedFile(file);
  }}
/>
```

- [ ] **Step 4: Use `api.uploadPhoto`**

Change mutation to:

```ts
const addPhoto = useMutation({
  mutationFn: (input: UploadInput) => {
    if (!selectedFile) throw new Error("Chọn ảnh trước khi tải lên");
    return api.uploadPhoto({ file: selectedFile, caption: input.caption, tripDay: input.tripDay });
  },
  onSuccess: () => {
    form.reset();
    setSelectedFile(null);
    setFileError("");
    setPreviewUrl("");
    setIsUploadOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["photos"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }
});
```

Disable the submit button when `!selectedFile || Boolean(fileError) || addPhoto.isPending`.

## Task 6: Full Verification

**Files:**
- All modified files

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm run test -- tests/upload.test.ts tests/album-upload.test.tsx tests/auth.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full suite**

Run:

```powershell
npm run test
```

Expected: all tests pass.

- [ ] **Step 3: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: production build completes.

- [ ] **Step 5: Security audit checklist**

Confirm from code:

- Cloudinary API secret appears only in server API code.
- Supabase service role key appears only in server repository code.
- Every photo/signature route calls `requireSession`.
- File size/type is checked before Cloudinary upload.
- Metadata is validated server-side.
- Rate limiting happens before signature issuance.
- Production Supabase errors are not silently replaced by seed login.
