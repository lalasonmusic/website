import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const blogCategoryEnum = pgEnum("blog_category", [
  "guides",
  "youtube-createurs",
  "cas-usage",
  "artistes-coulisses",
]);

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  contentHtml: text("content_html").notNull(),
  contentHtmlEn: text("content_html_en"),
  category: blogCategoryEnum("category").notNull(),
  author: text("author").notNull().default("Lalason"),
  coverUrl: text("cover_url"),
  metaTitle: text("meta_title"),
  metaTitleEn: text("meta_title_en"),
  metaDescription: text("meta_description"),
  metaDescriptionEn: text("meta_description_en"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
