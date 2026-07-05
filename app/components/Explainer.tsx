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
    before: { headline: "Deadlines get missed.", body: "Assignments are scattered across syllabi, Canvas, email, calendars, and sticky notes. Something always slips through the cracks." },
    after:  { headline: "Every week starts with a plan.", body: "Your College Agent organizes assignments, deadlines, study sessions, and priorities into one clear roadmap, so you always know what comes next." },
  },
  {
    before: { headline: "Internship opportunities disappear.", body: "Applications, recruiter emails, networking contacts, and follow-ups are spread across too many places." },
    after:  { headline: "Career opportunities stay on track.", body: "Your College Agent tracks applications, reminds you to follow up, prepares your resume, and keeps your internship search moving forward." },
  },
  {
    before: { headline: "Important emails get delayed.", body: "Writing to professors, advisors, recruiters, and classmates takes time, and often gets pushed aside." },
    after:  { headline: "Professional communication is effortless.", body: "Your College Agent drafts polished emails in your voice, ready for you to review and send with confidence." },
  },
  {
    before: { headline: "Studying becomes reactive.", body: "Notes, readings, lectures, and exam dates are scattered across different places, making last-minute cramming the default." },
    after:  { headline: "Study plans are always ready.", body: "Your College Agent creates personalized study schedules, review guides, practice questions, and reminders before every exam." },
  },
  {
    before: { headline: "You're constantly switching between apps.", body: "Canvas, Gmail, Google Calendar, Notes, Docs, to-do lists, and more. Everything lives somewhere different." },
    after:  { headline: "One place for your entire college life.", body: "Your College Agent brings everything together, classes, assignments, deadlines, communication, studying, internships, and personal plans, so you always know what's next and what matters most." },
  },
];

export default function Explainer() {
  return (
    <>
      {/* BEFORE & AFTER */}
      <section id="before-after" style={{ background: "var(--cream)", padding: "80px 0", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="mono-label">Before &amp; After</span>
            <h2 className="section-title">From overwhelmed to in control.</h2>
            <p className="section-sub" style={{ maxWidth: 640, margin: "12px auto 0" }}>
              The difference isn&apos;t another chatbot. It&apos;s a personal College Agent that understands
              your academic life, stays organized, and keeps everything moving.
            </p>
          </div>

          <div className="ba-grid">
            <div className="ba-colhead ba-colhead-neg">Without</div>
            <div className="ba-colhead ba-colhead-pos">With The College Agent</div>
            {SCENARIOS.map((s, i) => [
              <div key={`n${i}`} className="ba-cell ba-neg">
                <span className="ba-celltag ba-celltag-neg">Without</span>
                <div className="ba-headline">{s.before.headline}</div>
                <p className="ba-body">{s.before.body}</p>
              </div>,
              <div key={`p${i}`} className="ba-cell ba-pos">
                <span className="ba-celltag ba-celltag-pos">With The College Agent</span>
                <span className="ba-check" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="ba-text">
                  <div className="ba-headline">{s.after.headline}</div>
                  <p className="ba-body">{s.after.body}</p>
                </div>
              </div>,
            ])}
          </div>

          <div className="handled-done">Consider it done.</div>
        </div>
        <style>{`
          .ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: stretch; }
          .ba-colhead {
            font-family: var(--font-mono); font-size: 12px; font-weight: 700;
            text-transform: uppercase; letter-spacing: .08em; padding: 4px 4px 2px; text-align: center;
          }
          .ba-colhead-neg { color: rgba(11,23,41,.42); }
          .ba-colhead-pos { color: var(--green); }
          .ba-cell {
            background: #fff; border-radius: 14px; padding: 22px 24px;
            box-shadow: 0 10px 30px rgba(11,23,41,.05);
          }
          .ba-neg { border: 1px solid rgba(11,23,41,.1); border-left: 4px solid rgba(11,23,41,.2); }
          .ba-pos {
            border: 1px solid rgba(61,139,61,.2); border-left: 4px solid var(--green);
            display: flex; gap: 14px; align-items: flex-start;
          }
          .ba-check {
            flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%;
            background: rgba(61,139,61,.12); color: var(--green);
            display: flex; align-items: center; justify-content: center;
          }
          .ba-check svg { width: 17px; height: 17px; }
          .ba-headline {
            font-size: 17px; font-weight: 800; color: var(--navy);
            margin-bottom: 6px; letter-spacing: -.01em; line-height: 1.25;
          }
          .ba-neg .ba-headline { color: rgba(11,23,41,.6); }
          .ba-body { font-size: 14px; line-height: 1.68; color: rgba(11,23,41,.72); margin: 0; }
          .ba-neg .ba-body { color: rgba(11,23,41,.55); }
          .ba-celltag { display: none; }
          .handled-done {
            text-align: center; margin-top: 40px;
            font-size: clamp(24px, 3vw, 32px); font-weight: 800;
            color: var(--green); letter-spacing: -.02em;
          }
          @media (max-width: 680px) {
            .ba-grid { grid-template-columns: 1fr; gap: 10px; }
            .ba-colhead { display: none; }
            .ba-pos { flex-direction: column; gap: 10px; }
            .ba-neg { margin-top: 10px; }
            .ba-celltag {
              display: inline-block; font-family: var(--font-mono); font-size: 10px;
              font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px;
            }
            .ba-celltag-neg { color: rgba(11,23,41,.4); }
            .ba-celltag-pos { color: var(--green); }
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
