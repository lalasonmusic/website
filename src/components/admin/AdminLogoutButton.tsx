"use client";

import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        marginTop: "auto",
        padding: "0.625rem 0.75rem",
        borderRadius: "var(--radius-sm)",
        color: "#ef4444",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      Déconnexion
    </button>
  );
}
