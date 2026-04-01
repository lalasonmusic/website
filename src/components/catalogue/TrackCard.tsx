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
  const isEven = queueIndex % 2 === 0;

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

  const baseBg = isCurrentTrack
    ? "rgba(245,166,35,0.06)"
    : isEven ? "rgba(0,0,0,0.02)" : "transparent";

  return (
    <div
      onClick={handlePlay}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = baseBg; }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.625rem 1rem",
        borderRadius: "8px",
        transition: "background-color 0.15s",
        cursor: "pointer",
        backgroundColor: baseBg,
      }}
    >
      {/* Cover art + play overlay */}
      <div style={{ position: "relative", flexShrink: 0, width: 48, height: 48 }}>
        <div
          style={{
            width: 48,
            height: 48,
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
              <span style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.5)" }}>♪</span>
            </div>
          )}
        </div>
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
          <span style={{ color: "white", fontSize: "0.875rem", marginLeft: isCurrentTrack && isPlaying ? 0 : 2 }}>
            {isCurrentTrack && isPlaying ? "⏸" : "▶"}
          </span>
        </button>
      </div>

      {/* Track info: title + artist + tags */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
          <span style={{
            fontSize: "0.8125rem",
            color: "#9ca3af",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {track.artistName}
          </span>
          {tags.length > 0 && (
            <>
              <span style={{ color: "#d1d5db", fontSize: "0.625rem" }}>•</span>
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  style={{
                    fontSize: "0.625rem",
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {locale === "fr" ? tag.labelFr : tag.labelEn}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* BPM */}
      {track.bpm && (
        <span style={{
          fontSize: "0.75rem",
          color: "#b0b0b0",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>
          {track.bpm}
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
