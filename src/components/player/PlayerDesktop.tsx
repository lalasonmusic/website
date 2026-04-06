"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { track as trackEvent } from "@/lib/analytics";

function DownloadMenu({ trackId, trackTitle, artistName }: { trackId: string; trackTitle: string; artistName: string }) {
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
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "wait" : "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 0.4 : 0.6,
          transition: "opacity 0.15s",
          color: "white",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? "0.4" : "0.6"; }}
        aria-label="Download"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
      {showMenu && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 6,
            background: "var(--color-bg-secondary)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            minWidth: 110,
            zIndex: 110,
          }}
        >
          {(["mp3", "wav"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleDownload(fmt)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "0.5rem 0.875rem",
                background: "none",
                border: "none",
                borderBottom: fmt === "mp3" ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerDesktop() {
  const locale = useLocale();
  const pathname = usePathname();
  const onCatalogue = pathname.includes("/catalogue");
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isSubscribed,
    showSubscribeCta,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="player-desktop"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: "rgba(15, 37, 51, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        zIndex: 100,
        display: "none",
        alignItems: "center",
        padding: "0 1.25rem",
        gap: "0.875rem",
      }}
    >
      {/* Cover + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: "0 0 auto" }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 5,
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
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
        </div>
        <div style={{ overflow: "hidden", maxWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <p style={{
              fontWeight: 600,
              fontSize: "0.75rem",
              color: "white",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}>
              {currentTrack.title}
            </p>
            {!isSubscribed && (
              <span style={{
                fontSize: "0.5rem",
                color: "var(--color-accent)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                flexShrink: 0,
                border: "1px solid rgba(245,166,35,0.3)",
                borderRadius: 3,
                padding: "0.0625rem 0.25rem",
              }}>
                {locale === "fr" ? "Extrait" : "Preview"}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {currentTrack.artistName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button onClick={prev} style={controlBtn} aria-label="Previous">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button
          onClick={togglePlay}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "var(--color-accent)",
            border: "none",
            color: "var(--color-accent-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={next} style={controlBtn} aria-label="Next">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      {/* Progress */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", minWidth: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {formatTime(progress)}
        </span>
        <div
          style={{
            flex: 1,
            height: 3,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            cursor: "pointer",
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * (duration || 0));
          }}
        >
          <div style={{
            height: "100%",
            backgroundColor: "var(--color-accent)",
            borderRadius: 2,
            width: `${progressPercent}%`,
            transition: "width 0.3s linear",
          }} />
        </div>
        <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", minWidth: 24, fontVariantNumeric: "tabular-nums" }}>
          {duration > 0 ? formatTime(duration) : "--:--"}
        </span>
      </div>

      {/* Download button — subscribers only */}
      {isSubscribed && currentTrack.fullPath && (
        <DownloadMenu trackId={currentTrack.id} trackTitle={currentTrack.title} artistName={currentTrack.artistName} />
      )}

      {/* CTA link — adapts based on context */}
      <Link
        href={!isSubscribed && onCatalogue ? `/${locale}/abonnements` : `/${locale}/catalogue`}
        style={{
          fontSize: "0.6875rem",
          color: "var(--color-accent)",
          textDecoration: "none",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {!isSubscribed && onCatalogue
          ? (locale === "fr" ? "Nos offres →" : "Our plans →")
          : (locale === "fr" ? "Catalogue →" : "Browse →")
        }
      </Link>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ width: 50, accentColor: "var(--color-accent)", height: 2 }}
        />
      </div>

      {/* Subscribe CTA overlay */}
      {showSubscribeCta && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15,37,51,0.95)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          borderTop: "1px solid rgba(245,166,35,0.2)",
          borderRadius: 0,
        }}>
          <p style={{ fontWeight: 500, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {locale === "fr" ? "Ce morceau continue..." : "This track continues..."}
          </p>
          <Link
            href={`/${locale}/abonnements`}
            style={{
              padding: "0.375rem 1rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              borderRadius: "9999px",
              textDecoration: "none",
              fontSize: "0.75rem",
            }}
          >
            {locale === "fr" ? "S'abonner" : "Subscribe"} →
          </Link>
          <Link
            href={`/${locale}/catalogue`}
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}
          >
            {locale === "fr" ? "Explorer le catalogue" : "Browse catalogue"}
          </Link>
        </div>
      )}
    </div>
  );
}

const controlBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.5)",
  cursor: "pointer",
  padding: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
