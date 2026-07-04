import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import {
  categoryLabel,
  getCollegeAgentPost,
  getCollegeAgentPosts,
  type PortableTextBlock,
} from "@/lib/sanity-blog";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getCollegeAgentPosts();
  return posts.map((post) => ({ slug: post.slug.current }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCollegeAgentPost(slug);

  if (!post) {
    return {};
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || "";
  const url = `https://thecollegeagent.ai/blog/${post.slug.current}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      // Posts without a featured image still get the brand card in link previews.
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [{ url: "/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : ["/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getCollegeAgentPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Nav />
      <main>
        <article>
          <header className="dark-section blog-post-hero">
            <div className="blog-post-hero-inner">
              <Link className="blog-back-link" href="/blog">
                Blog
              </Link>
              <div className="blog-post-category">{categoryLabel(post.category)}</div>
              <h1>{post.title}</h1>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </div>
          </header>

          <section className="blog-content-wrap">
            <div className="blog-content">
              <PortableText blocks={post.body || []} />
            </div>
          </section>
        </article>
      </main>
      <PostStyles />
    </>
  );
}

function PortableText({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const text = block.children?.map((child) => child.text || "").join("") || "";
        const key = block._key || index;

        if (!text.trim()) {
          return null;
        }

        if (block.style === "h2") {
          return <h2 key={key}>{text}</h2>;
        }

        if (block.style === "blockquote") {
          return <blockquote key={key}>{text}</blockquote>;
        }

        return <p key={key}>{text}</p>;
      })}
    </>
  );
}

function PostStyles() {
  return (
    <style>{`
      .blog-post-hero { padding: 118px 0 74px; }
      .blog-post-hero-inner { max-width: 900px; margin: 0 auto; padding: 0 24px; }
      .blog-back-link {
        font-family: var(--font-mono); font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.44);
        display: inline-block; margin-bottom: 22px;
      }
      .blog-post-category {
        font-family: var(--font-mono); font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .12em; color: rgba(61,139,61,.9);
        margin-bottom: 18px;
      }
      .blog-post-hero h1 {
        max-width: 880px; color: #fff; font-size: clamp(34px, 5vw, 64px);
        line-height: 1.04; letter-spacing: 0; font-weight: 850; margin-bottom: 20px;
      }
      .blog-post-hero p {
        max-width: 760px; color: rgba(255,255,255,.66); font-size: 18px; line-height: 1.72;
      }
      .blog-content-wrap { background: var(--cream2); padding: 54px 24px 86px; }
      .blog-content {
        max-width: 760px; margin: 0 auto; background: #fff;
        border: 1px solid rgba(11,18,32,.08); border-radius: 8px;
        padding: clamp(28px, 5vw, 58px);
        box-shadow: 0 14px 42px rgba(11,18,32,.06);
      }
      .blog-content p {
        font-size: 18px; line-height: 1.84; color: rgba(11,18,32,.78); margin-bottom: 24px;
      }
      .blog-content h2 {
        font-size: 24px; line-height: 1.18; color: var(--navy);
        margin: 38px 0 16px; letter-spacing: 0; font-weight: 850;
      }
      .blog-content blockquote {
        margin: 34px 0; padding: 24px 28px; border-left: 4px solid var(--green);
        background: rgba(61,139,61,.08); color: var(--navy); font-size: 21px;
        line-height: 1.55; font-weight: 750;
      }
      .blog-content > *:last-child { margin-bottom: 0; }
      @media (max-width: 640px) {
        .blog-content p { font-size: 16px; line-height: 1.78; }
        .blog-content blockquote { font-size: 18px; padding: 20px; }
      }
    `}</style>
  );
}
