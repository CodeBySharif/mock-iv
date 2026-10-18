# Mock Interview

## Project description

Mock Interview is a browser app for practicing technical interviews end to end. You prepare against a real job description and your CV, rehearse answers as yourself with an AI “interrogation” room, then run a Meet-style mock interview with talk/pause/submit, coaching scores, and a cheat sheet for the day of the interview.

Stack: **Next.js** (App Router), **TypeScript**, **Tailwind**, **Zustand**, optional **Postgres + Prisma**, and **BYOK** LLM calls (keys stay in your browser Settings).

## Problem statement

Job seekers often:

- Guess what a role will ask without decoding the JD against their CV
- Rehearse the same generic questions and forget their own stories
- Freeze in live interviews without paced practice or feedback
- Scramble for a last-minute one-pager before the real call

Static question banks and chatbots rarely tie answers to *your* experience or keep prep, practice, and revision in one flow.

## How the project solves the problem

Two tracks from the home screen:

1. **Interrogation room** — You ask as the interviewer; the model answers in first person from your CV/JD (and facts you add). Sessions are named and reusable. **Prep for this role** carries context into decode.
2. **Interview prep** — **Decode** the role → **Predict** coached questions → **Lobby / live mock** with mic (and optional screen record) → **Report** with scores → **Cheat sheet** for quick revision.

A **Master CV** in the top bar is reused across sessions so you do not re-upload for every company.

## Target user

- Software engineers and similar IC candidates preparing for company-specific interviews
- Anyone who wants structured practice with their own CV/JD instead of generic Q&A
- Users willing to bring their own Gemini / OpenRouter (or Groq) API keys

## Use case

- **Before applying:** Paste a JD and CV, decode gaps and day-to-day expectations, generate practice intros.
- **Story rehearsal:** In Interrogation, ask “Walk me through integrating a third-party API” and refine answers when the model asks for missing detail.
- **Timed mock:** Run a 15 / 25 / 45 minute session from predicted questions (or the classic bank), get per-answer scores and a report.
- **Day before:** Open the cheat sheet and pack overview; redo weak sections without starting from scratch.

## Key features

- **Home modules:** Interrogation room and Interview prep as separate tracks
- **Master CV:** Upload/paste once; green/red status in the header
- **Interrogation sessions:** Role, company, JD + CV; history labeled `role_company_datetime`
- **Prep pipeline:** Decode → Predict (regenerate avoids prior prompts) → Practice → Cheat sheet
- **Live mock:** Meet-style room, STT, coaching hints, scoring, optional seekable WebM recording
- **Reports:** Session summaries and pack report cards with average scores
- **BYOK:** API keys in Settings (browser `localStorage` only; not stored on the server as secrets)
- **Theme:** Light / dark toggle with sun/moon control
- **Docker:** `Dockerfile` + `docker-compose.yml` (web + Postgres; DB not exposed on host by default)

## How to pull and run the code

### Prerequisites

- Node.js 20+ (Docker image uses Node 22)
- npm
- Optional: Docker + Docker Compose for production-style run
- LLM API key(s) for decode / predict / interrogation (add in **Settings** after launch)

### Clone and install

```bash
git clone https://github.com/CodeBySharif/mock-iv.git
cd mock-iv/mock-interview
npm install
```

If your deploy checkout has the app files at the repo root (no `mock-interview/` folder), `cd` into that root instead.

### Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Open **Settings**, add your provider key(s), optionally set **Master CV**, then use Interrogation or Prep.

Useful scripts:

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm start` | Run production build |
| `npm run db:push` | Push Prisma schema (when `DATABASE_URL` is set) |

### Docker

From the directory that contains `Dockerfile` and `docker-compose.yml`:

```bash
docker compose up -d --build
```

- App: [http://localhost:3000](http://localhost:3000)
- Postgres is reachable only as hostname `db` on the Compose network (not published on host `5432` by default)

### Notes

- Much of prep/interrogation history lives in **browser localStorage**; clearing site data removes packs and sessions (API keys use a protected `mock-iv:byok:*` prefix when using in-app clear).
- Deeper product and architecture notes: see [`docs/README.md`](docs/README.md).
