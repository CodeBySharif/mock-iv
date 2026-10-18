"use client";

import { PrepFooterNav } from "@/features/prep/PrepFooterNav";
import { PrepShell } from "@/features/prep/PrepShell";
import { WorkingOverlay } from "@/features/prep/WorkingOverlay";
import {
  getActivePackId,
  loadPrepPack,
  savePrepPack,
} from "@/features/prep/storage";
import { listSessions, loadTurns } from "@/features/report/storage";
import { providerHeaders } from "@/lib/llm/headers";
import { useSettingsStore } from "@/stores/settings-store";
import type { CheatSheetPayload, PrepPack } from "@/types/prep";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CheatSheetScreen() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);

  const [pack, setPack] = useState<PrepPack | null>(null);
  const [sheet, setSheet] = useState<CheatSheetPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    const id = getActivePackId();
    if (!id) return;
    const loaded = loadPrepPack(id);
    if (!loaded) return;
    setPack(loaded);
    setSheet(loaded.cheatSheet ?? null);
  }, [hydrate]);

  async function handleGenerate() {
    if (!pack?.decode) {
      setError("Decode the role and finish an interview first.");
      return;
    }
    const key = activeKey();
    if (!key) {
      setError("Add an API key in Settings first.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const relatedSessions = listSessions().filter(
        (s) => s.prepPackId === pack.id,
      );
      const interviewNotes = relatedSessions.flatMap((session) => {
        const turns = loadTurns(session.id);
        return turns
          .filter((t) => t.transcriptFinal?.trim())
          .map((t) => ({
            question: t.questionText,
            answer: t.transcriptFinal,
            score: t.score,
            tips: t.tips,
          }));
      });

      const res = await fetch("/api/prep/cheat-sheet", {
        method: "POST",
        headers: providerHeaders(provider, key),
        body: JSON.stringify({
          roleTitle: pack.roleTitle,
          companyName: pack.companyName,
          jdText: pack.jdText,
          cvText: pack.cvText,
          decode: pack.decode,
          questions: pack.questions?.map((q) => ({
            prompt: q.prompt,
            checking: q.checking,
            strongAnswer: q.strongAnswer,
            category: q.category,
          })),
          interviewNotes,
          introSeconds: 60,
        }),
      });
      const data = (await res.json()) as {
        cheatSheet?: CheatSheetPayload;
        error?: string;
      };
      if (!res.ok || !data.cheatSheet) {
        throw new Error(data.error || "Cheat sheet failed");
      }

      const updated: PrepPack = {
        ...pack,
        status: "complete",
        cheatSheet: data.cheatSheet,
        updatedAt: new Date().toISOString(),
      };
      savePrepPack(updated);
      setPack(updated);
      setSheet(data.cheatSheet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cheat sheet failed");
    } finally {
      setBusy(false);
    }
  }

  if (!pack) {
    return (
      <PrepShell title="Cheat sheet" subtitle="Needs an active prep pack">
        <div className="rounded-[12px] border border-meet-border bg-meet-surface p-6">
          <p className="text-sm text-meet-muted">
            Select a past prep pack from the hub, or finish an interview first.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Back to prep hub
          </Link>
        </div>
      </PrepShell>
    );
  }

  return (
    <PrepShell
      title="Cheat sheet"
      subtitle={`${pack.roleTitle} @ ${pack.companyName}`}
      activeStep="cheatsheet"
      pack={pack}
    >
      <WorkingOverlay
        open={busy}
        title="Building your cheat sheet"
        hint="Pulling decode, predicted answers, and interview notes. Stay on this page."
      />

      <div className="pb-28">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-meet-border bg-meet-surface p-4">
          <p className="text-sm text-meet-muted">
            Two-page style sheet · ~10 minute read before the real interview.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleGenerate()}
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
          >
            {sheet ? "Regenerate" : "Generate cheat sheet"}
          </button>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-amber-300" role="alert">
            {error}
          </p>
        ) : null}

        {!sheet ? (
          <div className="rounded-[12px] border border-dashed border-meet-border bg-meet-surface/60 p-8 text-center">
            <p className="text-sm text-meet-muted">
              No cheat sheet yet. Generate after decode + interview practice.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-sm leading-relaxed">
            <section className="rounded-[12px] border border-meet-border bg-meet-surface p-5">
              <h2 className="font-display text-base font-semibold">Intro</h2>
              <p className="mt-3 whitespace-pre-wrap text-meet-text">
                {sheet.introScript}
              </p>
            </section>

            <section className="rounded-[12px] border border-meet-border bg-meet-surface p-5">
              <h2 className="font-display text-base font-semibold">
                Strongest stories
              </h2>
              <ul className="mt-3 space-y-4">
                {sheet.stories.map((story, i) => (
                  <li
                    key={`${story.situation}-${i}`}
                    className="rounded-[8px] border border-meet-border bg-meet-bg p-3"
                  >
                    <p>
                      <span className="text-meet-muted">Situation — </span>
                      {story.situation}
                    </p>
                    <p className="mt-1">
                      <span className="text-meet-muted">Action — </span>
                      {story.action}
                    </p>
                    <p className="mt-1">
                      <span className="text-meet-muted">Result — </span>
                      {story.result}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[12px] border border-meet-border bg-meet-surface p-5">
              <h2 className="font-display text-base font-semibold">
                Concepts to revise
              </h2>
              <ul className="mt-3 space-y-3">
                {sheet.struggledConcepts.map((item) => (
                  <li key={item.title}>
                    <p className="font-medium text-meet-text">{item.title}</p>
                    <p className="mt-1 text-meet-muted">{item.explanation}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[12px] border border-meet-border bg-meet-surface p-5">
              <h2 className="font-display text-base font-semibold">
                Company points
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-meet-text">
                {sheet.companyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[12px] border border-meet-border bg-meet-surface p-5">
              <h2 className="font-display text-base font-semibold">
                Smart questions to ask
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-meet-text">
                {sheet.smartQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>

      <PrepFooterNav
        step="cheatsheet"
        pack={pack}
        hint={sheet ? "Ready for the real interview." : "Generate when ready."}
        primary={
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleGenerate()}
            className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {sheet ? "Regenerate" : "Generate"}
          </button>
        }
      />
    </PrepShell>
  );
}
