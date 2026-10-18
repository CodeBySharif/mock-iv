"use client";

import {
  clearMasterCv,
  loadMasterCv,
  saveMasterCv,
  type MasterCv,
} from "@/features/prep/master-cv-storage";
import { useEffect, useState } from "react";

type MasterCvModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: (cv: MasterCv | null) => void;
};

export function MasterCvModal({ open, onClose, onSaved }: MasterCvModalProps) {
  const [cv, setCv] = useState<MasterCv | null>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const loaded = loadMasterCv();
    setCv(loaded);
    setText(loaded?.text ?? "");
    setFileName(loaded?.fileName);
    setError(null);
    setBusy(false);
  }, [open]);

  if (!open) return null;

  async function handlePdf(file: File | null) {
    if (!file) return;
    setBusy(true);
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
      if (!res.ok) throw new Error(data.error || "Could not read PDF");
      setText(data.text || "");
      setFileName(data.fileName || file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read PDF");
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    const trimmed = text.trim();
    if (trimmed.length < 40) {
      setError("Paste or upload a CV with at least a short work history.");
      return;
    }
    const saved = saveMasterCv({ text: trimmed, fileName });
    setCv(saved);
    onSaved?.(saved);
    onClose();
  }

  function handleClear() {
    const ok = window.confirm("Remove the master CV from this browser?");
    if (!ok) return;
    clearMasterCv();
    setCv(null);
    setText("");
    setFileName(undefined);
    onSaved?.(null);
  }

  const empty = !cv && !text.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-cv-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[12px] border border-meet-border bg-meet-surface text-meet-text"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-meet-border px-5 py-4">
          <div>
            <h2 id="master-cv-title" className="text-lg font-semibold">
              Master CV
            </h2>
            <p className="mt-1 text-sm text-meet-muted">
              Reused when you start interrogation or prep. Stored only in this
              browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-meet-border px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        <div className="meet-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {busy ? (
            <p className="rounded-[8px] border border-meet-border bg-meet-bg px-3 py-6 text-center text-sm text-meet-muted">
              Reading CV…
            </p>
          ) : null}

          {empty && !busy ? (
            <p className="rounded-[8px] border border-dashed border-meet-border px-3 py-6 text-center text-sm text-meet-muted">
              No master CV yet. Upload a PDF or paste text below.
            </p>
          ) : null}

          <div>
            <label className="text-xs uppercase tracking-wide text-meet-muted">
              Upload PDF
            </label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              className="mt-1 block w-full text-sm text-meet-muted file:mr-3 file:rounded-[8px] file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-foreground"
              onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
            />
            {fileName ? (
              <p className="mt-1 text-xs text-meet-muted">{fileName}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="master-cv-text"
              className="text-xs uppercase tracking-wide text-meet-muted"
            >
              CV text
            </label>
            <textarea
              id="master-cv-text"
              rows={10}
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your CV here…"
              className="meet-scroll mt-1 w-full resize-y rounded-[8px] border border-meet-border bg-meet-bg px-3 py-2 text-sm text-meet-text outline-none focus:border-brand disabled:opacity-60"
            />
          </div>

          {error ? (
            <p className="text-sm text-amber-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-meet-border px-5 py-3">
          {cv || text.trim() ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={busy}
              className="rounded-[8px] border border-meet-border px-3 py-2 text-sm disabled:opacity-50"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-[8px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
          >
            Save master CV
          </button>
        </div>
      </div>
    </div>
  );
}
