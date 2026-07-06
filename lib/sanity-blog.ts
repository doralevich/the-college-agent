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

// The CMS currently stamps every post with the same publish date, so the blog reads as if
// everything shipped on one day (and a couple of dates land in the future). Until real dates
// are set in Sanity, we override publishedAt by slug here so the timeline is varied and safely
// back-dated. Remove a slug from this map once its real date is set in the CMS — a genuine
// Sanity date always wins when the slug isn't listed.
const PUBLISHED_AT_OVERRIDES: Record<string, string> = {
  "ai-that-knows-my-life": "2026-05-14T08:15:00-04:00",
  "roommate-thought-i-got-my-life-together": "2026-05-28T08:15:00-04:00",
  "finals-week-used-to-break-me": "2026-06-09T08:15:00-04:00",
  "i-got-the-internship": "2026-06-20T08:15:00-04:00",
  "not-a-therapist-but": "2026-06-27T08:15:00-04:00",
  "what-i-wish-id-known-freshman-year": "2026-07-02T08:15:00-04:00",
};

function withPublishedDate<T extends CollegeAgentPost>(post: T): T {
  const override = PUBLISHED_AT_OVERRIDES[post.slug?.current ?? ""];
  return override ? { ...post, publishedAt: override } : post;
}

// Blog content (from Sanity or the fallback) can carry em-dashes. Strip them everywhere the
// post text is shown, title, excerpt, SEO fields, and body, so no em-dashes reach the site.
const stripDash = (s?: string) => (s == null ? s : s.replace(/\s*—\s*/g, ", "));

function normalizeText<T extends CollegeAgentPost>(post: T): T {
  return {
    ...post,
    title: stripDash(post.title) as string,
    excerpt: stripDash(post.excerpt),
    seoTitle: stripDash(post.seoTitle),
    seoDescription: stripDash(post.seoDescription),
    body: post.body?.map((block) => ({
      ...block,
      children: block.children?.map((child) => ({ ...child, text: stripDash(child.text) })),
    })),
  };
}

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
    return normalizePostDates(posts.length ? posts : fallbackCollegeAgentPosts);
  } catch {
    return normalizePostDates(fallbackCollegeAgentPosts);
  }
}

// Apply the date overrides, then re-sort ascending so the ordering reflects the dates we
// actually show (the CMS ordered by its own uniform dates, which no longer matches).
function normalizePostDates(posts: CollegeAgentPost[]): CollegeAgentPost[] {
  return posts
    .map(withPublishedDate)
    .map(normalizeText)
    .sort(
      (a, b) =>
        new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime()
    );
}

export async function getCollegeAgentPost(slug: string) {
  try {
    const post = await sanityFetch<CollegeAgentPost | null>(
      `*[_type == "post" && !(_id in path("drafts.**")) && slug.current == ${JSON.stringify(slug)} && category in ${categoryList}][0] ${postProjection}`
    );
    const resolved = post || fallbackCollegeAgentPosts.find((item) => item.slug.current === slug) || null;
    return resolved ? normalizeText(withPublishedDate(resolved)) : null;
  } catch {
    const resolved = fallbackCollegeAgentPosts.find((item) => item.slug.current === slug) || null;
    return resolved ? normalizeText(withPublishedDate(resolved)) : null;
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
