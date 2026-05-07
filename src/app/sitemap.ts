import type { MetadataRoute } from "next";
import { db } from "@/db";
import { blogPosts, artists, playlists } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { resolveDbToSlug } from "@/lib/boutique/slug-mapping";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lalason.com";
const LOCALES = ["fr", "en"] as const;

// Static pages share a stable date so we don't lie to Google about constant
// updates. Bumping `STATIC_LAST_MODIFIED` on a real content/structure change
// is a deliberate signal.
const STATIC_LAST_MODIFIED = new Date("2026-05-05");

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "",                              changeFrequency: "weekly",  priority: 1.0 },
  { path: "/catalogue",                    changeFrequency: "weekly",  priority: 0.9 },
  { path: "/abonnements",                  changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog",                         changeFrequency: "weekly",  priority: 0.8 },
  { path: "/nos-artistes",                 changeFrequency: "weekly",  priority: 0.8 },
  { path: "/faq",                          changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact",                      changeFrequency: "monthly", priority: 0.5 },
  { path: "/comparateur",                  changeFrequency: "monthly", priority: 0.6 },
  { path: "/mentions-legales",             changeFrequency: "yearly",  priority: 0.3 },
  { path: "/politique-de-confidentialite", changeFrequency: "yearly",  priority: 0.3 },
  { path: "/cgu",                          changeFrequency: "yearly",  priority: 0.3 },
  { path: "/cgv",                          changeFrequency: "yearly",  priority: 0.3 },
];

// Boutique section — slug differs per locale (FR ↔ EN), so emit separately.
const AMBIENT_HUB_BY_LOCALE: Record<(typeof LOCALES)[number], string> = {
  fr: "/musique-ambiance",
  en: "/ambient-music",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages × 2 locales
  for (const locale of LOCALES) {
    for (const { path, changeFrequency, priority } of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency,
        priority,
      });
    }
  }

  // Musique d'ambiance hub × 2 locales (high SEO priority — money pages)
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}${AMBIENT_HUB_BY_LOCALE[locale]}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.95,
    });
  }

  // Boutique playlist detail pages × 2 locales
  try {
    const boutiquePlaylists = await db
      .select({ slug: playlists.slug, updatedAt: playlists.updatedAt })
      .from(playlists)
      .where(and(eq(playlists.audience, "boutique"), eq(playlists.isPublished, true)));

    for (const p of boutiquePlaylists) {
      for (const locale of LOCALES) {
        const localeSlug = resolveDbToSlug(p.slug, locale) ?? p.slug;
        entries.push({
          url: `${BASE_URL}/${locale}${AMBIENT_HUB_BY_LOCALE[locale]}/${localeSlug}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
    }
  } catch {
    // playlists table not yet migrated in some envs
  }

  // Blog posts × 2 locales (per-post lastModified from DB)
  try {
    const posts = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));

    for (const post of posts) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // blog_posts table may not exist yet
  }

  // Artists × 2 locales
  try {
    const allArtists = await db
      .select({ slug: artists.slug, createdAt: artists.createdAt })
      .from(artists);

    for (const artist of allArtists) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/nos-artistes/${artist.slug}`,
          lastModified: artist.createdAt ?? STATIC_LAST_MODIFIED,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // artists table may not exist yet
  }

  return entries;
}
