"use client";

import { useState } from "react";

type Props = {
  existingChannelId?: string | null;
  labels: {
    channelId: string;
    save: string;
    saved: string;
    placeholder: string;
  };
};

export default function YoutubeChannelForm({ existingChannelId, labels }: Props) {
  const [channelId, setChannelId] = useState(existingChannelId ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const res = await fetch("/api/membre/youtube-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "400px" }}
    >
      <label
        style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}
      >
        {labels.channelId}
      </label>
      <input
        type="text"
        value={channelId}
        onChange={(e) => {
          setChannelId(e.target.value);
          setSuccess(false);
        }}
        placeholder={labels.placeholder}
        style={{
          padding: "0.75rem 1rem",
          backgroundColor: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-primary)",
          fontSize: "0.9375rem",
          fontFamily: "inherit",
        }}
      />
      {success && (
        <p style={{ fontSize: "0.875rem", color: "#22c55e" }}>{labels.saved}</p>
      )}
      {error && (
        <p style={{ fontSize: "0.875rem", color: "#ef4444" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !channelId}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.9375rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: loading || !channelId ? "not-allowed" : "pointer",
          opacity: loading || !channelId ? 0.7 : 1,
          alignSelf: "flex-start",
        }}
      >
        {loading ? "..." : labels.save}
      </button>
    </form>
  );
}
