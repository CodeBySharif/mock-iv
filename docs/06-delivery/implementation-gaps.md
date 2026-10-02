# Implementation gaps (vs planning docs)

Built: playable MVP covering roadmap phases 1–7 with heuristic coaching and optional OpenRouter.

## Included now

- Lobby with level + tags, camera/mic permission on start
- Meet-like session: HR / Technical / You tiles, controls, question card, transcript, feedback
- Scripted question bank by level/section with section handoff banner
- TTS question + acknowledgment (Web Speech API)
- STT transcript (Chrome-oriented Web Speech Recognition)
- Delivery metrics: WPM, fillers, clarity proxy + tips
- Local report persistence (`localStorage`)
- `POST /api/coaching/feedback` with OpenRouter if `OPENROUTER_API_KEY` is set, else heuristics

## Missing or weaker than the docs

| Planned item | Status |
| --- | --- |
| Full FAQ banks from junior/mid/senior markdown | Partially seeded (subset in `src/content/questions.ts`) |
| True pronunciation / stutter model | Not included (fillers/pace/clarity proxies only) |
| Auto-stop on silence | Manual Stop only |
| Typed-answer fallback when STT unsupported | Missing (error message only) |
| Lobby live camera preview before start | Missing (preview starts in session) |
| Distinct guaranteed TTS voices | Best-effort voice pick; OS-dependent |
| AI follow-up when answer too short | Missing |
| Configurable question counts / session length | Fixed defaults from docs |
| Real company research for “why us” | Placeholder `Northstar Labs` only |
| Export report (PDF/copy) | Missing |
| Auth / multi-device sync | Missing |
| Study-app deep links | Tags only |
| Photoreal interviewer video | Avatars/initials only |
| Answer correctness scoring | Explicitly out of scope |
| `/api/coaching/acknowledge` separate route | Folded into feedback API |
| `/api/questions/paraphrase` | Missing |
| IndexedDB for large transcripts | Using `localStorage` |
| Mobile layout polish / a11y pass | Basic responsive only |
| Captions toggle / Meet chrome parity | Partial |

## How to try

```bash
cd mock-interview
npm run dev
```

Optional: set `OPENROUTER_API_KEY` in `.env.local` for richer tips.
