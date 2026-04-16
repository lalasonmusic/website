import { supabaseAdmin } from "@/lib/supabase/admin";
import RefreshButton from "@/components/admin/RefreshButton";
import VisitorList from "./VisitorList";

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

  // Filter out single-heartbeat sessions (bots/crawls that somehow got through)
  const filterReal = (sessions: VisitorSession[]) =>
    sessions.filter((s) => {
      const created = new Date(s.created_at).getTime();
      const lastSeen = new Date(s.last_seen_at).getTime();
      return lastSeen - created > 15_000;
    });

  return {
    online: filterReal((online ?? []) as VisitorSession[]),
    recent: filterReal((recent ?? []) as VisitorSession[]),
  };
}

export default async function VisiteursPage() {
  const { online, recent } = await getVisitors();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Visiteurs
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{online.length}</span> en ligne
            &middot; {recent.length} r&eacute;cents (derni&egrave;re heure)
          </p>
        </div>
        <RefreshButton />
      </div>

      <VisitorList online={online} recent={recent} />
    </div>
  );
}
