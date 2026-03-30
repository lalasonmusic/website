import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { blogService } from "@/lib/services/blogService";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/db/schema";
import { buildMetadata } from "@/lib/seo";

type BlogCategory = BlogPost["category"];

const CATEGORIES: BlogCategory[] = [
  "guides",
  "youtube-createurs",
  "cas-usage",
  "artistes-coulisses",
];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Blog",
    description:
      locale === "fr"
        ? "Guides, conseils et coulisses pour les créateurs de contenu et les propriétaires de boutiques."
        : "Guides, tips and behind-the-scenes for content creators and shop owners.",
    locale,
    pagePath: "/blog",
  });
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const t = await getTranslations("blog");
  const { posts, totalPages } = await blogService.getAll({ category, page });

  const categoryLabel = (cat: BlogCategory) =>
    t(`categories.${cat}` as Parameters<typeof t>[0]);

  function buildHref(params: { category?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return `/${locale}/blog${qs ? `?${qs}` : ""}`;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "2.25rem", marginBottom: "2.5rem" }}>
        {t("title")}
      </h1>

      {/* Category filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.625rem",
          marginBottom: "2.5rem",
        }}
      >
        <a
          href={buildHref({})}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid",
            borderColor: !category ? "var(--color-accent)" : "var(--color-border)",
            backgroundColor: !category ? "var(--color-accent)" : "transparent",
            color: !category ? "var(--color-accent-text)" : "var(--color-text-secondary)",
          }}
        >
          {t("allCategories")}
        </a>
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={buildHref({ category: cat })}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid",
              borderColor: category === cat ? "var(--color-accent)" : "var(--color-border)",
              backgroundColor: category === cat ? "var(--color-accent)" : "transparent",
              color: category === cat ? "var(--color-accent-text)" : "var(--color-text-secondary)",
            }}
          >
            {categoryLabel(cat)}
          </a>
        ))}
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
          {t("noArticles")}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              locale={locale}
              categoryLabel={categoryLabel(post.category)}
              byLabel={t("by")}
              readMoreLabel={t("readMore")}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          {page > 1 && (
            <a
              href={buildHref({ category, page: page - 1 })}
              style={{
                padding: "0.5rem 1.25rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textDecoration: "none",
              }}
            >
              ← {t("previousPage")}
            </a>
          )}
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("pageOf", { page, total: totalPages })}
          </span>
          {page < totalPages && (
            <a
              href={buildHref({ category, page: page + 1 })}
              style={{
                padding: "0.5rem 1.25rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textDecoration: "none",
              }}
            >
              {t("nextPage")} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
