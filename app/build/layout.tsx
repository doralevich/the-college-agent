import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Agent | The College Agent",
  description: "Configure your named AI personal agent. Choose your framework, integrations, and support plan, then book your setup call.",
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
