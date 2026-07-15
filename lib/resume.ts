import "server-only";

// Best-effort résumé text extraction so the agent gets the *content* of the résumé, not just a
// link to it. PDF only (via unpdf, which is serverless-safe and dynamically imported so it never
// bloats other routes). Any other format — or a parse failure — returns "" and the agent falls
// back to the stored file link. NEVER throws: résumé handling must not break intake submission.
export async function extractResumeText(buffer: Buffer, filename: string, cap = 8000): Promise<string> {
  if (!/\.pdf$/i.test(filename.trim())) return "";
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
    const clean = joined.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return clean.length > cap ? clean.slice(0, cap).trimEnd() + "…" : clean;
  } catch {
    return "";
  }
}
