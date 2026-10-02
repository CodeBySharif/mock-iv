# Question Bank Overview

## Purpose

Curated, seed-ready interview questions for a general **Software Engineer / Software Developer** role at **Junior**, **Mid**, and **Senior** levels. Used to drive mock sessions before/alongside OpenRouter generation.

## Seed record shape

Use this shape when seeding JSON/DB later:

```ts
type QuestionSeed = {
  id: string; // e.g. "jr-hr-003"
  level: "junior" | "mid" | "senior";
  section:
    | "introduction"
    | "hr_qna"
    | "tech_stack"
    | "project"
    | "technical";
  interviewerRole: "hr" | "technical";
  prompt: string;
  followUps?: string[];
  tags?: string[]; // "javascript" | "csharp" | "oop" | "dotnet" | "behavioral" | ...
  difficulty?: 1 | 2 | 3 | 4 | 5;
  estimatedAnswerSeconds?: number;
};
```

Correctness rubrics are **out of scope** for MVP seeding.

## Files

| File | Content |
| --- | --- |
| [sections.md](sections.md) | Section goals and ownership |
| [junior.md](junior.md) | Junior FAQ list |
| [mid.md](mid.md) | Mid FAQ list |
| [senior.md](senior.md) | Senior FAQ list |

## Selection rules (runtime)

1. Filter by `level` from lobby.  
2. Walk sections in fixed order.  
3. Pick N questions per section (configurable; e.g. Intro 1, HR 4, Stack 3, Project 3, Technical 4).  
4. Prefer tagged questions when user selected focus tags.  
5. Optionally paraphrase via OpenRouter while keeping intent.

## Tagging for study-app pairing

Light tags (`csharp`, `javascript`, `oop`, `dotnet`) unlock later deep links to study content. Behavioral questions use `behavioral`.
