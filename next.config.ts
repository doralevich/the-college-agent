import type { NextConfig } from "next";

// Security headers (HECVAT hardening). The always-on set (HSTS, nosniff, frame deny,
// referrer, permissions) is safe to enforce immediately. The Content-Security-Policy is
// shipped REPORT-ONLY first: the site leans on inline styles / styled-jsx and third parties
// (Meta Pixel, Calendly, Sanity, Composio, Supabase, Google Fonts), so we observe real
// violations on the Vercel preview before switching to an enforced policy. Report-only
// never blocks anything — it only logs — so it's safe to deploy as a starting point.
//
// Origins the app legitimately talks to:
//   scripts:  self, Meta Pixel (connect.facebook.net), Calendly, Vercel insights
//   styles:   self + inline (styled-jsx), Google Fonts, Calendly
//   images:   self, data/blob, and https: broadly (Sanity, Composio, Supabase avatars,
//             school-logo accents, the FB pixel) — pragmatic; narrow later if desired
//   fonts:    self, Google Fonts, data:
//   connect:  self, Supabase (https+wss), Meta, Composio logos, Vercel insights,
//             Open-Meteo + BigDataCloud (the New Chat forecast card)
//   frames:   self + Calendly (the /consultation embed)
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://assets.calendly.com https://*.vercel-insights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.calendly.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://connect.facebook.net https://www.facebook.com https://logos.composio.dev https://*.vercel-insights.com https://api.open-meteo.com https://api.bigdatacloud.net",
  "frame-src 'self' https://calendly.com https://assets.calendly.com",
].join("; ");

// geolocation is (self) rather than (): the New Chat forecast card asks for a position, and
// () switches the API off site-wide, so every student saw "Weather unavailable" no matter what
// they clicked. (self) still means no third-party frame can ask, and the browser still prompts
// the student, who can still refuse - it is "we ask first", not "we can't ask".
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // THE HANDOFF (Nov 2026). This site is the storefront; checkout, sign-in, the questionnaire,
    // the build and the dashboard run on ApolloClaw (lib/apolloclaw-links.ts). These keep every
    // link printed before the cutover working: the /build buttons in old emails and posts, the
    // /login bookmark, the dashboard links in the welcome email. /build keeps its ?plan= and
    // ?interval= so a pricing deep link still preselects the plan over there; the plan ids map
    // one to one onto the student plans (college_<tier>), see the pricing cards.
    //
    // Permanent (308) since Nov 10 2026, once a college purchase had gone through the whole path
    // on ApolloClaw (David). They shipped as temporary first because browsers and search engines
    // cache a permanent redirect for as long as they like, and a wrong one would have been stuck
    // in people's history. Permanent also tells search engines to move these URLs' standing over.
    const apollo = "https://apolloclaw.ai";
    return [
      { source: "/affiliate", destination: "/ambassador", permanent: true },
      { source: "/build", has: [{ type: "query", key: "plan", value: "(?<plan>essentials|plus|pro)" }], destination: `${apollo}/onboard?agent=college&plan=college_:plan`, permanent: true },
      { source: "/build", destination: `${apollo}/onboard?agent=college`, permanent: true },
      { source: "/build/success", destination: `${apollo}/dashboard`, permanent: true },
      { source: "/login", destination: `${apollo}/login`, permanent: true },
      { source: "/reset-password", destination: `${apollo}/login`, permanent: true },
      { source: "/auth/callback", destination: `${apollo}/login`, permanent: true },
      { source: "/dashboard", destination: `${apollo}/dashboard`, permanent: true },
      { source: "/dashboard/:path*", destination: `${apollo}/dashboard`, permanent: true },
      { source: "/setup", destination: `${apollo}/dashboard`, permanent: true },
      { source: "/admin", destination: `${apollo}/admin`, permanent: true },
      { source: "/admin/:path*", destination: `${apollo}/admin`, permanent: true },
    ];
  },
};

export default nextConfig;
