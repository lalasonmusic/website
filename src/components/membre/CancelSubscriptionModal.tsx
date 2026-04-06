"use client";

import { useState } from "react";

type Props = {
  labels: {
    title: string;
    subtitle: string;
    reasons: string[];
    reasonOther: string;
    placeholder: string;
    confirm: string;
    back: string;
    success: string;
    error: string;
  };
};

export default function CancelSubscriptionModal({ labels }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [otherComment, setOtherComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; endDate?: string } | null>(null);
  const [error, setError] = useState(false);

  const isOther = selectedReason === labels.reasons.length;
  const canSubmit = selectedReason !== null && (!isOther || otherComment.trim().length > 0);

  const allReasons = [...labels.reasons, labels.reasonOther];

  async function handleConfirm() {
    if (!canSubmit) return;
    setLoading(true);
    setError(false);

    const reason = isOther ? "other" : allReasons[selectedReason!];
    const comment = isOther ? otherComment.trim() : undefined;

    try {
      const res = await fetch("/api/membre/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({ success: true, endDate: data.endDate });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    if (result?.success) {
      window.location.reload();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-white/30 hover:text-white/50 transition-colors cursor-pointer underline underline-offset-2"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        {labels.back === "Annuler" ? "Se désabonner" : "Cancel subscription"}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: "var(--color-bg-secondary)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          style={{ background: "none", border: "none" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success state */}
        {result?.success && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)" }}>
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              {labels.success.replace(
                "{date}",
                result.endDate
                  ? new Date(result.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"
              )}
            </p>
            <button
              onClick={handleClose}
              className="mt-5 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              OK
            </button>
          </div>
        )}

        {/* Form state */}
        {!result?.success && (
          <>
            <h3 className="text-lg font-bold text-white mb-1">{labels.title}</h3>
            <p className="text-sm text-white/40 mb-6">{labels.subtitle}</p>

            {/* Reasons */}
            <div className="space-y-2.5 mb-5">
              {allReasons.map((reason, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: selectedReason === i ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.03)",
                    border: selectedReason === i ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    checked={selectedReason === i}
                    onChange={() => setSelectedReason(i)}
                    className="mt-0.5 accent-[var(--color-accent)]"
                  />
                  <span className="text-sm text-white/70">{reason}</span>
                </label>
              ))}
            </div>

            {/* Other comment textarea */}
            {isOther && (
              <textarea
                value={otherComment}
                onChange={(e) => setOtherComment(e.target.value)}
                placeholder={labels.placeholder}
                rows={3}
                className="w-full mb-5 text-sm resize-none"
                style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.75rem",
                  color: "white",
                  fontFamily: "inherit",
                }}
              />
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 mb-4">{labels.error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={!canSubmit || loading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                {loading ? "..." : labels.confirm}
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {labels.back}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
