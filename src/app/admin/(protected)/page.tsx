import { db } from "@/db";
import {
  tracks,
  blogPosts,
  subscriptions,
  youtubeChannels,
  facebookAccounts,
  downloads,
  artists,
  profiles,
} from "@/db/schema";
import { count, eq, and, gte, lt, desc } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import SubscribersChart from "@/components/admin/charts/SubscribersChart";
import DownloadsChart from "@/components/admin/charts/DownloadsChart";
import VisitorsChart from "@/components/admin/charts/VisitorsChart";
import PlanDistributionChart from "@/components/admin/charts/PlanDistributionChart";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    trackRow, articleRow, subscriberRow, pendingYtRow, pendingFbRow,
    newThisMonth, newLastMonth, totalUsers,
    creatorsMonthlyRow, creatorsAnnualRow, boutiqueRow,
    downloadsThisMonth,
  ] = await Promise.all([
    db.select({ value: count() }).from(tracks).where(eq(tracks.isPublished, true)),
    db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.isPublished, true)),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: count() }).from(youtubeChannels).where(eq(youtubeChannels.status, "pending")),
    db.select({ value: count() }).from(facebookAccounts).where(eq(facebookAccounts.status, "pending")),
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), gte(subscriptions.createdAt, startOfMonth))
    ),
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), gte(subscriptions.createdAt, startOfLastMonth), lt(subscriptions.createdAt, startOfMonth))
    ),
    db.select({ value: count() }).from(profiles),
    db.select({ value: count() }).from(subscriptions).where(and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "creators_monthly"))),
    db.select({ value: count() }).from(subscriptions).where(and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "creators_annual"))),
    db.select({ value: count() }).from(subscriptions).where(and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "boutique_annual"))),
    db.select({ value: count() }).from(downloads).where(gte(downloads.downloadedAt, startOfMonth)),
  ]);

  // Subscribers by month (last 6 months)
  const subscribersByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [row] = await db.select({ value: count() }).from(subscriptions).where(
      and(gte(subscriptions.createdAt, monthStart), lt(subscriptions.createdAt, monthEnd))
    );
    const label = monthStart.toLocaleDateString("fr-FR", { month: "short" });
    subscribersByMonth.push({ month: label, count: row.value });
  }

  // Downloads by day (last 14 days)
  const downloadsByDay: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
    const [row] = await db.select({ value: count() }).from(downloads).where(
      and(gte(downloads.downloadedAt, dayStart), lt(downloads.downloadedAt, dayEnd))
    );
    const label = dayStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    downloadsByDay.push({ day: label, count: row.value });
  }

  // Visitors by day (last 14 days) — count unique sessions per day
  const visitorsByDay: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
    const { count: cnt } = await supabaseAdmin
      .from("visitor_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());
    const label = dayStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    visitorsByDay.push({ day: label, count: cnt ?? 0 });
  }

  // Top 10 tracks
  const topTracks = await db
    .select({ trackTitle: tracks.title, artistName: artists.name, downloadCount: count() })
    .from(downloads)
    .innerJoin(tracks, eq(downloads.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .groupBy(tracks.title, artists.name)
    .orderBy(desc(count()))
    .limit(10);

  // Cancellation reasons
  let cancellationReasons: { reason: string; count: number }[] = [];
  try {
    const canceledSubs = await stripe.subscriptions.list({ status: "canceled", limit: 100 });
    const reasonMap: Record<string, number> = {};
    for (const sub of canceledSubs.data) {
      const reason = sub.metadata?.cancel_reason;
      if (reason) reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    }
    cancellationReasons = Object.entries(reasonMap).map(([reason, cnt]) => ({ reason, count: cnt })).sort((a, b) => b.count - a.count);
  } catch {}

  // MRR
  let mrrCents = 0;
  try {
    const stripeSubs = await stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.items.data.price"] });
    for (const sub of stripeSubs.data) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount ?? 0;
        const interval = item.price.recurring?.interval;
        if (interval === "month") mrrCents += amount;
        else if (interval === "year") mrrCents += Math.round(amount / 12);
      }
    }
  } catch {}

  return {
    trackCount: trackRow[0].value,
    articleCount: articleRow[0].value,
    subscriberCount: subscriberRow[0].value,
    pendingChannelCount: pendingYtRow[0].value + pendingFbRow[0].value,
    newThisMonth: newThisMonth[0].value,
    newLastMonth: newLastMonth[0].value,
    totalUsers: totalUsers[0].value,
    creatorsMonthly: creatorsMonthlyRow[0].value,
    creatorsAnnual: creatorsAnnualRow[0].value,
    boutique: boutiqueRow[0].value,
    downloadsThisMonth: downloadsThisMonth[0].value,
    mrr: mrrCents / 100,
    arr: (mrrCents * 12) / 100,
    subscribersByMonth,
    downloadsByDay,
    visitorsByDay,
    topTracks,
    cancellationReasons,
  };
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-card)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  padding: "1.25rem",
};

export default async function AdminPage() {
  let kpis;
  try {
    kpis = await getKpis();
  } catch (err) {
    console.error("[admin] getKpis failed:", err);
    return (
      <div>
        <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "1rem" }}>Tableau de bord</h1>
        <p style={{ color: "#ef4444" }}>Erreur de chargement. Réessayez.</p>
      </div>
    );
  }

  const growthPercent = kpis.newLastMonth > 0
    ? Math.round(((kpis.newThisMonth - kpis.newLastMonth) / kpis.newLastMonth) * 100)
    : kpis.newThisMonth > 0 ? 100 : 0;

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
        Tableau de bord
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Vue d&apos;ensemble de Lalason
      </p>

      {/* ── Row 1: Main KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Abonnés actifs", value: String(kpis.subscriberCount), accent: true },
          { label: "Revenu mensuel", value: `${kpis.mrr.toFixed(0)} €` },
          { label: "Revenu annuel", value: `${kpis.arr.toFixed(0)} €` },
          { label: "Nouveaux ce mois", value: String(kpis.newThisMonth), sub: growthPercent !== 0 ? `${growthPercent > 0 ? "+" : ""}${growthPercent}% vs mois dernier` : undefined },
          { label: "Téléchargements", value: String(kpis.downloadsThisMonth), sub: "ce mois" },
          { label: "Utilisateurs", value: String(kpis.totalUsers), sub: "inscrits" },
        ].map((card) => (
          <div key={card.label} style={{
            ...cardStyle,
            borderColor: card.accent ? "rgba(245,166,35,0.3)" : "var(--color-border)",
          }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>
              {card.label}
            </p>
            <p style={{ fontSize: "1.75rem", fontWeight: 800, color: card.accent ? "var(--color-accent)" : "white", margin: 0 }}>
              {card.value}
            </p>
            {card.sub && (
              <p style={{ fontSize: "0.6875rem", color: growthPercent > 0 ? "#22c55e" : "var(--color-text-muted)", marginTop: "0.25rem" }}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Row 2: Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Visitors chart */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Visiteurs par jour (14 jours)
          </h2>
          <VisitorsChart data={kpis.visitorsByDay} />
        </div>

        {/* Subscribers growth */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Croissance abonnés (6 mois)
          </h2>
          <SubscribersChart data={kpis.subscribersByMonth} />
        </div>

        {/* Downloads chart */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Téléchargements (14 jours)
          </h2>
          <DownloadsChart data={kpis.downloadsByDay} />
        </div>
      </div>

      {/* ── Row 3: Plan distribution + secondary stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Plan distribution */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Répartition par plan
          </h2>
          <PlanDistributionChart
            data={[
              { name: "Creators Mensuel", value: kpis.creatorsMonthly, color: "#f5a623" },
              { name: "Creators Annuel", value: kpis.creatorsAnnual, color: "#e8961a" },
              { name: "Boutique", value: kpis.boutique, color: "#22c55e" },
            ]}
          />
        </div>

        {/* Quick stats */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Contenu
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Pistes publiées", value: String(kpis.trackCount) },
              { label: "Articles publiés", value: String(kpis.articleCount) },
              { label: "Whitelist YouTube", value: String(kpis.pendingChannelCount), alert: kpis.pendingChannelCount > 0 },
              { label: "Artistes", value: "—" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "0.75rem",
                borderRadius: 8,
                backgroundColor: s.alert ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
                border: s.alert ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)",
              }}>
                <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                  {s.label}
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.alert ? "#ef4444" : "white", margin: 0 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Top tracks + Cancellation reasons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(350px, 100%), 1fr))", gap: "1rem" }}>
        {/* Top tracks */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Top 10 — Morceaux téléchargés
          </h2>
          {kpis.topTracks.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucun téléchargement</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {kpis.topTracks.map((t, i) => (
                <div key={`${t.trackTitle}-${t.artistName}`} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.5rem 0.625rem", borderRadius: 6,
                  backgroundColor: i === 0 ? "rgba(245,166,35,0.08)" : "transparent",
                }}>
                  <span style={{ width: 20, textAlign: "center", fontSize: "0.6875rem", fontWeight: 700, color: i < 3 ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.trackTitle}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0 }}>{t.artistName}</p>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0 }}>{t.downloadCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancellation reasons */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
            Raisons de résiliation
          </h2>
          {kpis.cancellationReasons.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucune résiliation</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {kpis.cancellationReasons.map((r) => (
                <div key={r.reason} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.5rem 0.625rem", borderRadius: 6,
                  backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{r.reason}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
