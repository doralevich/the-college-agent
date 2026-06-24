import type { MetadataRoute } from "next";

const baseUrl = "https://thecollegeagent.ai";

const publicRoutes = ["", "/build", "/onboard", "/privacy", "/setup", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
