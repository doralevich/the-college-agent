import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Try the Demo, The College Agent",
  description:
    "Meet a live demo of your personal College Agent: tell it your school and graduation year and see what having your own AI agent actually feels like.",
  alternates: { canonical: "https://thecollegeagent.ai/demo" },
  openGraph: {
    title: "Try the Demo, The College Agent",
    description: "See what having your own AI agent actually feels like. No account needed.",
    url: "https://thecollegeagent.ai/demo",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
  },
};

// The public demo sandbox: entry gate -> seeded, capped chat -> sign-up nudge.
// Works with ?ref={slug} (ambassador attribution) or organically.
export default async function DemoPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh", background: "var(--cream2)" }}>
        <DemoExperience refSlug={typeof ref === "string" ? ref : ""} />
      </main>
      <Footer />
    </>
  );
}
