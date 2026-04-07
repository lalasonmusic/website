import { supabaseAdmin } from "@/lib/supabase/admin";
import RefreshButton from "@/components/admin/RefreshButton";

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

async function getVisitors() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Online now (last 5 min)
  const { data: online } = await supabaseAdmin
    .from("visitor_sessions")
    .select("*")
    .gte("last_seen_at", fiveMinAgo)
    .order("last_seen_at", { ascending: false });

  // Recent (last hour, not currently online)
  const { data: recent } = await supabaseAdmin
    .from("visitor_sessions")
    .select("*")
    .lt("last_seen_at", fiveMinAgo)
    .gte("last_seen_at", oneHourAgo)
    .order("last_seen_at", { ascending: false });

  return {
    online: (online ?? []) as VisitorSession[],
    recent: (recent ?? []) as VisitorSession[],
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
  return `${Math.floor(seconds / 3600)}h`;
}

function VisitorRow({ v, isOnline }: { v: VisitorSession; isOnline: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.3fr 2fr 1.5fr 2fr 0.8fr",
        gap: "0.75rem",
        padding: "0.625rem 1.25rem",
        borderBottom: "1px solid var(--color-border)",
        alignItems: "center",
      }}
    >
      {/* Status dot */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: isOnline ? "#22c55e" : "#6b7280",
          display: "inline-block",
        }} />
      </div>

      {/* User */}
      <div>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {v.email ?? "Visiteur anonyme"}
        </p>
      </div>

      {/* Location */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
        {countryFlag(v.country)} {v.city ?? ""}{v.city && v.country ? ", " : ""}{v.country ?? "—"}
      </p>

      {/* Page */}
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {v.page}
      </p>

      {/* Time */}
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textAlign: "right" }}>
        {timeAgo(v.last_seen_at)}
      </p>
    </div>
  );
}

export default async function VisiteursPage() {
  const { online, recent } = await getVisitors();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Visiteurs
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{online.length}</span> en ligne ·{" "}
            {recent.length} récents (dernière heure)
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Online now */}
      <div style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid rgba(34,197,94,0.2)",
        overflow: "hidden",
        marginBottom: "2rem",
      }}>
        <div style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "rgba(34,197,94,0.05)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
            En ligne ({online.length})
          </h2>
        </div>

        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.3fr 2fr 1.5fr 2fr 0.8fr",
          gap: "0.75rem",
          padding: "0.5rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
        }}>
          {["", "Utilisateur", "Localisation", "Page", "Activité"].map((h) => (
            <p key={h} style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {online.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucun visiteur en ligne
          </p>
        ) : (
          online.map((v) => <VisitorRow key={v.id} v={v} isOnline />)
        )}
      </div>

      {/* Recent */}
      <div style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: "var(--color-text-secondary)" }}>
            Récents ({recent.length})
          </h2>
        </div>

        {recent.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Aucune visite récente
          </p>
        ) : (
          recent.map((v) => <VisitorRow key={v.id} v={v} isOnline={false} />)
        )}
      </div>
    </div>
  );
}
