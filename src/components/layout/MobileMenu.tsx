"use client";

import { useState } from "react";
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

  return (
    <>
      {/* Burger / Close button */}
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
          position: "relative",
          zIndex: 10001,
        }}
      >
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
      </button>

      {/* Fullscreen overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#0f2533",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "white",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}

          <div style={{ width: 40, height: 1, backgroundColor: "rgba(255,255,255,0.15)", margin: "0.25rem 0" }} />

          <a
            href={isLoggedIn ? `/${locale}/membre` : `/${locale}/connexion`}
            onClick={() => setOpen(false)}
            style={{
              fontSize: "1.25rem",
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
                fontSize: "1rem",
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
        </div>
      )}
    </>
  );
}
