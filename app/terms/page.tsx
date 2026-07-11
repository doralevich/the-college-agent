import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import {
  PLAN_AMOUNT_CENTS,
  HOSTING_AMOUNT_CENTS,
  HOSTING_ANNUAL_AMOUNT_CENTS,
} from "@/lib/pricing/intro-cutoff";

// The Terms students accept at checkout (the /build info step links here and the
// checkout API refuses sessions without acceptance). Pricing renders from
// lib/pricing so these Terms can never quote a number checkout disagrees with.
// The headline policy: a full refund window of 7 calendar days from purchase.

export const metadata: Metadata = {
  title: "Terms & Conditions, The College Agent",
  description:
    "The terms that govern The College Agent: what you get, what you pay, our 7-day refund guarantee, acceptable use, and how your data stays yours.",
  alternates: { canonical: "https://thecollegeagent.ai/terms" },
};

const TERMS_UPDATED = "July 4, 2026";

function price(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
}

export default function TermsPage() {
  const plan = price(PLAN_AMOUNT_CENTS);
  const hosting = price(HOSTING_AMOUNT_CENTS);
  const hostingAnnual = price(HOSTING_ANNUAL_AMOUNT_CENTS);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 142, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>Legal</span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 8 }}>Terms &amp; Conditions</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(11,23,41,.4)", marginBottom: 48 }}>Last updated: {TERMS_UPDATED}</p>

          <Section title="1. Agreement to Terms">
            <p>These Terms &amp; Conditions (&ldquo;Terms&rdquo;) are a binding agreement between you and Apollo Claw (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;The College Agent&rdquo;) governing your use of thecollegeagent.ai and every service we provide, including your personal AI agent, our dashboard, hosting, and usage credits (together, the &ldquo;Services&rdquo;).</p>
            <p>You accept these Terms by checking the acceptance box at checkout, by completing a purchase, or by using the Services in any way. If you do not agree to these Terms, do not purchase or use the Services. Our <a href="/privacy" style={{ color: "var(--green)" }}>Privacy Policy</a> is part of these Terms.</p>
            <p>When you accept these Terms at checkout, we record the date and time of your acceptance together with your order.</p>
          </Section>

          <Section title="2. Eligibility &amp; Your Account">
            <p>You must be at least 18 years old to purchase the Services. If a parent or guardian purchases on behalf of a student, the purchaser accepts these Terms and remains responsible for the account.</p>
            <p>You agree to provide accurate, current, and complete information at checkout and in your intake, and to keep it up to date. Your account is personal to you: one agent per account, and you may not share, resell, or transfer your account or your agent without our written consent.</p>
            <p>You are responsible for keeping your sign-in access (including your email inbox, which receives magic sign-in links) secure, and for all activity under your account. Tell us promptly at <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a> if you believe your account has been compromised.</p>
          </Section>

          <Section title="3. The Services">
            <p>The College Agent builds, configures, deploys, and hosts a personal AI agent for you, personalized from the intake you complete after purchase. The Services include:</p>
            <ul>
              <li>A one-time agent build: your own named agent, configured from your intake, typically live within 30 minutes of a completed intake</li>
              <li>Monthly cloud hosting that keeps your agent running 24/7, reachable from your dashboard and on Telegram</li>
              <li>$20 of included AI usage credits to start, with the option to add more</li>
              <li>Access to integrations with third-party tools you choose to connect</li>
            </ul>
            <p>Timelines such as &ldquo;live within 30 minutes&rdquo; are targets, not guarantees; the clock starts when your completed intake is received.</p>
          </Section>

          <Section title="4. Pricing &amp; Payment">
            <p>Current pricing, in USD:</p>
            <ul>
              <li><strong>Platform fee (one-time):</strong> {plan}. The price shown at checkout is the price you pay; any discount or promotion code applied at checkout is reflected there.</li>
              <li><strong>Cloud hosting:</strong> your choice of {hosting} per month or {hostingAnnual} per year (the annual price equals ten monthly payments), billed in advance on a recurring subscription that starts at purchase.</li>
              <li><strong>AI usage credits:</strong> $20 included with your purchase; optional top-ups available from your dashboard.</li>
            </ul>
            <p>Payments are processed by Stripe. We never see or store your card number. By purchasing, you authorize us (through Stripe) to charge the one-time platform fee and the recurring hosting fee on the billing interval you chose until you cancel. Prices do not include any applicable taxes, which are your responsibility where required by law.</p>
            <p>We may change hosting pricing with at least 30 days&apos; advance notice to you by email; changes apply from your next billing cycle after the notice period. Promotional pricing, referral rewards, and credits have no cash value and are not transferable.</p>
          </Section>

          <Section title="5. 7-Day Refund Guarantee">
            <p><strong>If The College Agent is not for you, tell us within 7 days and we will refund you.</strong> Here is exactly how it works:</p>
            <ul>
              <li><strong>Window:</strong> You may request a full refund of your one-time platform fee and your first hosting payment (monthly or annual) within 7 calendar days of your purchase (the date of your Stripe payment). A request made at any time up to 11:59 PM Eastern Time on the 7th day is within the window.</li>
              <li><strong>How to request:</strong> Email <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a> from the email address on your account with the subject &ldquo;Refund request.&rdquo; No forms, no phone calls, no questions required.</li>
              <li><strong>What you get back:</strong> 100% of the platform fee and your first hosting payment, returned to your original payment method through Stripe, normally within 5 to 10 business days of our confirmation.</li>
              <li><strong>What happens next:</strong> On refund, your agent is decommissioned and your account is closed. Download anything you want to keep from your dashboard before or promptly after requesting the refund; we will honor download requests for at least 14 days after the refund is issued.</li>
              <li><strong>Credits:</strong> The $20 of included AI usage credits are part of the refunded purchase and are forfeited. Separately purchased credit top-ups are refunded to the extent unused.</li>
            </ul>
            <p><strong>After the 7-day window closes, the one-time agent build fee is final and non-refundable.</strong> Your agent is custom-built and provisioned specifically for you, which is why the window exists and why it ends.</p>
            <p>Hosting after the first month: you may cancel at any time (Section 6), which stops future charges. Hosting fees already billed for the current period are non-refundable, and your agent stays live through the end of the period you paid for.</p>
            <p>This guarantee applies once per person. We may decline refunds where we detect abuse, such as repeat purchase-and-refund cycles or fraudulent payment activity. Nothing in this section limits any non-waivable rights you have under applicable consumer protection law.</p>
          </Section>

          <Section title="6. Hosting, Cancellation &amp; Pausing">
            <p>Hosting renews monthly until canceled. You can cancel from your dashboard or by emailing us; cancellation takes effect at the end of the current billing period, and no further charges are made. You can also pause hosting (for example, over the summer) and resume later; while paused, your agent is offline and you are not billed for hosting.</p>
            <p>If a hosting payment fails, we will retry and notify you. If payment continues to fail, we may suspend your agent until payment is brought current. If hosting remains unpaid or canceled for more than 90 days, we may permanently delete the agent and its data after giving you at least 14 days&apos; notice and a chance to download your files.</p>
          </Section>

          <Section title="7. AI Usage Credits">
            <p>Your agent&apos;s AI usage draws from your credit balance. Your purchase includes $20 of credits; you can add more from the Credits tab, set low-balance alerts, or enable auto-recharge. If you enable auto-recharge, you authorize the recharge amount you configured each time your balance falls below your threshold, until you turn it off.</p>
            <p>Credits are consumed as your agent works and are not redeemable for cash. Unused separately purchased credits are refundable on account closure; included or promotional credits are not. Advanced users may connect their own AI provider API key instead, in which case that provider bills you directly under its own terms.</p>
          </Section>

          <Section title="8. Acceptable Use &amp; Academic Integrity">
            <p>Your agent is yours, but it runs on our platform. You agree not to use the Services to:</p>
            <ul>
              <li>Violate any law, regulation, or the rights of any person</li>
              <li>Cheat: submitting agent-generated work as your own in violation of your school&apos;s academic integrity policies, honor code, or an instructor&apos;s rules is prohibited. Your agent is a study partner, planner, and assistant, not a ghostwriter for graded work</li>
              <li>Harass, threaten, defame, or deceive others, or impersonate any person or institution</li>
              <li>Generate malware, spam, phishing, or other harmful or abusive content</li>
              <li>Probe, disrupt, overload, or attempt to gain unauthorized access to our platform, other users&apos; agents, or any third-party system</li>
              <li>Scrape, copy, resell, or white-label the Services, or use them to build a competing product</li>
            </ul>
            <p>You are responsible for how you use your agent and its outputs, including compliance with your school&apos;s policies. We may suspend or terminate accounts engaged in prohibited use (Section 15). We are not responsible for academic consequences arising from your use of the Services in violation of your school&apos;s rules.</p>
          </Section>

          <Section title="9. Your Content &amp; Data Ownership">
            <p><strong>Your files are your files.</strong> Everything you provide to your agent and everything it keeps for you (class notes, syllabi, schedules, documents, and plans) belongs to you. We claim no ownership of your content.</p>
            <p>You can download all of your files from your dashboard at any time, for any reason. You can delete your account at any time; download your files first, and see Section 5 for how downloads are handled around refunds. Account deletion is described further in our <a href="/privacy" style={{ color: "var(--green)" }}>Privacy Policy</a>.</p>
            <p>You grant us a limited, non-exclusive license to host, process, and transmit your content solely to operate the Services for you: building your agent, running it, storing your files, and connecting the integrations you choose. That license ends when your content is deleted from the Services.</p>
            <p>You are responsible for having the rights to the content you provide (for example, materials your school restricts from redistribution remain subject to your school&apos;s rules).</p>
          </Section>

          <Section title="10. Our Intellectual Property">
            <p>We and our licensors retain all rights to the Services, including our software, agent-building technology, platform infrastructure, site content, and branding. Purchasing an agent buys you the build and the right to use the Services under these Terms; it does not transfer any ownership of our technology.</p>
          </Section>

          <Section title="11. Third-Party Services">
            <p>Your agent can connect to third-party services you choose (Canvas, Google, Microsoft, Telegram, Notion, and others). Your use of those services is governed by their own terms and privacy policies, and you authorize your agent to access them on your behalf when you connect them. We are not responsible for the availability, accuracy, or conduct of third-party services, and an integration breaking because a third party changed its service is not a defect in ours.</p>
            <p>AI responses are generated through AI providers such as Anthropic. If you bring your own API key, your relationship with that provider is direct and its fees are yours.</p>
          </Section>

          <Section title="12. AI Outputs: Know the Limits">
            <p>AI agents can be wrong. Outputs may be inaccurate, incomplete, or outdated, and may occasionally state things confidently that are false. You are responsible for reviewing and verifying outputs before relying on them, especially for anything important: deadlines, financial decisions, travel bookings, applications, health, or legal matters.</p>
            <p>Your agent is not a licensed professional and its outputs are not professional, legal, medical, or financial advice.</p>
          </Section>

          <Section title="13. Disclaimer of Warranties">
            <p>Except as expressly stated in these Terms (including the refund guarantee in Section 5), the Services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Services will be uninterrupted, error-free, or completely secure.</p>
          </Section>

          <Section title="14. Limitation of Liability">
            <p>To the maximum extent permitted by law: (a) neither Apollo Claw nor The College Agent will be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, or academic or professional consequences, even if advised of the possibility; and (b) our total aggregate liability for all claims arising out of or relating to the Services or these Terms will not exceed the greater of $100 or the amounts you paid us in the 12 months before the event giving rise to the claim.</p>
            <p>Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you. In those jurisdictions, our liability is limited to the smallest amount permitted by law.</p>
          </Section>

          <Section title="15. Indemnification">
            <p>You agree to defend and hold harmless Apollo Claw, The College Agent, and our officers, employees, and agents from claims, damages, and reasonable legal fees arising from your content, your violation of these Terms, or your misuse of the Services, except to the extent caused by our own breach of these Terms.</p>
          </Section>

          <Section title="16. Suspension &amp; Termination">
            <p>You may stop using the Services and cancel at any time (Sections 5 and 6). We may suspend or terminate your access if you materially breach these Terms (including Section 8), if required by law, or if your use creates risk or harm to us, other users, or third parties. Where practical, we will notify you and give you an opportunity to cure before termination, and we will give you a reasonable opportunity to download your files unless legally prevented.</p>
            <p>If we terminate the Services entirely (not for your breach) within your first year, we will refund a pro-rated portion of any prepaid, unused hosting.</p>
            <p>Sections that by their nature should survive termination (including 9, 10, 13, 14, 15, and 17) survive.</p>
          </Section>

          <Section title="17. Dispute Resolution, Governing Law &amp; Arbitration">
            <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules. Before filing any claim, you agree to contact us at <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a> and give us 30 days to work it out informally; most issues are solved this way.</p>
            <p>Any dispute not resolved informally will be settled by binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, on an individual basis. <strong>You and we each waive the right to a jury trial and to participate in a class action.</strong> Either party may instead bring an individual claim in small-claims court, and either party may seek injunctive relief in court for intellectual-property misuse.</p>
            <p>You may opt out of this arbitration provision by emailing us within 30 days of first accepting these Terms with the subject &ldquo;Arbitration opt-out.&rdquo;</p>
          </Section>

          <Section title="18. Changes to These Terms">
            <p>We may update these Terms from time to time. For material changes, we will notify you by email or a prominent notice on the site at least 14 days before they take effect. Changes will not reduce the refund rights attached to a purchase you already made. Continued use of the Services after changes take effect constitutes acceptance; if you do not agree, cancel before the effective date.</p>
          </Section>

          <Section title="19. Contact Us">
            <p>Questions about these Terms? We answer fast:</p>
            <ul>
              <li>Email: <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a></li>
              <li>Website: <a href="https://apolloclaw.ai" style={{ color: "var(--green)" }}>apolloclaw.ai</a></li>
            </ul>
          </Section>
        </div>
      </main>

      <Footer />
      <style>{`
        main p { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 14px; }
        main ul { padding-left: 20px; margin-bottom: 14px; }
        main li { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 6px; }
        main a { text-decoration: underline; }
        main strong { color: var(--navy); }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(11,23,41,.08)" }}>{title}</h2>
      {children}
    </div>
  );
}
