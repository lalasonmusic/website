import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tracks } from "./tracks";
import { categories } from "./categories";

export const trackCategories = pgTable(
  "track_categories",
  {
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.trackId, table.categoryId] })]
);

export const trackCategoriesRelations = relations(
  trackCategories,
  ({ one }) => ({
    track: one(tracks, {
      fields: [trackCategories.trackId],
      references: [tracks.id],
    }),
    category: one(categories, {
      fields: [trackCategories.categoryId],
      references: [categories.id],
    }),
  })
);
