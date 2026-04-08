import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PlayerProvider from "@/components/player/PlayerProvider";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import PresenceTracker from "@/components/analytics/PresenceTracker";
import CookieBanner from "@/components/analytics/CookieBanner";
import ChatWidget from "@/components/chat/ChatWidget";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  // Check subscription status for the player
  let isSubscribed = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [sub] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
        .limit(1);
      isSubscribed = !!sub;
    }
  } catch {
    // DB may not be available yet
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PostHogProvider>
        <Header locale={locale} />
        <main style={{ minHeight: "calc(100vh - 60px)" }}>
          {children}
        </main>
        <Footer locale={locale} />
        <PlayerProvider isSubscribed={isSubscribed} />
        <PresenceTracker />
        <ChatWidget />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
