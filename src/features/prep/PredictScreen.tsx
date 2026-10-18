"use client";

import { PrepFooterNav } from "@/features/prep/PrepFooterNav";
import { PrepShell } from "@/features/prep/PrepShell";
import { WorkingOverlay } from "@/features/prep/WorkingOverlay";
import {
  getActivePackId,
  loadPrepPack,
  savePrepPack,
} from "@/features/prep/storage";
import { providerHeaders } from "@/lib/llm/headers";
import { useSettingsStore } from "@/stores/settings-store";
import type { PredictedCategory, PredictedQuestion, PrepPack } from "@/types/prep";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const CATEGORY_LABEL: Record<PredictedCategory, string> = {
  resume_project: "Resume / project",
  technical: "Technical",
  behavioral: "Behavioral",
};

const HISTORY_CAP = 60;

function mergeQuestionHistory(
  existing: string[] | undefined,
  currentPrompts: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [...(existing ?? []), ...currentPrompts]) {
    const t = p.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out.slice(-HISTORY_CAP);
}

export function PredictScreen() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);
  const router = useRouter();
  const searchParams = useSearchParams();
  const regenRequested = searchParams.get("regen") === "1";
  const autoRegenDone = useRef(false);

  const [pack, setPack] = useState<PrepPack | null>(null);
  const [questions, setQuestions] = useState<PredictedQuestion[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    const id = getActivePackId();
    if (!id) {
      setReady(true);
      return;
    }
    const loaded = loadPrepPack(id);
    if (!loaded) {
      setReady(true);
      return;
    }
    setPack(loaded);
    setQuestions(loaded.questions ?? []);
    setReady(true);
  }, [hydrate]);

  const grouped = useMemo(() => {
    const order: PredictedCategory[] = [
      "resume_project",
      "technical",
      "behavioral",
    ];
    return order.map((category) => ({
      category,
      items: questions
        .filter((q) => q.category === category)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [questions]);

  const selectedCount = questions.filter((q) => q.selected).length;
  const hasQuestions = questions.length > 0;

  async function runPredict(
    currentPack: PrepPack,
    currentQuestions: PredictedQuestion[],
  ) {
    if (!currentPack.decode) {
      setError("Decode the role first, then come back here.");
      return;
    }
    const key = activeKey();
    if (!key) {
      setError("Add an API key in Settings first.");
      return;
    }

    const currentPrompts = currentQuestions.map((q) => q.prompt);
    const avoidPrompts = mergeQuestionHistory(
      currentPack.questionHistory,
      currentPrompts,
    ).slice(-40);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/prep/predict", {
        method: "POST",
        headers: providerHeaders(provider, key),
        body: JSON.stringify({
          roleTitle: currentPack.roleTitle,
          companyName: currentPack.companyName,
          jdText: currentPack.jdText,
          cvText: currentPack.cvText,
          decode: currentPack.decode,
          avoidPrompts: avoidPrompts.length ? avoidPrompts : undefined,
        }),
      });
      const data = (await res.json()) as {
        questions?: Array<Omit<PredictedQuestion, "id" | "selected">>;
        error?: string;
      };
      if (!res.ok || !data.questions?.length) {
        throw new Error(data.error || "Predict failed");
      }

      const nextQuestions: PredictedQuestion[] = data.questions.map((q, i) => ({
        id: `pq_${crypto.randomUUID()}`,
        category: q.category,
        prompt: q.prompt,
        checking: q.checking,
        fresherMistake: q.fresherMistake,
        strongAnswer: q.strongAnswer,
        sortOrder: q.sortOrder ?? i + 1,
        selected: true,
      }));

      const questionHistory = mergeQuestionHistory(
        currentPack.questionHistory,
        currentPrompts,
      );

      const updated: PrepPack = {
        ...currentPack,
        status: "predicted",
        updatedAt: new Date().toISOString(),
        questions: nextQuestions,
        questionHistory,
      };
      savePrepPack(updated);
      setPack(updated);
      setQuestions(nextQuestions);
      setExpanded(nextQuestions[0]?.id ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Predict failed");
    } finally {
      setBusy(false);
    }
  }

  function handlePredict() {
    if (!pack) return;
    void runPredict(pack, questions);
  }

  useEffect(() => {
    if (!ready || !regenRequested || autoRegenDone.current || !pack?.decode) {
      return;
    }
    autoRegenDone.current = true;
    router.replace("/prep/predict");
    void runPredict(pack, questions);
  }, [ready, regenRequested, pack, questions, router]);

  function toggleSelected(id: string) {
    if (!pack) return;
    const next = questions.map((q) =>
      q.id === id ? { ...q, selected: !q.selected } : q,
    );
    setQuestions(next);
    const updated = {
      ...pack,
      questions: next,
      updatedAt: new Date().toISOString(),
    };
    savePrepPack(updated);
    setPack(updated);
  }

  if (!pack) {
    return (
      <PrepShell title="Predict questions" subtitle="Needs an active prep pack">
        <div className="rounded-[12px] border border-meet-border bg-meet-surface p-6">
          <p className="text-sm text-meet-muted">
            No active pack. Decode a role first.
          </p>
          <Link
            href="/prep/decode"
            className="mt-4 inline-flex rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Go to decode
          </Link>
        </div>
      </PrepShell>
    );
  }

  if (!pack.decode) {
    return (
      <PrepShell title="Predict questions" subtitle={pack.roleTitle}>
        <div className="rounded-[12px] border border-meet-border bg-meet-surface p-6">
          <p className="text-sm text-meet-muted">
            Finish decode before predicting questions.
          </p>
          <Link
            href="/prep/decode"
            className="mt-4 inline-flex rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Back to decode
          </Link>
        </div>
      </PrepShell>
    );
  }

  return (
    <PrepShell
      title="Predict questions"
      subtitle={`${pack.roleTitle} @ ${pack.companyName}`}
      activeStep="predict"
      pack={pack}
    >
      <WorkingOverlay
        open={busy}
        title={
          hasQuestions
            ? "Generating a new question set"
            : "Predicting interview questions"
        }
        hint={
          hasQuestions
            ? "Building 12 fresh questions that avoid your previous set. Stay on this page."
            : "Building 12 coached questions from your JD and CV. Stay on this page."
        }
      />

      <div className="pb-28">
        <div className="mb-4 rounded-[12px] border border-meet-border bg-meet-surface p-4">
          <p className="text-sm text-meet-muted">
            12 questions: 4 resume/project, 4 technical, 4 behavioral — each with
            what they check, fresher mistakes, and a strong answer from your real
            experience only.
            {hasQuestions
              ? " Generate a new set when you want different practice questions."
              : ""}
          </p>
          {(pack.questionHistory?.length ?? 0) > 0 ? (
            <p className="mt-2 text-xs text-meet-muted">
              Avoiding {pack.questionHistory!.length} prior prompt
              {pack.questionHistory!.length === 1 ? "" : "s"} from earlier sets.
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-amber-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {questions.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-meet-border bg-meet-surface/60 p-8 text-center">
            <p className="text-sm text-meet-muted">
              No predicted questions yet. Generate them from your decode pack.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.category}>
                <h2 className="mb-2 font-display text-base font-semibold">
                  {CATEGORY_LABEL[group.category]}
                  <span className="ml-2 text-sm font-normal text-meet-muted">
                    {group.items.length}
                  </span>
                </h2>
                <ul className="space-y-2">
                  {group.items.map((q) => {
                    const open = expanded === q.id;
                    return (
                      <li
                        key={q.id}
                        className="rounded-[12px] border border-meet-border bg-meet-surface"
                      >
                        <div className="flex items-start gap-3 p-4">
                          <input
                            type="checkbox"
                            checked={q.selected}
                            onChange={() => toggleSelected(q.id)}
                            className="mt-1"
                            aria-label="Include in interview pack"
                          />
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() =>
                              setExpanded(open ? null : q.id)
                            }
                          >
                            <p className="text-sm font-medium text-meet-text">
                              {q.prompt}
                            </p>
                            <p className="mt-1 text-xs text-meet-muted">
                              {open ? "Hide coaching" : "Show coaching"}
                            </p>
                          </button>
                        </div>
                        {open ? (
                          <div className="meet-scroll max-h-80 space-y-3 overflow-y-auto border-t border-meet-border px-4 py-3 text-sm">
                            <CoachBlock label="Checking" body={q.checking} />
                            <CoachBlock
                              label="Fresher mistake"
                              body={q.fresherMistake}
                            />
                            <CoachBlock
                              label="Strong answer (from your CV)"
                              body={q.strongAnswer}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <PrepFooterNav
        step="predict"
        pack={pack}
        hint={
          questions.length
            ? `${selectedCount} selected for interview practice`
            : "Generate questions to continue"
        }
        primary={
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePredict()}
            className={`rounded-[8px] px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              hasQuestions
                ? "bg-brand text-brand-foreground"
                : "border border-meet-border font-medium"
            }`}
          >
            {hasQuestions ? "Generate new set" : "Generate questions"}
          </button>
        }
      />
    </PrepShell>
  );
}

function CoachBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-meet-muted">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-meet-text">{body}</p>
    </div>
  );
}
