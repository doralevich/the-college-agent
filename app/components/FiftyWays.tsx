// "50 Ways The College Agent Helps Students" — a comprehensive, SEO-rich capability
// grid. Two labeled groups (academics; career + life) of 25 short items each.

const GROUPS: { title: string; items: string[] }[] = [
  {
    title: "School & Studying",
    items: [
      "Assignment tracking",
      "Deadline reminders",
      "Study schedules",
      "Time management",
      "Course planning",
      "Note organization",
      "Lecture summaries",
      "Study guides",
      "Flashcards",
      "Practice quizzes",
      "Exam prep",
      "Essay brainstorming",
      "Essay outlining",
      "Writing improvement",
      "Grammar editing",
      "Citation formatting",
      "Research organization",
      "Source summaries",
      "Reading summaries",
      "Discussion questions",
      "Presentation creation",
      "Slide outlines",
      "Group project planning",
      "Professional emails",
      "Professor communication",
    ],
  },
  {
    title: "Career & Life",
    items: [
      "Calendar management",
      "To-do lists",
      "Goal tracking",
      "Productivity coaching",
      "Concept explanations",
      "Math tutoring",
      "Science tutoring",
      "Business homework help",
      "Coding support",
      "Language practice",
      "Career planning",
      "Resume reviews",
      "Cover letters",
      "LinkedIn optimization",
      "Interview preparation",
      "Internship planning",
      "Networking messages",
      "Event planning",
      "Meeting notes",
      "Project management",
      "Habit building",
      "Stress reduction",
      "Decision support",
      "Daily planning",
      "Academic success coaching",
    ],
  },
];

export function FiftyWays({ background = "var(--cream2)" }: { background?: string }) {
  return (
    <section style={{ background, padding: "72px 0 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>
            Everything It Does
          </span>
          <h2 style={{ fontSize: "clamp(26px, 3.2vw, 40px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: 0, lineHeight: 1.12 }}>
            50 Ways The College Agent Helps Students
          </h2>
        </div>

        <div className="fw-cols">
          {GROUPS.map((group) => (
            <div key={group.title} className="fw-group">
              <div className="fw-group-title">{group.title}</div>
              <ul className="fw-list">
                {group.items.map((item) => (
                  <li key={item} className="fw-item">
                    <svg className="fw-check" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 44 }}>
          <a href="/build" className="fw-btn">Build My Agent</a>
        </div>
      </div>

      <style>{`
        .fw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .fw-group-title {
          font-size: 15px; font-weight: 800; color: var(--navy); letter-spacing: -.01em;
          padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid rgba(61,139,61,.25);
        }
        .fw-list {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;
        }
        .fw-item {
          display: flex; align-items: flex-start; gap: 9px;
          font-size: 14px; font-weight: 500; color: rgba(11,23,41,.78); line-height: 1.35;
        }
        .fw-check { flex-shrink: 0; margin-top: 1px; color: var(--green); }
        .fw-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 32px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; text-decoration: none;
        }
        .fw-btn:hover { filter: brightness(1.1); }
        @media (max-width: 800px) {
          .fw-cols { grid-template-columns: 1fr; gap: 32px; }
        }
        @media (max-width: 420px) {
          .fw-list { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
