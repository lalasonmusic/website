import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Config pour Vercel serverless + Supabase pooler (transaction mode)
const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 10,
  connect_timeout: 15,
  max_lifetime: 60,
  ssl: "require",
});

export const db = drizzle(client, { schema });
