import type { Metadata } from "next";

// /setup is a credentials-entry utility, not marketing content, so keep it out of search
// results — and give it a real title instead of inheriting the homepage's metadata.
export const metadata: Metadata = {
  title: "Setup, The College Agent",
  description: "Connect your agent's credentials.",
  robots: { index: false, follow: false },
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
