import { jsPDF } from "jspdf";
import { SECTION_LABELS, type SessionReport } from "@/types/interview";
import { formatReportDate } from "@/features/report/storage";

const COLORS = {
  ink: [26, 35, 50] as const,
  muted: [91, 103, 119] as const,
  line: [213, 221, 231] as const,
  soft: [247, 249, 251] as const,
  accent: [11, 128, 67] as const,
  white: [255, 255, 255] as const,
  dark: [17, 17, 17] as const,
};

type FontStyle = "normal" | "bold" | "italic";

function formatClock(ms?: number) {
  if (!ms || ms <= 0) return "—";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function downloadReportPdf(report: SessionReport, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;
  const bottom = pageHeight - 56;
  const { session, turns, summary } = report;
  const date = formatReportDate(session.createdAt);
  let page = 1;
  let y = 0;

  function drawFooter() {
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.6);
    doc.line(margin, pageHeight - 36, rightEdge, pageHeight - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("Mock Interview", margin, pageHeight - 22);
    doc.text(filename.replace(/\.pdf$/i, ""), pageWidth / 2, pageHeight - 22, {
      align: "center",
    });
    doc.text(`Page ${page}`, rightEdge, pageHeight - 22, { align: "right" });
  }

  function newPage() {
    drawFooter();
    doc.addPage();
    page += 1;
    y = margin;
  }

  function ensure(needed: number) {
    if (y + needed > bottom) newPage();
  }

  function wrapText(
    text: string,
    maxWidth: number,
    style: FontStyle,
    size: number,
  ) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    return doc.splitTextToSize(
      String(text || ""),
      Math.max(24, maxWidth),
    ) as string[];
  }

  function writeWrapped(
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number,
    style: FontStyle,
    size: number,
    color: readonly [number, number, number],
  ) {
    const width = Math.min(maxWidth, rightEdge - x);
    const lines = wrapText(text, width, style, size);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    for (const line of lines) {
      ensure(lineHeight + 2);
      doc.text(line, x, y, { maxWidth: width });
      y += lineHeight;
    }
  }

  const title = `${session.level[0].toUpperCase()}${session.level.slice(1)} interview report`;
  const titleLines = wrapText(title, contentWidth, "bold", 22);
  const meta = `${date.slash}  ·  ${session.status}${
    session.durationMinutes ? `  ·  ${session.durationMinutes} min plan` : ""
  }`;
  const headerHeight = 36 + 16 + titleLines.length * 24 + 18 + 20;

  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, headerHeight, pageWidth, 4, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MOCK INTERVIEW", margin, 36);

  let titleY = 58;
  doc.setFontSize(22);
  titleLines.forEach((line) => {
    doc.text(line, margin, titleY, { maxWidth: contentWidth });
    titleY += 24;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(154, 160, 166);
  doc.text(meta, margin, titleY + 4, { maxWidth: contentWidth });

  y = headerHeight + 28;

  const cards = [
    { label: "Answers", value: String(summary.turnsCompleted) },
    {
      label: "Avg pace",
      value: summary.avgWpm ? `${summary.avgWpm} WPM` : "—",
    },
    { label: "Fillers", value: String(summary.totalFillers ?? 0) },
    { label: "Questions", value: String(turns.length) },
  ];
  const cardGap = 10;
  const cardW = (contentWidth - cardGap * 3) / 4;
  ensure(60);
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + cardGap);
    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(x, y, cardW, 52, 6, 6, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(card.label.toUpperCase(), x + 10, y + 18, {
      maxWidth: cardW - 16,
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.ink);
    doc.text(card.value, x + 10, y + 38, { maxWidth: cardW - 16 });
  });
  y += 68;

  writeWrapped(
    `Sections covered: ${
      summary.sectionsCompleted
        .map((section) => SECTION_LABELS[section])
        .join(" · ") || "—"
    }`,
    margin,
    contentWidth,
    12,
    "normal",
    9,
    COLORS.muted,
  );
  y += 14;

  let lastSection = "";
  const textIndent = margin + 12;
  const textWidth = rightEdge - textIndent;

  turns.forEach((turn, index) => {
    const sectionLabel = SECTION_LABELS[turn.section];
    const answer = turn.transcriptFinal?.trim() || "No answer captured";
    const interviewer =
      turn.interviewerRole === "hr" ? "Alex · HR" : "Sam · Technical";

    if (sectionLabel !== lastSection) {
      ensure(40);
      writeWrapped(
        sectionLabel.toUpperCase(),
        margin,
        contentWidth,
        14,
        "bold",
        12,
        COLORS.accent,
      );
      y += 2;
      doc.setDrawColor(...COLORS.accent);
      doc.setLineWidth(1.4);
      doc.line(margin, y, margin + 42, y);
      y += 16;
      lastSection = sectionLabel;
    }

    ensure(56);
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin, y - 10, 3, 18, "F");

    writeWrapped(
      `Question ${index + 1}  ·  ${interviewer}${
        turn.status === "skipped" ? "  ·  Skipped" : ""
      }`,
      textIndent,
      textWidth,
      11,
      "normal",
      8,
      COLORS.muted,
    );
    y += 4;

    writeWrapped(
      turn.questionText,
      textIndent,
      textWidth,
      14,
      "bold",
      11,
      COLORS.ink,
    );
    y += 10;

    writeWrapped(
      "YOUR ANSWER",
      textIndent,
      textWidth,
      11,
      "bold",
      8,
      COLORS.muted,
    );
    y += 2;
    writeWrapped(answer, textIndent, textWidth, 13, "normal", 10, COLORS.ink);
    y += 10;

    ensure(24);
    const metrics = [
      `Time ${formatClock(turn.metrics?.durationMs)}`,
      turn.metrics ? `${turn.metrics.wordsPerMinute} WPM` : "— WPM",
      turn.metrics ? `${turn.metrics.fillerCount} fillers` : "— fillers",
      turn.metrics?.clarityProxyScore != null
        ? `Clarity ${turn.metrics.clarityProxyScore}`
        : "Clarity —",
    ];
    let mx = textIndent;
    metrics.forEach((label) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const w = doc.getTextWidth(label) + 14;
      if (mx + w > rightEdge) {
        y += 22;
        ensure(24);
        mx = textIndent;
      }
      doc.setFillColor(...COLORS.soft);
      doc.roundedRect(mx, y - 9, w, 16, 3, 3, "F");
      doc.setTextColor(...COLORS.ink);
      doc.text(label, mx + 7, y + 2);
      mx += w + 6;
    });
    y += 22;

    if (turn.acknowledgmentText) {
      writeWrapped(
        turn.acknowledgmentText,
        textIndent,
        textWidth,
        12,
        "italic",
        9,
        COLORS.muted,
      );
      y += 6;
    }

    if (turn.tips?.length) {
      ensure(28);
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.6);
      doc.line(textIndent, y, rightEdge, y);
      y += 14;
      writeWrapped(
        "COACHING",
        textIndent,
        textWidth,
        11,
        "bold",
        8,
        COLORS.muted,
      );
      y += 2;
      turn.tips.forEach((tip) => {
        writeWrapped(
          `• ${tip}`,
          textIndent,
          textWidth,
          12,
          "normal",
          9,
          COLORS.ink,
        );
      });
    }

    y += 8;
    ensure(12);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.6);
    doc.line(margin, y, rightEdge, y);
    y += 18;
  });

  drawFooter();
  doc.save(filename);
}
