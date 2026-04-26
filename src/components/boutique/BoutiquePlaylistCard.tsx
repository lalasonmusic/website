import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resolveDbToSlug } from "@/lib/boutique/slug-mapping";

type Props = {
  dbSlug: string;
  name: string;
  description: string | null;
  gradient: string;
  emoji: string | null;
  trackCount: number;
  locale: "fr" | "en";
};

export default async function BoutiquePlaylistCard({
  dbSlug,
  name,
  description,
  gradient,
  emoji,
  trackCount,
  locale,
}: Props) {
  const t = await getTranslations("boutique.playlist");
  const localeSlug = resolveDbToSlug(dbSlug, locale) ?? dbSlug;

  const countLabel =
    trackCount === 0
      ? t("trackCountEmpty")
      : trackCount === 1
        ? t("trackCountSingular")
        : t("trackCount", { count: trackCount });

  return (
    <Link
      href={{ pathname: "/musique-ambiance/[slug]", params: { slug: localeSlug } }}
      style={{
        display: "block",
        position: "relative",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: gradient,
        padding: "1.75rem 1.5rem",
        textDecoration: "none",
        color: "white",
        minHeight: 200,
        transition: "transform 200ms ease, box-shadow 200ms ease",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
      className="boutique-playlist-card"
    >
      {emoji && (
        <div style={{ fontSize: "2.5rem", lineHeight: 1, marginBottom: "0.75rem" }}>
          {emoji}
        </div>
      )}
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          margin: "0 0 0.5rem",
          color: "white",
          lineHeight: 1.2,
        }}
      >
        {name}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "0.8125rem",
            margin: "0 0 0.75rem",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "rgba(255,255,255,0.7)",
          marginTop: "auto",
        }}
      >
        {countLabel}
      </div>
    </Link>
  );
}
