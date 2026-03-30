"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";

export default function NouveauMotDePassePage() {
  const t = useTranslations("member");
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/membre"), 2000);
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
          {t("newPassword")}
        </h1>

        {success ? (
          <p style={{ textAlign: "center", color: "#22c55e", fontSize: "0.9375rem" }}>
            {t("newPasswordSuccess")}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}
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
              {loading ? "..." : t("newPasswordButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
