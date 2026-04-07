import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/fr/connexion");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== "admin") redirect("/fr");

  const navLinks = [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/youtube-channels", label: "Chaînes YouTube" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: "var(--color-bg-card)",
          borderRight: "1px solid var(--color-border)",
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            color: "var(--color-accent)",
          }}
        >
          Admin
        </div>
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              fontSize: "0.9375rem",
              fontWeight: 500,
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <main
        style={{
          flex: 1,
          padding: "2rem",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
