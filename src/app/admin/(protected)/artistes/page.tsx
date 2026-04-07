import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import EditArtistForm from "@/components/admin/EditArtistForm";

async function getArtists() {
  const allArtists = await db
    .select({
      id: artists.id,
      name: artists.name,
      slug: artists.slug,
      bioFr: artists.bioFr,
      bioEn: artists.bioEn,
      photoUrl: artists.photoUrl,
      createdAt: artists.createdAt,
    })
    .from(artists)
    .orderBy(artists.name);

  // Track count per artist
  const trackCounts = await db
    .select({ artistId: tracks.artistId, count: count() })
    .from(tracks)
    .where(eq(tracks.isPublished, true))
    .groupBy(tracks.artistId);

  const trackMap = new Map(trackCounts.map((t) => [t.artistId, t.count]));

  return allArtists.map((a) => ({
    ...a,
    trackCount: trackMap.get(a.id) ?? 0,
  }));
}

export default async function ArtistesPage() {
  const allArtists = await getArtists();
  const totalTracks = allArtists.reduce((sum, a) => sum + a.trackCount, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Artistes
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {allArtists.length} artistes · {totalTracks} morceaux publiés
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
      }}>
        {allArtists.map((artist) => (
          <div
            key={artist.id}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: artist.photoUrl ? "none" : "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
              }}>
                {artist.photoUrl ? (
                  <img src={artist.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "var(--color-accent-text)", fontWeight: 800, fontSize: "1rem" }}>
                    {artist.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", margin: "0 0 0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {artist.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {artist.trackCount} morceau{artist.trackCount !== 1 ? "x" : ""} · {artist.bioFr ? "Bio ✓" : "Pas de bio"}
                </p>
              </div>

              <span style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--color-text-secondary)",
                flexShrink: 0,
              }}>
                {artist.trackCount}
              </span>
            </div>
            <EditArtistForm
              artistId={artist.id}
              initialBioFr={artist.bioFr ?? ""}
              initialBioEn={artist.bioEn ?? ""}
              initialPhotoUrl={artist.photoUrl ?? ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
