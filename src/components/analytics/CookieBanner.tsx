"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

const CONSENT_KEY = "lalason_cookie_consent";

function dispatchConsent(choice: "accepted" | "declined") {
  localStorage.setItem(CONSENT_KEY, choice);
  window.dispatchEvent(new CustomEvent("lalason:consent", { detail: choice }));
}

export default function CookieBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    dispatchConsent("accepted");
    setVisible(false);
  }

  function handleDecline() {
    dispatchConsent("declined");
    setVisible(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(var(--player-height-mobile) + 0.75rem)",
        left: "1rem",
        right: "1rem",
        zIndex: 200,
        backgroundColor: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.25rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "720px",
        margin: "0 auto",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ flex: 1, minWidth: "200px", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
        {t("message")}{" "}
        <a
          href={`/${locale}/politique-de-confidentialite`}
          style={{ color: "var(--color-accent)", textDecoration: "underline" }}
        >
          {t("learnMore")}
        </a>
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
          }}
        >
          {t("decline")}
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
