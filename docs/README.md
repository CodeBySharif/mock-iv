# Mock Interview — Planning Docs

## Reading order

1. [Product PRD](01-product/prd.md)
2. [Prep pipeline](01-product/prep-pipeline.md) — Decode → Predict → Interview → Cheat sheet
3. [Decode the role](01-product/decode-the-role.md)
4. [Predict questions](01-product/predict-questions.md)
5. [Cheat sheet](01-product/cheat-sheet.md)
6. [User journeys](01-product/user-journeys.md)
7. [LLM interview rounds](03-interview/llm-interview-rounds.md)
8. [Session flow](03-interview/session-flow.md) — classic Meet delivery loop
9. [Tech stack](05-architecture/tech-stack.md)
10. [Data model](05-architecture/data-model.md)
11. [API and integrations](05-architecture/api-and-integrations.md)
12. [MVP roadmap](06-delivery/mvp-roadmap.md)
13. Question bank docs under `04-questions/` (fallback / practice bank)

## Locked assumptions (current)

- Next.js App Router + TypeScript under `mock-interview/`
- Prep hub before lobby
- BYOK: Gemini + OpenRouter keys in browser `localStorage` only
- Postgres (Neon) + Prisma for prep pack history; `practiceId` owns packs until real auth
- Conversational LLM interview rounds + STT UX
- Visual direction: [`DESIGN.md`](../DESIGN.md)
