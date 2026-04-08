import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== "admin") redirect("/admin/login");

  const navLinks = [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/visiteurs", label: "Visiteurs" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/catalogue", label: "Catalogue" },
    { href: "/admin/artistes", label: "Artistes" },
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
        <Link
          href="/admin"
          style={{
            fontWeight: 800,
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            color: "var(--color-accent)",
            textDecoration: "none",
          }}
        >
          Lalason Admin
        </Link>
        {navLinks.map((link) => (
          <Link
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
          </Link>
        ))}
        <AdminLogoutButton />
      </nav>
      <main
        style={{
          flex: 1,
          padding: "2rem",
          backgroundColor: "var(--color-bg-primary)",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
