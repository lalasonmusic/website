"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerTrack } from "@/types/track";

type ApiPlaylist = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  gradient: string;
  emoji: string | null;
  trackCount: number;
  tracks: {
    id: string;
    slug: string;
    title: string;
    artistName: string;
    durationSeconds: number | null;
    coverUrl: string | null;
    previewPath: string | null;
    fullPath: string | null;
  }[];
};

type Props = {
  locale: string;
};

export default function PlaylistCarousel({ locale }: Props) {
  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const { playTrack, setActivePlaylist } = usePlayerStore();

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => {
        setPlaylists(data.playlists ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handlePlay(playlist: ApiPlaylist) {
    if (playlist.tracks.length === 0) return;
    const playerTracks: PlayerTrack[] = playlist.tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artistName,
      durationSeconds: t.durationSeconds ?? 0,
      coverUrl: t.coverUrl,
      previewPath: t.previewPath,
      fullPath: t.fullPath,
    }));
    const name = locale === "fr" ? playlist.nameFr : playlist.nameEn;
    setActivePlaylist(name, playlist.emoji);
    playTrack(playerTracks[0], playerTracks, 0);
    setActivePlaylistId(playlist.id);
  }

  if (loading) {
    return (
      <div style={{ padding: "1.5rem 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
        ...
      </div>
    );
  }

  if (playlists.length === 0) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "white", margin: 0 }}>
          {locale === "fr" ? "🎵 Playlists d'ambiance" : "🎵 Mood playlists"}
        </h2>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {locale === "fr" ? "Lancez et oubliez" : "Press play & forget"}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
        className="playlist-scroll"
      >
        {playlists.map((p) => {
          const isActive = activePlaylistId === p.id;
          const name = locale === "fr" ? p.nameFr : p.nameEn;
          const description = locale === "fr" ? p.descriptionFr : p.descriptionEn;

          return (
            <button
              key={p.id}
              onClick={() => handlePlay(p)}
              style={{
                flexShrink: 0,
                width: "200px",
                aspectRatio: "1 / 1.15",
                borderRadius: "16px",
                background: p.gradient,
                border: isActive ? "2px solid #f5a623" : "2px solid transparent",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                textAlign: "left",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                scrollSnapAlign: "start",
                transition: "transform 0.2s, box-shadow 0.2s",
                fontFamily: "inherit",
                color: "white",
                boxShadow: isActive
                  ? "0 8px 32px rgba(245,166,35,0.35)"
                  : "0 4px 16px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Emoji top-left */}
              <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>{p.emoji ?? "🎵"}</div>

              {/* Bottom info */}
              <div>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 800,
                    margin: "0 0 0.25rem",
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {name}
                </p>
                {description && (
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      color: "rgba(255,255,255,0.85)",
                      margin: "0 0 0.5rem",
                      lineHeight: 1.3,
                      textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {description}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 600,
                    }}
                  >
                    {p.trackCount} {locale === "fr" ? "morceaux" : "tracks"}
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.95)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1b3a4b">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
