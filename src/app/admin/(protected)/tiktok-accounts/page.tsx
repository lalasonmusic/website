import { db } from "@/db";
import { tiktokAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import MarkTiktokProcessedButton from "@/components/admin/MarkTiktokProcessedButton";

export default async function TiktokAccountsPage() {
  const accounts = await db
    .select()
    .from(tiktokAccounts)
    .orderBy(desc(tiktokAccounts.submittedAt));

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Comptes TikTok
      </h1>
      {accounts.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>Aucun compte soumis.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Utilisateur", "URL TikTok", "Statut", "Soumis le", "Action"].map((h) => (
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
              {accounts.map((acc) => (
                <tr key={acc.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-muted)",
                      fontFamily: "monospace",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {acc.userId.slice(0, 8)}…
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
