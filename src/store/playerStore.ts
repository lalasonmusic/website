import { create } from "zustand";
import type { PlayerTrack } from "@/types/track";

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isSubscribed: boolean;
  showSubscribeCta: boolean;
}

interface PlayerActions {
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[], index?: number) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  prev: () => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setIsSubscribed: (v: boolean) => void;
  setShowSubscribeCta: (v: boolean) => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isSubscribed: false,
  showSubscribeCta: false,

  playTrack: (track, queue, index = 0) => {
    set({
      currentTrack: track,
      queue: queue ?? [track],
      queueIndex: index,
      isPlaying: true,
      progress: 0,
      showSubscribeCta: false,
    });
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying, showSubscribeCta: false }));
  },

  seek: (seconds) => {
    set({ progress: seconds, showSubscribeCta: false });
  },

  next: () => {
    const { queue, queueIndex } = get();
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      set({ currentTrack: queue[nextIndex], queueIndex: nextIndex, progress: 0, isPlaying: true, showSubscribeCta: false });
    } else {
      set({ isPlaying: false });
    }
  },

  prev: () => {
    const { queue, queueIndex, progress } = get();
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      set({ currentTrack: queue[prevIndex], queueIndex: prevIndex, progress: 0, isPlaying: true, showSubscribeCta: false });
    }
  },

  setProgress: (seconds) => set({ progress: seconds }),
  setDuration: (seconds) => set({ duration: seconds }),
  setVolume: (volume) => set({ volume }),
  setIsSubscribed: (v) => set({ isSubscribed: v }),
  setShowSubscribeCta: (v) => set({ showSubscribeCta: v }),

  stop: () => set({ isPlaying: false, currentTrack: null, progress: 0, showSubscribeCta: false }),
}));
