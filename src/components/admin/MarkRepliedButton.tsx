"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  messageId: string;
  currentStatus: "pending" | "replied";
};

export default function MarkRepliedButton({ messageId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const markAs = currentStatus === "replied" ? "pending" : "replied";
    await fetch("/api/admin/messages/mark-replied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, markAs }),
    });
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "replied") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          padding: "0.5rem 0.875rem",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          backgroundColor: "transparent",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? "..." : "↶ Marquer à traiter"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#22c55e",
        padding: "0.5rem 0.875rem",
        border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 8,
        backgroundColor: "rgba(34,197,94,0.08)",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? "..." : "✓ Marquer comme répondu"}
    </button>
  );
}
