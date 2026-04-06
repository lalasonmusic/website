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
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.5rem 1.25rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {memberLabel}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 180,
            background: "var(--color-bg-secondary)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 60,
          }}
        >
          <a
            href={`/${locale}/membre`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0.75rem 1rem",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {memberLabel}
          </a>
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
