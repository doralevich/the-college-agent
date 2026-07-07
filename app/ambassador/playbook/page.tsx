import { redirect } from "next/navigation";
import Nav from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { getSession } from "@/lib/auth";
import { ambassadorByEmail } from "@/lib/ambassador";

export const dynamic = "force-dynamic";

// The gated ambassador playbook (PRD asset library): pitch, objections, tabling,
// posting without being cringe, first-week checklist, and the FTC disclosure rule.
export default async function PlaybookPage() {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/ambassador/playbook");
  const amb = await ambassadorByEmail(user.email ?? "");
  if (!amb) redirect("/ambassador/apply");

  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: "The 60-second pitch",
      body: (
        <p>
          &ldquo;You know how you have five apps, three syllabi, and a group chat trying to run
          your life? This is one AI agent that actually knows YOUR classes, YOUR deadlines, and
          YOUR schedule. You hand it a syllabus and every quiz and paper lands on your calendar
          with reminders. It quizzes you before tests, drafts emails to professors that sound
          like you, plans your weeks, even finds flights home. It is live 30 minutes after you
          sign up, and my code takes $50 off. There is a 7-day money-back guarantee, so the risk
          is basically zero. Scan my QR and try the free demo first.&rdquo;
        </p>
      ),
    },
    {
      title: "Top 5 objections, answered",
      body: (
        <ul>
          <li><strong>&ldquo;I already use ChatGPT.&rdquo;</strong> ChatGPT forgets you the second you close the tab. This is YOUR agent: it keeps your schedule, remembers your classes all four years, and connects to Canvas, Gmail, and your calendar to actually do things.</li>
          <li><strong>&ldquo;It&apos;s expensive.&rdquo;</strong> With my code it is $549 once plus $25 a month. That is less than one tutoring hour per month, and it works every single day. And if it is not for you, there is a full refund window for 7 days.</li>
          <li><strong>&ldquo;Is this cheating?&rdquo;</strong> No. It is a planner, study partner, and assistant, not a ghostwriter. It quizzes you, organizes you, and drafts communication. The terms literally prohibit submitting its work as your own.</li>
          <li><strong>&ldquo;I don&apos;t have time to set it up.&rdquo;</strong> The intake is five minutes and it is live in 30. You will save that time back the first week.</li>
          <li><strong>&ldquo;Is my data safe?&rdquo;</strong> Your files are your files. You can download everything any time and delete your account whenever you want. Payments run through Stripe.</li>
        </ul>
      ),
    },
    {
      title: "How to run a table event",
      body: (
        <ul>
          <li>Print your QR flyer (Dashboard &rarr; Print flyer) and tape it to the table plus a laptop showing thecollegeagent.ai/demo.</li>
          <li>Hook line: &ldquo;Want an AI that knows your actual schedule? Try it free right now, 30 seconds.&rdquo;</li>
          <li>Let THEM drive the demo. Ask what class is stressing them out and have them ask the demo agent about it.</li>
          <li>Close with the code: &ldquo;If you grab it today my code takes $50 off, and there is a 7-day refund window.&rdquo;</li>
          <li>Best hours: lunch rush and the hour before evening classes. Best weeks: syllabus week and the two weeks before midterms.</li>
        </ul>
      ),
    },
    {
      title: "How to post without being cringe",
      body: (
        <ul>
          <li>Show, don&apos;t sell: screen-record the demo planning YOUR real week, quizzing you on a real chapter, or drafting a real professor email.</li>
          <li>Story beats grid post. A 20-second &ldquo;watch it build my study plan&rdquo; story with your link sticker outperforms any static ad.</li>
          <li>Talk about the problem first (five apps, forgotten deadlines, 2 AM panic), then the fix.</li>
          <li>One post a week beats seven in a day. Consistency looks real; bursts look like ads.</li>
          <li><strong>Always disclose:</strong> put <strong>#ad</strong> or &ldquo;I earn a commission&rdquo; on every post about The College Agent. It is an FTC requirement and part of your ambassador terms. Disclosure does not hurt conversion; getting flagged does.</li>
        </ul>
      ),
    },
    {
      title: "Your first week as an ambassador",
      body: (
        <ul>
          <li>Day 1: Set your payout method on the dashboard. Try the demo yourself so you can talk about it honestly.</li>
          <li>Day 2: Send your link personally to five friends who are drowning this semester. Personal DMs convert better than anything public.</li>
          <li>Day 3: Post your first story with a real demo clip and your link.</li>
          <li>Day 4: Print two flyers. Dorm board and the busiest coffee shop that allows them.</li>
          <li>Day 5: Ask your club or team group chat if you can share it once. One message, no spam.</li>
          <li>Weekend: Check your dashboard. Sales clear 7 days after purchase; your first payout lands on the next bi-weekly Friday run after that.</li>
        </ul>
      ),
    },
    {
      title: "How the money works",
      body: (
        <ul>
          <li>$75 for each of your first 10 cleared sales, $100 for every sale after that, for life.</li>
          <li>A sale clears 7 days after purchase (the refund window). Refunds inside the window simply don&apos;t count; refunds after clearing come out of future earnings.</li>
          <li>Payouts run every other Friday to PayPal or Venmo. Before your first payout we need a W-9 on file (a one-time tax form; we&apos;ll walk you through it).</li>
          <li>Promoting for a club, team, chapter, or charity? Ask us about org codes: part (or all) of your bounty can go to the group as a fundraiser.</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>
            Ambassador Playbook
          </span>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "var(--navy)", margin: "8px 0 10px" }}>
            Everything that actually works.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.65)", marginBottom: 36 }}>
            Short, field-tested, no fluff. Your code and printable QR flyer live on your{" "}
            <a href="/ambassador/dashboard" style={{ color: "var(--green)", textDecoration: "underline" }}>dashboard</a>.
          </p>

          {sections.map((s) => (
            <div key={s.title} style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "26px 28px", marginBottom: 18 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>{s.title}</h2>
              <div className="pb-body">{s.body}</div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <style>{`
        .pb-body p, .pb-body li { font-size: 14.5px; line-height: 1.75; color: rgba(11,23,41,.72); }
        .pb-body ul { padding-left: 20px; margin: 0; }
        .pb-body li { margin-bottom: 10px; }
        .pb-body strong { color: var(--navy); }
      `}</style>
    </>
  );
}
