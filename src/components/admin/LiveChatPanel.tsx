"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ChatMessage = {
  sender: string;
  message: string;
  created_at: string;
};

type Props = {
  sessionId: string;
  visitorLabel: string;
  onClose: () => void;
};

export default function LiveChatPanel({ sessionId, visitorLabel, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [takeover, setTakeover] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chat/history?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      setTakeover(data.adminTakeover);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchHistory();
    pollRef.current = setInterval(fetchHistory, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchHistory]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/admin/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (res.ok) {
        setTakeover(true);
        await fetchHistory();
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleTakeover() {
    const newState = !takeover;
    await fetch("/api/admin/chat/takeover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, active: newState }),
    });
    setTakeover(newState);
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const senderStyle = (sender: string) => {
    if (sender === "admin")
      return {
        bg: "var(--color-accent)",
        color: "var(--color-accent-text)",
        align: "flex-end" as const,
        label: "Vous",
      };
    if (sender === "bot")
      return {
        bg: "rgba(139,92,246,0.15)",
        color: "rgba(139,92,246,1)",
        align: "flex-start" as const,
        label: "Bot",
      };
    return {
      bg: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.9)",
      align: "flex-start" as const,
      label: "Visiteur",
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        backgroundColor: "var(--color-bg-card)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        boxShadow: "-8px 0 30px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Chat — {visitorLabel}
          </p>
          <p
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            {sessionId.slice(0, 8)}...
          </p>
        </div>

        {/* Takeover toggle */}
        <button
          onClick={toggleTakeover}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.6875rem",
            fontWeight: 700,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            backgroundColor: takeover ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
            color: takeover ? "#22c55e" : "var(--color-text-muted)",
          }}
        >
          {takeover ? "Live" : "Bot actif"}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: 4,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {loading && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
            Chargement...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "2rem" }}>
            Aucun message. Envoyez un message pour prendre la main.
          </p>
        )}

        {messages.map((msg, i) => {
          const s = senderStyle(msg.sender);
          return (
            <div key={i} style={{ alignSelf: s.align, maxWidth: "85%" }}>
              <p
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  margin: "0 0 2px 4px",
                  textAlign: s.align === "flex-end" ? "right" : "left",
                }}
              >
                {s.label} · {formatTime(msg.created_at)}
              </p>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 10,
                  backgroundColor: s.bg,
                  color: s.color,
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                {msg.message}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "0.875rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Répondre au visiteur..."
          disabled={sending}
          style={{
            flex: 1,
            padding: "0.625rem 0.875rem",
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "white",
            fontSize: "0.8125rem",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            padding: "0.625rem 1rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            cursor: !input.trim() || sending ? "not-allowed" : "pointer",
            opacity: !input.trim() || sending ? 0.5 : 1,
            fontSize: "0.8125rem",
            fontFamily: "inherit",
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
