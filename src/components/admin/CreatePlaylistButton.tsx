"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreatePlaylistButton() {
  const [open, setOpen] = useState(false);
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [emoji, setEmoji] = useState("🎵");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!nameFr.trim() || !nameEn.trim()) {
      setError("Le nom FR et EN sont obligatoires");
      return;
    }
    setLoading(true);
    setError("");

    const slug = slugify(nameFr);

    try {
      const res = await fetch("/api/admin/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nameFr: nameFr.trim(),
          nameEn: nameEn.trim(),
          emoji: emoji.trim() || "🎵",
          gradient: "linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)",
          isPublished: false,
          displayOrder: 999,
        }),
      });

      const data = await res.json();
      if (res.ok && data.playlist?.id) {
        router.push(`/admin/playlists/${data.playlist.id}`);
      } else {
        setError(data.error ?? "Erreur lors de la création");
        setLoading(false);
      }
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 700,
          fontSize: "0.875rem",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        + Nouvelle playlist
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={() => !loading && setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: "var(--color-bg-card)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>Nouvelle playlist</h2>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: 0,
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: "0.625rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
                Nom FR *
              </label>
              <input
                type="text"
                value={nameFr}
                onChange={(e) => setNameFr(e.target.value)}
                placeholder="Soirée Cocktail"
                autoFocus
                style={{
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  padding: "0.625rem",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "1.25rem",
                  fontFamily: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
              Nom EN *
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Cocktail Night"
              style={{
                padding: "0.625rem 0.875rem",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "white",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
            La playlist sera créée en brouillon. Vous pourrez ensuite ajouter des morceaux et personnaliser le gradient et la description dans l&apos;éditeur.
          </p>

          {error && <p style={{ fontSize: "0.8125rem", color: "#ef4444", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 700,
              fontSize: "0.875rem",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Création..." : "Créer la playlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
