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

const PAGE_SIZE = 9;

function toValidCategory(raw: string | undefined): BlogCategory | undefined {
  if (raw && (VALID_CATEGORIES as string[]).includes(raw)) return raw as BlogCategory;
  return undefined;
}

/** Resolve localized fields based on locale */
function localizePost<T extends { title: string; titleEn?: string | null; metaDescription?: string | null; metaDescriptionEn?: string | null }>(
  post: T,
  locale: string,
): T {
  if (locale === "en") {
    return {
      ...post,
      title: post.titleEn || post.title,
      metaDescription: post.metaDescriptionEn || post.metaDescription,
    };
  }
  return post;
}

export const blogService = {
  async getAll({ category, page = 1, locale = "fr" }: { category?: string; page?: number; locale?: string } = {}) {
    const validCategory = toValidCategory(category);

    const wherePublished = eq(blogPosts.isPublished, true);
    const where = validCategory
      ? and(wherePublished, eq(blogPosts.category, validCategory))
      : wherePublished;

    const [{ total }] = await db.select({ total: count() }).from(blogPosts).where(where);

    // Ensure last page always has at least 3 items (merge with previous if needed)
    let totalPages = Math.ceil(total / PAGE_SIZE);
    const remainder = total % PAGE_SIZE;
    if (remainder > 0 && remainder < 3 && totalPages > 1) {
      totalPages -= 1;
    }

    // On the last page, fetch all remaining items
    const isLastPage = page >= totalPages;
    const limit = isLastPage ? total - (page - 1) * PAGE_SIZE : PAGE_SIZE;

    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        titleEn: blogPosts.titleEn,
        category: blogPosts.category,
        author: blogPosts.author,
        coverUrl: blogPosts.coverUrl,
        metaDescription: blogPosts.metaDescription,
        metaDescriptionEn: blogPosts.metaDescriptionEn,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset((page - 1) * PAGE_SIZE);

    const localized = posts.map((p) => localizePost(p, locale));

    return { posts: localized, total, totalPages, page };
  },

  async getBySlug(slug: string, locale = "fr") {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
      .limit(1);
    if (!post) return null;

    if (locale === "en") {
      return {
        ...post,
        title: post.titleEn || post.title,
        contentHtml: post.contentHtmlEn || post.contentHtml,
        metaTitle: post.metaTitleEn || post.metaTitle,
        metaDescription: post.metaDescriptionEn || post.metaDescription,
      };
    }
    return post;
  },

  async getRelated(category: BlogCategory, excludeSlug: string, locale = "fr", limit = 3) {
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        titleEn: blogPosts.titleEn,
        category: blogPosts.category,
        author: blogPosts.author,
        coverUrl: blogPosts.coverUrl,
        metaDescription: blogPosts.metaDescription,
        metaDescriptionEn: blogPosts.metaDescriptionEn,
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

    return posts.map((p) => localizePost(p, locale));
  },
};
