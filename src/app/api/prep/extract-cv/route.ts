import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = (typeof text === "string" ? text : "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF" },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: cleaned,
      fileName: file.name,
      chars: cleaned.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extract failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
