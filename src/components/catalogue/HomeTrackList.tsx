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

  const tags = (t: TrackWithDetails) => t.categories.slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {displayTracks.map((t, i) => {
        const isCurrent = currentTrack?.id === t.id;
        const isActive = isCurrent && (isPlaying || progress > 0);
        const progressPercent = isCurrent && duration > 0 ? (progress / duration) * 100 : 0;
        const isEven = i % 2 === 0;
        const trackTags = tags(t);

        return (
          <div
            key={t.id}
            onClick={() => handlePlay(t, i)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isCurrent ? "rgba(245,166,35,0.06)" : isEven ? "rgba(0,0,0,0.02)" : "transparent";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background-color 0.15s",
              backgroundColor: isCurrent ? "rgba(245,166,35,0.06)" : isEven ? "rgba(0,0,0,0.02)" : "transparent",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Cover */}
            <div style={{ position: "relative", width: 44, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
              {t.coverUrl ? (
                <img src={t.coverUrl} alt="" width={44} height={44} style={{ objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>♪</span>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handlePlay(t, i); }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.opacity = "0"; }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: isCurrent ? "rgba(245,166,35,0.85)" : "rgba(27,58,75,0.7)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isCurrent ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
                aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
              >
                <span style={{ color: "white", fontSize: "0.75rem", marginLeft: isCurrent && isPlaying ? 0 : 2 }}>
                  {isCurrent && isPlaying ? "⏸" : "▶"}
                </span>
              </button>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: isCurrent ? "var(--color-accent)" : "#1b3a4b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: 0,
              }}>
                {t.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.0625rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{t.artistName}</span>
                {trackTags.length > 0 && (
                  <>
                    <span style={{ color: "#d1d5db", fontSize: "0.5rem" }}>•</span>
                    {trackTags.map((tag) => (
                      <span key={tag.slug} style={{ fontSize: "0.625rem", color: "#b0b0b0" }}>
                        {locale === "fr" ? tag.labelFr : tag.labelEn}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Progress bar */}
              {isActive && (
                <div style={{ marginTop: "0.25rem", height: 2, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    backgroundColor: "var(--color-accent)",
                    transition: "width 0.3s linear",
                  }} />
                </div>
              )}
            </div>

            {/* Duration */}
            <span style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
            }}>
              {formatDuration(t.durationSeconds)}
            </span>
          </div>
        );
      })}

      {/* Shuffle — clean inline link style */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button
          onClick={() => setShuffleKey((k) => k + 1)}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.8125rem",
            color: "#6b7280",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            transition: "color 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          {locale === "fr" ? "Découvrir d'autres morceaux" : "Discover more tracks"}
        </button>
      </div>
    </div>
  );
}
