"use client";

import {
  buildSessionLabel,
  clearInterrogationThread,
  deleteInterrogationSession,
  listInterrogationSessions,
  loadInterrogationThread,
  mergeExtraFacts,
  saveInterrogationSession,
  saveInterrogationThread,
  setActiveInterrogationSessionId,
  type InterrogationSession,
} from "@/features/prep/interrogation-storage";
import { loadMasterCv } from "@/features/prep/master-cv-storage";
import { PrepShell } from "@/features/prep/PrepShell";
import { savePrepPack } from "@/features/prep/storage";
import type { StoryRoomMessage } from "@/features/prep/story-room-storage";
import { providerHeaders } from "@/lib/llm/headers";
import { getOrCreatePracticeId } from "@/lib/practice-id";
import { useSettingsStore } from "@/stores/settings-store";
import type { PrepPack } from "@/types/prep";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type View = "home" | "new" | "chat";

const shell = {
  sectionHref: "/interrogation",
  sectionLabel: "Interrogation",
};

const inputClass =
  "w-full rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm text-meet-text outline-none focus:border-brand disabled:opacity-60";

export function InterrogationRoomScreen() {
  const router = useRouter();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const provider = useSettingsStore((s) => s.provider);
  const activeKey = useSettingsStore((s) => s.activeKey);

  const [view, setView] = useState<View>("home");
  const [sessions, setSessions] = useState<InterrogationSession[]>([]);
  const [session, setSession] = useState<InterrogationSession | null>(null);
  const [messages, setMessages] = useState<StoryRoomMessage[]>([]);
  const [extraFacts, setExtraFacts] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState<string | undefined>();
  const [cvBusy, setCvBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function focusChatInput() {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function refreshSessions() {
    setSessions(listInterrogationSessions());
  }

  function openSession(next: InterrogationSession) {
    setActiveInterrogationSessionId(next.id);
    setSession(next);
    const thread = loadInterrogationThread(next.id);
    setMessages(thread?.messages ?? []);
    setExtraFacts(thread?.extraFacts ?? []);
    setError(null);
    setView("chat");
  }

  function goHome() {
    setView("home");
    setSession(null);
    setMessages([]);
    setExtraFacts([]);
    setError(null);
    setActiveInterrogationSessionId(null);
    refreshSessions();
  }

  function startNewForm() {
    const master = loadMasterCv();
    setRoleTitle("");
    setCompanyName("");
    setJdText("");
    setCvText(master?.text ?? "");
    setCvFileName(master?.fileName);
    setFormError(null);
    setView("new");
  }

  useEffect(() => {
    hydrate();
    refreshSessions();
    setActiveInterrogationSessionId(null);
  }, [hydrate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (view === "chat" && !busy) focusChatInput();
  }, [view, busy, messages.length]);

  async function handlePdf(file: File | null) {
    if (!file) return;
    setCvBusy(true);
    setFormError(null);
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
      if (!res.ok) throw new Error(data.error || "Could not read PDF");
      setCvText(data.text || "");
      setCvFileName(data.fileName || file.name);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not read PDF");
    } finally {
      setCvBusy(false);
    }
  }

  function createSession() {
    const role = roleTitle.trim();
    const company = companyName.trim();
    const jd = jdText.trim();
    const cv = cvText.trim();
    if (role.length < 2) {
      setFormError("Enter a role title.");
      return;
    }
    if (!company) {
      setFormError("Enter a company name.");
      return;
    }
    if (jd.length < 40) {
      setFormError("Paste a fuller job description.");
      return;
    }
    if (cv.length < 40) {
      setFormError("Add a CV (master CV or upload/paste for this session).");
      return;
    }

    const createdAt = new Date().toISOString();
    const next: InterrogationSession = {
      id: `int_${crypto.randomUUID()}`,
      roleTitle: role,
      companyName: company,
      jdText: jd,
      cvText: cv,
      cvFileName,
      createdAt,
      label: buildSessionLabel(role, company, createdAt),
    };
    saveInterrogationSession(next);
    saveInterrogationThread({
      sessionId: next.id,
      messages: [],
      extraFacts: [],
      updatedAt: createdAt,
    });
    openSession(next);
  }

  async function sendMessage(text: string) {
    if (!session || busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const key = activeKey();
    if (!key) {
      setError("Add an API key in Settings first.");
      return;
    }

    const userMsg: StoryRoomMessage = {
      id: `m_${crypto.randomUUID()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    setError(null);
    saveInterrogationThread({
      sessionId: session.id,
      messages: nextMessages,
      extraFacts,
      updatedAt: new Date().toISOString(),
    });

    try {
      const res = await fetch("/api/prep/story-room", {
        method: "POST",
        headers: providerHeaders(provider, key),
        body: JSON.stringify({
          roleTitle: session.roleTitle,
          companyName: session.companyName,
          jdText: session.jdText,
          cvText: session.cvText,
          extraFacts,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        newFacts?: string[];
        error?: string;
      };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || "Could not get a reply");
      }

      const assistantMsg: StoryRoomMessage = {
        id: `m_${crypto.randomUUID()}`,
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };
      const mergedFacts = mergeExtraFacts(extraFacts, data.newFacts ?? []);
      const withAssistant = [...nextMessages, assistantMsg];
      setMessages(withAssistant);
      setExtraFacts(mergedFacts);
      saveInterrogationThread({
        sessionId: session.id,
        messages: withAssistant,
        extraFacts: mergedFacts,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get a reply");
      setMessages(nextMessages);
    } finally {
      setBusy(false);
    }
  }

  function handleClearChat() {
    if (!session) return;
    const ok = window.confirm(
      "Clear this session’s chat and remembered facts?",
    );
    if (!ok) return;
    clearInterrogationThread(session.id);
    setMessages([]);
    setExtraFacts([]);
    setError(null);
  }

  function handleDeleteSession(id: string) {
    const ok = window.confirm("Delete this interrogation session?");
    if (!ok) return;
    deleteInterrogationSession(id);
    if (session?.id === id) goHome();
    else refreshSessions();
  }

  function prepForThisRole() {
    if (!session) return;
    const now = new Date().toISOString();
    const pack: PrepPack = {
      id: `pack_${crypto.randomUUID()}`,
      practiceId: getOrCreatePracticeId(),
      roleTitle: session.roleTitle,
      companyName: session.companyName,
      jdText: session.jdText,
      cvText: session.cvText,
      cvFileName: session.cvFileName,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    savePrepPack(pack);
    router.push("/prep/decode");
  }

  if (view === "new") {
    const master = loadMasterCv();
    return (
      <PrepShell title="New interrogation" {...shell}>
        <p className="mb-4 text-sm text-meet-muted">
          Enter role, company, and JD.
          {master
            ? " Master CV is prefilled — change it only if this role needs a different resume."
            : " No master CV yet — upload or paste one here, or set Master CV in the top bar."}
        </p>
        <div className="mx-auto max-w-2xl space-y-4 rounded-[12px] border border-meet-border bg-meet-surface p-5">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-meet-muted">
              Role
            </span>
            <input
              className={`${inputClass} mt-1`}
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Software Engineer (.NET)"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-meet-muted">
              Company
            </span>
            <input
              className={`${inputClass} mt-1`}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Exact Asia"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-meet-muted">
              Job description
            </span>
            <textarea
              className={`${inputClass} meet-scroll mt-1 max-h-48 resize-y`}
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the JD…"
            />
          </label>
          <div>
            <span className="text-xs uppercase tracking-wide text-meet-muted">
              CV {master ? "(from master CV)" : ""}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={cvBusy}
              className="mt-1 block w-full text-sm text-meet-muted file:mr-3 file:rounded-[8px] file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-foreground"
              onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
            />
            {cvBusy ? (
              <p className="mt-2 text-sm text-meet-muted">Reading CV…</p>
            ) : null}
            {cvFileName ? (
              <p className="mt-1 text-xs text-meet-muted">{cvFileName}</p>
            ) : null}
            <textarea
              className={`${inputClass} meet-scroll mt-2 max-h-56 resize-y`}
              rows={8}
              value={cvText}
              disabled={cvBusy}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste CV text…"
            />
          </div>
          {formError ? (
            <p className="text-sm text-amber-300" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goHome}
              className="rounded-[8px] border border-meet-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createSession}
              disabled={cvBusy}
              className="rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
            >
              Start interrogation
            </button>
          </div>
        </div>
      </PrepShell>
    );
  }

  if (view === "chat" && session) {
    return (
      <PrepShell
        title="Interrogation room"
        subtitle={`${session.roleTitle} @ ${session.companyName}`}
        bodyScroll={false}
        headerActions={
          <>
            <button
              type="button"
              onClick={goHome}
              className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm font-medium hover:border-brand"
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={prepForThisRole}
              className="rounded-[8px] bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground"
            >
              Prep for this role
            </button>
          </>
        }
        {...shell}
      >
        <p className="mb-3 shrink-0 text-sm text-meet-muted">
          Ask like an interviewer. Answers use only this session’s CV and JD.
        </p>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-meet-border bg-meet-surface">
          <div className="meet-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-meet-border px-4 py-8 text-center">
                <p className="text-sm text-meet-muted">
                  Try: “Tell me about your last project” or “Walk me through a
                  production incident you owned.”
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-brand text-brand-foreground"
                        : "border border-meet-border bg-meet-bg text-meet-text"
                    }`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                      {m.role === "user"
                        ? "You (interviewer)"
                        : "You (candidate)"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {busy ? (
              <p className="text-xs text-meet-muted" role="status">
                Thinking as you…
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-meet-border p-3">
            {error ? (
              <p className="mb-2 text-sm text-amber-300" role="alert">
                {error}
              </p>
            ) : null}
            {extraFacts.length > 0 ? (
              <p className="mb-2 text-xs text-meet-muted">
                {extraFacts.length} extra fact
                {extraFacts.length === 1 ? "" : "s"} remembered.
              </p>
            ) : null}
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(draft);
              }}
            >
              <label className="sr-only" htmlFor="story-room-input">
                Ask a question
              </label>
              <textarea
                ref={inputRef}
                id="story-room-input"
                rows={2}
                value={draft}
                disabled={busy}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                placeholder="Ask as the interviewer…"
                className="min-h-[72px] flex-1 resize-y rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm text-meet-text placeholder:text-meet-muted focus:border-brand focus:outline-none disabled:opacity-70"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={
                    busy || (messages.length === 0 && extraFacts.length === 0)
                  }
                  className="rounded-[8px] border border-meet-border px-3 py-2 text-sm disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </PrepShell>
    );
  }

  return (
    <PrepShell title="Interrogation room" {...shell}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-meet-muted">
          Start a new session with role, company, and JD — or reopen a past
          chat by name.
        </p>
        <button
          type="button"
          onClick={startNewForm}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
        >
          Start new interrogation
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-meet-border bg-meet-surface/60 px-4 py-10 text-center">
          <p className="text-sm text-meet-muted">
            No sessions yet. Set a Master CV in the top bar, then start a new
            interrogation.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {sessions.map((item) => (
            <li key={item.id}>
              <div className="flex items-stretch gap-2 rounded-[12px] border border-meet-border bg-meet-surface p-1">
                <button
                  type="button"
                  onClick={() => openSession(item)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left hover:bg-black/20"
                >
                  <span className="block truncate text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-meet-muted">
                    {item.roleTitle} · {item.companyName} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(item.id)}
                  className="shrink-0 px-3 text-xs text-meet-muted hover:text-amber-300"
                  aria-label={`Delete ${item.label}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PrepShell>
  );
}
