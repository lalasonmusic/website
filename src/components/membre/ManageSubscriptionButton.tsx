"use client";

import { useState } from "react";

type Props = { label: string };

export default function ManageSubscriptionButton({ label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/membre/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "0.75rem 1.5rem",
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
        fontWeight: 600,
        fontSize: "0.9375rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "..." : label}
    </button>
  );
}
