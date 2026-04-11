import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions, downloads, tracks, artists, youtubeChannels, facebookAccounts, tiktokAccounts } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import ManageSubscriptionButton from "@/components/membre/ManageSubscriptionButton";
import CancelSubscriptionModal from "@/components/membre/CancelSubscriptionModal";
import YoutubeChannelForm from "@/components/membre/YoutubeChannelForm";
import FacebookAccountForm from "@/components/membre/FacebookAccountForm";
import TiktokAccountForm from "@/components/membre/TiktokAccountForm";
import LicenceDownloadButton from "@/components/membre/LicenceDownloadButton";
import LicenceInfoForm from "@/components/membre/LicenceInfoForm";
import BillingInfoForm from "@/components/membre/BillingInfoForm";
import InvoiceList from "@/components/membre/InvoiceList";
import LogoutButton from "@/components/membre/LogoutButton";
import { trackService } from "@/lib/services/trackService";
import BoutiquePlayer from "@/components/membre/BoutiquePlayer";
import BoutiqueDashboardTabs from "@/components/membre/BoutiqueDashboardTabs";
import UpsellSubscribeButton from "@/components/membre/UpsellSubscribeButton";
import UpsellCreatorsCard from "@/components/membre/UpsellCreatorsCard";

type Props = {
  params: Promise<{ locale: string }>;
};

function generateLicenseNumber(subscriptionId: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const shortId = subscriptionId.substring(0, 8).toUpperCase();
  return `LIC-${year}${month}-${shortId}`;
}

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
      id: subscriptions.id,
      planType: subscriptions.planType,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  // If no active sub, look up the most recent past sub so we can show a
  // contextual "your subscription expired/payment failed" banner above the
  // upsell instead of a generic pricing page.
  const [lastSub] = !activeSub
    ? await db
        .select({
          planType: subscriptions.planType,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          status: subscriptions.status,
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .orderBy(desc(subscriptions.currentPeriodEnd))
        .limit(1)
    : [undefined];

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

  // All submitted YouTube channels (max 3 enforced server-side)
  const userYoutubeChannels = await db
    .select({
      id: youtubeChannels.id,
      channelId: youtubeChannels.channelId,
      status: youtubeChannels.status,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.userId, user.id))
    .orderBy(desc(youtubeChannels.submittedAt));

  // Latest submitted Facebook account
  const [latestFacebook] = await db
    .select({ accountUrl: facebookAccounts.accountUrl })
    .from(facebookAccounts)
    .where(eq(facebookAccounts.userId, user.id))
    .orderBy(desc(facebookAccounts.submittedAt))
    .limit(1);

  // Latest submitted TikTok account
  const [latestTiktok] = await db
    .select({ accountUrl: tiktokAccounts.accountUrl })
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.userId, user.id))
    .orderBy(desc(tiktokAccounts.submittedAt))
    .limit(1);

  const planLabels: Record<string, string> = {
    creators_monthly: t("planCreatorsMonthly"),
    creators_annual: t("planCreatorsAnnual"),
    boutique_annual: t("planBoutiqueAnnual"),
  };

  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const isCreatorsPlan =
    activeSub?.planType === "creators_monthly" || activeSub?.planType === "creators_annual";
  const isBoutiquePlan = activeSub?.planType === "boutique_annual";

  // Fetch tracks for boutique player
  let boutiqueTracks: Awaited<ReturnType<typeof trackService.getPublished>>["tracks"] = [];
  let moodCategories: { slug: string; labelFr: string; labelEn: string }[] = [];
  if (isBoutiquePlan) {
    try {
      const [tracksResult, allCats] = await Promise.all([
        trackService.getPublished({ page: 1, limit: 500 }),
        trackService.getAllCategories(),
      ]);
      boutiqueTracks = tracksResult.tracks;
      moodCategories = allCats.filter((c) => c.type === "MOOD");
    } catch {}
  }

  const isMonthly = activeSub?.planType === "creators_monthly";

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
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null;
  const licenseNumber = activeSub ? generateLicenseNumber(activeSub.id, activeSub.createdAt) : null;

  return (
    <div>
      {/* ── Profile header ── */}
      <section style={{
        padding: "3rem 1.5rem 2.5rem",
        background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1.25rem" }}>
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
            {displayName && (
              <p className="text-white/70 text-sm mb-0.5">{displayName}</p>
            )}
            <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "white", margin: "0 0 0.25rem" }}>
              {t("title")}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", margin: 0 }}>
              {user.email}
            </p>
          </div>
          {activeSub && (
            <div style={{ marginLeft: "auto" }}>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
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
            {/* Contextual banner for users whose previous subscription ended */}
            {lastSub && (lastSub.status === "canceled" || lastSub.status === "past_due" || lastSub.status === "unpaid") && (
              <div
                className="mb-10 rounded-2xl p-5 border flex items-start gap-4"
                style={{
                  background: lastSub.status === "past_due" || lastSub.status === "unpaid"
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(245,166,35,0.08)",
                  borderColor: lastSub.status === "past_due" || lastSub.status === "unpaid"
                    ? "rgba(239,68,68,0.25)"
                    : "rgba(245,166,35,0.25)",
                }}
              >
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={lastSub.status === "past_due" || lastSub.status === "unpaid" ? "#ef4444" : "var(--color-accent)"}
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">
                    {lastSub.status === "past_due" || lastSub.status === "unpaid"
                      ? t("expiredBannerPaymentTitle")
                      : t("expiredBannerEndedTitle")}
                  </p>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {lastSub.status === "past_due" || lastSub.status === "unpaid"
                      ? t("expiredBannerPaymentDesc")
                      : t("expiredBannerEndedDesc", {
                          date: lastSub.currentPeriodEnd.toLocaleDateString(dateLocale, dateOpts),
                        })}
                  </p>
                </div>
              </div>
            )}

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

              {/* Créateurs (popular) */}
              <div className="relative group">
                <div className="absolute -inset-px rounded-2xl" style={{ background: "linear-gradient(180deg, rgba(245,166,35,0.6) 0%, rgba(245,166,35,0.15) 100%)" }} />
                <div className="absolute -inset-px rounded-2xl blur-xl transition-opacity duration-500 opacity-[0.15] group-hover:opacity-[0.3]" style={{ background: "rgba(245,166,35,0.6)" }} />

                <div className="relative rounded-2xl p-7 h-full flex flex-col" style={{ background: "var(--color-bg-secondary)" }}>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 self-start" style={{ background: "rgba(245,166,35,0.12)", color: "var(--color-accent)" }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {p("mostPopular")}
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-1.5">{p("creators.name")}</h3>
                  <p className="text-sm text-white/50 mb-6 leading-relaxed">{p("creators.description")}</p>
                  <UpsellCreatorsCard
                    locale={locale}
                    monthlyPrice={p("creators.monthly_price")}
                    annualPrice={p("creators.annual_price")}
                    monthlyLabel={p("monthly")}
                    annualLabel={p("annual")}
                    saveLabel={p("save", { percent: "38" })}
                    perMonth={p("perMonth")}
                    perYear={p("perYear")}
                    ctaLabel={t("upsellCta")}
                  />
                  <div className="h-px bg-white/10 mb-5" />
                  <ul className="space-y-3 mt-auto">
                    {creatorsFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[0.875rem] text-white/65">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="var(--color-accent)" fillOpacity={0.12} /><path d="M6.5 10.5L9 13L13.5 7.5" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Boutique */}
              <div className="rounded-2xl p-7 h-full flex flex-col border border-white/[0.08] transition-all duration-500 hover:border-white/[0.15]" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 mb-5 self-start" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                  {p("onlyAnnual")}
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-1.5">{p("boutique.name")}</h3>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">{p("boutique.description")}</p>
                <div className="mb-7">
                  <span className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{p("boutique.annual_price")}</span>
                  <span className="text-white/40 text-sm ml-1.5">{p("perYear")}</span>
                </div>
                <UpsellSubscribeButton planType="boutique_annual" locale={locale} label={t("upsellCta")} variant="secondary" />
                <div className="h-px bg-white/10 mb-5" />
                <ul className="space-y-3 mt-auto">
                  {boutiqueFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[0.875rem] text-white/65">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="var(--color-accent)" fillOpacity={0.12} /><path d="M6.5 10.5L9 13L13.5 7.5" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                  <svg className="w-4 h-4 text-green-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Subscriber dashboard ── */}
      {activeSub && isBoutiquePlan && (
        <section className="px-4 md:px-6 py-10">
          <div className="max-w-[900px] mx-auto">
            <BoutiqueDashboardTabs
              labels={{
                player: t("tabPlayer"),
                account: t("tabAccount"),
                billing: t("tabBilling"),
              }}
              playerSection={
                boutiqueTracks.length > 0 ? (
                  <BoutiquePlayer
                    tracks={boutiqueTracks}
                    locale={locale}
                    moodFilters={moodCategories.map((c) => ({
                      slug: c.slug,
                      label: locale === "fr" ? c.labelFr : c.labelEn,
                    }))}
                  />
                ) : null
              }
              accountSection={
                <div className="space-y-6">
                  {/* License + Subscription (2 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {licenseNumber && (
                      <div
                        className="rounded-2xl p-6 border border-white/[0.08]"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <div className="flex items-center gap-2 mb-5">
                          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <h2 className="text-base font-bold text-white">{t("licenseTitle")}</h2>
                        </div>

                        <div
                          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <svg className="w-4 h-4 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span className="font-mono text-white/80 text-sm tracking-wider font-semibold">
                            {licenseNumber}
                          </span>
                        </div>

                        <p className="text-sm text-white/40 leading-relaxed mb-5">
                          {t("licenseDesc")}
                        </p>

                        <div className="mb-5">
                          <LicenceInfoForm
                            initialFirstName={user.user_metadata?.licence_first_name ?? ""}
                            initialLastName={user.user_metadata?.licence_last_name ?? ""}
                            initialAddress={user.user_metadata?.licence_address ?? ""}
                            labels={{
                              firstName: t("licenseFirstName"),
                              lastName: t("licenseLastName"),
                              address: t("licenseAddress"),
                              save: t("licenseSave"),
                              saved: t("licenseSaved"),
                              hint: t("licenseFormHint"),
                            }}
                          />
                        </div>

                        <LicenceDownloadButton
                          label={t("licenseDownload")}
                          locale={locale}
                        />
                      </div>
                    )}

                    <div
                      className="rounded-2xl p-6 border border-white/[0.08]"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-white">{t("plan")}</h2>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                        >
                          {t("statusActive")}
                        </span>
                      </div>

                      <p className="text-xl font-extrabold text-white mb-4">
                        {planLabels[activeSub.planType]}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/40">{t("subscribedSince")}</span>
                          <span className="text-white/70 font-medium">
                            {activeSub.createdAt.toLocaleDateString(dateLocale, dateOpts)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-white/40">{t("renewalDate")}</span>
                          <span className="text-white/70 font-medium">
                            {activeSub.currentPeriodEnd.toLocaleDateString(dateLocale, dateOpts)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <ManageSubscriptionButton label={t("managePayment")} />
                        <CancelSubscriptionModal
                          labels={{
                            title: t("cancelTitle"),
                            subtitle: t("cancelSubtitle"),
                            reasons: [
                              t("cancelReason1"),
                              t("cancelReason2"),
                              t("cancelReason3"),
                              t("cancelReason4"),
                            ],
                            reasonOther: t("cancelReasonOther"),
                            placeholder: t("cancelPlaceholder"),
                            confirm: t("cancelConfirm"),
                            back: t("cancelBack"),
                            success: t("cancelSuccess"),
                            error: t("cancelError"),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Support + Logout */}
                  <div
                    className="rounded-2xl p-5 border border-white/[0.08] flex items-center justify-between flex-wrap gap-4"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-sm text-white/40">
                      {t("supportText")}{" "}
                      <a
                        href={`/${locale}/contact`}
                        className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2"
                      >
                        {t("supportLink")}
                      </a>
                    </p>
                    <LogoutButton label={t("logout")} locale={locale} />
                  </div>
                </div>
              }
              billingSection={
                <div className="space-y-6">
                  {/* Billing info */}
                  <div
                    className="rounded-2xl p-6 border border-white/[0.08]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h2 className="text-base font-bold text-white">{t("billingTitle")}</h2>
                    </div>
                    <p className="text-sm text-white/40 mb-4">{t("billingDesc")}</p>
                    <BillingInfoForm
                      initialCompany={user.user_metadata?.billing_company ?? ""}
                      initialVat={user.user_metadata?.billing_vat ?? ""}
                      initialAddress={user.user_metadata?.billing_address ?? ""}
                      initialPostalCode={user.user_metadata?.billing_postal_code ?? ""}
                      initialCity={user.user_metadata?.billing_city ?? ""}
                      initialCountry={user.user_metadata?.billing_country ?? ""}
                      labels={{
                        company: t("billingCompany"),
                        vat: t("billingVat"),
                        address: t("billingAddress"),
                        postalCode: t("billingPostalCode"),
                        city: t("billingCity"),
                        country: t("billingCountry"),
                        save: t("billingSave"),
                        saved: t("billingSaved"),
                        hint: t("billingHint"),
                      }}
                    />
                  </div>

                  {/* Invoices */}
                  <div
                    className="rounded-2xl p-6 border border-white/[0.08]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                      <h2 className="text-base font-bold text-white">{t("invoicesTitle")}</h2>
                    </div>
                    <InvoiceList
                      locale={locale}
                      labels={{
                        empty: t("invoicesEmpty"),
                        download: t("invoiceDownload"),
                        paid: t("invoicePaid"),
                        open: t("invoiceOpen"),
                        uncollectible: t("invoiceUncollectible"),
                      }}
                    />
                  </div>
                </div>
              }
            />
          </div>
        </section>
      )}

      {/* ── Subscriber dashboard (Creators — vertical layout) ── */}
      {activeSub && !isBoutiquePlan && (
        <section className="px-4 md:px-6 py-10">
          <div className="max-w-[900px] mx-auto space-y-6">

            {/* ── CTA Catalogue + Favorites (creators only) ── */}
            {isCreatorsPlan && (
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                <a
                  href={`/${locale}/catalogue`}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold no-underline transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                    color: "var(--color-accent-text)",
                    boxShadow: "0 4px 24px rgba(245,166,35,0.2)",
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t("dashboardCta")}
                </a>
                <a
                  href={`/${locale}/membre/favoris`}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold no-underline transition-all duration-300 hover:scale-[1.01] border"
                  style={{
                    background: "rgba(245,166,35,0.08)",
                    color: "var(--color-accent)",
                    borderColor: "rgba(245,166,35,0.3)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {t("favoritesLink")}
                </a>
              </div>
            )}

            {/* ── Upgrade banner (monthly only) ── */}
            {isMonthly && (
              <div
                className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.03) 100%)",
                  border: "1px solid rgba(245,166,35,0.2)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,166,35,0.15)" }}
                  >
                    <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t("upgradeTitle")}</p>
                    <p className="text-xs text-white/50">
                      {t("upgradeDesc", { price: p("creators.annual_price"), monthlyTotal: "191,88 €" })}
                    </p>
                  </div>
                </div>
                <a
                  href={`/${locale}/abonnements`}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all duration-300 hover:scale-[1.02] shrink-0"
                  style={{
                    background: "var(--color-accent)",
                    color: "var(--color-accent-text)",
                  }}
                >
                  {t("upgradeCta")}
                </a>
              </div>
            )}

            {/* ── License + Subscription (2-column) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── License card ── */}
              {licenseNumber && (
                <div
                  className="rounded-2xl p-6 border border-white/[0.08]"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h2 className="text-base font-bold text-white">{t("licenseTitle")}</h2>
                  </div>

                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <svg className="w-4 h-4 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="font-mono text-white/80 text-sm tracking-wider font-semibold">
                      {licenseNumber}
                    </span>
                  </div>

                  <p className="text-sm text-white/40 leading-relaxed mb-5">
                    {t("licenseDesc")}
                  </p>

                  <div className="mb-5">
                    <LicenceInfoForm
                      initialFirstName={user.user_metadata?.licence_first_name ?? ""}
                      initialLastName={user.user_metadata?.licence_last_name ?? ""}
                      initialAddress={user.user_metadata?.licence_address ?? ""}
                      labels={{
                        firstName: t("licenseFirstName"),
                        lastName: t("licenseLastName"),
                        address: t("licenseAddress"),
                        save: t("licenseSave"),
                        saved: t("licenseSaved"),
                        hint: t("licenseFormHint"),
                      }}
                    />
                  </div>

                  <LicenceDownloadButton
                    label={t("licenseDownload")}
                    locale={locale}
                  />
                </div>
              )}

              {/* ── Subscription card ── */}
              <div
                className="rounded-2xl p-6 border border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">{t("plan")}</h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                  >
                    {t("statusActive")}
                  </span>
                </div>

                <p className="text-xl font-extrabold text-white mb-4">
                  {planLabels[activeSub.planType]}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white/40">{t("subscribedSince")}</span>
                    <span className="text-white/70 font-medium">
                      {activeSub.createdAt.toLocaleDateString(dateLocale, dateOpts)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-white/40">{t("renewalDate")}</span>
                    <span className="text-white/70 font-medium">
                      {activeSub.currentPeriodEnd.toLocaleDateString(dateLocale, dateOpts)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <ManageSubscriptionButton label={t("managePayment")} />
                  <CancelSubscriptionModal
                    labels={{
                      title: t("cancelTitle"),
                      subtitle: t("cancelSubtitle"),
                      reasons: [
                        t("cancelReason1"),
                        t("cancelReason2"),
                        t("cancelReason3"),
                        t("cancelReason4"),
                      ],
                      reasonOther: t("cancelReasonOther"),
                      placeholder: t("cancelPlaceholder"),
                      confirm: t("cancelConfirm"),
                      back: t("cancelBack"),
                      success: t("cancelSuccess"),
                      error: t("cancelError"),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── YouTube Whitelist ── */}
            {isCreatorsPlan && (
              <div
                className="rounded-2xl p-6 border border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <h2 className="text-base font-bold text-white">{t("youtubeChannel")}</h2>
                </div>
                <p className="text-sm text-white/40 mb-4">{t("youtubeChannelDesc")}</p>
                <YoutubeChannelForm
                  existingChannels={userYoutubeChannels}
                  labels={{
                    channelId: t("youtubeChannelId"),
                    save: t("youtubeChannelSave"),
                    saved: t("youtubeChannelSaved"),
                    placeholder: t("youtubeChannelPlaceholder"),
                    add: t("youtubeChannelAdd"),
                    remainingByCount: {
                      0: t("youtubeChannelRemaining", { count: 0 }),
                      1: t("youtubeChannelRemaining", { count: 1 }),
                      2: t("youtubeChannelRemaining", { count: 2 }),
                      3: t("youtubeChannelRemaining", { count: 3 }),
                    },
                    max: t("youtubeChannelMax"),
                    statusPending: t("youtubeChannelStatusPending"),
                    statusProcessed: t("youtubeChannelStatusProcessed"),
                    remove: t("youtubeChannelRemove"),
                    confirmRemove: t("youtubeChannelConfirmRemove"),
                  }}
                />
              </div>
            )}

            {/* ── Facebook Whitelist ── */}
            {isCreatorsPlan && (
              <div
                className="rounded-2xl p-6 border border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <h2 className="text-base font-bold text-white">{t("facebookAccount")}</h2>
                </div>
                <p className="text-sm text-white/40 mb-4">{t("facebookAccountDesc")}</p>
                <FacebookAccountForm
                  existingAccountUrl={latestFacebook?.accountUrl}
                  labels={{
                    accountUrl: t("facebookAccountUrl"),
                    save: t("facebookAccountSave"),
                    saved: t("facebookAccountSaved"),
                    placeholder: t("facebookAccountPlaceholder"),
                  }}
                />
              </div>
            )}

            {/* ── TikTok Whitelist ── */}
            {isCreatorsPlan && (
              <div
                className="rounded-2xl p-6 border border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <h2 className="text-base font-bold text-white">{t("tiktokAccount")}</h2>
                </div>
                <p className="text-sm text-white/40 mb-4">{t("tiktokAccountDesc")}</p>
                <TiktokAccountForm
                  existingAccountUrl={latestTiktok?.accountUrl}
                  labels={{
                    accountUrl: t("tiktokAccountUrl"),
                    save: t("tiktokAccountSave"),
                    saved: t("tiktokAccountSaved"),
                    placeholder: t("tiktokAccountPlaceholder"),
                  }}
                />
              </div>
            )}

            {/* ── Billing information ── */}
            <div
              className="rounded-2xl p-6 border border-white/[0.08]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h2 className="text-base font-bold text-white">{t("billingTitle")}</h2>
              </div>
              <p className="text-sm text-white/40 mb-4">{t("billingDesc")}</p>
              <BillingInfoForm
                initialCompany={user.user_metadata?.billing_company ?? ""}
                initialVat={user.user_metadata?.billing_vat ?? ""}
                initialAddress={user.user_metadata?.billing_address ?? ""}
                initialPostalCode={user.user_metadata?.billing_postal_code ?? ""}
                initialCity={user.user_metadata?.billing_city ?? ""}
                initialCountry={user.user_metadata?.billing_country ?? ""}
                labels={{
                  company: t("billingCompany"),
                  vat: t("billingVat"),
                  address: t("billingAddress"),
                  postalCode: t("billingPostalCode"),
                  city: t("billingCity"),
                  country: t("billingCountry"),
                  save: t("billingSave"),
                  saved: t("billingSaved"),
                  hint: t("billingHint"),
                }}
              />
            </div>

            {/* ── Invoices ── */}
            <div
              className="rounded-2xl p-6 border border-white/[0.08]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <h2 className="text-base font-bold text-white">{t("invoicesTitle")}</h2>
              </div>
              <InvoiceList
                locale={locale}
                labels={{
                  empty: t("invoicesEmpty"),
                  download: t("invoiceDownload"),
                  paid: t("invoicePaid"),
                  open: t("invoiceOpen"),
                  uncollectible: t("invoiceUncollectible"),
                }}
              />
            </div>

            {/* ── Downloads ── */}
            {isCreatorsPlan && (
              <div
                className="rounded-2xl p-6 border border-white/[0.08]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <h2 className="text-base font-bold text-white">{t("downloads")}</h2>
                  {downloadCount > 0 && (
                    <span className="text-sm text-white/30 font-normal">({downloadCount})</span>
                  )}
                </div>

                {recentDownloads.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-white/40 mb-4 max-w-sm mx-auto">
                      {t("downloadsEmpty")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDownloads.map((dl) => (
                      <div
                        key={dl.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-200"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">
                            {dl.trackTitle}
                          </p>
                          <p className="text-xs text-white/40">{dl.artistName}</p>
                        </div>
                        <p className="text-xs text-white/30 shrink-0 ml-4">
                          {dl.downloadedAt.toLocaleDateString(dateLocale, {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Support + Logout ── */}
            <div
              className="rounded-2xl p-5 border border-white/[0.08] flex items-center justify-between flex-wrap gap-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-sm text-white/40">
                {t("supportText")}{" "}
                <a
                  href={`/${locale}/contact`}
                  className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2"
                >
                  {t("supportLink")}
                </a>
              </p>
              <LogoutButton label={t("logout")} locale={locale} />
            </div>

          </div>
        </section>
      )}
    </div>
  );
}
