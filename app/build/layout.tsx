import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Student AI Agent | The College Agent",
  description:
    "Configure a personal AI agent for college: classes, notes, deadlines, study plans, internships, hosting, support, and onboarding.",
  alternates: { canonical: "https://thecollegeagent.ai/build" },
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
