const TESTIMONIALS = [
  {
    quote: "I used to spend Sunday nights panicking about the week ahead. Now I ask my agent on Friday and it tells me exactly what's coming, what's due, and what I can push. I haven't missed a deadline since October.",
    name: "Maya R.",
    role: "Junior, University of Michigan",
    tag: "Academic",
  },
  {
    quote: "My son applied to 14 internships last fall. His agent drafted every follow-up, tracked every application, and flagged a Handshake posting 6 hours before the deadline closed. He got the internship.",
    name: "Patricia H.",
    role: "Parent, Ohio State",
    tag: "Parent",
  },
  {
    quote: "I'm pre-med and writing a thesis at the same time. My agent summarizes my research PDFs, pulls citations, and keeps my bibliography clean. It would have taken me 3 hours. It takes me 10 minutes.",
    name: "James T.",
    role: "Senior, Northwestern University",
    tag: "Research",
  },
  {
    quote: "My daughter was drowning in emails from professors, advisors, and recruiters. Her agent now drafts responses for her to review. She's not stressed. I'm not getting the 11pm panic calls anymore.",
    name: "Robert M.",
    role: "Parent, University of Georgia",
    tag: "Parent",
  },
  {
    quote: "I was skeptical. I thought it was just ChatGPT with a different name. It's not. It knows my classes, my schedule, my writing style. It actually sounds like me when it drafts something.",
    name: "Sofia D.",
    role: "Sophomore, UCLA",
    tag: "Academic",
  },
  {
    quote: "The 30-day co-training period was the part I didn't expect to love. Having someone actually work with us to configure it correctly made all the difference. It's not a product you install. It's a process you build.",
    name: "Karen L.",
    role: "Parent, University of Maryland",
    tag: "Onboarding",
  },
];

const TAG_COLORS: Record<string, string> = {
  Academic: "rgba(61,139,61,.1)",
  Parent: "rgba(11,23,41,.07)",
  Research: "rgba(61,139,61,.08)",
  Onboarding: "rgba(11,23,41,.06)",
};
const TAG_TEXT: Record<string, string> = {
  Academic: "#2d6a2d",
  Parent: "rgba(11,23,41,.5)",
  Research: "#2d6a2d",
  Onboarding: "rgba(11,23,41,.45)",
};

const SCENARIOS = [
  {
    before: { headline: "Sunday night panic.", body: "What's due this week? Three tabs open. Canvas won't load. Texts flying. Nothing organized. Sleep at 1am, still uncertain." },
    after:  { headline: "Friday briefing. Done.", body: "Every Friday at 4pm, the agent sends a prioritized week-ahead — deadlines, reminders, what can wait. Sunday nights are quiet now." },
  },
  {
    before: { headline: "Missed it by two hours.", body: "The Handshake internship posting closed. No one flagged it. The deadline came and went. Another opportunity gone." },
    after:  { headline: "Applied Wednesday.", body: "Agent spotted the posting Tuesday morning, drafted the application, and reminded them to review. Submitted 48 hours before close." },
  },
  {
    before: { headline: "4 days. Unread.", body: "Email from a professor sitting in the inbox. Important. Just… ignored. The longer it waits, the worse it looks." },
    after:  { headline: "Replied in 2 minutes.", body: "Agent drafted a professional response in their voice. Student reviewed, hit send. Professor responded the same day." },
  },
  {
    before: { headline: "Can't find the paper.", body: "Forty browser tabs. Zotero half-set-up. The citation is somewhere. The deadline is tonight. The thesis is not going well." },
    after:  { headline: "Cited in 90 seconds.", body: "Agent pulled the paper, summarized it, and dropped a formatted citation. The thesis section was done before dinner." },
  },
];

export default function Explainer() {
  return (
    <>
      {/* INTRO */}
      <section id="what-it-is" style={{ background: "#fff", padding: "80px 0 60px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <span className="mono-label">What It Actually Is</span>
          <h2 className="section-title" style={{ marginBottom: 20 }}>
            Your student&apos;s first hire.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(11,23,41,.6)" }}>
            Every other AI personal agent is shared, generic, and forgets the moment the tab closes. The College Agent has a name. Knows their voice, their schedule, their goals. Tracks what&apos;s coming, drafts what needs to be sent, and gets smarter every week.
          </p>
          <p style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "rgba(11,23,41,.35)", marginTop: 20, letterSpacing: ".04em" }}>
            Live in 30 minutes to 72 hours. Running for four years.
          </p>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section id="before-after" style={{ background: "var(--cream)", padding: "0 0 80px", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 12, paddingTop: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(11,23,41,.35)", paddingLeft: 4 }}>Without</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)", paddingLeft: 4 }}>With The College Agent</div>
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SCENARIOS.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="ba-card ba-card-before">
                  <div className="ba-headline ba-headline-before">{s.before.headline}</div>
                  <p className="ba-body ba-body-before">{s.before.body}</p>
                </div>
                <div className="ba-card ba-card-after">
                  <div className="ba-headline ba-headline-after">{s.after.headline}</div>
                  <p className="ba-body ba-body-after">{s.after.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .ba-card {
            border-radius: 14px;
            padding: 28px 32px;
          }
          .ba-card-before {
            background: #fff;
            border: 1px solid rgba(11,23,41,.08);
          }
          .ba-card-after {
            background: #fff;
            border: 2px solid rgba(61,139,61,.25);
            box-shadow: 0 4px 20px rgba(61,139,61,.07);
          }
          .ba-headline {
            font-size: 22px;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 10px;
          }
          .ba-headline-before { color: rgba(11,23,41,.3); }
          .ba-headline-after  { color: var(--navy); }
          .ba-body {
            font-size: 14px;
            line-height: 1.75;
          }
          .ba-body-before { color: rgba(11,23,41,.35); }
          .ba-body-after  { color: rgba(11,23,41,.65); }
          @media (max-width: 680px) {
            .ba-card { padding: 22px 20px; }
            .ba-headline { font-size: 18px; }
          }
        `}</style>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ background: "var(--cream)", padding: "80px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="mono-label">Results</span>
            <h2 className="section-title">From students and parents who made the call.</h2>
            <p className="section-sub" style={{ maxWidth: 520, margin: "12px auto 0" }}>
              Real outcomes. Real people. Different schools, same result.
            </p>
          </div>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <span style={{
                  display: "inline-block", fontSize: 10, fontWeight: 700,
                  fontFamily: "var(--font-mono)", textTransform: "uppercase",
                  letterSpacing: ".08em", padding: "3px 10px", borderRadius: 99,
                  background: TAG_COLORS[t.tag], color: TAG_TEXT[t.tag], marginBottom: 16,
                }}>
                  {t.tag}
                </span>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(11,23,41,.75)", marginBottom: 20, }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(11,23,41,.07)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.4)", marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .testimonial-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
          }
          .testimonial-card {
            background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 14px;
            padding: 28px; display: flex; flex-direction: column;
          }
          @media (max-width: 900px) { .testimonial-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 560px) { .testimonial-grid { grid-template-columns: 1fr; } }
          .explainer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
          @media (max-width: 760px) { .explainer-grid { grid-template-columns: 1fr; gap: 40px; } }
        `}</style>
      </section>
    </>
  );
}
