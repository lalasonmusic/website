"use client";

import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";
import { track as trackEvent } from "@/lib/analytics";

type Props = {
  track: TrackWithDetails;
  queue: TrackWithDetails[];
  queueIndex: number;
  locale: string;
  isSubscribed: boolean;
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

export default function TrackCard({ track, queue, queueIndex, locale, isSubscribed }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;

  function handlePlay() {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      trackEvent("track_play", { trackId: track.id, trackTitle: track.title, artistName: track.artistName });
      playTrack(
        toPlayerTrack(track),
        queue.map(toPlayerTrack),
        queueIndex
      );
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem",
        backgroundColor: isCurrentTrack ? "rgba(245,166,35,0.06)" : "var(--color-bg-card)",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${isCurrentTrack ? "rgba(245,166,35,0.3)" : "var(--color-border)"}`,
        transition: "border-color 0.15s",
      }}
    >
      {/* Play button + cover */}
      <button
        onClick={handlePlay}
        style={{
          position: "relative",
          width: 48,
          height: 48,
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: "pointer",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "var(--color-bg-primary)",
        }}
        aria-label={isCurrentTrack && isPlaying ? "Pause" : "Lire"}
      >
        {track.coverUrl ? (
          <img src={track.coverUrl} alt="" width={48} height={48} style={{ objectFit: "cover", display: "block" }} />
        ) : (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.25rem" }}>🎵</span>
        )}
        {/* Overlay icon */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          color: "white",
        }}>
          {isCurrentTrack && isPlaying ? "⏸" : "▶"}
        </div>
      </button>

      {/* Info */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p style={{
          fontWeight: 600,
          fontSize: "0.9375rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: isCurrentTrack ? "var(--color-accent)" : "var(--color-text-primary)",
        }}>
          {track.title}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{track.artistName}</p>

        {/* Category tags */}
        {track.categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.375rem" }}>
            {track.categories.slice(0, 3).map((cat) => (
              <span
                key={cat.slug}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.5rem",
                  backgroundColor: "var(--color-bg-secondary)",
                  borderRadius: "9999px",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {locale === "en" ? cat.labelEn : cat.labelFr}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Duration + BPM */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          {formatDuration(track.durationSeconds)}
        </span>
        {track.bpm && (
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{track.bpm} BPM</span>
        )}
      </div>

      {/* Download button (subscribers only) */}
      {isSubscribed && (
        <a
          href={`/api/tracks/${track.id}/download`}
          download
          style={{
            flexShrink: 0,
            padding: "0.375rem 0.625rem",
            backgroundColor: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-secondary)",
            fontSize: "0.75rem",
            textDecoration: "none",
          }}
          title="Télécharger"
        >
          ↓
        </a>
      )}
    </div>
  );
}
