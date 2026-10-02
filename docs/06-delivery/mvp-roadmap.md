# MVP Roadmap

Phased build order. Complete planning docs first (this folder), then implement in thin vertical slices.

## Phase 0 — Docs (current)

- [x] PRD, journeys, UX, session flow, question banks, architecture, roadmap

## Phase 1 — Meet-like shell (no AI)

- Lobby with level select  
- Static session layout: 3 tiles, control bar, question card placeholder  
- Navigation lobby → fake session → empty report  

**Exit:** UI familiar; no media yet.

## Phase 2 — Media permissions

- `getUserMedia` + permission gate  
- Applicant live video tile  
- Mute / camera toggle / leave cleans up tracks  

**Exit:** User can see themselves in the room.

## Phase 3 — Scripted session engine

- Zustand (or equivalent) turn state machine  
- Load seeded questions by level/section  
- Next question advances turns  
- Section handoff banner  

**Exit:** Full scripted run with text-only questions.

## Phase 4 — Speech I/O

- TTS for interviewer question + acknowledgment (phrase bank)  
- STT into transcript panel  
- Think timer + mic start/stop  

**Exit:** Spoken practice loop works offline of OpenRouter.

## Phase 5 — Delivery metrics

- Filler counts, WPM, basic pause/clarity heuristics  
- Feedback card from heuristics alone  

**Exit:** Per-answer delivery tips without LLM.

## Phase 6 — OpenRouter coaching

- Server routes + env key  
- Acknowledgments + richer tips  
- Graceful fallback if API down  

**Exit:** Session feels more “alive”; tips improve.

## Phase 7 — Report

- Persist session + turns locally  
- Report page listing Q/A/metrics/tips  
- Partial save on leave  

**Exit:** User can review and rehearse from history.

## Phase 8 — Polish (still MVP-adjacent)

- Distinct voices per interviewer  
- Stronger technical bank filtering by tags  
- Placeholder company profile for “why us”  
- Accessibility pass  

## Explicitly later

- Answer correctness scoring  
- Live coding pane  
- Accounts / cloud sync  
- Pairing UI with study (C# / .NET / JS) app  
- Photoreal interviewer video  

## Suggested first implementation milestone

Ship **Phases 1–4** as “playable mock IV”, then add metrics and OpenRouter.
