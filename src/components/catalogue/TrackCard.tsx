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
        gap: "1rem",
        padding: "1rem 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {/* Play button — round circle like Wix */}
      <button
        onClick={handlePlay}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: isCurrentTrack ? "2px solid var(--color-accent)" : "2px solid #d1d5db",
          backgroundColor: isCurrentTrack ? "rgba(245,166,35,0.1)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
        aria-label={isCurrentTrack && isPlaying ? "Pause" : "Lire"}
      >
        <span style={{ fontSize: "1rem", color: isCurrentTrack ? "var(--color-accent)" : "#1b3a4b", marginLeft: isCurrentTrack && isPlaying ? 0 : 2 }}>
          {isCurrentTrack && isPlaying ? "⏸" : "▶"}
        </span>
      </button>

      {/* Artist – Title */}
      <p
        style={{
          flex: 1,
          fontSize: "0.9375rem",
          fontWeight: isCurrentTrack ? 600 : 400,
          color: isCurrentTrack ? "var(--color-accent)" : "#1b3a4b",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          margin: 0,
        }}
      >
        {track.artistName} – {track.title}
      </p>

      {/* Duration */}
      <span
        style={{
          fontSize: "0.875rem",
          color: "#6b7280",
          flexShrink: 0,
        }}
      >
        {formatDuration(track.durationSeconds)}
      </span>
    </div>
  );
}
