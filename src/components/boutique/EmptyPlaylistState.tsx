import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function EmptyPlaylistState() {
  const t = await getTranslations("boutique");

  return (
    <div
      style={{
        textAlign: "center",
        padding: "3rem 1.5rem",
        backgroundColor: "var(--color-bg-secondary)",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--color-border)",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>🎵</div>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-text-muted)",
          margin: "0 0 1.5rem",
          maxWidth: 400,
          marginInline: "auto",
        }}
      >
        {t("hub.emptyState")}
      </p>
      <Link
        href={{ pathname: "/musique-ambiance" }}
        style={{
          display: "inline-block",
          padding: "0.625rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-accent)",
          textDecoration: "none",
          border: "1px solid var(--color-accent)",
          borderRadius: "var(--radius-full)",
        }}
      >
        {t("playlist.backToHub")}
      </Link>
    </div>
  );
}
