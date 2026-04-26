"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlayerStore } from "@/store/playerStore";

export default function PreviewEndedToast() {
  const t = useTranslations("boutique.playlist");
  const isPreviewEnded = usePlayerStore((s) => s.isPreviewEnded);
  const setIsPreviewEnded = usePlayerStore((s) => s.setIsPreviewEnded);

  if (!isPreviewEnded) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 96, // au-dessus du player sticky
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        backgroundColor: "var(--color-accent)",
        color: "var(--color-accent-text)",
        padding: "0.875rem 1.25rem",
        borderRadius: "var(--radius-full)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        maxWidth: "calc(100% - 2rem)",
        animation: "boutique-toast-in 200ms ease-out",
      }}
    >
      <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t("previewEnded")}</span>
      <Link
        href={{ pathname: "/abonnements" }}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 700,
          color: "var(--color-accent-text)",
          textDecoration: "underline",
          whiteSpace: "nowrap",
        }}
      >
        {t("previewEndedCta")}
      </Link>
      <button
        onClick={() => setIsPreviewEnded(false)}
        aria-label="Fermer"
        style={{
          background: "none",
          border: "none",
          color: "var(--color-accent-text)",
          fontSize: "1.125rem",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes boutique-toast-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
