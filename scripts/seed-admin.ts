/**
 * Set a user as admin by email.
 * Usage: npx tsx scripts/seed-admin.ts <email>
 * Requires: DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, uuid, pgEnum, text } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/seed-admin.ts <email>");
  process.exit(1);
}

const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: userRoleEnum("role").notNull().default("user"),
  stripeCustomerId: text("stripe_customer_id"),
});

async function run() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((u) => u.email === email);
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  await db.update(profiles).set({ role: "admin" }).where(eq(profiles.id, user.id));

  console.log(`✓ User ${email} (${user.id}) is now admin`);
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
