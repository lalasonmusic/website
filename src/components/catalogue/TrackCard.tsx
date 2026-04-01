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

  const tags = track.categories.slice(0, 3);

  return (
    <div
      onClick={handlePlay}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8f9fa"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isCurrentTrack ? "rgba(245,166,35,0.05)" : "transparent"; }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.625rem 1rem",
        borderBottom: "1px solid #f0f0f0",
        borderRadius: "8px",
        transition: "background-color 0.15s",
        cursor: "pointer",
        backgroundColor: isCurrentTrack ? "rgba(245,166,35,0.05)" : "transparent",
      }}
    >
      {/* Cover art + play overlay */}
      <div style={{ position: "relative", flexShrink: 0, width: 52, height: 52 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#e5e7eb",
          }}
        >
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>♪</span>
            </div>
          )}
        </div>
        {/* Play button overlay */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "6px",
            border: "none",
            backgroundColor: isCurrentTrack ? "rgba(245,166,35,0.85)" : "rgba(27,58,75,0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isCurrentTrack ? 1 : 0,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { if (!isCurrentTrack) e.currentTarget.style.opacity = "0"; }}
          aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
        >
          <span style={{ color: "white", fontSize: "1rem", marginLeft: isCurrentTrack && isPlaying ? 0 : 2 }}>
            {isCurrentTrack && isPlaying ? "⏸" : "▶"}
          </span>
        </button>
      </div>

      {/* Track info: title + artist */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontWeight: 600,
          fontSize: "0.9375rem",
          color: isCurrentTrack ? "var(--color-accent)" : "#1b3a4b",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {track.title}
        </p>
        <p style={{
          margin: "0.125rem 0 0",
          fontSize: "0.8125rem",
          color: "#9ca3af",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {track.artistName}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          display: "flex",
          gap: "0.375rem",
          flexShrink: 0,
        }}>
          {tags.map((tag) => (
            <span
              key={tag.slug}
              style={{
                fontSize: "0.6875rem",
                padding: "0.1875rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {locale === "fr" ? tag.labelFr : tag.labelEn}
            </span>
          ))}
        </div>
      )}

      {/* BPM */}
      {track.bpm && (
        <span style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>
          {track.bpm} BPM
        </span>
      )}

      {/* Duration */}
      <span style={{
        fontSize: "0.8125rem",
        color: "#6b7280",
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums",
        minWidth: "2.5rem",
        textAlign: "right",
      }}>
        {formatDuration(track.durationSeconds)}
      </span>
    </div>
  );
}
