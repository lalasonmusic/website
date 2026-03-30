import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, desc, ne, count } from "drizzle-orm";
import type { BlogPost } from "@/db/schema";

type BlogCategory = BlogPost["category"];

const VALID_CATEGORIES: BlogCategory[] = [
  "guides",
  "youtube-createurs",
  "cas-usage",
  "artistes-coulisses",
];

const PAGE_SIZE = 10;

function toValidCategory(raw: string | undefined): BlogCategory | undefined {
  if (raw && (VALID_CATEGORIES as string[]).includes(raw)) return raw as BlogCategory;
  return undefined;
}

export const blogService = {
  async getAll({ category, page = 1 }: { category?: string; page?: number } = {}) {
    const validCategory = toValidCategory(category);

    const wherePublished = eq(blogPosts.isPublished, true);
    const where = validCategory
      ? and(wherePublished, eq(blogPosts.category, validCategory))
      : wherePublished;

    const [{ total }] = await db.select({ total: count() }).from(blogPosts).where(where);

    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        author: blogPosts.author,
        coverUrl: blogPosts.coverUrl,
        metaDescription: blogPosts.metaDescription,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    return { posts, total, totalPages: Math.ceil(total / PAGE_SIZE), page };
  },

  async getBySlug(slug: string) {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
      .limit(1);
    return post ?? null;
  },

  async getRelated(category: BlogCategory, excludeSlug: string, limit = 3) {
    return db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        author: blogPosts.author,
        coverUrl: blogPosts.coverUrl,
        metaDescription: blogPosts.metaDescription,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.isPublished, true),
          eq(blogPosts.category, category),
          ne(blogPosts.slug, excludeSlug)
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  },
};
