import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildSummaryPdf, pdfAttachment } from "@/lib/email/pdf";

async function decode(base64: string) {
  const buf = Buffer.from(base64, "base64");
  return { buf, doc: await PDFDocument.load(buf) };
}

describe("buildSummaryPdf", () => {
  it("produces a valid, loadable PDF from a simple summary", async () => {
    const base64 = await buildSummaryPdf({
      title: "Order Summary",
      subtitle: "Jane Smith",
      sections: [{ heading: "Student", rows: [["Name", "Jane Smith"], ["School", "State U"]] }],
      note: "Payment confirmed via Stripe.",
    });
    const { buf, doc } = await decode(base64);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(doc.getPageCount()).toBe(1);
  });

  it("does not throw on hostile, non-WinAnsi user input (emoji, smart quotes, CJK)", async () => {
    const base64 = await buildSummaryPdf({
      title: "Onboarding",
      subtitle: "Émilie “Em” O’Brien 🎓",
      sections: [
        {
          heading: "Goals & Career",
          rows: [
            ["Anything Else", "I’m focused on finance — GPA 3.8–4.0 😤. 我的目标是成功. Don’t bring up family…"],
            ["Dream Company", "Goldman Sachs™"],
          ],
        },
      ],
    });
    const { doc } = await decode(base64);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("paginates across multiple pages for a large questionnaire", async () => {
    const rows: Array<[string, string]> = Array.from({ length: 60 }, (_, i) => [
      `Question ${i + 1}`,
      "A fairly long answer that should consume vertical space and force the document to overflow onto additional pages when there are many of them stacked together.",
    ]);
    const base64 = await buildSummaryPdf({
      title: "Onboarding",
      sections: [
        { heading: "Section A", rows },
        { heading: "Section B", rows },
      ],
    });
    const { doc } = await decode(base64);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("skips empty sections without error", async () => {
    const base64 = await buildSummaryPdf({
      title: "Setup",
      sections: [
        { heading: "Empty", rows: [] },
        { heading: "Real", rows: [["Telegram User ID", "12345"]] },
      ],
    });
    const { doc } = await decode(base64);
    expect(doc.getPageCount()).toBe(1);
  });

  it("pdfAttachment returns the Mandrill attachment shape", () => {
    expect(pdfAttachment("order.pdf", "QkFTRTY0")).toEqual({
      type: "application/pdf",
      name: "order.pdf",
      content: "QkFTRTY0",
    });
  });
});
