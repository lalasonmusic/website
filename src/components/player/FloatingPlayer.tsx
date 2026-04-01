"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";
import { track as trackEvent } from "@/lib/analytics";

type Props = {
  tracks: TrackWithDetails[];
  locale: string;
};

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

/**
 * Headless auto-play trigger for the homepage.
 * Starts a random track on mount — the bottom bar (PlayerDesktop/PlayerMobileMini)
 * handles all visual playback UI.
 */
export default function FloatingPlayer({ tracks }: Props) {
  const hasAutoPlayed = useRef(false);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    if (hasAutoPlayed.current || tracks.length === 0) return;
    hasAutoPlayed.current = true;

    const randomIndex = Math.floor(Math.random() * tracks.length);
    const t = tracks[randomIndex];
    if (t.previewPath) {
      trackEvent("track_play", {
        trackId: t.id,
        trackTitle: t.title,
        artistName: t.artistName,
        source: "auto_play_homepage",
      });
      playTrack(toPlayerTrack(t), tracks.map(toPlayerTrack), randomIndex);
    }
  }, [tracks, playTrack]);

  return null;
}
