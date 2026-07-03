import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The College Agent — Your Personal AI for All 4 Years of College",
  description:
    "The College Agent is a personal AI companion that grows with you through college — managing classes, study, internships, social life, and career planning from freshman year to graduation.",
  keywords: [
    "AI for college students",
    "AI study companion",
    "personal AI agent for students",
    "AI college planner",
    "AI class schedule manager",
    "AI internship prep",
    "college life AI",
    "AI study partner",
    "AI for high school students",
    "college AI assistant",
    "AI tutor for college",
    "AI for college life",
    "AI agent for college students",
    "AI study tool",
    "AI note taker for students",
    "college productivity app",
    "student AI assistant",
    "homework organizer",
    "study guide generator",
    "college schedule assistant",
    "internship application assistant",
    "The College Agent",
  ],
  applicationName: "The College Agent",
  category: "Education",
  // Home-screen installs on iOS: real app title and no Safari chrome when launched.
  appleWebApp: {
    capable: true,
    title: "College Agent",
    statusBarStyle: "default",
  },
  metadataBase: new URL("https://thecollegeagent.ai"),
  verification: {
    google: "5fRSMFjZatwPejPvw4h30ZVsT0ZbPagGU39YXJUVjn8",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/college-agent-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://thecollegeagent.ai",
    title: "The College Agent — Your Personal AI for All 4 Years of College",
    description:
      "The College Agent is a personal AI companion that grows with you through college — managing classes, study, internships, social life, and career planning from freshman year to graduation.",
    siteName: "The College Agent",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The College Agent icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The College Agent — Your Personal AI for All 4 Years of College",
    description:
      "The College Agent is a personal AI companion that grows with you through college — managing classes, study, internships, social life, and career planning from freshman year to graduation.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html> before
    // hydration (authed surface only), which React would otherwise flag as a mismatch.
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3KS91J2QK3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3KS91J2QK3');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
