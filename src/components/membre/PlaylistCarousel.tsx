"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerTrack } from "@/types/track";
import { getBoutiqueImage } from "@/lib/boutique/playlist-images";
import { getBoutiqueIcon } from "@/components/boutique/playlist-icons";
import BoutiqueCarousel from "@/components/boutique/BoutiqueCarousel";

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
    const trackIds = playlist.tracks.map((t) => t.id);
    setActivePlaylist(name, playlist.emoji, trackIds);
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
          {locale === "fr" ? "Playlists d'ambiance" : "Mood playlists"}
        </h2>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {locale === "fr" ? "Lancez et oubliez" : "Press play & forget"}
        </p>
      </div>

      <BoutiqueCarousel>
        {playlists.map((p) => {
          const isActive = activePlaylistId === p.id;
          const name = locale === "fr" ? p.nameFr : p.nameEn;
          const imageUrl = getBoutiqueImage(p.slug);
          const lucideIcon = getBoutiqueIcon(p.slug);
          const countLabel = `${p.trackCount} ${locale === "fr" ? (p.trackCount === 1 ? "morceau" : "morceaux") : (p.trackCount === 1 ? "track" : "tracks")}`;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePlay(p)}
              className="boutique-playlist-card"
              aria-label={`${name} — ${countLabel}`}
              style={{
                position: "relative",
                display: "block",
                borderRadius: 16,
                overflow: "hidden",
                background: p.gradient,
                cursor: "pointer",
                color: "white",
                aspectRatio: "4 / 5",
                border: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                padding: 0,
                fontFamily: "inherit",
                textAlign: "left",
                transition: "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms ease, border-color 240ms ease",
                boxShadow: isActive
                  ? "0 8px 32px rgba(245,166,35,0.35)"
                  : "0 4px 16px rgba(0,0,0,0.18)",
              }}
            >
              {/* Photo background (grayscale) — only for boutique playlists with mapped image */}
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="boutique-playlist-card-image"
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "grayscale(1)",
                    transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              )}

              {/* Coloured tint over photo (duotone) */}
              {imageUrl && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: p.gradient,
                    mixBlendMode: "multiply",
                    opacity: 0.55,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Bottom dark gradient for legibility */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: imageUrl
                    ? "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.75) 100%)"
                    : "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Top-left icon chip — Lucide if mapped, otherwise emoji fallback */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.125rem",
                }}
              >
                {lucideIcon ?? p.emoji ?? "🎵"}
              </div>

              {/* Title + count + play button anchored bottom */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "1.25rem 1.25rem 1.125rem",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      margin: "0 0 0.25rem",
                      color: "white",
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      textShadow: imageUrl ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
                    }}
                  >
                    {name}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {countLabel}
                  </div>
                </div>

                {/* Play button (white circle) */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.95)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    color: "#1b3a4b",
                  }}
                >
                  <Play size={16} strokeWidth={2.5} fill="currentColor" />
                </div>
              </div>
            </button>
          );
        })}
      </BoutiqueCarousel>
    </div>
  );
}
