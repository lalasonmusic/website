"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    // Redirect to admin dashboard
    window.location.href = "/admin";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a1929",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#0f2533",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "2.5rem 2rem",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--color-accent)", margin: "0 0 0.25rem" }}>
            Lalason
          </p>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>
            Administration
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: "0.375rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "white",
                fontSize: "0.9375rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              placeholder="admin@lalason.com"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: "0.375rem" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "white",
                fontSize: "0.9375rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.8125rem", color: "#ef4444", margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.875rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
