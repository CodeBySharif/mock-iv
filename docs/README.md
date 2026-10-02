# Mock Interview — Planning Docs

Planning pack for the Google Meet–style mock interview practice app. Read these before implementing features.

## Reading order

1. [Product PRD](01-product/prd.md) — problem, goals, MVP scope
2. [User journeys](01-product/user-journeys.md) — lobby → session → report
3. [UI/UX](02-ux/ui-ux.md) — Meet-inspired screens and states
4. [Wireframes](02-ux/wireframes.md) — screen inventory and components
5. [Session flow](03-interview/session-flow.md) — turn loop and sections
6. [Roles and personas](03-interview/roles-and-personas.md) — HR vs Technical
7. [Question bank overview](04-questions/question-bank-overview.md) — seed shape and levels
8. [Sections](04-questions/sections.md) — intro, HR QnA, tech, project, technical
9. [Junior](04-questions/junior.md) / [Mid](04-questions/mid.md) / [Senior](04-questions/senior.md) — FAQ lists
10. [Tech stack](05-architecture/tech-stack.md)
11. [Data model](05-architecture/data-model.md)
12. [API and integrations](05-architecture/api-and-integrations.md)
13. [MVP roadmap](06-delivery/mvp-roadmap.md)
14. [Open questions](06-delivery/open-questions.md)

## Folder map

```text
docs/
  README.md
  01-product/
    prd.md
    user-journeys.md
  02-ux/
    ui-ux.md
    wireframes.md
  03-interview/
    session-flow.md
    roles-and-personas.md
  04-questions/
    question-bank-overview.md
    sections.md
    junior.md
    mid.md
    senior.md
  05-architecture/
    tech-stack.md
    data-model.md
    api-and-integrations.md
  06-delivery/
    mvp-roadmap.md
    open-questions.md
```

## Locked assumptions (v1)

- App: Next.js App Router + TypeScript under `mock-interview/`
- Role focus: general Software Engineer / Software Developer
- Levels: Junior, Mid, Senior (with light tags for C#, JavaScript, OOP, .NET)
- Language: English
- AI text: OpenRouter (server-side key)
- Speech: browser Web Speech API for STT + interviewer TTS in MVP
- Feedback in MVP: delivery (pace, fillers, clarity cues) — not answer correctness
- Interviewers: HR + Technical (audio/voice + text); applicant shows live camera self-view
- Visual direction: [`DESIGN.md`](../DESIGN.md) + antislop skills under `.agents/skills/`
