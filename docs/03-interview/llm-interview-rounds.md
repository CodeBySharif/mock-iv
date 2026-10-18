# LLM interview rounds

Conversational mock using existing Talk / Pause / Submit STT. Questions come from the LLM (guided by JD, CV, decode, predict), not the static bank as primary source.

## Rounds

1. **HR** — strict but fair; one Q at a time; must include tell-me-about-yourself, why hire you, why this company, weakness, salary; push back if vague; score /10 after each answer; end with 3 weak spots
2. **Technical** — hiring manager; ~8 Qs scaled by minutes, easy→hard; hints not spoilers if wrong; end with JD skill scores + revise list + weakest answer explained
3. **Candidate Qs** — practice 3–4 “Do you have any questions for us?”

## Turn API

`POST /api/prep/interview/turn` with pack id + history → `{ scorecard?, nextQuestion?, phase, doneRound? }`

## Session script PDF

Export dialogue as:

```text
HR: "…"
Me: "…"
Technical: "…"
```
