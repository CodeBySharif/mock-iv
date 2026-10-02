# Open Questions

Decisions to resolve before or during early implementation. Not blockers for docs, but should be closed before hardening UX.

## Product

1. **Placeholder company** — Use a fictional company profile, or let the user paste a job description / company blurb in the lobby?  
2. **Session length** — Fixed question counts vs time-boxed (e.g. 30 minutes)?  
3. **Follow-ups** — Allow one AI follow-up when answers are too short in MVP, or strictly one question then Next?  
4. **Retry single question** from report — in v1.1 or later?

## UX

5. **Interviewer tiles** — Avatars/initials only, or subtle looping idle animation?  
6. **Default think time** — 20s / 30s / by level?  
7. **Auto-stop recording** on silence — yes in MVP or manual stop only?

## Speech / metrics

8. **Browser support policy** — Chrome-first OK? What copy for Safari/Firefox gaps?  
9. **Upgrade path** — When do we switch from Web Speech API to a cloud STT/TTS provider?  
10. **Pronunciation scoring** — True pronunciation needs specialized models; MVP uses proxies (fillers, pace, pauses). When is “real” pronunciation in scope?

## Architecture

11. **Persistence** — `localStorage` vs IndexedDB for larger transcripts?  
12. **OpenRouter model** — Which default model for low latency / cost?  
13. **Question source of truth** — Markdown-derived JSON build step vs hand-maintained `questions/*.json`?

## Future pairing

14. **Study app contract** — Shared tag taxonomy only, or deep-link URLs into lessons?  
15. **Shared auth** later — same account across mock IV and study app?

## Resolved for docs pass

| Topic | Decision |
| --- | --- |
| Docs location | `mock-interview/docs/` |
| Role focus | General SE/SD + light C#/JS/OOP/.NET tags |
| Language | English |
| Correctness scoring | Out of MVP |
| Interviewers | HR + Technical |
| AI text | OpenRouter server-side |
| Speech MVP | Browser Web Speech API |
