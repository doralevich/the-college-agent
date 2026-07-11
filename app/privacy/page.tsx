import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy, The College Agent",
  description:
    "How The College Agent collects, uses, and protects your personal information. Read our full privacy policy.",
  alternates: { canonical: "https://thecollegeagent.ai/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 142, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>Legal</span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(11,23,41,.4)", marginBottom: 48 }}>Last updated: July 3, 2026</p>

          <Section title="1. Introduction">
            <p>The College Agent (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is operated by Apollo[Claw] and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at thecollegeagent.ai and our AI agent services.</p>
            <p>By using our services, you agree to the collection and use of information in accordance with this policy.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul>
              <li><strong>Identity &amp; Contact Information:</strong> First name, last name, school email address, personal email address, mobile number, school name, and year of study.</li>
              <li><strong>Onboarding Information:</strong> Academic details, schedule, goals, communication style, interests, career aspirations, and any other information you provide through our onboarding forms.</li>
              <li><strong>Technical Credentials:</strong> API keys and bot tokens you provide to configure your agent. These are used solely for deployment and are never shared.</li>
              <li><strong>Configuration Data:</strong> Your agent&apos;s name and avatar, your intake answers, your plan and hosting status, and the integrations you connect.</li>
              <li><strong>Usage Data:</strong> How you interact with our website, including pages visited, time spent, and actions taken.</li>
              <li><strong>Uploaded Files:</strong> Any documents (such as resumes, syllabi, or class notes) you submit through our forms or share with your agent.</li>
              <li><strong>Payment Information:</strong> Payments are processed by Stripe. We receive your name, email, and transaction details; we never see or store your full card number.</li>
              <li><strong>Agent Conversations:</strong> Messages you exchange with your agent and files you share with it, used to provide the service.</li>
              <li><strong>Referrals &amp; Newsletter:</strong> Your referral code and the signup connected to it when a friend joins through your link, and your email address if you join our newsletter.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Build, configure, and deploy your personal AI agent</li>
              <li>Communicate with you about your agent and our services</li>
              <li>Send you your order summary and onboarding confirmation</li>
              <li>Provide support during and after your agent&apos;s setup</li>
              <li>Improve our platform and agent-building processes</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>If you join our newsletter, we use your email address to send occasional product updates and tips. Newsletter emails are delivered through Mailchimp, and every email includes an unsubscribe link. Unsubscribing stops marketing emails without affecting your account or your agent.</p>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="4. Data Storage &amp; Security">
            <p>Your data is stored securely in Supabase (a SOC 2-compliant cloud database platform) hosted in the United States. We implement industry-standard security measures including HTTPS encryption for all data in transit and access controls limiting who can view your information.</p>
            <p>API keys and credentials you provide are transmitted over HTTPS and used solely to configure your deployment. We recommend rotating your keys after your agent is deployed.</p>
            <p>Your agent runs on Apollo[Claw] infrastructure. To generate responses, your conversations and shared files are processed by the AI model providers that power your agent. We do not use your conversations to train AI models.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Apollo[Claw]:</strong> Our parent infrastructure provider, which powers the agent deployment process.</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform, bound by confidentiality agreements: Stripe (payments), Supabase (data storage), Mailchimp (newsletter delivery), Vercel (hosting), and the AI model providers that power your agent.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
            </ul>
            <p>We do not share your personal information with advertisers or data brokers.</p>
          </Section>

          <Section title="6. Connected Apps &amp; Integrations">
            <p>You can connect third-party tools to your agent, such as Gmail, Google Calendar, Canvas, and others. When you connect a tool, your agent accesses it only with the permissions you grant during the connection flow, and only to act on your behalf. Connection credentials are stored and managed securely, and you can disconnect any tool at any time from the Integrations tab, which revokes your agent's access.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a>.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Our website may use cookies and similar tracking technologies to improve your browsing experience and analyze site traffic. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          </Section>

          <Section title="9. Children&apos;s Privacy">
            <p>Our services are intended for students aged 18 and older. We do not knowingly collect personal information from individuals under the age of 18. If you believe a minor has provided us with personal information, please contact us immediately.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated date. We encourage you to review this policy periodically.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
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
