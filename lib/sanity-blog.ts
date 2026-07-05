import { fallbackCollegeAgentPosts } from "./college-agent-fallback-posts";

const PROJECT_ID = "elj68qgu";
const DATASET = "production";
const API_VERSION = "2024-01-01";

export const COLLEGE_AGENT_CATEGORIES = [
  "student-life",
  "productivity",
  "academic-success",
  "internships-career",
  "wellbeing-balance",
  "getting-started",
] as const;

export type CollegeAgentPost = {
  _id: string;
  title: string;
  slug: { _type?: string; current: string };
  category: string;
  excerpt?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  body?: PortableTextBlock[];
  featuredImageUrl?: string;
};

export type PortableTextBlock = {
  _key?: string;
  _type: "block";
  style?: string;
  markDefs?: unknown[];
  children?: Array<{
    _key?: string;
    _type: "span";
    text?: string;
    marks?: string[];
  }>;
};

const categoryList = JSON.stringify(COLLEGE_AGENT_CATEGORIES);

async function sanityFetch<T>(query: string): Promise<T> {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status}`);
  }

  const data = (await res.json()) as { result: T };
  return data.result;
}

const postProjection = `{
  _id,
  title,
  slug,
  category,
  excerpt,
  publishedAt,
  seoTitle,
  seoDescription,
  body,
  "featuredImageUrl": featuredImage.asset->url
}`;

export async function getCollegeAgentPosts() {
  try {
    const posts = await sanityFetch<CollegeAgentPost[]>(
      `*[_type == "post" && !(_id in path("drafts.**")) && category in ${categoryList}] | order(publishedAt asc) ${postProjection}`
    );
    return posts.length ? posts : fallbackCollegeAgentPosts;
  } catch {
    return fallbackCollegeAgentPosts;
  }
}

export async function getCollegeAgentPost(slug: string) {
  try {
    const post = await sanityFetch<CollegeAgentPost | null>(
      `*[_type == "post" && !(_id in path("drafts.**")) && slug.current == ${JSON.stringify(slug)} && category in ${categoryList}][0] ${postProjection}`
    );
    return post || fallbackCollegeAgentPosts.find((item) => item.slug.current === slug) || null;
  } catch {
    return fallbackCollegeAgentPosts.find((item) => item.slug.current === slug) || null;
  }
}

export function categoryLabel(category: string) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace("Internships Career", "Internships & Career")
    .replace("Wellbeing Balance", "Wellbeing & Balance");
}

// A display title that is never blank. Sanity posts occasionally come through with an
// empty `title` (field renamed, left unset, or only `seoTitle` filled in), which rendered
// as an empty <h2>. Fall back to the SEO title, then to a human-readable version of the
// slug, so a card always shows something.
export function postTitle(post: {
  title?: string;
  seoTitle?: string;
  slug?: { current?: string };
}): string {
  const explicit = (post.title ?? "").trim() || (post.seoTitle ?? "").trim();
  if (explicit) return explicit;
  const slug = post.slug?.current ?? "";
  if (!slug) return "Untitled";
  return slug
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
