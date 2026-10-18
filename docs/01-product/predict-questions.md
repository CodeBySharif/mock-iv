# Predict questions

## Prompt

Based on the JD and resume, predict **12** questions:

- 4 resume / project
- 4 technical
- 4 behavioral

For each:

1. What the interviewer is actually checking
2. Mistake most freshers make
3. Strong answer from **real** experience only (STAR for behavioral)
4. Do not invent anything the candidate has not done

## JSON

`questions[]`: `{ category, prompt, checking, fresherMistake, strongAnswer, sortOrder }`

## Runtime

`POST /api/prep/predict` after decode. User may edit before locking into interview.
