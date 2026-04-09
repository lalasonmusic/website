"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_CHANNELS = 3;

type Channel = {
  id: string;
  channelId: string;
  status: "pending" | "processed";
};

type Props = {
  existingChannels: Channel[];
  labels: {
    channelId: string;
    save: string;
    saved: string;
    placeholder: string;
    add: string;
    remainingByCount: Record<number, string>;
    max: string;
    statusPending: string;
    statusProcessed: string;
    remove: string;
    confirmRemove: string;
  };
};

export default function YoutubeChannelForm({ existingChannels, labels }: Props) {
  const [channels, setChannels] = useState<Channel[]>(existingChannels);
  const [adding, setAdding] = useState(false);
  const [newChannelId, setNewChannelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const remaining = MAX_CHANNELS - channels.length;
  const canAdd = remaining > 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannelId.trim()) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/membre/youtube-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: newChannelId.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setNewChannelId("");
      setAdding(false);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error");
    }
  }

  async function handleRemove(channel: Channel) {
    if (!confirm(labels.confirmRemove)) return;
    const res = await fetch(`/api/membre/youtube-channel?id=${channel.id}`, { method: "DELETE" });
    if (res.ok) {
      setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      router.refresh();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Existing channels list */}
      {channels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {channels.map((channel) => (
            <div
              key={channel.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                <code
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-secondary)",
                    fontFamily: "ui-monospace, monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {channel.channelId}
                </code>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: 9999,
                    backgroundColor: channel.status === "processed" ? "rgba(34,197,94,0.12)" : "rgba(245,166,35,0.12)",
                    color: channel.status === "processed" ? "#22c55e" : "#f5a623",
                    whiteSpace: "nowrap",
                  }}
                >
                  {channel.status === "processed" ? labels.statusProcessed : labels.statusPending}
                </span>
              </div>
              <button
                onClick={() => handleRemove(channel)}
                aria-label={labels.remove}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "1.125rem",
                  padding: "0.25rem 0.5rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button or inline form */}
      {!adding && canAdd && (
        <button
          onClick={() => { setAdding(true); setError(""); setSuccess(false); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            alignSelf: "flex-start",
            padding: "0.5rem 0.875rem",
            backgroundColor: "rgba(245,166,35,0.12)",
            border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: "var(--radius-full)",
            color: "var(--color-accent)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
          {labels.add}
          <span style={{ fontSize: "0.6875rem", fontWeight: 500, opacity: 0.7 }}>
            ({labels.remainingByCount[remaining] ?? `${remaining}`})
          </span>
        </button>
      )}

      {!canAdd && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>
          {labels.max}
        </p>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 480 }}
        >
          <input
            type="text"
            value={newChannelId}
            onChange={(e) => { setNewChannelId(e.target.value); setError(""); }}
            placeholder={labels.placeholder}
            autoFocus
            style={{
              padding: "0.625rem 0.875rem",
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontSize: "0.875rem",
              fontFamily: "inherit",
            }}
          />
          {error && <p style={{ fontSize: "0.8125rem", color: "#ef4444", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={loading || !newChannelId.trim()}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: loading || !newChannelId.trim() ? "not-allowed" : "pointer",
                opacity: loading || !newChannelId.trim() ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "..." : labels.save}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewChannelId(""); setError(""); }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 500,
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ×
            </button>
          </div>
        </form>
      )}

      {success && !adding && (
        <p style={{ fontSize: "0.8125rem", color: "#22c55e", margin: 0 }}>{labels.saved}</p>
      )}
    </div>
  );
}
