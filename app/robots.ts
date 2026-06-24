import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/checkout", "/dashboard", "/login", "/reset-password"],
    },
    sitemap: "https://thecollegeagent.ai/sitemap.xml",
  };
}
