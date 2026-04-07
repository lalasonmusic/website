import { db } from "@/db";
import { subscriptions, downloads, profiles } from "@/db/schema";
import { count, eq, and, desc, sql } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Client = {
  userId: string;
  email: string;
  planType: string;
  status: string;
  createdAt: Date;
  currentPeriodEnd: Date;
  downloadCount: number;
};

async function getClients(): Promise<Client[]> {
  // Get all subscriptions with download counts
  const subs = await db
    .select({
      userId: subscriptions.userId,
      planType: subscriptions.planType,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));

  // Get download counts per user
  const downloadCounts = await db
    .select({
      userId: downloads.userId,
      count: count(),
    })
    .from(downloads)
    .groupBy(downloads.userId);

  const dlMap = new Map(downloadCounts.map((d) => [d.userId, d.count]));

  // Get emails from Supabase auth
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email ?? "—"]) ?? []);

  return subs.map((sub) => ({
    userId: sub.userId,
    email: emailMap.get(sub.userId) ?? "—",
    planType: sub.planType,
    status: sub.status,
    createdAt: sub.createdAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    downloadCount: dlMap.get(sub.userId) ?? 0,
  }));
}

const planLabels: Record<string, string> = {
  creators_monthly: "Creators Mensuel",
  creators_annual: "Creators Annuel",
  boutique_annual: "Boutique",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  canceled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  past_due: { bg: "rgba(234,179,8,0.12)", text: "#eab308" },
};

export default async function ClientsPage() {
  const clients = await getClients();
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

  const activeCount = clients.filter((c) => c.status === "active").length;
  const canceledCount = clients.filter((c) => c.status === "canceled").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Clients
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {activeCount} actifs · {canceledCount} résiliés · {clients.length} total
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.6fr",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}>
          {["Email", "Plan", "Statut", "Inscrit le", "Renouvellement", "DL"].map((h) => (
            <p key={h} style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {clients.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            Aucun client
          </p>
        ) : (
          clients.map((client) => {
            const colors = statusColors[client.status] ?? statusColors.canceled;
            return (
              <div
                key={`${client.userId}-${client.createdAt.toISOString()}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.6fr",
                  gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                  alignItems: "center",
                }}
              >
                {/* Email */}
                <p style={{ fontSize: "0.8125rem", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {client.email}
                </p>

                {/* Plan */}
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  {planLabels[client.planType] ?? client.planType}
                </p>

                {/* Status */}
                <span style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: colors.bg,
                  color: colors.text,
                  textAlign: "center",
                  display: "inline-block",
                }}>
                  {client.status === "active" ? "Actif" : client.status === "canceled" ? "Résilié" : client.status}
                </span>

                {/* Created */}
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {client.createdAt.toLocaleDateString("fr-FR", dateOpts)}
                </p>

                {/* Renewal */}
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {client.currentPeriodEnd.toLocaleDateString("fr-FR", dateOpts)}
                </p>

                {/* Downloads */}
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" }}>
                  {client.downloadCount}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
