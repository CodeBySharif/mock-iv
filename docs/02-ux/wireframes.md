# Wireframes and Component Map

Text wireframes for implementation planning. Not pixel-perfect mockups.

## Screen inventory

| ID | Screen | Route (suggested) |
| --- | --- | --- |
| S1 | Lobby | `/` |
| S2 | Permission overlay | on Start from `/` |
| S3 | Live session | `/session/[sessionId]` |
| S4 | Report | `/report/[sessionId]` |

## S1 — Lobby

```text
┌─────────────────────────────────────────┐
│  Mock Interview                         │
│                                         │
│  ┌─────────────┐   Level: ( ) Jr (•) Mid│
│  │ camera off  │          ( ) Senior    │
│  │  preview    │   Tags: [JS] [.NET] …  │
│  └─────────────┘                        │
│                                         │
│         [ Start interview ]             │
│         Past reports →                  │
└─────────────────────────────────────────┘
```

**Components:** `LobbyPage`, `LevelSelect`, `TagSelect`, `PreviewTile`, `StartButton`

## S2 — Permission gate

```text
┌─────────────────────────────────────────┐
│  Enable camera & microphone             │
│  We use them only for this practice     │
│  session in your browser.               │
│                                         │
│  [ Allow access ]   [ Cancel ]          │
│  Status: Waiting for browser…           │
└─────────────────────────────────────────┘
```

**Components:** `PermissionGate`, `MediaErrorBanner`

## S3 — Live session

```text
┌──────────────┬──────────────┬───────────┐
│ HR           │ Technical    │ You       │
│ [avatar]     │ [avatar]     │ [video]   │
│ speaking…    │              │           │
└──────────────┴──────────────┴───────────┘
┌─────────────────────────────────────────┐
│ Q: Tell me about yourself.              │
│ Think time: 0:18  [ Skip wait / Ready ] │
├─────────────────────────────────────────┤
│ Transcript: (listening…)                │
├─────────────────────────────────────────┤
│ Feedback: —                             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [Mic] [Cam]     [Next question] [Leave] │
└─────────────────────────────────────────┘
```

**Components:**

| Component | Responsibility |
| --- | --- |
| `SessionRoom` | Layout shell |
| `ParticipantTile` | Name, avatar/video, speaking state |
| `ApplicantVideoTile` | `HTMLVideoElement` + stream |
| `QuestionCard` | Prompt text, section label, timer |
| `TranscriptPanel` | Live + final STT text |
| `FeedbackCard` | Metrics + tips after turn |
| `SessionControls` | Mic, cam, next, leave |
| `SectionBanner` | Handoff messaging |

## S4 — Report

```text
┌─────────────────────────────────────────┐
│ Session report · Mid · 42 min           │
│ Sections: Intro ✓ HR ✓ Stack ✓ …        │
├─────────────────────────────────────────┤
│ 1. [HR] Tell me about yourself          │
│    Your answer: …                       │
│    Pace: OK · Fillers: 8 · Tip: …       │
├─────────────────────────────────────────┤
│ 2. …                                    │
└─────────────────────────────────────────┘
```

**Components:** `ReportPage`, `ReportTurnCard`, `MetricsChips`

## Shared design tokens (suggested)

- `--meet-bg`, `--meet-tile`, `--meet-border`, `--meet-accent`, `--danger-record`
- Tile aspect ~16:9; control bar height ~64px

## State machine (UI)

```text
idle → interviewerSpeaking → thinkTime → recording
  → evaluating → acknowledgment → feedbackReady → (next) interviewerSpeaking
```

Leave from any state → confirm → report or lobby.
