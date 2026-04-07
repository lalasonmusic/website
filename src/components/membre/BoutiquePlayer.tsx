"use client";

import { useState, useCallback } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { TrackWithDetails, PlayerTrack } from "@/types/track";

type Props = {
  tracks: TrackWithDetails[];
  locale: string;
  moodFilters: { slug: string; label: string }[];
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function artistGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 45%, 22%) 0%, hsl(${h2}, 55%, 12%) 100%)`;
}

function artistInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function BoutiquePlayer({ tracks, locale, moodFilters }: Props) {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    queue,
    queueIndex,
    shuffle,
    repeat,
    playTrack,
    togglePlay,
    seek,
    next,
    prev,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  // Filter tracks by mood
  const filteredTracks = activeMood
    ? tracks.filter((t) => t.categories.some((c) => c.slug === activeMood))
    : tracks;

  const playerTracks = filteredTracks.map(toPlayerTrack);

  const handlePlayTrack = useCallback(
    (index: number) => {
      playTrack(playerTracks[index], playerTracks, index);
    },
    [playerTracks, playTrack]
  );

  const handlePlayAll = useCallback(() => {
    if (playerTracks.length > 0) {
      playTrack(playerTracks[0], playerTracks, 0);
    }
  }, [playerTracks, playTrack]);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const nowPlaying = currentTrack;
  const gradient = nowPlaying ? artistGradient(nowPlaying.artistName) : "linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)";

  return (
    <div className="space-y-6">
      {/* ── Now Playing Hero ── */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ background: gradient }}
      >
        {/* Content */}
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* Artist visual */}
          <div
            className="w-40 h-40 md:w-48 md:h-48 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: nowPlaying
                ? `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`
                : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {nowPlaying?.coverUrl ? (
              <img src={nowPlaying.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <p className="text-5xl font-extrabold text-white/20 mb-2">
                  {nowPlaying ? artistInitials(nowPlaying.artistName) : "♪"}
                </p>
                {nowPlaying && (
                  <p className="text-xs text-white/30 font-medium">
                    {nowPlaying.artistName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Track info + controls */}
          <div className="flex-1 text-center md:text-left min-w-0">
            {nowPlaying ? (
              <>
                <p className="text-sm text-white/40 font-medium mb-1">
                  {locale === "fr" ? "En cours de lecture" : "Now playing"}
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1 truncate">
                  {nowPlaying.title}
                </h2>
                <p className="text-lg text-white/60 font-medium mb-6">
                  {nowPlaying.artistName}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-white/40 mb-2">
                  {locale === "fr" ? "Votre player en boutique" : "Your in-store player"}
                </h2>
                <p className="text-sm text-white/30 mb-6">
                  {locale === "fr"
                    ? "Lancez la lecture pour créer l'ambiance."
                    : "Start playing to set the mood."}
                </p>
              </>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs text-white/40 font-mono w-10 text-right">
                {nowPlaying ? formatTime(progress) : "0:00"}
              </span>
              <div
                className="flex-1 h-1.5 rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.1)" }}
                onClick={(e) => {
                  if (!duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seek(ratio * duration);
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, var(--color-accent), #e8961a)",
                  }}
                />
              </div>
              <span className="text-xs text-white/40 font-mono w-10">
                {duration > 0 ? formatTime(duration) : "--:--"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className="p-2 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  background: shuffle ? "rgba(245,166,35,0.15)" : "none",
                  color: shuffle ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                  border: "none",
                }}
                aria-label="Shuffle"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
              </button>

              {/* Prev */}
              <button
                onClick={prev}
                className="p-2 cursor-pointer"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)" }}
                aria-label="Previous"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={nowPlaying ? togglePlay : handlePlayAll}
                className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                  border: "none",
                  color: "var(--color-accent-text)",
                  boxShadow: "0 4px 20px rgba(245,166,35,0.3)",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                onClick={next}
                className="p-2 cursor-pointer"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)" }}
                aria-label="Next"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className="p-2 rounded-full transition-all duration-200 cursor-pointer relative"
                style={{
                  background: repeat !== "off" ? "rgba(245,166,35,0.15)" : "none",
                  color: repeat !== "off" ? "var(--color-accent)" : "rgba(255,255,255,0.4)",
                  border: "none",
                }}
                aria-label="Repeat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 014-4h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                {repeat === "one" && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-[var(--color-accent)]">1</span>
                )}
              </button>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2 ml-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{ width: 80, accentColor: "var(--color-accent)", height: 3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mood Filters ── */}
      {moodFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveMood(null)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: !activeMood ? "var(--color-accent)" : "rgba(255,255,255,0.06)",
              color: !activeMood ? "var(--color-accent-text)" : "rgba(255,255,255,0.5)",
              border: !activeMood ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {locale === "fr" ? "Tout" : "All"}
          </button>
          {moodFilters.map((mood) => (
            <button
              key={mood.slug}
              onClick={() => setActiveMood(activeMood === mood.slug ? null : mood.slug)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: activeMood === mood.slug ? "var(--color-accent)" : "rgba(255,255,255,0.06)",
                color: activeMood === mood.slug ? "var(--color-accent-text)" : "rgba(255,255,255,0.5)",
                border: activeMood === mood.slug ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {mood.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Queue ── */}
      <div
        className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/60">
            {locale === "fr" ? "File d'attente" : "Queue"}
            <span className="text-white/30 font-normal ml-2">({filteredTracks.length})</span>
          </h3>
          {!nowPlaying && filteredTracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-accent-text)",
                border: "none",
              }}
            >
              {locale === "fr" ? "Tout lancer" : "Play all"}
            </button>
          )}
        </div>

        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredTracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(index)}
                className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150"
                style={{
                  background: isCurrent ? "rgba(245,166,35,0.08)" : index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  borderLeft: isCurrent ? "3px solid var(--color-accent)" : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"; }}
              >
                {/* Track number or playing indicator */}
                <span className="w-6 text-center shrink-0">
                  {isCurrent && isPlaying ? (
                    <span className="text-[var(--color-accent)] text-sm">♪</span>
                  ) : (
                    <span className="text-xs text-white/25">{index + 1}</span>
                  )}
                </span>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[var(--color-accent)]" : "text-white/80"}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-white/40 truncate">{track.artistName}</p>
                </div>

                {/* Duration */}
                <span className="text-xs text-white/30 shrink-0 font-mono">
                  {formatTime(track.durationSeconds ?? 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
