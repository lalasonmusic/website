import type { MetadataRoute } from "next";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lalason.com";
const LOCALES = ["fr", "en"] as const;

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "",              changeFrequency: "weekly",  priority: 1.0 },
  { path: "/catalogue",   changeFrequency: "weekly",  priority: 0.9 },
  { path: "/abonnements", changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog",        changeFrequency: "daily",   priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const { path, changeFrequency, priority } of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    }
  }

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

  return entries;
}
