import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Agent | The College Agent",
  description: "Configure your named AI personal agent. Choose your framework, hosting, and support plan, then check out.",
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
