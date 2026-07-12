import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import ContactForm from "./ContactForm";

// The contact page: ApolloClaw's contact layout (hero, form card beside direct-contact
// rail) in College Agent colors. Every path a visitor might want: write us, email us,
// book a consultation, or try the demo.

export const metadata: Metadata = {
  title: "Contact Us, The College Agent",
  description:
    "Questions about The College Agent? Write us, email hello@thecollegeagent.ai, or book a consultation. We reply fast, usually the same day.",
  alternates: { canonical: "https://thecollegeagent.ai/contact" },
  openGraph: {
    title: "Contact Us, The College Agent",
    description:
      "Questions about The College Agent? Write us, email hello@thecollegeagent.ai, or book a consultation.",
    url: "https://thecollegeagent.ai/contact",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const DIRECT = [
  {
    label: "Email us",
    title: "hello@thecollegeagent.ai",
    desc: "For anything: questions, support, press, partnerships. A human reads every message.",
    href: "mailto:hello@thecollegeagent.ai",
    cta: "Write an email",
  },
  {
    label: "Talk it through",
    title: "Book a consultation",
    desc: "15 minutes with us — perfect for parents with questions or campus offices planning a rollout.",
    href: "/consultation",
    cta: "Pick a time",
  },
  {
    label: "See it first",
    title: "Try the live demo",
    desc: "Have a real conversation with a College Agent before you ask us anything.",
    href: "/demo",
    cta: "Open the demo",
  },
];

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <PageHero
          label="Contact"
          title="Talk to a human."
          sub="Questions about your agent, plans for a whole campus, or just curious? Send us a note and we'll get right back to you, usually the same day."
          mascot="/avatars/guy-11.webp"
        />

        {/* FORM + DIRECT CHANNELS */}
        <section style={{ padding: "72px 0 80px" }}>
          <div className="contact-grid" style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px" }}>
            <div className="contact-rail">
              {DIRECT.map(({ label, title, desc, href, cta }) => (
                <div key={title} className="contact-card">
                  <span className="contact-card-label">{label}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <a href={href}>{cta} &rarr;</a>
                </div>
              ))}
            </div>
            <div className="contact-form-col">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .contact-grid { display: grid; grid-template-columns: 340px 1fr; gap: 28px; align-items: start; }
        .contact-rail { display: grid; gap: 16px; }
        .contact-card {
          background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 16px;
          padding: 24px 26px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .contact-card-label {
          font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: var(--green);
          display: block; margin-bottom: 8px;
        }
        .contact-card h3 { font-size: 16.5px; font-weight: 800; color: var(--navy); margin: 0 0 7px; letter-spacing: -.01em; overflow-wrap: anywhere; }
        .contact-card p { font-size: 13.5px; line-height: 1.65; color: rgba(11,23,41,.62); margin: 0 0 12px; }
        .contact-card a {
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: .05em; text-transform: uppercase; color: var(--green);
          text-decoration: none;
        }
        .contact-card a:hover { text-decoration: underline; }
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-form-col { order: -1; }
        }
      `}</style>
    </>
  );
}
