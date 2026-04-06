import type { BlogPost } from "@/db/schema";

type CardPost = Pick<
  BlogPost,
  "slug" | "title" | "category" | "author" | "coverUrl" | "metaDescription" | "publishedAt"
>;

type Props = {
  post: CardPost;
  locale: string;
  categoryLabel: string;
  byLabel: string;
  readMoreLabel: string;
};

export default function BlogCard({ post, locale, categoryLabel, byLabel, readMoreLabel }: Props) {
  const dateStr = post.publishedAt
    ? post.publishedAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "calc((100% - 3rem) / 3)",
        minWidth: "280px",
      }}
    >
      {post.coverUrl && (
        <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverUrl}
            alt={post.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
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

        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            lineHeight: 1.35,
            color: "var(--color-text-primary)",
          }}
        >
          {post.title}
        </h2>

        {post.metaDescription && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.metaDescription}
          </p>
        )}

        <div
          style={{
            marginTop: "auto",
            paddingTop: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {byLabel} {post.author}
            {dateStr && <> · {dateStr}</>}
          </span>
          <a
            href={`/${locale}/blog/${post.slug}`}
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {readMoreLabel} →
          </a>
        </div>
      </div>
    </article>
  );
}
