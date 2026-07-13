// "Your 24/7 AI Academic Assistant" — the at-a-glance capability list (copy by Jill).
// Reusable so it can sit on the For Students page and/or the homepage.

const ITEMS = [
  "Assignment & Deadline Tracking",
  "Study Schedules & Time Management",
  "Lecture Note Summaries",
  "Flashcards & Practice Quizzes",
  "Essay Writing & Editing",
  "Research & Citation Support",
  "Email & Presentation Assistance",
  "Exam Preparation",
  "Resume & Internship Help",
  "Organization & Productivity Coaching",
];

export function AcademicAssistant({ background = "#fff" }: { background?: string }) {
  return (
    <section style={{ background, padding: "72px 0" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: "0 0 12px", lineHeight: 1.12 }}>
          Your 24/7 AI Academic Assistant.
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(11,23,41,.7)", margin: "0 0 34px" }}>
          Study smarter. Stay organized. Reduce stress. Improve results.
        </p>
        <ul className="aa-grid">
          {ITEMS.map((item) => (
            <li key={item} className="aa-item">
              <svg className="aa-check" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 36 }}>
          <a href="/build" className="aa-btn">Build My Agent</a>
        </div>
      </div>

      <style>{`
        .aa-grid {
          list-style: none; margin: 0 auto; padding: 0; max-width: 720px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; text-align: left;
        }
        .aa-item {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 15.5px; font-weight: 600; color: var(--navy); line-height: 1.4;
        }
        .aa-check {
          flex-shrink: 0; margin-top: 1px; color: var(--green);
        }
        .aa-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 32px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; text-decoration: none;
        }
        .aa-btn:hover { filter: brightness(1.1); }
        @media (max-width: 620px) { .aa-grid { grid-template-columns: 1fr; gap: 12px; } }
      `}</style>
    </section>
  );
}
