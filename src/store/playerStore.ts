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
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  // True when a dedicated boutique player is mounted (hides the footer player)
  hasEmbeddedPlayer: boolean;
  // Active playlist name (set when playing from a playlist card)
  activePlaylistName: string | null;
  activePlaylistEmoji: string | null;
  activePlaylistTrackIds: string[] | null;
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
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setHasEmbeddedPlayer: (v: boolean) => void;
  setActivePlaylist: (name: string | null, emoji?: string | null, trackIds?: string[] | null) => void;
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
  shuffle: false,
  repeat: "off",
  hasEmbeddedPlayer: false,
  activePlaylistName: null,
  activePlaylistEmoji: null,
  activePlaylistTrackIds: null,

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
    const { queue, queueIndex, shuffle, repeat } = get();

    // Repeat one → restart current track
    if (repeat === "one") {
      set({ progress: 0, isPlaying: true, showSubscribeCta: false });
      return;
    }

    // Shuffle → pick random track (different from current)
    if (shuffle && queue.length > 1) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      set({ currentTrack: queue[randomIndex], queueIndex: randomIndex, progress: 0, isPlaying: true, showSubscribeCta: false });
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      set({ currentTrack: queue[nextIndex], queueIndex: nextIndex, progress: 0, isPlaying: true, showSubscribeCta: false });
    } else if (repeat === "all" && queue.length > 0) {
      // Loop back to start
      set({ currentTrack: queue[0], queueIndex: 0, progress: 0, isPlaying: true, showSubscribeCta: false });
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

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => ({
    repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
  })),
  setHasEmbeddedPlayer: (v) => set({ hasEmbeddedPlayer: v }),
  setActivePlaylist: (name, emoji = null, trackIds = null) =>
    set({ activePlaylistName: name, activePlaylistEmoji: emoji, activePlaylistTrackIds: trackIds }),

  stop: () => set({ isPlaying: false, currentTrack: null, progress: 0, showSubscribeCta: false }),
}));
