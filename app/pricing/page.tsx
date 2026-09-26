import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import { PLAN_TIERS } from "@/lib/pricing/intro-cutoff";
import PricingPlans from "./PricingPlans";

// The pricing page. Three plans, each the same private agent - the only difference is how
// much AI usage comes with it every month. Every number on this page comes from PLAN_TIERS
// (lib/pricing/intro-cutoff.ts), the same source checkout charges from, so the page and the
// invoice cannot disagree.

const TITLE = "Pricing — The College Agent";
const DESCRIPTION =
  "Simple plans for The College Agent, your own private AI agent for college. Essentials $25/month, Plus $50/month, Pro $100/month, each with a monthly AI usage allowance included.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://thecollegeagent.ai/pricing" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "https://thecollegeagent.ai/pricing",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "The College Agent",
  description: DESCRIPTION,
  brand: { "@type": "Brand", name: "The College Agent" },
  offers: PLAN_TIERS.map((t) => ({
    "@type": "Offer",
    name: `${t.name} (monthly)`,
    price: (t.monthlyCents / 100).toFixed(2),
    priceCurrency: "USD",
    url: `https://thecollegeagent.ai/build?plan=${t.id}`,
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "Pricing", item: "https://thecollegeagent.ai/pricing" },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Nav />
      <main style={{ paddingTop: 120, minHeight: "100vh", background: "#EDEBE4" }}>
        <PricingPlans />
      </main>
      <Footer />
    </>
  );
}
