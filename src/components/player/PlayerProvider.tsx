"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { track as trackEvent } from "@/lib/analytics";
import PlayerDesktop from "./PlayerDesktop";
import PlayerMobileMini from "./PlayerMobileMini";


type Props = {
  isSubscribed: boolean;
  canDownload: boolean;
};

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
      // Boutique preview cut: stop playback at the configured limit when the
      // user has no boutique access AND the current track is not the demo.
      // Reads store via getState() so the latest values are used without
      // needing to re-attach the listener on every store change.
      const { previewLimitSec, hasBoutiqueAccess, currentTrack: ct, isPreviewEnded } = usePlayerStore.getState();
      if (
        previewLimitSec != null &&
        !hasBoutiqueAccess &&
        ct &&
        !ct.isDemo &&
        audio.currentTime >= previewLimitSec &&
        !isPreviewEnded
      ) {
        audio.pause();
        usePlayerStore.setState({ isPlaying: false, isPreviewEnded: true });
        // Strong CRO signal: visitor heard 30s of a non-demo track and got
        // capped. Captures intent to listen → friction → conversion opportunity.
        trackEvent("boutique_preview_cut", {
          track_title: ct.title,
          artist: ct.artistName,
        });
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      // Disable auto-chain when playing inside a boutique playlist context
      // (PRD §3 / Story 3 — manual track-by-track listening only).
      const { activePlaylistAudience } = usePlayerStore.getState();
      if (activePlaylistAudience === "boutique") {
        usePlayerStore.setState({ isPlaying: false });
        return;
      }
      next();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setProgress, setDuration, next]);

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
