"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  artists: { id: string; name: string }[];
  categories: { id: string; label: string; type: string }[];
};

export default function AddTrackForm({ artists, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [bpm, setBpm] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  function toggleCategory(id: string) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artistId", artistId);
    if (bpm) formData.append("bpm", bpm);
    selectedCats.forEach((id) => formData.append("categoryIds", id));
    if (audioFile) formData.append("audio", audioFile);

    const res = await fetch("/api/admin/tracks/create", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setSuccess(true);
      setTitle("");
      setArtistId("");
      setBpm("");
      setSelectedCats([]);
      setAudioFile(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Erreur");
    }
    setLoading(false);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        + Ajouter un morceau
      </button>
    );
  }

  const groupedCats = {
    STYLE: categories.filter((c) => c.type === "STYLE"),
    THEME: categories.filter((c) => c.type === "THEME"),
    MOOD: categories.filter((c) => c.type === "MOOD"),
  };

  return (
    <div style={{
      backgroundColor: "var(--color-bg-card)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-accent)",
      padding: "1.5rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Nouveau morceau</h2>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.25rem" }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nom du morceau"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
              Artiste *
            </label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              required
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Sélectionner...</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
              BPM
            </label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="120"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>
              Fichier MP3
            </label>
            <input
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: "0.5rem" }}
            />
          </div>
        </div>

        {/* Categories */}
        {(["STYLE", "THEME", "MOOD"] as const).map((type) => (
          <div key={type}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.375rem", fontWeight: 600 }}>
              {type === "STYLE" ? "Style" : type === "THEME" ? "Thème" : "Humeur"}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {groupedCats[type].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "9999px",
                    border: selectedCats.includes(cat.id) ? "1px solid var(--color-accent)" : "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: selectedCats.includes(cat.id) ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)",
                    color: selectedCats.includes(cat.id) ? "var(--color-accent)" : "var(--color-text-muted)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <p style={{ color: "#ef4444", fontSize: "0.8125rem", margin: 0 }}>{error}</p>}
        {success && <p style={{ color: "#22c55e", fontSize: "0.8125rem", margin: 0 }}>Morceau ajouté (brouillon)</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Upload en cours..." : "Ajouter le morceau"}
        </button>
      </form>
    </div>
  );
}
