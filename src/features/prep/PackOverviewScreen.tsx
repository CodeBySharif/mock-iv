"use client";

import { setActivePackId } from "@/features/prep/clear-local-data";
import { generateAndSaveIntroScripts } from "@/features/prep/generate-intros";
import { PrepShell } from "@/features/prep/PrepShell";
import {
  packHasCheatSheet,
  packHasDecode,
  packHasQuestions,
} from "@/features/prep/prep-steps";
import { loadPrepPack } from "@/features/prep/storage";
import {
  buildReport,
  listSessions,
  loadTurns,
} from "@/features/report/storage";
import { useSettingsStore } from "@/stores/settings-store";
import type { InterviewSession } from "@/types/interview";
import type { PrepPack } from "@/types/prep";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PackSessionRow = {
  session: InterviewSession;
  avgScore?: number;
  answersScored: number;
};

export function PackOverviewScreen() {
  const params = useParams();
  const packId = typeof params.packId === "string" ? params.packId : "";
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [pack, setPack] = useState<PrepPack | null>(null);
  const [sessions, setSessions] = useState<PackSessionRow[]>([]);
  const [introBusy, setIntroBusy] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const [introTab, setIntroTab] = useState<30 | 60 | 120>(60);

  useEffect(() => {
    hydrate();
    if (!packId) return;
    setActivePackId(packId);
    const loaded = loadPrepPack(packId);
    setPack(loaded);
    setSessions(
      listSessions()
        .filter((s) => s.prepPackId === packId)
        .slice(0, 10)
        .map((session) => {
          const report = buildReport(session, loadTurns(session.id));
          return {
            session,
            avgScore: report.summary.avgScore,
            answersScored: report.summary.turnsCompleted,
          };
        }),
    );
  }, [packId, hydrate]);

  async function handleGenerateIntros() {
    if (!pack) return;
    const key = activeKey();
    if (!key) {
      setIntroError("Add an API key in Settings first.");
      return;
    }
    setIntroBusy(true);
    setIntroError(null);
    try {
      const introScripts = await generateAndSaveIntroScripts({
        pack,
        provider,
        apiKey: key,
      });
      setPack({ ...pack, introScripts });
    } catch (e) {
      setIntroError(
        e instanceof Error ? e.message : "Could not generate intros",
      );
    } finally {
      setIntroBusy(false);
    }
  }

  const questionCount = useMemo(
    () => pack?.questions?.filter((q) => q.selected).length ?? 0,
    [pack],
  );

  if (!packId) {
    return (
      <PrepShell title="Pack" showStepNav={false}>
        <p className="text-sm text-meet-muted">Missing pack id.</p>
        <Link href="/" className="mt-4 inline-block text-brand hover:underline">
          Home
        </Link>
      </PrepShell>
    );
  }

  if (!pack) {
    return (
      <PrepShell title="Pack not found" showStepNav={false}>
        <p className="text-sm text-meet-muted">
          This prep pack is not in local storage anymore.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Back to hub
        </Link>
      </PrepShell>
    );
  }

  return (
    <PrepShell
      title={pack.roleTitle}
      subtitle={`${pack.companyName} · ${pack.status}${
        pack.experienceLevel ? ` · ${pack.experienceLevel}` : ""
      }`}
      pack={pack}
      showStepNav={false}
    >
      <p className="mb-5 text-sm text-meet-muted">
        Open any completed step, redo the interview, or jump to a past report.
      </p>

      <section className="mb-6 rounded-[12px] border border-meet-border bg-meet-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Practice intros
            </h2>
            <p className="mt-1 text-sm text-meet-muted">
              Real scripts from your CV for 30 sec, 1 min, and 2 min — reuse
              them in the interview Answer tab.
            </p>
          </div>
          <button
            type="button"
            disabled={introBusy || !packHasDecode(pack)}
            onClick={() => void handleGenerateIntros()}
            className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {introBusy
              ? "Generating…"
              : pack.introScripts
                ? "Regenerate intros"
                : "Generate practice intros"}
          </button>
        </div>
        {introError ? (
          <p className="mt-2 text-sm text-amber-300" role="alert">
            {introError}
          </p>
        ) : null}
        {pack.introScripts ? (
          <>
            <div
              role="tablist"
              aria-label="Intro length"
              className="mt-4 grid grid-cols-3 overflow-hidden rounded-[8px] border border-meet-border"
            >
              {(
                [
                  [30, "30 sec"],
                  [60, "1 min"],
                  [120, "2 min"],
                ] as const
              ).map(([seconds, label]) => (
                <button
                  key={seconds}
                  type="button"
                  role="tab"
                  aria-selected={introTab === seconds}
                  onClick={() => setIntroTab(seconds)}
                  className={`px-3 py-2 text-sm ${
                    introTab === seconds
                      ? "bg-brand text-brand-foreground"
                      : "text-meet-muted hover:text-meet-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-meet-text">
              {pack.introScripts[introTab]}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-meet-muted">
            {packHasDecode(pack)
              ? "No intros yet — generate once, then practice the same script every session."
              : "Decode the role first."}
          </p>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <StepCard
          step="1 · Decode"
          title="Role briefing"
          ready={packHasDecode(pack)}
          body={
            packHasDecode(pack)
              ? "Day-to-day, skills to test, matches, gaps, company notes."
              : "Not decoded yet — fill the form and run decode."
          }
          actions={
            <>
              <Link
                href="/prep/decode"
                className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
              >
                {packHasDecode(pack) ? "View decode" : "Open decode"}
              </Link>
            </>
          }
        />

        <StepCard
          step="2 · Predict"
          title="Predicted questions"
          ready={packHasQuestions(pack)}
          body={
            packHasQuestions(pack)
              ? `${pack.questions?.length ?? 0} questions · ${questionCount} selected for interview.`
              : "Generate after decode."
          }
          actions={
            packHasDecode(pack) ? (
              <>
                <Link
                  href="/prep/predict"
                  className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
                >
                  {packHasQuestions(pack)
                    ? "View questions"
                    : "Predict questions"}
                </Link>
                {packHasQuestions(pack) ? (
                  <Link
                    href="/prep/predict?regen=1"
                    className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium"
                  >
                    Generate new set
                  </Link>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-meet-muted">Finish decode first</span>
            )
          }
        />

        <StepCard
          step="3 · Interview"
          title="Practice session"
          ready={packHasQuestions(pack)}
          body={
            packHasQuestions(pack)
              ? "Redo a live mock with this pack, or open a past report below."
              : "Needs predicted questions."
          }
          actions={
            packHasQuestions(pack) ? (
              <>
                <Link
                  href="/lobby"
                  className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
                >
                  Redo interview
                </Link>
                {sessions[0] ? (
                  <Link
                    href={`/report/${sessions[0].session.id}`}
                    className="rounded-[8px] border border-meet-border px-3 py-2 text-sm font-medium"
                  >
                    Latest report
                    {sessions[0].avgScore != null
                      ? ` · ${sessions[0].avgScore}/10`
                      : ""}
                  </Link>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-meet-muted">Predict questions first</span>
            )
          }
        />

        <StepCard
          step="4 · Cheat sheet"
          title="Pre-interview sheet"
          ready={packHasCheatSheet(pack) || packHasQuestions(pack)}
          body={
            packHasCheatSheet(pack)
              ? "Intro, stories, revise list, company points, smart questions."
              : "Generate after practice (or from decode + predict notes)."
          }
          actions={
            packHasQuestions(pack) ||
            pack.status === "interviewed" ||
            pack.status === "complete" ? (
              <Link
                href="/prep/cheat-sheet"
                className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
              >
                {packHasCheatSheet(pack) ? "View cheat sheet" : "Generate cheat sheet"}
              </Link>
            ) : (
              <span className="text-sm text-meet-muted">Predict or interview first</span>
            )
          }
        />
      </div>

      <section className="mt-8 border-t border-meet-border pt-5">
        <h2 className="text-sm font-medium">Interview reports for this pack</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-meet-muted">
            No sessions yet.{" "}
            {packHasQuestions(pack) ? (
              <Link href="/lobby" className="text-brand hover:underline">
                Start interview
              </Link>
            ) : (
              "Predict questions first."
            )}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sessions.map(({ session, avgScore, answersScored }) => (
              <li key={session.id}>
                <Link
                  href={`/report/${session.id}`}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-meet-border bg-meet-surface px-4 py-3 hover:border-brand"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium capitalize">
                      {session.status}
                      {session.durationMinutes
                        ? ` · ${session.durationMinutes} min`
                        : ""}
                    </span>
                    <span className="block truncate text-xs text-meet-muted">
                      {new Date(session.createdAt).toLocaleString()}
                      {answersScored > 0
                        ? ` · ${answersScored} answer${answersScored === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`block font-display text-lg font-semibold tabular-nums ${
                        avgScore == null
                          ? "text-meet-muted"
                          : avgScore >= 7
                            ? "text-emerald-400"
                            : avgScore >= 5
                              ? "text-meet-text"
                              : "text-amber-300"
                      }`}
                    >
                      {avgScore != null ? `${avgScore}/10` : "—"}
                    </span>
                    <span className="text-xs font-medium text-brand">
                      Open report
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-medium"
        >
          ← Home / hub
        </Link>
        {packHasDecode(pack) ? (
          <Link
            href="/prep/decode"
            className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-medium"
          >
            Open decode
          </Link>
        ) : null}
        {packHasQuestions(pack) ? (
          <Link
            href="/lobby"
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Redo interview →
          </Link>
        ) : null}
      </div>
    </PrepShell>
  );
}

function StepCard({
  step,
  title,
  body,
  ready,
  actions,
}: {
  step: string;
  title: string;
  body: string;
  ready: boolean;
  actions: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-[12px] border p-5 ${
        ready
          ? "border-meet-border bg-meet-surface"
          : "border-meet-border/60 bg-meet-surface/50"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-meet-muted">{step}</p>
      <h2 className="mt-1 font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-meet-muted">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </article>
  );
}
