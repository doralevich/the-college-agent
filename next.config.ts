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
//   connect:  self, Supabase (https+wss), Meta, Composio logos, Vercel insights
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
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://connect.facebook.net https://www.facebook.com https://logos.composio.dev https://*.vercel-insights.com",
  "frame-src 'self' https://calendly.com https://assets.calendly.com",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts matches /api/agents/:path* — which now includes the chat file-upload route.
    // The proxy body cap defaults to 10MB and SILENTLY TRUNCATES larger bodies, which would
    // corrupt attachments. Raise it so real files (the Agents API multipart cap is generous)
    // pass through intact.
    proxyClientMaxBodySize: "25mb",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/affiliate", destination: "/ambassador", permanent: true },
    ];
  },
};

export default nextConfig;
