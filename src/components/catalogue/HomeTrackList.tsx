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

const GENRE_GRADIENTS: Record<string, string> = {
  "chill-out": "linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #0f4c75 100%)",
  "cinematique": "linear-gradient(135deg, #6b0f1a 0%, #b91d3a 50%, #d4a24e 100%)",
  "electronique": "linear-gradient(135deg, #4a1a6b 0%, #8b3fa0 50%, #c060d0 100%)",
  "funk-jazz": "linear-gradient(135deg, #c06014 0%, #e8961a 50%, #f5c842 100%)",
  "hip-hop-urban": "linear-gradient(135deg, #2d1b4e 0%, #e8641a 50%, #2d1b4e 100%)",
  "lo-fi": "linear-gradient(135deg, #2d4a3e 0%, #5a8a72 50%, #8bc4a8 100%)",
  "pop-rock": "linear-gradient(135deg, #c44569 0%, #e84393 50%, #fd79a8 100%)",
  "world": "linear-gradient(135deg, #0a6b4f 0%, #2ecc71 50%, #55e6a5 100%)",
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d3436 0%, #636e72 50%, #b2bec3 100%)",
  "linear-gradient(135deg, #6c3483 0%, #9b59b6 50%, #c39bd3 100%)",
  "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #3a7bd5 100%)",
  "linear-gradient(135deg, #b24592 0%, #f15f79 50%, #f7b733 100%)",
  "linear-gradient(135deg, #134e5e 0%, #71b280 50%, #134e5e 100%)",
];

function getTrackGradient(track: TrackWithDetails, index: number): string {
  const styleTag = track.categories.find((c) => c.type === "STYLE");
  if (styleTag && GENRE_GRADIENTS[styleTag.slug]) {
    return GENRE_GRADIENTS[styleTag.slug];
  }
  return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
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
    return shuffleArray(tracks).slice(0, 6);
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
    <div>
      {/* 3x2 visual card grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1.25rem",
      }}>
        {displayTracks.map((t, i) => {
          const isCurrent = currentTrack?.id === t.id;
          const isActive = isCurrent && (isPlaying || progress > 0);
          const progressPercent = isCurrent && duration > 0 ? (progress / duration) * 100 : 0;
          const mainTag = t.categories[0];

          return (
            <div
              key={t.id}
              onClick={() => handlePlay(t, i)}
              style={{ cursor: "pointer" }}
            >
              {/* Cover area */}
              <div
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector("div") as HTMLDivElement;
                  if (img) img.style.transform = "scale(1.05)";
                  const overlay = e.currentTarget.querySelector("[data-overlay]") as HTMLDivElement;
                  if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector("div") as HTMLDivElement;
                  if (img) img.style.transform = "scale(1)";
                  const overlay = e.currentTarget.querySelector("[data-overlay]") as HTMLDivElement;
                  if (overlay && !isCurrent) overlay.style.opacity = "0";
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#1b3a4b",
                }}
              >
                {/* Cover image or gradient */}
                <div style={{
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.3s ease",
                }}>
                  {t.coverUrl ? (
                    <img
                      src={t.coverUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      background: getTrackGradient(t, i),
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}>
                      <span style={{ fontSize: "2.5rem", opacity: 0.3 }}>♪</span>
                      {mainTag && (
                        <span style={{
                          fontSize: "0.6875rem",
                          color: "rgba(255,255,255,0.4)",
                          fontWeight: 500,
                        }}>
                          {locale === "fr" ? mainTag.labelFr : mainTag.labelEn}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Play overlay */}
                <div
                  data-overlay=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isCurrent ? 1 : 0,
                    transition: "opacity 0.25s ease",
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: isCurrent ? "var(--color-accent)" : "rgba(255,255,255,0.95)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}>
                    <span style={{
                      fontSize: "1.125rem",
                      color: isCurrent ? "var(--color-accent-text)" : "#1b3a4b",
                      marginLeft: isCurrent && isPlaying ? 0 : 3,
                    }}>
                      {isCurrent && isPlaying ? "⏸" : "▶"}
                    </span>
                  </div>
                </div>

                {/* Progress bar at bottom */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      backgroundColor: "var(--color-accent)",
                      transition: "width 0.3s linear",
                    }} />
                  </div>
                )}

                {/* Duration badge */}
                <span style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: "0.125rem 0.375rem",
                  borderRadius: 4,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {formatDuration(t.durationSeconds)}
                </span>
              </div>

              {/* Title + Artist below cover */}
              <div style={{ padding: "0.5rem 0.25rem 0" }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: isCurrent ? "var(--color-accent)" : "#1b3a4b",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {t.title}
                </p>
                <p style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  margin: "0.125rem 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {t.artistName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shuffle */}
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
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

      {/* Conversion CTA */}
      <div style={{
        textAlign: "center",
        marginTop: "2rem",
        padding: "1.5rem",
        backgroundColor: "rgba(27, 58, 75, 0.04)",
        borderRadius: 12,
      }}>
        <p style={{
          fontSize: "1.0625rem",
          fontWeight: 600,
          color: "#1b3a4b",
          margin: "0 0 0.25rem",
        }}>
          {locale === "fr"
            ? "Vous aimez ce que vous entendez ?"
            : "Like what you hear?"}
        </p>
        <p style={{
          fontSize: "0.875rem",
          color: "#6b7280",
          margin: "0 0 1rem",
        }}>
          {locale === "fr"
            ? "Accédez à tout le catalogue en illimité, téléchargements inclus."
            : "Get unlimited access to the full catalogue, downloads included."}
        </p>
        <a
          href={`/${locale}/abonnements`}
          style={{
            display: "inline-block",
            padding: "0.625rem 1.75rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            borderRadius: "9999px",
            textDecoration: "none",
            marginRight: "0.75rem",
          }}
        >
          {locale === "fr" ? "Voir les offres" : "See plans"}
        </a>
        <a
          href={`/${locale}/catalogue`}
          style={{
            display: "inline-block",
            padding: "0.625rem 1.75rem",
            color: "#1b3a4b",
            fontWeight: 500,
            fontSize: "0.9375rem",
            borderRadius: "9999px",
            textDecoration: "none",
            border: "1px solid #d1d5db",
          }}
        >
          {locale === "fr" ? "Explorer le catalogue" : "Browse catalogue"}
        </a>
      </div>
    </div>
  );
}
