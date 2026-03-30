"use client";

import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";
import { track as trackEvent } from "@/lib/analytics";

type Props = {
  tracks: TrackWithDetails[];
  locale: string;
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

export default function HomeTrackList({ tracks, locale }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  function handlePlay(track: TrackWithDetails, index: number) {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      trackEvent("track_play", {
        trackId: track.id,
        trackTitle: track.title,
        artistName: track.artistName,
        source: "homepage",
      });
      playTrack(toPlayerTrack(track), tracks.map(toPlayerTrack), index);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {tracks.map((t, i) => {
        const isCurrent = currentTrack?.id === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handlePlay(t, i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              backgroundColor: isCurrent
                ? "rgba(245,166,35,0.08)"
                : "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${isCurrent ? "rgba(245,166,35,0.3)" : "var(--color-border)"}`,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "border-color 0.15s",
            }}
          >
            {/* Cover */}
            <div
              style={{
                position: "relative",
                width: 48,
                height: 48,
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                flexShrink: 0,
                backgroundColor: "var(--color-bg-primary)",
              }}
            >
              {t.coverUrl ? (
                <img
                  src={t.coverUrl}
                  alt=""
                  width={48}
                  height={48}
                  style={{ objectFit: "cover", display: "block" }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontSize: "1.25rem",
                  }}
                >
                  🎵
                </span>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  color: "white",
                }}
              >
                {isCurrent && isPlaying ? "⏸" : "▶"}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: isCurrent
                    ? "var(--color-accent)"
                    : "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {t.title}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                }}
              >
                {t.artistName}
              </p>
            </div>

            {/* Duration */}
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                flexShrink: 0,
              }}
            >
              {formatDuration(t.durationSeconds)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
