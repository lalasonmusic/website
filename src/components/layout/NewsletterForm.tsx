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
      <p style={{ fontSize: "0.9375rem", color: "var(--color-accent)", fontWeight: 600, padding: "0.5rem 1rem" }}>
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flex: 1, gap: "0.5rem", alignItems: "center" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "0.75rem 1.25rem",
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          color: "#1b3a4b",
          fontSize: "0.9375rem",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.625rem 1.5rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
          borderRadius: "9999px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          opacity: loading ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
