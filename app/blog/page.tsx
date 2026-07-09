import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { categoryLabel, getCollegeAgentPosts, postTitle } from "@/lib/sanity-blog";

export const revalidate = 300;

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://thecollegeagent.ai/blog",
  name: "The College Agent Blog",
  description:
    "AI tips, study strategies, internship advice, and college life guides for students using The College Agent.",
  url: "https://thecollegeagent.ai/blog",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://thecollegeagent.ai/blog" },
  ],
};

export const metadata: Metadata = {
  title: "College Agent Blog — AI Tips and Advice for College Students",
  description:
    "Practical stories and guides on using AI for college: studying, managing deadlines, landing internships, campus life, and building your career as a student.",
  alternates: { canonical: "https://thecollegeagent.ai/blog" },
  openGraph: {
    title: "College Agent Blog — AI Tips and Advice for College Students",
    description:
      "Practical stories and guides on using AI for college: studying, managing deadlines, landing internships, campus life, and building your career as a student.",
    url: "https://thecollegeagent.ai/blog",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
    type: "website",
  },
};

// Post excerpts come from Sanity, which sometimes contains em-dashes. Normalize them to
// commas so blog copy matches the rest of the site (no em-dashes).
const noDash = (s: string) => s.replace(/\s*—\s*/g, ", ");

export default async function BlogPage() {
  const posts = await getCollegeAgentPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 72 }}>
        <PageHero
          label="College Agent Blog"
          title="AI that helps college feel manageable."
          titleSize="36px"
          sub="Real student stories about staying organized, getting through finals, managing internship season, and using The College Agent as a support system for everyday campus life."
        />

        <section style={{ background: "var(--cream2)", padding: "52px 0 80px" }}>
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post._id} className="blog-card">
                <Link href={`/blog/${post.slug.current}`} className="blog-cover" aria-label={postTitle(post)}>
                  {post.featuredImageUrl ? (
                    <img src={post.featuredImageUrl} alt="" className="blog-cover-img" />
                  ) : null}
                  <div className="blog-cover-meta">
                    <span className="blog-cover-category">{categoryLabel(post.category)}</span>
                    <h2 className="blog-cover-title">{postTitle(post)}</h2>
                  </div>
                </Link>
                <div className="blog-card-body">
                  {post.excerpt ? <p>{noDash(post.excerpt)}</p> : null}
                  <Link className="blog-card-link" href={`/blog/${post.slug.current}`}>
                    Read Article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <BlogStyles />
    </>
  );
}

function BlogStyles() {
  return (
    <style>{`
      .blog-kicker {
        font-family: var(--font-mono); font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .12em; color: rgba(61,139,61,.9);
        display: block; margin-bottom: 30px;
      }
      .blog-index-title {
        max-width: 760px; color: #fff; font-size: clamp(36px, 5vw, 66px);
        line-height: 1.02; letter-spacing: 0; font-weight: 850; margin-bottom: 20px;
      }
      .blog-index-sub {
        max-width: 700px; color: rgba(255,255,255,.66); font-size: 18px;
        line-height: 1.7;
      }
      .blog-grid {
        max-width: 1120px; margin: 0 auto; padding: 0 24px;
        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px;
      }
      .blog-card {
        background: #fff; border: 1px solid rgba(11,18,32,.08);
        border-radius: 8px; overflow: hidden; box-shadow: 0 14px 38px rgba(11,18,32,.06);
        display: flex; flex-direction: column;
      }
      .blog-cover {
        position: relative; display: block;
        padding: 24px; overflow: hidden; text-decoration: none;
        background:
          linear-gradient(150deg, rgba(61,139,61,.35), rgba(11,18,32,0) 58%),
          var(--navy);
      }
      .blog-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .blog-cover::after {
        content: ""; position: absolute; inset: 0;
        background: linear-gradient(to bottom, rgba(8,14,26,.55), rgba(8,14,26,.12) 70%);
      }
      .blog-cover-meta { position: relative; z-index: 1; }
      .blog-cover-category {
        display: block; font-family: var(--font-mono); font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .1em; color: #6cc26c; margin-bottom: 12px;
      }
      .blog-cover-title {
        margin: 0; color: #fff;
        font-size: 18px; line-height: 1.24; font-weight: 850; letter-spacing: -.01em;
      }
      .blog-card-body { padding: 24px; display: flex; flex-direction: column; flex: 1; }
      .blog-card p {
        color: rgba(11,18,32,.66); font-size: 14px; line-height: 1.65; margin-bottom: 20px;
        display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
      }
      .blog-card-link {
        margin-top: auto; font-family: var(--font-mono); font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .09em; color: var(--green);
      }
      @media (max-width: 920px) {
        .blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 620px) {
        .blog-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
