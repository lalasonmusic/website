"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";

export default function PlayerMobileMini() {
  const locale = useLocale();
  const pathname = usePathname();
  const onCatalogue = pathname.includes("/catalogue");
  const { currentTrack, isPlaying, progress, duration, isSubscribed, togglePlay, showSubscribeCta } = usePlayerStore();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="player-mobile"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(15, 37, 51, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        zIndex: 100,
        display: "none",
        flexDirection: "column",
      }}
    >
      {/* Progress bar on top */}
      <div style={{ height: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          backgroundColor: "var(--color-accent)",
          transition: "width 0.3s linear",
        }} />
      </div>

      {/* Main row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "0.4rem 0.75rem",
        gap: "0.625rem",
      }}>
        {/* Cover */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" width={34} height={34} style={{ objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>♪</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{
            fontWeight: 600,
            fontSize: "0.75rem",
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            margin: 0,
          }}>
            {currentTrack.title}
            {!isSubscribed && (
              <span style={{ color: "var(--color-accent)", marginLeft: "0.375rem", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase" }}>
                {locale === "fr" ? "Extrait" : "Preview"}
              </span>
            )}
          </p>
          <p style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {currentTrack.artistName}
          </p>
        </div>

        {/* CTA link — adapts based on context */}
        <Link
          href={!isSubscribed && onCatalogue ? `/${locale}/abonnements` : `/${locale}/catalogue`}
          style={{
            fontSize: "0.5625rem",
            color: "var(--color-accent)",
            textDecoration: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {!isSubscribed && onCatalogue
            ? (locale === "fr" ? "Nos offres" : "Our plans")
            : (locale === "fr" ? "Catalogue" : "Browse")
          }
        </Link>

        {/* Play/Pause or Subscribe */}
        {!showSubscribeCta ? (
          <button
            onClick={togglePlay}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.6875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        ) : (
          <Link
            href={`/${locale}/abonnements`}
            style={{
              fontSize: "0.625rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {locale === "fr" ? "S'abonner →" : "Subscribe →"}
          </Link>
        )}
      </div>
    </div>
  );
}
