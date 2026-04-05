"use client";

import { useState, useMemo } from "react";
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

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HomeTrackList({ tracks, locale }: Props) {
  const { currentTrack, isPlaying, progress, duration, playTrack, togglePlay } = usePlayerStore();
  const [shuffleKey, setShuffleKey] = useState(0);

  const displayTracks = useMemo(() => {
    return shuffleArray(tracks).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, shuffleKey]);

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
      playTrack(toPlayerTrack(track), displayTracks.map(toPlayerTrack), index);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.5rem",
      }}
    >
      {displayTracks.map((t, i) => {
        const isCurrent = currentTrack?.id === t.id;
        const isActive = isCurrent && (isPlaying || progress > 0);
        const progressPercent = isCurrent && duration > 0 ? (progress / duration) * 100 : 0;

        return (
          <button
            key={t.id}
            onClick={() => handlePlay(t, i)}
            onMouseEnter={(e) => {
              if (!isCurrent) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: isCurrent ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background-color 0.15s",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Cover with play overlay */}
            <div style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {t.coverUrl ? (
                <img src={t.coverUrl} alt="" width={40} height={40} style={{ objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>♪</span>
                </div>
              )}
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: isCurrent ? "rgba(245,166,35,0.8)" : "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isCurrent ? 1 : 0,
                transition: "opacity 0.2s",
              }}
              className="play-overlay"
              >
                <span style={{ color: "white", fontSize: "0.75rem", marginLeft: isCurrent && isPlaying ? 0 : 1 }}>
                  {isCurrent && isPlaying ? "⏸" : "▶"}
                </span>
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
              <p style={{
                fontWeight: 600,
                fontSize: "0.8125rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: isCurrent ? "var(--color-accent)" : "white",
                margin: 0,
              }}>
                {t.title}
              </p>
              <p style={{
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {t.artistName}
              </p>
            </div>

            {/* Duration */}
            <span style={{
              fontSize: "0.6875rem",
              color: "rgba(255,255,255,0.35)",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}>
              {formatDuration(t.durationSeconds)}
            </span>

            {/* Progress bar at bottom of card */}
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: "rgba(255,255,255,0.05)",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  backgroundColor: "var(--color-accent)",
                  transition: "width 0.3s linear",
                }} />
              </div>
            )}
          </button>
        );
      })}

      {/* 9th slot — Shuffle button */}
      <button
        onClick={() => setShuffleKey((k) => k + 1)}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(245,166,35,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 10,
          border: "1px dashed rgba(245,166,35,0.3)",
          cursor: "pointer",
          width: "100%",
          transition: "background-color 0.2s",
        }}
      >
        <span style={{ fontSize: "1.125rem" }}>🔀</span>
        <span style={{
          fontSize: "0.8125rem",
          color: "var(--color-accent)",
          fontWeight: 500,
        }}>
          {locale === "fr" ? "Découvrir d'autres morceaux" : "Discover more tracks"}
        </span>
      </button>
    </div>
  );
}
