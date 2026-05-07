"use client";

import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { track as trackEvent } from "@/lib/analytics";
import type { BoutiqueTrack } from "@/lib/playlists/queries";
import type { PlayerTrack } from "@/types/track";

type Props = {
  tracks: BoutiqueTrack[];
  playlistName: string;
  playlistEmoji: string | null;
  playlistGradient: string;
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

export default function BoutiqueTrackList({ tracks, playlistName, playlistEmoji, playlistGradient }: Props) {
  const t = useTranslations("boutique.playlist");
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setActivePlaylist = usePlayerStore((s) => s.setActivePlaylist);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const playerTracks = tracks.map(toPlayerTrack);

  function handlePlay(index: number) {
    const playerTrack = playerTracks[index];
    trackEvent("track_play_boutique", {
      playlist: playlistName,
      track_title: playerTrack.title,
      artist: playerTrack.artistName,
      is_demo: !!playerTrack.isDemo,
      position: index,
    });
    setActivePlaylist(playlistName, playlistEmoji, playerTracks.map((p) => p.id));
    playTrack(playerTrack, playerTracks, index);
  }

  return (
    <ol className="boutique-track-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {tracks.map((track, index) => {
        const isCurrent = currentTrackId === track.id;
        const isCurrentlyPlaying = isCurrent && isPlaying;

        return (
          <li
            key={track.id}
            className={isCurrent ? "boutique-track-row boutique-track-row-active" : "boutique-track-row"}
            style={{ position: "relative" }}
          >
            {/* Active accent bar (left edge) */}
            {isCurrent && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: "70%",
                  borderRadius: 2,
                  backgroundColor: "var(--color-accent)",
                }}
              />
            )}

            {/* Cover thumbnail OR play button overlay (mutually exclusive on hover/active) */}
            <button
              type="button"
              onClick={() => handlePlay(index)}
              aria-label={t("playAriaLabel", { title: track.title, artist: track.artistName })}
              className="boutique-track-cover-btn"
              style={{
                position: "relative",
                width: 56,
                height: 56,
                flexShrink: 0,
                border: "none",
                borderRadius: 8,
                background: track.coverUrl
                  ? `center/cover no-repeat url(${track.coverUrl})`
                  : playlistGradient,
                overflow: "hidden",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {/* Always-visible dark overlay so the play icon is immediately
                  legible. Background is set via CSS class — see globals.css. */}
              <span
                aria-hidden="true"
                className="boutique-track-cover-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 200ms ease",
                  color: "white",
                }}
              >
                {isCurrentlyPlaying ? (
                  <NowPlayingBars />
                ) : isCurrent ? (
                  <Play size={20} strokeWidth={2.25} fill="currentColor" />
                ) : (
                  <Play size={18} strokeWidth={2.5} fill="currentColor" className="boutique-track-play-icon" />
                )}
              </span>
            </button>

            {/* Title + artist */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: isCurrent ? "var(--color-accent)" : "var(--color-text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.005em",
                }}
              >
                {track.title}
              </div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 2,
                }}
              >
                {track.artistName}
              </div>
            </div>

            {/* Demo badge — pushed right, before duration */}
            {track.isDemo && (
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "0.25rem 0.5rem",
                  borderRadius: 999,
                  backgroundColor: "rgba(245,166,35,0.15)",
                  color: "var(--color-accent)",
                  border: "1px solid rgba(245,166,35,0.35)",
                  flexShrink: 0,
                }}
                title={t("demoBadgeFull")}
              >
                {t("demoBadge")}
              </span>
            )}

            {/* Duration */}
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
                width: 44,
                textAlign: "right",
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

function NowPlayingBars() {
  return (
    <span aria-hidden="true" className="boutique-now-playing">
      <span />
      <span />
      <span />
    </span>
  );
}

