import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resolveDbToSlug } from "@/lib/boutique/slug-mapping";
import { getBoutiqueImage } from "@/lib/boutique/playlist-images";
import { getBoutiqueIcon } from "./playlist-icons";

type Props = {
  dbSlug: string;
  name: string;
  /** Unused now (description lives on the detail page) but kept for backwards compat with the related-playlists block. */
  description?: string | null;
  gradient: string;
  trackCount: number;
  locale: "fr" | "en";
};

export default async function BoutiquePlaylistCard({
  dbSlug,
  name,
  gradient,
  trackCount,
  locale,
}: Props) {
  const t = await getTranslations("boutique.playlist");
  const localeSlug = resolveDbToSlug(dbSlug, locale) ?? dbSlug;
  const imageUrl = getBoutiqueImage(dbSlug);
  const icon = getBoutiqueIcon(dbSlug);

  const countLabel =
    trackCount === 0
      ? t("trackCountEmpty")
      : trackCount === 1
        ? t("trackCountSingular")
        : t("trackCount", { count: trackCount });

  return (
    <Link
      href={{ pathname: "/musique-ambiance/[slug]", params: { slug: localeSlug } }}
      className="boutique-playlist-card"
      aria-label={`${name} — ${countLabel}`}
      style={{
        position: "relative",
        display: "block",
        borderRadius: 16,
        overflow: "hidden",
        background: gradient,
        textDecoration: "none",
        color: "white",
        aspectRatio: "4 / 5",
        transition: "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms ease",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      }}
    >
      {/* Photo background, fallback to gradient if missing.
          Photo is desaturated to grayscale so the colored tint layer below can drive
          the visual identity (duotone treatment, Spotify-style). */}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="boutique-playlist-card-image"
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(1)",
            transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1), filter 400ms ease",
          }}
        />
      )}

      {/* Coloured tint over a grayscale photo = duotone. Multiply blend lets the
          photo's luminance show through while applying the playlist's brand hue. */}
      {imageUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: gradient,
            mixBlendMode: "multiply",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Editorial dark gradient overlay so title stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: imageUrl
            ? "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.75) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top-left icon chip (only shown when there is a photo, otherwise the gradient already speaks) */}
      {imageUrl && icon && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          {icon}
        </div>
      )}
      {!imageUrl && icon && (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {icon}
        </div>
      )}

      {/* Title + count anchored at the bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "1.25rem 1.25rem 1.125rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            margin: 0,
            color: "white",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            textShadow: imageUrl ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
          }}
        >
          {name}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <span>{countLabel}</span>
          <span
            aria-hidden="true"
            className="boutique-playlist-arrow"
            style={{
              fontSize: "1rem",
              transition: "transform 240ms ease",
            }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
