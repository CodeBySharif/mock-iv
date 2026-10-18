# Prep pipeline

End-to-end **LLM-powered interview prep** before a real interview.

## Steps

1. **Decode the role** — JD + CV + company → briefing (day-to-day, skills, gaps, company notes)
2. **Predict questions** — 12 coached questions (4 resume/project, 4 technical, 4 behavioral)
3. **Interview** — Conversational LLM rounds (HR → Technical → candidate Qs) using Meet STT UX
4. **Cheat sheet** — 2-page / ~10-minute read from the full pack

## Prep pack

One pack owns: inputs, decode JSON, predicted questions, interview messages + scorecards, cheat sheet, optional script PDF.

## Auth / keys

- History owner MVP: browser `practiceId` (Postgres `PracticeProfile`)
- BYOK: Gemini + OpenRouter keys in `localStorage` only; sent as request headers to Next.js proxies

## See also

- [decode-the-role.md](decode-the-role.md)
- [predict-questions.md](predict-questions.md)
- [cheat-sheet.md](cheat-sheet.md)
- [../03-interview/llm-interview-rounds.md](../03-interview/llm-interview-rounds.md)
