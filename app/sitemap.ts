import type { MetadataRoute } from "next";
import { getCollegeAgentPosts } from "@/lib/sanity-blog";

const baseUrl = "https://thecollegeagent.ai";

const publicRoutes = ["", "/ambassador", "/ambassador/apply", "/blog", "/build", "/onboard", "/privacy", "/setup", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/blog" ? "weekly" as const : "monthly" as const,
    priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.7,
  }));

  try {
    const posts = await getCollegeAgentPosts();
    routes.push(
      ...posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug.current}`,
        lastModified: post.publishedAt ? new Date(post.publishedAt) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.65,
      }))
    );
  } catch {
    // Keep the static sitemap alive if the Sanity API has a temporary issue.
  }

  return routes;
}
