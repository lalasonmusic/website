"use client";

import { useState } from "react";

type Props = {
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
};

export default function NewsletterForm({ placeholder, buttonLabel, successMessage }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--color-accent)" }}>{successMessage}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "0.5rem 0.75rem",
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-primary)",
          fontSize: "0.875rem",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
