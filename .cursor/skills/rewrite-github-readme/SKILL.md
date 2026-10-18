---
name: rewrite-github-readme
description: >-
  Rewrites the project GitHub README.md from the current codebase into a clear,
  accurate product README. Use when the user asks to update/rewrite the README,
  prepare the repo for GitHub, or refresh docs before/after a git push or PR.
---

# Rewrite GitHub README

## Goal

Produce or replace `README.md` at the app/repo root shown on GitHub so visitors
understand the product and can run it.

## When to run

- User asks to rewrite/update the README for GitHub
- User is about to push and wants the README refreshed from current code
- User mentions project description, problem statement, or “how to run”

Do **not** invent features that are not in the code. Read the codebase first.

## Research first (required)

1. Read existing `README.md` if any (keep useful accurate bits; drop stale claims).
2. Skim: `package.json` scripts, `docker-compose.yml`, `Dockerfile`, main routes/screens, `docs/` if present.
3. Infer: what the app does, who it is for, how to install/run (npm and/or Docker).

## README structure (use these sections in this order)

Write markdown with these top-level sections:

1. `# <Project Name>` then `## Project description`
2. `## Problem statement`
3. `## How the project solves the problem`
4. `## Target user`
5. `## Use case`
6. `## Key features`
7. `## How to pull and run the code`

### Section guidance

| Section | Write |
|--------|--------|
| Project description | What the product is in plain language; stack only if helpful. |
| Problem statement | Real pain the product addresses. |
| How it solves | Map product flows to the problem. |
| Target user | Who benefits. |
| Use case | 2–4 concrete scenarios. |
| Key features | Bullets grounded in code. |
| How to pull and run | Clone, install, env/Settings, npm and/or Docker, open URL. |

## Style

- Clear and direct; no marketing fluff
- No fake badges or decorative emojis
- Bullets for features and run steps
- Call out BYOK / browser-local data when true

## Output

1. Write/overwrite the README file in the correct root.
2. Briefly tell the user what changed and that they should review before push.
