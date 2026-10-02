# Session Flow

## Participants in the room

- **Applicant** — live camera + mic; answers out loud
- **HR interviewer** — owns Introduction + HR QnA
- **Technical interviewer** — owns Tech stack, Project, Technical deep-dive

Only one interviewer is the **active speaker** at a time.

## Section order

1. Introduction  
2. HR QnA  
3. Tech stack  
4. Project  
5. Technical (harder / trickier questions)

Details: [sections](../04-questions/sections.md).

## Per-question turn loop

```text
1. Select next question from bank (level + section + tags)
2. Show question text on screen
3. Interviewer speaks question (TTS)
4. Think time (default ~20–45s by level; user may start early)
5. User taps Mic → STT starts → transcript streams on page
6. User stops Mic (or silence timeout later)
7. Finalize transcript
8. Interviewer short acknowledgment (TTS + text) — “Thanks, that helps.”
9. Compute delivery metrics (client heuristics)
10. OpenRouter coaching tip from transcript + metrics (no correctness grade)
11. Show feedback card
12. User taps Next question → loop or end section
```

## Between answers

Before the next question, always play a brief **acknowledgment** so the session feels conversational, not like a quiz app. Acknowledgments vary by OpenRouter or a small local phrase bank as fallback.

## Section handoff

When HR’s last question is done:

1. HR says a short handoff line (TTS).  
2. UI banner: Technical interviewer takes over.  
3. Technical greets briefly, then first tech-stack question.

## Ending

- Natural end after final technical question, or  
- User leaves early → save completed turns → report.

## What is measured per answer (MVP)

| Signal | How (MVP) |
| --- | --- |
| Filler words | Count um/uh/like/you know in transcript |
| Pace | Words per minute from duration + word count |
| Long pauses | Gaps in STT timing events if available; else coarse |
| Clarity proxy | Very short answers, repeated words, incomplete sentences (heuristic) |

**Not measured in MVP:** factual correctness, rubric score, code quality.

## Report payload per turn

- section, interviewerRole, questionId, questionText  
- answerTranscript, durationMs  
- metrics (fillers, wpm, pauseScore, clarityProxy)  
- tips[] (from OpenRouter / heuristics)  
- acknowledgmentText  

See [data model](../05-architecture/data-model.md).
