"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePlayerStore } from "@/store/playerStore";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerMobileExpanded() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    showSubscribeCta,
    togglePlay,
    next,
    prev,
    seek,
  } = usePlayerStore();

  if (!currentTrack) return null;

  // The mini bar click area — toggle expanded view
  return (
    <>
      {/* Tap zone on mini bar title to expand */}
      <button
        className="player-mobile-expand"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: "80px",
          height: "var(--player-height-mobile)",
          background: "none",
          border: "none",
          zIndex: 101,
          cursor: "pointer",
          display: "none",
        }}
        aria-label="Agrandir le player"
      />

      {/* Expanded overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--color-bg-secondary)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem 1.5rem",
            gap: "1.5rem",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            style={{ alignSelf: "flex-end", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.5rem", cursor: "pointer" }}
          >
            ✕
          </button>

          {/* Cover */}
          <div style={{ width: "200px", height: "200px", borderRadius: "var(--radius-md)", overflow: "hidden", backgroundColor: "var(--color-bg-primary)" }}>
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} width={200} height={200} style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "4rem" }}>🎵</div>
            )}
          </div>

          {/* Info */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "1.125rem" }}>{currentTrack.title}</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{currentTrack.artistName}</p>
          </div>

          {/* Progress */}
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <div
              style={{ height: "4px", backgroundColor: "var(--color-border)", borderRadius: "2px", cursor: "pointer" }}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                seek(((e.clientX - rect.left) / rect.width) * (duration || 0));
              }}
            >
              <div style={{ height: "100%", backgroundColor: "var(--color-accent)", borderRadius: "2px", width: `${duration ? (progress / duration) * 100 : 0}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{formatTime(progress)}</span>
              <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          {!showSubscribeCta ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <button onClick={prev} style={btnStyle}>⏮</button>
              <button
                onClick={togglePlay}
                style={{ ...btnStyle, width: 56, height: 56, backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", borderRadius: "50%", fontSize: "1.25rem" }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button onClick={next} style={btnStyle}>⏭</button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{"Ce morceau continue..."}</p>
              <Link
                href={`/${locale}/abonnements`}
                style={{ padding: "0.75rem 2rem", backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", fontWeight: 700, borderRadius: "var(--radius-full)", textDecoration: "none" }}
              >
                {"S'abonner →"}
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "1.5rem",
  padding: "0.5rem",
};
