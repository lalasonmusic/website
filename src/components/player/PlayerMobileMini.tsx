"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePlayerStore } from "@/store/playerStore";

export default function PlayerMobileMini() {
  const locale = useLocale();
  const { currentTrack, isPlaying, togglePlay, showSubscribeCta } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <div
      className="player-mobile"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--player-height-mobile)",
        backgroundColor: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        zIndex: 100,
        display: "none",
        alignItems: "center",
        padding: "0 1rem",
        gap: "0.75rem",
      }}
    >
      {/* Cover */}
      <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-bg-primary)", flexShrink: 0, overflow: "hidden" }}>
        {currentTrack.coverUrl ? (
          <img src={currentTrack.coverUrl} alt="" width={38} height={38} style={{ objectFit: "cover" }} />
        ) : (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1rem" }}>🎵</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p style={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {currentTrack.title}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{currentTrack.artistName}</p>
      </div>

      {/* Play/Pause */}
      {!showSubscribeCta ? (
        <button
          onClick={togglePlay}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
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
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "var(--color-accent)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {"S'abonner"}
        </Link>
      )}
    </div>
  );
}
