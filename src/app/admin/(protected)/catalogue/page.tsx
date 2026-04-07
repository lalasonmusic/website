import { db } from "@/db";
import { tracks, artists, downloads, categories } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import TogglePublishButton from "@/components/admin/TogglePublishButton";
import AddTrackForm from "@/components/admin/AddTrackForm";

async function getTracks() {
  const allTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      artistName: artists.name,
      bpm: tracks.bpm,
      durationSeconds: tracks.durationSeconds,
      isPublished: tracks.isPublished,
      fileFullPath: tracks.fileFullPath,
      createdAt: tracks.createdAt,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(desc(tracks.createdAt));

  // Download counts per track
  const dlCounts = await db
    .select({ trackId: downloads.trackId, count: count() })
    .from(downloads)
    .groupBy(downloads.trackId);

  const dlMap = new Map(dlCounts.map((d) => [d.trackId, d.count]));

  return allTracks.map((t) => ({
    ...t,
    downloadCount: dlMap.get(t.id) ?? 0,
  }));
}

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default async function CataloguePage() {
  const [allTracks, allArtists, allCategories] = await Promise.all([
    getTracks(),
    db.select({ id: artists.id, name: artists.name }).from(artists).orderBy(artists.name),
    db.select({ id: categories.id, labelFr: categories.labelFr, type: categories.type }).from(categories).orderBy(categories.type, categories.labelFr),
  ]);

  const published = allTracks.filter((t) => t.isPublished).length;
  const unpublished = allTracks.length - published;
  const totalDownloads = allTracks.reduce((sum, t) => sum + t.downloadCount, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Catalogue
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {published} publiés · {unpublished} brouillons · {totalDownloads} téléchargements
          </p>
        </div>
      </div>

      <AddTrackForm
        artists={allArtists}
        categories={allCategories.map((c) => ({ id: c.id, label: c.labelFr, type: c.type }))}
      />

      <div style={{
        backgroundColor: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1.2fr 0.5fr 0.5fr 0.6fr 0.5fr 0.8fr",
          gap: "0.5rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}>
          {["Titre", "Artiste", "BPM", "Durée", "DL", "Statut", "Action"].map((h) => (
            <p key={h} style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {allTracks.map((track) => (
          <div
            key={track.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2.5fr 1.2fr 0.5fr 0.5fr 0.6fr 0.5fr 0.8fr",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              borderBottom: "1px solid var(--color-border)",
              alignItems: "center",
              opacity: track.isPublished ? 1 : 0.5,
            }}
          >
            {/* Title */}
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {track.title}
            </p>

            {/* Artist */}
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {track.artistName}
            </p>

            {/* BPM */}
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
              {track.bpm ?? "—"}
            </p>

            {/* Duration */}
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(track.durationSeconds)}
            </p>

            {/* Downloads */}
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", margin: 0 }}>
              {track.downloadCount}
            </p>

            {/* Status */}
            <span style={{
              fontSize: "0.625rem",
              fontWeight: 600,
              padding: "0.2rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: track.isPublished ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
              color: track.isPublished ? "#22c55e" : "var(--color-text-muted)",
              textAlign: "center",
            }}>
              {track.isPublished ? "Publié" : "Brouillon"}
            </span>

            {/* Toggle */}
            <TogglePublishButton
              trackId={track.id}
              isPublished={track.isPublished}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
