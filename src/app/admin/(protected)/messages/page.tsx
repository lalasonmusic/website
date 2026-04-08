import { supabaseAdmin } from "@/lib/supabase/admin";
import RefreshButton from "@/components/admin/RefreshButton";

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
  // Escalated (pending) — needs human response
  const { data: escalated } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("escalated", true)
    .order("created_at", { ascending: false })
    .limit(50);

  // Recent bot conversations (last 24h, not escalated)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("escalated", false)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    escalated: (escalated ?? []) as ChatMessage[],
    recent: (recent ?? []) as ChatMessage[],
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

export default async function MessagesPage() {
  const { escalated, recent } = await getMessages();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>Messages</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>{escalated.length}</span> en attente ·{" "}
            {recent.length} conversations bot (24h)
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* ── Escalated messages (needs human) ── */}
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
            En attente de réponse ({escalated.length})
          </h2>
        </div>

        {escalated.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucun message en attente — tout est sous contrôle 🎉
          </p>
        ) : (
          <div>
            {escalated.map((msg) => {
              const subject = msg.subject ?? msg.user_question;
              const detail = msg.detailed_message ?? msg.user_question;
              return (
                <div
                  key={msg.id}
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {/* Header: email + location + time */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: "var(--color-accent)" }}>
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
                      color: "white",
                      margin: "0 0 0.5rem",
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

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent bot conversations ── */}
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
          }}
        >
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-secondary)" }}>
            Conversations bot — 24 dernières heures ({recent.length})
          </h2>
        </div>

        {recent.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucune conversation récente
          </p>
        ) : (
          <div>
            {recent.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
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
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                    R: {msg.bot_answer}
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
