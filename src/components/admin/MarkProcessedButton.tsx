"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkProcessedButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/admin/youtube-channels/${id}/process`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "0.375rem 0.875rem",
        backgroundColor: "var(--color-accent)",
        color: "var(--color-accent-text)",
        fontWeight: 600,
        fontSize: "0.8125rem",
        borderRadius: "var(--radius-full)",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "..." : "Traiter"}
    </button>
  );
}
