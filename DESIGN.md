# DESIGN.md — Mock Interview

Direction for UI work. antislop filters technique; this file supplies identity.

## Product

A solo practice room that feels like joining a **Google Meet interview**: camera check, then a live call with HR and a technical interviewer. Coaching chrome (question, transcript, tips) sits inside that familiar meeting frame. It is not a marketing landing page and not an AI dashboard.

## Identity

| Field | Direction |
| --- | --- |
| Brand name | Mock Interview |
| Metaphor | Remote interview on Meet |
| Personality | Calm, focused, professional, familiar |
| Audience | Software engineers rehearsing interviews |
| Mood | Quiet confidence; low drama |

## Theme split

| Surface | Theme | Why |
| --- | --- | --- |
| Lobby (pre-join) | Dark Meet pre-join | Matches “check camera before entering” |
| Live session | Dark meeting room | Familiar call canvas |
| Report | Dark Meet review | Same room after the call; PDF stays light for sharing/print |

Dark is intentional for the product shell (R-21). Downloaded PDFs use a light paper layout so they stay readable when shared or printed.

## Palette

Core (2–3) + one accent:

| Token | Value | Role |
| --- | --- | --- |
| `--meet-bg` | `#111111` | Call / lobby canvas |
| `--meet-surface` | `#202124` | Tiles, control bar |
| `--meet-border` | `#3c4043` | Tile edges |
| `--meet-text` | `#e8eaed` | Primary text on dark |
| `--meet-muted` | `#9aa0a6` | Secondary labels |
| `--accent` | `#0b8043` | Join / Start / primary actions (Meet-like green) |
| `--accent-fg` | `#ffffff` | Text on accent |
| `--record` | `#d93025` | Recording / leave danger |

No purple gradients, no glow stacks, no neon orbs.

## Typography

| Role | Face | Why |
| --- | --- | --- |
| UI / body | IBM Plex Sans | Clear, corporate, interview-ready; not Inter/Geist default |
| Display (titles) | IBM Plex Sans (semibold) | Same family keeps the room quiet |
| Mono (metrics only) | IBM Plex Mono | Numbers and WPM chips |

Avoid decorative serif or sci-fi display faces.

## Radii and elevation

| Token | Value | Use |
| --- | --- | --- |
| `--radius-tile` | `12px` | Video tiles |
| `--radius-control` | `24px` | Circular Meet-style control buttons |
| `--radius-panel` | `8px` | Question / transcript panels |
| `--radius-cta` | `8px` | Rectangular primary CTA (not every control is a pill) |

Shadows: almost none on dark call UI. Report cards may use one soft elevation only.

## Layout principles

1. **Lobby = Meet pre-join**: equal-height preview + settings; level and duration only; one primary Start. No focus-tag chips for now. No feature grids, fake stats, or eyebrow badges.
2. **Session = three tiles + coaching strip + bottom bar**: HR, Technical, You. Question and transcript under the tiles. Controls docked at the bottom like Meet.
3. **Report = dark review room**: full-width summary + sectioned Q/A; downloadable light PDF for sharing.
4. Mobile: stack preview above settings; both full width; controls remain thumb-reachable (≥44px).
## Motion (MOTION dial: 2)

1. Active-speaker border on the talking interviewer tile
2. Question panel cross-fade when the prompt changes
3. Mic control pulse while recording

Respect `prefers-reduced-motion`.

## Liveliness dials

| Dial | Value | Meaning |
| --- | --- | --- |
| ENERGY | 2 | Calm room; accent only on Start / Next / speaking |
| RHYTHM | 2 | Lobby, session, and report each have a different composition |
| MOTION | 2 | Three purposeful motions above |

## Copy tone

- Short, direct, human
- No “AI-powered”, “unlock”, “supercharge”, or fake social proof
- Errors name the fix: “Allow microphone in the browser, then try again.”
- Feedback tips stay specific and kind

## Screens (must feel like this)

### Prep hub (home)

- Dark Meet canvas; step cards: Decode → Predict → Interview → Cheat sheet
- Settings opens BYOK (Gemini + OpenRouter keys in localStorage only)
- Past prep packs list; link to classic bank lobby

### Lobby / pre-join (classic or after predict)

- Full dark canvas; header above a **two-column equal-height** row
- Left: device preview (camera feed, or mic-ready avatar in mic-only mode)
- Right: Devices (Mic only / Cam + mic) + Level + Duration
- Duration drives question count (shown as “About N questions · ~M minutes”)
- Company blurb as small helper text
- Primary: **Start interview** pinned to the bottom of the settings panel
- Past reports under the pair, full width
- If Cam + mic fails, automatically fall back to mic-only when audio works
- Link back to Prep hub

### Live session

- Viewport-locked session (`h-dvh`, no page scroll)
- Always 3 columns: people (~22%) · question (equal) · transcript (equal)
- People cluster: **You, Alex, Sam** each as normal 16:9 tiles, stacked (You on top)
- Left column ~20–22% width so three 16:9 tiles fit the viewport with question + transcript
- Speaking indicator on active tile; Leave top-right; controls docked bottom

### Report

- Dark Meet canvas (`meet-bg` / `meet-surface`) matching lobby and session
- Full-width header with Download PDF + Back to lobby
- Summary strip (answers, pace, fillers, question count, sections)
- Turns grouped by section; each turn is Q/A left, delivery + tips right on desktop
- Downloadable PDF: `report_mock_interview_DD-MM-YYYY_NNN.pdf` (NNN 001–100 per day)
- PDF layout: dark branded header, summary cards, sectioned Q/A cards with metrics and coaching (light paper for print/share)

## Anti-patterns for this product

- Purple/indigo “AI SaaS” skins
- Eyebrow pills (“Beta”, “AI Practice”)
- Bento dashboards on the lobby
- Identical icon feature cards
- Decorative mesh gradients behind the call
- Em dashes in UI chrome copy

## References from product discussion

- Google Meet interview flow: permissions → room → speak → next
- HR + Technical as two interviewer tiles; applicant self-view
- Delivery coaching after each answer; report after the session
