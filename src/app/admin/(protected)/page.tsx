import { db } from "@/db";
import {
  tracks,
  blogPosts,
  subscriptions,
  youtubeChannels,
  downloads,
  artists,
  profiles,
} from "@/db/schema";
import { count, eq, and, gte, lt, desc } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

async function getKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    trackRow,
    articleRow,
    subscriberRow,
    pendingRow,
    newThisMonth,
    newLastMonth,
    totalUsers,
    creatorsMonthlyRow,
    creatorsAnnualRow,
    boutiqueRow,
    downloadsThisMonth,
  ] = await Promise.all([
    db.select({ value: count() }).from(tracks).where(eq(tracks.isPublished, true)),
    db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.isPublished, true)),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ value: count() }).from(youtubeChannels).where(eq(youtubeChannels.status, "pending")),
    // New subscribers this month
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), gte(subscriptions.createdAt, startOfMonth))
    ),
    // New subscribers last month
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), gte(subscriptions.createdAt, startOfLastMonth), lt(subscriptions.createdAt, startOfMonth))
    ),
    // Total registered users
    db.select({ value: count() }).from(profiles),
    // By plan
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "creators_monthly"))
    ),
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "creators_annual"))
    ),
    db.select({ value: count() }).from(subscriptions).where(
      and(eq(subscriptions.status, "active"), eq(subscriptions.planType, "boutique_annual"))
    ),
    // Downloads this month
    db.select({ value: count() }).from(downloads).where(gte(downloads.downloadedAt, startOfMonth)),
  ]);

  // Top 10 downloaded tracks
  const topTracks = await db
    .select({
      trackTitle: tracks.title,
      artistName: artists.name,
      downloadCount: count(),
    })
    .from(downloads)
    .innerJoin(tracks, eq(downloads.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .groupBy(tracks.title, artists.name)
    .orderBy(desc(count()))
    .limit(10);

  // Recent cancellations with reasons (from Stripe metadata)
  let cancellationReasons: { reason: string; count: number }[] = [];
  try {
    const canceledSubs = await stripe.subscriptions.list({
      status: "canceled",
      limit: 100,
    });
    const reasonMap: Record<string, number> = {};
    for (const sub of canceledSubs.data) {
      const reason = sub.metadata?.cancel_reason;
      if (reason) {
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
      }
    }
    cancellationReasons = Object.entries(reasonMap)
      .map(([reason, cnt]) => ({ reason, count: cnt }))
      .sort((a, b) => b.count - a.count);
  } catch {}

  // MRR from Stripe
  let mrrCents = 0;
  try {
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price"],
    });
    for (const sub of stripeSubscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount ?? 0;
        const interval = price.recurring?.interval;
        if (interval === "month") {
          mrrCents += amount;
        } else if (interval === "year") {
          mrrCents += Math.round(amount / 12);
        }
      }
    }
  } catch {}

  return {
    trackCount: trackRow[0].value,
    articleCount: articleRow[0].value,
    subscriberCount: subscriberRow[0].value,
    pendingChannelCount: pendingRow[0].value,
    newThisMonth: newThisMonth[0].value,
    newLastMonth: newLastMonth[0].value,
    totalUsers: totalUsers[0].value,
    creatorsMonthly: creatorsMonthlyRow[0].value,
    creatorsAnnual: creatorsAnnualRow[0].value,
    boutique: boutiqueRow[0].value,
    downloadsThisMonth: downloadsThisMonth[0].value,
    mrr: mrrCents / 100,
    arr: (mrrCents * 12) / 100,
    topTracks,
    cancellationReasons,
  };
}

export default async function AdminPage() {
  let kpis;
  try {
    kpis = await getKpis();
  } catch (err) {
    console.error("[admin] getKpis failed:", err);
    return (
      <div>
        <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "1rem" }}>Tableau de bord</h1>
        <p style={{ color: "#ef4444" }}>Erreur de chargement des données. Réessayez.</p>
      </div>
    );
  }

  const mainCards = [
    { label: "Abonnés actifs", value: String(kpis.subscriberCount), accent: true },
    { label: "MRR", value: `€${kpis.mrr.toFixed(0)}` },
    { label: "ARR", value: `€${kpis.arr.toFixed(0)}` },
    { label: "Nouveaux ce mois", value: String(kpis.newThisMonth), sub: `vs ${kpis.newLastMonth} mois dernier` },
  ];

  const secondaryCards = [
    { label: "Creators Mensuel", value: String(kpis.creatorsMonthly) },
    { label: "Creators Annuel", value: String(kpis.creatorsAnnual) },
    { label: "Boutique", value: String(kpis.boutique) },
    { label: "Utilisateurs inscrits", value: String(kpis.totalUsers) },
    { label: "Pistes publiées", value: String(kpis.trackCount) },
    { label: "Articles publiés", value: String(kpis.articleCount) },
    { label: "Téléchargements ce mois", value: String(kpis.downloadsThisMonth) },
    { label: "Whitelist en attente", value: String(kpis.pendingChannelCount), alert: kpis.pendingChannelCount > 0 },
  ];

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Tableau de bord
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Vue d&apos;ensemble de Lalason
      </p>

      {/* ── Main KPIs ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        {mainCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: card.accent ? "1px solid rgba(245,166,35,0.3)" : "1px solid var(--color-border)",
              padding: "1.5rem",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {card.label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: card.accent ? "var(--color-accent)" : "var(--color-text-primary)" }}>
              {card.value}
            </p>
            {"sub" in card && card.sub && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Secondary KPIs ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
        marginBottom: "2.5rem",
      }}>
        {secondaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: card.alert ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--color-border)",
              padding: "1rem 1.25rem",
            }}
          >
            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginBottom: "0.375rem", fontWeight: 500 }}>
              {card.label}
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: card.alert ? "#ef4444" : "var(--color-text-primary)" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two columns: Top tracks + Cancellation reasons ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(350px, 100%), 1fr))",
        gap: "1.5rem",
      }}>

        {/* Top downloaded tracks */}
        <div style={{
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "1.5rem",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Top 10 — Morceaux téléchargés
          </h2>
          {kpis.topTracks.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Aucun téléchargement</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {kpis.topTracks.map((t, i) => (
                <div
                  key={`${t.trackTitle}-${t.artistName}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: i === 0 ? "rgba(245,166,35,0.08)" : "transparent",
                  }}
                >
                  <span style={{
                    width: 24,
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: i < 3 ? "var(--color-accent)" : "var(--color-text-muted)",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.trackTitle}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                      {t.artistName}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    flexShrink: 0,
                  }}>
                    {t.downloadCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancellation reasons */}
        <div style={{
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "1.5rem",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Raisons de résiliation
          </h2>
          {kpis.cancellationReasons.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Aucune résiliation</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {kpis.cancellationReasons.map((r) => (
                <div
                  key={r.reason}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    {r.reason}
                  </span>
                  <span style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#ef4444",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                  }}>
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
