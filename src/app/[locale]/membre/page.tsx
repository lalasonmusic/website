import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions, downloads, tracks, artists, youtubeChannels } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import ManageSubscriptionButton from "@/components/membre/ManageSubscriptionButton";
import YoutubeChannelForm from "@/components/membre/YoutubeChannelForm";
import { trackService } from "@/lib/services/trackService";
import TrackCard from "@/components/catalogue/TrackCard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MembrePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("member");
  const p = await getTranslations("pricing");

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
  const isBoutiquePlan = activeSub?.planType === "boutique_annual";

  // Fetch tracks for boutique player
  let boutiqueTracks: Awaited<ReturnType<typeof trackService.getPublished>>["tracks"] = [];
  if (isBoutiquePlan) {
    try {
      const result = await trackService.getPublished({ page: 1, limit: 100 });
      boutiqueTracks = result.tracks;
    } catch {}
  }

  // Features for upsell cards
  const creatorsFeatures = [
    p("creators.features.0"),
    p("creators.features.1"),
    p("creators.features.2"),
    p("creators.features.3"),
    p("creators.features.4"),
  ];
  const boutiqueFeatures = [
    p("boutique.features.0"),
    p("boutique.features.1"),
    p("boutique.features.2"),
    p("boutique.features.3"),
  ];

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "?";

  return (
    <div>
      {/* ── Profile header ── */}
      <section style={{
        padding: "3rem 1.5rem 2.5rem",
        background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Avatar */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ color: "var(--color-accent-text)", fontWeight: 800, fontSize: "1.25rem" }}>
              {initials}
            </span>
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "white", margin: "0 0 0.25rem" }}>
              {t("title")}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", margin: 0 }}>
              {user.email}
            </p>
          </div>
          {activeSub && (
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: activeSub.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: activeSub.status === "active" ? "#22c55e" : "#ef4444",
              }}>
                {activeSub.status === "active" ? t("statusActive") : t("statusPastDue")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Non-subscriber: Upsell section ── */}
      {!activeSub && (
        <section className="px-4 md:px-6 py-16 relative overflow-hidden">
          {/* Decorative glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)" }}
          />

          <div className="relative max-w-[840px] mx-auto">
            {/* Hero CTA */}
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={{ background: "rgba(245,166,35,0.1)", color: "var(--color-accent)" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                {t("upsellBadge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                {t("upsellTitle")}
              </h2>
              <p className="text-base text-white/50 max-w-lg mx-auto leading-relaxed">
                {t("upsellSubtitle")}
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

              {/* ── Créateurs (popular) ── */}
              <div className="relative group">
                {/* Gradient border */}
                <div
                  className="absolute -inset-px rounded-2xl"
                  style={{ background: "linear-gradient(180deg, rgba(245,166,35,0.6) 0%, rgba(245,166,35,0.15) 100%)" }}
                />
                {/* Soft glow */}
                <div
                  className="absolute -inset-px rounded-2xl blur-xl transition-opacity duration-500 opacity-[0.15] group-hover:opacity-[0.3]"
                  style={{ background: "rgba(245,166,35,0.6)" }}
                />

                <div className="relative rounded-2xl p-7 h-full flex flex-col" style={{ background: "var(--color-bg-secondary)" }}>
                  {/* Badge */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 self-start"
                    style={{ background: "rgba(245,166,35,0.12)", color: "var(--color-accent)" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {p("mostPopular")}
                  </div>

                  <h3 className="text-2xl font-extrabold text-white mb-1.5">{p("creators.name")}</h3>
                  <p className="text-sm text-white/50 mb-6 leading-relaxed">{p("creators.description")}</p>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{p("creators.annual_price")}</span>
                    <span className="text-white/40 text-sm ml-1.5">{p("perYear")}</span>
                  </div>
                  <p className="text-sm text-white/30 mb-6">
                    {t("upsellOrMonthly", { price: p("creators.monthly_price") })}
                  </p>

                  {/* CTA */}
                  <a
                    href={`/${locale}/abonnements`}
                    className="block w-full py-3.5 rounded-xl font-semibold text-base text-center transition-all duration-300
                      text-[var(--color-accent-text)] no-underline
                      hover:scale-[1.02] active:scale-[0.98] mb-7"
                    style={{
                      background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                      boxShadow: "0 4px 24px rgba(245,166,35,0.25)",
                    }}
                  >
                    {t("upsellCta")}
                  </a>

                  {/* Divider */}
                  <div className="h-px bg-white/10 mb-5" />

                  {/* Features */}
                  <ul className="space-y-3 mt-auto">
                    {creatorsFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[0.875rem] text-white/65">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="var(--color-accent)" fillOpacity={0.12} />
                          <path d="M6.5 10.5L9 13L13.5 7.5" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Boutique ── */}
              <div
                className="rounded-2xl p-7 h-full flex flex-col border border-white/[0.08] transition-all duration-500 hover:border-white/[0.15]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {/* Badge */}
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 mb-5 self-start"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                >
                  {p("onlyAnnual")}
                </div>

                <h3 className="text-2xl font-extrabold text-white mb-1.5">{p("boutique.name")}</h3>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">{p("boutique.description")}</p>

                {/* Price */}
                <div className="mb-7">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{p("boutique.annual_price")}</span>
                  <span className="text-white/40 text-sm ml-1.5">{p("perYear")}</span>
                </div>

                {/* CTA */}
                <a
                  href={`/${locale}/abonnements`}
                  className="block w-full py-3.5 rounded-xl font-semibold text-base text-center transition-all duration-300
                    text-white no-underline border border-white/[0.12]
                    hover:border-white/[0.2] hover:scale-[1.02] active:scale-[0.98] mb-7"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {t("upsellCta")}
                </a>

                {/* Divider */}
                <div className="h-px bg-white/10 mb-5" />

                {/* Features */}
                <ul className="space-y-3 mt-auto">
                  {boutiqueFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[0.875rem] text-white/65">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="var(--color-accent)" fillOpacity={0.12} />
                        <path d="M6.5 10.5L9 13L13.5 7.5" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {[t("trustNoCommitment"), t("trustLifetimeLicense"), t("trustNewReleases")].map((label) => (
                <span key={label} className="flex items-center gap-2 text-sm text-white/35">
                  <svg className="w-4 h-4 text-green-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Subscriber content ── */}
      {activeSub && (
        <section style={{
          background: "linear-gradient(to bottom, #e8edf0 0%, #f8f7f5 80px, #f8f7f5 100%)",
          padding: "2.5rem 1.5rem 4rem",
        }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>

            {/* Subscription status */}
            <div style={{
              padding: "1.5rem",
              backgroundColor: "white",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              marginBottom: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1b3a4b" }}>
                  {planLabels[activeSub.planType]}
                </span>
                <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: "0.25rem 0 0" }}>
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

            {/* YouTube Whitelist (Creators plans only) */}
            {isCreatorsPlan && (
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#1b3a4b", marginBottom: "1rem" }}>
                  {t("youtubeChannel")}
                </h2>
                <div style={{
                  padding: "1.5rem",
                  backgroundColor: "white",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                }}>
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
              </div>
            )}

            {/* Downloads — Creators plans only */}
            {isCreatorsPlan && (
              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.25rem" }}>
                  {t("downloads")}
                  {downloadCount > 0 && (
                    <span style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--color-text-muted)",
                    }}>
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
                          <p style={{
                            fontWeight: 600,
                            fontSize: "0.9375rem",
                            marginBottom: "0.125rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {dl.trackTitle}
                          </p>
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                            {dl.artistName}
                          </p>
                        </div>
                        <p style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}>
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
            )}

            {/* Boutique Player — continuous jukebox for in-store music */}
            {isBoutiquePlan && boutiqueTracks.length > 0 && (
              <section>
                <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                  {locale === "fr" ? "Votre player en boutique" : "Your in-store player"}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  {locale === "fr"
                    ? "Lancez la lecture — les morceaux s'enchaînent automatiquement."
                    : "Start playing — tracks play continuously one after another."}
                </p>
                <div style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  padding: "0.5rem 0",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}>
                  {boutiqueTracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      queue={boutiqueTracks}
                      queueIndex={index}
                      locale={locale}
                      isSubscribed={true}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
