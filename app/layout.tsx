import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The College Agent | Your Personal AI. Named. Trained on You.",
  description:
    "Your own AI agent. Named. Trained on your voice, your schedule, your classes, and your goals. Not ChatGPT. Yours. Built on Apollo[Claw] infrastructure.",
  metadataBase: new URL("https://thecollegeagent.ai"),
  alternates: { canonical: "https://thecollegeagent.ai" },
  openGraph: {
    type: "website",
    url: "https://thecollegeagent.ai",
    title: "The College Agent | Your Personal AI. Named. Trained on You.",
    description:
      "Your own AI agent. Named. Trained on your voice, your schedule, your classes, and your goals. Built on Apollo[Claw] infrastructure.",
    siteName: "The College Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "The College Agent | Your Personal AI",
    description:
      "Your own AI agent. Named. Trained on your voice, schedule, classes, and goals. Not ChatGPT. Yours.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
