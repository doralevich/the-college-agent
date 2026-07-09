import type { MetadataRoute } from "next";
import { getCollegeAgentPosts } from "@/lib/sanity-blog";

const baseUrl = "https://thecollegeagent.ai";

// Static public routes — includes all 14 landing pages (7 original + 7 new SEO landing pages)
// Blog post URLs are dynamically added below via Sanity fetch.
const publicRoutes: { route: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { route: "", priority: 1, changeFrequency: "weekly" },
  { route: "/about", priority: 0.8, changeFrequency: "monthly" },
  { route: "/for-students", priority: 0.9, changeFrequency: "monthly" },
  { route: "/for-parents", priority: 0.9, changeFrequency: "monthly" },
  { route: "/for-high-school", priority: 0.9, changeFrequency: "monthly" },
  { route: "/study", priority: 0.9, changeFrequency: "monthly" },
  { route: "/internships", priority: 0.9, changeFrequency: "monthly" },
  { route: "/faq", priority: 0.8, changeFrequency: "monthly" },
  { route: "/ambassador", priority: 0.7, changeFrequency: "monthly" },
  { route: "/ambassador/apply", priority: 0.7, changeFrequency: "monthly" },
  { route: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { route: "/build", priority: 0.8, changeFrequency: "monthly" },
  { route: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
  { route: "/demo", priority: 0.7, changeFrequency: "monthly" },
  { route: "/consultation", priority: 0.7, changeFrequency: "monthly" },
  { route: "/orgs", priority: 0.6, changeFrequency: "monthly" },
  // /onboard has no page — intentionally excluded from sitemap (404s)
  // Legal/utility pages kept indexable but de-prioritized so they don't outrank the
  // homepage or landing pages for brand queries.
  { route: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  { route: "/terms", priority: 0.3, changeFrequency: "monthly" },
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
