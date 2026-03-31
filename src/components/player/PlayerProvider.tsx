"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { track } from "@/lib/analytics";
import PlayerDesktop from "./PlayerDesktop";
import PlayerMobileMini from "./PlayerMobileMini";
import PlayerMobileExpanded from "./PlayerMobileExpanded";

type Props = {
  isSubscribed: boolean;
};

const PREVIEW_LIMIT_SECONDS = 30;

export default function PlayerProvider({ isSubscribed }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signedUrlCache = useRef<Map<string, string>>(new Map());

  const {
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    setShowSubscribeCta,
    setIsSubscribed,
    next,
  } = usePlayerStore();

  // Sync isSubscribed from server
  useEffect(() => {
    setIsSubscribed(isSubscribed);
  }, [isSubscribed, setIsSubscribed]);

  // Init audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);

      if (!isSubscribed && audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
        audio.pause();
        setShowSubscribeCta(true);
        usePlayerStore.setState({ isPlaying: false });
        const { currentTrack: ct } = usePlayerStore.getState();
        track("preview_ended", { trackId: ct?.id, trackTitle: ct?.title });
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => next();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isSubscribed, setProgress, setDuration, setShowSubscribeCta, next]);

  // React to currentTrack changes → load new audio
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    async function loadAndPlay() {
      let url: string | null = null;

      if (isSubscribed && currentTrack!.fullPath) {
        const cached = signedUrlCache.current.get(currentTrack!.id);
        if (cached) {
          url = cached;
        } else {
          const res = await fetch(`/api/tracks/${currentTrack!.id}/signed-url`);
          if (res.ok) {
            const data = await res.json();
            url = data.url;
            signedUrlCache.current.set(currentTrack!.id, data.url);
          }
        }
      }

      if (!url) {
        url = currentTrack!.previewPath;
      }

      if (!url) return;

      audio!.src = url;
      audio!.load();
      audio!.currentTime = 0;
      audio!.play().catch(() => {
        usePlayerStore.setState({ isPlaying: false });
      });
    }

    loadAndPlay();
  }, [currentTrack?.id, isSubscribed]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {
        usePlayerStore.setState({ isPlaying: false });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Expose seek to store
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.progress !== prev.progress && audioRef.current) {
        const diff = Math.abs(audioRef.current.currentTime - state.progress);
        if (diff > 1) {
          audioRef.current.currentTime = state.progress;
        }
      }
    });
    return unsub;
  }, []);

  // Audio-only provider — visual player is handled by FloatingPlayer
  return null;
}
