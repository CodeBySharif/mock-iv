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

## AI (BYOK)

| Use | Provider |
| --- | --- |
| Role decode (long CV + JD) | Gemini (user key via header) |
| Predict / interview turns / cheat sheet | OpenRouter (user key via header) |
| Legacy delivery coaching | OpenRouter (BYOK or env fallback) |

Keys live in browser `localStorage`. Route Handlers accept `X-Gemini-Key` / `X-OpenRouter-Key` and proxy; never persist keys in Postgres.

## Persistence

- **Postgres (Neon) + Prisma** for prep packs, decode, predictions, interview messages, cheat sheets  
- `practiceId` in localStorage owns history until real auth  
- BYOK keys + practiceId stay in localStorage  
- Classic session reports may still use localStorage during migration  

## Suggested feature modules

```text
src/features/
  prep/             # hub, decode, predict, cheat sheet
  settings/         # BYOK modal
  lobby/
  media/
  session/
  speech/
  coaching/
  report/
  questions/
```

## Non-goals for stack (MVP)

- WebRTC multi-peer rooms  
- Separate backend service  
- Live coding IDE embed  
- Native mobile wrappers
