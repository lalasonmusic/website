"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  trackId: string;
  isPublished: boolean;
};

export default function TogglePublishButton({ trackId, isPublished }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    await fetch("/api/admin/tracks/toggle-publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        padding: "0.375rem 0.75rem",
        fontSize: "0.6875rem",
        fontWeight: 600,
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
        fontFamily: "inherit",
        backgroundColor: isPublished ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
        color: isPublished ? "#ef4444" : "#22c55e",
      }}
    >
      {loading ? "..." : isPublished ? "Dépublier" : "Publier"}
    </button>
  );
}
