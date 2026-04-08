import Link from "next/link";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { asc, count, eq } from "drizzle-orm";

async function getPlaylists() {
  const all = await db.select().from(playlists).orderBy(asc(playlists.displayOrder));

  // Get track count per playlist
  const counts = await db
    .select({ playlistId: playlistTracks.playlistId, value: count() })
    .from(playlistTracks)
    .groupBy(playlistTracks.playlistId);

  const countMap = new Map(counts.map((c) => [c.playlistId, c.value]));

  return all.map((p) => ({
    ...p,
    trackCount: countMap.get(p.id) ?? 0,
  }));
}

export default async function PlaylistsAdminPage() {
  const allPlaylists = await getPlaylists();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>Playlists</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {allPlaylists.length} playlists d&apos;ambiance pour les abonnés Boutique
          </p>
        </div>
      </div>

      {/* Grid of playlists */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
          gap: "1rem",
        }}
      >
        {allPlaylists.map((p) => (
          <Link
            key={p.id}
            href={`/admin/playlists/${p.id}`}
            style={{
              display: "block",
              borderRadius: 16,
              background: p.gradient,
              padding: "1.25rem",
              minHeight: 200,
              position: "relative",
              overflow: "hidden",
              textDecoration: "none",
              color: "white",
              border: p.isPublished ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(239,68,68,0.4)",
              opacity: p.isPublished ? 1 : 0.6,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{p.emoji ?? "🎵"}</div>
                {!p.isPublished && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      padding: "0.125rem 0.5rem",
                      borderRadius: 9999,
                      backgroundColor: "rgba(239,68,68,0.2)",
                      color: "#fca5a5",
                      marginBottom: "0.5rem",
                    }}
                  >
                    BROUILLON
                  </span>
                )}
              </div>
              <div>
                <p style={{ fontSize: "1.125rem", fontWeight: 800, margin: "0 0 0.25rem", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                  {p.nameFr}
                </p>
                <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>
                  {p.trackCount} morceaux
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
