"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  artistId: string;
  initialBioFr: string;
  initialBioEn: string;
  initialPhotoUrl: string;
};

export default function EditArtistForm({ artistId, initialBioFr, initialBioEn, initialPhotoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [bioFr, setBioFr] = useState(initialBioFr);
  const [bioEn, setBioEn] = useState(initialBioEn);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    await fetch("/api/admin/artists/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId, bioFr, bioEn, photoUrl }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--color-accent)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        Modifier
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "white",
    fontSize: "0.8125rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input
        type="text"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        placeholder="URL photo"
        style={inputStyle}
      />
      <textarea
        value={bioFr}
        onChange={(e) => setBioFr(e.target.value)}
        placeholder="Bio FR"
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <textarea
        value={bioEn}
        onChange={(e) => setBioEn(e.target.value)}
        placeholder="Bio EN"
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: 6,
            border: "none",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "..." : "Enregistrer"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Annuler
        </button>
        {saved && <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Enregistré ✓</span>}
      </div>
    </div>
  );
}
