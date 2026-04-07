"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type UploadResult = {
  filename: string;
  status: "ok" | "error" | "skipped";
  error?: string;
};

type UploadResponse = {
  summary: { total: number; ok: number; errors: number; skipped: number };
  results: UploadResult[];
};

export default function BulkUploadForm() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const mp3s = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".mp3"));
    setFiles(mp3s);
    setResponse(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setLoading(true);
    setProgress(`Upload de ${files.length} fichier${files.length > 1 ? "s" : ""} + analyse IA...`);
    setResponse(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/admin/tracks/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();
      setResponse(data);
      setProgress("");
      setFiles([]);
      router.refresh();
    } catch {
      setProgress("Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "rgba(245,166,35,0.15)",
          color: "var(--color-accent)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: 8,
          border: "1px solid rgba(245,166,35,0.3)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Import en masse
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: "var(--color-bg-card)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid rgba(245,166,35,0.3)",
      padding: "1.5rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem" }}>Import en masse</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
            {"Nommez vos fichiers : "}<strong>Artiste - Titre.mp3</strong>{" — l'IA taggue automatiquement"}
          </p>
        </div>
        <button
          onClick={() => { setOpen(false); setFiles([]); setResponse(null); }}
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.25rem" }}
        >
          ×
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: "1rem",
          backgroundColor: files.length > 0 ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
        {files.length === 0 ? (
          <>
            <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📁</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
              Glissez vos fichiers MP3 ici ou cliquez pour sélectionner
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#22c55e", margin: "0 0 0.5rem" }}>
              {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
            </p>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", maxHeight: 120, overflowY: "auto" }}>
              {files.map((f) => (
                <p key={f.name} style={{ margin: "0.125rem 0" }}>{f.name}</p>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Upload button */}
      {files.length > 0 && !loading && (
        <button
          onClick={handleUpload}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            width: "100%",
          }}
        >
          Uploader {files.length} morceau{files.length > 1 ? "x" : ""} + tagger par IA
        </button>
      )}

      {/* Progress */}
      {loading && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 600 }}>
            {progress}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Cela peut prendre quelques minutes...
          </p>
        </div>
      )}

      {/* Results */}
      {response && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}>
            <span style={{ fontSize: "0.8125rem" }}>
              <strong style={{ color: "#22c55e" }}>{response.summary.ok}</strong> importés
            </span>
            {response.summary.skipped > 0 && (
              <span style={{ fontSize: "0.8125rem" }}>
                <strong style={{ color: "var(--color-accent)" }}>{response.summary.skipped}</strong> ignorés
              </span>
            )}
            {response.summary.errors > 0 && (
              <span style={{ fontSize: "0.8125rem" }}>
                <strong style={{ color: "#ef4444" }}>{response.summary.errors}</strong> erreurs
              </span>
            )}
          </div>

          {response.results.filter((r) => r.status !== "ok").map((r) => (
            <p key={r.filename} style={{ fontSize: "0.75rem", color: r.status === "error" ? "#ef4444" : "var(--color-accent)", margin: "0.25rem 0" }}>
              {r.filename}: {r.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
