"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = {
  locale: string;
  isLoggedIn: boolean;
};

export default function MobileMenu({ locale, isLoggedIn }: Props) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}/catalogue`, label: t("catalogue") },
    { href: `/${locale}/blog`, label: t("blog") },
    { href: `/${locale}/nos-artistes`, label: t("artists") },
    { href: `/${locale}/abonnements`, label: t("pricing") },
  ];

  const overlay = open && typeof document !== "undefined" ? createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#0f2533",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "1.75rem",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setOpen(false)}
        aria-label="Close menu"
        style={{
          position: "absolute",
          top: 18,
          right: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "white",
          padding: "0.5rem",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Logo */}
      <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "white", marginBottom: "1rem" }}>
        Lalason
      </p>

      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={() => setOpen(false)}
          style={{
            fontSize: "1.375rem",
            fontWeight: 600,
            color: "white",
            textDecoration: "none",
          }}
        >
          {link.label}
        </a>
      ))}

      <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.15)", margin: "0.25rem 0" }} />

      <a
        href={isLoggedIn ? `/${locale}/membre` : `/${locale}/connexion`}
        onClick={() => setOpen(false)}
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "var(--color-accent)",
          textDecoration: "none",
        }}
      >
        {isLoggedIn ? t("member") : t("login")}
      </a>

      {isLoggedIn && (
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = `/${locale}`;
          }}
          style={{
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "#ef4444",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("logout")}
        </button>
      )}

      <div style={{ marginTop: "0.5rem" }}>
        <LanguageSwitcher />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Burger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
        }}
      >
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s" }} />
      </button>

      {overlay}
    </>
  );
}
