# Feature Unlock Gate Design

## Goal

Lock Album upload, Games, Seats, and Expenses until 22:00 on 11 July 2026 in Vietnam time.

## Unlock Time

- Vietnam time: 2026-07-11 22:00 UTC+07:00
- ISO timestamp: `2026-07-11T22:00:00+07:00`

## Security Boundary

Frontend lock screens are only for experience. The real enforcement is server-side in Vercel API handlers using server time. A user changing local device time, editing browser JavaScript, or calling API endpoints directly must still receive a locked response before the unlock time.

This does not protect against someone with production deploy access changing code, environment variables, or database state and redeploying.

## Locked Surfaces

- `/album`
- `/games`
- `/seats`
- `/expenses`

The lock covers the whole page for those routes.

## Locked API Behavior

Before unlock, protected feature API endpoints return `423 Locked` with a JSON message and unlock timestamp. After unlock, existing behavior resumes.

## UI Behavior

Locked screens render a full-screen lock panel with a countdown in days, hours, minutes, and seconds, plus the explicit Vietnam-time unlock label.
