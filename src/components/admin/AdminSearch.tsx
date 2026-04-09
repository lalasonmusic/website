"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  basePath: string;
  placeholder?: string;
};

export default function AdminSearch({ basePath, placeholder = "Rechercher par email ou URL..." }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`);
  }

  function handleClear() {
    setQuery("");
    router.push(basePath);
  }

  return (
    <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "0.625rem 1rem",
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "white",
          fontSize: "0.875rem",
          fontFamily: "inherit",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Rechercher
      </button>
      {query && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "0.625rem 1rem",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            fontWeight: 500,
            fontSize: "0.875rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Effacer
        </button>
      )}
    </form>
  );
}
