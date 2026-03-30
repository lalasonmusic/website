"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const t = useTranslations("auth");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/membre/nouveau-mot-de-passe`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-primary)" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>{t("checkEmail")}</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>{t("resetSent")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-primary)" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "2rem", backgroundColor: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem", textAlign: "center" }}>
          {t("forgotPassword")}
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          {t("forgotPasswordDesc")}
        </p>

        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "0.625rem 0.75rem", backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: "1rem" }} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", fontWeight: 600, borderRadius: "var(--radius-full)", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : t("resetButton")}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          <a href="../connexion" style={{ color: "var(--color-accent)" }}>{t("backToLogin")}</a>
        </p>
      </div>
    </div>
  );
}
