"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";
import { track as trackEvent } from "@/lib/analytics";
import { Download } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

type Props = {
  track: TrackWithDetails;
  queue: TrackWithDetails[];
  queueIndex: number;
  locale: string;
  isSubscribed: boolean;
  canDownload?: boolean;
  isFavorite?: boolean;
  canFavorite?: boolean;
  /** Slugs of currently active filters — these tags are displayed first */
  activeFilterSlugs?: string[];
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

function DownloadButton({ trackId, trackTitle, artistName, locale }: { trackId: string; trackTitle: string; artistName: string; locale: string }) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  async function handleDownload(format: "mp3" | "wav") {
    if (loading) return;
    setLoading(true);
    setShowMenu(false);

    try {
      const res = await fetch(`/api/tracks/${trackId}/signed-url?format=${format}`);
      if (!res.ok) return;
      const { url } = await res.json();

      trackEvent("track_download", { trackId, trackTitle, artistName, format });

      // Fetch as blob for reliable cross-origin download
      const fileRes = await fetch(url);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${artistName} - ${trackTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "wait" : "pointer",
          padding: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 0.5 : 0.6,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? "0.5" : "0.6"; }}
        aria-label="Download"
      >
        <Download size={16} color="#1b3a4b" strokeWidth={2} />
      </button>

      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            zIndex: 20,
            marginTop: 4,
            background: "var(--color-bg-secondary)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            minWidth: 120,
          }}
        >
          <button
            onClick={() => handleDownload("mp3")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "0.625rem 1rem",
              background: "none",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              color: "white",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <Download size={14} />
            MP3
          </button>
          <button
            onClick={() => handleDownload("wav")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "0.625rem 1rem",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <Download size={14} />
            WAV
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrackCard({ track, queue, queueIndex, locale, isSubscribed, canDownload = isSubscribed, isFavorite = false, canFavorite = false, activeFilterSlugs = [] }: Props) {
  const { currentTrack, isPlaying, progress, duration, playTrack, togglePlay } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isActive = isCurrentTrack && (isPlaying || progress > 0);
  const progressPercent = isCurrentTrack && duration > 0 ? (progress / duration) * 100 : 0;
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

  // Surface the categories that match an active filter first, so the user
  // always sees why a track was returned even if it has 4+ tags.
  const activeFilterSet = new Set(activeFilterSlugs);
  const sortedCategories = [...track.categories].sort((a, b) => {
    const aActive = activeFilterSet.has(a.slug) ? 0 : 1;
    const bActive = activeFilterSet.has(b.slug) ? 0 : 1;
    return aActive - bActive;
  });
  const tags = sortedCategories.slice(0, 3);

  // NEW badge is server-driven: only the top 20 most-recently-uploaded tracks
  // get isNew=true (computed in the catalogue page).
  const isNew = track.isNew === true;

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
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
          {isNew && (
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.5625rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                padding: "0.15rem 0.4rem",
                borderRadius: 4,
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              {locale === "fr" ? "NOUVEAU" : "NEW"}
            </span>
          )}
        </div>
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

        {/* Progress bar — visible when this track is active */}
        {isActive && (
          <div style={{
            marginTop: "0.375rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <div style={{
              flex: 1,
              height: 3,
              backgroundColor: "rgba(0,0,0,0.08)",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${progressPercent}%`,
                backgroundColor: "var(--color-accent)",
                borderRadius: 2,
                transition: "width 0.3s linear",
              }} />
            </div>
            <span style={{ fontSize: "0.6875rem", color: "#9ca3af", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(Math.floor(progress))}
            </span>
          </div>
        )}
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

      {/* Favorite button — Creators only */}
      {canFavorite && (
        <FavoriteButton trackId={track.id} initialFavorite={isFavorite} />
      )}

      {/* Download button — subscribers only */}
      {canDownload && track.fullPath && (
        <DownloadButton trackId={track.id} trackTitle={track.title} artistName={track.artistName} locale={locale} />
      )}
    </div>
  );
}
