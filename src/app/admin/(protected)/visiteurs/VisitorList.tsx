"use client";

import { useState } from "react";
import LiveChatPanel from "@/components/admin/LiveChatPanel";

type VisitorSession = {
  id: string;
  session_id: string;
  user_id: string | null;
  email: string | null;
  page: string;
  country: string | null;
  city: string | null;
  region: string | null;
  last_seen_at: string;
  created_at: string;
};

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset,
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h`;
}

function VisitorRow({
  v,
  isOnline,
  onChat,
  activeChatId,
}: {
  v: VisitorSession;
  isOnline: boolean;
  onChat: (v: VisitorSession) => void;
  activeChatId: string | null;
}) {
  const isActive = activeChatId === v.session_id;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.3fr 2fr 1.5fr 2fr 0.5fr 0.8fr",
        gap: "0.75rem",
        padding: "0.625rem 1.25rem",
        borderBottom: "1px solid var(--color-border)",
        alignItems: "center",
        backgroundColor: isActive ? "rgba(245,166,35,0.05)" : undefined,
      }}
    >
      {/* Status dot */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: isOnline ? "#22c55e" : "#6b7280",
            display: "inline-block",
          }}
        />
      </div>

      {/* User */}
      <div>
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {v.email ?? "Visiteur anonyme"}
        </p>
      </div>

      {/* Location */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
        {countryFlag(v.country)} {v.city ?? ""}
        {v.city && v.country ? ", " : ""}
        {v.country ?? "\u2014"}
      </p>

      {/* Page */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          margin: 0,
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {v.page}
      </p>

      {/* Chat button */}
      <div>
        {isOnline && (
          <button
            onClick={() => onChat(v)}
            style={{
              padding: "0.25rem 0.625rem",
              fontSize: "0.6875rem",
              fontWeight: 700,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              backgroundColor: isActive ? "var(--color-accent)" : "rgba(255,255,255,0.08)",
              color: isActive ? "var(--color-accent-text)" : "var(--color-text-secondary)",
            }}
          >
            Chat
          </button>
        )}
      </div>

      {/* Time */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          margin: 0,
          textAlign: "right",
        }}
      >
        {timeAgo(v.last_seen_at)}
      </p>
    </div>
  );
}

type Props = {
  online: VisitorSession[];
  recent: VisitorSession[];
};

export default function VisitorList({ online, recent }: Props) {
  const [chatTarget, setChatTarget] = useState<VisitorSession | null>(null);

  function handleChat(v: VisitorSession) {
    setChatTarget((prev) => (prev?.session_id === v.session_id ? null : v));
  }

  const headers = ["", "Utilisateur", "Localisation", "Page", "", "Activit\u00e9"];

  return (
    <>
      {/* Online now */}
      <div
        style={{
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(34,197,94,0.2)",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(34,197,94,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "inline-block",
            }}
          />
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
            En ligne ({online.length})
          </h2>
        </div>

        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.3fr 2fr 1.5fr 2fr 0.5fr 0.8fr",
            gap: "0.75rem",
            padding: "0.5rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {headers.map((h, i) => (
            <p
              key={i}
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              {h}
            </p>
          ))}
        </div>

        {online.length === 0 ? (
          <p
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Aucun visiteur en ligne
          </p>
        ) : (
          online.map((v) => (
            <VisitorRow
              key={v.id}
              v={v}
              isOnline
              onChat={handleChat}
              activeChatId={chatTarget?.session_id ?? null}
            />
          ))
        )}
      </div>

      {/* Recent */}
      <div
        style={{
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-secondary)",
            }}
          >
            R\u00e9cents ({recent.length})
          </h2>
        </div>

        {recent.length === 0 ? (
          <p
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Aucune visite r\u00e9cente
          </p>
        ) : (
          recent.map((v) => (
            <VisitorRow
              key={v.id}
              v={v}
              isOnline={false}
              onChat={handleChat}
              activeChatId={chatTarget?.session_id ?? null}
            />
          ))
        )}
      </div>

      {/* Chat panel */}
      {chatTarget && (
        <LiveChatPanel
          sessionId={chatTarget.session_id}
          visitorLabel={chatTarget.email ?? "Visiteur anonyme"}
          onClose={() => setChatTarget(null)}
        />
      )}
    </>
  );
}
