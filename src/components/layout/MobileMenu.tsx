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
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "var(--color-text-primary)", transition: "all 0.2s", transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            top: "60px",
            backgroundColor: "#0f2533",
            zIndex: 9999,
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            overflowY: "auto",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "var(--color-text-primary)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}

          <hr style={{ borderColor: "var(--color-border)" }} />

          <a
            href={isLoggedIn ? `/${locale}/membre` : `/${locale}/connexion`}
            style={{
              fontSize: "1rem",
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
                padding: 0,
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              {t("logout")}
            </button>
          )}

          <LanguageSwitcher />
        </div>
      )}
    </>
  );
}
