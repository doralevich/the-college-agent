/* eslint-disable @next/next/no-img-element */
import { composioLogoUrl } from "@/lib/integration-catalog";

// A reusable "show, don't tell" chat mockup: copy on one side, a phone-style agent
// conversation on the other. Used across the marketing pages (student first-semester
// and finals, athletics, administration) so every chat looks like one product. Server
// component — the messages are static illustration (aria-hidden), no interactivity.

export type ChatMessage = { from: "me" | "bot"; text: string };

export function AgentChatDemo({
  label,
  heading,
  body,
  tools,
  messages,
  guy = "/avatars/guy-03.webp",
  agentName = "Your College Agent",
  reverse = false,
  background = "#fff",
}: {
  label: string;
  heading: string;
  body: string;
  tools?: { slug: string; label: string }[];
  messages: ChatMessage[];
  guy?: string;
  agentName?: string;
  reverse?: boolean;
  background?: string;
}) {
  return (
    <section style={{ background, padding: "72px 0" }}>
      <div className={`ac-row${reverse ? " ac-row--rev" : ""}`} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div className="ac-copy">
          <span className="ac-label">{label}</span>
          <h2 className="ac-heading">{heading}</h2>
          <p className="ac-body">{body}</p>
          {tools && tools.length > 0 && (
            <>
              <div className="ac-tools-label">Connected to your tools</div>
              <div className="ac-tools">
                {tools.map((t) => (
                  <span key={t.slug} className="ac-tool">
                    <img src={composioLogoUrl(t.slug)} alt="" loading="lazy" aria-hidden />
                    {t.label}
                  </span>
                ))}
                <span className="ac-tool ac-tool--more">+ 250 more</span>
              </div>
            </>
          )}
        </div>

        <div className="ac-chat" aria-hidden>
          <div className="ac-chat-head">
            <img src={guy} alt="" />
            <div>
              <strong>{agentName}</strong>
              <span><i className="ac-dot" /> Online 24/7</span>
            </div>
          </div>
          <div className="ac-chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`ac-msg ${m.from}`}>{m.text}</div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ac-row { display: flex; align-items: center; gap: 48px; }
        .ac-row--rev { flex-direction: row-reverse; }
        .ac-copy { flex: 1 1 460px; min-width: 0; }
        .ac-label { font-family: var(--font-mono); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--green); display: block; margin-bottom: 14px; }
        .ac-heading { font-size: clamp(24px, 3vw, 36px); font-weight: 800; color: var(--navy); margin: 0 0 18px; letter-spacing: -.025em; }
        .ac-body { font-size: 16px; line-height: 1.8; color: rgba(11,23,41,.7); margin: 0 0 24px; }
        .ac-tools-label { font-family: var(--font-mono); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: rgba(11,23,41,.45); margin-bottom: 12px; }
        .ac-tools { display: flex; flex-wrap: wrap; gap: 10px; }
        .ac-tool { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid rgba(11,23,41,.12); border-radius: 999px; padding: 7px 14px 7px 9px; font-size: 12.5px; font-weight: 600; color: var(--navy); box-shadow: 0 3px 10px rgba(11,23,41,.06); }
        .ac-tool img { width: 20px; height: 20px; object-fit: contain; }
        .ac-tool--more { padding: 7px 14px; color: var(--green); border: 1.5px dashed rgba(61,139,61,.5); background: rgba(61,139,61,.05); box-shadow: none; }
        .ac-chat { flex: 0 1 440px; min-width: 0; background: var(--cream2); border: 1px solid rgba(11,23,41,.08); border-radius: 22px; box-shadow: 0 24px 60px rgba(11,23,41,.13); overflow: hidden; }
        .ac-chat-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--navy); color: #fff; }
        .ac-chat-head img { width: 40px; height: 40px; object-fit: contain; background: #fff; border-radius: 50%; padding: 3px; }
        .ac-chat-head strong { display: block; font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
        .ac-chat-head span { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.65); }
        .ac-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; }
        .ac-chat-body { display: flex; flex-direction: column; gap: 10px; padding: 20px 18px 22px; }
        .ac-msg { max-width: 86%; padding: 11px 15px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; }
        .ac-msg.me { align-self: flex-end; background: var(--green); color: #fff; border-bottom-right-radius: 4px; }
        .ac-msg.bot { align-self: flex-start; background: #fff; color: var(--navy); border: 1px solid rgba(11,23,41,.08); border-bottom-left-radius: 4px; }
        @media (max-width: 920px) {
          .ac-row, .ac-row--rev { flex-direction: column; align-items: stretch; gap: 36px; }
          .ac-chat { flex: 1 1 auto; }
        }
      `}</style>
    </section>
  );
}
