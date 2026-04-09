"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  labelFr: string;
  type: "STYLE" | "THEME" | "MOOD";
};

type Props = {
  trackId: string;
  trackTitle: string;
  allCategories: Category[];
  currentCategoryIds: string[];
};

const TYPE_LABELS: Record<Category["type"], string> = {
  STYLE: "Style",
  THEME: "Thème",
  MOOD: "Ambiance",
};

const TYPE_COLORS: Record<Category["type"], string> = {
  STYLE: "rgba(245,166,35,0.15)",
  THEME: "rgba(96,165,250,0.15)",
  MOOD: "rgba(167,139,250,0.15)",
};

const TYPE_TEXT_COLORS: Record<Category["type"], string> = {
  STYLE: "#f5a623",
  THEME: "#60a5fa",
  MOOD: "#a78bfa",
};

export default function EditTagsButton({
  trackId,
  trackTitle,
  allCategories,
  currentCategoryIds,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentCategoryIds));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/tracks/${trackId}/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: Array.from(selected) }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Erreur lors de la sauvegarde");
    }
  }

  function handleCancel() {
    setSelected(new Set(currentCategoryIds));
    setOpen(false);
  }

  // Group by type
  const grouped = {
    STYLE: allCategories.filter((c) => c.type === "STYLE"),
    THEME: allCategories.filter((c) => c.type === "THEME"),
    MOOD: allCategories.filter((c) => c.type === "MOOD"),
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "0.375rem 0.625rem",
          fontSize: "0.6875rem",
          fontWeight: 600,
          borderRadius: "var(--radius-sm)",
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(255,255,255,0.04)",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Tags
      </button>

      {open && (
        <div
          onClick={handleCancel}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
                  Éditer les tags
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
                  {trackTitle}
                </p>
              </div>
              <button
                onClick={handleCancel}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.25rem" }}
              >
                ×
              </button>
            </div>

            {(["STYLE", "THEME", "MOOD"] as const).map((type) => (
              <div key={type} style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
                  {TYPE_LABELS[type]}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {grouped[type].map((cat) => {
                    const isSelected = selected.has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggle(cat.id)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: 9999,
                          border: `1px solid ${isSelected ? TYPE_TEXT_COLORS[type] : "rgba(255,255,255,0.1)"}`,
                          backgroundColor: isSelected ? TYPE_COLORS[type] : "transparent",
                          color: isSelected ? TYPE_TEXT_COLORS[type] : "var(--color-text-muted)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                      >
                        {cat.labelFr}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-text)",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
