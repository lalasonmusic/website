import { db } from "@/db";
import { youtubeChannels } from "@/db/schema";
import { desc } from "drizzle-orm";
import MarkProcessedButton from "@/components/admin/MarkProcessedButton";

export default async function YoutubeChannelsPage() {
  const channels = await db
    .select()
    .from(youtubeChannels)
    .orderBy(desc(youtubeChannels.submittedAt));

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Chaînes YouTube
      </h1>
      {channels.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>Aucune chaîne soumise.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Utilisateur", "Channel ID", "Statut", "Soumis le", "Action"].map((h) => (
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
              {channels.map((ch) => (
                <tr key={ch.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-muted)",
                      fontFamily: "monospace",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {ch.userId.slice(0, 8)}…
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace" }}>
                    {ch.channelId}
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
                          ch.status === "pending"
                            ? "rgba(245, 166, 35, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          ch.status === "pending" ? "var(--color-accent)" : "#10b981",
                      }}
                    >
                      {ch.status === "pending" ? "En attente" : "Traité"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {new Date(ch.submittedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    {ch.status === "pending" && <MarkProcessedButton id={ch.id} />}
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
