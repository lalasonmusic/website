"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlaylistData = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  gradient: string;
  emoji: string | null;
  isPublished: boolean;
  displayOrder: number;
};

type Track = {
  id: string;
  title: string;
  artistName: string;
};

type Props = {
  playlist: PlaylistData;
  playlistTracks: Track[];
  allTracks: Track[];
};

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #f5a623 0%, #d4731c 100%)",
  "linear-gradient(135deg, #6b0f1a 0%, #2a0509 100%)",
  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)",
  "linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)",
];

export default function PlaylistEditor({ playlist: initialPlaylist, playlistTracks: initialTracks, allTracks }: Props) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [tracks, setTracks] = useState(initialTracks);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const trackIdsInPlaylist = new Set(tracks.map((t) => t.id));
  const filteredAvailable = allTracks
    .filter((t) => !trackIdsInPlaylist.has(t.id))
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q);
    })
    .slice(0, 50);

  async function saveMetadata() {
    setSaving(true);
    await fetch(`/api/admin/playlists/${playlist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: playlist.slug,
        nameFr: playlist.nameFr,
        nameEn: playlist.nameEn,
        descriptionFr: playlist.descriptionFr,
        descriptionEn: playlist.descriptionEn,
        gradient: playlist.gradient,
        emoji: playlist.emoji,
        isPublished: playlist.isPublished,
      }),
    });
    setSaving(false);
    setSavedAt(Date.now());
    router.refresh();
    setTimeout(() => setSavedAt(null), 2500);
  }

  async function addTrack(track: Track) {
    await fetch(`/api/admin/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: track.id }),
    });
    setTracks([...tracks, track]);
  }

  async function removeTrack(trackId: string) {
    await fetch(`/api/admin/playlists/${playlist.id}/tracks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });
    setTracks(tracks.filter((t) => t.id !== trackId));
  }

  async function deletePlaylist() {
    if (!confirm("Supprimer définitivement cette playlist ?")) return;
    await fetch(`/api/admin/playlists/${playlist.id}`, { method: "DELETE" });
    router.push("/admin/playlists");
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "white",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Header with preview */}
      <div
        style={{
          borderRadius: 16,
          background: playlist.gradient,
          padding: "1.5rem",
          marginBottom: "1.5rem",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <div style={{ fontSize: "3rem" }}>{playlist.emoji ?? "🎵"}</div>
          <div>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              {playlist.nameFr}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.85)", margin: 0 }}>
              {tracks.length} morceaux · {playlist.isPublished ? "Publiée" : "Brouillon"}
            </p>
          </div>
        </div>
        <button
          onClick={deletePlaylist}
          style={{
            padding: "0.5rem 0.875rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.3)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "white",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Supprimer
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: "1.5rem" }}>
        {/* ── METADATA ── */}
        <div
          style={{
            backgroundColor: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Métadonnées</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "0.625rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                  Slug
                </label>
                <input
                  type="text"
                  value={playlist.slug}
                  onChange={(e) => setPlaylist({ ...playlist, slug: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                  Emoji
                </label>
                <input
                  type="text"
                  value={playlist.emoji ?? ""}
                  onChange={(e) => setPlaylist({ ...playlist, emoji: e.target.value })}
                  style={{ ...inputStyle, textAlign: "center", fontSize: "1.25rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                Nom FR
              </label>
              <input
                type="text"
                value={playlist.nameFr}
                onChange={(e) => setPlaylist({ ...playlist, nameFr: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                Nom EN
              </label>
              <input
                type="text"
                value={playlist.nameEn}
                onChange={(e) => setPlaylist({ ...playlist, nameEn: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                Description FR
              </label>
              <textarea
                value={playlist.descriptionFr ?? ""}
                onChange={(e) => setPlaylist({ ...playlist, descriptionFr: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                Description EN
              </label>
              <textarea
                value={playlist.descriptionEn ?? ""}
                onChange={(e) => setPlaylist({ ...playlist, descriptionEn: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                Gradient
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPlaylist({ ...playlist, gradient: g })}
                    style={{
                      height: 32,
                      borderRadius: 6,
                      background: g,
                      border: playlist.gradient === g ? "2px solid white" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                    aria-label="Choose gradient"
                  />
                ))}
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={playlist.isPublished}
                onChange={(e) => setPlaylist({ ...playlist, isPublished: e.target.checked })}
                style={{ accentColor: "var(--color-accent)" }}
              />
              Publiée (visible pour les abonnés Boutique)
            </label>

            <button
              onClick={saveMetadata}
              disabled={saving}
              style={{
                padding: "0.75rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: 8,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "Enregistrement..." : savedAt ? "✓ Enregistré" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>

        {/* ── TRACKS ── */}
        <div
          style={{
            backgroundColor: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Morceaux dans la playlist ({tracks.length})
          </h2>

          {tracks.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Aucun morceau</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: 400, overflowY: "auto", marginBottom: "1.5rem" }}>
              {tracks.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", minWidth: 18, textAlign: "right" }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0 }}>{t.artistName}</p>
                  </div>
                  <button
                    onClick={() => removeTrack(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add tracks */}
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text-secondary)" }}>
            Ajouter des morceaux
          </h3>
          <input
            type="text"
            placeholder="Rechercher par titre ou artiste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: "0.5rem" }}
          />
          <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {filteredAvailable.map((t) => (
              <button
                key={t.id}
                onClick={() => addTrack(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  color: "white",
                }}
              >
                <span style={{ color: "#22c55e", fontSize: "1rem" }}>+</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0 }}>{t.artistName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
