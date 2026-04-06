"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

export default function InscriptionPage() {
  const t = useTranslations("auth");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    track("signup_start");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    track("signup_complete");
    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleFacebook() {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
          {t("signup")}
        </h1>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "0.625rem 0.75rem", backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: "1rem" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>{t("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              style={{ width: "100%", padding: "0.625rem 0.75rem", backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: "1rem" }} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "0.75rem", backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", fontWeight: 600, borderRadius: "var(--radius-full)", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : t("signupButton")}
          </button>
        </form>

        <div style={{ margin: "1rem 0", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{t("orContinueWith")}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button onClick={handleGoogle}
            style={{ width: "100%", padding: "0.75rem", backgroundColor: "transparent", color: "var(--color-text-primary)", fontWeight: 500, borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "1rem" }}>
            {t("loginWithGoogle")}
          </button>
          <button onClick={handleFacebook}
            style={{ width: "100%", padding: "0.75rem", backgroundColor: "#1877F2", color: "white", fontWeight: 500, borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", fontSize: "1rem" }}>
            {t("loginWithFacebook")}
          </button>
        </div>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          {t("alreadyAccount")}{" "}
          <a href="../connexion" style={{ color: "var(--color-accent)" }}>{t("login")}</a>
        </p>
      </div>
    </div>
  );
}
