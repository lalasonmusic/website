import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const categoryTypeEnum = pgEnum("category_type", [
  "STYLE",
  "THEME",
  "MOOD",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: categoryTypeEnum("type").notNull(),
  slug: text("slug").notNull().unique(),
  labelFr: text("label_fr").notNull(),
  labelEn: text("label_en").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
