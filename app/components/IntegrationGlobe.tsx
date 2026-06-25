"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import createGlobe from "cobe";

const FEATURED_LOGOS = [
  { slug: "gmail", label: "Gmail", size: "lg", left: "2%", top: "26%" },
  { slug: "slack", label: "Slack", size: "md", left: "-2%", top: "50%" },
  { slug: "notion", label: "Notion", size: "sm", left: "5%", top: "72%" },
  { slug: "twitter", label: "Twitter/X", size: "xs", left: "3%", top: "12%" },
  { slug: "discord", label: "Discord", size: "xs", left: "12%", top: "86%" },
  { slug: "github", label: "GitHub", size: "md", left: "20%", top: "6%" },
  { slug: "googledrive", label: "Google Drive", size: "sm", left: "36%", top: "1%" },
  { slug: "figma", label: "Figma", size: "md", left: "50%", top: "-1%" },
  { slug: "linear", label: "Linear", size: "sm", left: "65%", top: "2%" },
  { slug: "googlesheets", label: "Google Sheets", size: "xs", left: "78%", top: "8%" },
  { slug: "googlecalendar", label: "Google Calendar", size: "md", left: "84%", top: "22%" },
  { slug: "hubspot", label: "HubSpot", size: "lg", left: "96%", top: "42%" },
  { slug: "stripe", label: "Stripe", size: "md", left: "100%", top: "62%" },
  { slug: "shopify", label: "Shopify", size: "sm", left: "90%", top: "78%" },
  { slug: "outlook", label: "Outlook", size: "xs", left: "98%", top: "18%" },
  { slug: "jira", label: "Jira", size: "sm", left: "76%", top: "90%" },
  { slug: "zendesk", label: "Zendesk", size: "xs", left: "85%", top: "96%" },
  { slug: "airtable", label: "Airtable", size: "md", left: "60%", top: "97%" },
  { slug: "salesforce", label: "Salesforce", size: "md", left: "42%", top: "99%" },
  { slug: "supabase", label: "Supabase", size: "sm", left: "26%", top: "92%" },
  { slug: "linkedin", label: "LinkedIn", size: "xs", left: "14%", top: "97%" },
  { slug: "googledocs", label: "Google Docs", size: "md", left: "38%", top: "28%" },
  { slug: "intercom", label: "Intercom", size: "sm", left: "63%", top: "36%" },
  { slug: "posthog", label: "PostHog", size: "md", left: "55%", top: "63%" },
  { slug: "bitbucket", label: "Bitbucket", size: "sm", left: "40%", top: "68%" },
  { slug: "youtube", label: "YouTube", size: "sm", left: "68%", top: "54%" },
  { slug: "sentry", label: "Sentry", size: "xs", left: "45%", top: "44%" },
  { slug: "datadog", label: "Datadog", size: "xs", left: "58%", top: "76%" },
  { slug: "mailchimp", label: "Mailchimp", size: "xs", left: "34%", top: "50%" },
];

const MARQUEE_LOGOS = [
  { slug: "notion", label: "Notion" },
  { slug: "slack", label: "Slack" },
  { slug: "github", label: "GitHub" },
  { slug: "gmail", label: "Gmail" },
  { slug: "figma", label: "Figma" },
  { slug: "linear", label: "Linear" },
  { slug: "hubspot", label: "HubSpot" },
  { slug: "googlecalendar", label: "Google Calendar" },
  { slug: "googledrive", label: "Google Drive" },
  { slug: "googledocs", label: "Google Docs" },
  { slug: "googlesheets", label: "Google Sheets" },
  { slug: "discord", label: "Discord" },
  { slug: "stripe", label: "Stripe" },
  { slug: "shopify", label: "Shopify" },
  { slug: "airtable", label: "Airtable" },
  { slug: "salesforce", label: "Salesforce" },
  { slug: "jira", label: "Jira" },
  { slug: "supabase", label: "Supabase" },
  { slug: "outlook", label: "Outlook" },
  { slug: "twitter", label: "Twitter / X" },
  { slug: "linkedin", label: "LinkedIn" },
  { slug: "youtube", label: "YouTube" },
  { slug: "intercom", label: "Intercom" },
  { slug: "zendesk", label: "Zendesk" },
  { slug: "mailchimp", label: "Mailchimp" },
  { slug: "klaviyo", label: "Klaviyo" },
  { slug: "google_analytics", label: "Google Analytics" },
  { slug: "posthog", label: "PostHog" },
  { slug: "sentry", label: "Sentry" },
  { slug: "datadog", label: "Datadog" },
  { slug: "pagerduty", label: "PagerDuty" },
  { slug: "bitbucket", label: "Bitbucket" },
  { slug: "lever", label: "Lever" },
  { slug: "ashby", label: "Ashby" },
  { slug: "bamboohr", label: "BambooHR" },
  { slug: "deel", label: "Deel" },
  { slug: "brex", label: "Brex" },
  { slug: "xero", label: "Xero" },
  { slug: "googleads", label: "Google Ads" },
  { slug: "typefully", label: "Typefully" },
  { slug: "auth0", label: "Auth0" },
  { slug: "firecrawl", label: "Firecrawl" },
  { slug: "tavily", label: "Tavily" },
  { slug: "serpapi", label: "SerpAPI" },
  { slug: "perplexityai", label: "Perplexity" },
  { slug: "googletasks", label: "Google Tasks" },
];

function logoUrl(slug: string) {
  return `https://logos.composio.dev/api/${slug}`;
}

export default function IntegrationGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let phi = 0.4;
    let width = 0;
    let destroyed = false;

    const devicePixelRatio = window.devicePixelRatio || 2;
    const resize = () => {
      width = wrap.offsetWidth;
      canvas.width = width * devicePixelRatio;
      canvas.height = width * devicePixelRatio;
    };

    resize();
    window.addEventListener("resize", resize);

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width: width * devicePixelRatio,
      height: width * devicePixelRatio,
      phi: 0.4,
      theta: 0.2,
      dark: 0,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 5,
      baseColor: [0.92, 0.92, 0.97],
      markerColor: [0.22, 0.55, 0.22],
      glowColor: [0.88, 0.9, 0.84],
      markers: [
        { location: [37.78, -122.41], size: 0.05 },
        { location: [40.71, -74.0], size: 0.05 },
        { location: [51.51, -0.13], size: 0.05 },
        { location: [48.86, 2.35], size: 0.04 },
        { location: [35.68, 139.69], size: 0.05 },
        { location: [1.35, 103.82], size: 0.04 },
        { location: [52.52, 13.4], size: 0.04 },
        { location: [-33.87, 151.21], size: 0.04 },
        { location: [19.07, 72.88], size: 0.05 },
        { location: [-23.55, -46.63], size: 0.04 },
      ],
      onRender: (state) => {
        if (destroyed) return;
        state.phi = phi;
        phi += 0.004;
        if (state.width !== width * devicePixelRatio) {
          state.width = width * devicePixelRatio;
          state.height = width * devicePixelRatio;
        }
      },
    });

    return () => {
      destroyed = true;
      window.removeEventListener("resize", resize);
      globe.destroy();
    };
  }, []);

  const marqueeItems = [...MARQUEE_LOGOS, ...MARQUEE_LOGOS];

  return (
    <section id="integrations" className="integration-globe-section">
      <div className="integration-globe-heading">
        <span className="mono-label">Integrations</span>
        <h2 className="section-title">Works with the tools<br />you already use</h2>
        <p className="section-sub">
          Connect to 250+ apps, from Gmail and Slack to Salesforce and Stripe, right out of the box.
        </p>
      </div>

      <div className="integration-globe-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="integration-globe-canvas" />
        {FEATURED_LOGOS.map((logo, index) => (
          <div
            className={`integration-icon-card ${logo.size}`}
            key={`${logo.slug}-${index}`}
            style={{ left: logo.left, top: logo.top }}
          >
            <img src={logoUrl(logo.slug)} alt={logo.label} loading="lazy" />
          </div>
        ))}
      </div>

      <div className="integration-marquee-section">
        <div className="integration-marquee-track">
          {marqueeItems.map((logo, index) => (
            <div className="integration-marquee-item" key={`${logo.slug}-${index}`}>
              <img src={logoUrl(logo.slug)} alt="" loading="lazy" aria-hidden="true" />
              <span>{logo.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="integration-globe-cta">
        <a href="/build" className="btn-purple" style={{ fontSize: 14, padding: "16px 44px" }}>
          Build My Agent
        </a>
      </div>

      <style jsx>{`
        .integration-globe-section {
          position: relative;
          width: 100%;
          background: var(--cream2);
          padding: 78px 0 70px;
          overflow: hidden;
        }
        .integration-globe-heading {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 42px;
          padding: 0 24px;
        }
        .integration-globe-heading :global(.section-sub) {
          max-width: 520px;
          margin: 14px auto 0;
        }
        .integration-globe-wrap {
          position: relative;
          aspect-ratio: 1;
          width: min(620px, 86vw);
          margin: 0 auto;
        }
        .integration-globe-canvas {
          width: 100% !important;
          height: 100% !important;
          border-radius: 50%;
        }
        .integration-icon-card {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid rgba(11, 23, 41, 0.08);
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(11, 23, 41, 0.1), 0 1px 3px rgba(11, 23, 41, 0.06);
          overflow: hidden;
          transform: translate(-50%, -50%);
          animation: integration-float 4s ease-in-out infinite;
          z-index: 2;
        }
        .integration-icon-card img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 18%;
        }
        .integration-icon-card.lg { width: 60px; height: 60px; }
        .integration-icon-card.md { width: 48px; height: 48px; }
        .integration-icon-card.sm { width: 38px; height: 38px; }
        .integration-icon-card.xs { width: 30px; height: 30px; border-radius: 8px; }
        .integration-icon-card:nth-of-type(odd) { animation-duration: 3.8s; }
        .integration-icon-card:nth-of-type(even) { animation-duration: 4.4s; }
        .integration-marquee-section {
          width: 100%;
          overflow: hidden;
          padding: 28px 0 30px;
          position: relative;
        }
        .integration-marquee-section::before,
        .integration-marquee-section::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }
        .integration-marquee-section::before {
          left: 0;
          background: linear-gradient(to right, var(--cream2), transparent);
        }
        .integration-marquee-section::after {
          right: 0;
          background: linear-gradient(to left, var(--cream2), transparent);
        }
        .integration-marquee-track {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: integration-marquee 40s linear infinite;
        }
        .integration-marquee-track:hover { animation-play-state: paused; }
        .integration-marquee-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #fff;
          border: 1px solid rgba(11, 23, 41, 0.07);
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(11, 23, 41, 0.06);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .integration-marquee-item img {
          width: 22px;
          height: 22px;
          object-fit: contain;
        }
        .integration-marquee-item span {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .integration-globe-cta {
          display: flex;
          justify-content: center;
        }
        @keyframes integration-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-7px); }
        }
        @keyframes integration-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (max-width: 600px) {
          .integration-globe-section { padding: 56px 0 54px; }
          .integration-globe-heading { margin-bottom: 28px; }
          .integration-icon-card.xs { display: none; }
          .integration-icon-card.lg { width: 50px; height: 50px; }
          .integration-icon-card.md { width: 42px; height: 42px; }
          .integration-icon-card.sm { width: 34px; height: 34px; }
          .integration-marquee-section::before,
          .integration-marquee-section::after { width: 44px; }
        }
      `}</style>
    </section>
  );
}
