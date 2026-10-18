# API and Integrations

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server | Neon Postgres for Prisma |
| `OPENROUTER_API_KEY` | Server optional | Fallback if no BYOK header |
| `OPENROUTER_MODEL` | Server | Default model id |
| `NEXT_PUBLIC_APP_URL` | Client/server | Referer for OpenRouter |

## BYOK headers

| Header | Purpose |
| --- | --- |
| `X-Gemini-Key` | User Gemini key (decode) |
| `X-OpenRouter-Key` | User OpenRouter key (predict / interview / sheet) |

Keys are stored only in browser `localStorage` via Settings.

## Browser APIs (client)

| API | Usage |
| --- | --- |
| `getUserMedia` | Camera + microphone stream |
| `speechSynthesis` | Interviewer TTS |
| `SpeechRecognition` | Applicant STT |

Handle permission errors with UX from [user journeys](../01-product/user-journeys.md).

## Prep Route Handlers

### `POST /api/prep/extract-cv`
PDF upload → extracted text.

### `POST /api/prep/decode`
Body: role, company, JD, CV text. Header: `X-Gemini-Key`. Returns structured decode JSON.

### `POST /api/prep/predict` / `interview/turn` / `cheat-sheet`
Planned next slices (OpenRouter BYOK).

## Legacy coaching

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
