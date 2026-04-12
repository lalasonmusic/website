"use client";

import { useState } from "react";

export function LiteYouTube({
  videoId,
  title,
  style,
}: {
  videoId: string;
  title: string;
  style?: React.CSSProperties;
}) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: "none", ...style }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Lire la vidéo : ${title}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "#000",
        ...style,
      }}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Play button overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.3)",
          transition: "background 0.2s",
        }}
      >
        <svg
          viewBox="0 0 68 48"
          width={68}
          height={48}
          aria-hidden="true"
        >
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            fill="red"
          />
          <path d="M45 24 27 14v20" fill="white" />
        </svg>
      </div>
    </button>
  );
}
