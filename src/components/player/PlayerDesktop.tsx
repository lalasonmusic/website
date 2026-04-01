"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePlayerStore } from "@/store/playerStore";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerDesktop() {
  const locale = useLocale();
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isSubscribed,
    showSubscribeCta,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="player-desktop"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: "#0f2533",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        zIndex: 100,
        display: "none",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
      }}
    >
      {/* Cover + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 180, flex: "0 0 auto" }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "#1b3a4b",
        }}>
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)" }}>♪</span>
            </div>
          )}
        </div>
        <div style={{ overflow: "hidden" }}>
          <p style={{
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 140,
            margin: 0,
          }}>
            {currentTrack.title}
          </p>
          <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {currentTrack.artistName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button onClick={prev} style={controlBtn} aria-label="Previous">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button
          onClick={togglePlay}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--color-accent)",
            border: "none",
            color: "var(--color-accent-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.875rem",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={next} style={controlBtn} aria-label="Next">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      {/* Progress section */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {formatTime(progress)}
        </span>
        <div
          style={{
            flex: 1,
            height: 4,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            cursor: "pointer",
            position: "relative",
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * (duration || 0));
          }}
        >
          <div style={{
            height: "100%",
            backgroundColor: "var(--color-accent)",
            borderRadius: 2,
            width: `${progressPercent}%`,
            transition: "width 0.3s linear",
          }} />
        </div>
        <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", minWidth: 28, fontVariantNumeric: "tabular-nums" }}>
          {duration > 0 ? formatTime(duration) : "--:--"}
        </span>
      </div>

      {/* Preview badge */}
      {!isSubscribed && (
        <span style={{
          fontSize: "0.5625rem",
          color: "var(--color-accent)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}>
          {locale === "fr" ? "Extrait" : "Preview"}
        </span>
      )}

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>♪</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: 64, accentColor: "var(--color-accent)", height: 3 }}
        />
      </div>

      {/* Subscribe CTA overlay */}
      {showSubscribeCta && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15,37,51,0.97)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          borderTop: "1px solid rgba(245,166,35,0.3)",
        }}>
          <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "white", margin: 0 }}>
            {locale === "fr" ? "Ce morceau continue..." : "This track continues..."}
          </p>
          <Link
            href={`/${locale}/abonnements`}
            style={{
              padding: "0.4rem 1.25rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              borderRadius: "9999px",
              textDecoration: "none",
              fontSize: "0.8125rem",
            }}
          >
            {locale === "fr" ? "S'abonner" : "Subscribe"} →
          </Link>
        </div>
      )}
    </div>
  );
}

const controlBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
