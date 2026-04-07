"use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.refresh()}
      style={{
        padding: "0.5rem 1rem",
        fontSize: "0.8125rem",
        fontWeight: 600,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Rafraîchir
    </button>
  );
}
