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

  const styleTags = track.categories.filter((c) => c.type === "STYLE");
  const themeTags = track.categories.filter((c) => c.type === "THEME");
  const allTags = [...styleTags, ...themeTags].slice(0, 3);

  return (
    <div
      className="track-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #f0f0f0",
        borderRadius: "8px",
        transition: "background-color 0.15s",
        cursor: "pointer",
      }}
      onClick={handlePlay}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f8f9fa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isCurrentTrack ? "rgba(245,166,35,0.06)" : "transparent";
      }}
      {...(isCurrentTrack && { style: {
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #f0f0f0",
        borderRadius: "8px",
        transition: "background-color 0.15s",
        cursor: "pointer",
        backgroundColor: "rgba(245,166,35,0.06)",
      }})}
    >
      {/* Play button */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          backgroundColor: isCurrentTrack ? "var(--color-accent)" : "#1b3a4b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
        aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
      >
        <span style={{ color: "white", fontSize: "0.75rem", marginLeft: isCurrentTrack && isPlaying ? 0 : 2 }}>
          {isCurrentTrack && isPlaying ? "⏸" : "▶"}
        </span>
      </button>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: isCurrentTrack ? "var(--color-accent)" : "#1b3a4b",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track.artistName}
          </span>
          <span style={{ color: "#9ca3af", fontSize: "0.875rem", flexShrink: 0 }}>–</span>
          <span
            style={{
              fontSize: "0.9375rem",
              color: isCurrentTrack ? "#b47a14" : "#6b7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track.title}
          </span>
        </div>

        {/* Category tags */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.25rem" }}>
            {allTags.map((tag) => (
              <span
                key={tag.slug}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "9999px",
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
      </div>

      {/* Duration */}
      <span
        style={{
          fontSize: "0.8125rem",
          color: "#9ca3af",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatDuration(track.durationSeconds)}
      </span>
    </div>
  );
}
