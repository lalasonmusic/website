import { supabaseAdmin } from "@/lib/supabase/admin";
import RefreshButton from "@/components/admin/RefreshButton";
import MarkRepliedButton from "@/components/admin/MarkRepliedButton";

type ChatMessage = {
  id: string;
  session_id: string;
  user_question: string;
  bot_answer: string | null;
  escalated: boolean;
  customer_email: string | null;
  customer_name: string | null;
  subject: string | null;
  detailed_message: string | null;
  status: string;
  page: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
};

async function getMessages() {
  // Escalated pending (needs reply)
  const { data: pending } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("escalated", true)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  // Escalated already replied
  const { data: replied } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("escalated", true)
    .eq("status", "replied")
    .order("created_at", { ascending: false })
    .limit(50);

  // Bot conversation history (non-escalated)
  const { data: botHistory } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("escalated", false)
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    pending: (pending ?? []) as ChatMessage[],
    replied: (replied ?? []) as ChatMessage[],
    botHistory: (botHistory ?? []) as ChatMessage[],
  };
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}j`;
}

function EscalatedRow({ msg, isReplied }: { msg: ChatMessage; isReplied: boolean }) {
  const subject = msg.subject ?? msg.user_question;
  const detail = msg.detailed_message ?? msg.user_question;

  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--color-border)",
        opacity: isReplied ? 0.65 : 1,
      }}
    >
      {/* Header: email + location + time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: isReplied ? "var(--color-text-secondary)" : "var(--color-accent)" }}>
            {msg.customer_name ? `${msg.customer_name} · ` : ""}
            {msg.customer_email}
          </p>
          {msg.country && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {countryFlag(msg.country)} {msg.city ?? msg.country}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {timeAgo(msg.created_at)}
        </span>
      </div>

      {/* Subject */}
      <p
        style={{
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: isReplied ? "var(--color-text-secondary)" : "white",
          margin: "0 0 0.5rem",
          textDecoration: isReplied ? "line-through" : "none",
        }}
      >
        {subject}
      </p>

      {/* Detailed message */}
      <div
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-secondary)",
          padding: "0.75rem 0.875rem",
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.04)",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          marginBottom: "0.75rem",
        }}
      >
        {detail}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        {!isReplied && (
          <a
            href={`mailto:${msg.customer_email}?subject=${encodeURIComponent("Re: " + subject)}&body=${encodeURIComponent("Bonjour" + (msg.customer_name ? " " + msg.customer_name : "") + ",\n\nMerci pour votre message.\n\nConcernant votre demande :\n> " + detail.split("\n").join("\n> ") + "\n\n")}`}
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
              padding: "0.5rem 0.875rem",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: 8,
              backgroundColor: "rgba(245,166,35,0.08)",
            }}
          >
            Répondre par email →
          </a>
        )}
        <MarkRepliedButton
          messageId={msg.id}
          currentStatus={isReplied ? "replied" : "pending"}
        />
      </div>
    </div>
  );
}

export default async function MessagesPage() {
  const { pending, replied, botHistory } = await getMessages();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>Messages</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>{pending.length}</span> à traiter ·{" "}
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{replied.length}</span> répondus ·{" "}
            {botHistory.length} conversations bot
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* ── Section 1: Pending (needs reply) ── */}
      <div
        style={{
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(239,68,68,0.2)",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(239,68,68,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block" }} />
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0 }}>
            À traiter ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucun message en attente — tout est sous contrôle 🎉
          </p>
        ) : (
          <div>
            {pending.map((msg) => (
              <EscalatedRow key={msg.id} msg={msg} isReplied={false} />
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Replied (already handled) ── */}
      {replied.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(34,197,94,0.15)",
            overflow: "hidden",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: "rgba(34,197,94,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-secondary)" }}>
              Répondus ({replied.length})
            </h2>
          </div>

          <div>
            {replied.map((msg) => (
              <EscalatedRow key={msg.id} msg={msg} isReplied={true} />
            ))}
          </div>
        </div>
      )}

      {/* ── Section 3: Bot conversation history ── */}
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
            padding: "0.875rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-secondary)" }}>
            Historique conversations bot ({botHistory.length})
          </h2>
        </div>

        {botHistory.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucune conversation
          </p>
        ) : (
          <div>
            {botHistory.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: "0.875rem 1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {msg.country && (
                      <span style={{ fontSize: "0.75rem" }}>
                        {countryFlag(msg.country)} {msg.city ?? msg.country}
                      </span>
                    )}
                    {msg.status === "needs_info" && (
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          padding: "0.125rem 0.5rem",
                          borderRadius: 9999,
                          backgroundColor: "rgba(234,179,8,0.12)",
                          color: "#eab308",
                        }}
                      >
                        Bot incertain
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "white", margin: "0 0 0.375rem", fontWeight: 500 }}>
                  Q: {msg.user_question}
                </p>
                {msg.bot_answer && (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5, paddingLeft: "0.875rem", borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
                    {msg.bot_answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
