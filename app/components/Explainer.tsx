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
    before: { headline: "Deadlines get missed.", body: "Assignments live in Canvas, syllabi, email, and memory. By Sunday night, the week is already behind." },
    after:  { headline: "The week is already mapped.", body: "The agent sends a prioritized briefing with deadlines, study blocks, prep work, and what needs attention first." },
  },
  {
    before: { headline: "Internship windows close fast.", body: "Handshake posts, alumni leads, recruiter notes, and application deadlines scatter across too many places." },
    after:  { headline: "Applications move on time.", body: "The agent tracks target roles, drafts outreach, flags deadlines, and keeps follow-up moving before opportunities disappear." },
  },
  {
    before: { headline: "Important emails sit too long.", body: "Professors, advisors, recruiters, and group projects all need responses. The longer it waits, the worse it looks." },
    after:  { headline: "Replies sound polished and on time.", body: "The agent drafts clear responses in the student's voice so they can review, send, and move on." },
  },
  {
    before: { headline: "Studying starts from scratch.", body: "Notes, textbooks, slides, and test dates are disconnected. Review becomes last-minute and inefficient." },
    after:  { headline: "Study guides are ready when needed.", body: "The agent turns class materials into guides, review plans, practice questions, and prep checklists built around the next exam." },
  },
];

export default function Explainer() {
  return (
    <>
      {/* BEFORE / AFTER */}
      <section id="before-after" style={{ background: "var(--cream)", padding: "80px 0", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="mono-label">Before & After</span>
            <h2 className="section-title">From scattered to handled.</h2>
            <p className="section-sub" style={{ maxWidth: 620, margin: "12px auto 0" }}>
              The difference is not another chatbot. It is a personalized agent that knows the student's real college life and keeps the work moving.
            </p>
          </div>
          {/* Column headers — hidden on mobile where the layout stacks. */}
          <div className="ba-headers">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(11,23,41,.38)", paddingLeft: 4 }}>Without</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)", paddingLeft: 4 }}>With The College Agent</div>
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SCENARIOS.map((s, i) => (
              <div key={i} className="ba-row">
                <div className="ba-card ba-card-before">
                  <span className="ba-tag ba-tag-before">Without</span>
                  <div className="ba-headline ba-headline-before">{s.before.headline}</div>
                  <p className="ba-body ba-body-before">{s.before.body}</p>
                </div>
                <div className="ba-card ba-card-after">
                  <span className="ba-tag ba-tag-after">With The College Agent</span>
                  <div className="ba-headline ba-headline-after">{s.after.headline}</div>
                  <p className="ba-body ba-body-after">{s.after.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .ba-headers {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 12px;
            padding-top: 16px;
          }
          .ba-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          /* Per-card tag — only shown on mobile, where the paired header row is hidden. */
          .ba-tag {
            display: none;
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .ba-tag-before { color: rgba(11,23,41,.4); }
          .ba-tag-after { color: var(--green); }
          .ba-card { border-radius: 16px; padding: 30px 32px; }
          .ba-card-before {
            background: rgba(255,255,255,.62);
            border: 1px solid rgba(11,23,41,.1);
          }
          .ba-card-after {
            background: #fff;
            border: 2px solid rgba(61,139,61,.35);
            box-shadow: 0 12px 34px rgba(61,139,61,.1);
          }
          .ba-headline {
            font-size: 23px;
            font-weight: 800;
            line-height: 1.25;
            margin-bottom: 10px;
          }
          .ba-headline-before { color: rgba(11,23,41,.48); }
          .ba-headline-after  { color: var(--navy); }
          .ba-body {
            font-size: 14px;
            line-height: 1.75;
          }
          .ba-body-before { color: rgba(11,23,41,.5); }
          .ba-body-after  { color: rgba(11,23,41,.72); }
          @media (max-width: 680px) {
            .ba-card { padding: 22px 20px; }
            .ba-headline { font-size: 18px; }
            /* Stack to a single column; hide the paired header, show per-card tags. */
            .ba-headers { display: none; }
            .ba-row { grid-template-columns: 1fr; gap: 12px; }
            .ba-tag { display: inline-block; }
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
