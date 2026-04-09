import { Suspense } from "react";
import { db } from "@/db";
import { tiktokAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MarkTiktokProcessedButton from "@/components/admin/MarkTiktokProcessedButton";
import AdminSearch from "@/components/admin/AdminSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function TiktokAccountsPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const [accounts, { data: authUsers }] = await Promise.all([
    db.select().from(tiktokAccounts).orderBy(desc(tiktokAccounts.submittedAt)),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email ?? "—"]) ?? []);

  const accountsWithEmail = accounts.map((acc) => ({
    ...acc,
    email: emailMap.get(acc.userId) ?? "—",
  }));

  const filtered = q
    ? accountsWithEmail.filter((acc) => {
        const search = q.toLowerCase();
        return (
          acc.email.toLowerCase().includes(search) ||
          acc.accountUrl.toLowerCase().includes(search)
        );
      })
    : accountsWithEmail;

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Comptes TikTok
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {accounts.length} soumission{accounts.length !== 1 ? "s" : ""}
        {q && ` · ${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} pour "${q}"`}
      </p>

      <Suspense>
        <AdminSearch basePath="/admin/tiktok-accounts" placeholder="Rechercher par email ou URL TikTok..." />
      </Suspense>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          {q ? "Aucun résultat." : "Aucun compte soumis."}
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Email", "URL TikTok", "Statut", "Soumis le", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-primary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {acc.email}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                    <a
                      href={acc.accountUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-accent)", textDecoration: "none" }}
                    >
                      {acc.accountUrl}
                    </a>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor:
                          acc.status === "pending"
                            ? "rgba(245, 166, 35, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          acc.status === "pending" ? "var(--color-accent)" : "#10b981",
                      }}
                    >
                      {acc.status === "pending" ? "En attente" : "Traité"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {new Date(acc.submittedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    {acc.status === "pending" && <MarkTiktokProcessedButton id={acc.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
