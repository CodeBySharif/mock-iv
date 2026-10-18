# Decode the role

## Persona prompt

Act as a senior recruiter hired for `[role]` for 10 years. Decode the role before the interview.

## Inputs

| Field | Type |
| --- | --- |
| Role | Text |
| Company | Text |
| Job description | Text (paste) |
| CV | PDF upload → extracted text |

## Outputs (JSON)

1. `dayToDay` — what the role involves day to day, plain words
2. `skillsToTest[5]` — `{ skill, rank, why }`
3. `matches[]` / `gaps[3]` — resume vs JD
4. `gapHandling[3]` — honest way to handle each gap
5. `company` — `{ whatTheyDo, customers, recentMentions[], unknowns[] }`

## Rules

- If unsure about the company, say so (`unknowns`) — **do not guess**
- Do not invent CV experience

## Runtime

`POST /api/prep/decode` with BYOK Gemini key header. Persist on `PrepPack` + `RoleDecode`.
