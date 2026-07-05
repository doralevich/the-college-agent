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
  title: "The College Agent, Your AI Companion for College Students",
  description:
    "The College Agent is your AI study companion and study partner for all four years of college, from freshman year to your first job offer. Plan your schedule, study smarter, prep for internships, and graduate career-ready.",
  keywords: [
    "AI companion for college students",
    "AI study companion",
    "AI study partner",
    "AI for college students",
    "AI class schedule planner",
    "college AI companion",
    "personal AI agent for students",
    "AI college planner",
    "AI internship prep",
    "college life AI",
    "AI for high school students",
    "college AI assistant",
    "AI tutor for college",
    "AI for college life",
    "AI agent for college students",
    "AI study tool",
    "AI note taker for students",
    "college productivity app",
    "student AI assistant",
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
    title: "The College Agent, Your AI Companion for College Students",
    description:
      "The College Agent is your AI study companion and study partner for all four years of college, from freshman year to your first job offer. Plan your schedule, study smarter, prep for internships, and graduate career-ready.",
    siteName: "The College Agent",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 1200,
        alt: "The College Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The College Agent, Your AI Companion for College Students",
    description:
      "The College Agent is your AI study companion and study partner for all four years of college, from freshman year to your first job offer. Plan your schedule, study smarter, prep for internships, and graduate career-ready.",
    images: ["/og-image.jpg"],
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
