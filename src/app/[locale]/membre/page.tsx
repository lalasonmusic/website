import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions, downloads, tracks, artists, youtubeChannels } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import ManageSubscriptionButton from "@/components/membre/ManageSubscriptionButton";
import YoutubeChannelForm from "@/components/membre/YoutubeChannelForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MembrePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("member");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/connexion`);

  // Active subscription
  const [activeSub] = await db
    .select({
      planType: subscriptions.planType,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  // Total download count
  const [{ downloadCount }] = await db
    .select({ downloadCount: count() })
    .from(downloads)
    .where(eq(downloads.userId, user.id));

  // Recent downloads (last 20) with track + artist info
  const recentDownloads = await db
    .select({
      id: downloads.id,
      downloadedAt: downloads.downloadedAt,
      trackTitle: tracks.title,
      trackSlug: tracks.slug,
      artistName: artists.name,
    })
    .from(downloads)
    .innerJoin(tracks, eq(downloads.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(downloads.userId, user.id))
    .orderBy(desc(downloads.downloadedAt))
    .limit(20);

  // Latest submitted YouTube channel
  const [latestChannel] = await db
    .select({ channelId: youtubeChannels.channelId })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.userId, user.id))
    .orderBy(desc(youtubeChannels.submittedAt))
    .limit(1);

  const planLabels: Record<string, string> = {
    creators_monthly: t("planCreatorsMonthly"),
    creators_annual: t("planCreatorsAnnual"),
    boutique_annual: t("planBoutiqueAnnual"),
  };

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const isCreatorsPlan =
    activeSub?.planType === "creators_monthly" || activeSub?.planType === "creators_annual";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: "0.375rem" }}>
        {t("title")}
      </h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "3rem", fontSize: "0.9375rem" }}>
        {user.email}
      </p>

      {/* Subscription */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.25rem" }}>
          {t("plan")}
        </h2>
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
          }}
        >
          {activeSub ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}
                >
                  <span style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                    {planLabels[activeSub.planType]}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.2rem 0.625rem",
                      borderRadius: "9999px",
                      backgroundColor:
                        activeSub.status === "active"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                      color: activeSub.status === "active" ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {activeSub.status === "active" ? t("statusActive") : t("statusPastDue")}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  {t("renewalDate")}{" "}
                  {activeSub.currentPeriodEnd.toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <ManageSubscriptionButton label={t("manageSubscription")} />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
                {t("noSubscription")}
              </p>
              <a
                href={`/${locale}/abonnements`}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-text)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: "var(--radius-full)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t("subscribeCta")}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* YouTube Whitelist (Creators plans only) */}
      {isCreatorsPlan && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.25rem" }}>
            {t("youtubeChannel")}
          </h2>
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <YoutubeChannelForm
              existingChannelId={latestChannel?.channelId}
              labels={{
                channelId: t("youtubeChannelId"),
                save: t("youtubeChannelSave"),
                saved: t("youtubeChannelSaved"),
                placeholder: t("youtubeChannelPlaceholder"),
              }}
            />
          </div>
        </section>
      )}

      {/* Downloads */}
      <section>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.25rem" }}>
          {t("downloads")}
          {downloadCount > 0 && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "var(--color-text-muted)",
              }}
            >
              ({downloadCount})
            </span>
          )}
        </h2>
        {recentDownloads.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
            {t("noDownloads")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentDownloads.map((dl) => (
              <div
                key={dl.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  gap: "1rem",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      marginBottom: "0.125rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dl.trackTitle}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {dl.artistName}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {dl.downloadedAt.toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
