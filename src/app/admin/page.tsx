import { db } from "@/db";
import { tracks, blogPosts, subscriptions, youtubeChannels } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

async function getKpis() {
  const [trackRow, articleRow, subscriberRow, pendingRow] = await Promise.all([
    db.select({ value: count() }).from(tracks).where(eq(tracks.isPublished, true)),
    db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.isPublished, true)),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db
      .select({ value: count() })
      .from(youtubeChannels)
      .where(eq(youtubeChannels.status, "pending")),
  ]);

  const stripeSubscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  let mrrCents = 0;
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

  return {
    trackCount: trackRow[0].value,
    articleCount: articleRow[0].value,
    subscriberCount: subscriberRow[0].value,
    pendingChannelCount: pendingRow[0].value,
    mrr: mrrCents / 100,
    arr: (mrrCents * 12) / 100,
  };
}

export default async function AdminPage() {
  const kpis = await getKpis();

  const cards = [
    { label: "Abonnés actifs", value: String(kpis.subscriberCount) },
    { label: "MRR", value: `€${kpis.mrr.toFixed(2)}` },
    { label: "ARR", value: `€${kpis.arr.toFixed(2)}` },
    { label: "Pistes publiées", value: String(kpis.trackCount) },
    { label: "Articles publiés", value: String(kpis.articleCount) },
    { label: "Chaînes en attente", value: String(kpis.pendingChannelCount) },
  ];

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Tableau de bord
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "1.5rem",
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              {card.label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 800 }}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
