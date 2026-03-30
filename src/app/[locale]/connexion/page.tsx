"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("../membre");
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontSize: "1.5rem",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          {t("login")}
        </h1>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontSize: "1rem",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              borderRadius: "var(--radius-full)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : t("loginButton")}
          </button>
        </form>

        <div style={{ margin: "1rem 0", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {t("orContinueWith")}
        </div>

        <button
          onClick={handleGoogle}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "transparent",
            color: "var(--color-text-primary)",
            fontWeight: 500,
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {t("loginWithGoogle")}
        </button>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          {t("noAccount")}{" "}
          <a href="../inscription" style={{ color: "var(--color-accent)" }}>
            {t("signup")}
          </a>
        </p>
      </div>
    </div>
  );
}
