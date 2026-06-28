# Games Card And Wheel Design

## Goal

Replace the current Games page with a playful trip challenge experience based on the Stitch screen "Rut the - Thu Thach Hanh Trinh".

The page must support two main flows:

1. A personal mission card that appears when a logged-in user enters Games.
2. A shared eating-time game area with a random wheel and shared card draw for unlimited rounds.

## Scope

This change is limited to the Games page and supporting client-side data/types. It should not require a backend migration.

The first implementation stores each user's personal mission state in local storage by user id. This keeps the feature fast to ship and preserves the selected mission across refreshes on the same device.

## Personal Mission Flow

When a user opens `/games`, the page shows a large draw-card experience inspired by the Stitch mobile design:

- Dark burgundy stage.
- Floating card with tactile border, glow, and draw animation.
- Clear primary action to draw a card.
- Mission result displayed on the opened card.

Rules:

- The user gets an initial draw immediately through the draw interaction.
- After the first mission is shown, the user has 2 more redraws.
- Each redraw replaces the mission and decreases the remaining redraw count.
- Once redraws reach 0, the mission is locked.
- Reloading the app preserves the current mission and remaining redraw count for that user on that device.

## Shared Eating-Time Games

Below the personal mission area, the page includes shared games for meal time:

- Random wheel: spins through playful prompts and lands on one result.
- Shared card draw: opens a group challenge card.

Rules:

- Shared games can be played repeatedly.
- Shared games do not consume personal redraws.
- Results can change every round.

## UI Structure

The Games page uses these sections:

1. Header stage
   - Title: "Thu Thach Hanh Trinh"
   - Supporting text about drawing a personal mission.
   - Room/trip badge.

2. Personal mission card
   - Pre-draw state: back of card and "Rut the" button.
   - Drawing state: animated lift/tilt/flip.
   - Result state: mission title, mission text, category badge, remaining redraws, redraw button.

3. Shared play area
   - Two controls/tabs: "Vong quay" and "Rut the chung".
   - Wheel panel with spin button and result.
   - Group card panel with draw button and result.

4. Small mission list/history teaser
   - Shows a few possible challenge categories or selected game prompts.
   - Avoids bringing back the old quiz/poll dashboard.

## Data Model

Client-only constants:

- Personal mission deck:
  - id
  - title
  - description
  - category
  - tone

- Shared prompts:
  - wheel prompts
  - group card prompts

Local storage key:

- `hp_trip_personal_mission:<userId>`

Stored value:

- mission id
- remaining redraws
- updated timestamp

## Animation

Use Framer Motion, already installed in the project.

Expected motion:

- Card entrance: fade in, rise, slight scale.
- Idle card: subtle floating loop.
- Draw/redraw: lift, rotate/tilt, then settle.
- Result reveal: front face fades/scales in after the draw.
- Wheel: rotate several turns and stop at the selected result.

Animation should respect normal React state and avoid timers that can leave stale state after unmount.

## Error Handling

If the user data is unavailable, the protected route should already redirect or block access. The Games page should still render a generic fallback if user info cannot be read.

If local storage is unavailable, the feature should continue in memory for the current session.

## Testing

Add focused tests for:

- Personal mission draw starts with 2 redraws remaining.
- Redraw decreases remaining count.
- Redraw button disables after the limit.
- Shared game actions can be triggered repeatedly.

Run typecheck/build after implementation.

## Out Of Scope

- Backend persistence for missions.
- Multiplayer synchronization.
- Admin editing for mission decks.
- Reworking the global app shell navigation.
