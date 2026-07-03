import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { categoryLabel, getCollegeAgentPosts } from "@/lib/sanity-blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "College Agent Blog | AI Tips for College Students",
  description:
    "Practical stories and advice for using The College Agent to manage classes, deadlines, internships, wellbeing, and college life.",
  alternates: { canonical: "https://thecollegeagent.ai/blog" },
  openGraph: {
    title: "College Agent Blog",
    description:
      "AI productivity, academic success, internship, and student life advice from The College Agent.",
    url: "https://thecollegeagent.ai/blog",
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await getCollegeAgentPosts();

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72 }}>
        <PageHero
          label="College Agent Blog"
          title="AI that helps college feel manageable."
          sub="Real student stories about staying organized, getting through finals, managing internship season, and using The College Agent as a support system for everyday campus life."
        />

        <section style={{ background: "var(--cream2)", padding: "52px 0 80px" }}>
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post._id} className="blog-card">
                <Link href={`/blog/${post.slug.current}`} aria-label={post.title}>
                  {post.featuredImageUrl ? (
                    <img src={post.featuredImageUrl} alt="" className="blog-card-image" />
                  ) : (
                    <div className="blog-card-image blog-card-image-fallback" />
                  )}
                </Link>
                <div className="blog-card-body">
                  <div className="blog-card-category">{categoryLabel(post.category)}</div>
                  <h2>
                    <Link href={`/blog/${post.slug.current}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
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
      .blog-card-image {
        width: 100%; aspect-ratio: 1200 / 627; object-fit: cover; background: var(--navy);
      }
      .blog-card-image-fallback {
        background:
          linear-gradient(135deg, rgba(61,139,61,.24), transparent),
          var(--navy);
      }
      .blog-card-body { padding: 22px 22px 24px; display: flex; flex-direction: column; flex: 1; }
      .blog-card-category {
        font-family: var(--font-mono); font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .1em; color: var(--green); margin-bottom: 12px;
      }
      .blog-card h2 {
        font-size: 21px; line-height: 1.16; letter-spacing: 0; color: var(--navy);
        margin-bottom: 12px; font-weight: 850;
      }
      .blog-card p {
        color: rgba(11,18,32,.66); font-size: 14px; line-height: 1.65; margin-bottom: 20px;
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
