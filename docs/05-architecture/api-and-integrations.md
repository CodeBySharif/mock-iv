# API and Integrations

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Server only | OpenRouter chat completions |
| `OPENROUTER_MODEL` | Server | Default model id (configurable) |
| `NEXT_PUBLIC_APP_NAME` | Client optional | Display name |
| `NEXT_PUBLIC_API_BASE_URL` | Existing scaffold | Reserved; not required for MVP local flows |

Never expose `OPENROUTER_API_KEY` to the browser. Add to `.env.local` / `.env.example` when implementing.

## Browser APIs (client)

| API | Usage |
| --- | --- |
| `getUserMedia` | Camera + microphone stream |
| `speechSynthesis` | Interviewer TTS |
| `SpeechRecognition` | Applicant STT |

Handle permission errors with UX from [user journeys](../01-product/user-journeys.md).

## Next.js Route Handlers (suggested)

### `POST /api/coaching/feedback`

**Input:** `{ questionText, transcript, metrics, level, section }`  
**Output:** `{ tips: string[], acknowledgment?: string }`  
**Behavior:** Call OpenRouter; fall back to heuristic tips if API fails.

### `POST /api/coaching/acknowledge`

**Input:** `{ transcript, interviewerRole, section }`  
**Output:** `{ text: string }`  
**Behavior:** Short 1–2 sentence acknowledgment for TTS.

### `POST /api/questions/paraphrase` (optional)

**Input:** `{ prompt, level }`  
**Output:** `{ prompt: string }`  
**Behavior:** Keep meaning; vary wording.

### `GET /api/health`

Liveness check; optional OpenRouter reachability flag without leaking secrets.

## OpenRouter call pattern

- Server route builds chat messages with a strict system prompt:  
  - No correctness grading in MVP  
  - Return JSON matching a Zod schema  
  - Tips must be specific to transcript/metrics  
- Validate response with Zod before returning to client  
- Timeouts + single retry; then local fallback phrases  

## Media permissions flow

1. Lobby CTA → request `{ audio: true, video: true }`  
2. On success, attach stream to applicant tile; store in Zustand  
3. On session end / leave, stop all tracks  

## Security / privacy notes

- Audio/video stay in-browser unless a future cloud STT is added  
- Transcripts sent to OpenRouter for coaching — disclose in UI privacy blurb  
- Do not log full transcripts on the server in MVP beyond ephemeral request handling  

## Future integrations

- Cloud STT/TTS (if browser quality insufficient)  
- Study-app deep links via question tags  
- Persistent backend auth
