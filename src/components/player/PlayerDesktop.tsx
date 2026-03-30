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
    showSubscribeCta,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--player-height-desktop)",
        backgroundColor: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        zIndex: 100,
        display: "none",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1.5rem",
      }}
      className="player-desktop"
    >
      {/* Cover + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "200px", flex: "0 0 auto" }}>
        {currentTrack.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            width={44}
            height={44}
            style={{ borderRadius: "var(--radius-sm)", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
            🎵
          </div>
        )}
        <div style={{ overflow: "hidden" }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
            {currentTrack.title}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            {currentTrack.artistName}
          </p>
        </div>
      </div>

      {/* Center: controls + progress */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={prev} style={btnStyle}>⏮</button>
          <button
            onClick={togglePlay}
            style={{
              ...btnStyle,
              width: 40,
              height: 40,
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              borderRadius: "50%",
              fontSize: "1rem",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={next} style={btnStyle}>⏭</button>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", maxWidth: "480px" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", minWidth: "32px", textAlign: "right" }}>
            {formatTime(progress)}
          </span>
          <div
            style={{ flex: 1, height: "4px", backgroundColor: "var(--color-border)", borderRadius: "2px", cursor: "pointer", position: "relative" }}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * (duration || 0));
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "var(--color-accent)",
                borderRadius: "2px",
                width: `${duration ? (progress / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", minWidth: "32px" }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "120px", flex: "0 0 auto" }}>
        <span style={{ fontSize: "0.875rem" }}>🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: "80px", accentColor: "var(--color-accent)" }}
        />
      </div>

      {/* Subscribe CTA overlay */}
      {showSubscribeCta && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15,37,51,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{"Ce morceau continue..."}</p>
          <Link
            href={`/${locale}/abonnements`}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 700,
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            {"S'abonner →"}
          </Link>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "1.125rem",
  padding: "0.25rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
