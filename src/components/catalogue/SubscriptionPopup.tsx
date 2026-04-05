"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

type Props = {
  locale: string;
};

export default function SubscriptionPopup({ locale }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("sub-popup-dismissed")) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("sub-popup-dismissed", "1");
  }

  if (dismissed || !visible) return null;

  const isFr = locale === "fr";

  const features = isFr
    ? [
        "Accès illimité à tout le catalogue",
        "Téléchargements illimités",
        "Tous les droits inclus",
        "Monétisation sur toutes vos chaînes",
        "Sans engagement",
      ]
    : [
        "Unlimited access to the full catalogue",
        "Unlimited downloads",
        "All rights included",
        "Monetize on all your channels",
        "Cancel anytime",
      ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "fadeIn 0.3s ease",
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "90%",
          maxWidth: 520,
          backgroundColor: "white",
          borderRadius: 16,
          padding: "2.5rem 2rem 2rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
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
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Title */}
        <h2 style={{
          fontWeight: 800,
          fontSize: "1.5rem",
          color: "#1b3a4b",
          textAlign: "center",
          margin: "0 0 1.75rem",
        }}>
          {isFr ? "Choisis ton abonnement !" : "Choose your plan!"}
        </h2>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Monthly */}
          <div style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "1.25rem 1rem",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 0.75rem" }}>
              {isFr ? "Mensuel" : "Monthly"}
            </p>
            <p style={{ margin: 0 }}>
              <span style={{ fontSize: "0.75rem", color: "#6b7280", verticalAlign: "super" }}>€</span>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1b3a4b", lineHeight: 1 }}>15,99</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.25rem 0 1rem" }}>
              {isFr ? "/mois" : "/month"}
            </p>
            <a
              href={`/${locale}/abonnements`}
              style={{
                display: "block",
                padding: "0.625rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "9999px",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {isFr ? "Sélectionner" : "Select"}
            </a>
          </div>

          {/* Annual */}
          <div style={{
            border: "2px solid var(--color-accent)",
            borderRadius: 12,
            padding: "1.25rem 1rem",
            textAlign: "center",
            position: "relative",
          }}>
            {/* Badge */}
            <span style={{
              position: "absolute",
              top: -10,
              right: 12,
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontSize: "0.625rem",
              fontWeight: 700,
              padding: "0.125rem 0.5rem",
              borderRadius: 4,
              textTransform: "uppercase",
            }}>
              -48%
            </span>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 0.75rem" }}>
              {isFr ? "Annuel" : "Annual"}
            </p>
            <p style={{ margin: 0 }}>
              <span style={{ fontSize: "0.75rem", color: "#6b7280", verticalAlign: "super" }}>€</span>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1b3a4b", lineHeight: 1 }}>99</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.25rem 0 1rem" }}>
              {isFr ? "/an" : "/year"}
            </p>
            <a
              href={`/${locale}/abonnements`}
              style={{
                display: "block",
                padding: "0.625rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "9999px",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {isFr ? "Sélectionner" : "Select"}
            </a>
          </div>
        </div>

        {/* Features list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Check size={14} color="var(--color-accent)" strokeWidth={2.5} />
              <span style={{ fontSize: "0.8125rem", color: "#4b5563" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
