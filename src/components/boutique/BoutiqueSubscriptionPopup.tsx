"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { track } from "@/lib/analytics";

// 8s strikes a better balance than 15s: long enough to let the visitor
// see the cards / form an opinion, short enough to catch them BEFORE
// they bounce or click into a deep page.
const POPUP_DELAY_MS = 8_000;
const SESSION_KEY = "boutique-popup-dismissed";

type Props = {
  hasBoutiqueAccess: boolean;
  locale: "fr" | "en";
  /**
   * Optional context — when set (i.e. on a playlist detail page) the popup
   * headline is rewritten to reference what the visitor is currently looking
   * at, e.g. "Vous aimez Salon de coiffure ?". On the hub page this is
   * undefined and we fall back to the generic title.
   */
  playlistName?: string;
};

export default function BoutiqueSubscriptionPopup({ hasBoutiqueAccess, locale, playlistName }: Props) {
  const t = useTranslations("boutique.popup");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show to existing boutique subscribers
    if (hasBoutiqueAccess) {
      setDismissed(true);
      return;
    }
    // Already dismissed during this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
      // Mark as shown immediately so navigating between hub/détail doesn't re-trigger
      sessionStorage.setItem(SESSION_KEY, "1");
      track("boutique_popup_shown", {
        context: playlistName ? "detail" : "hub",
        playlist: playlistName ?? null,
      });
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hasBoutiqueAccess, playlistName]);

  function handleClose(reason: "x" | "backdrop" | "escape" = "x") {
    track("boutique_popup_dismissed", {
      reason,
      context: playlistName ? "detail" : "hub",
      playlist: playlistName ?? null,
    });
    setVisible(false);
    setDismissed(true);
  }

  // Allow Escape key to close
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose("escape");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (dismissed || !visible) return null;

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => handleClose("backdrop")}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "boutiquePopupFadeIn 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boutique-popup-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "90%",
          maxWidth: 460,
          backgroundColor: "white",
          borderRadius: 16,
          padding: "2.5rem 2rem 2rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "boutiquePopupSlideUp 0.3s ease",
        }}
      >
        {/* Close */}
        <button
          onClick={() => handleClose("x")}
          aria-label={t("closeAriaLabel")}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "#9ca3af",
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* Title — contextual when we know which playlist the visitor is on */}
        <h2
          id="boutique-popup-title"
          style={{
            fontWeight: 800,
            fontSize: "1.375rem",
            color: "#1b3a4b",
            textAlign: "center",
            margin: "0 0 0.5rem",
            lineHeight: 1.2,
          }}
        >
          {playlistName ? t("title_contextual", { playlist: playlistName }) : t("title")}
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            textAlign: "center",
            margin: "0 0 1.5rem",
            lineHeight: 1.45,
          }}
        >
          {playlistName ? t("subtitle_contextual") : t("subtitle")}
        </p>

        {/* Single plan card */}
        <div
          style={{
            border: "2px solid var(--color-accent)",
            borderRadius: 12,
            padding: "1.5rem 1.25rem",
            textAlign: "center",
            position: "relative",
            marginBottom: "1.25rem",
          }}
        >
          {/* Badge */}
          <span
            style={{
              position: "absolute",
              top: -10,
              right: 12,
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontSize: "0.625rem",
              fontWeight: 700,
              padding: "0.25rem 0.5rem",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {t("planBadge")}
          </span>

          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#6b7280",
              margin: "0 0 0.75rem",
            }}
          >
            {t("planName")}
          </p>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1b3a4b" }}>
              {t("planPrice")}
            </span>
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: "0.25rem 0 1.25rem" }}>
            {t("planPeriod")}
          </p>
          <a
            href={`/${locale}/abonnements#boutique`}
            onClick={() => track("boutique_popup_cta_click", {
              context: playlistName ? "detail" : "hub",
              playlist: playlistName ?? null,
            })}
            style={{
              display: "block",
              padding: "0.75rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              borderRadius: "9999px",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            {t("ctaSubscribe")}
          </a>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <Check
                size={16}
                color="var(--color-accent)"
                strokeWidth={2.5}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span style={{ fontSize: "0.8125rem", color: "#4b5563", lineHeight: 1.45 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes boutiquePopupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes boutiquePopupSlideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
