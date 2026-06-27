# Design System: Hai Phong Trip

## Visual Theme
A youthful Vietnamese group-trip dashboard for a Hai Phong getaway: lively, useful, photo-forward, and easy to scan on a bus or in a hotel lobby. The interface should feel like a trip command center mixed with a memory book, not a corporate admin panel.

Use confident asymmetry, mixed-size panels, and clean spacing. No overlapping elements. Every navigation item, card, image, and button must occupy a clear spatial zone.

## Color Palette
- Cang Teal (#0F766E): primary accent for CTAs, active tabs, focus rings, selected seats, and primary navigation state.
- Harbor Blue (#2563EB): route, timeline, and map accents.
- Coral Ticket (#E76F51): album, upload, and game emphasis badges.
- Sunflower Note (#F4B942): countdown chips, friendly alerts, highlights.
- Trip Canvas (#F8FAF7): primary app background.
- Cloud Surface (#FFFFFF): cards, inputs, modals.
- Ink Green Black (#172026): primary text; never use pure black.
- Mist Text (#667085): secondary descriptions and metadata.
- Soft Border (#D7E2DF): dividers, card borders, grid lines.

Teal is the only primary accent. Blue, coral, and sunflower are semantic support colors used sparingly for categories and states.

## Typography
- Display: Source Sans 3, weight 700-900, compact but friendly Vietnamese headings.
- Body: Source Sans 3, weight 400-600, relaxed line height.
- Mono: JetBrains Mono for countdown numbers, seat codes, timestamps, and score counters.
- Avoid Inter, generic serif fonts, pure black, neon glow, and excessive gradients.

## Components
- Navigation: icon plus concise Vietnamese labels. Desktop uses a top app nav. Mobile uses a bottom tab bar.
- Buttons: teal primary fill, white text, pressed state shifts down 1px. Secondary buttons use white surface and teal border.
- Cards: 14px radius, white surface, subtle border, soft shadow only when it clarifies hierarchy. Do not nest cards inside cards.
- Inputs: label above input, helper/error below, clear focus ring.
- Modals: centered desktop dialog, mobile bottom sheet.
- Seat grid: fixed-size tiles with clear states: available, selected, occupied, my seat, random result.
- Album: masonry-like gallery, captions, uploader names, filters, and lightbox state.
- Games: lobby cards for Quiz, Binh chon, Bingo/Vong, with realtime-feeling score and status chips.

## Layout
Desktop uses a max width around 1280-1400px with an app-shell feel. Home prioritizes countdown, today schedule, quick actions, announcements, photos, and group stats. Avoid three identical feature cards in a row.

Mobile is not a shrink of desktop. It prioritizes countdown, today's itinerary, seat, upload, and game entry. Touch targets are at least 44px. Vietnamese labels must wrap cleanly.

## Content Direction
Use Vietnamese sample content: Do Son, Nha hat Lon Hai Phong, Cat Ba, Banh da cua, nem cua be, a 3-day-2-night itinerary, and realistic Vietnamese names.

## Banned Patterns
No emojis. No purple neon UI. No generic SaaS hero. No centered marketing landing page. No dark blurred stock hero. No fake generic names. No vague AI copywriting. No overlapping text and images. No decorative orbs or bokeh blobs.
