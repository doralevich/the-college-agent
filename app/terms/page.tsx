import Nav from "../components/Nav";

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>Legal</span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 8 }}>Terms &amp; Conditions</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(11,23,41,.4)", marginBottom: 48 }}>Last updated: June 23, 2025</p>

          <Section title="1. Agreement to Terms">
            <p>By accessing thecollegeagent.ai or purchasing any of our services, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please do not use our services.</p>
            <p>These Terms apply to all visitors, students, parents, and others who access or use our services.</p>
          </Section>

          <Section title="2. Our Services">
            <p>The College Agent provides personalized AI agent configuration, deployment, and hosting services for college students. Services include:</p>
            <ul>
              <li>AI agent build and deployment (The Undergraduate, The Graduate, The Scholar)</li>
              <li>Apollo Claw cloud hosting (Basic and Pro plans)</li>
              <li>Optional support plans (6 Months and Annual)</li>
              <li>Optional White Glove onboarding experience</li>
            </ul>
            <p>All agent builds are powered by Apollo[Claw] proprietary software. Upon receipt of your completed onboarding form, your agent will be developed and deployed within 30 minutes.</p>
          </Section>

          <Section title="3. Payments &amp; Fees">
            <p>All setup fees are one-time charges due prior to agent deployment. Hosting fees are billed monthly. Support plan fees are charged as stated at time of purchase.</p>
            <ul>
              <li><strong>The Undergraduate:</strong> $999 one-time setup fee</li>
              <li><strong>The Graduate:</strong> $1,499 one-time setup fee</li>
              <li><strong>The Scholar:</strong> $1,999 one-time setup fee</li>
              <li><strong>Basic Hosting:</strong> $89/month</li>
              <li><strong>Pro Hosting:</strong> $159/month</li>
              <li><strong>White Glove Onboarding:</strong> +$650 one-time add-on</li>
            </ul>
            <p>All prices are in USD. We reserve the right to update pricing with 30 days&apos; notice to existing subscribers.</p>
          </Section>

          <Section title="4. Refund Policy">
            <p>Due to the custom and proprietary nature of our agent builds, all setup fees are non-refundable once your onboarding form has been submitted and your agent build has commenced.</p>
            <p>Monthly hosting fees are non-refundable for the current billing period. You may cancel hosting at any time and your agent will remain active through the end of the paid period.</p>
            <p>If your agent has not yet been built (i.e., your onboarding form has not been submitted), please contact us within 48 hours of purchase at <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a> to discuss your options.</p>
          </Section>

          <Section title="5. Your Responsibilities">
            <p>By using our services, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information in all onboarding and setup forms</li>
              <li>Keep your API credentials and bot tokens secure and confidential</li>
              <li>Use your agent only for lawful purposes and in compliance with applicable laws</li>
              <li>Not use your agent to harass, harm, or deceive others</li>
              <li>Notify us promptly if you believe your credentials have been compromised</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>The College Agent and Apollo[Claw] retain all rights to our proprietary software, agent-building technology, and platform infrastructure. You retain ownership of the content and data you provide to configure your agent.</p>
            <p>You grant us a limited license to use your submitted information solely for the purpose of building, configuring, and improving your agent.</p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>Your agent may integrate with third-party platforms (Google Workspace, Telegram, LinkedIn, etc.). Your use of those services is governed by their respective terms and privacy policies. We are not responsible for the availability, accuracy, or conduct of third-party services.</p>
            <p>Your AI provider (Anthropic or OpenAI) API usage is governed by their respective terms. You are responsible for any costs incurred through your API account.</p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>Our services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, error-free, or completely secure.</p>
            <p>AI agents may produce inaccurate or incomplete outputs. You are responsible for reviewing and verifying any information or actions suggested by your agent before acting on them.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the maximum extent permitted by law, Apollo[Claw] and The College Agent shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, even if we have been advised of the possibility of such damages.</p>
            <p>Our total liability to you for any claim arising from these Terms shall not exceed the total amount you paid us in the 30 days preceding the claim.</p>
          </Section>

          <Section title="10. Termination">
            <p>We reserve the right to suspend or terminate your access to our services at any time if you violate these Terms or engage in conduct harmful to other users or to our platform. You may cancel your hosting subscription at any time by contacting us.</p>
          </Section>

          <Section title="11. Governing Law">
            <p>These Terms are governed by the laws of the United States. Any disputes arising under these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>We may update these Terms from time to time. We will notify you of material changes via email or a notice on our website. Continued use of our services after such changes constitutes your acceptance of the new Terms.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>Questions about these Terms? Contact us at:</p>
            <ul>
              <li>Email: <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a></li>
              <li>Website: <a href="https://apolloclaw.ai" style={{ color: "var(--green)" }}>apolloclaw.ai</a></li>
            </ul>
          </Section>
        </div>
      </main>
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
