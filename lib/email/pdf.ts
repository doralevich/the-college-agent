import "server-only";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

// Shared "summary PDF" builder for the order / onboarding / setup admin emails. Renders a
// branded, multi-page A4 document from labelled rows and returns it base64-encoded, ready to
// drop into a Mandrill `attachments` entry (see pdfAttachment). Originally lived inline in the
// (now removed) /api/notify route; generalised here so every form's admin email can attach one.

export interface PdfSection {
  heading: string;
  // [label, value] pairs. Empty-string values are skipped by the callers, not here.
  rows: Array<[string, string]>;
}

export interface SummaryPdfInput {
  title: string;          // shown top-right in the header bar, e.g. "Order Summary"
  subtitle?: string;      // optional line under the header, e.g. the student's name
  sections: PdfSection[];
  note?: string;          // optional muted paragraph at the very end
}

const NAVY = rgb(0.04, 0.09, 0.16);
const GREEN = rgb(0.24, 0.55, 0.24);
const MUTED = rgb(0.4, 0.4, 0.4);
const CREAM = rgb(0.95, 0.94, 0.93);
const HAIRLINE = rgb(0.9, 0.9, 0.9);
const WHITE = rgb(1, 1, 1);
const SUBTLE = rgb(0.6, 0.65, 0.7);

const PAGE_W = 595;
const PAGE_H = 842; // A4
const L = 48;
const R = PAGE_W - 48;
const LABEL_X = L + 8;
const VALUE_X = L + 170;
const VALUE_W = R - VALUE_X;
const TOP = PAGE_H - 98; // first content baseline, below the header bar
const BOTTOM = 56;       // reserve for the footer bar

// pdf-lib's StandardFonts use WinAnsi encoding, which throws on any character outside CP1252
// (emoji, smart quotes, CJK, …). User-typed answers can contain anything, so normalise common
// punctuation to ASCII and drop everything still unencodable. Without this, one pasted "smart
// quote" in a free-text field would 500 the submit handler.
function sanitize(s: string): string {
  return String(s)
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildSummaryPdf(input: SummaryPdfInput): Promise<string> {
  const { title, subtitle, sections, note } = input;
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const generated = `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  let page!: PDFPage;
  let y = 0;

  function drawHeader(continuation: boolean) {
    page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: NAVY });
    page.drawText("The College Agent", { x: L, y: PAGE_H - 30, size: 11, font: bold, color: WHITE });
    page.drawText("thecollegeagent.ai", { x: L, y: PAGE_H - 48, size: 9, font: regular, color: SUBTLE });
    const label = continuation ? `${title} (cont.)` : title;
    const w = bold.widthOfTextAtSize(label, 13);
    page.drawText(label, { x: R - w, y: PAGE_H - 38, size: 13, font: bold, color: WHITE });
  }

  function drawFooter() {
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 36, color: NAVY });
    page.drawText("Questions? hello@thecollegeagent.ai", { x: L, y: 13, size: 8, font: regular, color: SUBTLE });
    const w = regular.widthOfTextAtSize(generated, 8);
    page.drawText(generated, { x: R - w, y: 13, size: 8, font: regular, color: SUBTLE });
  }

  function newPage(continuation: boolean) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    drawHeader(continuation);
    y = TOP;
  }

  // Add a fresh page (carrying the footer onto the one we're leaving) when `needed` points
  // wouldn't fit above the footer.
  function ensureSpace(needed: number) {
    if (y - needed < BOTTOM) {
      drawFooter();
      newPage(true);
    }
  }

  newPage(false);

  if (subtitle) {
    ensureSpace(20);
    y -= 14;
    page.drawText(sanitize(subtitle), { x: L, y, size: 11, font: bold, color: NAVY });
    y -= 8;
  }

  function section(heading: string) {
    ensureSpace(42);
    y -= 18;
    page.drawRectangle({ x: L, y, width: R - L, height: 20, color: CREAM });
    page.drawText(sanitize(heading).toUpperCase(), { x: LABEL_X, y: y + 6, size: 8, font: bold, color: MUTED });
    y -= 4;
  }

  function row(label: string, value: string) {
    const valueLines = wrap(value, regular, 10, VALUE_W);
    const labelLines = wrap(label, bold, 10, VALUE_X - LABEL_X - 8);
    const lineCount = Math.max(valueLines.length, labelLines.length);
    ensureSpace(lineCount * 14 + 8);
    y -= 14;
    const startY = y;
    labelLines.forEach((ln, i) => page.drawText(ln, { x: LABEL_X, y: startY - i * 14, size: 10, font: bold, color: NAVY }));
    valueLines.forEach((ln, i) => page.drawText(ln, { x: VALUE_X, y: startY - i * 14, size: 10, font: regular, color: NAVY }));
    y = startY - (lineCount - 1) * 14 - 6;
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: HAIRLINE });
  }

  for (const sec of sections) {
    if (!sec.rows.length) continue;
    section(sec.heading);
    for (const [label, value] of sec.rows) row(label, value);
    y -= 6;
  }

  if (note) {
    for (const ln of wrap(note, regular, 9, R - L)) {
      ensureSpace(14);
      y -= 13;
      page.drawText(ln, { x: L, y, size: 9, font: regular, color: MUTED });
    }
  }

  drawFooter();

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

// Mandrill attachment shape: base64 content + mime type.
export function pdfAttachment(name: string, base64: string) {
  return { type: "application/pdf", name, content: base64 };
}
