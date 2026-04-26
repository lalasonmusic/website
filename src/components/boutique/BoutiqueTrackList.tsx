"use client";

import { useTranslations } from "next-intl";
import { usePlayerStore } from "@/store/playerStore";
import type { BoutiqueTrack } from "@/lib/playlists/queries";
import type { PlayerTrack } from "@/types/track";

type Props = {
  tracks: BoutiqueTrack[];
  playlistName: string;
  playlistEmoji: string | null;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toPlayerTrack(t: BoutiqueTrack): PlayerTrack {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    artistName: t.artistName,
    durationSeconds: t.durationSeconds ?? 0,
    coverUrl: t.coverUrl,
    previewPath: t.previewPath,
    fullPath: t.fullPath,
    isDemo: t.isDemo,
  };
}

export default function BoutiqueTrackList({ tracks, playlistName, playlistEmoji }: Props) {
  const t = useTranslations("boutique.playlist");
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setActivePlaylist = usePlayerStore((s) => s.setActivePlaylist);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const playerTracks = tracks.map(toPlayerTrack);

  function handlePlay(index: number) {
    const track = playerTracks[index];
    setActivePlaylist(playlistName, playlistEmoji, playerTracks.map((p) => p.id));
    playTrack(track, playerTracks, index);
  }

  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {tracks.map((track, index) => {
        const isCurrent = currentTrackId === track.id;
        const isCurrentlyPlaying = isCurrent && isPlaying;

        return (
          <li
            key={track.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.875rem 1rem",
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: isCurrent ? "var(--color-bg-secondary)" : "transparent",
              transition: "background-color 150ms ease",
            }}
          >
            {/* Position / play button */}
            <button
              type="button"
              onClick={() => handlePlay(index)}
              aria-label={t("playAriaLabel", { title: track.title, artist: track.artistName })}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: isCurrent ? "var(--color-accent)" : "transparent",
                color: isCurrent ? "var(--color-accent-text)" : "var(--color-text-primary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                flexShrink: 0,
              }}
              className="boutique-track-play"
            >
              {isCurrentlyPlaying ? "⏸" : isCurrent ? "▶" : index + 1}
            </button>

            {/* Title + artist */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
                {track.isDemo && (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-accent)",
                      color: "var(--color-accent-text)",
                      flexShrink: 0,
                    }}
                    title={t("demoBadgeFull")}
                  >
                    {t("demoBadge")}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {track.artistName}
              </div>
            </div>

            {/* Duration */}
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {formatDuration(track.durationSeconds)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
