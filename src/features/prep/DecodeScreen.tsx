"use client";

import { clearActivePack } from "@/features/prep/clear-local-data";
import { generateAndSaveIntroScripts } from "@/features/prep/generate-intros";
import { loadMasterCv } from "@/features/prep/master-cv-storage";
import { PrepFooterNav } from "@/features/prep/PrepFooterNav";
import { PrepShell } from "@/features/prep/PrepShell";
import { WorkingOverlay } from "@/features/prep/WorkingOverlay";
import { loadPrepPack, savePrepPack } from "@/features/prep/storage";
import { providerHeaders } from "@/lib/llm/headers";
import { getOrCreatePracticeId } from "@/lib/practice-id";
import { useSettingsStore } from "@/stores/settings-store";
import type {
  IntroScripts,
  PrepExperienceLevel,
  PrepPack,
  RoleDecodePayload,
} from "@/types/prep";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LEVELS: PrepExperienceLevel[] = ["junior", "mid", "senior"];

function uid() {
  return `pack_${crypto.randomUUID()}`;
}

const inputClass =
  "w-full rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm text-meet-text outline-none focus:border-brand disabled:opacity-60";

type DecodeStep = "form" | "results";

export function DecodeScreen() {
  const searchParams = useSearchParams();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);

  const [step, setStep] = useState<DecodeStep>("form");
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<PrepExperienceLevel>("mid");
  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState<string | undefined>();
  const [packId, setPackId] = useState<string | null>(null);
  const [pack, setPack] = useState<PrepPack | null>(null);
  const [decode, setDecode] = useState<RoleDecodePayload | null>(null);
  const [busy, setBusy] = useState<"idle" | "pdf" | "decode">("idle");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    getOrCreatePracticeId();
    const forceNew = searchParams.get("new") === "1";
    if (forceNew) {
      clearActivePack();
      const master = loadMasterCv();
      if (master) {
        setCvText(master.text);
        setCvFileName(master.fileName);
      }
      return;
    }
    const active =
      typeof window !== "undefined"
        ? localStorage.getItem("mock-iv:active-pack")
        : null;
    if (!active) return;
    const pack = loadPrepPack(active);
    if (!pack) return;
    setPackId(pack.id);
    setPack(pack);
    setRoleTitle(pack.roleTitle);
    setCompanyName(pack.companyName);
    setExperienceLevel(pack.experienceLevel ?? "mid");
    setJdText(pack.jdText);
    setCvText(pack.cvText);
    setCvFileName(pack.cvFileName);
    setDecode(pack.decode ?? null);
    if (pack.decode) setStep("results");
  }, [hydrate, searchParams]);

  async function handlePdf(file: File | null) {
    if (!file) return;
    setBusy("pdf");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/prep/extract-cv", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        text?: string;
        fileName?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "PDF extract failed");
      setCvText(data.text || "");
      setCvFileName(data.fileName || file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF extract failed");
    } finally {
      setBusy("idle");
    }
  }

  async function handleDecode() {
    const key = activeKey();
    if (!key) {
      setError("Add an API key in Settings for your selected provider.");
      return;
    }
    setBusy("decode");
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/prep/decode", {
        method: "POST",
        headers: providerHeaders(provider, key),
        body: JSON.stringify({
          roleTitle,
          companyName,
          jdText,
          cvText,
        }),
      });
      const data = (await res.json()) as {
        decode?: RoleDecodePayload;
        introScripts?: IntroScripts | null;
        introError?: string | null;
        error?: string;
      };
      if (!res.ok || !data.decode) {
        throw new Error(data.error || "Decode failed");
      }

      const now = new Date().toISOString();
      const id = packId ?? uid();
      let introScripts = data.introScripts ?? undefined;

      // Fallback if decode succeeded but intros didn't come back with it.
      if (!introScripts?.["30"] || !introScripts?.["60"] || !introScripts?.["120"]) {
        try {
          introScripts = await generateAndSaveIntroScripts({
            pack: {
              id,
              practiceId: getOrCreatePracticeId(),
              roleTitle: roleTitle.trim(),
              companyName: companyName.trim(),
              jdText: jdText.trim(),
              cvText: cvText.trim(),
              cvFileName,
              experienceLevel,
              status: "decoded",
              createdAt: loadPrepPack(id)?.createdAt ?? now,
              updatedAt: now,
              decode: data.decode,
            },
            provider,
            apiKey: key,
          });
        } catch (introErr) {
          setNote(
            introErr instanceof Error
              ? `Decode saved, but intros failed: ${introErr.message}. Open pack overview to regenerate.`
              : data.introError ||
                  "Decode saved, but intro scripts failed. Open pack overview to regenerate.",
          );
        }
      }

      const pack: PrepPack = {
        id,
        practiceId: getOrCreatePracticeId(),
        roleTitle: roleTitle.trim(),
        companyName: companyName.trim(),
        jdText: jdText.trim(),
        cvText: cvText.trim(),
        cvFileName,
        experienceLevel,
        status: "decoded",
        createdAt: loadPrepPack(id)?.createdAt ?? now,
        updatedAt: now,
        decode: data.decode,
        introScripts,
        questions: loadPrepPack(id)?.questions,
        cheatSheet: loadPrepPack(id)?.cheatSheet,
      };
      savePrepPack(pack);
      setPackId(id);
      setPack(pack);
      setDecode(data.decode);
      setStep("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (introScripts) {
        setNote(
          "Decode + practice intros ready (30 sec, 1 min, 2 min) — they’ll appear in the interview.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decode failed");
    } finally {
      setBusy("idle");
    }
  }

  const overlayTitle =
    busy === "decode"
      ? "Decoding role + writing your intros"
      : busy === "pdf"
        ? "Reading your CV"
        : "";

  return (
    <PrepShell
      title="Decode the role"
      subtitle={
        step === "form"
          ? `${roleTitle || "New role"} · inputs`
          : `${roleTitle || "Role"} · briefing`
      }
      pack={pack}
    >
      <WorkingOverlay
        open={busy !== "idle"}
        title={overlayTitle || "Working"}
        hint="Please stay on this page. Leaving may cancel the request."
      />

      {step === "form" ? (
        <section className="rounded-[12px] border border-meet-border bg-meet-surface p-4 pb-28 sm:p-5 sm:pb-28">
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-meet-muted">
                Role
              </span>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                disabled={busy !== "idle"}
                placeholder="e.g. Mid-level Software Engineer"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-meet-muted">
                Company
              </span>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={busy !== "idle"}
                placeholder="Company name"
                className={inputClass}
              />
            </label>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-meet-muted">
                Experience level
              </span>
              <div
                role="group"
                aria-label="Experience level"
                className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-meet-border"
              >
                {LEVELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={busy !== "idle"}
                    onClick={() => setExperienceLevel(item)}
                    className={`px-3 py-2.5 text-sm capitalize disabled:opacity-50 ${
                      experienceLevel === item
                        ? "bg-brand text-brand-foreground"
                        : "text-meet-muted hover:bg-black/20 hover:text-meet-text"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="text-xs text-meet-muted">
                Used for think-time pacing in the interview room.
              </p>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-meet-muted">
                Job description
              </span>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={busy !== "idle"}
                rows={10}
                placeholder="Paste the full JD…"
                className={`${inputClass} meet-scroll max-h-64 resize-y`}
              />
            </label>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-meet-muted">
                CV (PDF)
              </span>
              <input
                type="file"
                accept="application/pdf"
                disabled={busy !== "idle"}
                onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-meet-muted file:mr-3 file:rounded-[8px] file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-foreground disabled:opacity-50"
              />
              {cvFileName ? (
                <p className="text-xs text-meet-muted">
                  {cvFileName} · {cvText.length.toLocaleString()} chars extracted
                </p>
              ) : null}
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                disabled={busy !== "idle"}
                rows={7}
                placeholder="Extracted CV text appears here (you can edit)…"
                className={`${inputClass} meet-scroll max-h-56 resize-y`}
              />
            </div>

            {error ? (
              <p className="text-sm text-amber-300" role="alert">
                {error}
              </p>
            ) : null}
            {note ? (
              <p className="text-sm text-brand" role="status">
                {note}
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="rounded-[12px] border border-meet-border bg-meet-surface p-4 pb-28 sm:p-5 sm:pb-28">
          {note ? (
            <p className="mb-4 text-sm text-brand" role="status">
              {note}
            </p>
          ) : null}
          {!decode ? (
            <p className="text-sm text-meet-muted">No briefing yet.</p>
          ) : (
            <div className="meet-scroll max-h-[70vh] space-y-5 overflow-y-auto pr-1 text-sm leading-relaxed">
              <p className="text-xs text-meet-muted">
                {roleTitle} · {companyName}
              </p>
              <Block title="Day to day" body={decode.dayToDay} />
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                  Skills they will test
                </h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  {decode.skillsToTest
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((s) => (
                      <li key={`${s.rank}-${s.skill}`}>
                        <span className="font-medium text-meet-text">
                          {s.skill}
                        </span>
                        <span className="text-meet-muted"> — {s.why}</span>
                      </li>
                    ))}
                </ol>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                  Resume matches
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-meet-text">
                  {decode.matches.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                  Gaps + how to handle
                </h3>
                <ul className="mt-2 space-y-3">
                  {decode.gaps.map((gap, i) => (
                    <li
                      key={gap}
                      className="rounded-[8px] border border-meet-border bg-meet-bg p-3"
                    >
                      <p className="font-medium">{gap}</p>
                      <p className="mt-1 text-meet-muted">
                        {decode.gapHandling[i] || "Prepare an honest framing."}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-meet-muted">
                  Company
                </h3>
                <p className="mt-2">{decode.company.whatTheyDo}</p>
                <p className="mt-2 text-meet-muted">
                  Customers: {decode.company.customers}
                </p>
                {decode.company.recentMentions.length ? (
                  <ul className="mt-2 list-disc pl-5 text-meet-muted">
                    {decode.company.recentMentions.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : null}
                {decode.company.unknowns.length ? (
                  <p className="mt-2 text-amber-200">
                    Unsure (do not bluff): {decode.company.unknowns.join("; ")}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </section>
      )}

      <PrepFooterNav
        step="decode"
        pack={pack}
        hint={
          step === "form"
            ? "Fill inputs, then run decode."
            : "Review the briefing, then continue."
        }
        primary={
          <>
            {step === "results" ? (
              <button
                type="button"
                disabled={busy !== "idle"}
                onClick={() => setStep("form")}
                className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                Back to form
              </button>
            ) : null}
            {step === "form" ? (
              <>
                {decode ? (
                  <button
                    type="button"
                    disabled={busy !== "idle"}
                    onClick={() => setStep("results")}
                    className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    View briefing
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy !== "idle"}
                  onClick={() => void handleDecode()}
                  className="rounded-[8px] border border-meet-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  Run decode
                </button>
              </>
            ) : null}
          </>
        }
      />
    </PrepShell>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-meet-muted">
        {title}
      </h3>
      <p className="mt-2 text-meet-text">{body}</p>
    </div>
  );
}
