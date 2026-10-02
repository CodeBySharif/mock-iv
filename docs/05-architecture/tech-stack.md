# Tech Stack

## Application foundation (already scaffolded)

| Layer | Choice |
| --- | --- |
| Framework | Next.js App Router (TypeScript) |
| UI | Tailwind CSS v4 |
| Client state | Zustand (session machine, media flags) |
| Server/async data | TanStack Query (report fetch, coaching requests) |
| Validation | Zod |
| Forms | React Hook Form (lobby config) |
| Utilities | clsx, tailwind-merge |

Keep folder conventions from the scaffold: `src/app`, `components`, `features`, `hooks`, `lib`, `schemas`, `stores`, `types`.

## Media

| Concern | MVP approach |
| --- | --- |
| Camera / mic | `navigator.mediaDevices.getUserMedia` |
| Self-view | `<video>` element + `srcObject` |
| Mute / camera toggle | Enable/disable tracks on the MediaStream |

## Speech

| Concern | MVP approach |
| --- | --- |
| Interviewer voice (TTS) | Web Speech API `speechSynthesis` with distinct voices per role |
| Applicant speech → text (STT) | Web Speech API `SpeechRecognition` / `webkitSpeechRecognition` |
| Fallback | Show message if unsupported; typed answer deferred post-MVP |

## AI (OpenRouter)

| Use | Notes |
| --- | --- |
| Acknowledgments | Short spoken/written replies after answers |
| Delivery coaching tips | From transcript + metrics (no correctness grade) |
| Optional paraphrased questions | Same intent as seeded prompt |

Call OpenRouter only from **Next.js Route Handlers** so `OPENROUTER_API_KEY` never ships to the client.

## Persistence (MVP)

- Local-first: `localStorage` or IndexedDB for sessions/reports  
- Later: SQLite/Postgres or hosted DB when accounts exist  

## Suggested feature modules

```text
src/features/
  lobby/
  media/
  session/          # turn state machine
  speech/           # STT + TTS wrappers
  coaching/         # metrics + OpenRouter client calls via API
  report/
  questions/        # load/seed banks
```

## Non-goals for stack (MVP)

- WebRTC multi-peer rooms  
- Separate backend service  
- Live coding IDE embed  
- Native mobile wrappers
