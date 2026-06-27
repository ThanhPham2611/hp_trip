# Login and Photo Upload Design

Date: 2026-06-27
Project: Hai Phong Trip

## Goal

Make login and photo upload production-ready while keeping the current demo fallback useful during local development. Demo fallback must be explicit: it may run when Supabase environment variables are missing, but it must not hide real authentication or database errors in a configured production environment.

The implementation will use Supabase for durable app data and Cloudinary for image storage. The browser will upload image files directly to Cloudinary with a short-lived signed request from the app API. The app API will authenticate the user, enforce upload limits, and persist photo metadata in Supabase.

## Current State

- Login UI exists in `src/pages/login.tsx`.
- `/api/login`, `/api/me`, and `/api/logout` already use signed session cookies.
- Password verification already uses PBKDF2 hashes.
- Supabase is only used for `app_users` lookup in `api/_lib/repository.ts`.
- Album upload UI exists, but it ignores the selected file and stores a hardcoded Unsplash URL.
- `/api/cloudinary-signature` exists, but the frontend does not call it.
- `/api/photos` persists only to runtime memory when Supabase is not used for photos.

## Recommended Approach

Use Cloudinary direct browser upload plus Supabase metadata persistence.

Flow:

1. User logs in through `/api/login`.
2. Server verifies the user from Supabase `app_users`, signs a session token, and sets `hp_trip_session` as an HttpOnly cookie.
3. User selects an image in the Album upload modal.
4. Frontend validates file type and size before starting upload.
5. Frontend requests `/api/cloudinary-signature`.
6. Server verifies the session and checks upload rate limits before returning signed Cloudinary fields.
7. Frontend uploads the image file to Cloudinary using `FormData`.
8. Frontend posts returned `public_id`, `secure_url`, caption, trip day, and file size to `/api/photos`.
9. Server validates the payload, verifies the session, stores metadata in Supabase `photos`, records an `upload_events` row, and returns the saved photo.
10. Album and dashboard queries invalidate and refetch from `/api/photos` and `/api/dashboard`.

This avoids routing large files through Vercel functions while still keeping server control over authentication, signatures, limits, and metadata.

## Data Model

### `app_users`

Purpose: login and user identity.

Columns:

- `id text primary key`
- `username text unique not null`
- `display_name text not null`
- `avatar_url text not null`
- `trip_id text not null`
- `password_hash text not null`
- `role text not null default 'member'`
- `created_at timestamptz not null default now()`

### `photos`

Purpose: durable album metadata.

Columns:

- `id text primary key`
- `public_id text unique not null`
- `secure_url text not null`
- `caption text not null`
- `trip_day integer not null check (trip_day between 1 and 3)`
- `uploaded_by text not null references app_users(id)`
- `uploaded_by_name text not null`
- `created_at timestamptz not null default now()`

### `upload_events`

Purpose: anti-spam and audit trail.

Columns:

- `id text primary key`
- `user_id text not null references app_users(id)`
- `public_id text`
- `file_size integer`
- `status text not null`
- `created_at timestamptz not null default now()`

Statuses:

- `signature_issued`
- `metadata_saved`
- `rate_limited`
- `rejected`

## API Design

### `POST /api/login`

Existing route remains, with these improvements:

- Read users from Supabase when configured.
- Preserve seed fallback only for local/demo mode when Supabase is not configured. If Supabase is configured but returns an error, return the real API error instead of silently authenticating against seed data.
- Return generic invalid credential errors.
- Keep password hash out of all responses.

### `GET /api/me`

Existing route remains, with this improvement:

- Resolve the public user through repository logic so Supabase users work correctly. Seed fallback remains only when Supabase is not configured.

### `POST /api/cloudinary-signature`

Responsibilities:

- Require a valid session.
- Enforce rate limits before issuing a signature.
- Return `cloudName`, `apiKey`, `folder`, `timestamp`, and `signature`.
- Return `501` if Cloudinary env vars are missing.
- Return `429` when upload limits are exceeded.

Rate limits:

- Maximum 10 signature requests per user per 10 minutes.
- Maximum 60 signature requests per user per day.

These limits are enforced through Supabase `upload_events` when Supabase is configured. In local/demo fallback, an in-memory limiter may be used so the UX still behaves sensibly.

### `GET /api/photos`

Responsibilities:

- Require a valid session.
- Return photos ordered by newest first.
- Prefer Supabase `photos`.
- Fall back to seed/runtime photos only when Supabase is not configured. If Supabase is configured but fails, return an error so production data problems are visible.

### `POST /api/photos`

Responsibilities:

- Require a valid session.
- Validate `publicId`, `secureUrl`, `caption`, `tripDay`, and optional `fileSize`.
- Accept only Cloudinary secure URLs.
- Reject duplicate `publicId`.
- Save metadata to Supabase.
- Record `metadata_saved` in `upload_events`.

## Frontend Design

### Album Upload Modal

The current modal stays visually similar but becomes functional.

Behavior:

- File input stores the selected `File`.
- UI shows selected file name and size.
- Optional object URL preview appears before upload.
- Upload button is disabled until caption, trip day, and file are valid.
- Upload button stays disabled while upload is running.
- Errors are shown inline in the modal.
- Successful upload resets the form, closes the modal, and invalidates `photos` and `dashboard` queries.

Client validation:

- Accept only `image/jpeg`, `image/png`, `image/webp`, and `image/gif`.
- Maximum file size: 8 MB.
- Caption max remains 160 characters.
- Trip day must be 1, 2, or 3.

### API Client

Add an `uploadPhoto` helper that composes the full flow:

1. Request Cloudinary signature.
2. Upload the file to Cloudinary.
3. Save metadata through `/api/photos`.

Existing `addPhoto` can remain for metadata-only use, but the Album page should use the new full upload helper.

## Security Audit Requirements

- Cloudinary API secret must remain server-only.
- Supabase service role key must remain server-only.
- Session cookie remains `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and seven-day max age.
- All protected API routes must call `requireSession`.
- Server validates all user-controlled fields even if the frontend already validates them.
- Credential failures must not reveal whether the username or password was wrong.
- Photo `secureUrl` must be HTTPS and must belong to the configured Cloudinary account.
- `publicId` must be unique to prevent duplicate metadata spam.
- Upload rate limiting must happen before signature issuance, not only after metadata save.
- Fallback localStorage authentication must not mask real production authentication failures when the API returns a JSON `401` or `403`.
- No API response may include `passwordHash`, Supabase service role key, Cloudinary API secret, or raw session secret.

## Error Handling

- Missing Cloudinary config: `501` with a Vietnamese message explaining upload is not configured.
- Rate limit exceeded: `429` with a short Vietnamese message and no stack details.
- Invalid file metadata: `400`.
- Missing or expired session: `401`.
- Duplicate photo public ID: `409`.
- Unexpected Supabase or Cloudinary failures: user-facing generic message, detailed error kept out of client response.

## Testing Plan

Unit tests:

- Existing password/session tests continue to pass.
- Add schema tests for valid and invalid photo metadata.
- Add tests for Cloudinary URL validation.
- Add rate-limit helper tests if rate limit logic is extracted.

API tests or handler-level tests:

- `/api/cloudinary-signature` rejects unauthenticated requests.
- `/api/cloudinary-signature` returns `501` when env vars are missing.
- `/api/photos` rejects unauthenticated requests.
- `/api/photos` rejects invalid metadata.

Component tests:

- Album modal shows selected file name and size.
- Oversized files show an inline error and do not call upload.
- Successful upload calls the upload helper, closes the modal, and refreshes data.

Verification commands:

- `npm run test`
- `npm run typecheck`
- `npm run build`

## Out Of Scope

- Multi-file batch upload.
- Image editing, cropping, or compression.
- Admin moderation UI.
- Deleting Cloudinary assets.
- Replacing Cloudinary with Supabase Storage.
- Full database migration automation against a live Supabase project.

## Open Operational Steps

The repo will include SQL for table creation, but a human still needs to run it in the target Supabase project and provide these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`

## Acceptance Criteria

- Users can log in with Supabase-backed `app_users`.
- Protected pages remain inaccessible without a valid session.
- Logged-in users can upload a real image file from Album.
- Uploaded image files appear in Cloudinary.
- Photo metadata persists in Supabase and survives function restarts.
- Upload spam is rate-limited before Cloudinary signatures are issued.
- Oversized and non-image files are rejected before upload.
- The app does not expose server secrets in client responses or bundled frontend code.
- Tests, typecheck, and build pass.
