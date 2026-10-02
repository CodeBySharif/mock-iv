# Product Requirements Document (PRD)

## Problem

Interview skills rust without practice. After a long gap from real interviews, it is hard to rehearse:

- Speaking clearly under pressure
- Structuring answers (intro, why leave, why this company, projects, day-to-day work)
- Handling technical questions that feel tricky for Junior → Mid → Senior levels

Static question lists help content, but they do not recreate the feel of a live video interview or capture how you sounded.

## Vision

A web app that feels like a **Google Meet–style interview room**: camera and mic on, HR and a technical interviewer present, sectioned Q&A with spoken questions, timed thinking, spoken answers transcribed on screen, delivery coaching per answer, and a post-session report to rehearse weak spots.

Later, this app can pair with a separate study project (C#, JavaScript, OOP, .NET, etc.) for content depth. This product focuses on **interview session practice and delivery feedback**.

## Goals

1. Recreate a familiar remote interview flow (permissions → room → multi-party session → end report).
2. Support two interviewer roles: **HR** (behavioral / company fit) and **Technical** (role and tech).
3. Show each question on screen and speak it with a real voice (TTS).
4. Capture the applicant’s spoken answer as text (STT) for review.
5. Measure **delivery** (stutter/fillers, pace, clarity cues) — not correctness in MVP.
6. Give short, actionable advice per question and a session report.
7. Seed a solid FAQ bank for Junior / Mid / Senior software engineer interviews.

## Non-goals (MVP)

- Scoring whether the answer content is “correct”
- Real multiplayer video of other humans
- Photoreal video avatars of AI interviewers
- Full auth, teams, or multi-tenant SaaS
- Deep integration with the study app (link later)
- Mobile-first native apps (responsive web is enough)

## Personas

| Persona | Need |
| --- | --- |
| Applicant (primary user) | Practice alone, see self on camera, answer out loud, get transcript + delivery tips |
| HR interviewer (AI) | Warm greeting, behavioral and company/motivation questions |
| Technical interviewer (AI) | Role, stack, project, and technical deep-dive questions |

## Core experience

1. Open app → choose level (Junior / Mid / Senior) and optional focus tags.
2. Grant camera + microphone permission.
3. Enter Meet-like session with three tiles: Applicant (live camera), HR, Technical.
4. Session runs by section: Introduction → HR QnA → Tech stack → Project → Technical.
5. Per question: spoken + written prompt → think time → mic to answer → transcript → short interviewer acknowledgment → delivery feedback → Next.
6. End session → report of questions, answers, metrics, and improvement tips.

## Success metrics (practice quality)

- User completes at least one full section without leaving
- Transcript appears for ≥90% of answered turns (browser STT permitting)
- User can replay/read every Q&A in the report
- Delivery tip generated for each completed answer

## MVP scope

**In**

- Lobby / setup + media permission gate
- Meet-inspired session UI (tiles + control bar + question panel)
- Scripted + seeded questions by level and section
- HR and Technical turn ownership by section
- TTS for interviewer speech; STT for applicant answers
- Delivery metrics (simple): filler words, speaking rate, long pauses
- OpenRouter for acknowledgments + coaching text (and optional question variation)
- Session report (local-first persistence for MVP)

**Out**

- Answer correctness / rubric scoring
- Company-specific research ingestion (“what do you know about us” with real company data) beyond a placeholder company profile
- Account sync across devices

## Risks

| Risk | Mitigation |
| --- | --- |
| Browser STT/TTS quality varies | Document supported browsers; allow typed fallback later |
| OpenRouter latency mid-session | Prefetch ack/coaching or show “evaluating…” state |
| Interview feels robotic | Short spoken acknowledgments + Meet-like UI polish |
| Question bank too shallow | Curate FAQ docs now; expand via OpenRouter later |

## Related docs

- [User journeys](user-journeys.md)
- [Session flow](../03-interview/session-flow.md)
- [MVP roadmap](../06-delivery/mvp-roadmap.md)
