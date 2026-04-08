"use client";

import { useState } from "react";

type Props = {
  trackId: string;
  initialFavorite: boolean;
};

export default function FavoriteButton({ trackId, initialFavorite }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      const res = await fetch("/api/membre/favorites", {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      if (!res.ok) {
        // Rollback
        setIsFavorite(!newState);
      }
    } catch {
      setIsFavorite(!newState);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        padding: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        opacity: loading ? 0.5 : 1,
        transition: "transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isFavorite ? (
        // Filled heart (golden)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        // Outline heart
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b3a4b" strokeWidth={2}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      )}
    </button>
  );
}
