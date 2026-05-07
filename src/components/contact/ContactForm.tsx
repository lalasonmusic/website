"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ContactForm() {
  const t = useTranslations("contact");

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setError(t("error"));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "1rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.875rem",
    fontWeight: 500,
  };

  if (success) {
    return (
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          textAlign: "center",
        }}
      >
        <p style={{ fontWeight: 600, color: "#10b981" }}>{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <label style={labelStyle}>{t("name")}</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          minLength={2}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>{t("email")}</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>{t("subject")}</label>
        <input
          type="text"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          required
          minLength={2}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>{t("message")}</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          minLength={10}
          rows={6}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.875rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
          fontWeight: 600,
          fontSize: "1rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "..." : t("send")}
      </button>
    </form>
  );
}
