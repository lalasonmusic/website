"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { track } from "@/lib/analytics";
import PlayerDesktop from "./PlayerDesktop";
import PlayerMobileMini from "./PlayerMobileMini";


type Props = {
  isSubscribed: boolean;
  canDownload: boolean;
};

const PREVIEW_LIMIT_SECONDS = 30;

export default function PlayerProvider({ isSubscribed, canDownload }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signedUrlCache = useRef<Map<string, string>>(new Map());
  const subscribedRef = useRef(isSubscribed);
  // Tracks the current track ID being loaded to avoid race conditions
  const loadingTrackIdRef = useRef<string | null>(null);
  // Set to true when we're loading a brand new track (to prevent the isPlaying useEffect from firing audio.play() prematurely)
  const isLoadingNewTrackRef = useRef(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    setShowSubscribeCta,
    setIsSubscribed,
    setCanDownload,
    next,
  } = usePlayerStore();

  // Sync isSubscribed + canDownload from server
  useEffect(() => {
    subscribedRef.current = isSubscribed;
    setIsSubscribed(isSubscribed);
  }, [isSubscribed, setIsSubscribed]);

  useEffect(() => {
    setCanDownload(canDownload);
  }, [canDownload, setCanDownload]);

  // Init audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Preload "auto" tells the browser to start buffering immediately
      audioRef.current.preload = "auto";
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);

      if (!subscribedRef.current && audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
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
  }, [setProgress, setDuration, setShowSubscribeCta, next]);

  // React to currentTrack changes → load new audio + play immediately
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;
    const trackId = currentTrack.id;
    loadingTrackIdRef.current = trackId;
    isLoadingNewTrackRef.current = true;

    async function loadAndPlay() {
      let url: string | null = null;

      // Always try full track via API if path exists
      if (currentTrack!.fullPath) {
        const cached = signedUrlCache.current.get(currentTrack!.id);
        if (cached) {
          url = cached;
        } else {
          try {
            const res = await fetch(`/api/tracks/${currentTrack!.id}/signed-url`);
            if (res.ok) {
              const data = await res.json();
              url = data.url;
              signedUrlCache.current.set(currentTrack!.id, data.url);
              // Sync subscription status if the server confirms access
              if (!subscribedRef.current) {
                subscribedRef.current = true;
                setIsSubscribed(true);
              }
            }
          } catch {}
        }
      }

      // Fallback to preview
      if (!url) {
        url = currentTrack!.previewPath;
      }

      if (!url) {
        isLoadingNewTrackRef.current = false;
        return;
      }

      // Abort if a newer track started loading in the meantime
      if (loadingTrackIdRef.current !== trackId) return;

      // Pause current playback before swapping src to avoid AbortError
      audio!.pause();
      audio!.src = url;
      audio!.load();
      audio!.currentTime = 0;

      // Wait for canplay event before calling play() to avoid double-click issue
      const playWhenReady = () => {
        if (loadingTrackIdRef.current !== trackId) return;
        audio!.play().catch(() => {
          usePlayerStore.setState({ isPlaying: false });
        }).finally(() => {
          isLoadingNewTrackRef.current = false;
        });
      };

      // If already buffered enough (HAVE_FUTURE_DATA = 3 or HAVE_ENOUGH_DATA = 4), play immediately
      if (audio!.readyState >= 3) {
        playWhenReady();
      } else {
        const handleCanPlay = () => {
          audio!.removeEventListener("canplay", handleCanPlay);
          playWhenReady();
        };
        audio!.addEventListener("canplay", handleCanPlay);
      }
    }

    loadAndPlay();
  }, [currentTrack?.id, setIsSubscribed]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to isPlaying changes (only for pause/resume of an already-loaded track)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    // Don't fire play() while a new track is still loading — the load effect handles it
    if (isLoadingNewTrackRef.current) return;

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

  return (
    <>
      <PlayerDesktop />
      <PlayerMobileMini />
    </>
  );
}
