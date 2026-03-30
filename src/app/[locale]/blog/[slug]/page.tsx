import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { blogService } from "@/lib/services/blogService";
import BlogCard from "@/components/blog/BlogCard";
import { buildMetadata, BASE_URL } from "@/lib/seo";

export const revalidate = 86400; // ISR — revalidate every 24h

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await blogService.getBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? undefined,
    locale,
    pagePath: `/blog/${slug}`,
    image: post.coverUrl ?? undefined,
    type: "article",
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations("blog");

  const post = await blogService.getBySlug(slug);
  if (!post) notFound();

  const related = await blogService.getRelated(post.category, post.slug, 3);

  const categoryLabel = t(`categories.${post.category}` as Parameters<typeof t>[0]);
  const dateStr = post.publishedAt
    ? post.publishedAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Back link */}
      <a
        href={`/${locale}/blog`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          marginBottom: "2rem",
        }}
      >
        ← {t("title")}
      </a>

      {/* Category + meta */}
      <div style={{ marginBottom: "1rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1.25, marginBottom: "1rem" }}>
        {post.title}
      </h1>

      {/* Author + date */}
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        {t("by")} {post.author}
        {dateStr && <> · {dateStr}</>}
      </p>

      {/* Cover image */}
      {post.coverUrl && (
        <div style={{ marginBottom: "2.5rem", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverUrl}
            alt={post.title}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      )}

      {/* Content */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription ?? undefined,
            author: { "@type": "Organization", name: "Lalason" },
            publisher: { "@type": "Organization", name: "Lalason" },
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            image: post.coverUrl ?? undefined,
            url: `${BASE_URL}/${locale}/blog/${post.slug}`,
          }),
        }}
      />

      {/* Related articles */}
      {related.length > 0 && (
        <section style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: "1px solid var(--color-border)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.5rem" }}>
            {t("relatedArticles")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {related.map((rel) => (
              <BlogCard
                key={rel.id}
                post={rel}
                locale={locale}
                categoryLabel={t(`categories.${rel.category}` as Parameters<typeof t>[0])}
                byLabel={t("by")}
                readMoreLabel={t("readMore")}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
