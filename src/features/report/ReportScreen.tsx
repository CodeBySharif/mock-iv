"use client";

import { setActivePackId } from "@/features/prep/clear-local-data";
import { packOverviewHref } from "@/features/prep/prep-steps";
import { loadPrepPack } from "@/features/prep/storage";
import { downloadReportPdf } from "@/features/report/download-report-pdf";
import {
  allocateReportSequence,
  buildReport,
  buildReportFilename,
  formatReportDate,
  loadSession,
  loadTurns,
} from "@/features/report/storage";
import { loadSessionRecording } from "@/features/session/recording-store";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { SECTION_LABELS, type InterviewTurn } from "@/types/interview";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SessionReport } from "@/types/interview";

type ReportScreenProps = {
  sessionId: string;
};

function formatClock(ms?: number) {
  if (!ms || ms <= 0) return "—";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function groupBySection(turns: InterviewTurn[]) {
  const groups: { section: InterviewTurn["section"]; turns: InterviewTurn[] }[] =
    [];
  for (const turn of turns) {
    const last = groups[groups.length - 1];
    if (last && last.section === turn.section) {
      last.turns.push(turn);
    } else {
      groups.push({ section: turn.section, turns: [turn] });
    }
  }
  return groups;
}

export function ReportScreen({ sessionId }: ReportScreenProps) {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingName, setRecordingName] = useState<string | null>(null);
  const [packTitle, setPackTitle] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession(sessionId);
    const turns = loadTurns(sessionId);
    if (session) {
      setReport(buildReport(session, turns));
      if (session.prepPackId) {
        const pack = loadPrepPack(session.prepPackId);
        if (pack) {
          setPackTitle(`${pack.roleTitle} @ ${pack.companyName}`);
        }
      }
    }

    let objectUrl: string | null = null;
    void loadSessionRecording(sessionId)
      .then((row) => {
        if (!row) return;
        objectUrl = URL.createObjectURL(row.blob);
        setRecordingUrl(objectUrl);
        setRecordingName(row.fileName);
      })
      .catch(() => undefined);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sessionId]);

  const groups = useMemo(
    () => (report ? groupBySection(report.turns) : []),
    [report],
  );

  function handleDownload() {
    if (!report || downloading) return;
    setDownloading(true);
    try {
      const date = formatReportDate(report.session.createdAt);
      const sequence = allocateReportSequence(date.dayKey);
      const filename = buildReportFilename(report.session.createdAt, sequence);
      downloadReportPdf(report, filename);
      setDownloadName(filename);
    } finally {
      setDownloading(false);
    }
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-meet-bg px-4 text-meet-text">
        <div className="text-center">
          <p className="text-meet-muted">Report not found.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
          >
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  const { session, summary } = report;
  const date = formatReportDate(session.createdAt);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-meet-bg text-meet-text">
      <header className="z-40 shrink-0 border-b border-meet-border bg-meet-surface">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
              Mock Interview
            </p>
            <h1 className="font-display text-2xl font-semibold capitalize tracking-tight sm:text-3xl">
              {session.level} interview report
            </h1>
            <p className="mt-1 text-sm text-meet-muted">
              {date.slash}
              {session.durationMinutes
                ? ` · ${session.durationMinutes} min plan`
                : ""}{" "}
              · {session.status}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            {session.prepPackId ? (
              <>
                <Link
                  href={packOverviewHref(session.prepPackId)}
                  onClick={() => setActivePackId(session.prepPackId!)}
                  className="rounded-[8px] border border-meet-border bg-meet-bg px-4 py-2.5 text-sm font-medium text-meet-text"
                >
                  Pack overview
                </Link>
                <Link
                  href="/prep/cheat-sheet"
                  onClick={() => setActivePackId(session.prepPackId!)}
                  className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
                >
                  Build cheat sheet
                </Link>
                <Link
                  href="/lobby"
                  onClick={() => setActivePackId(session.prepPackId!)}
                  className="rounded-[8px] border border-meet-border bg-meet-bg px-4 py-2.5 text-sm font-medium text-meet-text"
                >
                  Redo interview
                </Link>
              </>
            ) : null}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-[8px] border border-meet-border bg-meet-bg px-4 py-2.5 text-sm font-medium text-meet-text disabled:opacity-60"
            >
              {downloading ? "Preparing PDF…" : "Download PDF"}
            </button>
            <Link
              href="/"
              className="rounded-[8px] border border-meet-border bg-meet-bg px-4 py-2.5 text-sm font-medium text-meet-text"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="meet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8">
        {session.prepPackId ? (
          <div className="mb-6 rounded-[12px] border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-meet-text">
            Next step: generate a cheat sheet from this interview
            {packTitle ? (
              <>
                {" "}
                for <span className="font-medium">{packTitle}</span>
              </>
            ) : null}
            .{" "}
            <Link
              href="/prep/cheat-sheet"
              onClick={() => setActivePackId(session.prepPackId!)}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              Open cheat sheet →
            </Link>
          </div>
        ) : (
          <div className="mb-6 rounded-[12px] border border-meet-border bg-meet-surface px-4 py-3 text-sm text-meet-muted">
            This was a classic-bank session (no prep pack). Cheat sheets need a
            decode → predict pack — start one from the hub.
          </div>
        )}

        {recordingUrl ? (
          <section className="mb-6 rounded-[12px] border border-meet-border bg-meet-surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold">
                Session recording
              </h2>
              {recordingName ? (
                <a
                  href={recordingUrl}
                  download={recordingName}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Download again
                </a>
              ) : null}
            </div>
            <video
              src={recordingUrl}
              controls
              playsInline
              className="max-h-[420px] w-full rounded-[8px] bg-black"
            />
            <p className="mt-2 text-xs text-meet-muted">
              Scrub the timeline to review pacing and stutters. Prefer Chrome or
              Edge if a downloaded file won’t open in another player.
            </p>
          </section>
        ) : session.recordSession ? (
          <p className="mb-6 text-sm text-meet-muted">
            No in-browser recording found for this session (share may have been
            cancelled, or this report is from before recording storage).
          </p>
        ) : null}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="Answers" value={String(summary.turnsCompleted)} />
          <SummaryStat
            label="Avg score"
            value={
              summary.avgScore != null ? `${summary.avgScore}/10` : "—"
            }
          />
          <SummaryStat
            label="Avg pace"
            value={summary.avgWpm ? `${summary.avgWpm} WPM` : "—"}
          />
          <SummaryStat
            label="Fillers"
            value={String(summary.totalFillers ?? 0)}
          />
          <SummaryStat
            label="Questions"
            value={String(report.turns.length)}
          />
          <SummaryStat
            label="Sections"
            value={
              summary.sectionsCompleted
                .map((section) => SECTION_LABELS[section])
                .join(", ") || "—"
            }
          />
        </section>

        {downloadName ? (
          <p className="mt-3 text-xs text-meet-muted" role="status">
            Saved as {downloadName}
          </p>
        ) : (
          <p className="mt-3 text-xs text-meet-muted">
            PDF names follow{" "}
            <span className="font-mono text-meet-text/80">
              report_mock_interview_DD-MM-YYYY_001.pdf
            </span>{" "}
            through _100 each day.
          </p>
        )}

        <div className="mt-8 space-y-8">
          {groups.map((group, groupIndex) => (
            <section key={`${group.section}-${groupIndex}`}>
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-meet-border pb-2">
                <h2 className="font-display text-lg font-semibold text-meet-text">
                  {SECTION_LABELS[group.section]}
                </h2>
                <p className="text-xs text-meet-muted">
                  {group.turns.length} question
                  {group.turns.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-4">
                {group.turns.map((turn) => (
                  <article
                    key={turn.id}
                    className="overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface"
                  >
                    <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
                      <div className="border-b border-meet-border p-5 lg:border-b-0 lg:border-r">
                        <p className="text-xs text-meet-muted">
                          {turn.interviewerRole === "hr"
                            ? "Alex · HR"
                            : "Sam · Technical"}{" "}
                          · Question {turn.index + 1}
                          {turn.status === "skipped" ? " · Skipped" : ""}
                        </p>
                        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-meet-text">
                          {turn.questionText}
                        </h3>
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                            Your answer
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-meet-text">
                            {turn.transcriptFinal?.trim() || (
                              <span className="text-meet-muted">
                                No answer captured
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/25 p-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                          Delivery
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
                          <MetricChip
                            label="Score"
                            value={
                              typeof turn.score === "number"
                                ? `${turn.score}/10`
                                : "—"
                            }
                          />
                          <MetricChip
                            label="Time"
                            value={formatClock(turn.metrics?.durationMs)}
                          />
                          <MetricChip
                            label="Pace"
                            value={
                              turn.metrics
                                ? `${turn.metrics.wordsPerMinute} WPM`
                                : "—"
                            }
                          />
                          <MetricChip
                            label="Fillers"
                            value={
                              turn.metrics
                                ? String(turn.metrics.fillerCount)
                                : "—"
                            }
                          />
                          <MetricChip
                            label="Clarity"
                            value={
                              turn.metrics?.clarityProxyScore != null
                                ? String(turn.metrics.clarityProxyScore)
                                : "—"
                            }
                          />
                        </div>
                        {turn.scoreNote ? (
                          <p className="mt-2 text-xs text-meet-muted">
                            {turn.scoreNote}
                          </p>
                        ) : null}

                        {turn.acknowledgmentText ? (
                          <p className="mt-4 text-sm text-meet-muted">
                            {turn.acknowledgmentText}
                          </p>
                        ) : null}

                        {turn.tips?.length ? (
                          <ul className="mt-4 space-y-2 border-t border-meet-border pt-4 text-sm leading-relaxed text-meet-text">
                            {turn.tips.map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-4 text-sm text-meet-muted">
                            {turn.transcriptFinal?.trim()
                              ? "No coaching tips for this answer."
                              : "Answer this question in a session to see coaching here."}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border border-meet-border bg-meet-surface px-4 py-3 ${
        wide ? "col-span-2 sm:col-span-2 lg:col-span-1" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-meet-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-meet-text">
        {value}
      </p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[6px] border border-meet-border bg-meet-bg px-2.5 py-1 text-meet-text">
      <span className="text-meet-muted">{label} </span>
      {value}
    </span>
  );
}
