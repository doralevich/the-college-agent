// The "chatbot vs The College Agent" comparison (copy by Jill), shared by the What Is an
// Agent page and the homepage so they never drift. Two columns, paired line for line;
// stacks with labels on mobile.

const COMPARISON: { chatbot: string; agent: string }[] = [
  { chatbot: "Responds to prompts", agent: "Works proactively on your behalf" },
  { chatbot: "Starts with a blank conversation", agent: "Knows your classes, schedule, deadlines, and goals" },
  { chatbot: "Answers one question at a time", agent: "Manages ongoing tasks across your semester" },
  { chatbot: "Requires you to provide context repeatedly", agent: "Remembers and uses your personalized information" },
  { chatbot: "Generates content", agent: "Organizes, plans, tracks, and takes action" },
  { chatbot: "General-purpose AI", agent: "Built specifically for college students" },
  { chatbot: "Waits for instructions", agent: "Anticipates needs and keeps you on track" },
  { chatbot: "One conversation", agent: "A continuous academic workflow" },
];

export function ChatbotComparison({ background = "#fff" }: { background?: string }) {
  return (
    <section style={{ background, padding: "72px 0" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>
            Side by Side
          </span>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: 0, lineHeight: 1.18 }}>
            Chatbots answer questions.<br />AI agents help you accomplish goals.
          </h2>
        </div>
        <div className="cmp">
          <div className="cmp-head">
            <div className="cmp-col cmp-col--bot">ChatBots</div>
            <div className="cmp-col cmp-col--agent">The College Agent</div>
          </div>
          {COMPARISON.map(({ chatbot, agent }) => (
            <div key={chatbot} className="cmp-row">
              <div className="cmp-cell cmp-cell--bot">{chatbot}</div>
              <div className="cmp-cell cmp-cell--agent">{agent}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .cmp { border: 1px solid rgba(11,23,41,.1); border-radius: 16px; overflow: hidden; }
        .cmp-head, .cmp-row { display: grid; grid-template-columns: 1fr 1fr; }
        .cmp-head { background: var(--navy); }
        .cmp-col { padding: 16px 18px; font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -.01em; }
        .cmp-col--agent { background: var(--green); }
        .cmp-row { border-top: 1px solid rgba(11,23,41,.08); }
        .cmp-row:nth-child(even) { background: rgba(11,23,41,.015); }
        .cmp-cell { padding: 16px 18px; font-size: 13.5px; line-height: 1.55; }
        .cmp-cell--bot { color: rgba(11,23,41,.6); border-left: 1px solid rgba(11,23,41,.06); }
        .cmp-cell--agent { color: var(--navy); font-weight: 500; background: rgba(61,139,61,.06); border-left: 1px solid rgba(61,139,61,.15); }
        @media (max-width: 720px) {
          .cmp-head { display: none; }
          .cmp-row { grid-template-columns: 1fr; }
          .cmp-cell--bot::before { content: "ChatBots: "; font-weight: 700; color: rgba(11,23,41,.4); }
          .cmp-cell--agent::before { content: "The College Agent: "; font-weight: 700; color: var(--green); }
          .cmp-cell { border-left: none; }
        }
      `}</style>
    </section>
  );
}
