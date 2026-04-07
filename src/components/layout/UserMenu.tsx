"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: string;
  memberLabel: string;
  logoutLabel: string;
};

export default function UserMenu({ locale, memberLabel, logoutLabel }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Main button — navigates to account */}
      <a
        href={`/${locale}/membre`}
        style={{
          padding: "0.5rem 1.25rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: "var(--radius-full)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {memberLabel}
      </a>

      {/* Dropdown arrow for logout */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "rgba(255,255,255,0.5)",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        aria-label="Menu"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 160,
            background: "var(--color-bg-secondary)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 60,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0.75rem 1rem",
              color: "#ef4444",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, opacity: 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {logoutLabel}
          </button>
        </div>
      )}
    </div>
  );
}
