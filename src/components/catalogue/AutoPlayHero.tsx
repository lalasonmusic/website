"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";

type Props = {
  tracks: TrackWithDetails[];
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

export default function AutoPlayHero({ tracks }: Props) {
  const hasAutoPlayed = useRef(false);
  const { currentTrack, playTrack } = usePlayerStore();

  useEffect(() => {
    // Only auto-play once, and only if nothing is already playing
    if (hasAutoPlayed.current || currentTrack || tracks.length === 0) return;
    hasAutoPlayed.current = true;

    // Pick a random track to play
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const track = tracks[randomIndex];
    if (track.previewPath) {
      playTrack(toPlayerTrack(track), tracks.map(toPlayerTrack), randomIndex);
    }
  }, [tracks, currentTrack, playTrack]);

  // This component renders nothing — it just triggers auto-play
  return null;
}
