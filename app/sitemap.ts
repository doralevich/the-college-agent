import type { MetadataRoute } from "next";
import { getCollegeAgentPosts } from "@/lib/sanity-blog";

const baseUrl = "https://thecollegeagent.ai";

const publicRoutes: { route: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { route: "", priority: 1, changeFrequency: "weekly" },
  { route: "/about", priority: 0.8, changeFrequency: "monthly" },
  { route: "/for-students", priority: 0.9, changeFrequency: "monthly" },
  { route: "/for-parents", priority: 0.9, changeFrequency: "monthly" },
  { route: "/for-high-school", priority: 0.8, changeFrequency: "monthly" },
  { route: "/study", priority: 0.8, changeFrequency: "monthly" },
  { route: "/internships", priority: 0.8, changeFrequency: "monthly" },
  { route: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { route: "/ambassador", priority: 0.7, changeFrequency: "monthly" },
  { route: "/ambassador/apply", priority: 0.7, changeFrequency: "monthly" },
  { route: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { route: "/build", priority: 0.7, changeFrequency: "monthly" },
  { route: "/onboard", priority: 0.7, changeFrequency: "monthly" },
  { route: "/privacy", priority: 0.5, changeFrequency: "monthly" },
  { route: "/setup", priority: 0.5, changeFrequency: "monthly" },
  { route: "/terms", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = publicRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency,
    priority,
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
