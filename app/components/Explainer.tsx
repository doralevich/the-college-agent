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
    quote: "Setup was the part I didn't expect to love. My daughter filled out the intake on a Sunday morning, named it, gave it a face, and it was building her study plan by lunch. It's not a product you install. It's a teammate you meet.",
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
      {/* WHAT GETS HANDLED */}
      <section id="before-after" style={{ background: "var(--cream)", padding: "80px 0", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mono-label">The Difference</span>
            <h2 className="section-title">From scattered to handled.</h2>
            <p className="section-sub" style={{ maxWidth: 620, margin: "12px auto 0" }}>
              A personalized agent that knows the student&apos;s real college life and keeps the work
              moving. The hard parts of the week just get done.
            </p>
          </div>

          <div className="handled-grid">
            {SCENARIOS.map((s, i) => (
              <div key={i} className="handled-card">
                <span className="handled-check" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="handled-text">
                  <div className="handled-headline">{s.after.headline}</div>
                  <p className="handled-body">{s.after.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="handled-done">Consider it done.</div>
        </div>
        <style>{`
          .handled-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
          .handled-card {
            background: #fff; border: 1px solid rgba(61,139,61,.2);
            border-left: 4px solid var(--green); border-radius: 14px;
            padding: 24px 26px; display: flex; gap: 16px; align-items: flex-start;
            box-shadow: 0 10px 30px rgba(11,23,41,.05);
          }
          .handled-check {
            flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%;
            background: rgba(61,139,61,.12); color: var(--green);
            display: flex; align-items: center; justify-content: center;
          }
          .handled-check svg { width: 18px; height: 18px; }
          .handled-headline {
            font-size: 18px; font-weight: 800; color: var(--navy);
            margin-bottom: 6px; letter-spacing: -.01em; line-height: 1.25;
          }
          .handled-body { font-size: 14px; line-height: 1.7; color: rgba(11,23,41,.72); margin: 0; }
          .handled-done {
            text-align: center; margin-top: 40px;
            font-size: clamp(24px, 3vw, 32px); font-weight: 800;
            color: var(--green); letter-spacing: -.02em;
          }
          @media (max-width: 680px) {
            .handled-grid { grid-template-columns: 1fr; }
            .handled-card { padding: 20px 22px; }
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
