"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";
import { track as trackEvent } from "@/lib/analytics";

type Props = {
  tracks: TrackWithDetails[];
  locale: string;
};

function toPlayerTrack(t: TrackWithDetails): PlayerTrack {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    artistName: t.artistName,
    durationSeconds: t.durationSeconds ?? 0,
    coverUrl: t.coverUrl,
    previewPath: t.previewPath,
    fullPath: t.fullPath,
  };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FloatingPlayer({ tracks, locale }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasAutoPlayed = useRef(false);
  const { currentTrack, isPlaying, progress, duration, playTrack, togglePlay, next, prev } =
    usePlayerStore();

  // Auto-play a random track on mount
  useEffect(() => {
    if (hasAutoPlayed.current || tracks.length === 0) return;
    hasAutoPlayed.current = true;

    const randomIndex = Math.floor(Math.random() * tracks.length);
    const t = tracks[randomIndex];
    if (t.previewPath) {
      trackEvent("track_play", {
        trackId: t.id,
        trackTitle: t.title,
        artistName: t.artistName,
        source: "floating_player",
      });
      playTrack(toPlayerTrack(t), tracks.map(toPlayerTrack), randomIndex);
    }

    // Animate in after a short delay
    setTimeout(() => setVisible(true), 500);
  }, [tracks, playTrack]);

  if (dismissed || tracks.length === 0) return null;

  // Show widget even before currentTrack is set (useEffect needs one render cycle)
  const displayTrack = currentTrack ?? toPlayerTrack(tracks[0]);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 24,
        zIndex: 1000,
        width: 340,
        backgroundColor: "rgba(20, 30, 40, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(245,166,35,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        padding: "1.25rem",
        transform: visible ? "translateY(0)" : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.4s ease, opacity 0.4s ease",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          fontSize: "1.25rem",
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        ✕
      </button>

      {/* Header label */}
      <p
        style={{
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-accent)",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        {locale === "fr" ? "🎧 À découvrir" : "🎧 Now playing"}
      </p>

      {/* Track info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {/* Cover or icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: "rgba(245,166,35,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {displayTrack.coverUrl ? (
            <img
              src={displayTrack.coverUrl}
              alt=""
              width={48}
              height={48}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "1.5rem" }}>🎵</span>
          )}
        </div>

        <div style={{ overflow: "hidden" }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "white",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
          >
            {displayTrack.title}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            {displayTrack.artistName}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          marginBottom: "0.625rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: "var(--color-accent)",
            borderRadius: 2,
            transition: "width 0.3s linear",
          }}
        />
      </div>

      {/* Time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.6875rem",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "0.75rem",
        }}
      >
        <span>{formatDuration(progress)}</span>
        <span>{duration > 0 ? formatDuration(duration) : "--:--"}</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem" }}>
        <button
          onClick={prev}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: "1.125rem",
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Previous"
        >
          ⏮
        </button>

        <button
          onClick={togglePlay}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "var(--color-accent)",
            border: "none",
            color: "var(--color-accent-text)",
            fontSize: "1.25rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={next}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: "1.125rem",
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Next"
        >
          ⏭
        </button>
      </div>

      {/* CTA link */}
      <a
        href={`/${locale}/catalogue`}
        style={{
          display: "block",
          textAlign: "center",
          marginTop: "0.75rem",
          fontSize: "0.8125rem",
          color: "var(--color-accent)",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        {locale === "fr" ? "Explorer le catalogue →" : "Explore catalogue →"}
      </a>
    </div>
  );
}
