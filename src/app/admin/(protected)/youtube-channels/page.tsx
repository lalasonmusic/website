import { Suspense } from "react";
import { db } from "@/db";
import { youtubeChannels } from "@/db/schema";
import { desc } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MarkProcessedButton from "@/components/admin/MarkProcessedButton";
import AdminSearch from "@/components/admin/AdminSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function YoutubeChannelsPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const [channels, { data: authUsers }] = await Promise.all([
    db.select().from(youtubeChannels).orderBy(desc(youtubeChannels.submittedAt)),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email ?? "—"]) ?? []);

  // Attach email to each channel
  const channelsWithEmail = channels.map((ch) => ({
    ...ch,
    email: emailMap.get(ch.userId) ?? "—",
  }));

  // Filter by search query (email or channel ID)
  const filtered = q
    ? channelsWithEmail.filter((ch) => {
        const search = q.toLowerCase();
        return (
          ch.email.toLowerCase().includes(search) ||
          ch.channelId.toLowerCase().includes(search)
        );
      })
    : channelsWithEmail;

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Chaînes YouTube
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {channels.length} soumission{channels.length !== 1 ? "s" : ""}
        {q && ` · ${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} pour "${q}"`}
      </p>

      <Suspense>
        <AdminSearch basePath="/admin/youtube-channels" placeholder="Rechercher par email ou ID de chaîne..." />
      </Suspense>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          {q ? "Aucun résultat." : "Aucune chaîne soumise."}
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Email", "Channel ID", "Statut", "Soumis le", "Action"].map((h) => (
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
              {filtered.map((ch) => (
                <tr key={ch.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td
                    style={{
                      padding: "0.875rem 1rem",
                      color: "var(--color-text-primary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {ch.email}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", fontSize: "0.8125rem" }}>
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
