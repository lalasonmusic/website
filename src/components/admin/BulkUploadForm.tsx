"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UploadResult = {
  filename: string;
  status: "ok" | "error" | "skipped";
  error?: string;
};

type UploadResponse = {
  summary: { total: number; ok: number; errors: number; skipped: number };
  results: UploadResult[];
};

type Phase = "idle" | "signing" | "uploading" | "processing" | "ai" | "done";

type SignedUpload = {
  filename: string;
  slug?: string;
  path?: string;
  token?: string;
  error?: string;
};

export default function BulkUploadForm() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const audios = Array.from(fileList).filter((f) => /\.(mp3|wav)$/i.test(f.name));
    setFiles(audios);
    setResponse(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function resetProgress() {
    setProcessed(0);
    setTotal(0);
    setCurrentFile("");
    setPhase("idle");
    setElapsedSec(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatTime(sec: number) {
    if (sec < 60) return `${Math.round(sec)}s`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m${s.toString().padStart(2, "0")}`;
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setLoading(true);
    setErrorMsg("");
    setResponse(null);
    setProcessed(0);
    setTotal(files.length);
    setPhase("signing");
    setCurrentFile("");

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec((Date.now() - start) / 1000);
    }, 500);

    try {
      // === Phase 1: Get signed upload URLs from server ===
      const signRes = await fetch("/api/admin/tracks/sign-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filenames: files.map((f) => f.name) }),
      });

      if (!signRes.ok) throw new Error(`Sign URLs failed: HTTP ${signRes.status}`);

      const signData = (await signRes.json()) as { uploads: SignedUpload[] };
      const uploads = signData.uploads;

      // === Phase 2: Upload each file directly to Supabase Storage ===
      setPhase("uploading");
      const supabase = createClient();
      const uploadedItems: { filename: string; slug: string; path: string }[] = [];
      const uploadFailures: UploadResult[] = [];

      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        setCurrentFile(u.filename);

        if (u.error || !u.path || !u.token || !u.slug) {
          uploadFailures.push({ filename: u.filename, status: "error", error: u.error ?? "URL signée manquante" });
          setProcessed((p) => p + 1);
          continue;
        }

        const file = files.find((f) => f.name === u.filename);
        if (!file) {
          uploadFailures.push({ filename: u.filename, status: "error", error: "Fichier introuvable côté client" });
          setProcessed((p) => p + 1);
          continue;
        }

        const isWav = u.path.toLowerCase().endsWith(".wav");
        const { error: upErr } = await supabase.storage
          .from("audio-full")
          .uploadToSignedUrl(u.path, u.token, file, { contentType: isWav ? "audio/wav" : "audio/mpeg" });

        if (upErr) {
          uploadFailures.push({ filename: u.filename, status: "error", error: `Upload Supabase: ${upErr.message}` });
        } else {
          uploadedItems.push({ filename: u.filename, slug: u.slug, path: u.path });
        }
        setProcessed((p) => p + 1);
      }

      if (uploadedItems.length === 0) {
        setResponse({
          summary: { total: files.length, ok: 0, errors: uploadFailures.length, skipped: 0 },
          results: uploadFailures,
        });
        setPhase("done");
        return;
      }

      // === Phase 3: Finalize — server downloads, transcodes, inserts, AI tags ===
      setProcessed(0);
      setTotal(uploadedItems.length);
      setPhase("processing");
      setCurrentFile("");

      const finalRes = await fetch("/api/admin/tracks/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: uploadedItems }),
      });

      if (!finalRes.ok || !finalRes.body) {
        let detail = "";
        try {
          const errJson = await finalRes.json();
          detail = errJson.detail || errJson.error || "";
        } catch {}
        throw new Error(`Finalize failed: HTTP ${finalRes.status}${detail ? ` — ${detail}` : ""}`);
      }

      const reader = finalRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let serverResponse: UploadResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "start") {
              setTotal(event.total);
            } else if (event.type === "file-start") {
              setCurrentFile(event.filename);
            } else if (event.type === "file-done") {
              setProcessed((p) => p + 1);
            } else if (event.type === "ai-start") {
              setPhase("ai");
              setCurrentFile("");
            } else if (event.type === "complete") {
              serverResponse = { summary: event.summary, results: event.results };
            } else if (event.type === "fatal") {
              setErrorMsg(event.error || "Erreur fatale");
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }

      // Merge upload-phase failures into the final result
      if (serverResponse) {
        const merged: UploadResponse = {
          summary: {
            total: files.length,
            ok: serverResponse.summary.ok,
            errors: serverResponse.summary.errors + uploadFailures.length,
            skipped: serverResponse.summary.skipped,
          },
          results: [...serverResponse.results, ...uploadFailures],
        };
        setResponse(merged);
      }

      setPhase("done");
      setFiles([]);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
    }
  }

  // Progress calculations
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const avgPerFile = processed > 0 ? elapsedSec / processed : 0;
  const remainingFiles = total - processed;
  const etaSec = avgPerFile > 0 ? avgPerFile * remainingFiles : 0;

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
            {"Nommez vos fichiers : "}<strong>Artiste - Titre.mp3</strong>{" ou "}<strong>.wav</strong>{" — l'IA taggue automatiquement"}
          </p>
        </div>
        <button
          onClick={() => { setOpen(false); setFiles([]); setResponse(null); resetProgress(); }}
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.25rem" }}
        >
          ×
        </button>
      </div>

      {/* Drop zone */}
      {!loading && (
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
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave,.mp3,.wav"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
          {files.length === 0 ? (
            <>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📁</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                Glissez vos fichiers MP3 ou WAV ici ou cliquez pour sélectionner
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
      )}

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
        <div style={{ padding: "0.5rem 0" }}>
          {/* Phase label */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 600 }}>
              {phase === "signing" && "Préparation..."}
              {phase === "uploading" && `Téléversement ${processed}/${total}`}
              {phase === "processing" && `Traitement ${processed}/${total}`}
              {phase === "ai" && "Catégorisation IA..."}
              {phase === "done" && "Terminé"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {percent}%
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: "100%",
            height: 8,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 9999,
            overflow: "hidden",
            marginBottom: "0.75rem",
          }}>
            <div style={{
              width: `${phase === "ai" ? 100 : percent}%`,
              height: "100%",
              backgroundColor: "var(--color-accent)",
              borderRadius: 9999,
              transition: "width 0.3s ease",
            }} />
          </div>

          {/* Current file + ETA */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <span style={{
              maxWidth: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {currentFile || (phase === "ai" ? "Analyse des morceaux..." : "")}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatTime(elapsedSec)}
              {etaSec > 0 && (phase === "processing" || phase === "uploading") && ` · reste ~${formatTime(etaSec)}`}
            </span>
          </div>
        </div>
      )}

      {/* Fatal error */}
      {errorMsg && (
        <p style={{ fontSize: "0.8125rem", color: "#ef4444", marginTop: "1rem" }}>
          {errorMsg}
        </p>
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
